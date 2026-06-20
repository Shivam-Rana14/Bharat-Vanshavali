import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb/connection'
import Payment from '@/lib/mongodb/models/Payment'
import { getAuthenticatedUser } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await connectDB()

    const authUser = getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params

    // Find the most recent successful payment for this user
    const payment = await Payment.findOne({ userId, status: 'paid' })
      .populate('paidByUserId', 'fullName loginId')
      .sort({ paidAt: -1 })
      .lean()

    if (!payment) {
      // Check if there's a pending order
      const pendingPayment = await Payment.findOne({ userId, status: 'created' }).lean()
      return NextResponse.json({
        success: true,
        data: {
          paymentStatus: 'pending',
          hasPendingOrder: !!pendingPayment
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentStatus: 'paid',
        payment: {
          transactionId: (payment as any).razorpayPaymentId,
          orderId: (payment as any).razorpayOrderId,
          amount: (payment as any).amountInRupees,
          memberType: (payment as any).memberType,
          paidAt: (payment as any).paidAt,
          paidByName: (payment as any).paidByUserId?.fullName || 'N/A',
          paidByLoginId: (payment as any).paidByUserId?.loginId || 'N/A',
          familyCode: (payment as any).familyCode,
          currency: (payment as any).currency || 'INR'
        }
      }
    })
  } catch (error) {
    console.error('[PAYMENT STATUS] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get payment status' },
      { status: 500 }
    )
  }
}

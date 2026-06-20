import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb/connection'
import User from '@/lib/mongodb/models/User'
import Payment from '@/lib/mongodb/models/Payment'
import { getAuthenticatedUser } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const authUser = getAuthenticatedUser(request)
    if (!authUser || authUser.type !== 'citizen') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, userId } = body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment fields' },
        { status: 400 }
      )
    }

    // Verify Razorpay signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET!
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expectedSignature !== razorpaySignature) {
      // Mark payment as failed
      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { status: 'failed' }
      )
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature. Payment verification failed.' },
        { status: 400 }
      )
    }

    // Find the payment record
    const paymentRecord = await Payment.findOne({ razorpayOrderId })
    if (!paymentRecord) {
      return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 })
    }

    // Ensure the payment is for the correct user
    if (paymentRecord.userId.toString() !== userId) {
      return NextResponse.json({ success: false, error: 'Payment user mismatch' }, { status: 400 })
    }

    // Update payment record
    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        razorpayPaymentId,
        razorpaySignature,
        status: 'paid',
        paidAt: new Date()
      }
    )

    // Update user paymentStatus
    await User.findByIdAndUpdate(userId, { paymentStatus: 'paid' })

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully'
    })
  } catch (error) {
    console.error('[VERIFY PAYMENT] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

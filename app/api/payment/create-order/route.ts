import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import connectDB from '@/lib/mongodb/connection'
import User from '@/lib/mongodb/models/User'
import Payment from '@/lib/mongodb/models/Payment'
import FamilyTree from '@/lib/mongodb/models/FamilyTree'
import { getAuthenticatedUser } from '@/lib/api-utils'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
})

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Verify the logged-in user
    const authUser = getAuthenticatedUser(request)
    if (!authUser || authUser.type !== 'citizen') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body // The member to pay for

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    // Get the logged-in user (the root member who's paying)
    const payingUser = await User.findById(authUser.id)
    if (!payingUser) {
      return NextResponse.json({ success: false, error: 'Paying user not found' }, { status: 404 })
    }

    // Get the target member
    const targetMember = await User.findById(userId)
    if (!targetMember) {
      return NextResponse.json({ success: false, error: 'Target member not found' }, { status: 404 })
    }

    // Check if already paid
    if (targetMember.paymentStatus === 'paid') {
      return NextResponse.json({ success: false, error: 'Payment already done for this member' }, { status: 400 })
    }

    // Verify paying user and target are in the same family
    if (!payingUser.familyCode || payingUser.familyCode !== targetMember.familyCode) {
      return NextResponse.json({ success: false, error: 'You must be in the same family as the member' }, { status: 403 })
    }

    // Verify paying user is root member
    const familyTree = await FamilyTree.findOne({ familyCode: payingUser.familyCode })
    if (!familyTree) {
      return NextResponse.json({ success: false, error: 'Family tree not found' }, { status: 404 })
    }

    const isRootMember = familyTree.rootUserId.toString() === payingUser._id.toString()
    if (!isRootMember) {
      return NextResponse.json({ success: false, error: 'Only the root member can make payments' }, { status: 403 })
    }

    // Determine if the target is the root member or a regular member
    const isTargetRoot = familyTree.rootUserId.toString() === targetMember._id.toString()
    const memberType: 'root' | 'member' = isTargetRoot ? 'root' : 'member'
    const amountInRupees = isTargetRoot ? 100 : 10
    const amountInPaise = amountInRupees * 100

    // Check for existing pending order for this user (so we don't create duplicates)
    const existingPendingPayment = await Payment.findOne({
      userId: targetMember._id,
      status: 'created'
    })

    let orderId: string
    let existingOrder = false

    if (existingPendingPayment) {
      orderId = existingPendingPayment.razorpayOrderId
      existingOrder = true
    } else {
      // Create a new Razorpay order
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `bv_${targetMember.loginId}_${Date.now()}`,
        notes: {
          memberName: targetMember.fullName,
          memberLoginId: targetMember.loginId,
          memberType,
          familyCode: payingUser.familyCode,
          paidByName: payingUser.fullName,
          paidByLoginId: payingUser.loginId
        }
      })

      orderId = order.id

      // Save the order to DB
      await Payment.create({
        userId: targetMember._id,
        paidByUserId: payingUser._id,
        familyCode: payingUser.familyCode,
        razorpayOrderId: orderId,
        amount: amountInPaise,
        amountInRupees,
        currency: 'INR',
        status: 'created',
        memberType
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        amount: amountInPaise,
        amountInRupees,
        currency: 'INR',
        memberName: targetMember.fullName,
        memberLoginId: targetMember.loginId,
        memberType,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        existingOrder
      }
    })
  } catch (error) {
    console.error('[CREATE ORDER] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}

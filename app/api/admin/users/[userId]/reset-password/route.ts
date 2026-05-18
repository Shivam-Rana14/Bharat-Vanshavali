import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-utils'
import connectDB from '@/lib/mongodb/connection'
import { User } from '@/lib/mongodb/models'
import bcrypt from 'bcryptjs'
import { databaseService } from '@/lib/mongodb/database'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    requireAdmin(request)
    await connectDB()

    const { newPassword } = await request.json()

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const user = await User.findById(params.userId)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Admins cannot reset other admin passwords for security
    if (user.userType === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot reset password for admin accounts via this interface' },
        { status: 403 }
      )
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await User.findByIdAndUpdate(params.userId, { $set: { password: hashedPassword } })

    // Notify the user their password was reset
    databaseService.createNotification({
      userId: params.userId,
      type: 'system',
      title: '🔒 Password Reset by Admin',
      message: 'An administrator has reset your password. If this was not expected, please contact support immediately.',
      priority: 'high'
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${user.fullName}`
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}

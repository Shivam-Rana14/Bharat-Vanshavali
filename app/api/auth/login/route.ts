import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { authService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { loginId, password, userType } = await request.json()

    if (!loginId || !password || !userType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const user = await databaseService.signIn(loginId, password)

    // Check admin permissions if admin login
    if (userType === 'admin' && user.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Generate JWT token
    const token = authService.generateToken({
      id: user._id.toString(),
      email: user.email,
      type: user.userType,
      familyCode: user.familyCode
    })

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.fullName,
        email: user.email,
        type: user.userType,
        familyCode: user.familyCode,
        loginId: user.loginId,
        phone: user.phone,
        avatar: user.avatarUrl
      },
      message: `Welcome back${user.userType === 'admin' ? ', Admin' : ''}!`
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Login failed' },
      { status: 401 }
    )
  }
}
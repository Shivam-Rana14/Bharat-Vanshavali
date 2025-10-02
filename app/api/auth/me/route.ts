import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth'
import { databaseService } from '@/lib/mongodb/database'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      const response = NextResponse.json({ success: false, error: 'No token found' }, { status: 401 })
      // Prevent caching
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }

    // Verify token
    const payload = authService.verifyToken(token)
    
    // Get user details from database
    const user = await databaseService.getUserById(payload.id)
    
    if (!user) {
      const response = NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
      // Prevent caching
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        type: user.userType,
        userType: user.userType,
        familyCode: user.familyCode,
        phone: user.phone,
        avatar: user.avatarData || user.avatarUrl,
        loginId: user.loginId,
        verificationStatus: user.verificationStatus,
        dateOfBirth: user.dateOfBirth,
        placeOfBirth: user.placeOfBirth,
        gender: user.gender,
        fatherName: user.fatherName,
        motherName: user.motherName,
        grandfatherName: user.grandfatherName,
        nativePlace: user.nativePlace,
        caste: user.caste,
        createdAt: user.createdAt
      }
    })
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Auth check error:', error)
    const response = NextResponse.json(
      { success: false, error: 'Invalid token' },
      { status: 401 }
    )
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }
}

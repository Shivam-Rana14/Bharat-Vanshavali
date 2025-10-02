import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('API /auth/logout: Logout called')
    console.log('API /auth/logout: Cookies before clear:', request.cookies.getAll())
    
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear the auth cookie with multiple approaches to ensure it's cleared
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      expires: new Date(0)
    }

    // Clear with explicit path
    response.cookies.set('auth-token', '', { ...cookieOptions, path: '/' })
    
    // Clear without path (defaults to current path)
    response.cookies.set('auth-token', '', cookieOptions)
    
    // Also try deleting the cookie
    response.cookies.delete('auth-token')
    response.cookies.delete({ name: 'auth-token', path: '/' })
    
    console.log('API /auth/logout: Cookie cleared, returning response')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}

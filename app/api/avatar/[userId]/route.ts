import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth, canAccessUserData } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = requireAuth(request)
    const { userId } = params
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user can access this avatar
    if (!canAccessUserData(user, userId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. You can only access your own avatar.' },
        { status: 403 }
      )
    }

    const userData = await databaseService.getUserById(userId)
    
    if (!userData || !userData.avatarData) {
      return NextResponse.json(
        { success: false, error: 'Avatar not found' },
        { status: 404 }
      )
    }

    // Extract the base64 data and content type
    const [metadata, base64Data] = userData.avatarData.split(',')
    const contentType = metadata.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error serving avatar:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to serve avatar' },
      { status: 500 }
    )
  }
}

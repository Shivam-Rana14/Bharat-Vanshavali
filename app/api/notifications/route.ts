import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const notifications = await databaseService.getNotifications(user.id, unreadOnly)
    return NextResponse.json({ success: true, notifications: notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { notificationId, markAllAsRead } = await request.json()

    if (markAllAsRead) {
      await databaseService.markAllNotificationsAsRead(user.id)
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    } else if (notificationId) {
      await databaseService.markNotificationAsRead(notificationId, user.id)
      return NextResponse.json({ success: true, message: 'Notification marked as read' })
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    )
  }}
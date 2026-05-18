"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, CheckCircle, Clock, Shield, User, Users, Settings } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface Notification {
  _id: string        // MongoDB returns _id
  type: string
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  read: boolean
  createdAt: string  // from mongoose timestamps (camelCase)
  data?: any
}

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onUnreadCountChange?: (count: number) => void
}

export function NotificationsModal({
  isOpen,
  onClose,
  userId,
  onUnreadCountChange
}: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications()
    }
  }, [isOpen, userId])

  // Propagate unread count to parent (for badge in navbar)
  useEffect(() => {
    onUnreadCountChange?.(notifications.filter(n => !n.read).length)
  }, [notifications])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications', { cache: 'no-store' })
      const result = await response.json()

      if (result.success) {
        setNotifications(result.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Mark single notification as read → delete from DB, remove from UI
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        // Remove from local state (deleted from DB)
        setNotifications(prev => prev.filter(n => n._id !== notificationId))
      } else {
        throw new Error('Failed')
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not mark notification as read", variant: "destructive" })
    }
  }

  // Mark all as read → delete all from DB, clear UI
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),  // fixed key name
      })

      if (response.ok) {
        setNotifications([])  // clear all from UI
        toast({ title: "All cleared", description: "All notifications marked as read", variant: "success" })
      } else {
        throw new Error('Failed')
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not clear notifications", variant: "destructive" })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'verification':  return <Shield className="w-5 h-5 text-blue-500" />
      case 'member_added':  return <Users className="w-5 h-5 text-green-500" />
      case 'family_update': return <User className="w-5 h-5 text-purple-500" />
      case 'system':        return <Settings className="w-5 h-5 text-orange-500" />
      default:              return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':   return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:       return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Just now'

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Just now'  // guard against Invalid Date

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1)   return 'Just now'
    if (diffMins < 60)  return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7)   return `${diffDays} days ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Notifications${notifications.length > 0 ? ` (${notifications.length})` : ''}`}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {notifications.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          </div>
        )}

        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">You're all caught up!</p>
              <p className="text-sm mt-1">No new notifications</p>
            </div>
          ) : (
            <div className="space-y-3 pr-1">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="p-4 rounded-lg border bg-white border-orange-200 shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-0.5 shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${getPriorityBadgeClass(notification.priority)}`}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{notification.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(notification.createdAt)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification._id)}
                            className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-7 px-2"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Mark as read
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
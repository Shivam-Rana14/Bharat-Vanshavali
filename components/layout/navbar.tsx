"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TreePine, Menu, X, User, Shield, LogOut, Settings, Bell, Users, Plus } from 'lucide-react'
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { NotificationsModal } from "@/components/ui/notifications-modal"

interface NavigationItem {
  name: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationsModal, setNotificationsModal] = useState(false)
  const { user, logout } = useAuth()
  const { toast } = useToast()


  // unreadCount = total notifications count (since all notifications in DB are unread by design)
  const unreadCount = notifications.length

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fetch real notifications count for badge
  const fetchNotificationsBadge = async () => {
    if (!user) return
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotifications(data.notifications || [])
        }
      }
    } catch (error) {
      // Silently fail — badge just won't show
    }
  }

  useEffect(() => {
    fetchNotificationsBadge()
  }, [user])

  const handleLogout = () => {
    logout()
  }

  const handleNotificationClick = () => {
    setNotificationsModal(true)
  }

  // When modal closes, re-fetch count so badge stays accurate
  const handleNotificationsModalClose = () => {
    setNotificationsModal(false)
    fetchNotificationsBadge()
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.filter(n => n._id !== id))
  }

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n._id !== id))
  }

  const handleMarkAllAsRead = () => {
    setNotifications([])
  }

  const getNavigationItems = (): NavigationItem[] => {
    if (!user) {
      return [
        { name: "Features", href: "#features" },
        { name: "Mission", href: "#mission" },
        { name: "Community", href: "#community" }
      ]
    }

    if (user.type === 'admin') {
      return [
        { name: "Dashboard", href: "/admin/dashboard", icon: Shield },
        { name: "Pending Verifications", href: "/admin/dashboard?tab=pending", icon: Bell },
        { name: "Verified Citizens", href: "/admin/dashboard?tab=verified", icon: Users },
        { name: "Settings", href: "/admin/settings", icon: Settings }
      ]
    }

    // Citizen navigation
    return [
      { name: "Dashboard", href: "/citizen/dashboard", icon: User },
      { name: "Family Tree", href: "/citizen/family-tree", icon: TreePine },
      { name: "Add Member", href: "/citizen/add-member", icon: Plus },
      { name: "Profile", href: "/citizen/profile", icon: Settings }
    ]
  }

  const navigationItems = getNavigationItems()

  return (
    <>
      <motion.header 
        className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-2 md:space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="flex items-center space-x-2 md:space-x-3">
              <motion.div 
                className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
              >
                <TreePine className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900 bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                  भारत वंशावली
                </h1>
                <p className="text-xs text-gray-600 hidden sm:block">Bharat Vanshavali Collective</p>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <Link 
                  href={item.href} 
                  className="text-gray-700 hover:text-orange-600 transition-all duration-300 relative group font-medium flex items-center space-x-2"
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span>{item.name}</span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-green-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* User Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleNotificationClick}
                    variant="ghost" 
                    size="sm" 
                    className="relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </motion.div>

                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600 flex items-center">
                      {user.type === 'admin' ? (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 mr-1" />
                          Citizen
                        </>
                      )}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    {user.type === 'admin' ? (
                      <Shield className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>

                {/* Logout */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button onClick={handleLogout} variant="outline" size="sm" className="flex items-center space-x-2">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </Button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Link href="/login" className="text-gray-700 hover:text-orange-600 transition-colors duration-300 font-medium">
                    Login
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/register">
                    <Button className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300">
                      Join Now
                    </Button>
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile Menu Button — 44px touch target */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Mobile Notification Bell (logged-in users only) */}
            {user && (
              <button
                className="relative p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-target flex items-center justify-center"
                onClick={handleNotificationClick}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                  <Badge className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            )}
            <motion.button
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-target flex items-center justify-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileTap={{ scale: 0.9 }}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-white border-t"
            >
              <div className="container mx-auto px-4 py-4">
                <nav className="space-y-1">
                  {navigationItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link 
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-3 text-gray-700 hover:text-orange-600 active:bg-orange-50 transition-colors duration-200 py-3 px-3 rounded-lg touch-target"
                      >
                        {item.icon && <item.icon className="w-5 h-5" />}
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Mobile: Auth actions */}
                {user ? (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-sm text-gray-600">
                          {user.type === 'admin' ? 'Admin' : 'Citizen'}
                        </p>
                      </div>
                      <Button onClick={handleLogout} variant="outline" size="sm" className="touch-target shrink-0">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full touch-target">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 touch-target">
                        Join Now
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Notifications Modal */}
      {user && (
        <NotificationsModal
          isOpen={notificationsModal}
          onClose={handleNotificationsModalClose}
          userId={user.id}
          onUnreadCountChange={(count) => {
            // Sync local badge count when modal updates it
            if (count === 0) setNotifications([])
          }}
        />
      )}
      {/* Mobile Bottom Navigation (Logged-in users only) */}
      {user && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around px-2 py-2">
            {navigationItems.map((item) => {
              const Icon = item.icon || User;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center justify-center space-y-1 w-16 touch-target text-gray-500 hover:text-orange-600 active:text-orange-600 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium truncate w-full text-center px-1">
                    {item.name === 'Pending Verifications' ? 'Pending' : 
                     item.name === 'Verified Citizens' ? 'Verified' : 
                     item.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Global spacer to prevent content from hiding behind the bottom nav on mobile */}
      {user && (
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 1023px) {
            body {
              padding-bottom: calc(4rem + env(safe-area-inset-bottom));
            }
          }
        `}} />
      )}
    </>
  )
}

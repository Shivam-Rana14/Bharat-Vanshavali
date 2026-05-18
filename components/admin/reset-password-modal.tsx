"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { XCircle, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface ResetPasswordModalProps {
  user: { _id: string; fullName: string; email?: string; loginId: string }
  onClose: () => void
}

export function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
  const { toast } = useToast()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordStrength = (pwd: string) => {
    if (pwd.length === 0) return null
    if (pwd.length < 8) return { label: 'Too short', color: 'text-red-500', bg: 'bg-red-200', width: '25%' }
    const checks = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pwd)).length
    if (checks <= 1) return { label: 'Weak', color: 'text-orange-500', bg: 'bg-orange-400', width: '40%' }
    if (checks === 2) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-400', width: '65%' }
    if (checks === 3) return { label: 'Strong', color: 'text-blue-600', bg: 'bg-blue-400', width: '80%' }
    return { label: 'Very Strong', color: 'text-green-600', bg: 'bg-green-500', width: '100%' }
  }

  const strength = passwordStrength(newPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user._id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Password Reset',
          description: `Password reset successfully for ${user.fullName}`,
        })
        onClose()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset password',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="pb-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-t-xl border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Reset Password</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">{user.fullName} · {user.loginId}</p>
              </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" className="h-8 w-8 p-0">
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Security notice */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-sm text-amber-800">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <span>This action is logged. The user will need to use the new password on their next login.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {strength && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.bg}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${strength.color}`}>{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`pr-10 ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-400 focus-visible:ring-red-400'
                      : confirmPassword && confirmPassword === newPassword
                      ? 'border-green-400 focus-visible:ring-green-400'
                      : ''
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
              {confirmPassword && confirmPassword === newPassword && (
                <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

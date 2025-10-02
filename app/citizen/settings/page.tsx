"use client"

import { useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useAuth } from '@/components/providers/auth-provider'
import { useToast } from '@/hooks/use-toast'

export default function CitizenSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const leaveFamily = async () => {
    if (!confirm('Are you sure you want to leave your family tree?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/family-members/leave', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Left family', variant: 'success' })
        window.location.href = '/login'
      } else {
        throw new Error(data.error)
      }
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-6 bg-orange-50">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-700">Leaving your family will remove you from its tree. This action cannot be undone.</p>
            <Button variant="destructive" onClick={leaveFamily} disabled={loading || !user?.familyCode}>
              {loading ? 'Leaving...' : 'Leave Family'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

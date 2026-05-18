"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface Member {
  _id: string
  relationship: string
  userId: {
    email: string
    loginId: string
    fullName: string
    verificationStatus: 'pending' | 'verified' | 'rejected'
  }
}

export default function FamilyMembersPage({ params }: { params: { familyCode: string } }) {
  const familyCode = params.familyCode
  const [status, setStatus] = useState<'pending' | 'verified' | 'rejected'>('pending')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchMembers()
  }, [status])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/family-members?familyCode=${familyCode}&status=${status}`)
      const data = await res.json()
      if (data.success) setMembers(data.data)
    } catch (e) {
      console.error('Failed', e)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (memberId: string, newStatus: 'verified' | 'rejected') => {
    try {
      const res = await fetch('/api/admin/member-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Status updated', variant: 'success' })
        fetchMembers()
      }
    } catch (e) {
      toast({ title: 'Update failed', variant: 'destructive' })
    }
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Family {familyCode} Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={status} onValueChange={(v) => setStatus(v as any)}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            {(['pending', 'verified', 'rejected'] as const).map((s) => (
              <TabsContent key={s} value={s} className="pt-4">
                {loading ? 'Loading...' : (
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Name</TableHead><TableHead>Relationship</TableHead><TableHead>Email</TableHead><TableHead></TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map(m => (
                        <TableRow key={m._id}>
                          <TableCell>{m.userId?.fullName || 'Unknown'}</TableCell>
                          <TableCell>{m.relationship}</TableCell>
                          <TableCell>{m.userId?.email}</TableCell>
                          <TableCell>
                            {s === 'pending' && (
                              <>
                                <Button size="sm" onClick={() => updateStatus(m._id, 'verified')}>Verify</Button>
                                <Button variant="outline" size="sm" className="ml-2" onClick={() => updateStatus(m._id, 'rejected')}>Reject</Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

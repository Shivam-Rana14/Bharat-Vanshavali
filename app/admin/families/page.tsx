"use client"

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Family {
  _id: string
  name: string
  familyCode: string
  memberCount: number
}

export default function AdminFamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFamilies()
  }, [])

  const fetchFamilies = async () => {
    try {
      const res = await fetch('/api/admin/families')
      const data = await res.json()
      if (data.success) setFamilies(data.data)
    } catch (e) {
      console.error('Failed to fetch families', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Family Trees</CardTitle>
          <CardDescription>All registered family codes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Family Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {families.map((f) => (
                  <TableRow key={f._id}>
                    <TableCell>{f.familyCode}</TableCell>
                    <TableCell>{f.name}</TableCell>
                    <TableCell>{f.memberCount}</TableCell>
                    <TableCell>
                      <Link href={`/admin/families/${f.familyCode}`}>
                        <Button size="sm">Manage Members</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

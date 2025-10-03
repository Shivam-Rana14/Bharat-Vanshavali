"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { TreePine, Users, Plus, Share2, User, Copy, CheckCircle, Clock } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"

export default function CitizenDashboard() {
  const [joinCode, setJoinCode] = useState("")
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  // State for family members data (declare early to keep hook order stable)
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  
  // Fetch family members from API (using new node-based system)
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      if (!user?.familyCode) return
      
      try {
        setLoadingMembers(true)
        const response = await fetch(`/api/family-tree/nodes?familyCode=${user.familyCode}`)
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.success) {
            // Transform nodes to match the expected format
            const members = data.nodes.map((node: any) => ({
              id: node.id,
              name: node.data.user?.fullName || 'Unknown',
              relation: node.data.user?.loginId === user.loginId ? 'Self' : 'Family Member',
              loginId: node.data.user?.loginId || 'N/A',
              status: node.data.user?.verificationStatus || 'pending', // Use actual verification status
              dateOfBirth: node.data.user?.dateOfBirth,
              isRoot: node.data.user?._id === data.familyTree.rootUserId
            }))
            setFamilyMembers(members)
          }
        }
      } catch (error) {
        console.error('Failed to fetch family members:', error)
      } finally {
        setLoadingMembers(false)
      }
    }

    fetchFamilyMembers()
  }, [user])

  // Auto-refresh dashboard every 60 seconds to show newly joined members
  useEffect(() => {
    if (!user?.familyCode) return

    const interval = setInterval(() => {
      const fetchFamilyMembers = async () => {
        if (!user?.familyCode) return
        
        try {
          const response = await fetch(`/api/family-tree/nodes?familyCode=${user.familyCode}`)
          
          if (response.ok) {
            const data = await response.json()
            
            if (data.success) {
              const members = data.nodes.map((node: any) => ({
                id: node.id,
                name: node.data.user?.fullName || 'Unknown',
                relation: node.data.user?.loginId === user.loginId ? 'Self' : 'Family Member',
                loginId: node.data.user?.loginId || 'N/A',
                status: node.data.user?.verificationStatus || 'pending',
                dateOfBirth: node.data.user?.dateOfBirth,
                isRoot: node.data.user?._id === data.familyTree.rootUserId
              }))
              setFamilyMembers(members)
            }
          }
        } catch (error) {
          console.error('Auto-refresh failed:', error)
        }
      }
      
      fetchFamilyMembers()
    }, 60000) // Refresh every 60 seconds

    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (isLoading) return
    
    if (!user) {
      console.log("No user found, redirecting to login")
      router.push("/login")
    } else if (user.type !== "citizen") {
      console.log("User is not a citizen, redirecting to login")
      router.push("/login")
    } else {
      console.log("User authenticated:", user)
    }
  }, [user, router, isLoading])

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing if redirecting
  if (!user || user.type !== "citizen") {
    return null
  }


  const copyFamilyCode = () => {
    if (user?.familyCode) {
      navigator.clipboard.writeText(user.familyCode)
      toast({
        title: "Family code copied!",
        description: "Family code has been copied to clipboard.",
        variant: "default"
      })
    }
  }

  const handleJoinFamily = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Invalid family code",
        description: "Please enter a valid family code.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/family-members/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyCode: joinCode.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast({
            title: "Family joined successfully!",
            description: `You have joined the family with code: ${joinCode}`,
            variant: "default"
          })
          setJoinCode("")
          // Refresh family members using new node-based API
          if (user?.familyCode) {
            const response = await fetch(`/api/family-tree/nodes?familyCode=${user.familyCode}`)
            if (response.ok) {
              const data = await response.json()
              if (data.success) {
                const members = data.nodes.map((node: any) => ({
                  id: node.id,
                  name: node.data.user?.fullName || 'Unknown',
                  relation: node.data.user?.loginId === user.loginId ? 'Self' : 'Family Member',
                  loginId: node.data.user?.loginId || 'N/A',
                  status: node.data.user?.verificationStatus || 'pending', // Use actual verification status
                  dateOfBirth: node.data.user?.dateOfBirth,
                  isRoot: node.data.user?._id === data.familyTree.rootUserId
                }))
                setFamilyMembers(members)
              }
            }
          }
        }
      } else {
        toast({
          title: "Failed to join family",
          description: "Family code not found or invalid.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join family. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        {/* Header Section */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || 'User'}</h1>
                  <p className="text-gray-600">ID: {user?.id || 'Loading...'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Family Members</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{familyMembers.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Members</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {familyMembers.filter(m => m.status === 'verified').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {familyMembers.filter(m => m.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Family Code Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="w-5 h-5" />
                <span>Family Tree Management</span>
              </CardTitle>
              <CardDescription>
                Share your family code with relatives to join your family tree
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Your Family Code</h4>
                  <div className="flex items-center space-x-2">
                    <Input value={user?.familyCode || 'Loading...'} readOnly className="font-mono" />
                    <Button onClick={copyFamilyCode} variant="outline" size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Share this code with family members to join your tree
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Join Another Family</h4>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Enter family code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                    />
                    <Button onClick={handleJoinFamily} size="sm">
                      Join
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Enter a family code to merge with another family tree
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Link href="/citizen/family-tree">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <TreePine className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <CardTitle>View Family Tree</CardTitle>
                  <CardDescription>
                    View and manage your complete family tree
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            
            <Link href="/citizen/add-member">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <Plus className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                  <CardTitle>Add Family Member</CardTitle>
                  <CardDescription>
                    Add new members to your family tree
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Family Members List */}
          <Card>
            <CardHeader>
              <CardTitle>Family Members</CardTitle>
              <CardDescription>
                Current members in your family tree
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingMembers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading family members...</p>
                  </div>
                ) : familyMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No family members found. Add your first family member to get started.</p>
                  </div>
                ) : (
                  familyMembers.map((member, index) => (
                  <div key={member.id || `member-${index}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{member.name}</h4>
                          <p className="text-sm text-gray-600">{member.relation}</p>
                          <p className="text-xs text-gray-500">ID: {member.loginId}</p>
                          {member.dateOfBirth && (
                            <p className="text-xs text-gray-500">DOB: {member.dateOfBirth}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={member.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                        {member.status === 'verified' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

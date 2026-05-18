"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TreePine, Users, Plus, Share2, User, Copy, CheckCircle, Clock, Edit, CreditCard, Zap } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { PaymentModal } from "@/components/payment/PaymentModal"

export default function CitizenDashboard() {
  const [joinCode, setJoinCode] = useState("")
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  // State for family members data (declare early to keep hook order stable)
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [isRootMember, setIsRootMember] = useState(false)
  const [rootUserId, setRootUserId] = useState<string | null>(null)

  // Join Family State
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [selectedRelationship, setSelectedRelationship] = useState("")

  // Edit Member State
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [editFormData, setEditFormData] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)

  // Payment State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentMember, setPaymentMember] = useState<any>(null)

  const handleVerifyCode = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Invalid code",
        description: "Please enter a family code",
        variant: "destructive"
      })
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch(`/api/family-tree/validate-code?code=${joinCode.trim()}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setValidationResult(data)
        toast({
          title: "Family Found",
          description: `Found ${data.familyName} managed by ${data.rootMemberName}`,
        })
      } else {
        toast({
          title: "Invalid Code",
          description: data.error || "Family code not found",
          variant: "destructive"
        })
        setValidationResult(null)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate code",
        variant: "destructive"
      })
    } finally {
      setIsValidating(false)
    }
  }

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
              userId: node.data.user?._id,
              name: node.data.user?.fullName || 'Unknown',
              relation: node.data.user?.loginId === (user as any).loginId ? 'Self' : 'Family Member',
              loginId: node.data.user?.loginId || 'N/A',
              status: node.data.user?.verificationStatus || 'pending',
              paymentStatus: node.data.user?.paymentStatus || 'pending',
              dateOfBirth: node.data.user?.dateOfBirth,
              isRoot: node.data.user?._id === data.familyTree.rootUserId
            }))
            setFamilyMembers(members)
            setRootUserId(data.familyTree.rootUserId)
            // Check if current user is root member
            setIsRootMember(user.id === data.familyTree.rootUserId)
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
                userId: node.data.user?._id,
                name: node.data.user?.fullName || 'Unknown',
                relation: node.data.user?.loginId === (user as any).loginId ? 'Self' : 'Family Member',
                loginId: node.data.user?.loginId || 'N/A',
                status: node.data.user?.verificationStatus || 'pending',
                paymentStatus: node.data.user?.paymentStatus || 'pending',
                dateOfBirth: node.data.user?.dateOfBirth,
                isRoot: node.data.user?._id === data.familyTree.rootUserId
              }))
              setFamilyMembers(members)
              // Update root member status
              setIsRootMember(user.id === data.familyTree.rootUserId)
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
        body: JSON.stringify({
          familyCode: joinCode.trim(),
          relationship: selectedRelationship
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.success) {
          toast({
            title: "Family joined successfully!",
            description: `You have joined the family with code: ${joinCode}`,
            variant: "default"
          })
          setJoinCode("")
          setValidationResult(null)
          setSelectedRelationship("")
          // Refresh family members using new node-based API
          if (user?.familyCode) {
            const response = await fetch(`/api/family-tree/nodes?familyCode=${user.familyCode}`)
            if (response.ok) {
              const data = await response.json()
              if (data.success) {
                const members = data.nodes.map((node: any) => ({
                  id: node.id,
                  userId: node.data.user?._id,
                  name: node.data.user?.fullName || 'Unknown',
                  relation: node.data.user?.loginId === (user as any).loginId ? 'Self' : 'Family Member',
                  loginId: node.data.user?.loginId || 'N/A',
                  status: node.data.user?.verificationStatus || 'pending',
                  dateOfBirth: node.data.user?.dateOfBirth,
                  isRoot: node.data.user?._id === data.familyTree.rootUserId
                }))
                setFamilyMembers(members)
                // Update root member status
                setIsRootMember(user.id === data.familyTree.rootUserId)
              }
            }
          }
        }
      } else {
        toast({
          title: "Failed to join family",
          description: data.error || "Family code not found or invalid.",
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

  const handleEditMember = async (member: any) => {
    try {
      // Fetch full member details
      const response = await fetch(`/api/family-members/${member.userId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setEditingMember(member)
        setEditFormData({
          fullName: data.data.fullName || '',
          dateOfBirth: data.data.dateOfBirth ? new Date(data.data.dateOfBirth).toISOString().split('T')[0] : '',
          placeOfBirth: data.data.placeOfBirth || '',
          gender: data.data.gender || '',
          nativePlace: data.data.nativePlace || '',
          caste: data.data.caste || '',
          occupation: data.data.occupation || '',
          bio: data.data.bio || '',
          fatherName: data.data.fatherName || '',
          motherName: data.data.motherName || '',
          grandfatherName: data.data.grandfatherName || '',
          spouseName: data.data.spouseName || '',
          aadhaarNumber: data.data.aadhaarNumber || '',
          panNumber: data.data.panNumber || ''
        })
        setEditDialogOpen(true)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch member details",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load member details",
        variant: "destructive"
      })
    }
  }

  const handleSaveEdit = async () => {
    if (!editingMember) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/family-members/${editingMember.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Member details updated successfully",
          variant: "default"
        })
        setEditDialogOpen(false)
        setEditingMember(null)
        setEditFormData({})

        // Refresh family members list
        const refreshResponse = await fetch(`/api/family-tree/nodes?familyCode=${user.familyCode}`)
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          if (refreshData.success) {
            const members = refreshData.nodes.map((node: any) => ({
              id: node.id,
              userId: node.data.user?._id,
              name: node.data.user?.fullName || 'Unknown',
              relation: node.data.user?.loginId === (user as any).loginId ? 'Self' : 'Family Member',
              loginId: node.data.user?.loginId || 'N/A',
              status: node.data.user?.verificationStatus || 'pending',
              dateOfBirth: node.data.user?.dateOfBirth,
              isRoot: node.data.user?._id === refreshData.familyTree.rootUserId
            }))
            setFamilyMembers(members)
          }
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update member details",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
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

                  {!validationResult ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Enter family code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                      />
                      <Button onClick={handleVerifyCode} size="sm" disabled={isValidating}>
                        {isValidating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 border p-3 rounded-md bg-gray-50">
                      <div className="text-sm">
                        <p className="font-medium text-green-700">Family Found!</p>
                        <p><strong>Family:</strong> {validationResult.familyName}</p>
                        <p><strong>Root Member:</strong> {validationResult.rootMemberName}</p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Relation to {validationResult.rootMemberName}:
                        </label>
                        <select
                          className="w-full text-sm border rounded p-2 bg-white"
                          value={selectedRelationship}
                          onChange={(e) => setSelectedRelationship(e.target.value)}
                        >
                          <option value="">Select Relationship</option>
                          <option value="father">Father</option>
                          <option value="mother">Mother</option>
                          <option value="brother">Brother</option>
                          <option value="sister">Sister</option>
                          <option value="spouse">Spouse</option>
                          <option value="son">Son</option>
                          <option value="daughter">Daughter</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={handleJoinFamily}
                          size="sm"
                          className="w-full"
                          disabled={!selectedRelationship}
                        >
                          Confirm Join
                        </Button>
                        <Button
                          onClick={() => {
                            setValidationResult(null)
                            setJoinCode("")
                            setSelectedRelationship("")
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

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
                      <div className="flex items-center space-x-2">
                        {/* Verification / Payment Status Badge */}
                        {member.status === 'verified' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : member.paymentStatus === 'paid' ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <CreditCard className="w-3 h-3 mr-1" />
                            In Progress
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}

                        {/* Activate button — root only, only for unpaid & unverified members */}
                        {isRootMember && member.status !== 'verified' && member.paymentStatus !== 'paid' && (
                          <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={() => {
                              setPaymentMember(member)
                              setPaymentModalOpen(true)
                            }}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Activate
                          </Button>
                        )}

                        {/* Edit button — root only */}
                        {isRootMember && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Member Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Member Details</DialogTitle>
              <DialogDescription>
                Update member information. Email, phone, and password cannot be changed here.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Basic Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={editFormData.fullName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={editFormData.dateOfBirth || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="placeOfBirth">Place of Birth</Label>
                    <Input
                      id="placeOfBirth"
                      value={editFormData.placeOfBirth || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, placeOfBirth: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={editFormData.gender || ''}
                      onValueChange={(value) => setEditFormData({ ...editFormData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nativePlace">Native Place</Label>
                    <Input
                      id="nativePlace"
                      value={editFormData.nativePlace || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, nativePlace: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caste">Caste</Label>
                    <Input
                      id="caste"
                      value={editFormData.caste || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, caste: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Family Relations */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Family Relations</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name</Label>
                    <Input
                      id="fatherName"
                      value={editFormData.fatherName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                      placeholder="Enter father's name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motherName">Mother's Name</Label>
                    <Input
                      id="motherName"
                      value={editFormData.motherName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, motherName: e.target.value })}
                      placeholder="Enter mother's name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grandfatherName">Grandfather's Name</Label>
                    <Input
                      id="grandfatherName"
                      value={editFormData.grandfatherName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, grandfatherName: e.target.value })}
                      placeholder="Enter grandfather's name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spouseName">Spouse's Name</Label>
                    <Input
                      id="spouseName"
                      value={editFormData.spouseName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, spouseName: e.target.value })}
                      placeholder="Enter spouse's name"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Additional Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={editFormData.occupation || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, occupation: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={editFormData.bio || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                    rows={3}
                    placeholder="Brief description about the person"
                  />
                </div>
              </div>

              {/* Document Numbers */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Document Numbers</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                    <Input
                      id="aadhaarNumber"
                      value={editFormData.aadhaarNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, aadhaarNumber: e.target.value })}
                      placeholder="XXXX-XXXX-XXXX"
                      maxLength={12}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input
                      id="panNumber"
                      value={editFormData.panNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, panNumber: e.target.value.toUpperCase() })}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false)
                  setEditingMember(null)
                  setEditFormData({})
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isSaving || !editFormData.fullName}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Modal */}
        {paymentModalOpen && paymentMember && (
          <PaymentModal
            open={paymentModalOpen}
            onClose={() => {
              setPaymentModalOpen(false)
              setPaymentMember(null)
            }}
            member={{
              userId: paymentMember.userId,
              name: paymentMember.name,
              loginId: paymentMember.loginId,
              isRoot: paymentMember.isRoot
            }}
            onPaymentSuccess={(paidUserId) => {
              // Update local state to show "In Progress" badge immediately
              setFamilyMembers(prev =>
                prev.map(m =>
                  m.userId === paidUserId
                    ? { ...m, paymentStatus: 'paid' }
                    : m
                )
              )
            }}
          />
        )}
      </div>
    </>
  )
}

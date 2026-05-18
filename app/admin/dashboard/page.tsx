"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, CheckCircle, XCircle, Clock, Eye, TreePine, FileText, UserCheck, Edit, Plus, KeyRound } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { useToast } from "@/hooks/use-toast"
import { FamilyMembersModal } from "@/components/admin/family-members-modal"
import { MemberFormModal } from "@/components/admin/member-form-modal"
import { ResetPasswordModal } from "@/components/admin/reset-password-modal"
import { PaymentInfoModal } from "@/components/admin/PaymentInfoModal"

function AdminDashboardContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab')
    return tab === 'verified' || tab === 'pending' || tab === 'families' ? tab : 'pending'
  })
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedFamily, setSelectedFamily] = useState<any>(null)
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null)
  const [paymentInfoUser, setPaymentInfoUser] = useState<{ id: string; name: string } | null>(null)

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: 'verify' | 'reject'
    user: any
  }>({ isOpen: false, type: 'verify', user: null })

  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const [stats, setStats] = useState({
    pendingVerifications: 0,
    verifiedCitizens: 0,
    totalFamilies: 0,
    activeUsers: 0
  })
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [verifiedUsers, setVerifiedUsers] = useState<any[]>([])
  const [families, setFamilies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Sync tab with URL param when it changes (e.g. navbar link clicked)
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'verified' || tab === 'pending' || tab === 'families') {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.type !== "admin") {
      router.push("/login")
      return
    }

    fetchData()
  }, [user, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsResponse, pendingResponse, verifiedResponse, familiesResponse] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store' }),
        fetch('/api/admin/users?status=pending', { cache: 'no-store' }),
        fetch('/api/admin/users?status=verified', { cache: 'no-store' }),
        fetch('/api/admin/families', { cache: 'no-store' })
      ])

      const statsResult = await statsResponse.json()
      const pendingResult = await pendingResponse.json()
      const verifiedResult = await verifiedResponse.json()
      const familiesResult = await familiesResponse.json()

      if (statsResult.success) {
        setStats(statsResult.data)
      }

      if (pendingResult.success) {
        setPendingUsers(Array.isArray(pendingResult.data) ? pendingResult.data : [])
      }

      if (verifiedResult.success) {
        setVerifiedUsers(Array.isArray(verifiedResult.data) ? verifiedResult.data : [])
      }

      if (familiesResult.success) {
        setFamilies(Array.isArray(familiesResult.data) ? familiesResult.data : [])
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchFamilyMembers = async (familyCode: string) => {
    try {
      const response = await fetch(`/api/admin/families/${familyCode}/members`, { cache: 'no-store' })
      const result = await response.json()

      if (result.success) {
        setFamilyMembers(result.data.members)
        setSelectedFamily({ ...selectedFamily, ...result.data.familyInfo })
      }
    } catch (error) {
      console.error('Error fetching family members:', error)
      toast({
        title: "Error",
        description: "Failed to load family members",
        variant: "destructive"
      })
    }
  }

  const handleVerifyUser = (user: any) => {
    setConfirmModal({ isOpen: true, type: 'verify', user })
  }

  const handleRejectUser = (user: any) => {
    setConfirmModal({ isOpen: true, type: 'reject', user })
  }

  const confirmAction = async () => {
    const { type, user: targetUser } = confirmModal

    try {
      const response = await fetch('/api/admin/verify-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetUser._id,
          action: type
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (type === 'verify') {
          toast({
            title: "User Verified",
            description: `${targetUser.fullName} has been verified successfully!`,
          })
        } else {
          toast({
            title: "User Rejected",
            description: `${targetUser.fullName}'s application has been rejected.`,
            variant: "destructive"
          })
        }

        await fetchData()
        if (selectedFamily) {
          await fetchFamilyMembers(selectedFamily.familyCode)
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process user verification",
        variant: "destructive"
      })
    }

    setConfirmModal({ isOpen: false, type: 'verify', user: null })
  }

  const handleFamilyClick = async (family: any) => {
    setSelectedFamily(family)
    await fetchFamilyMembers(family.familyCode)
  }

  const handleEditMember = (member: any) => {
    setSelectedMember(member)
    setShowEditModal(true)
  }

  const handleViewDetails = (user: any) => {
    setSelectedUser(user)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pendingVerifications}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Citizens</CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.verifiedCitizens}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Families</CardTitle>
                <TreePine className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalFamilies}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.activeUsers}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={(val) => {
            setActiveTab(val)
            router.replace(`/admin/dashboard?tab=${val}`, { scroll: false })
          }}>
            <TabsList className="grid w-full grid-cols-3 max-w-2xl">
              <TabsTrigger value="pending">Pending Verifications</TabsTrigger>
              <TabsTrigger value="verified">Verified Citizens</TabsTrigger>
              <TabsTrigger value="families">Families</TabsTrigger>
            </TabsList>

            {/* Pending Tab */}
            <TabsContent value="pending" className="mt-6">
              <div className="grid gap-6">
                {pendingUsers.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      No pending verifications
                    </CardContent>
                  </Card>
                ) : (
                  pendingUsers.map((user) => (
                    <Card key={user._id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{user.fullName}</CardTitle>
                            <CardDescription>Login ID: {user.loginId}</CardDescription>
                          </div>
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Father: {user.fatherName || 'N/A'}</p>
                            <p className="text-sm text-gray-600">Mother: {user.motherName || 'N/A'}</p>
                            <p className="text-sm text-gray-600">Place of Birth: {user.placeOfBirth || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Mobile: {user.phone || 'N/A'}</p>
                            <p className="text-sm text-gray-600">Email: {user.email || 'N/A'}</p>
                            <p className="text-sm text-gray-600">Family Code: {user.familyCode || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            onClick={() => handleViewDetails(user)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </Button>
                          <Button
                            onClick={() => setPaymentInfoUser({ id: user._id, name: user.fullName })}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <FileText className="w-4 h-4" />
                            <span>View Payment</span>
                          </Button>
                          <Button
                            onClick={() => handleVerifyUser(user)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 flex items-center space-x-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Verify & Activate</span>
                          </Button>
                          <Button
                            onClick={() => handleRejectUser(user)}
                            variant="destructive"
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Verified Tab */}
            <TabsContent value="verified" className="mt-6">
              <div className="grid gap-6">
                {verifiedUsers.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      No verified users yet
                    </CardContent>
                  </Card>
                ) : (
                  verifiedUsers.map((user) => (
                    <Card key={user._id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{user.fullName}</CardTitle>
                            <CardDescription>Login ID: {user.loginId}</CardDescription>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Father: {user.fatherName || 'N/A'}</p>
                            <p className="text-sm text-gray-600">Mother: {user.motherName || 'N/A'}</p>
                            <p className="text-sm text-gray-600">Place of Birth: {user.placeOfBirth || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Mobile: {user.phone || 'N/A'}</p>
                            <p className="text-sm text-gray-600">Email: {user.email || 'N/A'}</p>
                            <p className="text-sm text-gray-600">Family Code: {user.familyCode || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            onClick={() => handleViewDetails(user)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Profile</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Families Tab */}
            <TabsContent value="families" className="mt-6">
              <div className="grid gap-6">
                {families.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      No families found
                    </CardContent>
                  </Card>
                ) : (
                  families.map((family) => (
                    <Card
                      key={family.familyCode}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleFamilyClick(family)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{family.familyName}</CardTitle>
                            <CardDescription>Family Code: {family.familyCode}</CardDescription>
                          </div>
                          <TreePine className="h-6 w-6 text-blue-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Total Members</p>
                            <p className="text-lg font-semibold">{family.stats?.totalMembers || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Verified</p>
                            <p className="text-lg font-semibold text-green-600">{family.stats?.verifiedMembers || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-lg font-semibold text-orange-600">{family.stats?.pendingMembers || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Root Member</p>
                            <p className="text-sm font-medium">{family.rootUserId?.fullName || 'N/A'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* User Details Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>User Details - {selectedUser.fullName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setResetPasswordUser(selectedUser)}
                        variant="outline"
                        size="sm"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <KeyRound className="w-4 h-4 mr-1" />
                        Reset Password
                      </Button>
                      <Button
                        onClick={() => setSelectedUser(null)}
                        variant="ghost"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg mb-3">Personal Information</h4>
                      <div><strong>Login ID:</strong> {selectedUser.loginId}</div>
                      <div><strong>Full Name:</strong> {selectedUser.fullName}</div>
                      <div><strong>Email:</strong> {selectedUser.email || 'N/A'}</div>
                      <div><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</div>
                      <div><strong>Date of Birth:</strong> {selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                      <div><strong>Gender:</strong> {selectedUser.gender || 'N/A'}</div>
                      <div><strong>Place of Birth:</strong> {selectedUser.placeOfBirth || 'N/A'}</div>
                      <div><strong>Native Place:</strong> {selectedUser.nativePlace || 'N/A'}</div>
                      <div><strong>Caste:</strong> {selectedUser.caste || 'N/A'}</div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg mb-3">Family & Documents</h4>
                      <div><strong>Father Name:</strong> {selectedUser.fatherName || 'N/A'}</div>
                      <div><strong>Mother Name:</strong> {selectedUser.motherName || 'N/A'}</div>
                      <div><strong>Grandfather Name:</strong> {selectedUser.grandfatherName || 'N/A'}</div>
                      <div><strong>Spouse Name:</strong> {selectedUser.spouseName || 'N/A'}</div>
                      <div><strong>Occupation:</strong> {selectedUser.occupation || 'N/A'}</div>
                      <div><strong>Aadhaar Number:</strong> {selectedUser.aadhaarNumber || 'N/A'}</div>
                      <div><strong>PAN Number:</strong> {selectedUser.panNumber || 'N/A'}</div>
                      <div><strong>Family Code:</strong> {selectedUser.familyCode || 'N/A'}</div>
                      <div>
                        <strong>Status:</strong>{' '}
                        <Badge className={selectedUser.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                          {selectedUser.verificationStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {selectedUser.bio && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-lg mb-2">Bio</h4>
                      <p className="text-gray-700">{selectedUser.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payment Info Modal */}
          {paymentInfoUser && (
            <PaymentInfoModal
              userId={paymentInfoUser.id}
              userName={paymentInfoUser.name}
              onClose={() => setPaymentInfoUser(null)}
            />
          )}

          {/* Reset Password Modal */}
          {resetPasswordUser && (
            <ResetPasswordModal
              user={resetPasswordUser}
              onClose={() => setResetPasswordUser(null)}
            />
          )}

          {/* Family Members Modal */}
          {selectedFamily && (
            <FamilyMembersModal
              family={selectedFamily}
              members={familyMembers}
              onClose={() => {
                setSelectedFamily(null)
                setFamilyMembers([])
              }}
              onEditMember={handleEditMember}
              onViewMember={handleViewDetails}
              onVerifyMember={handleVerifyUser}
              onRejectMember={handleRejectUser}
              onAddMember={() => setShowAddMemberModal(true)}
              onRefresh={() => fetchFamilyMembers(selectedFamily.familyCode)}
            />
          )}

          {/* Edit Member Modal */}
          {showEditModal && selectedMember && (
            <MemberFormModal
              member={selectedMember}
              mode="edit"
              onClose={() => {
                setShowEditModal(false)
                setSelectedMember(null)
              }}
              onSuccess={(updatedData) => {
                // Immediately update local state for instant feedback
                if (updatedData) {
                  setFamilyMembers(prev =>
                    prev.map(m => m._id === updatedData._id ? { ...m, ...updatedData } : m)
                  )
                  // Also update pendingUsers/verifiedUsers lists
                  setPendingUsers(prev =>
                    prev.map(u => u._id === updatedData._id ? { ...u, ...updatedData } : u)
                  )
                  setVerifiedUsers(prev =>
                    prev.map(u => u._id === updatedData._id ? { ...u, ...updatedData } : u)
                  )
                }
                // Background refetch for full consistency
                fetchData()
                if (selectedFamily) fetchFamilyMembers(selectedFamily.familyCode)
              }}
            />
          )}

          {/* Add Member Modal */}
          {showAddMemberModal && selectedFamily && (
            <MemberFormModal
              familyCode={selectedFamily.familyCode}
              mode="add"
              onClose={() => setShowAddMemberModal(false)}
              onSuccess={(newMember) => {
                // Immediately add to local list for instant feedback
                if (newMember) {
                  setFamilyMembers(prev => [...prev, newMember])
                }
                // Background refetch for full consistency
                fetchData()
                if (selectedFamily) fetchFamilyMembers(selectedFamily.familyCode)
              }}
            />
          )}

          {/* Confirmation Modal */}
          <ConfirmationModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal({ isOpen: false, type: 'verify', user: null })}
            onConfirm={confirmAction}
            title={confirmModal.type === 'verify' ? 'Verify User' : 'Reject User'}
            description={
              confirmModal.type === 'verify'
                ? `Are you sure you want to verify and activate ${confirmModal.user?.fullName}? This action will grant them full access to the platform.`
                : `Are you sure you want to reject ${confirmModal.user?.fullName}'s application? This action cannot be undone.`
            }
            confirmText={confirmModal.type === 'verify' ? 'Verify' : 'Reject'}
            countdown={3}
          />
        </div>
      </div>
    </>
  )
}

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  )
}

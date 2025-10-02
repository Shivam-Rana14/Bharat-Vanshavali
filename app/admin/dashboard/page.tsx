"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, CheckCircle, XCircle, Clock, Eye, TreePine, FileText, UserCheck } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { DocumentViewerModal } from "@/components/ui/document-viewer-modal"
import { useToast } from "@/hooks/use-toast"

// DEVELOPMENT ONLY - Extended Mock Data for Testing
const mockPendingUsers = [
  {
    id: "REG001",
    loginId: "BV123456",
    name: "Rajesh Kumar",
    fatherName: "Ram Kumar",
    motherName: "Sita Devi",
    placeOfBirth: "Delhi, Delhi",
    mobile: "+91 9876543210",
    email: "rajesh.kumar@email.com",
    documents: [
      { name: "Aadhaar Card", type: "jpg", url: "/placeholder.svg?height=400&width=600&text=Aadhaar", uploadDate: "2024-01-15" },
      { name: "Voter ID", type: "jpg", url: "/placeholder.svg?height=400&width=600&text=VoterID", uploadDate: "2024-01-15" }
    ],
    status: "pending",
    submittedAt: "2024-01-15",
    familyCode: "FAM001",
    dateOfBirth: "1990-05-15",
    caste: "General",
    grandfatherName: "Mohan Kumar",
    nativePlace: "Mathura, UP"
  },
  {
    id: "REG002",
    loginId: "BVC001235",
    name: "Priya Sharma",
    fatherName: "Suresh Sharma",
    motherName: "Meera Sharma",
    placeOfBirth: "Mumbai, Maharashtra",
    mobile: "+91 9876543211",
    email: "priya.sharma@email.com",
    documents: [
      { name: "Aadhaar Card", type: "pdf", url: "/placeholder.svg?height=400&width=600&text=Aadhaar", uploadDate: "2024-01-16" },
      { name: "Passport", type: "jpg", url: "/placeholder.svg?height=400&width=600&text=Passport", uploadDate: "2024-01-16" }
    ],
    status: "pending",
    submittedAt: "2024-01-16",
    familyCode: "FAM002",
    dateOfBirth: "1988-08-22",
    caste: "OBC",
    grandfatherName: "Ramesh Sharma",
    nativePlace: "Pune, Maharashtra"
  }
]

const mockVerifiedUsers = [
  {
    id: "VER001",
    loginId: "BVC001100",
    name: "Amit Patel",
    fatherName: "Kishore Patel",
    motherName: "Kiran Patel",
    placeOfBirth: "Ahmedabad, Gujarat",
    mobile: "+91 9876543100",
    email: "amit.patel@email.com",
    documents: [
      { name: "Aadhaar Card", type: "jpg", url: "/placeholder.svg?height=400&width=600&text=Aadhaar", uploadDate: "2024-01-10" },
      { name: "Voter ID", type: "jpg", url: "/placeholder.svg?height=400&width=600&text=VoterID", uploadDate: "2024-01-10" }
    ],
    status: "verified",
    verifiedAt: "2024-01-10",
    familyCode: "FAM100",
    familyMembers: 5,
    dateOfBirth: "1985-07-12",
    caste: "General",
    grandfatherName: "Ramesh Patel"
  }
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: 'verify' | 'reject'
    user: any
  }>({ isOpen: false, type: 'verify', user: null })
  const [documentModal, setDocumentModal] = useState<{
    isOpen: boolean
    user: any
  }>({ isOpen: false, user: null })
  
  const router = useRouter()
  const { toast } = useToast()

  const { user } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [dashboardStats, setDashboardStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

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
      const [statsResponse, pendingResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/users?status=pending')
      ])

      const statsResult = await statsResponse.json()
      const pendingResult = await pendingResponse.json()

      if (statsResult.success) {
        setDashboardStats(statsResult.data)
      }

      if (pendingResult.success) {
        setPendingUsers(pendingResult.data)
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

  const handleVerifyUser = (user: any) => {
    setConfirmModal({ isOpen: true, type: 'verify', user })
  }

  const handleRejectUser = (user: any) => {
    setConfirmModal({ isOpen: true, type: 'reject', user })
  }

  const confirmAction = async () => {
    const { type, user } = confirmModal
    
    try {
      const response = await fetch('/api/admin/verify-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: type
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (type === 'verify') {
          toast({
            title: "User Verified",
            description: `${user.full_name} has been verified and activated successfully!`,
            variant: "success"
          })
        } else {
          toast({
            title: "User Rejected",
            description: `${user.full_name}'s application has been rejected.`,
            variant: "destructive"
          })
        }
        
        // Refresh the data
        await fetchData()
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

  const viewDocuments = (user: any) => {
    setDocumentModal({ isOpen: true, user })
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
                <div className="text-2xl font-bold text-orange-600">{mockPendingUsers.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Citizens</CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{mockVerifiedUsers.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Families</CardTitle>
                <TreePine className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{mockVerifiedUsers.length + mockPendingUsers.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{(mockVerifiedUsers.length + mockPendingUsers.length) * 3}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="pending">Pending Verifications</TabsTrigger>
              <TabsTrigger value="verified">Verified Citizens</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              <div className="grid gap-6">
                {mockPendingUsers.map((user) => (
                  <Card key={user.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{user.name}</CardTitle>
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
                          <p className="text-sm text-gray-600">Father: {user.fatherName}</p>
                          <p className="text-sm text-gray-600">Mother: {user.motherName}</p>
                          <p className="text-sm text-gray-600">Place of Birth: {user.placeOfBirth}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Mobile: {user.mobile}</p>
                          <p className="text-sm text-gray-600">Submitted: {user.submittedAt}</p>
                          <p className="text-sm text-gray-600">Documents: {user.documents.length} files</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={() => setSelectedUser(user)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </Button>
                        <Button
                          onClick={() => viewDocuments(user)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View Documents</span>
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
                ))}
              </div>
            </TabsContent>

            <TabsContent value="verified" className="mt-6">
              <div className="grid gap-6">
                {mockVerifiedUsers.map((user) => (
                  <Card key={user.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{user.name}</CardTitle>
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
                          <p className="text-sm text-gray-600">Father: {user.fatherName}</p>
                          <p className="text-sm text-gray-600">Mother: {user.motherName}</p>
                          <p className="text-sm text-gray-600">Place of Birth: {user.placeOfBirth}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Mobile: {user.mobile}</p>
                          <p className="text-sm text-gray-600">Verified: {user.verifiedAt}</p>
                          <p className="text-sm text-gray-600">Family Members: {user.familyMembers}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link href={`/admin/family-tree/${user.loginId}`}>
                          <Button variant="outline" size="sm" className="flex items-center space-x-1">
                            <TreePine className="w-4 h-4" />
                            <span>View Family Tree</span>
                          </Button>
                        </Link>
                        <Button
                          onClick={() => viewDocuments(user)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View Documents</span>
                        </Button>
                        <Button
                          onClick={() => setSelectedUser(user)}
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
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* User Details Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>User Details - {selectedUser.name}</CardTitle>
                    <Button
                      onClick={() => setSelectedUser(null)}
                      variant="ghost"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Personal Information</h4>
                        <p><strong>Login ID:</strong> {selectedUser.loginId}</p>
                        <p><strong>Name:</strong> {selectedUser.name}</p>
                        <p><strong>Father:</strong> {selectedUser.fatherName}</p>
                        <p><strong>Mother:</strong> {selectedUser.motherName}</p>
                        <p><strong>Place of Birth:</strong> {selectedUser.placeOfBirth}</p>
                        <p><strong>Date of Birth:</strong> {selectedUser.dateOfBirth}</p>
                        <p><strong>Mobile:</strong> {selectedUser.mobile}</p>
                        <p><strong>Email:</strong> {selectedUser.email}</p>
                        {selectedUser.caste && <p><strong>Caste:</strong> {selectedUser.caste}</p>}
                        {selectedUser.grandfatherName && <p><strong>Grandfather:</strong> {selectedUser.grandfatherName}</p>}
                        {selectedUser.nativePlace && <p><strong>Native Place:</strong> {selectedUser.nativePlace}</p>}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Verification Details</h4>
                        <p><strong>Status:</strong>
                          <Badge className={`ml-2 ${selectedUser.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                            {selectedUser.status}
                          </Badge>
                        </p>
                        <p><strong>Family Code:</strong> {selectedUser.familyCode}</p>
                        <p><strong>Documents:</strong> {selectedUser.documents?.length || 0} files</p>
                        {selectedUser.verifiedAt && (
                          <p><strong>Verified On:</strong> {selectedUser.verifiedAt}</p>
                        )}
                        {selectedUser.submittedAt && (
                          <p><strong>Submitted On:</strong> {selectedUser.submittedAt}</p>
                        )}
                        {selectedUser.familyMembers && (
                          <p><strong>Family Members:</strong> {selectedUser.familyMembers}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Confirmation Modal */}
          <ConfirmationModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal({ isOpen: false, type: 'verify', user: null })}
            onConfirm={confirmAction}
            title={confirmModal.type === 'verify' ? 'Verify User' : 'Reject User'}
            description={
              confirmModal.type === 'verify'
                ? `Are you sure you want to verify and activate ${confirmModal.user?.name}? This action will grant them full access to the platform.`
                : `Are you sure you want to reject ${confirmModal.user?.name}'s application? This action cannot be undone.`
            }
            confirmText={confirmModal.type === 'verify' ? 'Verify' : 'Reject'}
            countdown={3}
          />

          {/* Document Viewer Modal */}
          <DocumentViewerModal
            isOpen={documentModal.isOpen}
            onClose={() => setDocumentModal({ isOpen: false, user: null })}
            documents={documentModal.user?.documents || []}
            memberName={documentModal.user?.name || ''}
          />
        </div>
      </div>
    </>
  )
}

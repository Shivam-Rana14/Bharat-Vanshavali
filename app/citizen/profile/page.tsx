"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  Shield, 
  Edit,
  Download,
  Eye,
  Trash2
} from 'lucide-react'
import { Navbar } from "@/components/layout/navbar"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DocumentUploadModal } from "@/components/ui/document-upload-modal"

interface UserDocument {
  _id: string
  title: string
  documentType: string
  fileName: string
  fileSize: number
  mimeType: string
  fileData: string
  isPublic: boolean
  createdAt: string
}

interface UserProfile {
  id: string
  fullName: string
  email: string
  phone?: string
  loginId: string
  userType: string
  familyCode?: string
  verificationStatus: string
  dateOfBirth?: string
  placeOfBirth?: string
  gender?: string
  fatherName?: string
  motherName?: string
  grandfatherName?: string
  nativePlace?: string
  caste?: string
  createdAt: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<UserProfile | null>(null)
  const [documents, setDocuments] = useState<UserDocument[]>([])
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchProfileData()
    fetchDocuments()
  }, [user])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setProfileData(data.user)
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      // Fetch documents uploaded by the user
      const response = await fetch(`/api/documents/user/${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Documents API response:', data)
        if (data.success) {
          setDocuments(data.documents || [])
        }
      } else {
        console.error('Documents API error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
  }

  const handleDownloadDocument = (doc: UserDocument) => {
    try {
      // Create a download link from base64 data
      const link = document.createElement('a')
      link.href = doc.fileData
      link.download = doc.fileName
      link.click()
      
      toast({
        title: "Download Started",
        description: `Downloading ${doc.fileName}`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      })
    }
  }

  const handleViewDocument = (doc: UserDocument) => {
    // Open document in a new tab
    const newWindow = window.open()
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${doc.fileName}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
              img { max-width: 100%; height: auto; }
              iframe { width: 100%; height: 100vh; border: none; }
            </style>
          </head>
          <body>
            ${doc.mimeType.startsWith('image/') 
              ? `<img src="${doc.fileData}" alt="${doc.fileName}" />`
              : `<iframe src="${doc.fileData}"></iframe>`
            }
          </body>
        </html>
      `)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading profile..." />
        </div>
      </>
    )
  }

  if (!profileData) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">Failed to load profile data.</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">View and manage your personal information</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Personal Information Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={profileData.fullName} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{profileData.fullName}</CardTitle>
                      <CardDescription className="flex items-center space-x-2 mt-1">
                        <Badge variant={profileData.verificationStatus === 'verified' ? 'default' : 'secondary'}
                               className={profileData.verificationStatus === 'verified' 
                                 ? 'bg-green-100 text-green-800' 
                                 : 'bg-orange-100 text-orange-800'}>
                          {profileData.verificationStatus === 'verified' ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </>
                          ) : (
                            'Pending Verification'
                          )}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Login ID</p>
                          <p className="font-medium">{profileData.loginId}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{profileData.email}</p>
                        </div>
                      </div>

                      {profileData.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium">{profileData.phone}</p>
                          </div>
                        </div>
                      )}

                      {profileData.gender && (
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Gender</p>
                            <p className="font-medium capitalize">{profileData.gender}</p>
                          </div>
                        </div>
                      )}

                      {profileData.dateOfBirth && (
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Date of Birth</p>
                            <p className="font-medium">{formatDate(profileData.dateOfBirth)}</p>
                          </div>
                        </div>
                      )}

                      {profileData.placeOfBirth && (
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Place of Birth</p>
                            <p className="font-medium">{profileData.placeOfBirth}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Family Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Family Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profileData.familyCode && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Family Code</p>
                        <p className="font-medium font-mono text-lg">{profileData.familyCode}</p>
                      </div>
                    )}

                    <Separator />

                    <div className="grid md:grid-cols-2 gap-4">
                      {profileData.fatherName && (
                        <div>
                          <p className="text-sm text-gray-500">Father's Name</p>
                          <p className="font-medium">{profileData.fatherName}</p>
                        </div>
                      )}

                      {profileData.motherName && (
                        <div>
                          <p className="text-sm text-gray-500">Mother's Name</p>
                          <p className="font-medium">{profileData.motherName}</p>
                        </div>
                      )}

                      {profileData.grandfatherName && (
                        <div>
                          <p className="text-sm text-gray-500">Grandfather's Name</p>
                          <p className="font-medium">{profileData.grandfatherName}</p>
                        </div>
                      )}

                      {profileData.nativePlace && (
                        <div>
                          <p className="text-sm text-gray-500">Native Place</p>
                          <p className="font-medium">{profileData.nativePlace}</p>
                        </div>
                      )}

                      {profileData.caste && (
                        <div>
                          <p className="text-sm text-gray-500">Caste</p>
                          <p className="font-medium">{profileData.caste}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>My Documents</CardTitle>
                      <CardDescription>
                        Your uploaded documents and certificates
                      </CardDescription>
                    </div>
                    <Button onClick={() => setUploadModalOpen(true)} className="bg-orange-600 hover:bg-orange-700">
                      <FileText className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No documents uploaded yet</p>
                      <Button 
                        onClick={() => setUploadModalOpen(true)}
                        variant="outline" 
                        className="mt-4"
                      >
                        Upload Your First Document
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div 
                          key={doc._id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{doc.title}</h4>
                              <div className="flex items-center space-x-3 text-sm text-gray-500">
                                <span className="capitalize">{doc.documentType.replace('_', ' ')}</span>
                                <span>•</span>
                                <span>{formatFileSize(doc.fileSize)}</span>
                                <span>•</span>
                                <span>{formatDate(doc.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocument(doc)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Account Type</span>
                      <Badge className="capitalize">{profileData.userType}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge variant={profileData.verificationStatus === 'verified' ? 'default' : 'secondary'}>
                        {profileData.verificationStatus}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm font-medium">{formatDate(profileData.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Documents</span>
                      <span className="text-sm font-medium">{documents.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/citizen/settings')}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/citizen/family-tree')}
                  >
                    <User className="w-4 h-4 mr-2" />
                    View Family Tree
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={() => {
          fetchDocuments()
          toast({
            title: "Success",
            description: "Document uploaded successfully",
            variant: "default"
          })
        }}
      />
    </>
  )
}


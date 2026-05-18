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
  aadhaarNumber?: string
  panNumber?: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchProfileData()
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

              {/* Identity Documents Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Identity Documents</CardTitle>
                  <CardDescription>
                    Your verified identity details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="flex items-center space-x-3 mb-2">
                        <Shield className="w-5 h-5 text-orange-600" />
                        <h3 className="font-semibold text-orange-900">Aadhaar Card</h3>
                      </div>
                      <p className="text-sm text-orange-700 mb-1">Aadhaar Number</p>
                      <p className="font-mono text-lg font-medium text-orange-950">
                        {profileData.aadhaarNumber || 'Not provided'}
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-900">PAN Card</h3>
                      </div>
                      <p className="text-sm text-blue-700 mb-1">PAN Number</p>
                      <p className="font-mono text-lg font-medium text-blue-950">
                        {profileData.panNumber || 'Not provided'}
                      </p>
                    </div>
                  </div>
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

                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>


    </>
  )
}


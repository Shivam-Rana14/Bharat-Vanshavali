"use client"

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/providers/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  User, Mail, Phone, Calendar, MapPin, Users, FileText,
  Save, ArrowLeft, Shield, AlertTriangle, Briefcase, BookOpen
} from 'lucide-react'

interface ProfileData {
  fullName: string
  email: string
  phone?: string
  loginId: string
  dateOfBirth?: string
  placeOfBirth?: string
  gender?: string
  nativePlace?: string
  caste?: string
  occupation?: string
  bio?: string
  fatherName?: string
  motherName?: string
  grandfatherName?: string
  spouseName?: string
  aadhaarNumber?: string
  panNumber?: string
  familyCode?: string
  verificationStatus?: string
}

export default function CitizenSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [leavingFamily, setLeavingFamily] = useState(false)
  const [formData, setFormData] = useState<ProfileData>({
    fullName: '',
    email: '',
    loginId: '',
  })

  const fetcher = (url: string) => fetch(url).then(res => res.json())
  const { data: profileData, error: profileError, isLoading: profileLoading, mutate: mutateProfile } = useSWR('/api/profile', fetcher)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (profileData?.success && profileData.data) {
      const p = profileData.data
      setFormData({
        fullName: p.fullName || '',
        email: p.email || '',
        phone: p.phone || '',
        loginId: p.loginId || '',
        dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
        placeOfBirth: p.placeOfBirth || '',
        gender: p.gender || '',
        nativePlace: p.nativePlace || '',
        caste: p.caste || '',
        occupation: p.occupation || '',
        bio: p.bio || '',
        fatherName: p.fatherName || '',
        motherName: p.motherName || '',
        grandfatherName: p.grandfatherName || '',
        spouseName: p.spouseName || '',
        aadhaarNumber: p.aadhaarNumber || '',
        panNumber: p.panNumber || '',
        familyCode: p.familyCode || '',
        verificationStatus: p.verificationStatus || 'pending',
      })
    } else if (profileError) {
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' })
    }
  }, [user, router, profileData, profileError, toast])

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      toast({ title: 'Validation Error', description: 'Full name is required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          dateOfBirth: formData.dateOfBirth || '',
          placeOfBirth: formData.placeOfBirth || '',
          gender: formData.gender || '',
          nativePlace: formData.nativePlace || '',
          caste: formData.caste || '',
          occupation: formData.occupation || '',
          bio: formData.bio || '',
          fatherName: formData.fatherName || '',
          motherName: formData.motherName || '',
          grandfatherName: formData.grandfatherName || '',
          spouseName: formData.spouseName || '',
          aadhaarNumber: formData.aadhaarNumber || '',
          panNumber: formData.panNumber || '',
        })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: '✅ Profile Updated', description: 'Your profile has been saved successfully.' })
        mutateProfile()
      } else {
        throw new Error(data.error)
      }
    } catch (e: any) {
      toast({ title: 'Save Failed', description: e.message || 'Failed to save profile', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleLeaveFamily = async () => {
    if (!confirm('Are you sure you want to leave your family tree? This action cannot be undone.')) return
    setLeavingFamily(true)
    try {
      const res = await fetch('/api/family-members/leave', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Left Family', description: 'You have left your family tree.', variant: 'success' })
        window.location.href = '/login'
      } else {
        throw new Error(data.error)
      }
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    } finally {
      setLeavingFamily(false)
    }
  }

  const field = (id: string, label: string, value: string, onChange: (v: string) => void, opts?: { placeholder?: string; type?: string; readOnly?: boolean }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</Label>
      <Input
        id={id}
        type={opts?.type || 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={opts?.placeholder || ''}
        readOnly={opts?.readOnly}
        className={opts?.readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}
      />
    </div>
  )

  if (profileLoading && !profileData) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading your profile..." />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/citizen/profile')} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Profile
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                <p className="text-sm text-gray-500">Update your personal information</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {formData.verificationStatus && (
                <Badge className={formData.verificationStatus === 'verified'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-orange-100 text-orange-800 border-orange-200'}>
                  <Shield className="w-3 h-3 mr-1" />
                  {formData.verificationStatus === 'verified' ? 'Verified' : 'Pending Verification'}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-6">

            {/* Read-only Account Info */}
            <Card className="border-blue-100">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <CardTitle className="text-base">Account Information</CardTitle>
                </div>
                <CardDescription>These fields are managed by the system and cannot be changed here.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {field('loginId', 'Login ID', formData.loginId, () => {}, { readOnly: true })}
                  {field('email', 'Email', formData.email, () => {}, { readOnly: true })}
                  {field('phone', 'Phone', formData.phone || '', () => {}, { readOnly: true, placeholder: 'Not provided' })}
                </div>
              </CardContent>
            </Card>

            {/* Editable Personal Info */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {field('fullName', 'Full Name *', formData.fullName, v => setFormData(p => ({ ...p, fullName: v })), { placeholder: 'Your full name' })}

                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</Label>
                    <Select value={formData.gender || ''} onValueChange={v => setFormData(p => ({ ...p, gender: v }))}>
                      <SelectTrigger id="gender">
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

                <div className="grid md:grid-cols-2 gap-4">
                  {field('dateOfBirth', 'Date of Birth', formData.dateOfBirth || '', v => setFormData(p => ({ ...p, dateOfBirth: v })), { type: 'date' })}
                  {field('placeOfBirth', 'Place of Birth', formData.placeOfBirth || '', v => setFormData(p => ({ ...p, placeOfBirth: v })), { placeholder: 'City, State' })}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {field('nativePlace', 'Native Place', formData.nativePlace || '', v => setFormData(p => ({ ...p, nativePlace: v })), { placeholder: 'Village/Town of origin' })}
                  {field('caste', 'Caste', formData.caste || '', v => setFormData(p => ({ ...p, caste: v })), { placeholder: 'Caste / Community' })}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {field('occupation', 'Occupation', formData.occupation || '', v => setFormData(p => ({ ...p, occupation: v })), { placeholder: 'Your profession' })}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ''}
                    onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                    placeholder="A brief description about yourself..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Family Relations */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <CardTitle className="text-base">Family Relations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {field('fatherName', "Father's Name", formData.fatherName || '', v => setFormData(p => ({ ...p, fatherName: v })), { placeholder: "Enter father's name" })}
                  {field('motherName', "Mother's Name", formData.motherName || '', v => setFormData(p => ({ ...p, motherName: v })), { placeholder: "Enter mother's name" })}
                  {field('grandfatherName', "Grandfather's Name", formData.grandfatherName || '', v => setFormData(p => ({ ...p, grandfatherName: v })), { placeholder: "Enter grandfather's name" })}
                  {field('spouseName', "Spouse's Name", formData.spouseName || '', v => setFormData(p => ({ ...p, spouseName: v })), { placeholder: "Enter spouse's name" })}
                </div>
              </CardContent>
            </Card>

            {/* Identity Documents */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <CardTitle className="text-base">Identity Documents</CardTitle>
                </div>
                <CardDescription>Aadhaar and PAN numbers for verification purposes.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {field('aadhaarNumber', 'Aadhaar Number', formData.aadhaarNumber || '', v => setFormData(p => ({ ...p, aadhaarNumber: v })), { placeholder: 'XXXX XXXX XXXX' })}
                  {field('panNumber', 'PAN Number', formData.panNumber || '', v => setFormData(p => ({ ...p, panNumber: v })), { placeholder: 'ABCDE1234F' })}
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => router.push('/citizen/profile')}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 gap-2 min-w-[120px]"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {/* Danger Zone */}
            <Card className="border-red-200 mt-8">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <CardTitle className="text-base text-red-700">Danger Zone</CardTitle>
                </div>
                <CardDescription>Irreversible actions — proceed with caution.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="font-medium text-red-900">Leave Family Tree</p>
                    <p className="text-sm text-red-700 mt-0.5">
                      Remove yourself from your current family ({formData.familyCode || 'N/A'}). This cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleLeaveFamily}
                    disabled={leavingFamily || !formData.familyCode}
                    className="shrink-0 ml-4"
                  >
                    {leavingFamily ? 'Leaving...' : 'Leave Family'}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </>
  )
}

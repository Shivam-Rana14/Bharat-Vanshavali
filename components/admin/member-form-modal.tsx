"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { XCircle, Save } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface MemberFormModalProps {
    member?: any // If provided, it's edit mode. If not, it's add mode
    familyCode?: string // Required for add mode
    onClose: () => void
    onSuccess: (updatedData?: any) => void
    mode: 'edit' | 'add'
}

export function MemberFormModal({
    member,
    familyCode,
    onClose,
    onSuccess,
    mode,
}: MemberFormModalProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        placeOfBirth: '',
        gender: '',
        nativePlace: '',
        caste: '',
        fatherName: '',
        motherName: '',
        grandfatherName: '',
        spouseName: '',
        occupation: '',
        bio: '',
        aadhaarNumber: '',
        panNumber: ''
    })

    useEffect(() => {
        if (mode === 'edit' && member) {
            setFormData({
                fullName: member.fullName || '',
                email: member.email || '',
                phone: member.phone || '',
                dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
                placeOfBirth: member.placeOfBirth || '',
                gender: member.gender || '',
                nativePlace: member.nativePlace || '',
                caste: member.caste || '',
                fatherName: member.fatherName || '',
                motherName: member.motherName || '',
                grandfatherName: member.grandfatherName || '',
                spouseName: member.spouseName || '',
                occupation: member.occupation || '',
                bio: member.bio || '',
                aadhaarNumber: member.aadhaarNumber || '',
                panNumber: member.panNumber || ''
            })
        }
    }, [member, mode])

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (mode === 'edit') {
                // Update existing member
                const response = await fetch(`/api/admin/users/${member._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                })

                const result = await response.json()

                if (result.success) {
                    toast({
                        title: "Success",
                        description: "Member updated successfully"
                    })
                    onSuccess(result.data) // pass updated member back immediately
                    onClose()
                } else {
                    throw new Error(result.error)
                }
            } else {
                // Add new member
                const response = await fetch(`/api/admin/families/${familyCode}/members/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memberData: formData })
                })

                const result = await response.json()

                if (result.success) {
                    toast({
                        title: "Success",
                        description: "Member added successfully"
                    })
                    onSuccess(result.data)
                    onClose()
                } else {
                    throw new Error(result.error)
                }
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : `Failed to ${mode} member`,
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{mode === 'edit' ? 'Edit Member' : 'Add Family Member'}</CardTitle>
                        <Button onClick={onClose} variant="ghost" size="sm">
                            <XCircle className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="fullName">Full Name *</Label>
                                    <Input
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={(e) => handleChange('fullName', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                    <Input
                                        id="dateOfBirth"
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
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
                                <div>
                                    <Label htmlFor="placeOfBirth">Place of Birth</Label>
                                    <Input
                                        id="placeOfBirth"
                                        value={formData.placeOfBirth}
                                        onChange={(e) => handleChange('placeOfBirth', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="nativePlace">Native Place</Label>
                                    <Input
                                        id="nativePlace"
                                        value={formData.nativePlace}
                                        onChange={(e) => handleChange('nativePlace', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="caste">Caste</Label>
                                    <Input
                                        id="caste"
                                        value={formData.caste}
                                        onChange={(e) => handleChange('caste', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="occupation">Occupation</Label>
                                    <Input
                                        id="occupation"
                                        value={formData.occupation}
                                        onChange={(e) => handleChange('occupation', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Family Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Family Information</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="fatherName">Father Name</Label>
                                    <Input
                                        id="fatherName"
                                        value={formData.fatherName}
                                        onChange={(e) => handleChange('fatherName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="motherName">Mother Name</Label>
                                    <Input
                                        id="motherName"
                                        value={formData.motherName}
                                        onChange={(e) => handleChange('motherName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="grandfatherName">Grandfather Name</Label>
                                    <Input
                                        id="grandfatherName"
                                        value={formData.grandfatherName}
                                        onChange={(e) => handleChange('grandfatherName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="spouseName">Spouse Name</Label>
                                    <Input
                                        id="spouseName"
                                        value={formData.spouseName}
                                        onChange={(e) => handleChange('spouseName', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Documents</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                                    <Input
                                        id="aadhaarNumber"
                                        value={formData.aadhaarNumber}
                                        onChange={(e) => handleChange('aadhaarNumber', e.target.value)}
                                        maxLength={12}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="panNumber">PAN Number</Label>
                                    <Input
                                        id="panNumber"
                                        value={formData.panNumber}
                                        onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                                        maxLength={10}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => handleChange('bio', e.target.value)}
                                rows={4}
                                placeholder="Brief description about the person..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Saving...' : mode === 'edit' ? 'Update Member' : 'Add Member'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

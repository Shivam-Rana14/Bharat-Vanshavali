"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { XCircle, Edit, Eye, CheckCircle, Clock, Plus } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface FamilyMembersModalProps {
    family: any
    members: any[]
    onClose: () => void
    onEditMember: (member: any) => void
    onViewMember: (member: any) => void
    onVerifyMember: (member: any) => void
    onRejectMember: (member: any) => void
    onAddMember: () => void
    onRefresh: () => void
}

export function FamilyMembersModal({
    family,
    members,
    onClose,
    onEditMember,
    onViewMember,
    onVerifyMember,
    onRejectMember,
    onAddMember,
    onRefresh
}: FamilyMembersModalProps) {
    const { toast } = useToast()

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'verified':
                return (
                    <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                    </Badge>
                )
            case 'pending':
                return (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                )
            case 'rejected':
                return (
                    <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                    </Badge>
                )
            default:
                return <Badge>{status}</Badge>
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">{family?.familyName}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Family Code: {family?.familyCode} | Total Members: {members.length}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={onAddMember}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Member
                            </Button>
                            <Button
                                onClick={onClose}
                                variant="ghost"
                                size="sm"
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {members.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No members in this family
                            </div>
                        ) : (
                            members.map((member) => (
                                <Card key={member._id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold">{member.fullName}</h3>
                                                    {member.isRootMember && (
                                                        <Badge className="bg-purple-100 text-purple-800">Root Member</Badge>
                                                    )}
                                                    {getStatusBadge(member.verificationStatus)}
                                                </div>
                                                <p className="text-sm text-gray-600">Login ID: {member.loginId}</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Email</p>
                                                <p className="font-medium">{member.email || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Phone</p>
                                                <p className="font-medium">{member.phone || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Gender</p>
                                                <p className="font-medium">{member.gender || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Date of Birth</p>
                                                <p className="font-medium">
                                                    {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Place of Birth</p>
                                                <p className="font-medium">{member.placeOfBirth || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Native Place</p>
                                                <p className="font-medium">{member.nativePlace || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Father Name</p>
                                                <p className="font-medium">{member.fatherName || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Mother Name</p>
                                                <p className="font-medium">{member.motherName || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Grandfather Name</p>
                                                <p className="font-medium">{member.grandfatherName || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Spouse Name</p>
                                                <p className="font-medium">{member.spouseName || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Occupation</p>
                                                <p className="font-medium">{member.occupation || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Caste</p>
                                                <p className="font-medium">{member.caste || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Aadhaar Number</p>
                                                <p className="font-medium">{member.aadhaarNumber || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">PAN Number</p>
                                                <p className="font-medium">{member.panNumber || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {member.bio && (
                                            <div className="mb-4">
                                                <p className="text-gray-500 text-sm">Bio</p>
                                                <p className="text-sm">{member.bio}</p>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                onClick={() => onViewMember(member)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                View Full Details
                                            </Button>
                                            <Button
                                                onClick={() => onEditMember(member)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                            {member.verificationStatus === 'pending' && (
                                                <>
                                                    <Button
                                                        onClick={() => onVerifyMember(member)}
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Verify
                                                    </Button>
                                                    <Button
                                                        onClick={() => onRejectMember(member)}
                                                        variant="destructive"
                                                        size="sm"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

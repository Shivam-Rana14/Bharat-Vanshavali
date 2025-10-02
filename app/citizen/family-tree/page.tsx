"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TreePine, Plus, Edit, Trash2, CheckCircle, Clock, User, FileText } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { EditMemberModal } from "@/components/ui/edit-member-modal"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { DocumentViewerModal } from "@/components/ui/document-viewer-modal"
import { MemberDetailsModal } from "@/components/ui/member-details-modal"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/providers/auth-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

function FamilyMemberCard({ member, onEdit, onDelete, onViewDocuments, onViewDetails }: any) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {member.name || 'Unnamed'}
                {member.isRoot && (
                  <Badge variant="outline" className="ml-2 text-xs bg-blue-100 text-blue-800">
                    Root Member
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="truncate">{member.relation || 'No relation'}</CardDescription>
            </div>
          </div>
          <Badge variant={member.status === 'verified' ? 'default' : 'secondary'} 
                 className={`flex-shrink-0 ${member.status === 'verified' ? 
                 'bg-green-100 text-green-800' : 
                 'bg-orange-100 text-orange-800'}`}>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <p className="break-words"><strong>Login ID:</strong> {member.loginId || 'Not provided'}</p>
          <p className="break-words"><strong>Date of Birth:</strong> {formatDate(member.dateOfBirth)}</p>
          <p className="break-words"><strong>Place of Birth:</strong> {member.placeOfBirth || 'Not provided'}</p>
          {member.mobile && <p className="break-words"><strong>Mobile:</strong> {member.mobile}</p>}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(member)} className="flex-1 min-w-[100px]">
            <User className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">View Details</span>
            <span className="sm:hidden">Details</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(member)} className="flex-1 min-w-[80px]">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onViewDocuments(member)} className="flex-1 min-w-[100px]">
            <FileText className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Documents</span>
            <span className="sm:hidden">Docs</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(member)} className="flex-1 min-w-[80px]">
            <Trash2 className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Delete</span>
            <span className="sm:hidden">Del</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FamilyTreePage() {
  const { user } = useAuth()
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState({ isOpen: false, member: null })
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, member: null })
  const [documentModal, setDocumentModal] = useState({ isOpen: false, member: null })
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, member: null })
  const { toast } = useToast()

  useEffect(() => {
    fetchFamilyMembers()
  }, [user])

  const fetchFamilyMembers = async () => {
    if (!user?.familyCode) return

    try {
      setLoading(true)
      const response = await fetch(`/api/family-members?familyCode=${user.familyCode}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setFamilyMembers(data.members || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch family members:', error)
      toast({
        title: "Error",
        description: "Failed to load family tree data.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditMember = (member: any) => {
    setEditModal({ isOpen: true, member })
  }

  const handleDeleteMember = (member: any) => {
    setConfirmModal({ isOpen: true, member })
  }

  const handleViewDocuments = (member: any) => {
    setDocumentModal({ isOpen: true, member })
  }

  const handleViewDetails = (member: any) => {
    setDetailsModal({ isOpen: true, member })
  }

  const confirmDelete = async () => {
    const member = confirmModal.member
    if (!member) return

    try {
      const response = await fetch(`/api/family-members/${member._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchFamilyMembers()
        toast({
          title: "Member Deleted",
          description: "Family member has been deleted successfully.",
          variant: "default"
        })
      } else {
        throw new Error('Failed to delete member')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete family member",
        variant: "destructive"
      })
    }
    setConfirmModal({ isOpen: false, member: null })
  }

  const handleSaveMember = async (updatedMember: any) => {
    try {
      const response = await fetch(`/api/family-members/${updatedMember._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMember),
      })

      if (response.ok) {
        await fetchFamilyMembers()
        toast({
          title: "Member Updated",
          description: "Family member has been updated successfully.",
          variant: "default"
        })
      } else {
        throw new Error('Failed to update member')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update family member",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading family tree..." />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header with Add Member Button */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <TreePine className="w-8 h-8 text-orange-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Family Tree</h1>
                {user?.familyCode && (
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-semibold">Family Code:</span> {user.familyCode}
                  </p>
                )}
                <p className="text-gray-600">Manage your family members and relationships</p>
              </div>
            </div>
            <Link href="/citizen/add-member">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </Link>
          </div>

          {/* Family Members Grid */}
          {familyMembers.length === 0 ? (
            <div className="text-center py-12">
              <TreePine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Family Members Yet</h3>
              <p className="text-gray-500 mb-4">Start building your family tree by adding your first family member.</p>
              <Link href="/citizen/add-member">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Member
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {familyMembers.map((member) => (
                <FamilyMemberCard
                  key={member._id}
                  member={member}
                  onEdit={handleEditMember}
                  onDelete={handleDeleteMember}
                  onViewDocuments={handleViewDocuments}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditMemberModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, member: null })}
        member={editModal.member}
        onSave={handleSaveMember}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, member: null })}
        onConfirm={confirmDelete}
        title="Delete Family Member"
        description="Are you sure you want to delete this family member? This action cannot be undone."
      />

      <DocumentViewerModal
        isOpen={documentModal.isOpen}
        onClose={() => setDocumentModal({ isOpen: false, member: null })}
        documents={[]}
        memberName={documentModal.member?.name || 'Unknown'}
      />

      <MemberDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, member: null })}
        member={detailsModal.member}
      />
    </>
  )
}

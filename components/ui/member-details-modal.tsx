"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  FileText,
  CheckCircle,
  Clock,
  Download,
  Eye
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface MemberDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  member: any
}

interface Document {
  _id: string
  title: string
  documentType: string
  fileName: string
  fileSize: number
  mimeType: string
  fileData: string
  createdAt: string
}

export function MemberDetailsModal({ isOpen, onClose, member }: MemberDetailsModalProps) {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)

  useEffect(() => {
    if (isOpen && member?._id) {
      fetchMemberDocuments()
    }
  }, [isOpen, member])

  const fetchMemberDocuments = async () => {
    if (!member?._id) return
    
    try {
      setLoadingDocuments(true)
      const response = await fetch(`/api/documents/member/${member._id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDocuments(data.documents || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoadingDocuments(false)
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

  const handleDownloadDocument = (doc: Document) => {
    try {
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

  const handleViewDocument = (doc: Document) => {
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

  if (!member) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Family Member Details"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Member Header */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
            <p className="text-gray-600">{member.relation}</p>
            <Badge 
              variant={member.status === 'verified' ? 'default' : 'secondary'}
              className={member.status === 'verified' 
                ? 'bg-green-100 text-green-800 mt-2' 
                : 'bg-orange-100 text-orange-800 mt-2'}>
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
        </div>

        <Separator />

        {/* Basic Information */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-2">
              <User className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500">Login ID</p>
                <p className="font-medium break-words">{member.loginId || 'Not linked'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Calendar className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">{formatDate(member.dateOfBirth)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500">Place of Birth</p>
                <p className="font-medium break-words">{member.placeOfBirth || 'Not provided'}</p>
              </div>
            </div>

            {member.mobile && (
              <div className="flex items-start space-x-2">
                <Phone className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="font-medium break-words">{member.mobile}</p>
                </div>
              </div>
            )}

            {member.gender && (
              <div className="flex items-start space-x-2">
                <User className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium capitalize">{member.gender}</p>
                </div>
              </div>
            )}

            {member.occupation && (
              <div className="flex items-start space-x-2">
                <User className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500">Occupation</p>
                  <p className="font-medium break-words">{member.occupation}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Additional Details */}
        {(member.fatherName || member.motherName || member.spouseName) && (
          <>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Family Details</h4>
              <div className="space-y-2">
                {member.fatherName && (
                  <div>
                    <p className="text-sm text-gray-500">Father's Name</p>
                    <p className="font-medium">{member.fatherName}</p>
                  </div>
                )}
                {member.motherName && (
                  <div>
                    <p className="text-sm text-gray-500">Mother's Name</p>
                    <p className="font-medium">{member.motherName}</p>
                  </div>
                )}
                {member.spouseName && (
                  <div>
                    <p className="text-sm text-gray-500">Spouse's Name</p>
                    <p className="font-medium">{member.spouseName}</p>
                  </div>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Documents */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </h4>
          {loadingDocuments ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <FileText className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No documents available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div 
                  key={doc._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="capitalize">{doc.documentType.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDocument(doc)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
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
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}


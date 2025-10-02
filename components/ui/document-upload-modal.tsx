"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
  familyMemberId?: string
}

export function DocumentUploadModal({ isOpen, onClose, onUploadSuccess, familyMemberId }: DocumentUploadModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    documentType: "",
    description: "",
    isPublic: false,
    file: null as File | null
  })
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive"
        })
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a JPEG, PNG, GIF, PDF, or TXT file.",
          variant: "destructive"
        })
        return
      }

      setFormData({ ...formData, file })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.file || !formData.title || !formData.documentType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a file.",
        variant: "destructive"
      })
      return
    }

    setUploading(true)

    try {
      const submitFormData = new FormData()
      submitFormData.append('file', formData.file)
      submitFormData.append('title', formData.title)
      submitFormData.append('documentType', formData.documentType)
      submitFormData.append('description', formData.description)
      submitFormData.append('isPublic', formData.isPublic.toString())
      if (familyMemberId) {
        submitFormData.append('familyMemberId', familyMemberId)
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: submitFormData,
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Document Uploaded",
          description: "Your document has been uploaded successfully.",
          variant: "success"
        })
        onUploadSuccess()
        onClose()
        
        // Reset form
        setFormData({
          title: "",
          documentType: "",
          description: "",
          isPublic: false,
          file: null
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Document">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Document Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter document title"
            required
          />
        </div>

        <div>
          <Label htmlFor="documentType">Document Type *</Label>
          <Select value={formData.documentType} onValueChange={(value) => setFormData({ ...formData, documentType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
              <SelectItem value="voter_id">Voter ID</SelectItem>
              <SelectItem value="birth_certificate">Birth Certificate</SelectItem>
              <SelectItem value="photo">Photo</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter document description (optional)"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="file">Choose File *</Label>
          <Input
            id="file"
            type="file"
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.gif,.pdf,.txt"
            className="cursor-pointer"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported: JPEG, PNG, GIF, PDF, TXT (Max: 10MB)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isPublic"
            checked={formData.isPublic}
            onCheckedChange={(checked) => setFormData({ ...formData, isPublic: !!checked })}
          />
          <Label htmlFor="isPublic" className="text-sm">
            Make this document publicly visible
          </Label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
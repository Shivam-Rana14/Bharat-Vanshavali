"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/hooks/use-toast"

interface EditMemberModalProps {
  isOpen: boolean
  onClose: () => void
  member: any
  onSave: (updatedMember: any) => void
}

export function EditMemberModal({ isOpen, onClose, member, onSave }: EditMemberModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    placeOfBirth: "",
    mobile: "",
    email: "",
    fatherName: "",
    motherName: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (member && isOpen) {
      setFormData({
        name: member.name || "",
        dateOfBirth: member.dateOfBirth || "",
        placeOfBirth: member.placeOfBirth || "",
        mobile: member.mobile || "",
        email: member.email || "",
        fatherName: member.fatherName || "",
        motherName: member.motherName || ""
      })
      setErrors({})
    }
  }, [member, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required"
    } else {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      if (birthDate > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future"
      }
    }

    if (!formData.placeOfBirth.trim()) {
      newErrors.placeOfBirth = "Place of birth is required"
    }

    if (formData.mobile && !/^\+91 \d{5} \d{5}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be in format: +91 XXXXX XXXXX"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedMember = { ...member, ...formData }
      onSave(updatedMember)
      
      toast({
        title: "Member Updated",
        description: `${formData.name}'s information has been updated successfully`,
        variant: "success"
      })
      
      onClose()
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update member information. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${member?.name || 'Member'}`}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
              placeholder="Enter full name"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              className={errors.dateOfBirth ? "border-red-500" : ""}
            />
            {errors.dateOfBirth && <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth}</p>}
          </div>

          <div>
            <Label htmlFor="placeOfBirth">Place of Birth *</Label>
            <Input
              id="placeOfBirth"
              value={formData.placeOfBirth}
              onChange={(e) => handleInputChange("placeOfBirth", e.target.value)}
              className={errors.placeOfBirth ? "border-red-500" : ""}
              placeholder="City, State"
            />
            {errors.placeOfBirth && <p className="text-sm text-red-600 mt-1">{errors.placeOfBirth}</p>}
          </div>

          <div>
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              value={formData.mobile}
              onChange={(e) => handleInputChange("mobile", e.target.value)}
              className={errors.mobile ? "border-red-500" : ""}
              placeholder="+91 XXXXX XXXXX"
            />
            {errors.mobile && <p className="text-sm text-red-600 mt-1">{errors.mobile}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={errors.email ? "border-red-500" : ""}
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="fatherName">Father's Name</Label>
            <Input
              id="fatherName"
              value={formData.fatherName}
              onChange={(e) => handleInputChange("fatherName", e.target.value)}
              placeholder="Father's full name"
            />
          </div>

          <div>
            <Label htmlFor="motherName">Mother's Name</Label>
            <Input
              id="motherName"
              value={formData.motherName}
              onChange={(e) => handleInputChange("motherName", e.target.value)}
              placeholder="Mother's full name"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" onClick={onClose} variant="outline" disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

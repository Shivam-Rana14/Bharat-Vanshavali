"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from 'lucide-react'
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { LocationInput } from "@/components/ui/location-input"

export default function AddMemberPage() {
  const [formData, setFormData] = useState({
    // Personal Details (Step 1 in signup)
    fullName: "",
    dateOfBirth: "",
    gender: "",
    placeOfBirth: "",

    // Family & Additional Details (Step 2 in signup)
    relationship: "", // Relationship to root member
    nativePlace: "",
    caste: "",
    reference1Name: "",
    reference1Mobile: "",
    reference2Name: "",
    reference2Mobile: "",

    // Documents (Step 3 in signup)
    aadhaarNumber: "",
    panNumber: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [familyCode, setFamilyCode] = useState("")
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (isLoading) return

    if (!user) {
      router.push("/login")
    } else if (user.type !== "citizen") {
      router.push("/login")
    } else if (user.familyCode) {
      // Set the family code from the logged-in user
      setFamilyCode(user.familyCode)
    }
  }, [user, router, isLoading])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = "Name must be at least 2 characters long"
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required"
    } else {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      if (birthDate > today) {
        newErrors.dateOfBirth = "Birth date cannot be in the future"
      }
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required"
    }

    // Relationship is optional (same as signup - only shown when joining existing family)
    // No validation needed

    // References validation (REQUIRED in signup)
    if (!formData.reference1Name.trim()) {
      newErrors.reference1Name = "Reference 1 Name is required"
    }
    if (!formData.reference1Mobile) {
      newErrors.reference1Mobile = "Reference 1 Mobile is required"
    } else if (!/^[6-9]\d{9}$/.test(formData.reference1Mobile)) {
      newErrors.reference1Mobile = "Invalid mobile number"
    }

    if (!formData.reference2Name.trim()) {
      newErrors.reference2Name = "Reference 2 Name is required"
    }
    if (!formData.reference2Mobile) {
      newErrors.reference2Mobile = "Reference 2 Mobile is required"
    } else if (!/^[6-9]\d{9}$/.test(formData.reference2Mobile)) {
      newErrors.reference2Mobile = "Invalid mobile number"
    }

    // Aadhaar validation
    if (!formData.aadhaarNumber) {
      newErrors.aadhaarNumber = "Aadhaar number is required"
    } else if (!/^\d{12}$/.test(formData.aadhaarNumber)) {
      newErrors.aadhaarNumber = "Aadhaar number must be 12 digits"
    }

    // PAN validation
    if (!formData.panNumber) {
      newErrors.panNumber = "PAN number is required"
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = "Invalid PAN format (e.g. ABCDE1234F)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      try {
        setLoading(true)

        // Add family member using the new API that creates placeholder users
        const response = await fetch('/api/family-members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            memberData: {
              fullName: formData.fullName,
              dateOfBirth: formData.dateOfBirth,
              placeOfBirth: formData.placeOfBirth,
              gender: formData.gender,
              relationship: formData.relationship,
              nativePlace: formData.nativePlace,
              caste: formData.caste,
              aadhaarNumber: formData.aadhaarNumber,
              panNumber: formData.panNumber,
              reference1Name: formData.reference1Name,
              reference1Mobile: formData.reference1Mobile,
              reference2Name: formData.reference2Name,
              reference2Mobile: formData.reference2Mobile,
            },
            targetMemberId: null // No specific target, will be unconnected
          }),
        })

        if (response.ok) {
          const data = await response.json()
          toast({
            title: "Family Member Added",
            description: `${formData.fullName} has been added to your family tree. You can now connect them in the family tree view.`,
            variant: "default"
          })
          router.push("/citizen/family-tree")
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to add family member')
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to add family member",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Add New Family Member</CardTitle>
              <CardDescription>
                Add a new person to your family tree. They will be added to family: <strong>{familyCode}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className={errors.fullName ? "border-red-500" : ""}
                        required
                      />
                      {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                        <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className={errors.dateOfBirth ? "border-red-500" : ""}
                        required
                      />
                      {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirth">Place of Birth</Label>
                      <LocationInput
                        value={formData.placeOfBirth}
                        onChange={(value) => setFormData({ ...formData, placeOfBirth: value })}
                        placeholder="City, State"
                      />
                    </div>
                  </div>
                </div>

                {/* Family & Additional Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Family & Additional Information</h3>

                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Family Code:</strong> {familyCode}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      This person will be added to your family tree
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relationship to Root Member (Optional)</Label>
                    <Input
                      id="relationship"
                      placeholder="e.g., Son, Daughter, Brother, Sister, Father, Mother"
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className={errors.relationship ? "border-red-500" : ""}
                    />
                    {errors.relationship && <p className="text-sm text-red-500">{errors.relationship}</p>}
                    <p className="text-xs text-gray-500">
                      Optional: Helps the root member connect them in the family tree
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nativePlace">Native Place</Label>
                      <LocationInput
                        value={formData.nativePlace}
                        onChange={(value) => setFormData({ ...formData, nativePlace: value })}
                        placeholder="Ancestral village or town"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="caste">Caste/Community</Label>
                      <Input
                        id="caste"
                        placeholder="Enter caste or community"
                        value={formData.caste}
                        onChange={(e) => setFormData({ ...formData, caste: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* References */}
                  <div className="space-y-4 mt-4">
                    <Label>References *</Label>
                    <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                      <strong>Note:</strong> Please provide contacts of community friends or neighbors, NOT family members. These references may be used for verification.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Input
                          placeholder="Reference 1 Name *"
                          value={formData.reference1Name}
                          onChange={(e) => setFormData({ ...formData, reference1Name: e.target.value })}
                          className={errors.reference1Name ? "border-red-500" : ""}
                          required
                        />
                        {errors.reference1Name && <p className="text-sm text-red-500">{errors.reference1Name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Input
                          type="tel"
                          placeholder="Reference 1 Mobile *"
                          value={formData.reference1Mobile}
                          onChange={(e) => setFormData({ ...formData, reference1Mobile: e.target.value })}
                          className={errors.reference1Mobile ? "border-red-500" : ""}
                          required
                        />
                        {errors.reference1Mobile && <p className="text-sm text-red-500">{errors.reference1Mobile}</p>}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Input
                          placeholder="Reference 2 Name *"
                          value={formData.reference2Name}
                          onChange={(e) => setFormData({ ...formData, reference2Name: e.target.value })}
                          className={errors.reference2Name ? "border-red-500" : ""}
                          required
                        />
                        {errors.reference2Name && <p className="text-sm text-red-500">{errors.reference2Name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Input
                          type="tel"
                          placeholder="Reference 2 Mobile *"
                          value={formData.reference2Mobile}
                          onChange={(e) => setFormData({ ...formData, reference2Mobile: e.target.value })}
                          className={errors.reference2Mobile ? "border-red-500" : ""}
                          required
                        />
                        {errors.reference2Mobile && <p className="text-sm text-red-500">{errors.reference2Mobile}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Identity Documents *</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aadhaarNumber">Aadhaar Number *</Label>
                      <Input
                        id="aadhaarNumber"
                        placeholder="12-digit Aadhaar number"
                        value={formData.aadhaarNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 12)
                          setFormData({ ...formData, aadhaarNumber: value })
                        }}
                        className={errors.aadhaarNumber ? "border-red-500" : ""}
                        maxLength={12}
                        required
                      />
                      {errors.aadhaarNumber && <p className="text-sm text-red-500">{errors.aadhaarNumber}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="panNumber">PAN Number *</Label>
                      <Input
                        id="panNumber"
                        placeholder="ABCDE1234F"
                        value={formData.panNumber}
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                        className={errors.panNumber ? "border-red-500" : ""}
                        maxLength={10}
                        required
                      />
                      {errors.panNumber && <p className="text-sm text-red-500">{errors.panNumber}</p>}
                      <p className="text-xs text-gray-500">Format: ABCDE1234F</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">How it works</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• This person will be added as a placeholder user in your family</li>
                    <li>• They will appear as a node in your family tree immediately</li>
                    <li>• Only root members and admins can add family members</li>
                    <li>• All information is saved to the database (same as signup)</li>
                    <li>• The person can later claim their account by contacting an admin</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding Member...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Family Member
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users } from 'lucide-react'
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { useToast } from "@/hooks/use-toast"

export default function AddMemberPage() {
  const [addMethod, setAddMethod] = useState("new")
  const [formData, setFormData] = useState({
    name: "",
    relation: "",
    dateOfBirth: "",
    placeOfBirth: "",
    mobile: "",
    email: "",
    fatherName: "",
    motherName: "",
    searchLoginId: "",
    targetMemberId: "" // New field for target member selection
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const userType = localStorage.getItem("userType")
    if (userType !== "citizen") {
      router.push("/login")
    }
    fetchFamilyMembers()
  }, [router])

  const fetchFamilyMembers = async () => {
    try {
      setLoadingMembers(true)
      const response = await fetch('/api/family-members/selection')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setFamilyMembers(data.members || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch family members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }

  const relations = [
    "Father", "Mother", "Son", "Daughter", "Brother", "Sister",
    "Grandfather", "Grandmother", "Grandson", "Granddaughter",
    "Uncle", "Aunt", "Nephew", "Niece", "Cousin", "Spouse"
  ]

  const validateNewMemberForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required"
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters long"
    }

    if (!formData.relation) {
      newErrors.relation = "Please select a relationship"
    }

    // Require target member selection if family members exist
    if (familyMembers.length > 0 && !formData.targetMemberId) {
      newErrors.targetMemberId = "Please select which family member this relationship is relative to"
    }

    if (formData.mobile && !/^\+91\s\d{5}\s\d{5}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be in format: +91 XXXXX XXXXX"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      
      if (birthDate > today) {
        newErrors.dateOfBirth = "Birth date cannot be in the future"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateExistingMemberForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.searchLoginId.trim()) {
      newErrors.searchLoginId = "Login ID is required"
    } else if (!/^BVC\d{6}$/.test(formData.searchLoginId)) {
      newErrors.searchLoginId = "Login ID must be in format: BVC followed by 6 digits"
    }

    if (!formData.relation) {
      newErrors.relation = "Please select a relationship"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateNewMemberForm()) {
      try {
        const response = await fetch('/api/family-members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            memberData: {
              fullName: formData.name,
              relationship: formData.relation.toLowerCase(),
              gender: 'other', // Default, can be updated later
              dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
              placeOfBirth: formData.placeOfBirth,
              occupation: undefined,
              isAlive: true,
              verificationStatus: 'pending'
            },
            targetMemberId: formData.targetMemberId || undefined
          }),
        })

        if (response.ok) {
          toast({
            title: "Family Member Added",
            description: `${formData.name} has been added to your family tree and sent for verification.`,
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
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive"
      })
    }
  }

  const handleSearchExisting = () => {
    if (validateExistingMemberForm()) {
      // DEVELOPMENT ONLY - Mock search results
      const mockUsers = {
        "BVC001100": { name: "Amit Patel", status: "verified", familyCode: "FAM100" },
        "BVC001101": { name: "Sunita Gupta", status: "verified", familyCode: "FAM101" },
        "BVC001102": { name: "Ravi Kumar", status: "verified", familyCode: "FAM102" },
        "BVC001103": { name: "Meera Joshi", status: "verified", familyCode: "FAM103" }
      }
      
      const user = mockUsers[formData.searchLoginId as keyof typeof mockUsers]
      if (user) {
        toast({
          title: "User Found",
          description: `Found verified citizen: ${user.name} (Family: ${user.familyCode}). Invitation sent!`,
          variant: "success"
        })
      } else {
        toast({
          title: "User Not Found",
          description: `No verified citizen found with ID: ${formData.searchLoginId}`,
          variant: "destructive"
        })
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before searching.",
        variant: "destructive"
      })
    }
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
                Add a new member to your family tree or invite an existing verified citizen
              </CardDescription>
              {/* DEVELOPMENT ONLY - Testing Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-yellow-800">
                  🚧 <strong>DEV MODE:</strong> For testing, try searching for existing users: BVC001100, BVC001101, BVC001102, BVC001103
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={addMethod} onValueChange={setAddMethod}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="new" className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add New Person</span>
                  </TabsTrigger>
                  <TabsTrigger value="existing" className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Find Existing User</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="mt-6">
                  <form onSubmit={handleSubmitNew} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="Enter full name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className={errors.name ? "border-red-500" : ""}
                          required
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="relation">Relationship *</Label>
                        <Select value={formData.relation} onValueChange={(value) => setFormData({...formData, relation: value})}>
                          <SelectTrigger className={errors.relation ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            {relations.map((relation) => (
                              <SelectItem key={relation} value={relation.toLowerCase()}>
                                {relation}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.relation && <p className="text-sm text-red-500">{errors.relation}</p>}
                      </div>
                    </div>

                    {/* Target Member Selection */}
                    {familyMembers.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="targetMember">Relationship to (Select Family Member) *</Label>
                        <Select 
                          value={formData.targetMemberId} 
                          onValueChange={(value) => setFormData({...formData, targetMemberId: value})}
                        >
                          <SelectTrigger className={errors.targetMemberId ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select which family member this relationship is relative to" />
                          </SelectTrigger>
                          <SelectContent>
                            {familyMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.targetMemberId && <p className="text-sm text-red-500">{errors.targetMemberId}</p>}
                        <p className="text-xs text-gray-500">
                          Select the family member this relationship is relative to. For example, if adding "Father", select whose father they are.
                        </p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                          className={errors.dateOfBirth ? "border-red-500" : ""}
                        />
                        {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="placeOfBirth">Place of Birth</Label>
                        <Input
                          id="placeOfBirth"
                          placeholder="Village/Town, District, State"
                          value={formData.placeOfBirth}
                          onChange={(e) => setFormData({...formData, placeOfBirth: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Number</Label>
                        <Input
                          id="mobile"
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                          value={formData.mobile}
                          onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                          className={errors.mobile ? "border-red-500" : ""}
                        />
                        {errors.mobile && <p className="text-sm text-red-500">{errors.mobile}</p>}
                        <p className="text-xs text-gray-500">Format: +91 followed by 10 digits with space after 5th digit</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email ID</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fatherName">Father's Name</Label>
                        <Input
                          id="fatherName"
                          placeholder="Enter father's name"
                          value={formData.fatherName}
                          onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="motherName">Mother's Name</Label>
                        <Input
                          id="motherName"
                          placeholder="Enter mother's name"
                          value={formData.motherName}
                          onChange={(e) => setFormData({...formData, motherName: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">Important Note</h4>
                      <p className="text-sm text-orange-700">
                        This person will be added to your family tree and will need to be verified by our admin team. 
                        They will receive a unique login ID once verified and can then access the platform.
                      </p>
                    </div>

                    <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700">
                      Add Family Member for Verification
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="existing" className="mt-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="searchLoginId">Search by Login ID *</Label>
                      <Input
                        id="searchLoginId"
                        placeholder="Enter citizen's login ID (e.g., BV123456)"
                        value={formData.searchLoginId}
                        onChange={(e) => setFormData({...formData, searchLoginId: e.target.value})}
                        className={errors.searchLoginId ? "border-red-500" : ""}
                      />
                      {errors.searchLoginId && <p className="text-sm text-red-500">{errors.searchLoginId}</p>}
                      <p className="text-xs text-gray-500">Login ID format: BVC followed by 6 digits</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="relationExisting">Relationship to You *</Label>
                      <Select value={formData.relation} onValueChange={(value) => setFormData({...formData, relation: value})}>
                        <SelectTrigger className={errors.relation ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {relations.map((relation) => (
                            <SelectItem key={relation} value={relation.toLowerCase()}>
                              {relation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.relation && <p className="text-sm text-red-500">{errors.relation}</p>}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">How it works</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Search for an existing verified citizen by their login ID</li>
                        <li>• Send them an invitation to join your family tree</li>
                        <li>• Once they accept, your family trees will be merged</li>
                        <li>• Both families will see the complete connected tree</li>
                      </ul>
                    </div>

                    <Button 
                      onClick={handleSearchExisting}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Send Family Tree Invitation
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

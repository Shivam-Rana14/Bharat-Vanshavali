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
import { DEFAULTS } from "@/lib/constants"

export default function AddMemberPage() {
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    placeOfBirth: "",
    mobile: "",
    email: "",
    gender: "",
    occupation: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const userType = localStorage.getItem("userType")
    if (userType !== "citizen") {
      router.push("/login")
    }
  }, [router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required"
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters long"
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      try {
        setLoading(true)
        
        // Create a new user account for this family member
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: formData.name,
            email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@${process.env.NEXT_PUBLIC_TEMP_EMAIL_DOMAIN || DEFAULTS.TEMP_EMAIL_DOMAIN}`,
            password: process.env.NEXT_PUBLIC_DEFAULT_TEMP_PASSWORD || DEFAULTS.TEMP_PASSWORD, // Temporary password - user can change later
            phone: formData.mobile,
            dateOfBirth: formData.dateOfBirth,
            placeOfBirth: formData.placeOfBirth,
            gender: formData.gender,
            familyCode: localStorage.getItem('userFamilyCode') || '', // Join current user's family
            relationship: 'member' // Generic relationship - root will connect them properly
          }),
        })

        if (response.ok) {
          const data = await response.json()
          toast({
            title: "Family Member Added",
            description: `${formData.name} has been added as an unconnected node. The root member can now connect them in the family tree.`,
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


  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Add New Family Member</CardTitle>
              <CardDescription>
                Add a new person to your family. They will appear as an unconnected node that the root member can connect in the family tree.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
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
                </div>

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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email ID</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com (optional)"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    placeholder="Enter occupation (optional)"
                    value={formData.occupation}
                    onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">How it works</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• This person will be added as an unconnected node in your family tree</li>
                    <li>• The root member can then drag and connect them to establish relationships</li>
                    <li>• They will receive login credentials to access their account</li>
                    <li>• All family members can view the complete family tree</li>
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

"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { TreePine, Shield, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { validateRegistrationForm, formatPhoneNumber, cleanPhoneNumber } from "@/lib/validation"
import { useFormPersistence, useNetworkStatus } from "@/lib/form-persistence"
import { useToast } from "@/hooks/use-toast"
import { useLoading } from "@/components/providers/loading-provider"
import { LocationInput } from "@/components/ui/location-input"

interface FormData {
  // Personal Details
  fullName: string
  dateOfBirth: string
  gender: string
  placeOfBirth: string
  mobile: string
  email: string
  password: string
  confirmPassword: string

  // Additional Details
  nativePlace: string
  caste: string
  reference1Name: string
  reference1Mobile: string
  reference2Name: string
  reference2Mobile: string

  // Family Details
  familyCode: string
  relationship: string

  // Documents
  aadhaarNumber: string
  panNumber: string

  // Verification
  termsAccepted: boolean
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    show: boolean
    familyCode?: string
    userName?: string
    loginId?: string
  }>({ show: false })
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const { isOnline } = useNetworkStatus()

  const [formData, setFormData] = useState<FormData>({
    // Personal Details
    fullName: "",
    dateOfBirth: "",
    gender: "",
    placeOfBirth: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",

    // Additional Details
    nativePlace: "",
    caste: "",
    reference1Name: "",
    reference1Mobile: "",
    reference2Name: "",
    reference2Mobile: "",

    // Family Details
    familyCode: "",
    relationship: "",

    // Documents
    aadhaarNumber: "",
    panNumber: "",

    // Verification
    termsAccepted: false
  })

  const totalSteps = 4
  const [showRelationship, setShowRelationship] = useState(false)

  // Check email uniqueness
  const checkEmailUniqueness = async () => {
    if (!formData.email) return

    try {
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', value: formData.email })
      })
      const data = await res.json()
      if (data.success && data.exists) {
        setErrors(prev => ({ ...prev, email: 'Email already registered' }))
      } else if (data.success && !data.exists) {
        // Clear error if it was "Email already registered"
        setErrors(prev => {
          const newErrors = { ...prev }
          if (newErrors.email === 'Email already registered') {
            delete newErrors.email
          }
          return newErrors
        })
      }
    } catch (error) {
      console.error('Email validation error:', error)
    }
  }

  // Check Aadhaar uniqueness
  const checkAadhaarUniqueness = async () => {
    if (!formData.aadhaarNumber || formData.aadhaarNumber.length !== 12) return

    try {
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'aadhaarNumber', value: formData.aadhaarNumber })
      })
      const data = await res.json()
      if (data.success && data.exists) {
        setErrors(prev => ({ ...prev, aadhaarNumber: 'Aadhaar number already registered' }))
      } else if (data.success && !data.exists) {
        setErrors(prev => {
          const newErrors = { ...prev }
          if (newErrors.aadhaarNumber === 'Aadhaar number already registered') {
            delete newErrors.aadhaarNumber
          }
          return newErrors
        })
      }
    } catch (error) {
      console.error('Aadhaar validation error:', error)
    }
  }

  // Check PAN uniqueness
  const checkPanUniqueness = async () => {
    if (!formData.panNumber || formData.panNumber.length !== 10) return

    try {
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'panNumber', value: formData.panNumber })
      })
      const data = await res.json()
      if (data.success && data.exists) {
        setErrors(prev => ({ ...prev, panNumber: 'PAN number already registered' }))
      } else if (data.success && !data.exists) {
        setErrors(prev => {
          const newErrors = { ...prev }
          if (newErrors.panNumber === 'PAN number already registered') {
            delete newErrors.panNumber
          }
          return newErrors
        })
      }
    } catch (error) {
      console.error('PAN validation error:', error)
    }
  }

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (currentStep === 1) {
      // Personal details validation
      const validation = validateRegistrationForm({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        fullName: formData.fullName,
        phone: formData.mobile,
        dateOfBirth: formData.dateOfBirth,
        reference1Name: formData.reference1Name,
        reference1Phone: formData.reference1Mobile,
        reference2Name: formData.reference2Name,
        reference2Phone: formData.reference2Mobile
      })

      // Only check required fields for step 1
      const requiredFields = ['fullName', 'email', 'password', 'confirmPassword', 'phone']
      validation.errors.forEach(error => {
        if (requiredFields.includes(error.field)) {
          // Map phone error to mobile field
          const fieldName = error.field === 'phone' ? 'mobile' : error.field
          newErrors[fieldName] = error.message
        }
      })
    } else if (currentStep === 2) {
      // Step 2 validation (Family & References)
      if (!formData.reference1Name.trim()) {
        newErrors.reference1Name = 'Reference 1 Name is required'
      }
      if (!formData.reference1Mobile) {
        newErrors.reference1Mobile = 'Reference 1 Mobile is required'
      } else if (!/^[6-9]\d{9}$/.test(formData.reference1Mobile)) {
        newErrors.reference1Mobile = 'Invalid mobile number'
      }

      if (!formData.reference2Name.trim()) {
        newErrors.reference2Name = 'Reference 2 Name is required'
      }
      if (!formData.reference2Mobile) {
        newErrors.reference2Mobile = 'Reference 2 Mobile is required'
      } else if (!/^[6-9]\d{9}$/.test(formData.reference2Mobile)) {
        newErrors.reference2Mobile = 'Invalid mobile number'
      }
    } else if (currentStep === 3) {
      // Document validation
      if (!formData.aadhaarNumber) {
        newErrors.aadhaarNumber = 'Aadhaar number is required'
      } else if (!/^\d{12}$/.test(formData.aadhaarNumber)) {
        newErrors.aadhaarNumber = 'Aadhaar number must be 12 digits'
      }

      if (!formData.panNumber) {
        newErrors.panNumber = 'PAN number is required'
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
        newErrors.panNumber = 'Invalid PAN number format (e.g. ABCDE1234F)'
      }
    } else if (currentStep === 4) {
      // Final step - check terms
      if (!formData.termsAccepted) {
        newErrors.termsAccepted = 'You must accept the terms and conditions'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    const isValid = validateCurrentStep()

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)


      toast({
        title: "Step Completed!",
        description: `Moving to step ${currentStep + 1}`,
        variant: "success"
      })
    } else {
      toast({
        title: "Validation Failed",
        description: "Please fill in all required fields correctly",
        variant: "destructive"
      })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    // Final validation
    if (!validateCurrentStep()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive"
      })
      return
    }

    // Check network status
    if (!isOnline) {
      toast({
        title: "No Internet Connection",
        description: "Please check your connection and try again",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    showLoading("Creating your account...")

    try {
      const submitFormData = new FormData()

      // Add all form fields with proper cleaning
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          if (key === 'confirmPassword') return // don't send confirmPassword

          if (key === 'mobile' || key.includes('Mobile')) {
            // Clean phone numbers
            submitFormData.append(key, cleanPhoneNumber(value.toString()))
          } else if (key === 'email') {
            // Clean email
            submitFormData.append(key, value.toString().toLowerCase().trim())
          } else {
            submitFormData.append(key, value.toString())
          }
        }
      })

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: submitFormData,
      })

      const result = await response.json()

      if (result.success) {
        // Show success with family code
        const familyCode = result.user?.familyCode

        toast({
          title: "🎉 Registration Successful!",
          description: `Your unique Login ID: ${familyCode}. Please save this!`,
          variant: "success",
          duration: 10000 // Show longer for important info
        })

        // Set success state to show family code prominently
        setRegistrationSuccess({
          show: true,
          familyCode: familyCode,
          userName: result.user?.name,
          loginId: result.user?.loginId
        })



      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Registration failed:', error)
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : 'Network error. Please try again.',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
      hideLoading()
    }
  }

  // Success screen
  if (registrationSuccess.show) {
    return (
      <>
        <Navbar />
        <div
          className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        >
          <Card className="w-full max-w-lg bg-white shadow-2xl border-0">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 Welcome to Bharat Vanshavali!</h1>
                <p className="text-gray-600">Registration completed successfully</p>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6 text-orange-600 mr-2" />
                  <h2 className="text-lg font-semibold text-orange-800">Your Unique Login ID</h2>
                </div>
                <div className="bg-white rounded-lg p-4 border border-orange-300">
                  <p className="text-2xl font-mono font-bold text-orange-700 tracking-wider">
                    {registrationSuccess.loginId || registrationSuccess.familyCode}
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="font-medium">IMPORTANT: Save this Login ID safely!</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    You'll need this unique ID to login to your account. Write it down or save it securely.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">How to Login:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Use your <strong>Login ID</strong>: {registrationSuccess.loginId || registrationSuccess.familyCode}</p>
                  <p>• Or use your <strong>Email</strong>: {formData.email}</p>
                  <p>• With your chosen password</p>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Next Steps:</strong> Your account is pending admin verification.
                  You can login but some features will be limited until verification is complete.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(registrationSuccess.familyCode || '')
                    toast({
                      title: "Copied!",
                      description: "Login ID copied to clipboard",
                      variant: "success"
                    })
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  📋 Copy Login ID
                </Button>
                <Button
                  onClick={() => window.location.href = '/login'}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700"
                >
                  Continue to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-green-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center">
                <TreePine className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900">भारत वंशावली</h1>
                <p className="text-xs text-gray-600">Bharat Vanshavali Collective</p>
              </div>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900 mt-4">Verified Citizen Registration</h2>
            <p className="text-gray-600">Join India's trusted genealogy community</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step <= currentStep
                    ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                    }`}>
                    {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-1 mx-2 ${step < currentStep ? 'bg-gradient-to-r from-orange-500 to-green-600' : 'bg-gray-200'
                      }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Personal Information</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Provide your basic details for account creation
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Enter your full name"
                      className={errors.fullName ? "border-red-500" : ""}
                      required
                    />
                    {errors.fullName && (
                      <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
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
                    <LocationInput
                      value={formData.placeOfBirth}
                      onChange={(value) => setFormData({ ...formData, placeOfBirth: value })}
                      placeholder="City, State"
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="Enter 10-digit mobile number"
                      className={errors.mobile ? "border-red-500" : ""}
                      required
                    />
                    {errors.mobile && (
                      <p className="text-sm text-red-500 mt-1">{errors.mobile}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Enter 10-digit number starting with 6, 7, 8, or 9</p>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      className={errors.email ? "border-red-500" : ""}
                      onBlur={checkEmailUniqueness}
                      required
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter a secure password"
                        className={errors.password ? "border-red-500" : ""}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">At least 6 characters with letters and numbers</p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Re-enter password"
                        className={errors.confirmPassword ? "border-red-500" : ""}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Family & Additional Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <TreePine className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Family & Additional Information</p>
                      <p className="text-xs text-green-700 mt-1">
                        Join an existing family or create a new one
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="familyCode">Family Code (Optional)</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="familyCode"
                        type="text"
                        value={formData.familyCode}
                        onChange={(e) => setFormData({ ...formData, familyCode: e.target.value.toUpperCase() })}
                        placeholder="Enter family code"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          if (!formData.familyCode.trim()) return
                          const res = await fetch('/api/auth/validate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'familyCode', value: formData.familyCode.trim() })
                          })
                          const data = await res.json()
                          if (data.success && !data.exists) {
                            toast({ title: 'Invalid Code', description: 'Family code not found', variant: 'destructive' })
                            setFormData({ ...formData, relationship: '' })
                          } else if (data.success) {
                            toast({ title: 'Family Code Verified', description: data.message || 'Valid code', variant: 'success' })
                            // show relationship input
                            setShowRelationship(true)
                          }
                        }}
                      >Verify</Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Leave empty to create a new family tree. Enter an existing family code to join that family.
                    </p>

                    {showRelationship && (
                      <div className="mt-4">
                        <Label htmlFor="relationship">Your Role in Family</Label>
                        <Input
                          id="relationship"
                          type="text"
                          value={formData.relationship || ''}
                          onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                          placeholder="e.g., Son, Daughter, Brother, Sister"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This will help the root member connect you properly in the family tree
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="nativePlace">Native Place</Label>
                    <LocationInput
                      value={formData.nativePlace}
                      onChange={(value) => setFormData({ ...formData, nativePlace: value })}
                      placeholder="Search ancestral village or town"
                      className={errors.nativePlace ? "border-red-500" : ""}
                    />
                    {errors.nativePlace && (
                      <p className="text-sm text-red-500 mt-1">{errors.nativePlace}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="caste">Caste/Community</Label>
                    <Input
                      id="caste"
                      type="text"
                      value={formData.caste}
                      onChange={(e) => setFormData({ ...formData, caste: e.target.value })}
                      placeholder="Enter caste or community"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>References</Label>
                    <p className="text-xs text-yellow-600 mb-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                      <strong>Note:</strong> Please provide contacts of community friends or neighbors, NOT family members. These references may be used for verification if needed in the future. They will not be contacted immediately.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <Input
                          type="text"
                          value={formData.reference1Name}
                          onChange={(e) => setFormData({ ...formData, reference1Name: e.target.value })}
                          placeholder="Reference 1 Name"
                          className={errors.reference1Name ? "border-red-500" : ""}
                        />
                        {errors.reference1Name && (
                          <p className="text-sm text-red-500 mt-1">{errors.reference1Name}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          type="tel"
                          value={formData.reference1Mobile}
                          onChange={(e) => setFormData({ ...formData, reference1Mobile: e.target.value })}
                          placeholder="Reference 1 Mobile"
                          className={errors.reference1Mobile ? "border-red-500" : ""}
                        />
                        {errors.reference1Mobile && (
                          <p className="text-sm text-red-500 mt-1">{errors.reference1Mobile}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          type="text"
                          value={formData.reference2Name}
                          onChange={(e) => setFormData({ ...formData, reference2Name: e.target.value })}
                          placeholder="Reference 2 Name"
                          className={errors.reference2Name ? "border-red-500" : ""}
                        />
                        {errors.reference2Name && (
                          <p className="text-sm text-red-500 mt-1">{errors.reference2Name}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          type="tel"
                          value={formData.reference2Mobile}
                          onChange={(e) => setFormData({ ...formData, reference2Mobile: e.target.value })}
                          placeholder="Reference 2 Mobile"
                          className={errors.reference2Mobile ? "border-red-500" : ""}
                        />
                        {errors.reference2Mobile && (
                          <p className="text-sm text-red-500 mt-1">{errors.reference2Mobile}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Document Verification */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Identity Verification</p>
                      <p className="text-xs text-orange-700 mt-1">
                        Provide your government issued identity details
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <Label htmlFor="aadhaarNumber">Aadhaar Number *</Label>
                    <Input
                      id="aadhaarNumber"
                      type="text"
                      value={formData.aadhaarNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 12)
                        setFormData({ ...formData, aadhaarNumber: value })
                      }}
                      onBlur={checkAadhaarUniqueness}
                      placeholder="Enter 12-digit Aadhaar Number"
                      className={errors.aadhaarNumber ? "border-red-500" : ""}
                    />
                    {errors.aadhaarNumber && (
                      <p className="text-sm text-red-500 mt-1">{errors.aadhaarNumber}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="panNumber">PAN Number *</Label>
                    <Input
                      id="panNumber"
                      type="text"
                      value={formData.panNumber}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().slice(0, 10)
                        setFormData({ ...formData, panNumber: value })
                      }}
                      onBlur={checkPanUniqueness}
                      placeholder="Enter 10-character PAN Number"
                      className={errors.panNumber ? "border-red-500" : ""}
                      maxLength={10}
                    />
                    {errors.panNumber && (
                      <p className="text-sm text-red-500 mt-1">{errors.panNumber}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Format: ABCDE1234F</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Terms & Conditions */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Terms & Conditions</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Please read and accept our terms of service to complete registration
                      </p>
                    </div>
                  </div>
                </div>

                <Card className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle>Terms of Service</CardTitle>
                    <CardDescription>Read to the bottom to accept</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="h-64 overflow-y-auto border rounded-md p-4 mb-4 text-sm text-gray-600 bg-gray-50"
                      onScroll={(e) => {
                        const element = e.currentTarget
                        if (Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 1) {
                          if (!formData.termsAccepted) {
                            setFormData({ ...formData, termsAccepted: true })
                            toast({
                              title: "Terms Accepted",
                              description: "You have scrolled to the bottom and accepted the terms.",
                              variant: "success"
                            })
                          }
                        }
                      }}
                    >
                      <p className="mb-4"><strong>1. Introduction</strong><br />Welcome to Bharat Vanshavali. By accessing our website, you agree to these terms and conditions.</p>
                      <p className="mb-4"><strong>2. Privacy Policy</strong><br />We value your privacy. Your personal data, including Aadhaar and PAN information, is stored securely and used only for identity verification purposes.</p>
                      <p className="mb-4"><strong>3. User Responsibilities</strong><br />You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
                      <p className="mb-4"><strong>4. Data Accuracy</strong><br />You certify that the information provided, including family details and identity proof, is accurate and true to the best of your knowledge.</p>
                      <p className="mb-4"><strong>5. Prohibited Activities</strong><br />You may not use the service for any illegal or unauthorized purpose. You must not transmit any worms or viruses or any code of a destructive nature.</p>
                      <p className="mb-4"><strong>6. Termination</strong><br />We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever.</p>
                      <p className="mb-4"><strong>7. Changes to Terms</strong><br />We reserve the right, at our sole discretion, to modify or replace these Terms at any time.</p>
                      <p className="mb-4"><strong>8. Contact Us</strong><br />If you have any questions about these Terms, please contact us.</p>
                      <p className="mb-4"><strong>9. Governing Law</strong><br />These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
                      <p><strong>10. Final Agreement</strong><br />By clicking "Complete Registration", you acknowledge that you have read, understood, and agree to be bound by these terms.</p>
                    </div>

                    <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg border">
                      <Checkbox
                        id="termsAccepted"
                        checked={formData.termsAccepted}
                        onCheckedChange={(checked) => setFormData({ ...formData, termsAccepted: checked as boolean })}
                        disabled={!formData.termsAccepted} // Only allow auto-tick via scroll
                        required
                      />
                      <Label htmlFor="termsAccepted" className="text-sm cursor-pointer">
                        I agree to the Terms of Service and Privacy Policy
                      </Label>
                    </div>
                    <p className="text-xs text-center text-gray-500 mt-2">
                      (Scroll to the bottom of the text above to enable acceptance)
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700"
                  disabled={!formData.termsAccepted}
                >
                  Complete Registration
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

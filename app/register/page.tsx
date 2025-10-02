"use client"

import { useEffect, useRef, useState } from "react"
import { usePersistentState } from "@/hooks/usePersistentState"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { TreePine, Upload, Camera, MapPin, Shield, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { validateRegistrationForm, formatPhoneNumber, cleanPhoneNumber } from "@/lib/validation"
import { useFormPersistence, useNetworkStatus } from "@/lib/form-persistence"
import { useToast } from "@/hooks/use-toast"
import { useLoading } from "@/components/providers/loading-provider"

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
  
  // Ancestral Details
  fatherName: string
  motherName: string
  grandfatherName: string
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
  aadhaarFile: File | null
  voterIdFile: File | null
  birthCertFile: File | null
  
  // Verification
  selfieFile: File | null
  latitude?: number | null
  longitude?: number | null
  locationConsent: boolean
  termsAccepted: boolean
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    show: boolean
    familyCode?: string
    userName?: string
  }>({ show: false })
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const { isOnline } = useNetworkStatus()
  const formPersistence = useFormPersistence('registration')
  const [formData, setFormData, clearForm] = usePersistentState<FormData>('registerForm', {
    // Personal Details
    fullName: "",
    dateOfBirth: "",
    gender: "",
    placeOfBirth: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    
    // Ancestral Details
    fatherName: "",
    motherName: "",
    grandfatherName: "",
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
    aadhaarFile: null,
    voterIdFile: null,
    birthCertFile: null,
    
    // Verification
    selfieFile: null,
    latitude: null,
    longitude: null,
    locationConsent: false,
    termsAccepted: false
  })

  const totalSteps = 4
  const [showRelationship, setShowRelationship] = useState(false)

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
        fatherName: formData.fatherName,
        motherName: formData.motherName,
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
      // Auto-save form data
      formPersistence.autoSave(formData)
      
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
          if (value instanceof File) {
            submitFormData.append(key, value)
          } else if (key === 'mobile' || key.includes('Mobile')) {
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
          userName: result.user?.name
        })
        
        clearForm() // clear persisted draft
        formPersistence.clearForm()
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

  // Camera controls
  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play()
            setCameraActive(true)
          } catch (playErr) {
            console.error('Video play failed', playErr)
          }
        }
      }
    } catch (err: any) {
      console.error('Camera access error:', err)
      if (err?.name === 'NotAllowedError') {
        alert('Camera permission is denied. Please enable it in your browser settings and reload the page.')
      } else if (err?.name === 'NotFoundError') {
        alert('No camera device found.')
      } else if (err?.name === 'NotReadableError') {
        alert('Camera is already in use by another application.')
      } else {
        alert('Unable to access camera. Error: ' + (err?.message || 'Unknown'))
      }
    }
  }

  const captureSelfie = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    
    const width = video.videoWidth
    const height = video.videoHeight
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Draw the current video frame to canvas
    ctx.drawImage(video, 0, 0, width, height)
    
    // Get the image data as base64 for preview
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setSelfiePreview(imageDataUrl)
    
    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
        setFormData({ ...formData, selfieFile: file })
        stopCamera()
        
        toast({
          title: "Selfie Captured!",
          description: "Your selfie has been captured successfully.",
          variant: "success"
        })
      }
    }, 'image/jpeg', 0.9)
  }

  const stopCamera = () => {
    const video = videoRef.current
    if (video && video.srcObject) {
      const tracks = (video.srcObject as MediaStream).getTracks()
      tracks.forEach((t) => t.stop())
      setCameraActive(false)
    }
  }

  const requestLocation = () => {
    if (!formData.locationConsent) {
      alert('Please consent to share your location first.')
      return
    }
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData({
          ...formData,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      (err) => {
        alert('Failed to fetch location: ' + err.message)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep 
                      ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-gradient-to-r from-orange-500 to-green-600' : 'bg-gray-200'
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
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender *</Label>
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

                  <div>
                    <Label htmlFor="placeOfBirth">Place of Birth</Label>
                    <Input
                      id="placeOfBirth"
                      type="text"
                      value={formData.placeOfBirth}
                      onChange={(e) => setFormData({...formData, placeOfBirth: e.target.value})}
                      placeholder="City, State"
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email address"
                      className={errors.email ? "border-red-500" : ""}
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
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
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

            {/* Step 2: Ancestral Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <TreePine className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Ancestral Information</p>
                      <p className="text-xs text-green-700 mt-1">
                        Help us connect you with your family lineage
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fatherName">Father's Name</Label>
                    <Input
                      id="fatherName"
                      type="text"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                      placeholder="Enter father's name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="motherName">Mother's Name</Label>
                    <Input
                      id="motherName"
                      type="text"
                      value={formData.motherName}
                      onChange={(e) => setFormData({...formData, motherName: e.target.value})}
                      placeholder="Enter mother's name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="grandfatherName">Grandfather's Name</Label>
                    <Input
                      id="grandfatherName"
                      type="text"
                      value={formData.grandfatherName}
                      onChange={(e) => setFormData({...formData, grandfatherName: e.target.value})}
                      placeholder="Enter grandfather's name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="nativePlace">Native Place</Label>
                    <Input
                      id="nativePlace"
                      type="text"
                      value={formData.nativePlace}
                      onChange={(e) => setFormData({...formData, nativePlace: e.target.value})}
                      placeholder="Village/City, State"
                    />
                  </div>

                  <div>
                    <Label htmlFor="caste">Caste/Community</Label>
                    <Input
                      id="caste"
                      type="text"
                      value={formData.caste}
                      onChange={(e) => setFormData({...formData, caste: e.target.value})}
                      placeholder="Enter caste or community"
                    />
                  </div>

                  <div>
                    <Label htmlFor="familyCode">Family Code (Optional)</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="familyCode"
                        type="text"
                        value={formData.familyCode}
                        onChange={(e) => setFormData({...formData, familyCode: e.target.value.toUpperCase()})}
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
                        <Label htmlFor="relationship">Relationship to Root *</Label>
                        <Input
                          id="relationship"
                          type="text"
                          value={formData.relationship || ''}
                          onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                          placeholder="e.g., Son, Daughter, Grandson"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label>References</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <Input
                          type="text"
                          value={formData.reference1Name}
                          onChange={(e) => setFormData({...formData, reference1Name: e.target.value})}
                          placeholder="Reference 1 Name"
                        />
                      </div>
                      <div>
                        <Input
                          type="tel"
                          value={formData.reference1Mobile}
                          onChange={(e) => setFormData({...formData, reference1Mobile: e.target.value})}
                          placeholder="Reference 1 Mobile"
                        />
                      </div>
                      <div>
                        <Input
                          type="text"
                          value={formData.reference2Name}
                          onChange={(e) => setFormData({...formData, reference2Name: e.target.value})}
                          placeholder="Reference 2 Name"
                        />
                      </div>
                      <div>
                        <Input
                          type="tel"
                          value={formData.reference2Mobile}
                          onChange={(e) => setFormData({...formData, reference2Mobile: e.target.value})}
                          placeholder="Reference 2 Mobile"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Document Upload */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Upload className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Document Verification</p>
                      <p className="text-xs text-orange-700 mt-1">
                        Upload required documents for identity verification
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-2 border-dashed border-orange-200 hover:border-orange-300 transition-colors">
                    <CardHeader className="text-center">
                      <Badge className="w-fit mx-auto mb-2 bg-orange-100 text-orange-800">Required</Badge>
                      <CardTitle className="text-lg">Aadhaar Card</CardTitle>
                      <CardDescription>Government issued identity proof</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="mb-2"
                        onChange={(e) => setFormData({...formData, aadhaarFile: e.target.files?.[0] || null})}
                      />
                      <p className="text-xs text-gray-600">PDF, JPG, PNG (Max 5MB)</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-gray-200 hover:border-orange-300 transition-colors">
                    <CardHeader className="text-center">
                      <Badge className="w-fit mx-auto mb-2 bg-red-100 text-red-800">Required</Badge>
                      <CardTitle className="text-lg">Voter ID / Passport</CardTitle>
                      <CardDescription>Citizenship verification</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="mb-2"
                        onChange={(e) => setFormData({...formData, voterIdFile: e.target.files?.[0] || null})}
                      />
                      <p className="text-xs text-gray-600">PDF, JPG, PNG (Max 5MB)</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-gray-200 hover:border-green-300 transition-colors">
                    <CardHeader className="text-center">
                      <Badge className="w-fit mx-auto mb-2 bg-green-100 text-green-800">Optional</Badge>
                      <CardTitle className="text-lg">Birth Certificate</CardTitle>
                      <CardDescription>Additional verification</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="mb-2"
                        onChange={(e) => setFormData({...formData, birthCertFile: e.target.files?.[0] || null})}
                      />
                      <p className="text-xs text-gray-600">PDF, JPG, PNG (Max 5MB)</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-gray-200 hover:border-green-300 transition-colors">
                    <CardHeader className="text-center">
                      <Badge className="w-fit mx-auto mb-2 bg-green-100 text-green-800">Optional</Badge>
                      <CardTitle className="text-lg">Other Documents</CardTitle>
                      <CardDescription>Ration card, domicile certificate</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="mb-2"
                      />
                      <p className="text-xs text-gray-600">PDF, JPG, PNG (Max 5MB)</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 4: Verification */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Camera className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-800">Final Verification Steps</p>
                      <p className="text-xs text-purple-700 mt-1">
                        Complete these steps to verify your identity and activate your account
                      </p>
                    </div>
                  </div>
                </div>

                <Card className="border-2 border-dashed border-purple-200">
                  <CardHeader className="text-center">
                    <Camera className="w-12 h-12 text-purple-500 mx-auto mb-2" />
                    <CardTitle>Live Selfie Verification</CardTitle>
                    <CardDescription>Take a clear selfie for face matching with your ID</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="flex flex-col items-center space-y-3 mb-4">
                      {!cameraActive ? (
                        <Button variant="outline" onClick={startCamera}>
                          <Camera className="w-4 h-4 mr-2" />
                          Start Camera
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Button type="button" variant="outline" onClick={captureSelfie}>
                            <Camera className="w-4 h-4 mr-2" />
                            Capture Selfie
                          </Button>
                          <Button type="button" variant="ghost" onClick={stopCamera}>Stop</Button>
                        </div>
                      )}
                      {/* Video feed when camera is active */}
                      {cameraActive && (
                        <video ref={videoRef} className="w-full max-w-xs rounded border" autoPlay playsInline muted />
                      )}
                      
                      {/* Selfie preview when captured */}
                      {selfiePreview && !cameraActive && (
                        <div className="flex flex-col items-center space-y-2">
                          <img 
                            src={selfiePreview} 
                            alt="Captured selfie" 
                            className="w-full max-w-xs rounded border"
                          />
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <p className="text-sm text-green-700">Selfie captured successfully!</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { 
                              setFormData({ ...formData, selfieFile: null })
                              setSelfiePreview(null)
                              startCamera()
                            }}
                          >
                            Retake Selfie
                          </Button>
                        </div>
                      )}
                      
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="mt-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          if (file) {
                            stopCamera()
                            setFormData({ ...formData, selfieFile: file })
                            
                            // Create preview for uploaded file
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              setSelfiePreview(e.target?.result as string)
                            }
                            reader.readAsDataURL(file)
                            
                            toast({
                              title: "Selfie Uploaded!",
                              description: "Your selfie has been uploaded successfully.",
                              variant: "success"
                            })
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Ensure good lighting and look directly at the camera
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed border-green-200">
                  <CardHeader className="text-center">
                    <MapPin className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <CardTitle>Location Verification</CardTitle>
                    <CardDescription>Verify your current location for security</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="flex items-center justify-center space-x-4 mb-4">
                      <Checkbox
                        id="locationConsent"
                        checked={formData.locationConsent}
                        onCheckedChange={(checked) => setFormData({...formData, locationConsent: checked as boolean})}
                      />
                      <Label htmlFor="locationConsent" className="text-sm">
                        I consent to share my location for verification
                      </Label>
                    </div>
                    <Button variant="outline" type="button" onClick={requestLocation}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Verify Location
                    </Button>
                    {(formData.latitude && formData.longitude) && (
                      <p className="text-xs text-green-700 mt-2">Location captured: {formData.latitude?.toFixed(5)}, {formData.longitude?.toFixed(5)} ✓</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed border-blue-200">
                  <CardHeader className="text-center">
                    <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                    <CardTitle>Terms & Conditions</CardTitle>
                    <CardDescription>Review and accept our terms of service</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="flex items-center justify-center space-x-4 mb-4">
                      <Checkbox
                        id="termsAccepted"
                        checked={formData.termsAccepted}
                        onCheckedChange={(checked) => setFormData({...formData, termsAccepted: checked as boolean})}
                        required
                      />
                      <Label htmlFor="termsAccepted" className="text-sm">
                        I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                      </Label>
                    </div>
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

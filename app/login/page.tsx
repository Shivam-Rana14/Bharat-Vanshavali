"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TreePine, Eye, EyeOff, User, Shield } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { useLoading } from "@/components/providers/loading-provider"
import { useToast } from "@/hooks/use-toast"
import { Navbar } from "@/components/layout/navbar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { validateLoginForm } from "@/lib/validation"
import { useNetworkStatus } from "@/lib/form-persistence"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loginType, setLoginType] = useState("citizen")
  const [formData, setFormData] = useState({
    loginId: "",
    password: ""
  })
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { login, user, isLoading } = useAuth()
  const { showLoading, hideLoading } = useLoading()
  const { toast } = useToast()
  const { isOnline } = useNetworkStatus()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      const target = user.type === 'admin' ? '/admin/dashboard' : '/citizen/dashboard'
      router.replace(target)
    }
  }, [user, isLoading, router])

  // No extra redirect spinner; if a user sneaks through it will be cleared

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    // Validate form
    const validation = validateLoginForm(formData)
    if (!validation.isValid) {
      const newErrors: { [key: string]: string } = {}
      validation.errors.forEach(error => {
        newErrors[error.field] = error.message
      })
      setErrors(newErrors)
      return
    }
    
    // Clear previous errors
    setErrors({})
    
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
    showLoading("Authenticating...")
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginId: formData.loginId.trim(),
          password: formData.password,
          userType: loginType
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Set user in auth context
        login(result.user)
        
        // Redirect immediately – toast will flash quickly but avoid cookie race
        if (result.user.type === 'admin') {
          window.location.href = '/admin/dashboard'
        } else {
          window.location.href = '/citizen/dashboard'
        }
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid credentials",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "Login Failed",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
      hideLoading()
    }
  }


  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
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
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={loginType} onValueChange={setLoginType} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="citizen" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Citizen</span>
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginId">
                    {loginType === "admin" ? "Admin ID" : "Login ID or Email"}
                  </Label>
                  <Input
                    id="loginId"
                    type="text"
                    placeholder={loginType === "admin" ? "Enter admin ID" : "Enter your Login ID (e.g., BV123456) or Email"}
                    value={formData.loginId}
                    onChange={(e) => setFormData({...formData, loginId: e.target.value})}
                    className={errors.loginId ? "border-red-500" : ""}
                    required
                  />
                  {errors.loginId && (
                    <p className="text-sm text-red-500 mt-1">{errors.loginId}</p>
                  )}
                  {loginType === "citizen" && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        💡 You can use either your <strong>unique Login ID</strong> (like BV123456) or your <strong>email address</strong>
                      </p>
                      <p className="text-xs text-blue-600">
                        📧 Your Login ID was provided after registration - check your records!
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                </div>

                <div className="flex items-center justify-between">
                  <Link href="#" className="text-sm text-orange-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !isOnline}
                  className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Signing In..." : `Sign In as ${loginType === "admin" ? "Admin" : "Citizen"}`}
                </Button>
                
                {!isOnline && (
                  <div className="text-center text-sm text-red-500 mt-2">
                    No internet connection. Please check your connection.
                  </div>
                )}
              </form>


              {loginType === "citizen" && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-orange-600 hover:underline font-medium">
                      Register as a verified citizen
                    </Link>
                  </p>
                </div>
              )}

            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-orange-600">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

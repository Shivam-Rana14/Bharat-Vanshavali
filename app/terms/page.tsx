"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, Shield, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-600">Rules and guidelines for using our platform</p>
            <p className="text-sm text-gray-500 mt-2">Last updated: January 2024</p>
          </div>

          {/* Key Points */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Verified Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">All members must complete identity verification</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Respectful Interaction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Maintain respectful communication with all members</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Accurate Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Provide truthful and accurate family information</p>
              </CardContent>
            </Card>
          </div>

          {/* Terms Sections */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-orange-500" />
                  User Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    You Must
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-6">
                    <li>• Provide accurate personal and family information</li>
                    <li>• Complete identity verification with valid documents</li>
                    <li>• Respect other users' privacy and data</li>
                    <li>• Use the platform for legitimate genealogy purposes</li>
                    <li>• Report any suspicious or inappropriate behavior</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <XCircle className="w-4 h-4 mr-2 text-red-500" />
                    You Must Not
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-6">
                    <li>• Create fake profiles or provide false information</li>
                    <li>• Harass, threaten, or abuse other users</li>
                    <li>• Share inappropriate or offensive content</li>
                    <li>• Attempt to access other users' private data</li>
                    <li>• Use the platform for commercial purposes without permission</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-500" />
                  Financial Assistance Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Eligibility</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Must be a verified family member for at least 6 months</li>
                    <li>• Must have contributed to the community fund</li>
                    <li>• Assistance is for genuine emergencies only</li>
                    <li>• Subject to community review and approval</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Contribution Guidelines</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Contributions are voluntary and non-refundable</li>
                    <li>• All transactions are transparent and recorded</li>
                    <li>• Funds are held in secure, audited accounts</li>
                    <li>• Regular financial reports are provided to members</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  Content and Data Ownership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Your Content</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• You retain ownership of your personal information</li>
                    <li>• You grant us license to display your family tree data</li>
                    <li>• You can delete your content at any time</li>
                    <li>• Shared family data may remain for other family members</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Platform Content</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Historical records and archives remain our property</li>
                    <li>• Software and platform features are protected by copyright</li>
                    <li>• You may not copy or redistribute platform content</li>
                    <li>• Fair use applies for personal genealogy research</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                  Account Termination
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">We May Terminate Your Account If</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• You violate these terms of service</li>
                    <li>• You provide false information during verification</li>
                    <li>• You engage in harassment or abusive behavior</li>
                    <li>• You attempt to defraud the financial assistance system</li>
                    <li>• Your account remains inactive for over 2 years</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Upon Termination</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• You lose access to your account and data</li>
                    <li>• Shared family data may remain for other members</li>
                    <li>• Financial contributions are non-refundable</li>
                    <li>• You may request data export before termination</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us About Terms</CardTitle>
                <CardDescription>
                  If you have questions about these terms of service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> legal@bharatvanshavali.org</p>
                  <p><strong>Phone:</strong> +91 1800-123-4567</p>
                  <p><strong>Address:</strong> Bharat Vanshavali Collective, New Delhi, India</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

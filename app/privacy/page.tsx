"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Eye, Database, UserCheck, AlertTriangle } from 'lucide-react'
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600">How we protect and handle your personal information</p>
            <p className="text-sm text-gray-500 mt-2">Last updated: January 2024</p>
          </div>

          {/* Privacy Principles */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardHeader>
                <Lock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Data Encryption</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">All personal data is encrypted both in transit and at rest</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Eye className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Clear information about what data we collect and why</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <UserCheck className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <CardTitle className="text-lg">User Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">You control who can see your information and family tree</p>
              </CardContent>
            </Card>
          </div>

          {/* Privacy Sections */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2 text-orange-500" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Name, date of birth, place of birth</li>
                    <li>• Contact information (phone, email)</li>
                    <li>• Government document details for verification</li>
                    <li>• Family relationship information</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Family Tree Data</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Ancestral names and relationships</li>
                    <li>• Historical family information</li>
                    <li>• Photos and stories (optional)</li>
                    <li>• Location and migration data</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-500" />
                  How We Protect Your Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Security Measures</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• End-to-end encryption for sensitive data</li>
                    <li>• Secure servers with regular security audits</li>
                    <li>• Multi-factor authentication for accounts</li>
                    <li>• Regular data backups and disaster recovery</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Access Controls</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Individual privacy settings for each family member</li>
                    <li>• Option to keep certain branches private</li>
                    <li>• Granular permissions for family tree editing</li>
                    <li>• Verified user access only</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-blue-500" />
                  Your Privacy Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Data Control</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Right to access your personal data</li>
                    <li>• Right to correct inaccurate information</li>
                    <li>• Right to delete your account and data</li>
                    <li>• Right to export your family tree data</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Communication Preferences</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Control over email notifications</li>
                    <li>• Opt-out of marketing communications</li>
                    <li>• Choose how family members can contact you</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                  Data Sharing and Disclosure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">We Never Share</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Personal information with advertisers</li>
                    <li>• Financial assistance details publicly</li>
                    <li>• Private family information without consent</li>
                    <li>• Government documents or verification details</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Limited Sharing</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• With verified family members (as per your settings)</li>
                    <li>• Aggregated, anonymized data for research</li>
                    <li>• Legal compliance when required by law</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us About Privacy</CardTitle>
                <CardDescription>
                  If you have questions about this privacy policy or your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> privacy@bharatvanshavali.org</p>
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

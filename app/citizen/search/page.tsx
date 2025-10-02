"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { FamilySearch } from "@/components/ui/family-search"
import { useAuth } from "@/components/providers/auth-provider"
import { Search } from 'lucide-react'

export default function SearchPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.type !== "citizen") {
      router.push("/login")
      return
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Search Family Members
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find and discover family members in your family tree. Use the search and filters to narrow down your results.
            </p>
          </div>

          {/* Search Component */}
          <div className="max-w-4xl mx-auto">
            <FamilySearch
              onMemberSelect={(member) => {
                // Navigate to member details or show modal
                console.log('Selected member:', member)
              }}
              showFilters={true}
            />
          </div>
        </div>
      </div>
    </>
  )
}
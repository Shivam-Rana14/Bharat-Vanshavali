"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { useAuth } from "@/components/providers/auth-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import NodeFamilyTree from "@/components/family-tree/NodeFamilyTree"

export default function FamilyTreePage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in and has a family code
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!user.familyCode) {
      router.push('/citizen/dashboard')
      return
    }
  }, [user, router])

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading..." />
        </div>
      </>
    )
  }

  if (!user.familyCode) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Family Tree Found</h2>
            <p className="text-gray-500 mb-4">You need to join or create a family to view the family tree.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <NodeFamilyTree familyCode={user.familyCode} />
    </>
  )
}

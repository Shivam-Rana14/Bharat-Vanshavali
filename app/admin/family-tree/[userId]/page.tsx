"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TreePine, ArrowLeft, User, CheckCircle, Clock, Shield } from 'lucide-react'
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"

// DEVELOPMENT ONLY - Extended Mock Family Tree Data for Admin View
const adminFamilyTreeData = {
  id: "root",
  name: "Amit Patel",
  relation: "Root User",
  status: "verified",
  loginId: "BVC001100",
  verifiedAt: "2024-01-10",
  dateOfBirth: "1985-07-12",
  placeOfBirth: "Ahmedabad, Gujarat",
  mobile: "+91 9876543100",
  email: "amit.patel@email.com",
  spouse: {
    id: "spouse",
    name: "Priya Patel",
    relation: "Spouse",
    status: "verified",
    loginId: "BVC001101",
    verifiedAt: "2024-01-12",
    dateOfBirth: "1987-11-30",
    placeOfBirth: "Surat, Gujarat",
    mobile: "+91 9876543101",
    email: "priya.patel@email.com"
  },
  parents: [
    {
      id: "father",
      name: "Kishore Patel",
      relation: "Father",
      status: "verified",
      loginId: "BVC001102",
      verifiedAt: "2024-01-08",
      dateOfBirth: "1955-03-20",
      placeOfBirth: "Ahmedabad, Gujarat",
      mobile: "+91 9876543102",
      spouse: {
        id: "mother",
        name: "Kiran Patel",
        relation: "Mother",
        status: "pending",
        loginId: "BVC001103",
        submittedAt: "2024-01-20",
        dateOfBirth: "1960-08-15",
        placeOfBirth: "Vadodara, Gujarat",
        mobile: "+91 9876543103"
      }
    }
  ],
  grandparents: [
    {
      id: "grandfather_paternal",
      name: "Ramesh Patel",
      relation: "Grandfather (Paternal)",
      status: "verified",
      loginId: "BVC001108",
      verifiedAt: "2024-01-05",
      dateOfBirth: "1930-12-10",
      placeOfBirth: "Ahmedabad, Gujarat",
      spouse: {
        id: "grandmother_paternal",
        name: "Sushma Patel",
        relation: "Grandmother (Paternal)",
        status: "verified",
        loginId: "BVC001109",
        verifiedAt: "2024-01-06",
        dateOfBirth: "1935-05-25",
        placeOfBirth: "Ahmedabad, Gujarat"
      }
    }
  ],
  children: [
    {
      id: "child1",
      name: "Arjun Patel",
      relation: "Son",
      status: "verified",
      loginId: "BVC001104",
      verifiedAt: "2024-01-15",
      dateOfBirth: "2010-04-18",
      placeOfBirth: "Ahmedabad, Gujarat"
    },
    {
      id: "child2",
      name: "Kavya Patel",
      relation: "Daughter",
      status: "pending",
      loginId: "BVC001105",
      submittedAt: "2024-01-18",
      dateOfBirth: "2013-09-22",
      placeOfBirth: "Ahmedabad, Gujarat"
    }
  ],
  siblings: [
    {
      id: "brother",
      name: "Rohit Patel",
      relation: "Brother",
      status: "verified",
      loginId: "BVC001106",
      verifiedAt: "2024-01-14",
      dateOfBirth: "1988-02-14",
      placeOfBirth: "Ahmedabad, Gujarat"
    }
  ]
}

function AdminFamilyMemberCard({ member }: any) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{member.name}</CardTitle>
              <CardDescription>{member.relation}</CardDescription>
            </div>
          </div>
          <Badge className={member.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
            {member.status === 'verified' ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          <p><strong>Login ID:</strong> {member.loginId}</p>
          {member.dateOfBirth && <p><strong>DOB:</strong> {member.dateOfBirth}</p>}
          {member.placeOfBirth && <p><strong>Place:</strong> {member.placeOfBirth}</p>}
          {member.mobile && <p><strong>Mobile:</strong> {member.mobile}</p>}
          {member.email && <p><strong>Email:</strong> {member.email}</p>}
          {member.verifiedAt && (
            <p><strong>Verified:</strong> {member.verifiedAt}</p>
          )}
          {member.submittedAt && (
            <p><strong>Submitted:</strong> {member.submittedAt}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminFamilyTreePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId

  useEffect(() => {
    const userType = localStorage.getItem("userType")
    if (userType !== "admin") {
      router.push("/login")
    }
  }, [router])

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Family Tree for User: {userId}</CardTitle>
              <CardDescription>
                Complete family tree view with verification status for each member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Root User:</strong> {adminFamilyTreeData.name}
                </div>
                <div>
                  <strong>Family Code:</strong> FAM100
                </div>
                <div>
                  <strong>Total Members:</strong> 9
                </div>
                <div>
                  <strong>Verified Members:</strong> 7
                </div>
                <div>
                  <strong>Pending Verification:</strong> 2
                </div>
                <div>
                  <strong>Generations:</strong> 3
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Root User */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Root User</h2>
            <div className="max-w-md mx-auto">
              <AdminFamilyMemberCard member={adminFamilyTreeData} />
            </div>
          </div>

          {/* Spouse */}
          {adminFamilyTreeData.spouse && (
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Spouse</h2>
              <div className="max-w-md mx-auto">
                <AdminFamilyMemberCard member={adminFamilyTreeData.spouse} />
              </div>
            </div>
          )}

          {/* Parents */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-center mb-6">Parents</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {adminFamilyTreeData.parents.map((parent) => (
                <div key={parent.id}>
                  <AdminFamilyMemberCard member={parent} />
                  {parent.spouse && (
                    <div className="mt-4">
                      <AdminFamilyMemberCard member={parent.spouse} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Grandparents */}
          {adminFamilyTreeData.grandparents && adminFamilyTreeData.grandparents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-center mb-6">Grandparents</h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {adminFamilyTreeData.grandparents.map((grandparent) => (
                  <div key={grandparent.id}>
                    <AdminFamilyMemberCard member={grandparent} />
                    {grandparent.spouse && (
                      <div className="mt-4">
                        <AdminFamilyMemberCard member={grandparent.spouse} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Children */}
          {adminFamilyTreeData.children.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-center mb-6">Children</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {adminFamilyTreeData.children.map((child) => (
                  <AdminFamilyMemberCard key={child.id} member={child} />
                ))}
              </div>
            </div>
          )}

          {/* Family Relationships Summary */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Verified Family Relationships</CardTitle>
              <CardDescription>
                Cross-referenced relationships between verified family members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Amit Patel</strong> is the <strong>Son</strong> of <strong>Kishore Patel</strong> ✓</p>
                <p><strong>Kishore Patel</strong> is the <strong>Father</strong> of <strong>Amit Patel</strong> ✓</p>
                <p><strong>Priya Patel</strong> is the <strong>Spouse</strong> of <strong>Amit Patel</strong> ✓</p>
                <p><strong>Arjun Patel</strong> is the <strong>Son</strong> of <strong>Amit Patel</strong> ✓</p>
                <p><strong>Kavya Patel</strong> is the <strong>Daughter</strong> of <strong>Amit Patel</strong> (Pending Verification)</p>
                <p><strong>Kiran Patel</strong> is the <strong>Mother</strong> of <strong>Amit Patel</strong> (Pending Verification)</p>
                <p><strong>Rohit Patel</strong> is the <strong>Brother</strong> of <strong>Amit Patel</strong> ✓</p>
                <p><strong>Ramesh Patel</strong> is the <strong>Grandfather</strong> of <strong>Amit Patel</strong> ✓</p>
                <p><strong>Amit Patel</strong> is the <strong>Grandson</strong> of <strong>Ramesh Patel</strong> ✓</p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>
                Administrative actions for this family tree
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Verify Pending Members</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <TreePine className="w-4 h-4" />
                  <span>Export Family Tree</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>View All Documents</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

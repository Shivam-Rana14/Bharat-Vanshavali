import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)

    return NextResponse.json(
      { success: false, error: 'Document uploads are temporarily disabled' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
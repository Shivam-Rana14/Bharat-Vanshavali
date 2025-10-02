import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'
import { Buffer } from 'buffer'

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const documentType = formData.get('documentType') as string
    const description = formData.get('description') as string
    const isPublic = formData.get('isPublic') === 'true'
    const familyMemberId = formData.get('familyMemberId') as string

    if (!file || !title || !documentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert file to base64 string instead of saving to disk
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64String = `data:${file.type};base64,${buffer.toString('base64')}`

    const document = await databaseService.uploadDocument(
      {
        title,
        documentType,
        description,
        fileData: base64String,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        isPublic,
        familyMemberId: familyMemberId || undefined
      },
      user.id
    )

    return NextResponse.json({ success: true, data: document })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
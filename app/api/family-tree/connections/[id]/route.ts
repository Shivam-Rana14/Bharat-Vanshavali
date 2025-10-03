import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(request)
    const { relationshipType, relationshipLabel } = await request.json()
    const connectionId = params.id

    if (!connectionId || !relationshipType || !relationshipLabel) {
      return NextResponse.json({ success: false, error: 'Missing required data' }, { status: 400 })
    }

    // Update the connection
    const updatedConnection = await databaseService.updateConnection(connectionId, {
      relationshipType,
      relationshipLabel
    }, user.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Relationship updated successfully',
      connection: updatedConnection
    })
  } catch (error: any) {
    console.error('Error updating connection:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update relationship' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(request)
    const connectionId = params.id

    if (!connectionId) {
      return NextResponse.json({ success: false, error: 'Connection ID is required' }, { status: 400 })
    }

    await databaseService.deleteConnection(connectionId, user.id)

    return NextResponse.json({ success: true, message: 'Connection deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting connection:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete connection' },
      { status: 500 }
    )
  }
}

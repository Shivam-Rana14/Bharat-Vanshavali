import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const connectionData = await request.json()

    const { familyTreeId, sourceNodeId, targetNodeId, sourceHandle, targetHandle, relationshipType, relationshipLabel } = connectionData

    console.log('API connections/route.ts received:', {
      familyTreeId, sourceNodeId, targetNodeId, sourceHandle, targetHandle, relationshipType, relationshipLabel
    })

    if (!familyTreeId || !sourceNodeId || !targetNodeId || !relationshipType || !relationshipLabel) {
      return NextResponse.json({ success: false, error: 'Missing required connection data' }, { status: 400 })
    }

    const connection = await databaseService.createConnection({
      familyTreeId,
      sourceNodeId,
      targetNodeId,
      sourceHandle,
      targetHandle,
      relationshipType,
      relationshipLabel
    }, user.id)

      return NextResponse.json({ 
        success: true, 
        connection: {
          id: connection._id.toString(),
          source: connection.sourceNodeId.toString(),
          target: connection.targetNodeId.toString(),
          sourceHandle: connection.sourceHandle || null,
          targetHandle: connection.targetHandle || null,
          label: connection.relationshipLabel,
          type: 'custom', // Use our custom edge type
          data: {
            relationshipType: connection.relationshipType,
            connectionData: connection.connectionData,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle
          }
        }
      })
  } catch (error) {
    console.error('Error creating connection:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create connection' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')

    if (!connectionId) {
      return NextResponse.json({ success: false, error: 'Connection ID is required' }, { status: 400 })
    }

    await databaseService.deleteConnection(connectionId, user.id)

    return NextResponse.json({ success: true, message: 'Connection deleted successfully' })
  } catch (error) {
    console.error('Error deleting connection:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete connection' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAuth } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    console.log('Starting GET request for family tree nodes')
    
    // Try to get user with better error handling
    let user
    try {
      user = requireAuth(request)
      console.log('Auth successful, user:', { id: user.id, type: user.type })
    } catch (authError) {
      console.error('Authentication failed:', authError)
      return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const familyCode = searchParams.get('familyCode')
    console.log('Family code from request:', familyCode)

    if (!familyCode) {
      return NextResponse.json({ success: false, error: 'Family code is required' }, { status: 400 })
    }

    // Ensure nodes exist for all family members (fixes missing nodes issue)
    // Temporarily disabled to debug 500 error
    // console.log(`Ensuring nodes exist for family code: ${familyCode}`)
    // const ensureResult = await databaseService.ensureNodesForFamily(familyCode)
    // console.log('ensureNodesForFamily result:', ensureResult)
    
    // Get family tree
    console.log(`Getting family tree for code: ${familyCode}`)
    let familyTree
    try {
      familyTree = await databaseService.getFamilyTreeByCode(familyCode)
      if (!familyTree) {
        console.log(`Family tree not found for code: ${familyCode}`)
        return NextResponse.json({ success: false, error: 'Family tree not found' }, { status: 404 })
      }
      console.log(`Found family tree: ${familyTree._id}`)
    } catch (dbError) {
      console.error('Error getting family tree:', dbError)
      return NextResponse.json({ success: false, error: 'Database error while getting family tree' }, { status: 500 })
    }

    // Security check: Users can only access their own family tree
    console.log(`Getting user profile for user ID: ${user.id}`)
    let userProfile
    try {
      userProfile = await databaseService.getUserById(user.id)
      console.log(`User profile:`, { familyCode: userProfile?.familyCode, userType: user.type })
      if (user.type !== 'admin' && userProfile?.familyCode !== familyCode) {
        console.log(`Unauthorized access attempt: user family code ${userProfile?.familyCode} vs requested ${familyCode}`)
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
      }
    } catch (userError) {
      console.error('Error getting user profile:', userError)
      return NextResponse.json({ success: false, error: 'Database error while getting user profile' }, { status: 500 })
    }

    // Get nodes and connections
    console.log(`Getting nodes and connections for family tree ID: ${familyTree._id.toString()}`)
    let nodes, connections
    try {
      [nodes, connections] = await Promise.all([
        databaseService.getFamilyTreeNodes(familyTree._id.toString()),
        databaseService.getFamilyTreeConnections(familyTree._id.toString())
      ])
      console.log(`Found ${nodes.length} nodes and ${connections.length} connections in database`)
    } catch (nodesError) {
      console.error('Error getting nodes and connections:', nodesError)
      return NextResponse.json({ success: false, error: 'Database error while getting nodes and connections' }, { status: 500 })
    }

    // Transform nodes for React Flow
    console.log('Transforming nodes for React Flow...')
    let reactFlowNodes
    try {
      reactFlowNodes = nodes.map((node: any) => {
        if (!node || !node._id) {
          console.error('Invalid node found:', node)
          throw new Error('Invalid node data')
        }
        return {
          id: node._id.toString(),
          position: node.position || { x: 0, y: 0 },
          data: {
            ...node.nodeData,
            user: node.userId,
            nodeId: node._id.toString()
          },
          type: 'familyMember'
        }
      })
      console.log(`Transformed ${reactFlowNodes.length} nodes`)
    } catch (nodeTransformError) {
      console.error('Error transforming nodes:', nodeTransformError)
      return NextResponse.json({ success: false, error: 'Error transforming node data' }, { status: 500 })
    }

    // Transform connections for React Flow with handle information
    console.log('Transforming connections for React Flow...')
    let reactFlowEdges
    try {
      reactFlowEdges = connections.map((connection: any) => {
        if (!connection || !connection._id) {
          console.error('Invalid connection found:', connection)
          throw new Error('Invalid connection data')
        }
        
        console.log('Processing connection for React Flow:', {
          id: connection._id.toString(),
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          label: connection.relationshipLabel
        })
        
        return {
          id: connection._id.toString(),
          source: connection.sourceNodeId?._id?.toString() || connection.sourceNodeId.toString(),
          target: connection.targetNodeId?._id?.toString() || connection.targetNodeId.toString(),
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
      console.log(`Transformed ${reactFlowEdges.length} connections`)
    } catch (connectionTransformError) {
      console.error('Error transforming connections:', connectionTransformError)
      return NextResponse.json({ success: false, error: 'Error transforming connection data' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      familyTree: {
        id: familyTree._id.toString(),
        name: familyTree.name,
        rootUserId: familyTree.rootUserId.toString(),
        isUserRoot: familyTree.rootUserId.toString() === user.id,
        memberCount: familyTree.memberCount || 0,
        settings: familyTree.treeSettings
      },
      nodes: reactFlowNodes,
      edges: reactFlowEdges
    })
  } catch (error) {
    console.error('Error fetching family tree nodes:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch family tree nodes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { nodes, familyTreeId } = await request.json()

    if (!familyTreeId || !nodes) {
      return NextResponse.json({ success: false, error: 'Missing required data' }, { status: 400 })
    }

    // Save the layout
    await databaseService.saveFamilyTreeLayout(familyTreeId, nodes, [], user.id)

    return NextResponse.json({ success: true, message: 'Layout saved successfully' })
  } catch (error) {
    console.error('Error saving family tree layout:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save layout' },
      { status: 500 }
    )
  }
}

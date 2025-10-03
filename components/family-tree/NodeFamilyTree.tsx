"use client"

import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Custom styles for better handle visibility and functionality
const customStyles = `
  .react-flow__handle {
    width: 14px !important;
    height: 14px !important;
    border: 2px solid white !important;
    border-radius: 50% !important;
    transition: all 0.2s ease !important;
    cursor: crosshair !important;
    opacity: 0.8 !important;
  }
  
  .react-flow__handle:hover {
    transform: scale(1.3) !important;
    opacity: 1 !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4) !important;
    z-index: 1000 !important;
  }
  
  .react-flow__handle-connecting {
    transform: scale(1.4) !important;
    opacity: 1 !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.5) !important;
    z-index: 1001 !important;
  }
  
  .react-flow__connection-line {
    stroke: #ef4444 !important;
    stroke-width: 3px !important;
    stroke-dasharray: 8,4 !important;
    opacity: 0.8 !important;
  }
  
  .react-flow__node:hover .react-flow__handle {
    opacity: 1 !important;
    transform: scale(1.1) !important;
  }
  
  .react-flow__edge {
    cursor: pointer !important;
  }
  
  .react-flow__edge:hover {
    stroke-width: 4px !important;
  }
`

import FamilyMemberNode from './FamilyMemberNode'
import CustomEdge from './CustomEdge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, Plus, Link, Trash2, Crown, RefreshCw, Edit3 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/providers/auth-provider'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const nodeTypes = {
  familyMember: FamilyMemberNode,
}

const edgeTypes = {
  custom: CustomEdge,
}

interface NodeFamilyTreeProps {
  familyCode: string
}

interface FamilyTreeData {
  id: string
  name: string
  rootUserId: string
  isUserRoot: boolean
  settings: any
}

export default function NodeFamilyTree({ familyCode }: NodeFamilyTreeProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [familyTree, setFamilyTree] = useState<FamilyTreeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [connectionMode, setConnectionMode] = useState(false)
  const [pendingConnection, setPendingConnection] = useState<{ source: string } | null>(null)
  const [editingEdge, setEditingEdge] = useState<{ edge: Edge; isOpen: boolean }>({ edge: null as any, isOpen: false })
  const [relationshipLabel, setRelationshipLabel] = useState('')
  const [relationshipType, setRelationshipType] = useState('')
  const [deletingEdge, setDeletingEdge] = useState<{ edge: Edge; isOpen: boolean }>({ edge: null as any, isOpen: false })
  const [lastNodeCount, setLastNodeCount] = useState(0)
  const [ensuringNodes, setEnsuringNodes] = useState(false)

  // Comprehensive relationship options supporting all cardinalities (1:1, 1:M, M:1, M:M, 0)
  const relationshipOptions = [
    { 
      type: 'parent-child', 
      labels: ['Father', 'Mother', 'Parent', 'Son', 'Daughter', 'Child'],
      cardinality: '1:M (One parent can have many children)',
      displayName: 'Parent'
    },
    { 
      type: 'spouse', 
      labels: ['Husband', 'Wife', 'Spouse', 'Partner'],
      cardinality: '1:1 or 1:M (Monogamous or polygamous relationships)',
      displayName: 'Spouse'
    },
    { 
      type: 'sibling', 
      labels: ['Brother', 'Sister', 'Sibling', 'Twin'],
      cardinality: 'M:M (Many siblings can relate to many siblings)',
      displayName: 'Sibling'
    },
    { 
      type: 'grandparent-grandchild', 
      labels: ['Grandfather', 'Grandmother', 'Grandparent', 'Grandson', 'Granddaughter', 'Grandchild'],
      cardinality: '1:M (One grandparent can have many grandchildren)',
      displayName: 'Grandparent'
    },
    { 
      type: 'uncle-nephew', 
      labels: ['Uncle', 'Aunt', 'Nephew', 'Niece'],
      cardinality: '1:M (One uncle/aunt can have many nephews/nieces)',
      displayName: 'Uncle/Aunt'
    },
    { 
      type: 'cousin', 
      labels: ['Cousin', 'First Cousin', 'Second Cousin'],
      cardinality: 'M:M (Many cousins can relate to many cousins)',
      displayName: 'Cousin'
    },
    { 
      type: 'in-law', 
      labels: ['Father-in-law', 'Mother-in-law', 'Son-in-law', 'Daughter-in-law', 'Brother-in-law', 'Sister-in-law'],
      cardinality: 'M:M (Multiple in-law relationships possible)',
      displayName: 'In-Law'
    },
    { 
      type: 'step-family', 
      labels: ['Stepfather', 'Stepmother', 'Stepson', 'Stepdaughter', 'Stepbrother', 'Stepsister'],
      cardinality: 'M:M (Multiple step relationships possible)',
      displayName: 'Step Family'
    },
    { 
      type: 'adopted', 
      labels: ['Adoptive Father', 'Adoptive Mother', 'Adopted Son', 'Adopted Daughter'],
      cardinality: '1:M (One adoptive parent can have many adopted children)',
      displayName: 'Adopted'
    },
    { 
      type: 'guardian-ward', 
      labels: ['Guardian', 'Ward', 'Legal Guardian'],
      cardinality: '1:M (One guardian can have many wards)',
      displayName: 'Guardian'
    },
    { 
      type: 'friend', 
      labels: ['Friend', 'Best Friend', 'Close Friend', 'Family Friend'],
      cardinality: 'M:M (Many friends can relate to many friends)',
      displayName: 'Friend'
    },
    { 
      type: 'business', 
      labels: ['Business Partner', 'Co-founder', 'Colleague', 'Associate'],
      cardinality: 'M:M (Multiple business relationships possible)',
      displayName: 'Business'
    },
    { 
      type: 'other', 
      labels: ['Custom Relationship'],
      cardinality: 'Any (Flexible for custom relationships)',
      displayName: 'Other'
    }
  ]

  // Load family tree data
  useEffect(() => {
    fetchFamilyTreeData()
  }, [familyCode])

  // Function to ensure nodes exist for all family members
  const ensureNodesForFamily = async () => {
    try {
      setEnsuringNodes(true)
      console.log('Ensuring nodes for family:', familyCode)
      
      const response = await fetch('/api/family-tree/ensure-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyCode })
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Nodes Ensured",
          description: `${result.created || 0} missing nodes created. ${result.cleaned || 0} duplicate nodes removed.`,
          variant: "default"
        })
        
        // Refresh the tree to show new nodes
        await fetchFamilyTreeData(false)
      } else {
        throw new Error(result.error || 'Failed to ensure nodes')
      }
    } catch (error) {
      console.error('Error ensuring nodes:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to ensure nodes for family members.",
        variant: "destructive"
      })
    } finally {
      setEnsuringNodes(false)
    }
  }


  const fetchFamilyTreeData = async (autoEnsureNodes = false) => {
    try {
      setLoading(true)
      console.log(`Fetching family tree data for family code: ${familyCode}`)
      const response = await fetch(`/api/family-tree/nodes?familyCode=${familyCode}&t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Family tree API response:', data)
        if (data.success) {
          console.log(`Received ${data.nodes?.length || 0} nodes and ${data.edges?.length || 0} edges`)
          
          // Check if we need to ensure nodes for missing family members
          const nodeCount = data.nodes?.length || 0
          const familyMemberCount = data.familyTree?.memberCount || 0
          
          console.log(`Node count: ${nodeCount}, Family member count: ${familyMemberCount}`)
          
          // Auto-trigger ensureNodes if nodes are missing and we're refreshing
          if (autoEnsureNodes && nodeCount < familyMemberCount) {
            console.log('Missing nodes detected, triggering ensureNodesForFamily...')
            toast({
              title: "Missing Nodes Detected",
              description: `Found ${familyMemberCount - nodeCount} missing nodes. Creating them now...`,
              variant: "default"
            })
            
            // Trigger node creation
            await ensureNodesForFamily()
            
            // Refetch data after ensuring nodes
            return fetchFamilyTreeData(false) // Prevent infinite loop
          }
          
          // Check if new members joined
          if (lastNodeCount > 0 && nodeCount > lastNodeCount) {
            const newMemberCount = nodeCount - lastNodeCount
            toast({
              title: "New Family Members!",
              description: `${newMemberCount} new member(s) have joined your family tree.`,
              variant: "default"
            })
          }
          setLastNodeCount(nodeCount)
          
          setFamilyTree(data.familyTree)
          setNodes(data.nodes)
          setEdges(data.edges)
        }
      } else {
        throw new Error('Failed to fetch family tree data')
      }
    } catch (error) {
      console.error('Error fetching family tree:', error)
      toast({
        title: "Error",
        description: "Failed to load family tree data.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const onConnect = useCallback(
    async (params: Connection) => {
      console.log('onConnect triggered with params:', params)
      
      if (!familyTree?.isUserRoot) {
        console.log('Permission denied - user is not root')
        toast({
          title: "Permission Denied",
          description: "Only the root member can create connections.",
          variant: "destructive"
        })
        return
      }

      if (!familyTree?.id) {
        console.log('Error - no family tree ID')
        toast({
          title: "Error",
          description: "Family Tree ID not found.",
          variant: "destructive"
        })
        return
      }

      console.log('Creating connection:', {
        familyTreeId: familyTree.id,
        sourceNodeId: params.source,
        targetNodeId: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle
      })

      // Log handle information for debugging
      console.log('Handle details:', {
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        isVertical: (params.sourceHandle?.includes('top') || params.sourceHandle?.includes('bottom')) ||
                   (params.targetHandle?.includes('top') || params.targetHandle?.includes('bottom')),
        isHorizontal: (params.sourceHandle?.includes('left') || params.sourceHandle?.includes('right')) ||
                     (params.targetHandle?.includes('left') || params.targetHandle?.includes('right'))
      })

      // Fix handle types - React Flow requires source->target, not target->target
      let correctedSourceHandle = params.sourceHandle
      let correctedTargetHandle = params.targetHandle
      
      // If sourceHandle is a target, convert it to corresponding source
      if (params.sourceHandle?.includes('-target')) {
        correctedSourceHandle = params.sourceHandle.replace('-target', '-source')
        console.log(`🔧 Corrected sourceHandle: ${params.sourceHandle} → ${correctedSourceHandle}`)
      }
      
      // If targetHandle is a source, convert it to corresponding target  
      if (params.targetHandle?.includes('-source')) {
        correctedTargetHandle = params.targetHandle.replace('-source', '-target')
        console.log(`🔧 Corrected targetHandle: ${params.targetHandle} → ${correctedTargetHandle}`)
      }
      
      console.log('Final corrected handles:', {
        originalSource: params.sourceHandle,
        correctedSource: correctedSourceHandle,
        originalTarget: params.targetHandle, 
        correctedTarget: correctedTargetHandle
      })

      try {
        // Create connection via API with corrected handle information
        const response = await fetch('/api/family-tree/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            familyTreeId: familyTree.id,
            sourceNodeId: params.source,
            targetNodeId: params.target,
            sourceHandle: correctedSourceHandle,
            targetHandle: correctedTargetHandle,
            relationshipType: 'other',
            relationshipLabel: 'Related'
          })
        })

        const result = await response.json()
        console.log('Connection API response:', result)
        
        if (result.success) {
          // Refresh the family tree data to get the real connection with proper ID
          await fetchFamilyTreeData()
          toast({
            title: "Connection Created",
            description: "Family relationship has been established. Click on the connection line to edit the relationship type.",
            variant: "default"
          })
        } else {
          throw new Error(result.error)
        }
      } catch (error: any) {
        console.error('Connection creation error:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to create connection.",
          variant: "destructive"
        })
      }
    },
    [familyTree?.isUserRoot, familyTree?.id, toast, fetchFamilyTreeData]
  )

  const onNodeClick = useCallback(async (event: React.MouseEvent, node: Node) => {
    if (connectionMode && pendingConnection) {
      // Complete connection
      if (pendingConnection.source !== node.id) {
        // Create connection using the same logic as onConnect
        if (!familyTree?.isUserRoot) {
          toast({
            title: "Permission Denied",
            description: "Only the root member can create connections.",
            variant: "destructive"
          })
          return
        }

        try {
          const response = await fetch('/api/family-tree/connections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              familyTreeId: familyTree.id,
              sourceNodeId: pendingConnection.source,
              targetNodeId: node.id,
              relationshipType: 'other',
              relationshipLabel: 'Related'
            })
          })

          const result = await response.json()
          if (result.success) {
            await fetchFamilyTreeData()
            toast({
              title: "Connection Created",
              description: "Family relationship has been established. Click on the connection line to edit the relationship type.",
              variant: "default"
            })
          } else {
            throw new Error(result.error)
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to create connection.",
            variant: "destructive"
          })
        }
      }
      setPendingConnection(null)
      setConnectionMode(false)
    } else if (connectionMode) {
      // Start connection
      setPendingConnection({ source: node.id })
    } else {
      // Regular node selection
      setSelectedNodes([node.id])
    }
  }, [connectionMode, pendingConnection, familyTree?.isUserRoot, familyTree?.id, toast, fetchFamilyTreeData])

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (!familyTree?.isUserRoot) {
      toast({
        title: "Permission Denied",
        description: "Only the root member can edit relationships.",
        variant: "destructive"
      })
      return
    }
    
    // Check if it's a right-click (context menu) or regular click
    if (event.button === 2 || event.ctrlKey || event.metaKey) {
      // Right-click or Ctrl+click - show delete dialog
      setDeletingEdge({ edge, isOpen: true })
    } else {
      // Regular click - open edit dialog for the relationship
      setEditingEdge({ edge, isOpen: true })
      setRelationshipLabel(edge.label as string || '')
      setRelationshipType((edge.data as any)?.relationshipType || 'other')
    }
  }, [familyTree?.isUserRoot, toast])

  const updateRelationship = async () => {
    if (!editingEdge.edge || !relationshipLabel.trim()) {
      toast({
        title: "Error",
        description: "Please enter a relationship label.",
        variant: "destructive"
      })
      return
    }

    try {
      // Update the edge in the UI immediately
      setEdges((eds: any) => 
        eds.map((edge: any) => 
          edge.id === editingEdge.edge.id 
            ? { 
                ...edge, 
                label: relationshipLabel,
                data: { 
                  ...(edge.data || {}), 
                  relationshipType: relationshipType,
                  relationshipLabel: relationshipLabel 
                }
              }
            : edge
        )
      )

      // Update in database
      const response = await fetch(`/api/family-tree/connections/${editingEdge.edge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationshipType,
          relationshipLabel
        })
      })

      if (response.ok) {
        toast({
          title: "Relationship Updated",
          description: `Relationship changed to "${relationshipLabel}".`,
          variant: "default"
        })
      } else {
        throw new Error('Failed to update relationship')
      }

      // Close dialog
      setEditingEdge({ edge: null as any, isOpen: false })
      setRelationshipLabel('')
      setRelationshipType('')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update relationship.",
        variant: "destructive"
      })
    }
  }

  const deleteConnection = async () => {
    if (!deletingEdge.edge) return

    try {
      // Remove the edge from UI immediately
      setEdges((eds: any) => eds.filter((edge: any) => edge.id !== deletingEdge.edge.id))

      // Delete from database
      const response = await fetch(`/api/family-tree/connections/${deletingEdge.edge.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Connection Deleted",
          description: "The relationship has been removed from the family tree.",
          variant: "default"
        })
      } else {
        throw new Error('Failed to delete connection')
      }

      // Close dialog
      setDeletingEdge({ edge: null as any, isOpen: false })
    } catch (error) {
      // Revert the UI change if deletion failed
      await fetchFamilyTreeData()
      toast({
        title: "Error",
        description: "Failed to delete connection.",
        variant: "destructive"
      })
      setDeletingEdge({ edge: null as any, isOpen: false })
    }
  }


  const saveLayout = async () => {
    if (!familyTree?.isUserRoot) {
      toast({
        title: "Permission Denied",
        description: "Only the root member can save the layout.",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/family-tree/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyTreeId: familyTree.id,
          nodes: (nodes as any).map((node: any) => ({
            id: node.id,
            position: node.position,
            data: node.data
          }))
        })
      })

      if (response.ok) {
        toast({
          title: "Layout Saved",
          description: "Family tree layout has been saved successfully.",
          variant: "default"
        })
      } else {
        throw new Error('Failed to save layout')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save layout.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading family tree...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Custom styles for handles */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-900">
            {familyTree?.name || 'Family Tree'}
          </h1>
          {familyTree?.isUserRoot && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              <Crown className="w-3 h-3 mr-1" />
              Root Member
            </Badge>
          )}
        </div>
        
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Manual refresh triggered with auto-ensure')
                      fetchFamilyTreeData(true) // Enable auto-ensure on manual refresh
                    }}
                    disabled={loading}
                    className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Refreshing...' : 'Refresh Tree'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={ensureNodesForFamily}
                    disabled={ensuringNodes || loading}
                    className="bg-green-50 hover:bg-green-100 border-green-200"
                  >
                    <Plus className={`w-4 h-4 mr-1 ${ensuringNodes ? 'animate-spin' : ''}`} />
                    {ensuringNodes ? 'Ensuring...' : 'Ensure Nodes'}
                  </Button>
          
          {familyTree?.isUserRoot && (
            <>
              <Button
                variant={connectionMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setConnectionMode(!connectionMode)
                  setPendingConnection(null)
                }}
              >
                <Link className="w-4 h-4 mr-1" />
                {connectionMode ? 'Cancel Connect' : 'Connect Members'}
              </Button>
              
              
              <Button
                variant="outline"
                size="sm"
                onClick={saveLayout}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Saving...' : 'Save Layout'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Connection Mode Instructions */}
      {connectionMode && (
        <div className="bg-blue-50 border-b px-4 py-2">
          <p className="text-sm text-blue-800">
            {pendingConnection 
              ? '🔗 Click on a TARGET handle (📥) on another member to complete the connection'
              : '🎯 Click on a SOURCE handle (📤) on a family member to start connecting them. Hover over dots to see SOURCE/TARGET labels!'
            }
          </p>
        </div>
      )}
      
              {/* Drag Connection Instructions */}
              {!connectionMode && familyTree?.isUserRoot && (
                <div className="bg-purple-50 border-b px-4 py-2">
                  <p className="text-sm text-purple-800">
                    💡 <strong>To connect family members:</strong> Drag from a SOURCE handle (📤) to a TARGET handle (📥). 🔵 Blue dots (top/bottom) = Vertical connections, 🟣 Purple dots (left/right) = Horizontal connections. <strong>Hover over any dot to see SOURCE/TARGET labels!</strong>
                  </p>
                </div>
              )}

      {/* React Flow */}
      <div className="flex-1">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  onEdgeClick={onEdgeClick}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
          fitView
          attributionPosition="top-right"
          nodesDraggable={familyTree?.isUserRoot}
          nodesConnectable={familyTree?.isUserRoot}
          elementsSelectable={true}
          connectionMode={'loose' as any}
          snapToGrid={false}
          snapGrid={[15, 15]}
          connectOnClick={false}
          nodeOrigin={[0, 0]}
          defaultEdgeOptions={{
            style: { strokeWidth: 3, stroke: '#4f46e5' },
            type: 'custom', // Use our custom edge type by default
            markerEnd: {
              type: 'arrowclosed',
              width: 15,
              height: 15,
              color: '#4f46e5',
            },
          }}
          connectionLineStyle={{
            strokeWidth: 3,
            stroke: '#ef4444',
            strokeDasharray: '8,4',
          }}
          connectionLineType={'smoothstep' as any}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Meta', 'Ctrl']}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>

       {/* Instructions */}
                      <div className="bg-gray-50 border-t px-4 py-2">
                        <p className="text-xs text-gray-600">
                          {familyTree?.isUserRoot 
                            ? '🎯 DRAG from a SOURCE handle (📤) TO a TARGET handle (📥) to connect family members. 🔵 Blue dots (top/bottom) = vertical connections, 🟣 Purple dots (left/right) = horizontal connections. Hover over dots to see SOURCE/TARGET labels!'
                            : 'You are viewing the family tree. Only the root member can make changes.'
                          }
                        </p>
                      </div>

              {/* Edit Relationship Dialog */}
              <Dialog open={editingEdge.isOpen} onOpenChange={(open) => setEditingEdge({ edge: null as any, isOpen: open })}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      Edit Relationship
                    </DialogTitle>
                    <DialogDescription>
                      Update the relationship between these family members. You can create multiple different relationships between the same people to represent complex family dynamics.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="relationshipType">Relationship Type</Label>
                      <Select value={relationshipType} onValueChange={setRelationshipType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship type" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipOptions.map((option) => (
                            <SelectItem key={option.type} value={option.type}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {option.displayName}
                                </span>
                                <span className="text-xs text-gray-500">{option.cardinality}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="relationshipLabel">Relationship Label</Label>
                      <Input
                        id="relationshipLabel"
                        value={relationshipLabel}
                        onChange={(e) => setRelationshipLabel(e.target.value)}
                        placeholder="e.g., Father, Mother, Brother, Sister, Husband, Wife"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">
                        This is what will be displayed on the connection line.
                      </p>
                    </div>

                    {/* Quick suggestions based on selected type */}
                    {relationshipType && (
                      <div className="grid gap-2">
                        <Label className="text-xs">Quick suggestions:</Label>
                        <div className="flex flex-wrap gap-1">
                          {relationshipOptions
                            .find(opt => opt.type === relationshipType)
                            ?.labels.map((label) => (
                              <Button
                                key={label}
                                variant="outline"
                                size="sm"
                                className="text-xs h-6 px-2"
                                onClick={() => setRelationshipLabel(label)}
                              >
                                {label}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingEdge({ edge: null as any, isOpen: false })}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        setEditingEdge({ edge: null as any, isOpen: false })
                        setDeletingEdge({ edge: editingEdge.edge, isOpen: true })
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                    <Button onClick={updateRelationship}>
                      Update Relationship
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Connection Confirmation Dialog */}
              <Dialog open={deletingEdge.isOpen} onOpenChange={(open) => setDeletingEdge({ edge: null as any, isOpen: open })}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      Delete Connection
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this relationship? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-800">
                        <Trash2 className="w-4 h-4" />
                        <span className="font-medium">Connection to be deleted:</span>
                      </div>
                      <p className="text-red-700 mt-1">
                        "{deletingEdge.edge?.label || 'Unknown relationship'}"
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setDeletingEdge({ edge: null as any, isOpen: false })}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={deleteConnection}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete Connection
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
    </div>
  )
}

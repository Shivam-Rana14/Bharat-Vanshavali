"use client"

import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'
import { memo } from 'react'
import { COLORS } from '@/lib/constants'

// CSS for edge labels
const edgeLabelStyles = `
  .custom-edge-label {
    position: absolute;
    font-size: 12px;
    font-weight: 500;
    background: white;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid;
    pointer-events: all;
    cursor: pointer;
    transform: translate(-50%, -50%);
  }
  
  .custom-edge-label.horizontal {
    border-color: ${COLORS.FAMILY_TREE.HORIZONTAL_CONNECTION};
    color: ${COLORS.FAMILY_TREE.HORIZONTAL_CONNECTION};
  }
  
  .custom-edge-label.vertical {
    border-color: ${COLORS.FAMILY_TREE.VERTICAL_CONNECTION};
    color: ${COLORS.FAMILY_TREE.VERTICAL_CONNECTION};
  }
`

const CustomEdge = memo(({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition, 
  style = {}, 
  data,
  label,
  markerEnd 
}: EdgeProps) => {
  
  // Force logging to ensure component is being called
  console.log(`🎯 CustomEdge rendering for connection "${id}":`, {
    id,
    sourceHandle: data?.sourceHandle,
    targetHandle: data?.targetHandle,
    label,
    sourcePosition: { x: sourceX, y: sourceY },
    targetPosition: { x: targetX, y: targetY },
    hasData: !!data
  })

  // Determine if this is a horizontal connection based on handle names
  const isHorizontalConnection = 
    (data?.sourceHandle?.includes('left') || data?.sourceHandle?.includes('right')) ||
    (data?.targetHandle?.includes('left') || data?.targetHandle?.includes('right'))
  
  // Determine if this is a vertical connection based on handle names
  const isVerticalConnection = 
    (data?.sourceHandle?.includes('top') || data?.sourceHandle?.includes('bottom')) ||
    (data?.targetHandle?.includes('top') || data?.targetHandle?.includes('bottom'))

  console.log('Connection type detection:', {
    isHorizontalConnection,
    isVerticalConnection,
    sourceHandle: data?.sourceHandle,
    targetHandle: data?.targetHandle
  })

  // Calculate the path based on connection type
  let edgePath: string
  let labelX: number
  let labelY: number

  if (isVerticalConnection) {
    // For vertical connections, create proper vertical bezier path
    console.log('Creating vertical connection path')
    const [path, labelXPos, labelYPos] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.4 // Higher curvature for better vertical flow
    })
    
    edgePath = path
    labelX = labelXPos
    labelY = labelYPos
  } else if (isHorizontalConnection) {
    // For horizontal connections, force horizontal path
    const midX = (sourceX + targetX) / 2
    const midY = (sourceY + targetY) / 2
    
    // Create a more horizontal path by adjusting control points
    const controlOffset = Math.abs(targetX - sourceX) * 0.3
    const yOffset = Math.abs(targetY - sourceY) * 0.1 // Minimal vertical offset
    
    // Force horizontal bezier curve
    edgePath = `M ${sourceX} ${sourceY} C ${sourceX + controlOffset} ${sourceY + yOffset}, ${targetX - controlOffset} ${targetY - yOffset}, ${targetX} ${targetY}`
    
    labelX = midX
    labelY = midY
  } else if (isVerticalConnection) {
    // For vertical connections, use standard bezier curve
    const [path] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.25 // More curvature for vertical connections
    })
    
    edgePath = path
    labelX = (sourceX + targetX) / 2
    labelY = (sourceY + targetY) / 2
  } else {
    // Default fallback - try to detect by position if handle info is missing
    const isHorizontalByPosition = Math.abs(targetX - sourceX) > Math.abs(targetY - sourceY)
    
    console.log('Using fallback detection based on position:', {
      isHorizontalByPosition,
      deltaX: Math.abs(targetX - sourceX),
      deltaY: Math.abs(targetY - sourceY)
    })
    
    if (isHorizontalByPosition) {
      // Treat as horizontal
      const midX = (sourceX + targetX) / 2
      const midY = (sourceY + targetY) / 2
      const controlOffset = Math.abs(targetX - sourceX) * 0.3
      const yOffset = Math.abs(targetY - sourceY) * 0.1
      
      edgePath = `M ${sourceX} ${sourceY} C ${sourceX + controlOffset} ${sourceY + yOffset}, ${targetX - controlOffset} ${targetY - yOffset}, ${targetX} ${targetY}`
      labelX = midX
      labelY = midY
    } else {
      // Treat as vertical - use proper bezier path
      console.log('Fallback: treating as vertical connection')
      const [path, labelXPos, labelYPos] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.4
      })
      
      edgePath = path
      labelX = labelXPos
      labelY = labelYPos
    }
  }

  // Set edge color based on connection type - prioritize handle information over position
  let isActuallyHorizontal = false
  if (isHorizontalConnection || isVerticalConnection) {
    // Use handle information if available
    isActuallyHorizontal = isHorizontalConnection
  } else {
    // Fall back to position-based detection
    isActuallyHorizontal = Math.abs(targetX - sourceX) > Math.abs(targetY - sourceY)
  }
  
  const edgeColor = isActuallyHorizontal ? COLORS.FAMILY_TREE.HORIZONTAL_CONNECTION : COLORS.FAMILY_TREE.VERTICAL_CONNECTION
  
  console.log('Final edge styling:', {
    isActuallyHorizontal,
    isHorizontalConnection,
    isVerticalConnection,
    willUseHorizontalColor: isActuallyHorizontal,
    edgeColor,
    path: edgePath.substring(0, 50) + '...'
  })
  
  const edgeStyle = {
    stroke: edgeColor,
    strokeWidth: 3,
    ...style
  }

  // Add a safety check - if path is invalid, create a simple straight line
  if (!edgePath || edgePath.length < 10) {
    console.warn('⚠️ Invalid edge path detected, creating fallback line')
    edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
  }

  return (
    <>
      {/* Inject CSS styles */}
      <style dangerouslySetInnerHTML={{ __html: edgeLabelStyles }} />
      
      <BaseEdge 
        path={edgePath} 
        style={edgeStyle}
        markerEnd={markerEnd}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              left: `${labelX}px`,
              top: `${labelY}px`,
            }}
            className={`custom-edge-label ${isActuallyHorizontal ? 'horizontal' : 'vertical'} nodrag nopan`}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})

CustomEdge.displayName = 'CustomEdge'

export default CustomEdge

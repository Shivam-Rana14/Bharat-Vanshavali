"use client"

import { Handle, Position } from '@xyflow/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Crown } from 'lucide-react'
import { memo } from 'react'
import { COLORS } from '@/lib/constants'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface FamilyMemberNodeProps {
  data: {
    user: {
      _id: string
      fullName: string
      email: string
      loginId: string
      phone?: string
      avatarUrl?: string
      dateOfBirth?: string
      gender?: string
    }
    nodeId: string
    color: string
    isVisible: boolean
  }
  selected?: boolean
}

const FamilyMemberNode = memo(({ data, selected }: FamilyMemberNodeProps) => {
  const { user } = data

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <TooltipProvider>
      <>
        {/* Connection handles - Blue for vertical, Purple for horizontal */}
        {/* Top handles - Blue for vertical connections */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Handle 
              type="source" 
              position={Position.Top} 
              id="top-source"
              className="!w-4 !h-4 !bg-blue-500 !border-2 !border-white hover:!bg-blue-600 transition-all hover:!scale-125"
              style={{ top: -8, left: '35%' }}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-blue-500 text-white">
            <p className="text-xs font-medium">📤 SOURCE: Drag FROM here</p>
            <p className="text-xs">Connect to a TARGET handle</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Handle 
              type="target" 
              position={Position.Top} 
              id="top-target"
              className="!w-4 !h-4 !bg-blue-500 !border-2 !border-white hover:!bg-blue-600 transition-all hover:!scale-125"
              style={{ top: -8, left: '65%' }}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-blue-500 text-white">
            <p className="text-xs font-medium">📥 TARGET: Drag TO here</p>
            <p className="text-xs">From a SOURCE handle</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Bottom handles - Blue for vertical connections */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Handle 
              type="source" 
              position={Position.Bottom} 
              id="bottom-source"
              className="!w-4 !h-4 !bg-blue-500 !border-2 !border-white hover:!bg-blue-600 transition-all hover:!scale-125"
              style={{ bottom: -8, left: '35%' }}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-blue-500 text-white">
            <p className="text-xs font-medium">📤 SOURCE: Drag FROM here</p>
            <p className="text-xs">Connect to a TARGET handle</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Handle 
              type="target" 
              position={Position.Bottom} 
              id="bottom-target"
              className="!w-4 !h-4 !bg-blue-500 !border-2 !border-white hover:!bg-blue-600 transition-all hover:!scale-125"
              style={{ bottom: -8, left: '65%' }}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-blue-500 text-white">
            <p className="text-xs font-medium">📥 TARGET: Drag TO here</p>
            <p className="text-xs">From a SOURCE handle</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Left handles - Purple for horizontal connections */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Handle 
              type="source" 
              position={Position.Left} 
              id="left-source"
              className="!w-4 !h-4 !bg-purple-500 !border-2 !border-white hover:!bg-purple-600 transition-all hover:!scale-125"
              style={{ left: -8, top: '35%' }}
            />
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-purple-500 text-white">
            <p className="text-xs font-medium">📤 SOURCE: Drag FROM here</p>
            <p className="text-xs">Connect to a TARGET handle</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Handle 
              type="target" 
              position={Position.Left} 
              id="left-target"
              className="!w-4 !h-4 !bg-purple-500 !border-2 !border-white hover:!bg-purple-600 transition-all hover:!scale-125"
              style={{ left: -8, top: '65%' }}
            />
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-purple-500 text-white">
            <p className="text-xs font-medium">📥 TARGET: Drag TO here</p>
            <p className="text-xs">From a SOURCE handle</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Right handles - Purple for horizontal connections */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Handle 
              type="source" 
              position={Position.Right} 
              id="right-source"
              className="!w-4 !h-4 !bg-purple-500 !border-2 !border-white hover:!bg-purple-600 transition-all hover:!scale-125"
              style={{ right: -8, top: '35%' }}
            />
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-purple-500 text-white">
            <p className="text-xs font-medium">📤 SOURCE: Drag FROM here</p>
            <p className="text-xs">Connect to a TARGET handle</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Handle 
              type="target" 
              position={Position.Right} 
              id="right-target"
              className="!w-4 !h-4 !bg-purple-500 !border-2 !border-white hover:!bg-purple-600 transition-all hover:!scale-125"
              style={{ right: -8, top: '65%' }}
            />
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-purple-500 text-white">
            <p className="text-xs font-medium">📥 TARGET: Drag TO here</p>
            <p className="text-xs">From a SOURCE handle</p>
          </TooltipContent>
        </Tooltip>
      
      
      <Card 
        className={`w-48 h-24 cursor-pointer transition-all duration-200 ${
          selected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
        }`}
        style={{ backgroundColor: data.color }}
      >
        <CardContent className="p-3 h-full flex items-center space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {getInitials(user.fullName)}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <h3 className="text-sm font-semibold truncate">
                {user.fullName || 'Unnamed'}
              </h3>
              {data.color === COLORS.FAMILY_TREE.ROOT_MEMBER && (
                <Crown className="w-3 h-3 text-yellow-600" aria-label="Root Member" />
              )}
            </div>
            <p className="text-xs text-gray-600 truncate">
              {user.loginId || 'No ID'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {formatDate(user.dateOfBirth)}
            </p>
          </div>
        </CardContent>
      </Card>
      </>
    </TooltipProvider>
  )
})

FamilyMemberNode.displayName = 'FamilyMemberNode'

export default FamilyMemberNode

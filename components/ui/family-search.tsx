"use client"

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X, User, MapPin, Calendar } from 'lucide-react'
import { debounce } from 'lodash'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface SearchFilters {
  query: string
  relationship: string
  gender: string
  location: string
}

interface FamilyMember {
  id: string
  full_name: string
  relationship: string
  gender: string
  date_of_birth?: string
  place_of_birth?: string
  occupation?: string
  verification_status: string
  documents?: any[]
}

interface FamilySearchProps {
  onMemberSelect?: (member: FamilyMember) => void
  showFilters?: boolean
}

export function FamilySearch({ onMemberSelect, showFilters = true }: FamilySearchProps) {
  const [searchResults, setSearchResults] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    relationship: '',
    gender: '',
    location: ''
  })

  const debouncedSearch = useCallback(
    debounce(async (searchFilters: SearchFilters) => {
      if (!searchFilters.query && !searchFilters.relationship && !searchFilters.gender && !searchFilters.location) {
        setSearchResults([])
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchFilters.query) params.append('q', searchFilters.query)
        if (searchFilters.relationship) params.append('relationship', searchFilters.relationship)
        if (searchFilters.gender) params.append('gender', searchFilters.gender)
        if (searchFilters.location) params.append('location', searchFilters.location)

        const response = await fetch(`/api/family-members/search?${params}`)
        const result = await response.json()

        if (result.success) {
          setSearchResults(result.data)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSearch(filters)
  }, [filters, debouncedSearch])

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      relationship: '',
      gender: '',
      location: ''
    })
    setSearchResults([])
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search family members by name..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="pl-10"
          />
        </div>
        {showFilters && (
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="shrink-0"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        )}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Relationship</label>
                <Select 
                  value={filters.relationship} 
                  onValueChange={(value) => handleFilterChange('relationship', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any relationship</SelectItem>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="son">Son</SelectItem>
                    <SelectItem value="daughter">Daughter</SelectItem>
                    <SelectItem value="brother">Brother</SelectItem>
                    <SelectItem value="sister">Sister</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="grandfather">Grandfather</SelectItem>
                    <SelectItem value="grandmother">Grandmother</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Gender</label>
                <Select 
                  value={filters.gender} 
                  onValueChange={(value) => handleFilterChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any gender</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Input
                  placeholder="Birth/death place..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner message="Searching..." />
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Search Results ({searchResults.length})
            </h3>
          </div>
          
          <div className="grid gap-4">
            {searchResults.map((member) => (
              <Card 
                key={member.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  onMemberSelect ? 'hover:bg-orange-50' : ''
                }`}
                onClick={() => onMemberSelect?.(member)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {member.full_name}
                          </h4>
                          <Badge variant="outline">
                            {member.relationship}
                          </Badge>
                          <Badge 
                            variant={member.verification_status === 'verified' ? 'default' : 'secondary'}
                            className={member.verification_status === 'verified' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {member.verification_status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {member.date_of_birth && (
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Born {new Date(member.date_of_birth).getFullYear()}
                            </div>
                          )}
                          {member.place_of_birth && (
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {member.place_of_birth}
                            </div>
                          )}
                          {member.occupation && (
                            <span className="text-gray-500">
                              {member.occupation}
                            </span>
                          )}
                        </div>
                        
                        {member.documents && member.documents.length > 0 && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {member.documents.length} document{member.documents.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && hasActiveFilters && searchResults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No family members found matching your search criteria.</p>
        </div>
      )}
    </div>
  )
}
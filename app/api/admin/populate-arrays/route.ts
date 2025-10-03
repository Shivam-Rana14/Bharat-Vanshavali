import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'
import { requireAdmin } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request)
    
    // Get all family trees
    const familyTrees = await databaseService.listFamilies()
    let processedCount = 0
    let errorCount = 0
    
    for (const familyTree of familyTrees) {
      try {
        await databaseService.updateFamilyMemberArrays(familyTree.familyCode)
        processedCount++
      } catch (error) {
        console.error(`Error processing family ${familyTree.familyCode}:`, error)
        errorCount++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Populated family arrays for ${processedCount} families`,
      processedCount,
      errorCount,
      totalFamilies: familyTrees.length
    })
  } catch (error) {
    console.error('Error populating family arrays:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to populate family arrays' },
      { status: 500 }
    )
  }
}

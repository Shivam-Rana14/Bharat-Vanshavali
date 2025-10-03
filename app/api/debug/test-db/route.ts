import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')
    
    // Test basic database connection
    const testUser = await databaseService.getUserById('test')
    console.log('Database connection test completed')
    
    return NextResponse.json({
      success: true,
      message: 'Database connection is working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database connection test failed:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/mongodb/database'

export async function POST(request: NextRequest) {
  try {
    const { type, value } = await request.json()

    if (!type || !value) {
      return NextResponse.json(
        { success: false, error: 'Missing type or value' },
        { status: 400 }
      )
    }

    let exists = false
    let message = ''

    switch (type) {
      case 'email':
        exists = await databaseService.checkEmailExists(value)
        message = exists ? 'Email already exists' : 'Email is available'
        break
      
      case 'loginId':
        exists = await databaseService.checkLoginIdExists(value)
        message = exists ? 'Login ID already exists' : 'Login ID is available'
        break

      case 'familyCode':
        try {
          const tree = await databaseService.getFamilyTreeByCode(value)
          if (!tree) {
            return NextResponse.json({ success: true, exists: false, message: 'Family code not found' })
          }

          let rootName = undefined
          if (tree.rootUserId) {
            const rootUser = await databaseService.getUserById(tree.rootUserId.toString())
            rootName = rootUser?.fullName
          }

          return NextResponse.json({
            success: true,
            exists: true,
            message: rootName ? `Family code valid. Root member: ${rootName}` : 'Family code valid.'
          })
        } catch (e) {
          console.error('familyCode validate error:', e)
          return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 500 })
        }

      // no break because we already returned
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid validation type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      exists,
      message,
      available: !exists
    })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { success: false, error: 'Validation failed' },
      { status: 500 }
    )
  }
}

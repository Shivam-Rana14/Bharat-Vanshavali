import { NextRequest, NextResponse } from 'next/server'
import { databaseService, SignUpData } from '@/lib/mongodb/database'
import { authService } from '@/lib/auth'
async function processAvatarFile(file: File): Promise<string> {
  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64String = `data:${file.type};base64,${buffer.toString('base64')}`
  
  return base64String
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const signUpData: SignUpData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      fullName: formData.get('fullName') as string,
      phone: formData.get('mobile') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      placeOfBirth: formData.get('placeOfBirth') as string,
      gender: formData.get('gender') as string,
      nativePlace: formData.get('nativePlace') as string,
      caste: formData.get('caste') as string,
      reference1Name: formData.get('reference1Name') as string,
      reference1Phone: formData.get('reference1Mobile') as string,
      reference2Name: formData.get('reference2Name') as string,
      reference2Phone: formData.get('reference2Mobile') as string,
      familyCode: formData.get('familyCode') as string,
      relationship: formData.get('relationship') as string,
      selfieFile: (formData.get('selfieFile') as File) || null,
      location: (formData.get('latitude') && formData.get('longitude')) ? {
        lat: Number(formData.get('latitude') as string),
        lng: Number(formData.get('longitude') as string)
      } : null,
    }

    // Validate required fields
    if (!signUpData.email || !signUpData.password || !signUpData.fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Client-side already ensures min length but double-check here
    if (signUpData.password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Create user with MongoDB
    const newUser = await databaseService.signUp(signUpData)

    // Process and store selfie in database if provided
    if (signUpData.selfieFile) {
      try {
        const avatarData = await processAvatarFile(signUpData.selfieFile as File)
        newUser.avatarData = avatarData
        newUser.avatarUrl = 'database' // Indicate avatar is stored in database
        await newUser.save()
      } catch (e) {
        // Non-blocking: log only
        console.error('Selfie processing failed:', e)
      }
    }

    // Generate JWT token
    const token = authService.generateToken({
      id: newUser._id.toString(),
      email: newUser.email,
      type: newUser.userType,
      familyCode: newUser.familyCode
    })

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful! Please wait for admin verification.',
      user: {
        id: newUser._id.toString(),
        name: newUser.fullName,
        email: newUser.email,
        type: newUser.userType,
        familyCode: newUser.familyCode,
        loginId: newUser.loginId
      }
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    )
  }
}

// Allow larger payloads (up to 10 MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
}
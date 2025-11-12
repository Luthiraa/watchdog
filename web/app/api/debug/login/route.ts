import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { weaviateService } from '@/lib/weaviate'

export async function POST() {
  try {
    console.log('🐛 Debug endpoint called')
    
    const session = await getServerSession()
    console.log('🔐 Session:', session)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    // Store a test login event
    const memoryId = await weaviateService.storeMemory({
      userId: session.user.email,
      content: `DEBUG: Manual login test for ${session.user.name} (${session.user.email})`,
      timestamp: new Date().toISOString(),
      category: 'debug',
      source: 'manual_debug_endpoint',
      metadata: {
        userName: session.user.name || 'Unknown',
        userEmail: session.user.email,
        userImage: session.user.image || null,
        testTime: new Date().toISOString(),
      },
    })

    console.log('✅ Debug login event stored successfully!', memoryId)

    return NextResponse.json({ 
      success: true,
      memoryId,
      session: {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image
      }
    })
  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 })
  }
}

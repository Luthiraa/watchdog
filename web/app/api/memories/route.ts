import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { weaviateService } from '@/lib/weaviate'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, category, source, metadata } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const memoryId = await weaviateService.storeMemory({
      userId: session.user.email,
      content,
      timestamp: new Date().toISOString(),
      category,
      source,
      metadata,
    })

    return NextResponse.json({ id: memoryId, success: true })
  } catch (error) {
    console.error('Error storing memory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const category = searchParams.get('category') || undefined
    const limit = parseInt(searchParams.get('limit') || '10')

    let memories

    if (query) {
      // Search memories
      memories = await weaviateService.searchMemories(
        session.user.email,
        query,
        limit,
        category
      )
    } else {
      // Get all user memories
      memories = await weaviateService.getUserMemories(
        session.user.email,
        limit,
        category
      )
    }

    return NextResponse.json({ memories })
  } catch (error) {
    console.error('Error retrieving memories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
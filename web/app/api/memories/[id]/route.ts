import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { weaviateService } from '@/lib/weaviate'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await weaviateService.deleteMemory(params.id, session.user.email)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error deleting memory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
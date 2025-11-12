import { config } from 'dotenv'
config({ path: '.env.local' })

const manualMemories = [
  {
    userId: 'luthira.abeykoon@gmail.com',
    content: 'Introducing Spatial Memory for your robots. Spatiotemporal RAG. Open source. Coming soon.',
    timestamp: new Date().toISOString(),
    category: 'announcement',
    source: 'x.com/stash_pomichter',
    metadata: {
      url: 'https://x.com/stash_pomichter/status/1980741077205414328',
      title: 'Introducing Spatial Memory for your robots',
      domain: 'x.com',
      description: 'Tweet: Introducing Spatial Memory for your robots. Spatiotemporal RAG. Open source. Coming soon.',
      excerpt: 'Spatial Memory for robots — spatiotemporal RAG, open source (coming soon).',
      author: 'stash_pomichter',
      publishDate: new Date().toISOString(),
      wordCount: 12,
      readingTime: 0,
      language: 'en',
      tags: ['spatial-memory', 'spatiotemporal', 'RAG', 'robots', 'open-source', 'spatial', 'memory']
    }
  },
  {
    userId: 'luthira.abeykoon@gmail.com',
    content: 'only in sf will you find someone dressed up as Claude for halloween',
    timestamp: new Date('2025-10-19T04:28:00.000Z').toISOString(),
    category: 'social',
    source: 'x.com/miralizain',
    metadata: {
      url: 'https://x.com/miralizain/status/1979766528733249817?s=20',
      title: 'Claude Halloween Costume in SF',
      domain: 'x.com',
      description: 'Tweet from @miralizain highlighting a Claude-themed Halloween costume spotted in San Francisco.',
      excerpt: 'only in sf will you find someone dressed up as Claude for halloween',
      author: 'miralizain',
      publishDate: '2025-10-19T04:28:00.000Z',
      wordCount: 14,
      readingTime: 0,
      language: 'en',
      tags: ['claude', 'anthropic', 'halloween', 'sf', 'ai-community', 'costumes'],
      imageUrl: 'https://pbs.twimg.com/media/G3mLJ-XWUAAadK9?format=jpg&name=900x900',
      imageAlt: 'Group at a Halloween party with a Claude-themed sash costume.'
    }
  }
]

async function addManualMemory() {
  try {
    console.log('🔄 Adding manual memories to Weaviate')

    const { weaviateService } = await import('../lib/weaviate')

    await weaviateService.initializeSchema()

    for (const memory of manualMemories) {
      console.log(`📝 Storing: ${memory.metadata?.title ?? memory.content.slice(0, 32)}`)
      const id = await weaviateService.storeMemory(memory)
      console.log('✅ Stored with ID:', id)
    }
  } catch (error) {
    console.error('❌ Error adding manual memories:', error)
    process.exit(1)
  }
}

addManualMemory().then(() => process.exit(0))

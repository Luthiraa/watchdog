#!/usr/bin/env tsx
import { config } from 'dotenv'
import path from 'path'

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local')
config({ path: envPath })

console.log('🔍 Environment variables loaded:')
console.log('   WEAVIATE_HOST:', process.env.WEAVIATE_HOST)
console.log('   WEAVIATE_API_KEY:', process.env.WEAVIATE_API_KEY ? `Set (${process.env.WEAVIATE_API_KEY.substring(0, 10)}...)` : 'Not set')

import { weaviateService } from '../lib/weaviate.js'

async function testLoginStorage() {
  console.log('🧪 Testing manual login event storage...')
  
  try {
    // Store a test login event
    const memoryId = await weaviateService.storeMemory({
      userId: 'test@example.com',
      content: 'Test user logged in via Google OAuth',
      timestamp: new Date().toISOString(),
      category: 'authentication',
      source: 'manual_test',
      metadata: {
        provider: 'google',
        userName: 'Test User',
        loginTime: new Date().toISOString(),
      },
    })
    
    console.log(`✅ Test login event stored successfully! Memory ID: ${memoryId}`)
    
    // Query to verify it was stored
    console.log('\n🔍 Querying stored memories...')
    const memories = await weaviateService.getUserMemories('test@example.com', 10)
    console.log(`Found ${memories.length} memories for test@example.com:`)
    
    memories.forEach((memory, index) => {
      console.log(`${index + 1}. [${memory.category}] ${memory.content}`)
      console.log(`   Source: ${memory.source} | Time: ${memory.timestamp}`)
      if (memory.metadata) {
        console.log(`   Metadata:`, memory.metadata)
      }
      console.log()
    })
    
  } catch (error) {
    console.error('❌ Error testing login storage:', error)
  }
}

testLoginStorage()
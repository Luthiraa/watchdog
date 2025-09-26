import { config } from 'dotenv'
config({ path: '.env.local' })

import { weaviateService } from '../lib/weaviate'
import { sampleWebpageMemories } from './sample-data'

async function addSampleData() {
  try {
    console.log('🔄 Adding sample webpage data with enhanced metadata...')
    
    // Initialize schema
    await weaviateService.initializeSchema()
    console.log('✅ Schema initialized')
    
    // Add sample memories
    for (const memory of sampleWebpageMemories) {
      console.log(`📝 Adding: ${memory.metadata.title}`)
      const memoryId = await weaviateService.storeMemory(memory)
      console.log(`✅ Stored with ID: ${memoryId}`)
    }
    
    console.log('\n🎉 Sample data added successfully!')
    console.log('You can now test search with queries like:')
    console.log('- "React hooks"')
    console.log('- "Next.js app router"') 
    console.log('- "TypeScript types"')
    console.log('- "JavaScript documentation"')
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error)
  }
}

addSampleData().then(() => {
  process.exit(0)
}).catch(error => {
  console.error('💥 Script crashed:', error)
  process.exit(1)
})
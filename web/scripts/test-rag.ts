import { config } from 'dotenv'
config({ path: '.env.local' })

import { weaviateService } from '../lib/weaviate'

async function testConnection() {
  try {
    console.log('🔍 Testing Weaviate connection...')
    
    // Try to initialize schema first
    await weaviateService.initializeSchema()
    console.log('✅ Schema initialized successfully')
    
    // Test storing a sample memory with webpage metadata
    const sampleMemory = {
      userId: 'test@example.com',
      content: 'This is a test webpage about React documentation that explains hooks and state management.',
      timestamp: new Date().toISOString(),
      category: 'web',
      source: 'browser-extension',
      metadata: {
        url: 'https://reactjs.org/docs/hooks-intro.html',
        title: 'Introducing Hooks – React',
        domain: 'reactjs.org',
        excerpt: 'Learn about React Hooks and how they let you use state and other React features'
      }
    }
    
    console.log('📝 Storing sample memory...')
    const memoryId = await weaviateService.storeMemory(sampleMemory)
    console.log(`✅ Memory stored with ID: ${memoryId}`)
    
    // Test RAG search
    console.log('🧠 Testing RAG search...')
    const searchResults = await weaviateService.searchMemoriesWithRAG(
      'test@example.com',
      'React hooks documentation',
      5
    )
    console.log(`🎯 Found ${searchResults.length} results:`)
    searchResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.metadata?.title || 'No title'} (${result.metadata?.domain || 'No domain'})`)
      console.log(`   Score: ${result._ragScore ? (result._ragScore * 100).toFixed(1) : 'N/A'}%`)
      console.log(`   Content: ${result.content.substring(0, 100)}...`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testConnection().then(() => {
  console.log('🏁 Test completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Test crashed:', error)
  process.exit(1)
})
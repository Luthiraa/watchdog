// Load environment variables directly by parsing .env.local
import { readFileSync } from 'fs'
import { join } from 'path'

function loadEnvironmentVariables() {
  try {
    const envPath = join(process.cwd(), '.env.local')
    console.log('🔍 Loading environment from:', envPath)
    
    const envContent = readFileSync(envPath, 'utf-8')
    const lines = envContent.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const equalIndex = trimmed.indexOf('=')
        if (equalIndex !== -1) {
          const key = trimmed.substring(0, equalIndex).trim()
          const value = trimmed.substring(equalIndex + 1).trim()
          process.env[key] = value
        }
      }
    }
    
    console.log('📋 Environment variables loaded:')
    console.log(`   WEAVIATE_HOST: ${process.env.WEAVIATE_HOST}`)
    console.log(`   WEAVIATE_API_KEY: ${process.env.WEAVIATE_API_KEY ? 'Set (' + process.env.WEAVIATE_API_KEY.substring(0, 10) + '...)' : 'Not set'}`)
    
  } catch (error) {
    console.error('❌ Failed to load .env.local:', error)
    process.exit(1)
  }
}

// Load environment variables first
loadEnvironmentVariables()

// Now create a client manually to query the database
import weaviate from 'weaviate-ts-client'

const client = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_HOST!,
  apiKey: {
    apiKey: process.env.WEAVIATE_API_KEY!,
  },
})

async function queryUsers() {
  try {
    console.log('\n🔍 Querying for stored user data...')
    
    // First, check what classes exist in the schema
    console.log('\n📊 Checking database schema...')
    const schema = await client.schema.getter().do()
    
    if (schema.classes && schema.classes.length > 0) {
      console.log('\n📋 Available classes:')
      schema.classes.forEach(cls => {
        console.log(`   - ${cls.class}: ${cls.description || 'No description'}`)
      })
      
      // Check if UserMemory class exists
      const userMemoryClass = schema.classes.find(cls => cls.class === 'UserMemory')
      
      if (userMemoryClass) {
        console.log('\n🔍 Querying UserMemory class for stored data...')
        
        // Get all user memories to see what users have logged in
        const result = await client.graphql
          .get()
          .withClassName('UserMemory')
          .withFields('userId content timestamp category source')
          .withLimit(50)
          .do()
        
        if (result.data && result.data.Get && result.data.Get.UserMemory) {
          const memories = result.data.Get.UserMemory
          console.log(`\n✅ Found ${memories.length} stored memories`)
          
          // Extract unique users
          const uniqueUsers = new Set()
          memories.forEach((memory: any) => {
            if (memory.userId) {
              uniqueUsers.add(memory.userId)
            }
          })
          
          console.log(`\n👤 Unique users found: ${uniqueUsers.size}`)
          uniqueUsers.forEach(userId => {
            console.log(`   - ${userId}`)
          })
          
          console.log('\n📝 Recent memories:')
          memories.slice(0, 10).forEach((memory: any, index: number) => {
            console.log(`   ${index + 1}. User: ${memory.userId}`)
            console.log(`      Content: ${memory.content?.substring(0, 100)}${memory.content?.length > 100 ? '...' : ''}`)
            console.log(`      Time: ${memory.timestamp}`)
            console.log(`      Category: ${memory.category || 'N/A'}`)
            console.log('')
          })
        } else {
          console.log('\n📭 No memories found in the database')
        }
      } else {
        console.log('\n❌ UserMemory class not found. The schema may not be initialized yet.')
        console.log('   Run: npm run init-weaviate')
      }
    } else {
      console.log('\n📭 No classes found in the schema')
    }
    
  } catch (error) {
    console.error('❌ Error querying database:', error)
    process.exit(1)
  }
}

queryUsers()
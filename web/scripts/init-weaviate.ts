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
    console.log(`   WEAVIATE_VECTORIZER: ${process.env.WEAVIATE_VECTORIZER}`)
    
  } catch (error) {
    console.error('❌ Failed to load .env.local:', error)
    process.exit(1)
  }
}

// Load environment variables first
loadEnvironmentVariables()

// Create weaviate client directly here to avoid module-level imports
import weaviate from 'weaviate-ts-client'

const client = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_HOST!,
  apiKey: {
    apiKey: process.env.WEAVIATE_API_KEY!,
  },
})

async function initializeWeaviate() {
  try {
    console.log('\n🔧 Initializing Weaviate schema...')
    console.log(`📡 Connecting to: ${process.env.WEAVIATE_HOST}`)
    console.log(`🔑 Using vectorizer: ${process.env.WEAVIATE_VECTORIZER}`)
    
    if (!process.env.WEAVIATE_HOST || !process.env.WEAVIATE_API_KEY) {
      throw new Error('Missing required environment variables: WEAVIATE_HOST or WEAVIATE_API_KEY')
    }
    
    // Check if class exists
    const className = 'UserMemory'
    const exists = await client.schema.exists(className)
    
    if (!exists) {
      console.log('📊 Creating UserMemory schema...')
      
      // Create the schema for user memories
      await client.schema
        .classCreator()
        .withClass({
          class: className,
          description: 'User-specific memories and embeddings',
          vectorizer: 'none', // We'll add vectors manually via API
          properties: [
            {
              name: 'userId',
              dataType: ['text'],
              description: 'The ID of the user who owns this memory',
              indexFilterable: true,
              indexSearchable: false,
            },
            {
              name: 'content',
              dataType: ['text'],
              description: 'The actual memory content or search query',
              indexFilterable: false,
              indexSearchable: true,
            },
            {
              name: 'timestamp',
              dataType: ['text'],
              description: 'When this memory was created',
              indexFilterable: true,
              indexSearchable: false,
            },
            {
              name: 'category',
              dataType: ['text'],
              description: 'Category of memory (search, authentication, etc.)',
              indexFilterable: true,
              indexSearchable: false,
            },
            {
              name: 'source',
              dataType: ['text'],
              description: 'Source of the memory (user input, system, etc.)',
              indexFilterable: true,
              indexSearchable: false,
            },
            {
              name: 'metadata',
              dataType: ['text'],
              description: 'Additional metadata as JSON string',
              indexFilterable: false,
              indexSearchable: false,
            },
          ],
        })
        .do()
      
      console.log('✅ UserMemory schema created successfully!')
    } else {
      console.log('✅ UserMemory schema already exists!')
    }
    
    console.log('✅ Weaviate schema initialized successfully!')
  } catch (error) {
    console.error('❌ Error initializing Weaviate schema:', error)
    process.exit(1)
  }
}

initializeWeaviate()
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

// Now import weaviate service after env vars are loaded
import { weaviateService } from '../lib/weaviate'

async function initializeWeaviate() {
  try {
    console.log('\n🔧 Initializing Weaviate schema...')
    console.log(`📡 Connecting to: ${process.env.WEAVIATE_HOST}`)
    console.log(`🔑 Using vectorizer: ${process.env.WEAVIATE_VECTORIZER}`)
    
    if (!process.env.WEAVIATE_HOST || !process.env.WEAVIATE_API_KEY) {
      throw new Error('Missing required environment variables: WEAVIATE_HOST or WEAVIATE_API_KEY')
    }
    
    await weaviateService.initializeSchema()
    console.log('✅ Weaviate schema initialized successfully!')
  } catch (error) {
    console.error('❌ Error initializing Weaviate schema:', error)
    process.exit(1)
  }
}

initializeWeaviate()
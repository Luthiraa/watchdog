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
    
    console.log('📋 Environment variables loaded')
    
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

async function resetSchema() {
  try {
    console.log('\n🔧 Resetting Weaviate schema...')
    console.log(`📡 Connecting to: ${process.env.WEAVIATE_HOST}`)
    
    if (!process.env.WEAVIATE_HOST || !process.env.WEAVIATE_API_KEY) {
      throw new Error('Missing required environment variables: WEAVIATE_HOST or WEAVIATE_API_KEY')
    }
    
    const className = 'UserMemory'
    const exists = await client.schema.exists(className)
    
    if (exists) {
      console.log(`⚠️  Deleting existing ${className} schema...`)
      await client.schema.classDeleter().withClassName(className).do()
      console.log(`✅ ${className} schema deleted!`)
    } else {
      console.log(`ℹ️  ${className} schema does not exist`)
    }
    
    console.log('✅ Schema reset complete!')
    console.log('🚀 Run: npm run init-weaviate')
    
  } catch (error) {
    console.error('❌ Error resetting schema:', error)
    process.exit(1)
  }
}

resetSchema()

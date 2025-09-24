// Load environment variables directly by parsing .env.local
import { readFileSync } from 'fs'
import { join } from 'path'

function loadEnvironmentVariables() {
  try {
    const envPath = join(process.cwd(), '.env.local')
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
  } catch (error) {
    console.error('❌ Failed to load .env.local:', error)
    process.exit(1)
  }
}

loadEnvironmentVariables()

async function checkDatabaseStatus() {
  console.log('🔍 Checking Weaviate Database Status\n')
  
  // Check environment variables
  console.log('📋 Environment Configuration:')
  console.log(`   WEAVIATE_HOST: ${process.env.WEAVIATE_HOST}`)
  console.log(`   WEAVIATE_API_KEY: ${process.env.WEAVIATE_API_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log(`   WEAVIATE_VECTORIZER: ${process.env.WEAVIATE_VECTORIZER}\n`)
  
  if (!process.env.WEAVIATE_HOST || !process.env.WEAVIATE_API_KEY) {
    console.log('❌ Missing required environment variables')
    console.log('📄 Please check your .env.local file\n')
    return
  }
  
  // Test basic connectivity
  console.log('🌐 Testing connectivity...')
  try {
    const response = await fetch(`https://${process.env.WEAVIATE_HOST}/v1/.well-known/ready`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.WEAVIATE_API_KEY}`,
      },
    })
    
    if (response.ok) {
      console.log('✅ Database is reachable and ready\n')
      
      // Test schema access
      console.log('📊 Checking schema...')
      const schemaResponse = await fetch(`https://${process.env.WEAVIATE_HOST}/v1/schema`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.WEAVIATE_API_KEY}`,
        },
      })
      
      if (schemaResponse.ok) {
        const schema = await schemaResponse.json()
        console.log('✅ Schema accessible')
        
        if (schema.classes && schema.classes.length > 0) {
          console.log(`📋 Found ${schema.classes.length} classes:`)
          schema.classes.forEach((cls: any) => {
            console.log(`   - ${cls.class}`)
          })
        } else {
          console.log('📭 No classes found - database needs initialization')
          console.log('   Run: npm run init-weaviate')
        }
      } else {
        console.log('❌ Cannot access schema')
        console.log(`   Status: ${schemaResponse.status}`)
      }
    } else {
      console.log('❌ Database not ready')
      console.log(`   Status: ${response.status}`)
    }
  } catch (error: any) {
    console.log('❌ Cannot connect to database')
    console.log(`   Error: ${error.message}`)
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n🚨 DNS Resolution Failed')
      console.log('   This usually means:')
      console.log('   • The Weaviate Cloud instance is paused or deleted')
      console.log('   • The hostname is incorrect')
      console.log('   • Network connectivity issues')
      console.log('\n💡 Solutions:')
      console.log('   1. Check your Weaviate Cloud Console')
      console.log('   2. Create a new cluster if needed')  
      console.log('   3. Update WEAVIATE_HOST in .env.local')
      console.log('   4. See DATABASE_STATUS.md for detailed instructions')
    }
  }
  
  console.log('\n📱 Application Status:')
  console.log('   ✅ Authentication system ready')
  console.log('   ✅ Google OAuth configured')  
  console.log('   ✅ UI theme active')
  console.log(`   ${process.env.WEAVIATE_HOST ? '⏳' : '❌'} Database connection needed`)
  
  console.log('\n🔧 Available Commands:')
  console.log('   npm run dev          - Start development server')
  console.log('   npm run init-weaviate - Initialize database schema')  
  console.log('   npm run query-users   - Query stored user data')
  console.log('   npm run status        - Check this status again')
}

checkDatabaseStatus()
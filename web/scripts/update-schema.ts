import { weaviateService } from '../lib/weaviate'

async function updateSchema() {
  try {
    console.log('🔄 Updating Weaviate schema with new fields...')
    
    // Initialize the schema (this will add new fields if they don't exist)
    await weaviateService.initializeSchema()
    
    console.log('✅ Schema updated successfully!')
    console.log('New fields added: url, title, domain')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error updating schema:', error)
    process.exit(1)
  }
}

updateSchema()
import { config } from 'dotenv';
import { join } from 'path';
import weaviate from 'weaviate-ts-client';

// Load environment variables first
const envPath = join(process.cwd(), '.env.local');
config({ path: envPath });

console.log('🔍 Loading environment from:', envPath);
console.log('📋 Environment variables loaded:');
console.log('   WEAVIATE_HOST:', process.env.WEAVIATE_HOST);
console.log('   WEAVIATE_API_KEY:', process.env.WEAVIATE_API_KEY ? `Set (${process.env.WEAVIATE_API_KEY?.substring(0, 10)}...)` : 'Not set');

// Create Weaviate client directly with environment variables
const client = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_HOST!,
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!)
});

async function cleanupDuplicateLogins() {
  try {
    console.log('\n🧹 Starting cleanup of duplicate login records...');
    
    const userId = 'angelaawooo@gmail.com';
    
    // First, let's check the schema to see what fields are available
    console.log('📋 Checking schema...');
    const schema = await client.schema.getter().do();
    const userMemoryClass = schema.classes?.find((c: any) => c.class === 'UserMemory');
    console.log('UserMemory class properties:', userMemoryClass?.properties?.map((p: any) => p.name));
    
    // Get all UserMemory objects for this user using available fields
    const response = await client.graphql
      .get()
      .withClassName('UserMemory')
      .withFields('content timestamp userId category source metadata _additional { id }')
      .withWhere({
        operator: 'And',
        operands: [
          {
            path: ['userId'],
            operator: 'Equal',
            valueString: userId
          },
          {
            path: ['category'],
            operator: 'Equal',
            valueString: 'authentication'
          }
        ]
      })
      .withLimit(100)
      .do();
    
    const memories = response.data?.Get?.UserMemory || [];
    console.log(`📊 Found ${memories.length} authentication records`);
    
    // Keep only the most recent one and delete the rest
    if (memories.length > 1) {
      // Sort by timestamp descending (most recent first)
      const sortedRecords = memories.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Keep the most recent one
      const keepRecord = sortedRecords[0];
      const deleteRecords = sortedRecords.slice(1);
      
      console.log(`\n✅ Keeping most recent record: ${keepRecord.content} (${keepRecord.timestamp})`);
      console.log(`🗑️ Deleting ${deleteRecords.length} duplicate records...`);
      
      let deletedCount = 0;
      for (const record of deleteRecords) {
        try {
          await client.data.deleter()
            .withClassName('UserMemory')
            .withId(record._additional.id)
            .do();
          
          deletedCount++;
          console.log(`   ✅ Deleted: ${record.content.substring(0, 50)}... (${record.timestamp})`);
        } catch (error) {
          console.error(`   ❌ Failed to delete record ${record._additional.id}:`, error);
        }
      }
      
      console.log(`\n🎉 Cleanup completed! Deleted ${deletedCount} duplicate login records.`);
      console.log(`📊 Authentication records remaining: 1`);
    } else {
      console.log('✅ No duplicate records found - nothing to clean up');
    }
    
    // Also clean up debug records
    const debugResponse = await client.graphql
      .get()
      .withClassName('UserMemory')
      .withFields('content timestamp userId category source metadata _additional { id }')
      .withWhere({
        operator: 'And',
        operands: [
          {
            path: ['userId'],
            operator: 'Equal',
            valueString: userId
          },
          {
            path: ['category'],
            operator: 'Equal',
            valueString: 'debug'
          }
        ]
      })
      .withLimit(100)
      .do();
    
    const debugMemories = debugResponse.data?.Get?.UserMemory || [];
    
    if (debugMemories.length > 0) {
      console.log(`\n🧹 Cleaning up ${debugMemories.length} debug records...`);
      let debugDeleted = 0;
      for (const record of debugMemories) {
        try {
          await client.data.deleter()
            .withClassName('UserMemory')
            .withId(record._additional.id)
            .do();
          debugDeleted++;
        } catch (error) {
          console.error(`Failed to delete debug record ${record._additional.id}:`, error);
        }
      }
      console.log(`✅ Deleted ${debugDeleted} debug records`);
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupDuplicateLogins().then(() => {
  console.log('\n✅ Cleanup script completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Cleanup script failed:', error);
  process.exit(1);
});
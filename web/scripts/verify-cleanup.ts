import { config } from 'dotenv';
import { join } from 'path';
import weaviate from 'weaviate-ts-client';

// Load environment variables first
const envPath = join(process.cwd(), '.env.local');
config({ path: envPath });

// Create Weaviate client
const client = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_HOST!,
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!)
});

async function verifyCleanup() {
  try {
    console.log('🔍 Verifying cleanup results...\n');
    
    const userId = 'angelaawooo@gmail.com';
    
    // Check authentication records
    const authResponse = await client.graphql
      .get()
      .withClassName('UserMemory')
      .withFields('content timestamp category _additional { id }')
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
    
    const authRecords = authResponse.data?.Get?.UserMemory || [];
    console.log(`📊 Authentication records found: ${authRecords.length}`);
    
    if (authRecords.length > 0) {
      authRecords.forEach((record: any, index: number) => {
        console.log(`   ${index + 1}. ${record.content} (${record.timestamp})`);
      });
    }
    
    // Check all records for this user
    const allResponse = await client.graphql
      .get()
      .withClassName('UserMemory')
      .withFields('content timestamp category _additional { id }')
      .withWhere({
        path: ['userId'],
        operator: 'Equal',
        valueString: userId
      })
      .withLimit(100)
      .do();
    
    const allRecords = allResponse.data?.Get?.UserMemory || [];
    console.log(`\n📋 Total records for user: ${allRecords.length}`);
    
    // Group by category
    const byCategory = allRecords.reduce((acc: any, record: any) => {
      if (!acc[record.category]) acc[record.category] = 0;
      acc[record.category]++;
      return acc;
    }, {});
    
    console.log('📊 Records by category:');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });
    
    console.log('\n✅ Verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run the verification
verifyCleanup().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Verification script failed:', error);
  process.exit(1);
});
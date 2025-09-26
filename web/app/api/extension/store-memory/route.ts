import { NextRequest, NextResponse } from 'next/server';
import { weaviateService } from '@/lib/weaviate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, memories } = body;

    if (!userId || !Array.isArray(memories)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected userId and memories array.' },
        { status: 400 }
      );
    }

    // Initialize Weaviate schema
    await weaviateService.initializeSchema();

    const results = [];
    
    for (const memory of memories) {
      try {
        // Check if this URL has been stored recently (within last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const existing = await weaviateService.searchMemories(
          userId,
          memory.metadata.url,
          1,
          'browsing'
        );

        // Skip if URL was recently stored
        if (existing.length > 0) {
          const existingTimestamp = new Date(existing[0].timestamp);
          const oneHourAgoDate = new Date(oneHourAgo);
          
          if (existingTimestamp > oneHourAgoDate) {
            console.log(`Skipping duplicate URL: ${memory.metadata.url}`);
            results.push({ 
              url: memory.metadata.url, 
              status: 'skipped',
              reason: 'recently_stored' 
            });
            continue;
          }
        }

        const memoryId = await weaviateService.storeMemory({
          userId,
          content: memory.content,
          timestamp: memory.timestamp,
          category: 'browsing',
          source: 'chrome_extension',
          metadata: memory.metadata,
        });

        results.push({ 
          url: memory.metadata.url, 
          memoryId, 
          status: 'stored' 
        });
        
      } catch (error) {
        console.error('Error storing individual memory:', error);
        results.push({ 
          url: memory.metadata?.url || 'unknown', 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      results,
      stored: results.filter(r => r.status === 'stored').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length
    });

  } catch (error) {
    console.error('Error in store-memory API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
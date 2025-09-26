import weaviate from 'weaviate-ts-client';

const client = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_HOST!, // Your Weaviate cluster endpoint
  apiKey: {
    apiKey: process.env.WEAVIATE_API_KEY!,
  },
  // No OpenAI API key needed for open-source models
});

export interface UserMemory {
  id?: string;
  userId: string;
  content: string;
  timestamp: string;
  category?: string;
  source?: string;
  metadata?: {
    url?: string;
    title?: string;
    pageTitle?: string;
    domain?: string;
    excerpt?: string;
    description?: string;
    tags?: string[];
    author?: string;
    publishDate?: string;
    wordCount?: number;
    readingTime?: number;
    favicon?: string;
    ogImage?: string;
    language?: string;
    certainty?: number;
    score?: number;
    [key: string]: any;
  };
  _ragScore?: number;
}

export class WeaviateService {
  private className = 'UserMemory';

  async initializeSchema() {
    try {
      // Check if class exists
      const exists = await client.schema.exists(this.className);
      
      if (!exists) {
        // Create the schema for user memories
        await client.schema
          .classCreator()
          .withClass({
            class: this.className,
            description: 'User-specific memories and embeddings',
            vectorizer: 'text2vec-transformers',
            moduleConfig: {
              'text2vec-transformers': {
                poolingStrategy: 'masked_mean',
                model: 'sentence-transformers/all-MiniLM-L6-v2',
              },
            },
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
                description: 'The actual content/memory text',
                indexFilterable: false,
                indexSearchable: true,
              },
              {
                name: 'timestamp',
                dataType: ['date'],
                description: 'When this memory was created',
                indexFilterable: true,
                indexSearchable: false,
              },
              {
                name: 'category',
                dataType: ['text'],
                description: 'Category of the memory (docs, notes, tasks, etc.)',
                indexFilterable: true,
                indexSearchable: false,
              },
              {
                name: 'source',
                dataType: ['text'],
                description: 'Source of the memory (file, chat, etc.)',
                indexFilterable: true,
                indexSearchable: false,
              },
              {
                name: 'metadata',
                dataType: ['object'],
                description: 'Additional metadata as JSON',
                indexFilterable: false,
                indexSearchable: false,
              },
              {
                name: 'url',
                dataType: ['text'],
                description: 'URL of the webpage or source',
                indexFilterable: true,
                indexSearchable: false,
              },
              {
                name: 'title',
                dataType: ['text'],
                description: 'Title of the webpage or document',
                indexFilterable: false,
                indexSearchable: true,
              },
              {
                name: 'domain',
                dataType: ['text'],
                description: 'Domain of the webpage',
                indexFilterable: true,
                indexSearchable: false,
              },
            ],
          })
          .do();
      }
    } catch (error) {
      console.error('Error initializing Weaviate schema:', error);
      throw error;
    }
  }

  async storeMemory(memory: UserMemory): Promise<string> {
    try {
      const result = await client.data
        .creator()
        .withClassName(this.className)
        .withProperties({
          userId: memory.userId,
          content: memory.content,
          timestamp: memory.timestamp,
          category: memory.category || 'general',
          source: memory.source || 'manual',
          metadata: memory.metadata ? JSON.stringify(memory.metadata) : '{}',
          url: memory.metadata?.url || '',
          title: memory.metadata?.title || memory.metadata?.pageTitle || '',
          domain: memory.metadata?.domain || (memory.metadata?.url ? new URL(memory.metadata.url).hostname : ''),
        })
        .do();

      return result.id || '';
    } catch (error) {
      console.error('Error storing memory:', error);
      throw error;
    }
  }

  async searchMemoriesWithRAG(
    userId: string,
    query: string,
    limit: number = 10,
    category?: string
  ): Promise<UserMemory[]> {
    try {
      console.log('🧠 Running RAG search for user:', userId, 'with query:', query)

      // Use hybrid search combining vector and keyword search
      const searchResults = await this.searchMemories(userId, query, limit * 2, category)
      
      // Re-rank results based on relevance and recency
      const rankedResults = searchResults
        .map(memory => {
          let score = 0
          
          // Vector similarity score (if available)
          if (memory.metadata?.certainty) {
            score += memory.metadata.certainty * 0.6
          }
          
          // Keyword matching score
          const queryWords = query.toLowerCase().split(/\s+/)
          const contentWords = memory.content.toLowerCase()
          const titleWords = memory.metadata?.title?.toLowerCase() || ''
          
          const keywordMatches = queryWords.filter(word => 
            contentWords.includes(word) || titleWords.includes(word)
          ).length
          
          score += (keywordMatches / queryWords.length) * 0.3
          
          // Recency boost
          const daysSinceCreation = (Date.now() - new Date(memory.timestamp).getTime()) / (1000 * 60 * 60 * 24)
          const recencyScore = Math.max(0, 1 - (daysSinceCreation / 30)) // Boost recent items
          score += recencyScore * 0.1
          
          return { ...memory, _ragScore: score }
        })
        .sort((a, b) => (b._ragScore || 0) - (a._ragScore || 0))
        .slice(0, limit)

      console.log(`🎯 RAG search completed: ${rankedResults.length} results ranked and returned`)
      return rankedResults
    } catch (error) {
      console.error('❌ Error in RAG search:', error)
      // Fallback to regular search
      return this.searchMemories(userId, query, limit, category)
    }
  }

  async searchMemories(
    userId: string, 
    query: string, 
    limit: number = 10,
    category?: string
  ): Promise<UserMemory[]> {
    try {
      console.log('🔍 Searching memories for user:', userId, 'with query:', query)

      let whereFilter: any = {
        path: ['userId'],
        operator: 'Equal',
        valueText: userId,
      };

      // Add category filter if specified
      if (category) {
        whereFilter = {
          operator: 'And',
          operands: [
            whereFilter,
            {
              path: ['category'],
              operator: 'Equal',
              valueText: category,
            },
          ],
        };
      }

      let result;
      
      try {
        // Try with nearText first (requires vectorization)
        result = await client.graphql
          .get()
          .withClassName(this.className)
          .withFields('userId content timestamp category source metadata url title domain _additional { id certainty score }')
          .withWhere(whereFilter)
          .withNearText({
            concepts: [query],
            distance: 0.7 // Adjust for similarity threshold
          })
          .withLimit(limit)
          .do();
      } catch (vectorError) {
        console.log('📝 Vector search not available, falling back to text search...')
        
        // Fallback to text-based filtering
        const textSearchFilter = {
          operator: 'And' as const,
          operands: [
            whereFilter,
            {
              operator: 'Like' as const,
              valueText: `*${query}*`,
              path: ['content']
            }
          ]
        };

        result = await client.graphql
          .get()
          .withClassName(this.className)
          .withFields('userId content timestamp category source metadata url title domain _additional { id }')
          .withWhere(textSearchFilter)
          .withLimit(limit)
          .do();
      }

      const memories = result.data?.Get?.[this.className] || [];
      console.log(`✅ Found ${memories.length} memories`);
      
      return memories.map((item: any) => ({
        id: item._additional.id,
        userId: item.userId,
        content: item.content,
        timestamp: item.timestamp,
        category: item.category,
        source: item.source,
        metadata: {
          ...(item.metadata ? JSON.parse(item.metadata) : {}),
          url: item.url,
          title: item.title,
          domain: item.domain,
          certainty: item._additional?.certainty,
          score: item._additional?.score,
        },
      }));
    } catch (error) {
      console.error('❌ Error searching memories:', error);
      throw error;
    }
  }

  async getUserMemories(
    userId: string, 
    limit: number = 50,
    category?: string
  ): Promise<UserMemory[]> {
    try {
      let whereFilter: any = {
        path: ['userId'],
        operator: 'Equal',
        valueText: userId,
      };

      if (category) {
        whereFilter = {
          operator: 'And',
          operands: [
            whereFilter,
            {
              path: ['category'],
              operator: 'Equal',
              valueText: category,
            },
          ],
        };
      }

      const result = await client.graphql
        .get()
        .withClassName(this.className)
        .withFields('userId content timestamp category source metadata url title domain _additional { id }')
        .withWhere(whereFilter)
        .withLimit(limit)
        .withSort([{ path: ['timestamp'], order: 'desc' }])
        .do();

      return result.data.Get[this.className].map((item: any) => ({
        id: item._additional.id,
        userId: item.userId,
        content: item.content,
        timestamp: item.timestamp,
        category: item.category,
        source: item.source,
        metadata: {
          ...(item.metadata ? JSON.parse(item.metadata) : {}),
          url: item.url,
          title: item.title,
          domain: item.domain,
        },
      }));
    } catch (error) {
      console.error('Error getting user memories:', error);
      throw error;
    }
  }

  async updateOrCreateLoginSession(userId: string, userInfo: any): Promise<string> {
    try {
      // First check for existing login session within the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const existingSession = await client.graphql
        .get()
        .withClassName(this.className)
        .withFields('userId content timestamp metadata _additional { id }')
        .withWhere({
          operator: 'And',
          operands: [
            {
              path: ['userId'],
              operator: 'Equal',
              valueText: userId,
            },
            {
              path: ['category'],
              operator: 'Equal',
              valueText: 'authentication',
            },
            {
              path: ['timestamp'],
              operator: 'GreaterThan',
              valueDate: oneDayAgo,
            },
          ],
        })
        .withLimit(1)
        .withSort([{ path: ['timestamp'], order: 'desc' }])
        .do();

      const sessions = existingSession.data.Get[this.className];
      
      if (sessions && sessions.length > 0) {
        // Update existing session
        const sessionId = sessions[0]._additional.id;
        const currentTime = new Date().toISOString();
        
        await client.data
          .updater()
          .withId(sessionId)
          .withClassName(this.className)
          .withProperties({
            timestamp: currentTime,
            content: `Session updated: ${userInfo.name} (${userInfo.email}) - Last active: ${currentTime}`,
            metadata: JSON.stringify({
              ...userInfo,
              lastLogin: currentTime,
              sessionType: 'updated',
            }),
          })
          .do();
          
        console.log(`Updated existing session for ${userInfo.email}`);
        return sessionId;
      } else {
        // Create new session
        const newSessionId = await this.storeMemory({
          userId,
          content: `New session started: ${userInfo.name} (${userInfo.email})`,
          timestamp: new Date().toISOString(),
          category: 'authentication',
          source: 'oauth',
          metadata: {
            ...userInfo,
            sessionType: 'new',
            firstLogin: new Date().toISOString(),
          },
        });
        
        console.log(`Created new session for ${userInfo.email}`);
        return newSessionId;
      }
    } catch (error) {
      console.error('Error updating/creating login session:', error);
      throw error;
    }
  }

  async cleanupOldLoginRecords(userId: string): Promise<number> {
    try {
      // Get all authentication records older than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const oldRecords = await client.graphql
        .get()
        .withClassName(this.className)
        .withFields('_additional { id }')
        .withWhere({
          operator: 'And',
          operands: [
            {
              path: ['userId'],
              operator: 'Equal',
              valueText: userId,
            },
            {
              path: ['category'],
              operator: 'Equal',
              valueText: 'authentication',
            },
            {
              path: ['timestamp'],
              operator: 'LessThan',
              valueDate: sevenDaysAgo,
            },
          ],
        })
        .withLimit(100)
        .do();

      const records = oldRecords.data.Get[this.className];
      let deletedCount = 0;

      if (records && records.length > 0) {
        for (const record of records) {
          try {
            await client.data.deleter().withId(record._additional.id).do();
            deletedCount++;
          } catch (error) {
            console.error(`Error deleting record ${record._additional.id}:`, error);
          }
        }
      }

      console.log(`Cleaned up ${deletedCount} old login records for ${userId}`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old login records:', error);
      return 0;
    }
  }

  async deleteMemory(memoryId: string, userId: string): Promise<boolean> {
    try {
      // First verify the memory belongs to the user
      const memory = await client.data.getterById().withId(memoryId).do();
      
      if (!memory.properties || memory.properties.userId !== userId) {
        throw new Error('Unauthorized: Memory does not belong to user');
      }

      await client.data.deleter().withId(memoryId).do();
      return true;
    } catch (error) {
      console.error('Error deleting memory:', error);
      throw error;
    }
  }
}

export const weaviateService = new WeaviateService();
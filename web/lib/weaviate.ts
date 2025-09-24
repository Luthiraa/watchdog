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
  metadata?: Record<string, any>;
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
        })
        .do();

      return result.id || '';
    } catch (error) {
      console.error('Error storing memory:', error);
      throw error;
    }
  }

  async searchMemories(
    userId: string, 
    query: string, 
    limit: number = 10,
    category?: string
  ): Promise<UserMemory[]> {
    try {
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

      const result = await client.graphql
        .get()
        .withClassName(this.className)
        .withFields('userId content timestamp category source metadata _additional { id certainty }')
        .withNearText({ concepts: [query] })
        .withWhere(whereFilter)
        .withLimit(limit)
        .do();

      return result.data.Get[this.className].map((item: any) => ({
        id: item._additional.id,
        userId: item.userId,
        content: item.content,
        timestamp: item.timestamp,
        category: item.category,
        source: item.source,
        metadata: item.metadata ? JSON.parse(item.metadata) : {},
      }));
    } catch (error) {
      console.error('Error searching memories:', error);
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
        .withFields('userId content timestamp category source metadata _additional { id }')
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
        metadata: item.metadata ? JSON.parse(item.metadata) : {},
      }));
    } catch (error) {
      console.error('Error getting user memories:', error);
      throw error;
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
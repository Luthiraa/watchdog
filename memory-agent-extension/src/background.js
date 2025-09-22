// Memory Agent Background Service Worker
console.log('Memory Agent background script loaded');

// Vector storage configuration
const VECTOR_STORAGE_KEY = 'memory_agent_vectors';
const EVENTS_STORAGE_KEY = 'memory_agent_events';
const MAX_CONTENT_LENGTH = 2000;

// Simple vector storage implementation using localStorage
class VectorStorage {
  constructor() {
    this.vectors = [];
    this.initialized = false;
    this.loadVectors();
  }

  async loadVectors() {
    try {
      const result = await chrome.storage.local.get([VECTOR_STORAGE_KEY]);
      this.vectors = result[VECTOR_STORAGE_KEY] || [];
      this.initialized = true;
      console.log('Loaded', this.vectors.length, 'vectors from storage');
    } catch (error) {
      console.error('Error loading vectors:', error);
      this.vectors = [];
      this.initialized = true;
    }
  }

  async saveVectors() {
    try {
      await chrome.storage.local.set({ [VECTOR_STORAGE_KEY]: this.vectors });
      console.log('Saved', this.vectors.length, 'vectors to storage');
    } catch (error) {
      console.error('Error saving vectors:', error);
    }
  }

  async waitForInitialization() {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // Simple text embedding using character frequency
  createEmbedding(text) {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const words = cleaned.split(/\s+/).filter(word => word.length > 2);
    const wordCount = {};
    
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Create a simple 50-dimensional vector based on common words
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'with', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very'];
    
    const vector = new Array(50).fill(0);
    commonWords.forEach((word, index) => {
      if (index < 50) {
        vector[index] = (wordCount[word] || 0) / words.length;
      }
    });

    return vector;
  }

  async addDocument(content, metadata) {
    await this.waitForInitialization();
    
    const embedding = this.createEmbedding(content);
    const document = {
      id: Date.now() + Math.random(),
      content,
      embedding,
      metadata,
      timestamp: Date.now()
    };
    
    this.vectors.push(document);
    await this.saveVectors();
    console.log('Added document with ID:', document.id);
    return document.id;
  }

  // Simple cosine similarity
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  async search(query, limit = 10) {
    await this.waitForInitialization();
    
    if (this.vectors.length === 0) {
      console.log('No vectors stored yet');
      return [];
    }
    
    const queryEmbedding = this.createEmbedding(query);
    
    const results = this.vectors.map(doc => ({
      ...doc,
      similarity: this.cosineSimilarity(queryEmbedding, doc.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

    console.log('Search completed, returning', results.length, 'results');
    return results;
  }
}

const vectorStorage = new VectorStorage();

// Listen for tab updates (page visits)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && !tab.url.startsWith('chrome://')) {
    console.log("Page visit detected:", tab.url);
    
    const event = {
      type: "visit",
      url: tab.url,
      title: tab.title || '',
      time: Date.now(),
      tabId: tabId
    };
    
    await saveEvent(event);
    
    // Inject content script to capture page content
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['src/content.js']
      });
    } catch (error) {
      console.log('Could not inject content script:', error);
    }
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type);
  
  if (message.type === "pageContent") {
    const content = message.text?.slice(0, MAX_CONTENT_LENGTH) || '';
    const url = sender.tab?.url || '';
    const title = sender.tab?.title || '';
    
    if (content && url) {
      // Store in vector database
      vectorStorage.addDocument(content, {
        url,
        title,
        timestamp: Date.now(),
        type: 'page_content'
      }).then(() => {
        console.log('Stored page content for:', url);
      }).catch(error => {
        console.error('Error storing page content:', error);
      });
    }
  } else if (message.type === "search") {
    console.log('Processing search request:', message.query);
    vectorStorage.search(message.query, message.limit || 10)
      .then(results => {
        console.log('Search results:', results.length, 'found');
        sendResponse({ success: true, results });
      })
      .catch(error => {
        console.error('Search error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  } else if (message.type === "userInteraction") {
    // Handle user interaction data
    saveEvent({
      type: "interaction",
      data: message.data,
      time: Date.now()
    });
  }
});

// Save events to storage
async function saveEvent(event) {
  try {
    const result = await chrome.storage.local.get([EVENTS_STORAGE_KEY]);
    let events = result[EVENTS_STORAGE_KEY] || [];
    
    events.push(event);
    
    // Keep only last 1000 events to prevent storage overflow
    if (events.length > 1000) {
      events = events.slice(-1000);
    }
    
    await chrome.storage.local.set({ [EVENTS_STORAGE_KEY]: events });
    console.log('Event saved:', event);
  } catch (error) {
    console.error('Error saving event:', error);
  }
}

// Initialize storage on extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Memory Agent extension started');
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Memory Agent extension installed');
});
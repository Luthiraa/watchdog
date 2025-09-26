// Watchdog Memory Agent Background Service Worker
console.log('🐕 Watchdog Memory Agent background script loaded');

// Configuration
const MEMORY_STORAGE_KEY = 'watchdog_memories';
const VISITED_URLS_KEY = 'watchdog_visited_urls';
const USER_KEY = 'watchdog_user';
const MAX_CONTENT_LENGTH = 2000;
const MAX_LOCAL_MEMORIES = 50; // Store up to 50 memories locally before syncing to server
const WEB_APP_URL = 'http://localhost:3001';

// Memory management class with Weaviate integration
class WatchdogMemoryManager {
  constructor() {
    this.memories = [];
    this.visitedUrls = new Set();
    this.user = null;
    this.initialized = false;
    this.initialize();
  }

  async initialize() {
    try {
      const result = await chrome.storage.local.get([
        MEMORY_STORAGE_KEY,
        VISITED_URLS_KEY,
        USER_KEY
      ]);
      
      this.memories = result[MEMORY_STORAGE_KEY] || [];
      this.visitedUrls = new Set(result[VISITED_URLS_KEY] || []);
      this.user = result[USER_KEY] || null;
      this.initialized = true;
      
      console.log('🔄 Loaded:', {
        memories: this.memories.length,
        visitedUrls: this.visitedUrls.size,
        user: this.user?.email || 'none'
      });
      
      // Check if we need to sync memories to server
      if (this.memories.length >= MAX_LOCAL_MEMORIES) {
        await this.syncMemoriesToServer();
      }
      
    } catch (error) {
      console.error('❌ Error initializing memory manager:', error);
      this.memories = [];
      this.visitedUrls = new Set();
      this.user = null;
      this.initialized = true;
    }
  }

  async waitForInitialization() {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  async saveToStorage() {
    try {
      await chrome.storage.local.set({
        [MEMORY_STORAGE_KEY]: this.memories,
        [VISITED_URLS_KEY]: Array.from(this.visitedUrls),
        [USER_KEY]: this.user
      });
    } catch (error) {
      console.error('❌ Error saving to storage:', error);
    }
  }

  async getUserFromWebApp() {
    try {
      const response = await fetch(`${WEB_APP_URL}/api/extension/get-user`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          this.user = data.user;
          await this.saveToStorage();
          console.log('👤 User authenticated:', this.user.email);
          return true;
        }
      }
      
      console.log('🔒 No authenticated user found');
      return false;
    } catch (error) {
      console.error('❌ Error getting user from web app:', error);
      return false;
    }
  }

  isUrlAlreadyVisited(url) {
    // Normalize URL by removing query parameters and fragments for duplicate checking
    const normalizedUrl = url.split('?')[0].split('#')[0];
    return this.visitedUrls.has(normalizedUrl);
  }

  markUrlAsVisited(url) {
    const normalizedUrl = url.split('?')[0].split('#')[0];
    this.visitedUrls.add(normalizedUrl);
  }

  async addMemory(content, metadata) {
    await this.waitForInitialization();

    // Check if URL was already visited
    if (metadata.url && this.isUrlAlreadyVisited(metadata.url)) {
      console.log('⏭️ Skipping already visited URL:', metadata.url);
      return null;
    }

    const memory = {
      id: Date.now() + Math.random(),
      content: content.substring(0, MAX_CONTENT_LENGTH),
      metadata: {
        ...metadata,
        capturedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
      timestamp: new Date().toISOString(),
      synced: false
    };

    this.memories.push(memory);
    
    // Mark URL as visited
    if (metadata.url) {
      this.markUrlAsVisited(metadata.url);
    }

    await this.saveToStorage();
    console.log('💾 Added memory:', memory.id, 'for URL:', metadata.url);

    // Check if we need to sync to server
    if (this.memories.length >= MAX_LOCAL_MEMORIES) {
      await this.syncMemoriesToServer();
    }

    return memory.id;
  }

  async syncMemoriesToServer() {
    if (!this.user) {
      console.log('👤 No user authenticated, attempting to get user...');
      const authenticated = await this.getUserFromWebApp();
      if (!authenticated) {
        console.log('🔒 Cannot sync - user not authenticated');
        return;
      }
    }

    const unsyncedMemories = this.memories.filter(m => !m.synced);
    if (unsyncedMemories.length === 0) {
      console.log('✅ All memories already synced');
      return;
    }

    try {
      console.log('🌐 Syncing', unsyncedMemories.length, 'memories to server...');
      
      const response = await fetch(`${WEB_APP_URL}/api/extension/store-memory`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.user.email,
          memories: unsyncedMemories
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sync successful:', result);
        
        // Mark memories as synced
        unsyncedMemories.forEach(memory => {
          memory.synced = true;
        });

        // Keep only recent memories locally (remove old synced ones)
        this.memories = this.memories
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 20); // Keep 20 most recent

        await this.saveToStorage();
        
      } else {
        console.error('❌ Failed to sync memories:', response.status);
      }
    } catch (error) {
      console.error('❌ Error syncing memories:', error);
    }
  }

  async search(query, limit = 10) {
    await this.waitForInitialization();
    
    // Simple local search by content matching
    const results = this.memories
      .filter(memory => 
        memory.content.toLowerCase().includes(query.toLowerCase()) ||
        (memory.metadata.title && memory.metadata.title.toLowerCase().includes(query.toLowerCase())) ||
        (memory.metadata.url && memory.metadata.url.toLowerCase().includes(query.toLowerCase()))
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    console.log('🔍 Local search for "' + query + '" returned', results.length, 'results');
    return results;
  }
}

const memoryManager = new WatchdogMemoryManager();

// Listen for tab updates (page visits)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && 
      tab.url && 
      !tab.url.startsWith('chrome://') && 
      !tab.url.startsWith('chrome-extension://') &&
      !tab.url.startsWith('moz-extension://')) {
    
    console.log("🌐 Page visit detected:", tab.url);
    
    // Check if this URL was already processed
    if (memoryManager.isUrlAlreadyVisited(tab.url)) {
      console.log("⏭️ URL already processed, skipping:", tab.url);
      return;
    }
    
    // Inject content script to capture page content
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['src/content.js']
      });
    } catch (error) {
      console.log('⚠️ Could not inject content script:', error);
    }
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message.type);
  
  if (message.type === "pageContent") {
    const content = message.text || '';
    const url = sender.tab?.url || '';
    const title = sender.tab?.title || '';
    
    if (content && url && content.length > 20) {
      // Store in local memory with Weaviate integration
      memoryManager.addMemory(content, {
        url,
        title,
        type: 'page_content',
        wordCount: content.split(/\s+/).length,
        headings: message.metadata?.headings || [],
        links: message.metadata?.links || []
      }).then((memoryId) => {
        if (memoryId) {
          console.log('📝 Stored page content:', memoryId, 'for URL:', url);
          sendResponse({ success: true, memoryId });
        } else {
          sendResponse({ success: false, reason: 'duplicate_url' });
        }
      }).catch(error => {
        console.error('❌ Error storing page content:', error);
        sendResponse({ success: false, error: error.message });
      });
      
      return true; // Will respond asynchronously
    }
  } else if (message.type === "search") {
    console.log('🔍 Processing search request:', message.query);
    memoryManager.search(message.query, message.limit || 10)
      .then(results => {
        console.log('🎯 Search results:', results.length, 'found');
        sendResponse({ success: true, results });
      })
      .catch(error => {
        console.error('❌ Search error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  } else if (message.type === "syncToServer") {
    console.log('🌐 Manual sync requested');
    memoryManager.syncMemoriesToServer()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('❌ Sync error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  } else if (message.type === "getStats") {
    memoryManager.waitForInitialization().then(() => {
      sendResponse({
        success: true,
        stats: {
          localMemories: memoryManager.memories.length,
          visitedUrls: memoryManager.visitedUrls.size,
          user: memoryManager.user?.email || null,
          unsyncedMemories: memoryManager.memories.filter(m => !m.synced).length
        }
      });
    });
    return true;
  }
});

// Auto-sync memories periodically (every 5 minutes)
setInterval(async () => {
  if (memoryManager.initialized && memoryManager.memories.filter(m => !m.synced).length > 0) {
    console.log('⏰ Auto-sync triggered');
    await memoryManager.syncMemoriesToServer();
  }
}, 5 * 60 * 1000); // 5 minutes

// Initialize extension
chrome.runtime.onStartup.addListener(() => {
  console.log('🐕 Watchdog Memory Agent extension started');
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log('🐕 Watchdog Memory Agent extension installed');
  
  // Try to authenticate user on install
  setTimeout(async () => {
    const authenticated = await memoryManager.getUserFromWebApp();
    if (authenticated) {
      console.log('✅ User automatically authenticated');
    } else {
      console.log('👤 User needs to authenticate via web app');
    }
  }, 2000);
});
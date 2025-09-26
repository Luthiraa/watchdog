# 🐕 Watchdog Memory Agent - Setup & Testing Guide

## 🎯 System Overview

The Watchdog Memory Agent now connects your Chrome extension directly to your Weaviate vector database through the Next.js web app. Here's how it works:

### 📊 Architecture Flow:
1. **Chrome Extension** watches your browsing activity
2. **Local Storage** temporarily stores memories with duplicate detection
3. **Auto-Sync** to Weaviate database when storage fills up (50+ memories)
4. **Weaviate Text Embeddings** using `sentence-transformers/all-MiniLM-L6-v2`
5. **Smart Duplicate Prevention** - only tracks new/unique URLs

## 🚀 Setup Instructions

### 1. Web App Setup
```bash
cd /Users/luthiraa/Documents/watchdog/web
npm run dev
```
- Web app runs at: http://localhost:3001
- Login with Google OAuth to authenticate your account

### 2. Chrome Extension Setup
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select: `/Users/luthiraa/Documents/watchdog/memory-agent-extension/`
5. Pin the extension to your toolbar (🐕 icon)

### 3. Authentication
1. Open the web app (http://localhost:3001)
2. Login with your Google account
3. The extension will automatically detect your authentication

## 🔧 Features Implemented

### ✅ Smart Memory Management
- **Local Buffer**: Stores up to 50 memories in Chrome storage
- **Auto-Sync**: When buffer is full, oldest memories sync to Weaviate
- **Duplicate Prevention**: Only tracks unique URLs (normalized, no query params)
- **Session Management**: Tracks login sessions without duplicates

### ✅ Real-time Monitoring
- **Page Content**: Captures title, headings, paragraphs, meta description
- **Smart Extraction**: Gets meaningful content (2000 char limit)
- **Metadata**: URL, domain, timestamp, word count, links
- **Background Processing**: Non-intrusive monitoring

### ✅ Extension UI Features
- **Connection Status**: Shows if user is authenticated
- **Memory Stats**: Local memories, visited URLs, unsynced count
- **Manual Sync**: Force sync to server anytime
- **Capture Tab**: Manually capture current page
- **Open Watchdog**: Direct link to web app

### ✅ Web App Integration
- **API Endpoints**: `/api/extension/store-memory`, `/api/extension/get-user`
- **Duplicate Detection**: Server-side URL checking (1-hour window)
- **User Isolation**: All memories tied to authenticated user
- **Weaviate Storage**: Full text embeddings for semantic search

## 🧪 Testing Guide

### Test 1: Authentication
1. Open extension popup (click 🐕 icon)
2. Should show "NOT AUTHENTICATED" initially
3. Click "OPEN WATCHDOG" → Login with Google
4. Return to extension popup → Should show your email

### Test 2: Automatic Browsing Capture
1. Visit different websites (news sites, blogs, documentation)
2. Extension automatically captures content in background
3. Check popup stats - "LOCAL MEMORIES" should increase
4. "VISITED URLS" tracks unique domains

### Test 3: Duplicate Prevention  
1. Visit same URL multiple times
2. Extension should only capture once
3. Console log shows "Skipping already visited URL"
4. Stats don't increase for duplicate visits

### Test 4: Manual Capture
1. Click extension → "CAPTURE TAB" button
2. Should see "✅ CAPTURED" feedback
3. Stats update immediately
4. Works even on previously visited pages

### Test 5: Auto-Sync to Weaviate
1. Browse 50+ unique pages to trigger auto-sync
2. Or click "SYNC NOW" button manually  
3. Should see "🌐 SYNCING..." then "✅ SYNCED"
4. "UNSYNCED" count should decrease

### Test 6: Web App Integration
1. Open Watchdog web app
2. Your captured memories appear in the interface
3. Can search through captured content
4. All memories tied to your user account

## 🛠️ Debugging

### Extension Console
```javascript
// Open extension popup → Right-click → Inspect
// Check console for logs:
console.log('🐕 Watchdog popup loaded');
console.log('📊 Stats received:', stats);
```

### Background Script Console  
```javascript
// Go to chrome://extensions/ → Watchdog → "service worker"
console.log('🐕 Watchdog Memory Agent background script loaded');
console.log('📝 Stored page content:', memoryId, 'for URL:', url);
```

### Web App API Logs
```bash
# Check terminal running npm run dev for API calls:
# POST /api/extension/store-memory
# GET /api/extension/get-user
```

## 📊 Expected Behavior

### Storage Lifecycle:
1. **New Page Visit** → Content captured → Stored locally
2. **50 Memories Reached** → Auto-sync to Weaviate → Keep 20 recent locally
3. **Manual Sync** → Force upload unsynced memories
4. **Duplicate URLs** → Skipped (normalized URL checking)

### Memory Structure:
```javascript
{
  id: "unique_id",
  content: "Page title, headings, and main text content...",
  timestamp: "2025-09-25T18:52:14.000Z", 
  metadata: {
    url: "https://example.com/page",
    title: "Page Title",
    domain: "example.com",
    wordCount: 245,
    headings: ["Main Heading", "Subheading"],
    links: [{url: "...", text: "..."}],
    capturedAt: "2025-09-25T18:52:14.000Z"
  },
  synced: false
}
```

## 🎉 Success Metrics

### System Working Correctly When:
- ✅ Extension shows your authenticated email  
- ✅ Auto-captures unique page content
- ✅ Prevents duplicate URL processing
- ✅ Auto-syncs when local storage fills up
- ✅ Manual sync works on demand
- ✅ Web app displays captured memories
- ✅ Search works across captured content
- ✅ All data tied to user account

### Storage Distribution:
- **Chrome Local**: 20-50 recent memories (fast access)
- **Weaviate Cloud**: All historical memories (persistent, searchable)
- **User Isolation**: Each user's data completely separate

## 🔍 Advanced Features

### Smart Content Extraction:
- Title, meta description, headings (H1-H6)
- Main paragraph content, article text  
- Meaningful links (filtered)
- Word count and reading time estimation

### Weaviate Integration:
- **Text Vectorization**: Uses `sentence-transformers/all-MiniLM-L6-v2`
- **Semantic Search**: Find content by meaning, not just keywords
- **User Scoping**: All queries filtered by userId
- **Deduplication**: Server-side URL checking prevents duplicates

Your Watchdog Memory Agent is now fully operational! 🐕✨
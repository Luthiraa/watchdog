# Memory Agent Chrome Extension

A powerful Chrome extension that acts as your personal memory agent, capturing and storing your browsing history in a vector database for intelligent semantic search.

## Features

🧠 **AI-Powered Memory**: Automatically captures page content and stores it using vector embeddings
🔍 **Semantic Search**: Find pages using natural language queries, not just keywords
📊 **User Interaction Tracking**: Monitors clicks, scrolls, and form submissions
💾 **Vector Database Storage**: Uses efficient vector storage for fast similarity search
🎯 **Smart Content Extraction**: Intelligently extracts headings, paragraphs, and key content
📱 **Clean UI**: Beautiful popup interface for easy searching

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `memory-agent-extension` folder
5. The extension will appear in your Chrome toolbar

## Usage

1. **Automatic Capture**: The extension automatically captures content from pages you visit
2. **Search Your Memory**: Click the extension icon and search using natural language
3. **Quick Actions**: Use predefined buttons for common searches
4. **Export Data**: Export your memory data as JSON for backup
5. **Clear Data**: Reset all stored data if needed

## File Structure

```
memory-agent-extension/
├── manifest.json          # Extension configuration
├── src/
│   ├── background.js      # Background service worker
│   └── content.js         # Content script for page capture
├── popup/
│   ├── popup.html         # Popup interface
│   ├── popup.css          # Styling
│   └── popup.js           # Popup functionality
├── icons/                 # Extension icons
└── README.md             # This file
```

## Technical Details

### Vector Storage
- Uses a simple character frequency-based embedding system
- 50-dimensional vectors for fast processing
- Cosine similarity for search relevance
- Local storage with Chrome's storage API

### Content Capture
- Extracts page titles, meta descriptions, headings, and paragraphs
- Monitors user interactions (clicks, scrolls, form submissions)
- Handles dynamic content changes with MutationObserver
- Respects user privacy by only storing text content

### Search Features
- Natural language search queries
- Relevance scoring with similarity percentages
- Quick action buttons for common searches
- Real-time search as you type

## Privacy & Security

- All data is stored locally in your browser
- No data is sent to external servers
- Content is captured only from pages you actively visit
- You can clear all data at any time

## Future Enhancements

- [ ] Integration with external vector databases (Pinecone, Weaviate)
- [ ] More sophisticated embedding models
- [ ] Image and video content recognition
- [ ] Cross-device synchronization
- [ ] Advanced filtering and tagging
- [ ] Export to various formats

## Development

To modify or extend the extension:

1. Make changes to the relevant files
2. Reload the extension in `chrome://extensions/`
3. Test the changes in your browser

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.

## License

MIT License - Feel free to use and modify as needed.
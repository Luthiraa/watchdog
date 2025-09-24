// Storage Space Calculator for Memory Agent Embeddings
// Run this in browser console to see exact storage calculations

console.log('=== Memory Agent Storage Analysis ===\n');

// Sample document structure
const sampleDocument = {
  id: 1695123456789.123,
  content: "JavaScript tutorial for beginners. Learn variables, functions, loops, and objects. This comprehensive guide covers modern ES6+ features including arrow functions, destructuring, and async/await. Build real projects and master the fundamentals of web development.",
  embedding: new Array(50).fill(0.123456789), // 50-dimensional vector with sample values
  metadata: {
    url: "https://example.com/javascript-tutorial-complete-guide",
    title: "JavaScript Tutorial - Complete Beginner's Guide to Modern JS",
    timestamp: 1695123456789,
    type: "page_content"
  },
  timestamp: 1695123456789
};

// Calculate storage sizes
function calculateStorageSize(obj) {
  const jsonString = JSON.stringify(obj);
  const sizeInBytes = new Blob([jsonString]).size;
  return {
    jsonLength: jsonString.length,
    sizeInBytes: sizeInBytes,
    sizeInKB: (sizeInBytes / 1024).toFixed(2),
    sizeInMB: (sizeInBytes / (1024 * 1024)).toFixed(4)
  };
}

// Break down by component
const embeddingOnly = sampleDocument.embedding;
const metadataOnly = sampleDocument.metadata;
const contentOnly = sampleDocument.content;

console.log('📊 COMPONENT BREAKDOWN:');
console.log('======================');

// Embedding vector (50 float numbers)
const embeddingSize = calculateStorageSize(embeddingOnly);
console.log(`🔢 Embedding Vector (50 dimensions):`);
console.log(`   Size: ${embeddingSize.sizeInBytes} bytes (${embeddingSize.sizeInKB} KB)`);
console.log(`   Per dimension: ${(embeddingSize.sizeInBytes / 50).toFixed(1)} bytes`);

// Content text
const contentSize = calculateStorageSize(contentOnly);
console.log(`\n📝 Content Text (${contentOnly.length} chars):`);
console.log(`   Size: ${contentSize.sizeInBytes} bytes (${contentSize.sizeInKB} KB)`);

// Metadata
const metadataSize = calculateStorageSize(metadataOnly);
console.log(`\n📋 Metadata:`);
console.log(`   Size: ${metadataSize.sizeInBytes} bytes (${metadataSize.sizeInKB} KB)`);

// Full document
const fullDocSize = calculateStorageSize(sampleDocument);
console.log(`\n📄 COMPLETE DOCUMENT:`);
console.log(`========================`);
console.log(`Total size: ${fullDocSize.sizeInBytes} bytes (${fullDocSize.sizeInKB} KB)`);

// Storage projections
console.log(`\n🔮 STORAGE PROJECTIONS:`);
console.log(`=======================`);

const documentsFor1MB = Math.floor(1024 * 1024 / fullDocSize.sizeInBytes);
const documentsFor5MB = Math.floor(5 * 1024 * 1024 / fullDocSize.sizeInBytes);
const documentsFor10MB = Math.floor(10 * 1024 * 1024 / fullDocSize.sizeInBytes);

console.log(`📦 Documents that fit in 1MB: ~${documentsFor1MB.toLocaleString()}`);
console.log(`📦 Documents that fit in 5MB: ~${documentsFor5MB.toLocaleString()}`);
console.log(`📦 Documents that fit in 10MB: ~${documentsFor10MB.toLocaleString()}`);

// Chrome storage limits
console.log(`\n⚠️  CHROME STORAGE LIMITS:`);
console.log(`===========================`);
console.log(`🌐 chrome.storage.local: ~10MB total`);
console.log(`📱 chrome.storage.sync: ~100KB total (8KB per item)`);
console.log(`🔄 Current implementation uses: storage.local`);

// Detailed embedding analysis
console.log(`\n🔬 EMBEDDING DETAILS:`);
console.log(`======================`);
console.log(`Vector dimensions: 50`);
console.log(`Data type: JavaScript Number (64-bit float)`);
console.log(`Theoretical size per number: 8 bytes`);
console.log(`JSON encoded size per number: ~12-15 bytes (includes formatting)`);
console.log(`Total embedding overhead: ~${(embeddingSize.sizeInBytes - (50 * 8)).toFixed(0)} bytes (JSON formatting)`);

// Comparison with other approaches
console.log(`\n⚖️  COMPARISON WITH ALTERNATIVES:`);
console.log(`==================================`);

// Smaller vectors
const vector16Size = calculateStorageSize(new Array(16).fill(0.123456789));
const vector32Size = calculateStorageSize(new Array(32).fill(0.123456789));
const vector128Size = calculateStorageSize(new Array(128).fill(0.123456789));

console.log(`🔢 16-dimensional vector: ${vector16Size.sizeInBytes} bytes`);
console.log(`🔢 32-dimensional vector: ${vector32Size.sizeInBytes} bytes`);
console.log(`🔢 50-dimensional vector: ${embeddingSize.sizeInBytes} bytes (current)`);
console.log(`🔢 128-dimensional vector: ${vector128Size.sizeInBytes} bytes`);

// Memory efficiency tips
console.log(`\n💡 OPTIMIZATION OPPORTUNITIES:`);
console.log(`===============================`);
console.log(`1. Reduce vector dimensions (16-32 might be sufficient)`);
console.log(`2. Use integer representations instead of floats`);
console.log(`3. Compress content text before storage`);
console.log(`4. Store only content hash + vector for duplicate detection`);
console.log(`5. Implement smart content truncation (keep key sentences)`);

console.log(`\n✅ Analysis complete!`);
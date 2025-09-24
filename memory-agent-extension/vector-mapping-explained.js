// 🧠 VECTOR MAPPING EXPLAINED - Step by Step Example
// Run this in browser console to see exactly how text becomes vectors

console.log('🔤 HOW TEXT BECOMES VECTORS - DETAILED WALKTHROUGH');
console.log('==================================================\n');

// The 50 "magic words" used for mapping
const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'with', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very'];

console.log('📝 THE 50 MAGIC WORDS WE MAP TO:');
console.log('Position | Word');
console.log('---------|-----');
commonWords.forEach((word, i) => {
    console.log(`   ${i.toString().padStart(2)}    | ${word}`);
});

console.log('\n' + '='.repeat(50));
s
// Example function that mimics the actual implementation
function createEmbedding(text) {
    console.log(`\n🔍 PROCESSING: "${text}"`);
    console.log('─'.repeat(50));
    
    // Step 1: Clean the text
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    console.log(`1️⃣ CLEANED: "${cleaned}"`);
    
    // Step 2: Split into words and filter
    const words = cleaned.split(/\s+/).filter(word => word.length > 2);
    console.log(`2️⃣ WORDS (3+ chars): [${words.join(', ')}]`);
    console.log(`   Total words: ${words.length}`);
    
    // Step 3: Count word frequencies
    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    console.log(`3️⃣ WORD COUNTS:`);
    Object.entries(wordCount).forEach(([word, count]) => {
        console.log(`   "${word}": ${count} times`);
    });
    
    // Step 4: Create the 50-dimensional vector
    console.log(`4️⃣ VECTOR MAPPING:`);
    const vector = new Array(50).fill(0);
    commonWords.forEach((word, index) => {
        const count = wordCount[word] || 0;
        const frequency = count / words.length;
        vector[index] = frequency;
        
        if (count > 0) {
            console.log(`   Position ${index}: "${word}" → ${count}/${words.length} = ${frequency.toFixed(3)}`);
        }
    });
    
    console.log(`5️⃣ FINAL VECTOR (first 10 values):`);
    console.log(`   [${vector.slice(0, 10).map(v => v.toFixed(3)).join(', ')}...]`);
    
    return vector;
}

// 🧪 EXAMPLE 1: Simple sentence
console.log('\n🧪 EXAMPLE 1: Simple Sentence');
console.log('================================');
const vector1 = createEmbedding("The cat was very good and old");

// 🧪 EXAMPLE 2: Programming text
console.log('\n🧪 EXAMPLE 2: Programming Text'); 
console.log('================================');
const vector2 = createEmbedding("JavaScript tutorial for beginners. You can learn new programming concepts and use modern frameworks");

// 🧪 EXAMPLE 3: Same words, different order
console.log('\n🧪 EXAMPLE 3: Word Order Test');
console.log('===============================');
const vector3a = createEmbedding("The good cat was very old");
const vector3b = createEmbedding("Very old cat was the good");

console.log('\n🔬 COMPARISON:');
console.log('==============');
console.log('Text A vector:', vector3a.slice(0, 5).map(v => v.toFixed(3)));
console.log('Text B vector:', vector3b.slice(0, 5).map(v => v.toFixed(3)));
console.log('Are they equal?', JSON.stringify(vector3a) === JSON.stringify(vector3b));

// Calculate similarity between examples
function cosineSimilarity(vec1, vec2) {
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

console.log('\n📊 SIMILARITY SCORES:');
console.log('=====================');
console.log(`Example 1 vs Example 2: ${(cosineSimilarity(vector1, vector2) * 100).toFixed(1)}%`);
console.log(`Example 3A vs Example 3B: ${(cosineSimilarity(vector3a, vector3b) * 100).toFixed(1)}%`);

console.log('\n💡 KEY INSIGHTS:');
console.log('================');
console.log('✅ Each position in the vector represents ONE specific word');
console.log('✅ The value is: (how many times word appears) ÷ (total words)');
console.log('✅ Word order doesn\'t matter - only frequency');
console.log('✅ Only these 50 common words are tracked');
console.log('✅ All other words are ignored');
console.log('✅ Similar texts will have similar vectors');

console.log('\n🎯 WHY THIS WORKS:');
console.log('==================');
console.log('• Documents about similar topics use similar common words');
console.log('• "Programming" texts might have lots of "you", "can", "use"');
console.log('• "Story" texts might have lots of "the", "was", "had"');
console.log('• Math calculates how "close" two vectors are');

console.log('\n✨ Analysis complete! Now you understand the magic! ✨');
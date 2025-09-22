// Test Setup for Memory Agent Extension
// Run this in the browser console on any page to add some test data

console.log('Setting up test data for Memory Agent...');

// Function to add test documents
async function addTestData() {
    const testDocuments = [
        {
            content: "JavaScript tutorial for beginners. Learn variables, functions, loops, and objects. This comprehensive guide covers modern ES6+ features including arrow functions, destructuring, and async/await.",
            metadata: {
                title: "JavaScript Tutorial - Complete Guide",
                url: "https://example.com/javascript-tutorial",
                type: "page_content"
            }
        },
        {
            content: "Python programming fundamentals. Data structures, algorithms, object-oriented programming, and web development with Django and Flask frameworks.",
            metadata: {
                title: "Python Programming Guide",
                url: "https://example.com/python-guide",
                type: "page_content"
            }
        },
        {
            content: "React component lifecycle, hooks, state management with Redux. Building modern web applications with TypeScript and Next.js framework.",
            metadata: {
                title: "React Development Tutorial",
                url: "https://example.com/react-tutorial",
                type: "page_content"
            }
        },
        {
            content: "Machine learning algorithms, neural networks, deep learning with TensorFlow and PyTorch. Data science techniques for predictive analytics.",
            metadata: {
                title: "Machine Learning Fundamentals",
                url: "https://example.com/ml-tutorial",
                type: "page_content"
            }
        },
        {
            content: "Best practices for web design, user experience, responsive layouts, CSS Grid and Flexbox. Design systems and accessibility guidelines.",
            metadata: {
                title: "Web Design Best Practices",
                url: "https://example.com/web-design",
                type: "page_content"
            }
        }
    ];

    // Send test documents to background script
    for (const doc of testDocuments) {
        chrome.runtime.sendMessage({
            type: "pageContent",
            text: doc.content,
            metadata: doc.metadata
        });
        
        // Add a small delay between insertions
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Test data added! Try searching for "JavaScript", "Python", "React", "machine learning", or "web design"');
}

// Add the test data
addTestData();
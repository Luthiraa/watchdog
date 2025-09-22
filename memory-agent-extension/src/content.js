// Memory Agent Content Script
console.log('Memory Agent content script loaded on:', window.location.href);

// Avoid running on extension pages and special Chrome pages
if (window.location.protocol === 'chrome-extension:' || 
    window.location.protocol === 'chrome:' ||
    window.location.protocol === 'moz-extension:') {
  console.log('Skipping content script on special page');
} else {
  // Wait for page to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMemoryAgent);
  } else {
    initializeMemoryAgent();
  }
}

function initializeMemoryAgent() {
  try {
    capturePageContent();
    setupUserInteractionTracking();
  } catch (error) {
    console.error('Error initializing Memory Agent:', error);
  }
}

function capturePageContent() {
  try {
    // Extract meaningful text content from the page
    const title = document.title || '';
    const metaDescription = getMetaDescription();
    const headings = extractHeadings();
    const paragraphs = extractParagraphs();
    const links = extractLinks();
    
    // Combine all text content
    const contentParts = [
      title,
      metaDescription,
      headings.join(' '),
      paragraphs.join(' ')
    ].filter(part => part.trim().length > 0);
    
    const fullContent = contentParts.join('\n').slice(0, 2000);
    
    if (fullContent.length > 10) {
      // Send content to background script
      chrome.runtime.sendMessage({
        type: "pageContent",
        text: fullContent,
        metadata: {
          title,
          url: window.location.href,
          headings,
          links: links.slice(0, 10), // First 10 links
          wordCount: fullContent.split(/\s+/).length
        }
      });
      
      console.log('Page content captured and sent to background');
    }
  } catch (error) {
    console.error('Error capturing page content:', error);
  }
}

function getMetaDescription() {
  const metaDescription = document.querySelector('meta[name="description"]');
  return metaDescription ? metaDescription.getAttribute('content') || '' : '';
}

function extractHeadings() {
  const headings = [];
  const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  headingElements.forEach(heading => {
    const text = heading.textContent?.trim();
    if (text && text.length > 2) {
      headings.push(text);
    }
  });
  
  return headings.slice(0, 20); // First 20 headings
}

function extractParagraphs() {
  const paragraphs = [];
  const paragraphElements = document.querySelectorAll('p, article, .content, .post, .article-body');
  
  paragraphElements.forEach(p => {
    const text = p.textContent?.trim();
    if (text && text.length > 20) {
      paragraphs.push(text);
    }
  });
  
  return paragraphs.slice(0, 50); // First 50 paragraphs
}

function extractLinks() {
  const links = [];
  const linkElements = document.querySelectorAll('a[href]');
  
  linkElements.forEach(link => {
    const href = link.getAttribute('href');
    const text = link.textContent?.trim();
    
    if (href && text && text.length > 2 && text.length < 100) {
      links.push({
        url: href,
        text: text
      });
    }
  });
  
  return links;
}

function setupUserInteractionTracking() {
  let clickTimeout;
  
  // Track significant clicks (not on empty space)
  document.addEventListener('click', (event) => {
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
      try {
        const target = event.target;
        const tagName = target.tagName?.toLowerCase();
        
        // Only track clicks on meaningful elements
        if (['a', 'button', 'input', 'select', 'textarea'].includes(tagName)) {
          const clickData = {
            type: 'click',
            element: tagName,
            text: target.textContent?.trim().slice(0, 100) || '',
            href: target.getAttribute('href') || '',
            timestamp: Date.now()
          };
          
          console.log('User interaction tracked:', clickData);
          
          // Optionally send click data to background
          chrome.runtime.sendMessage({
            type: "userInteraction",
            data: clickData
          });
        }
      } catch (error) {
        console.error('Error tracking click:', error);
      }
    }, 100);
  });
  
  // Track form submissions
  document.addEventListener('submit', (event) => {
    try {
      const form = event.target;
      const formData = new FormData(form);
      const fields = Array.from(formData.keys());
      
      chrome.runtime.sendMessage({
        type: "userInteraction",
        data: {
          type: 'form_submit',
          fields: fields,
          action: form.action || '',
          timestamp: Date.now()
        }
      });
      
      console.log('Form submission tracked');
    } catch (error) {
      console.error('Error tracking form submission:', error);
    }
  });
  
  // Track scroll behavior (throttled)
  let scrollTimeout;
  let maxScroll = 0;
  
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    maxScroll = Math.max(maxScroll, scrollPercent);
    
    scrollTimeout = setTimeout(() => {
      if (maxScroll > 25) { // Only track if user scrolled significantly
        chrome.runtime.sendMessage({
          type: "userInteraction",
          data: {
            type: 'scroll',
            maxScrollPercent: Math.round(maxScroll),
            timestamp: Date.now()
          }
        });
      }
    }, 1000);
  });
}

// Handle dynamic content changes
const observer = new MutationObserver((mutations) => {
  let significantChange = false;
  
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && 
            (node.tagName === 'P' || node.tagName === 'DIV' || node.tagName === 'ARTICLE')) {
          significantChange = true;
        }
      });
    }
  });
  
  if (significantChange) {
    // Re-capture content after significant DOM changes
    setTimeout(capturePageContent, 2000);
  }
});

// Start observing dynamic changes
observer.observe(document.body, {
  childList: true,
  subtree: true
});
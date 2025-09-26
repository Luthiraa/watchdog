// Sample webpage memories to test the enhanced search results
// This would normally come from the browser extension

export const sampleWebpageMemories = [
  {
    userId: 'test@example.com',
    content: 'Comprehensive guide to React Hooks including useState, useEffect, and custom hooks. Learn how to manage state and side effects in functional components.',
    timestamp: new Date().toISOString(),
    category: 'documentation',
    source: 'browser-extension',
    metadata: {
      url: 'https://reactjs.org/docs/hooks-intro.html',
      title: 'Introducing Hooks – React',
      domain: 'reactjs.org',
      description: 'Hooks are a new addition in React 16.8. They let you use state and other React features without writing a class.',
      excerpt: 'Hooks are functions that let you "hook into" React state and lifecycle features from function components.',
      author: 'React Team',
      publishDate: '2019-02-06',
      wordCount: 2450,
      readingTime: 10,
      language: 'en',
      tags: ['react', 'hooks', 'javascript', 'frontend'],
      favicon: 'https://reactjs.org/favicon.ico',
      ogImage: 'https://reactjs.org/logo-og.png'
    }
  },
  {
    userId: 'test@example.com', 
    content: 'Complete tutorial on Next.js App Router, server components, and the new file-based routing system. Covers data fetching, layouts, and performance optimization.',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    category: 'tutorial',
    source: 'browser-extension',
    metadata: {
      url: 'https://nextjs.org/docs/app',
      title: 'App Router - Next.js Documentation',
      domain: 'nextjs.org',
      description: 'Learn about the App Router and how it works with React Server Components.',
      excerpt: 'The App Router works in a new directory named app. The app directory works alongside the pages directory.',
      author: 'Vercel Team',
      publishDate: '2023-05-04',
      wordCount: 3200,
      readingTime: 15,
      language: 'en',
      tags: ['nextjs', 'app-router', 'react', 'server-components'],
      favicon: 'https://nextjs.org/static/favicon/favicon-32x32.png'
    }
  },
  {
    userId: 'test@example.com',
    content: 'TypeScript handbook covering advanced types, generics, and type manipulation. Essential resource for writing type-safe JavaScript applications.',
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    category: 'reference',
    source: 'browser-extension',
    metadata: {
      url: 'https://www.typescriptlang.org/docs/handbook/2/types-from-types.html',
      title: 'Creating Types from Types - TypeScript Handbook',
      domain: 'typescriptlang.org',
      description: 'Learn about TypeScript\'s type system and how to create types from other types.',
      excerpt: 'TypeScript\'s type system is very powerful because it allows expressing types in terms of other types.',
      author: 'Microsoft TypeScript Team',
      wordCount: 1800,
      readingTime: 8,
      language: 'en',
      tags: ['typescript', 'types', 'generics', 'programming'],
      favicon: 'https://www.typescriptlang.org/favicon-32x32.png'
    }
  }
]
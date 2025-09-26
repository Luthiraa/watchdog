'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowLeft, Search, Calendar, Globe, FileText, ExternalLink, Star } from 'lucide-react'

interface Memory {
  id: string
  userId: string
  content: string
  timestamp: string
  category: string
  source: string
  metadata?: {
    url?: string
    title?: string
    domain?: string
    certainty?: number
    score?: number
    [key: string]: any
  }
  _ragScore?: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<Memory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    const searchQuery = searchParams.get('q')
    if (searchQuery) {
      setQuery(searchQuery)
      performSearch(searchQuery)
    }
  }, [searchParams])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/memories?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) {
        throw new Error('Search failed')
      }
      const data = await response.json()
      setResults(data.memories || [])
    } catch (err) {
      setError('Failed to search memories. Please try again.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'docs':
      case 'documents':
        return <FileText className="w-4 h-4" />
      case 'web':
      case 'browsing':
        return <Globe className="w-4 h-4" />
      case 'notes':
        return <FileText className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  // Show loading screen while checking authentication
  if (status === "loading") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
        <div className="text-white pixel-regular">Loading...</div>
      </main>
    )
  }

  // Don't render main content if not authenticated
  if (!session) {
    return null
  }

  return (
    <main className="min-h-screen relative overflow-hidden px-4 py-8">
      {/* Background gradients */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[50vw] h-[50vw] bg-gradient-to-br from-indigo-600/10 to-purple-800/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[60vw] h-[60vw] bg-gradient-to-tr from-blue-700/10 to-emerald-600/5 rounded-full blur-3xl animate-slow-pan" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/70 hover:text-white transition pixel-light text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="flex items-center gap-3">
            <Image
              src="/watchdog_logo_pixelated.png"
              alt="Watchdog Logo"
              width={32}
              height={32}
              className="pixelated"
            />
            <h1 className="text-white pixel-title text-xl">Search Results</h1>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-8"
        >
          <form
            onSubmit={handleSearch}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="flex items-center px-4 py-3">
              <Search className="w-5 h-5 text-white/40 mr-3" />
              <input
                type="text"
                placeholder="Search your memories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm focus:outline-none pixel-light"
              />
              <button 
                type="submit" 
                className="ml-3 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm pixel-bold transition"
              >
                Search
              </button>
            </div>
          </form>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="text-white/70 pixel-light">Searching memories...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 pixel-light">{error}</div>
            </div>
          ) : results.length === 0 && query ? (
            <div className="text-center py-12">
              <div className="text-white/70 pixel-light">No memories found for "{query}"</div>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="mb-6">
                <h2 className="text-white pixel-bold text-lg">
                  Found {results.length} memories for "{searchParams.get('q')}"
                </h2>
              </div>
              
              <div className="space-y-4">
                {results.map((memory, index) => {
                  // Extract URLs from content if not in metadata
                  const extractUrls = (text: string): string[] => {
                    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
                    return text.match(urlRegex) || [];
                  };
                  
                  const contentUrls = extractUrls(memory.content);
                  const hasUrl = memory.metadata?.url || contentUrls.length > 0;
                  const displayUrl = memory.metadata?.url || contentUrls[0];
                  const displayDomain = memory.metadata?.domain || (displayUrl ? new URL(displayUrl).hostname : null);
                  
                  return (
                    <motion.div
                      key={memory.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.6 }}
                      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                        {/* Webpage title and domain */}
                        <div className="mb-4">
                          {memory.metadata?.title && (
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-white pixel-bold text-lg leading-tight flex-1 mr-3">
                                {memory.metadata.title}
                              </h3>
                              {(memory._ragScore || memory.metadata?.certainty) && (
                                <div className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg">
                                  <Star className="w-3 h-3 fill-current" />
                                  <span>
                                    {memory._ragScore 
                                      ? `${Math.round(memory._ragScore * 100)}%`
                                      : `${Math.round((memory.metadata?.certainty || 0) * 100)}%`
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Always show link/source information prominently */}
                          <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl">
                            {hasUrl ? (
                              <>
                                <div className="flex items-center gap-2 mb-3">
                                  {memory.metadata?.favicon ? (
                                    <img 
                                      src={memory.metadata.favicon} 
                                      alt="Site favicon" 
                                      className="w-5 h-5" 
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <ExternalLink className="w-5 h-5 text-blue-400" />
                                  )}
                                  <span className="text-blue-400 pixel-bold text-base">🔗 Website Link</span>
                                </div>
                                
                                {displayDomain && (
                                  <div className="text-white pixel-bold text-lg mb-2">
                                    🌐 {displayDomain}
                                  </div>
                                )}
                                
                                <div className="bg-black/40 rounded-lg p-3 mb-3 border border-blue-400/20">
                                  <div className="text-blue-300 text-sm pixel-light font-mono break-all">
                                    {displayUrl}
                                  </div>
                                </div>
                                
                                {contentUrls.length > 1 && (
                                  <div className="mb-3 text-xs text-white/60">
                                    + {contentUrls.length - 1} more URL{contentUrls.length > 2 ? 's' : ''} in content
                                  </div>
                                )}
                                
                                <div className="flex gap-3">
                                  <a
                                    href={displayUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 transition text-sm pixel-bold px-4 py-2 rounded-lg shadow-lg"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Open Website
                                  </a>
                                  <button
                                    onClick={() => {
                                      if (displayUrl) {
                                        navigator.clipboard.writeText(displayUrl)
                                        // You could add a toast notification here
                                      }
                                    }}
                                    className="inline-flex items-center gap-2 text-white/90 bg-white/15 hover:bg-white/25 transition text-sm pixel-light px-4 py-2 rounded-lg"
                                  >
                                    <FileText className="w-4 h-4" />
                                    Copy URL
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="w-5 h-5 text-orange-400" />
                                  <span className="text-orange-400 pixel-bold text-base">📄 Memory Source</span>
                                </div>
                                <div className="text-white/80 pixel-light text-sm">
                                  <div className="bg-black/20 rounded-lg p-3">
                                    <div>Source: <span className="text-yellow-300 pixel-bold">{memory.source || 'Unknown'}</span></div>
                                    <div>Category: <span className="text-green-300 pixel-bold">{memory.category || 'General'}</span></div>
                                    <div>Type: <span className="text-purple-300 pixel-bold">Stored Memory</span></div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Memory content */}
                        <div className="mb-4">
                          <h4 className="text-white/80 pixel-bold text-sm mb-2">Content Summary</h4>
                          <p className="text-white/90 pixel-light leading-relaxed bg-white/5 rounded-lg p-3 border-l-2 border-blue-400/30">
                            {memory.content}
                          </p>
                        </div>

                        {/* Additional metadata */}
                        {memory.metadata && Object.keys(memory.metadata).filter(key => 
                          !['url', 'title', 'domain', 'certainty', 'score'].includes(key)
                        ).length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-white/80 pixel-bold text-sm mb-2">Additional Details</h4>
                            <div className="bg-white/5 rounded-lg p-3 space-y-2">
                              {memory.metadata.excerpt && (
                                <div className="flex items-start gap-2 text-xs">
                                  <span className="text-white/40 pixel-light w-20 flex-shrink-0">Excerpt:</span>
                                  <span className="text-white/70 pixel-light flex-1">{memory.metadata.excerpt}</span>
                                </div>
                              )}
                              
                              {memory.metadata.description && memory.metadata.description !== memory.metadata.excerpt && (
                                <div className="flex items-start gap-2 text-xs">
                                  <span className="text-white/40 pixel-light w-20 flex-shrink-0">Description:</span>
                                  <span className="text-white/70 pixel-light flex-1">{memory.metadata.description}</span>
                                </div>
                              )}

                              {memory.metadata.author && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-white/40 pixel-light w-20 flex-shrink-0">Author:</span>
                                  <span className="text-white/70 pixel-light">{memory.metadata.author}</span>
                                </div>
                              )}

                              {memory.metadata.publishDate && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-white/40 pixel-light w-20 flex-shrink-0">Published:</span>
                                  <span className="text-white/70 pixel-light">
                                    {new Date(memory.metadata.publishDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}

                              {(memory.metadata.wordCount || memory.metadata.readingTime) && (
                                <div className="flex items-center gap-4 text-xs">
                                  {memory.metadata.wordCount && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-white/40 pixel-light">Words:</span>
                                      <span className="text-white/70 pixel-light">{memory.metadata.wordCount.toLocaleString()}</span>
                                    </div>
                                  )}
                                  {memory.metadata.readingTime && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-white/40 pixel-light">Read time:</span>
                                      <span className="text-white/70 pixel-light">{memory.metadata.readingTime} min</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {memory.metadata.language && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-white/40 pixel-light w-20 flex-shrink-0">Language:</span>
                                  <span className="text-white/70 pixel-light uppercase">{memory.metadata.language}</span>
                                </div>
                              )}

                              {memory.metadata.tags && Array.isArray(memory.metadata.tags) && memory.metadata.tags.length > 0 && (
                                <div className="flex items-start gap-2 text-xs">
                                  <span className="text-white/40 pixel-light w-20 flex-shrink-0">Tags:</span>
                                  <div className="flex flex-wrap gap-1 flex-1">
                                    {memory.metadata.tags.map((tag, tagIndex) => (
                                      <span key={tagIndex} className="bg-blue-400/20 text-blue-300 px-2 py-0.5 rounded text-xs pixel-light">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Footer with metadata */}
                        <div className="flex items-center gap-4 pt-3 border-t border-white/10 text-xs text-white/50">
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(memory.category)}
                            <span className="pixel-light capitalize">{memory.category || 'general'}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="pixel-light">{formatDate(memory.timestamp)}</span>
                          </div>
                          
                          {memory.source && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span className="pixel-light">{memory.source}</span>
                            </div>
                          )}

                          {/* Memory ID for debugging */}
                          <div className="flex items-center gap-1 text-xs text-white/30 ml-auto">
                            <span className="pixel-light">ID: {memory.id?.slice(-8)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-white/70 pixel-light">Enter a search query to find your memories</div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
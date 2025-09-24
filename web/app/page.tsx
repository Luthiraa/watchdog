"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function WatchdogHero() {
  const [input, setInput] = useState("")
  const [memories, setMemories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    try {
      // Store the user's query as a memory
      await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: input,
          category: 'query',
          source: 'chat'
        })
      })

      // Search for relevant memories
      const response = await fetch(`/api/memories?q=${encodeURIComponent(input)}`)
      const data = await response.json()
      setMemories(data.memories || [])

      console.log("User prompt:", input)
      console.log("Found memories:", data.memories)
    } catch (error) {
      console.error('Error processing query:', error)
    }
    
    setInput("")
    setIsLoading(false)
  }

  const handleQuickAction = async (action: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/memories?q=${encodeURIComponent(action.toLowerCase())}&category=${action.toLowerCase().replace(' ', '')}`)
      const data = await response.json()
      setMemories(data.memories || [])
    } catch (error) {
      console.error('Error fetching memories:', error)
    }
    setIsLoading(false)
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
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* User menu */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl px-4 py-2">
          <span className="text-white/70 text-xs pixel-light">
            {session.user?.email}
          </span>
          <button
            onClick={() => signOut()}
            className="text-white/50 hover:text-white/80 text-xs pixel-light transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Subtle accent gradients */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[50vw] h-[50vw] bg-gradient-to-br from-indigo-600/10 to-purple-800/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[60vw] h-[60vw] bg-gradient-to-tr from-blue-700/10 to-emerald-600/5 rounded-full blur-3xl animate-slow-pan" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10"
      >
        <Image
          src="/watchdog_logo_pixelated.png"
          alt="Watchdog Logo"
          width={140}
          height={140}
          className="pixelated drop-shadow-lg"
        />
      </motion.div>

      {/* Heading (Pixel Font) */}
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 1 }}
        className="text-2xl md:text-4xl text-white mt-6 tracking-wider pixel-title"
      >
        Watchdog
      </motion.h1>

      {/* Tagline (Light pixel font) */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 1 }}
        className="text-white/70 text-xs md:text-sm mt-2 pixel-light"
      >
        Eyes everywhere. Memory for everything.
      </motion.p>

      {/* Chat box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 1 }}
        className="relative z-10 w-full max-w-2xl mt-10 pixel-regular"
      >
        {/* TODO: FIX ENTER/SEND BUTTON */}
        <form
          onSubmit={handleSubmit}
          className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="flex items-center px-4 py-3">
            {/* Left buttons */}
            <div className="flex items-center gap-2 mr-3 text-white/70">
              <button type="button" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">+</button>
              <button type="button" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </button>
            </div>

            {/* Input */}
            <input
              type="text"
              placeholder="Ask Watchdog anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder:text-white/40 text-xs md:text-sm focus:outline-none pixel-light"
            />

            {/* Send button */}
            <button type="submit" className="ml-3 w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
              ↗
            </button>
          </div>

          {/* Footer bar */}
          <div className="flex justify-between items-center px-4 py-2 border-t border-white/10 text-xs text-white/50 pixel-light">
            <span>Watchdog Alpha</span>
            <span>Memory Agent</span>
          </div>
        </form>

        {/* Quick actions */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {["Search Docs", "Summarize Notes", "Track Tasks", "Retrieve Papers"].map((label) => (
            <button 
              key={label} 
              onClick={() => handleQuickAction(label)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-xs text-white/70 hover:text-white transition pixel-bold disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Memory results */}
      {memories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative z-10 w-full max-w-4xl mt-8"
        >
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-white pixel-bold text-sm">Found Memories ({memories.length})</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {memories.map((memory, index) => (
                <div key={memory.id} className="px-6 py-4 border-b border-white/5 last:border-b-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-white/90 text-xs pixel-light leading-relaxed">
                        {memory.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-white/40 text-xs pixel-light">
                          {memory.category}
                        </span>
                        <span className="text-white/30 text-xs pixel-light">
                          {new Date(memory.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl px-6 py-4">
            <div className="text-white pixel-light text-sm">Processing...</div>
          </div>
        </motion.div>
      )}
    </main>
  )
}

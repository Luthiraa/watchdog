"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useState } from "react"

export default function WatchdogHero() {
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("User prompt:", input)
    setInput("")
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
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
            <button key={label} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-xs text-white/70 hover:text-white transition pixel-bold">
              {label}
            </button>
          ))}
        </div>
      </motion.div>
    </main>
  )
}

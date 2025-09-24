"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { signIn, getProviders } from "next-auth/react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function SignIn() {
  const [providers, setProviders] = useState<any>(null)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    const getAuthProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    getAuthProviders()
  }, [])

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
          src="/watchdog_logo.png"
          alt="Watchdog Logo"
          width={120}
          height={120}
          className="pixelated drop-shadow-lg"
        />
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 1 }}
        className="text-xl md:text-3xl text-white mt-6 tracking-wider pixel-title"
      >
        Access Watchdog
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="text-white/70 text-xs md:text-sm mt-2 pixel-light text-center"
      >
        Secure authentication required
      </motion.p>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs pixel-light"
        >
          {error === 'OAuthSignin' ? 'Error with OAuth provider' : 
           error === 'OAuthCallback' ? 'Error in OAuth callback' :
           error === 'OAuthCreateAccount' ? 'Could not create account' :
           error === 'EmailCreateAccount' ? 'Could not create account' :
           error === 'Callback' ? 'Error in callback' :
           error === 'OAuthAccountNotLinked' ? 'Account not linked' :
           error === 'EmailSignin' ? 'Check your email' :
           error === 'CredentialsSignin' ? 'Invalid credentials' :
           error === 'SessionRequired' ? 'Please sign in' :
           'Authentication error'}
        </motion.div>
      )}

      {/* Sign in options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="relative z-10 w-full max-w-md mt-8"
      >
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="space-y-4">
            {providers && Object.values(providers).map((provider: any) => (
              <button
                key={provider.name}
                onClick={() => signIn(provider.id, { callbackUrl: '/' })}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white pixel-regular text-sm transition-all duration-200 group"
              >
                {provider.name === 'Google' && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>Continue with {provider.name}</span>
                <div className="w-2 h-2 bg-white/50 group-hover:bg-white/80 transition-colors pixelated"></div>
              </button>
            ))}
          </div>

          {/* Security notice */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-white/50 text-xs pixel-light text-center leading-relaxed">
              Your data is encrypted and stored securely. Each user's memories are completely isolated and accessible only to them.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="mt-8 text-center"
      >
        <p className="text-white/30 text-xs pixel-light">
          Watchdog Security System v1.0
        </p>
      </motion.div>
    </main>
  )
}
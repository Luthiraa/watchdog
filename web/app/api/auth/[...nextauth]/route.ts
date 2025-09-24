import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { weaviateService } from "@/lib/weaviate"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 SignIn callback triggered:', { 
        userEmail: user.email, 
        provider: account?.provider,
        userName: user.name 
      })
      
      // Store login event in Weaviate when user successfully signs in
      try {
        if (user.email && account?.provider) {
          console.log('📝 Attempting to store login event in Weaviate...')
          
          const memoryId = await weaviateService.storeMemory({
            userId: user.email,
            content: `User logged in via ${account.provider}. Name: ${user.name}, Email: ${user.email}`,
            timestamp: new Date().toISOString(),
            category: 'authentication',
            source: 'oauth_login',
            metadata: {
              provider: account.provider,
              userName: user.name,
              userImage: user.image,
              loginTime: new Date().toISOString(),
            },
          })
          
          console.log(`✅ Login event stored successfully! Memory ID: ${memoryId} for user: ${user.email}`)
        } else {
          console.log('⚠️ Missing user email or account provider, skipping storage')
        }
      } catch (error) {
        console.error('❌ Failed to store login event:', error)
        // Don't prevent login if storage fails
      }
      return true
    },
    async session({ session, token }) {
      // Also try to store login event here as a backup
      if (session?.user?.email && !token.loginEventStored) {
        try {
          console.log('📝 Storing login event from session callback...')
          await weaviateService.storeMemory({
            userId: session.user.email,
            content: `User session created. Name: ${session.user.name}, Email: ${session.user.email}`,
            timestamp: new Date().toISOString(),
            category: 'authentication',
            source: 'session_creation',
            metadata: {
              userName: session.user.name,
              userImage: session.user.image,
              sessionTime: new Date().toISOString(),
            },
          })
          // Mark that we've stored the login event for this token
          token.loginEventStored = true
          console.log(`✅ Session login event stored for user: ${session.user.email}`)
        } catch (error) {
          console.error('❌ Failed to store session login event:', error)
        }
      }
      return session
    },
    async jwt({ token, user }) {
      return token
    },
  },
})

export { handler as GET, handler as POST }
import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { weaviateService } from "@/lib/weaviate"

export const authOptions: NextAuthOptions = {
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
      
      // Use smart session management instead of creating duplicate records
      try {
        if (user.email && account?.provider) {
          console.log('📝 Updating or creating login session in Weaviate...')
          
          const sessionId = await weaviateService.updateOrCreateLoginSession(user.email, {
            provider: account.provider,
            userName: user.name,
            userImage: user.image,
            email: user.email,
          })
          
          // Cleanup old login records to prevent accumulation
          await weaviateService.cleanupOldLoginRecords(user.email)
          
          console.log(`✅ Login session managed successfully! Session ID: ${sessionId} for user: ${user.email}`)
        } else {
          console.log('⚠️ Missing user email or account provider, skipping storage')
        }
      } catch (error) {
        console.error('❌ Failed to manage login session:', error)
        // Don't prevent login if storage fails
      }
      return true
    },
    async session({ session, token }) {
      return session
    },
    async jwt({ token, user }) {
      return token
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
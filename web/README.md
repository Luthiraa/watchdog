# Watchdog Memory Agent

A secure, personal AI memory system with Google OAuth authentication and Weaviate vector storage.

## Features

- 🔐 **Secure Authentication**: Google OAuth integration
- 🧠 **Personal Memory Storage**: Each user's memories are completely isolated
- 🔍 **Semantic Search**: AI-powered search through your stored memories
- 🎨 **Pixelated Security Theme**: Retro-futuristic cybersecurity aesthetic
- ⚡ **Real-time Memory Management**: Store and retrieve memories instantly

## Tech Stack

- **Frontend**: Next.js 15, React 19, Framer Motion
- **Authentication**: NextAuth.js with Google OAuth
- **Vector Database**: Weaviate Cloud
- **Styling**: Tailwind CSS with custom pixelated fonts
- **Embeddings**: OpenAI (via Weaviate)

## Setup Instructions

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console  
- `WEAVIATE_HOST` - Your Weaviate cluster host
- `WEAVIATE_API_KEY` - Your Weaviate API key
- `OPENAI_API_KEY` - For embeddings (used by Weaviate)

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 3. Weaviate Cloud Setup

1. Go to [Weaviate Console](https://console.weaviate.cloud/)
2. Create a new cluster (as shown in your screenshot)
3. Note your cluster URL and API key
4. The schema will be auto-created on first run

### 4. Install Dependencies

```bash
npm install
```

### 5. Initialize Weaviate Schema

```bash
npm run init-weaviate
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Architecture

### User Isolation

Each user's memories are completely isolated using their email as the `userId`. All queries automatically filter by the authenticated user's ID, ensuring complete data privacy.

### Memory Structure

```typescript
interface UserMemory {
  id?: string;           // Weaviate UUID
  userId: string;        // User's email from OAuth
  content: string;       // The actual memory content
  timestamp: string;     // ISO timestamp
  category?: string;     // docs, notes, tasks, papers, etc.
  source?: string;       // chat, upload, extension, etc.
  metadata?: object;     // Additional structured data
}
```

### Security Features

- OAuth-only authentication
- User-scoped data access
- Server-side session validation
- Encrypted vector embeddings
- No cross-user data leakage

## Usage

1. **Sign In**: Use Google OAuth to authenticate
2. **Store Memories**: Type queries or information to save
3. **Search**: Ask questions to find relevant stored memories  
4. **Quick Actions**: Use preset buttons for common searches
5. **Categories**: Organize memories by type (docs, notes, tasks, papers)

## License

MIT

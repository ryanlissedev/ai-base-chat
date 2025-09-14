<div align="center">

<img src="public/icon.svg" alt="Sparka AI" width="64" height="64">

# Sparka AI

**AI for everyone, from everyone**

*Multi-provider AI Chat - access Claude, ChatGPT, Gemini, and Grok with advanced features, open-source and production-ready.*

[**Try Sparka AI**](https://sparka.ai)


</div>

Access every major AI assistant Claude, GPT-4, Gemini, Grok, and 20+ models through one interface. Get capabilities like document analysis, image generation, code execution, and research tools without managing multiple subscriptions. Try instantly — no login required.


## ✨ Features

- **🤖 Multi-Model Chat** - Access 90+ AI models including Claude, GPT-5, Gemini, and Grok in one interface.

- **🔐 Authentication & Sync** - Secure authentication with chat history sync across all devices.

- **🎯 Easy to Try** - Try the interface and some features without creating an account.

- **📎 Attachment Support** - Upload and analyze images, PDFs, and documents in conversations.

- **🎨 AI-Powered Image Generation** - Generate and edit images with advanced AI models.

- **💻 Syntax Highlighting** - Beautiful code formatting and highlighting for all programming languages.

- **🔄 Resumable Streams** - Continue AI generations after page refreshes or interruptions.

- **🌳 Chat Branching** - Create alternative conversation paths without losing your original thread.

- **🔗 Chat Sharing** - Share conversations with others and collaborate on AI-assisted projects.

- **🔭 Deep Research** - Comprehensive research with real-time web search, source analysis, and cited findings.

- **⚡ Code Execution** - Run Python, JavaScript, and more in secure sandboxes.

- **📄 Document Creation** - Generate and edit documents, spreadsheets, and presentations.

- **📊 Web Analytics** - Built-in Vercel Web Analytics (enable in Vercel dashboard).


## 🛠️ Tech Stack

Sparka AI is built with modern technologies for scalability and performance:

### **Frontend**
- **Next.js 15**: App Router with React Server Components
- **TypeScript**: Full type safety and developer experience
- **Tailwind CSS**: Responsive, utility-first styling
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations and transitions
- **Zustand**: Lightweight state management

### **Backend**
- **Vercel AI SDK**: Unified AI provider integration
- **tRPC**: End-to-end typesafe APIs
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Robust data persistence
- **Redis**: Caching and real-time features

### **AI Integration**
- **AI SDK v5**: Latest Vercel AI SDK for unified provider integration
- **AI SDK Gateway**: Models from various AI providers with automatic fallbacks


## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ or Bun
- PostgreSQL database
- Redis (optional, for scaling)

### **Quick Start**

1. **Install**
   ```bash
   bun install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

3. **Database Setup**
   ```bash
   bun run db:migrate
   ```

4. **Development Server**
   ```bash
   bun dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to start using Sparka AI locally.


## 🙏 Acknowledgements

Sparka AI was built on the shoulders of giants. We're deeply grateful to the open source community and the projects that inspired this work.

# AGENTS.md - Sparka AI Codebase Guide

## Essential Commands
```bash
# Development
bun dev                    # Start Next.js 15 dev server with Turbopack
bun run build              # Run DB migrations + build (tsx lib/db/migrate)
bun start                  # Production server

# Database (Drizzle ORM + PostgreSQL)
bun run db:generate        # Generate migrations from schema changes
bun run db:migrate         # Apply pending migrations
bun run db:studio          # Visual database browser
bun run db:push            # Direct schema push (dev only)

# Testing Strategy
bun test                   # Playwright E2E (auth → reasoning → chat flows)
bun run test:unit          # Vitest unit tests
bun run test:db            # pgTAP database tests (170+ assertions)
bun run test:types         # TypeScript compilation check

# Code Quality
bun run lint               # Next.js ESLint + Biome linting
bun run format             # Biome formatting
```

## Architecture Overview
- **Framework**: Next.js 15 App Router + React 19 + TypeScript 5.8.3
- **Database**: PostgreSQL + Drizzle ORM (23+ migrations, complex schema)
- **AI Integration**: Vercel AI SDK v5 with 90+ models (OpenAI, Anthropic, Google, xAI)
- **Authentication**: NextAuth v5 + anonymous sessions with credit system
- **Styling**: Tailwind CSS v4 + Radix UI components
- **Package Manager**: Bun (fastest performance)

## Key Dependencies
- **Core**: `next@15.5.1-canary.28`, `react@19.1.1`, `drizzle-orm@0.34.0`
- **AI**: `ai@5.0.39`, `@ai-sdk/*` providers, resumable streaming
- **Testing**: `@playwright/test@1.50.1`, `vitest@3.2.4`, pgTAP for DB
- **UI**: `@radix-ui/*` components, `tailwindcss@4.1.12`
- **State**: `@tanstack/react-query@5.75.1`, `zustand@5.0.6`

## Database Schema (lib/db/schema.ts)
```sql
User: credits, reservedCredits, authentication
Chat: visibility, branching conversations
Message: parentMessageId (branching), streaming content
Attachment: file uploads with Vercel Blob
Document: AI artifacts with versioning
Share: public links with expiration
Vote: message feedback system
```

## Critical Patterns
1. **Streaming**: Resumable streams with Redis backing for real-time AI responses
2. **Credits**: Reservation system prevents over-spending on AI operations
3. **Branching**: Chat conversations support message editing and alternate paths
4. **Anonymous**: Guest users get persistent sessions with credit limits
5. **Tools**: Modular AI tools (search, code interpreter, image generation)

## Testing Coverage
- **E2E**: Authentication flows, chat streaming, file uploads, AI tools
- **Unit**: Utility functions, AI tool logic, credit calculations
- **Database**: 170+ pgTAP assertions validating schema integrity
- **Types**: Compilation checks ensure type safety across codebase
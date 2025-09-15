# @CLAUDE.md - Sparka AI Project Guide

This file provides comprehensive guidance for working with the Sparka AI codebase - a Next.js 15 application with advanced AI chat capabilities, real-time streaming, and multi-provider AI integration.

## Project Overview

Sparka AI is a sophisticated chat application built with modern web technologies, featuring:
- **Multi-provider AI integration** with 90+ language models (OpenAI, Anthropic, Google, xAI)
- **Real-time streaming responses** with resumable stream technology
- **Advanced AI tools** including web search, document creation, code interpretation, image generation
- **Anonymous and authenticated users** with credit-based usage system
- **Chat branching and sharing** capabilities
- **Document artifacts** with syntax highlighting and collaborative editing

## Development Commands

### Core Development
```bash
# Development server with Turbopack
bun dev                    # Start Next.js dev server with --turbo flag

# Build and deployment
bun run build              # Run migrations then build (includes tsx lib/db/migrate)
bun start                  # Start production server
```

### Database Operations
```bash
# Schema and migrations
bun run db:generate        # Generate Drizzle migrations from schema changes
bun run db:migrate         # Run pending migrations (npx tsx lib/db/migrate.ts)
bun run db:studio          # Open Drizzle Studio for database management
bun run db:push            # Push schema changes directly (dev only)
bun run db:pull            # Pull schema from existing database
bun run db:check           # Validate migration files
bun run db:up              # Apply migrations (deprecated, use db:migrate)
```

### Testing Strategy
```bash
# End-to-end testing with Playwright
bun test                   # Run Playwright tests with 4 workers (sets PLAYWRIGHT=True)
bun run test:unit          # Run Vitest unit tests
bun run test:types         # Generate Next.js types then run TypeScript check

# Test environments
# - Uses .env.local for configuration
# - Playwright tests include auth setup, chat flows, reasoning, artifacts
# - Setup dependencies: auth -> reasoning -> specific test suites
```

### Code Quality
```bash
# Linting and formatting
bun run lint               # Next.js ESLint + Biome lint --write --unsafe
bun run lint:fix           # ESLint fix + Biome lint with auto-fixes
bun run format             # Biome format --write

# Model data management
bun run fetch-models       # Update model definitions from providers
bun run fetch-model-features # Update model capabilities data
```

### Storybook
```bash
bun storybook              # Start Storybook dev server (port 6006)
bun run build:storybook    # Build Storybook for deployment
```

## Architecture Overview

### Tech Stack Foundation
- **Framework**: Next.js 15 with App Router, React 19, TypeScript 5.8.3
- **Package Manager**: Bun 1.1.34 (fastest installs and dev server)
- **Database**: PostgreSQL with Drizzle ORM (23 migrations, complex schema)
- **Styling**: Tailwind CSS 4 with Radix UI components
- **Authentication**: NextAuth.js 5.0.0-beta with OAuth + anonymous sessions
- **AI Integration**: Vercel AI SDK with resumable streams

### Key Architectural Patterns

#### 1. Next.js 15 App Router Structure
```
app/
├── (auth)/                    # Auth group - login, register, OAuth routes
│   ├── auth.ts               # NextAuth configuration
│   ├── auth.config.ts        # Provider and callback configuration
│   └── api/auth/[...nextauth]/ # NextAuth API routes
├── (chat)/                   # Main chat application group
│   ├── api/chat/route.ts     # Core chat API (698 lines - main streaming endpoint)
│   ├── chat/[id]/           # Dynamic chat pages with deferred loading
│   └── actions.ts           # Server actions for chat operations
├── api/                     # Additional API routes
│   ├── trpc/[trpc]/         # tRPC router endpoint
│   ├── models/guest/        # Guest model access
│   ├── og/                  # Open Graph image generation
│   └── cron/cleanup/        # Background cleanup tasks
└── layout.tsx               # Root layout with providers
```

#### 2. tRPC API Layer
- **Location**: `app/api/trpc/[trpc]/route.ts`
- **Purpose**: Type-safe API calls for database operations
- **Integration**: Used alongside REST endpoints for different concerns
- **Usage**: Client-side data fetching with React Query integration

#### 3. Drizzle ORM with PostgreSQL
```typescript
// Key schema tables (lib/db/schema.ts)
user         // User accounts with credits system
chat         // Chat conversations with visibility settings
message      // Individual messages with branching support
attachment   // File uploads (images, PDFs) with blob storage
document     // AI-generated artifacts with versioning
share        // Public sharing links with permissions

// Migration management
lib/db/migrations/    // 23+ SQL migration files
lib/db/migrate.ts     // Migration runner script
drizzle.config.ts     // Drizzle Kit configuration
```

#### 4. AI Integration Architecture
```typescript
// Provider abstraction (lib/ai/providers.ts)
- Multi-provider support: OpenAI, Anthropic, Google, xAI
- Dynamic model loading with lazy initialization
- Provider-specific options and configurations
- Cost calculation per model and request

// Tools system (lib/ai/tools/)
- Modular AI tools with cost tracking
- Tools: web search, document creation, code interpreter, image generation
- Credit-based usage with reservation system
- Tool filtering based on user permissions

// Streaming system
- Resumable streams with Redis backing
- Real-time UI updates during generation
- Stream continuation after page refresh
- Multiple stream types: text, tool calls, artifacts
```

#### 5. Authentication Flow
```typescript
// Authentication strategies
1. OAuth providers (GitHub, Google) - disabled in current config
2. Anonymous sessions with localStorage persistence
3. Credit-based access control for both authenticated and anonymous users

// Session management (lib/anonymous-session-server.ts)
- Anonymous users get persistent sessions with credit limits
- Rate limiting per client IP
- Session transfer to authenticated accounts
```

#### 6. Real-time Features
```typescript
// Resumable streaming (uses resumable-stream package)
- Stream state persisted in Redis
- Continuation after network interruptions
- Progress restoration on page refresh
- Real-time tool execution updates

// WebSocket alternative approach
- Server-Sent Events for streaming responses
- React Suspense for progressive UI updates
- Optimistic UI updates during stream processing
```

### Database Schema Overview

#### Core Tables
```sql
-- User management
User: id, email, name, image, credits, reservedCredits, createdAt
-- Indexes: user_email_idx, user_created_at_idx

-- Chat system
Chat: id, title, userId, createdAt, updatedAt, visibility, isPinned
Message: id, chatId, role, content, createdAt, sequence, parentMessageId
-- Supports branching conversations with parentMessageId relationships

-- File handling
Attachment: id, name, contentType, size, url, userId, messageId, createdAt

-- AI artifacts
Document: id, title, content, kind, userId, createdAt, updatedAt
-- Supports multiple document types: text, code, spreadsheet

-- Sharing system
Share: id, chatId, userId, createdAt, updatedAt, expiresAt
-- Public sharing with optional expiration
```

#### Migration Commands
```bash
# Development workflow
1. Modify lib/db/schema.ts
2. bun run db:generate          # Creates migration files
3. bun run db:migrate           # Applies to database
4. bun run db:check             # Validates consistency

# Production deployment
bun run build                   # Runs migrations before build automatically
```

### Key Architectural Decisions

#### 1. Hybrid Rendering Strategy
- **Static**: Marketing pages, documentation
- **Dynamic**: Chat interfaces, user dashboards
- **PPR (Partial Prerendering)**: Enabled incrementally
- **Streaming**: Real-time chat responses

#### 2. State Management
```typescript
// Client state (Zustand stores)
lib/stores/markdown-cache.ts    # Cache for rendered markdown

// Server state (React Query + tRPC)
@tanstack/react-query          # Cache management
@trpc/tanstack-react-query     # Type-safe server state

// URL state
Next.js 15 typed routes        # Type-safe navigation
Dynamic routing for chat IDs   # SEO-friendly chat URLs
```

#### 3. Performance Optimizations
```typescript
// Bundle optimization (next.config.ts)
experimental: {
  optimizePackageImports: [
    'react-tweet', 'echarts-for-react', '@lobehub/icons'
  ]
}

// Code splitting
- Dynamic imports for AI tools
- Lazy component loading
- Route-based splitting in App Router

// Database optimization
- Strategic indexes on frequently queried columns
- Connection pooling configuration needed (identified in refactoring plan)
- Query batching for related data
```

## Testing Strategy

### Test Types and Coverage
```bash
# Playwright E2E Tests (tests/)
tests/auth.test.ts          # Authentication flows, OAuth, anonymous sessions
tests/chat.test.ts          # Core chat functionality, streaming, branching
tests/artifacts.test.ts     # Document creation, editing, syntax highlighting
tests/reasoning.test.ts     # AI reasoning capabilities, tool usage

# Test Setup Dependencies
auth.setup.ts    # Creates authenticated session (saves to playwright/.auth/)
reasoning.setup.ts # Sets up reasoning test environment (depends on auth)

# Configuration
playwright.config.ts        # 60s timeout, HTML reporter, Chrome focus
```

### Running Tests
```bash
# Full test suite
bun test                    # Runs all Playwright tests (4 workers)
SKIP_WEBSERVER=true bun test # Uses existing dev server

# Specific test suites
bunx playwright test chat   # Chat functionality only
bunx playwright test --headed # Run with browser visible

# Unit tests
bun run test:unit           # Vitest for utility functions, pure logic
bun run test:types          # TypeScript compilation checks
```

### Critical Test Scenarios
1. **Authentication flows**: OAuth, anonymous sessions, credit management
2. **Chat streaming**: Message sending, real-time responses, stream resumption
3. **File attachments**: Image/PDF upload, processing, display
4. **AI tools**: Web search, document creation, code interpretation
5. **Chat branching**: Message editing, conversation splitting, navigation
6. **Sharing**: Public link creation, access control, anonymous saving

## Performance Considerations

### Current Performance Issues (From Refactoring Plan)
1. **Bundle Size**: 177 dependencies, no code splitting for AI tools
2. **Database Queries**: Missing indexes, N+1 query patterns
3. **React Re-renders**: Missing memoization in expensive components
4. **Caching**: No Redis caching for AI model data

### Optimization Strategies
```typescript
// Bundle analysis
ANALYZE=true bun run build   # Requires @next/bundle-analyzer

// Database performance
// Add indexes for frequently queried columns:
CREATE INDEX CONCURRENTLY idx_message_chat_id_created_at ON "Message" ("chatId", "createdAt");
CREATE INDEX CONCURRENTLY idx_chat_user_id_updated_at ON "Chat" ("userId", "updatedAt");

// React performance
- Use React.memo for expensive chat components
- Implement useMemo/useCallback for complex calculations
- Optimize message rendering with virtualization
```

## Deployment Considerations

### Environment Configuration
```bash
# Required environment variables (.env.example has full list)
AUTH_SECRET                 # NextAuth session encryption
POSTGRES_URL               # Database connection
BLOB_READ_WRITE_TOKEN      # Vercel Blob storage for file uploads
REDIS_URL                  # Optional: enables resumable streams

# AI Provider Keys (multiple providers supported)
OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, XAI_API_KEY

# Tool-specific keys
FIRECRAWL_API_KEY         # Web crawling
EXA_API_KEY               # Advanced web search
E2B_API_KEY               # Code interpreter sandbox
TAVILY_API_KEY            # Alternative web search
```

### Production Setup
```bash
# Build process
1. bun install --frozen-lockfile
2. bun run build              # Includes automatic migration run
3. bun start                  # Production server

# Database considerations
- Run migrations in build step (automated)
- Configure connection pooling for production load
- Set up database backups and monitoring

# Caching strategy
- Redis for resumable streams (optional but recommended)
- Vercel Edge Cache for static content
- SWR for client-side data caching
```

## Development Best Practices

### Code Organization Patterns
```typescript
// Component structure
components/
├── ui/              # Radix UI + shadcn components
├── chat/            # Chat-specific components
├── auth/            # Authentication UI
├── artifacts/       # Document/code artifact renderers
└── providers/       # Context providers for global state

// Utility organization
lib/
├── ai/              # AI providers, tools, prompts
├── db/              # Database schema, queries, migrations
├── credits/         # Credit system, reservations
├── utils/           # Generic utilities, helpers
└── types/           # TypeScript type definitions
```

### File Naming Conventions
- **Components**: PascalCase (`ChatMessage.tsx`)
- **Utilities**: camelCase (`token-utils.ts`)
- **API routes**: kebab-case following Next.js conventions
- **Database**: snake_case for SQL, camelCase for TypeScript

### Type Safety Practices
```typescript
// Strict TypeScript configuration
- Enable strict mode in tsconfig.json
- Use branded types for IDs (UUIDs)
- Implement runtime validation with Zod schemas
- Avoid 'any' types (current issue: @ts-expect-error suppressions need fixing)

// Database type safety
- Drizzle ORM provides full type inference
- Use InferSelectModel for table types
- Implement proper foreign key relationships
```

### Error Handling Strategies
```typescript
// API error handling
- Consistent error response format across routes
- Proper HTTP status codes
- Error boundaries for React components
- Logging with structured format (lib/logger.ts)

// AI tool error handling
- Graceful fallbacks when tools fail
- Credit rollback on failed operations
- User-friendly error messages
- Retry mechanisms for transient failures
```

## Common Workflows

### Adding a New AI Tool
1. **Define tool interface** in `lib/ai/tools/tools-definitions.ts`
2. **Implement tool logic** in `lib/ai/tools/your-tool.ts`
3. **Add to tools registry** in `lib/ai/tools/tools.ts`
4. **Update cost calculation** in credit system
5. **Add UI components** for tool results
6. **Write tests** for tool functionality

### Database Schema Changes
1. **Modify schema** in `lib/db/schema.ts`
2. **Generate migration** with `bun run db:generate`
3. **Review SQL migration** in `lib/db/migrations/`
4. **Test migration** with `bun run db:migrate`
5. **Update queries** in `lib/db/queries.ts`
6. **Update TypeScript types** as needed

### Adding New Chat Features
1. **Update message schema** if needed for new data
2. **Modify chat API route** in `app/(chat)/api/chat/route.ts`
3. **Add UI components** for feature rendering
4. **Update streaming logic** if real-time updates needed
5. **Add Playwright tests** for E2E coverage
6. **Update sharing logic** if feature affects public shares

## Debugging and Monitoring

### Development Debugging
```bash
# Useful debugging commands
bun run db:studio           # Visual database browser
bun run --inspect dev       # Node.js debugger attachment

# Log locations
- Browser console for client-side issues
- Terminal output for server-side logs
- Database queries visible in Drizzle Studio
- AI tool execution logs in chat interface

# Common debug scenarios
1. Stream interruption: Check Redis connection and resumable stream state
2. Credit issues: Verify credit calculation and reservation logic
3. Authentication problems: Check NextAuth callbacks and session state
4. File upload failures: Verify Vercel Blob configuration and permissions
```

### Production Monitoring
- **Performance**: Monitor bundle size, Core Web Vitals, database query times
- **Errors**: Track AI tool failures, authentication issues, database connection problems
- **Usage**: Monitor credit consumption, popular AI models, feature adoption
- **Costs**: Track AI provider API usage and costs across different models

## Security Considerations

### Input Validation
- **API routes**: Validate all inputs with Zod schemas before processing
- **File uploads**: Validate file types, sizes, scan for malicious content
- **AI prompts**: Sanitize user inputs to prevent prompt injection
- **Database queries**: Use parameterized queries (Drizzle ORM handles this)

### Authentication Security
- **Session management**: Secure JWT tokens with proper expiration
- **Rate limiting**: Implement per-user and per-IP limits (partially implemented)
- **API keys**: Never expose AI provider keys in client-side code
- **CSRF protection**: NextAuth handles CSRF for authenticated routes

### Data Privacy
- **User data**: Encrypt sensitive information in database
- **Chat history**: Respect user privacy preferences
- **Anonymous sessions**: Implement proper cleanup of temporary data
- **Sharing**: Validate permissions on shared chat access

---

**Last Updated**: 2025-01-15
**Next.js Version**: 15.5.1-canary.28
**Critical Dependencies**: React 19.1.1, Drizzle ORM 0.34.0, Vercel AI SDK 5.0.39

This guide focuses on project-specific patterns and decisions unique to Sparka AI. For general Next.js or React patterns, refer to official documentation.
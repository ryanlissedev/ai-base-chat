# Guest Chat Access

This application supports full chat functionality for guest users without requiring login. Guests can use any model configured in your environment while keeping API keys secure on the server.

## Features

### For Guest Users
- **No login required** - Start chatting immediately
- **Full model access** - Use any model enabled by the administrator
- **Tool support** - Access to AI tools like web search, code interpreter, image generation
- **Session persistence** - Continue conversations within the same browser session
- **Rate protection** - Fair usage limits to prevent abuse

### For Administrators
- **Environment-driven configuration** - Control guest access via `.env`
- **Secure API keys** - All provider keys remain server-side only
- **Flexible model selection** - Allow all models or specify a custom list
- **Rate limiting** - Configurable per-minute and per-month limits
- **Credit system** - Per-session budget control

## Configuration

Add these variables to your `.env` file:

```env
# Guest model access (required)
ANONYMOUS_MODELS=all              # Allow all models
# OR specify a comma-separated list:
# ANONYMOUS_MODELS=openai/gpt-4o,google/gemini-2.5-pro,anthropic/claude-3.5-sonnet

# Guest limits (optional, shown with defaults)
ANONYMOUS_CREDITS=10000           # Per-session credit budget
ANONYMOUS_RPM=10000               # Requests per minute
ANONYMOUS_RPMONTH=10000           # Requests per month
```

### Model Configuration Examples

#### Allow all models (default)
```env
ANONYMOUS_MODELS=all
```

#### Allow specific models only
```env
ANONYMOUS_MODELS=openai/gpt-4o,anthropic/claude-3.5-sonnet,google/gemini-2.5-flash
```

#### Disable guest access entirely
```env
ANONYMOUS_MODELS=none
```

## How It Works

1. **Authentication Flow**
   - Auth config (`auth.config.ts`) allows all routes including `/chat/*`
   - Middleware excludes chat routes from auth requirements
   - Guest users get anonymous sessions with unique IDs

2. **Model Gating**
   - `lib/types/anonymous.ts` parses `ANONYMOUS_MODELS` environment variable
   - Creates dynamic `AVAILABLE_MODELS` list at runtime
   - Filters invalid model IDs automatically

3. **Client-Side Enforcement**
   - `ModelSelector` component disables unavailable models for guests
   - `MultimodalInput` prevents submission with restricted models
   - Chat layout validates and falls back to default model if needed

4. **Server-Side Validation**
   - API routes check model against `ANONYMOUS_LIMITS.AVAILABLE_MODELS`
   - Returns 403 error if guest tries to use restricted model
   - All API keys remain server-side via AI Gateway

5. **Rate Limiting**
   - IP-based rate limiting using Redis (or memory fallback)
   - Configurable per-minute and per-month limits
   - Returns 429 with retry information when exceeded

6. **Credit System**
   - Each guest session gets configurable credits
   - Credits consumed per message/tool use
   - Session persists via secure HTTP-only cookies

## Testing

### Verify Configuration
```bash
# Run the test script to check your setup
npx tsx scripts/test-guest-access.ts
```

### Check Guest Models Endpoint
```bash
# View current guest model configuration
curl http://localhost:3000/api/models/guest
```

### Manual Testing
1. Open incognito/private browser window
2. Navigate to your app URL
3. Start chatting without logging in
4. Try different models from the selector
5. Verify rate limits by sending multiple messages

## Security Considerations

- **API Keys**: Never exposed to client, always server-side only
- **Rate Limits**: Prevent abuse with configurable limits
- **Credit System**: Per-session budget prevents runaway costs
- **Model Restrictions**: Can limit to specific models if needed
- **IP Tracking**: Rate limits tracked per IP address
- **Session Security**: Secure HTTP-only cookies for session management

## Troubleshooting

### No models available for guests
- Check `ANONYMOUS_MODELS` environment variable
- Verify model IDs match those in `chatModels` catalog
- Run test script to see parsed configuration

### Rate limit errors
- Adjust `ANONYMOUS_RPM` and `ANONYMOUS_RPMONTH` values
- Check Redis connection if using Redis for rate limiting
- Clear browser cookies to reset session

### Model not working for guests
- Ensure model ID is in `ANONYMOUS_MODELS` list (or using `all`)
- Check that model is not disabled in `all-models.ts`
- Verify provider API key is configured

## Advanced Configuration

### Custom Tool Access
Modify `ANONYMOUS_LIMITS.AVAILABLE_TOOLS` in `lib/types/anonymous.ts` to control which tools guests can use.

### Session Duration
Adjust `ANONYMOUS_LIMITS.SESSION_DURATION` to control how long guest sessions persist.

### Dynamic Model Lists
Create custom logic in `lib/types/anonymous.ts` to dynamically determine available models based on:
- Time of day
- Server load
- Special events
- A/B testing

## Implementation Files

- `lib/types/anonymous.ts` - Core guest limits and model configuration
- `app/(auth)/auth.config.ts` - Auth configuration allowing guest access
- `middleware.ts` - Route exclusions for guest access
- `components/model-selector.tsx` - UI model selection with guest filtering
- `components/multimodal-input.tsx` - Input validation for guest users
- `app/(chat)/layout.tsx` - Guest model validation and fallback
- `app/(chat)/api/chat/route.ts` - Server-side model validation
- `lib/utils/rate-limit.ts` - IP-based rate limiting logic
- `.env.example` - Environment variable documentation
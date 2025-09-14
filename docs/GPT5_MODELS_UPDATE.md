# GPT-5 Models Update - September 2025

## Overview
OpenAI's GPT-5 model family has been updated with the latest specifications as of September 2025. The GPT-5 series represents OpenAI's most advanced language models, optimized for coding, agentic tasks, and high-performance applications.

## Model Variants

### GPT-5 (Standard)
- **Model ID**: `openai/gpt-5`
- **Best For**: Complex coding and agentic tasks
- **Performance**: 
  - 74.9% on SWE-bench Verified
  - 88% on Aider polyglot
- **Context Window**: 272,000 tokens
- **Max Output**: 128,000 tokens
- **Knowledge Cutoff**: September 30, 2024
- **Pricing**:
  - Input: $1.25 per million tokens
  - Output: $10.00 per million tokens
  - 90% cache discount available
- **Features**:
  - ✅ Reasoning capabilities
  - ✅ Tool calling
  - ✅ Image input support
  - ✅ Steerable and collaborative
  - ✅ Proactive task completion

### GPT-5 Mini
- **Model ID**: `openai/gpt-5-mini`
- **Best For**: Balance of speed, cost, and capability
- **Context Window**: 272,000 tokens
- **Max Output**: 128,000 tokens
- **Knowledge Cutoff**: May 30, 2024
- **Pricing**:
  - Input: $0.25 per million tokens
  - Output: $2.00 per million tokens
- **Features**:
  - ✅ Reasoning capabilities
  - ✅ Tool calling
  - ✅ Image input support
  - ✅ Available in GitHub Copilot (all plans including free)
  - ✅ Faster response times than standard GPT-5

### GPT-5 Nano
- **Model ID**: `openai/gpt-5-nano`
- **Best For**: High-throughput simple tasks
- **Context Window**: 272,000 tokens
- **Max Output**: 128,000 tokens
- **Knowledge Cutoff**: May 30, 2024
- **Pricing**:
  - Input: $0.05 per million tokens
  - Output: $0.40 per million tokens
- **Features**:
  - ✅ Reasoning capabilities
  - ✅ Tool calling
  - ❌ No image input support
  - ✅ Optimized for batch processing
  - ✅ Fastest response times in GPT-5 family

## Key Features Across GPT-5 Family

### API Features
- **Reasoning Effort Parameter**: Control reasoning depth with `reasoning_effort`
- **Verbosity Parameter**: Adjust response detail level
- **Parallel Tool Calling**: Execute multiple tools simultaneously
- **Built-in Tools**: Web search, file search, image generation
- **Streaming Support**: Real-time response streaming
- **Structured Outputs**: Enforce JSON schema compliance
- **Prompt Caching**: 90% discount on cached tokens
- **Batch API**: Cost-effective batch processing

### Technical Capabilities
- **Input Limit**: 272,000 tokens (all variants)
- **Output Limit**: 128,000 tokens (includes invisible reasoning tokens)
- **Supported APIs**:
  - Chat Completions API
  - Responses API
  - Codex CLI (default model)

## Guest Access Configuration

All GPT-5 models are available for guest users by default when `ANONYMOUS_MODELS=all` is set in the environment. To restrict to specific GPT-5 models:

```env
# Allow only GPT-5 models for guests
ANONYMOUS_MODELS=openai/gpt-5,openai/gpt-5-mini,openai/gpt-5-nano

# Or allow GPT-5 with other select models
ANONYMOUS_MODELS=openai/gpt-5,anthropic/claude-3.5-sonnet,google/gemini-2.5-pro
```

## Migration Notes

### From GPT-4o to GPT-5
- **Context**: GPT-5 has 272K tokens vs GPT-4o's 128K
- **Pricing**: GPT-5 is 50% cheaper on input ($1.25 vs $2.50)
- **Performance**: Significantly better on coding tasks
- **Features**: Native reasoning capabilities and better tool use

### From Previous GPT-5 Config
- **Context Window**: Updated from 400K to 272K (actual limit)
- **Knowledge Cutoffs**: Updated to match official dates
  - GPT-5: September 30, 2024
  - GPT-5 Mini/Nano: May 30, 2024
- **Features**: GPT-5 Nano now correctly shows no image input support

## Testing

Verify GPT-5 models are available:
```bash
# Check all available models for guests
npx tsx scripts/test-guest-access.ts | grep GPT-5

# Test specific GPT-5 model access
ANONYMOUS_MODELS="openai/gpt-5" npx tsx scripts/verify-guest-access.ts

# Check model details via API
curl http://localhost:3000/api/models/guest | jq '.models[] | select(.id | contains("gpt-5"))'
```

## Rollout Status (September 2025)

- ✅ **API Platform**: Generally available
- ✅ **GitHub Copilot**: 
  - GPT-5: Paid plans only
  - GPT-5 Mini: All plans including free
- ✅ **ChatGPT Teams**: Rolling out now
- 🔄 **ChatGPT Enterprise/Edu**: Coming shortly

## Best Practices

### Model Selection
- **GPT-5**: Use for complex coding, debugging, architecture design
- **GPT-5 Mini**: Use for general chat, code review, documentation
- **GPT-5 Nano**: Use for simple completions, classification, batch tasks

### Cost Optimization
- Enable prompt caching for 90% discount on repeated inputs
- Use GPT-5 Nano for high-volume simple tasks
- Consider GPT-5 Mini for most interactive use cases
- Reserve GPT-5 standard for complex multi-step workflows

### Performance Tips
- Use streaming for better perceived latency
- Leverage parallel tool calling for complex workflows
- Set appropriate `reasoning_effort` to balance cost/quality
- Use structured outputs for reliable JSON responses

## References
- [OpenAI Platform Docs](https://platform.openai.com/docs/models/gpt-5)
- [GPT-5 System Card](https://openai.com/index/gpt-5-system-card/)
- [API Pricing](https://openai.com/api/pricing/)
- [GitHub Copilot Announcement](https://github.blog/changelog/2025-09-09-openai-gpt-5-and-gpt-5-mini-are-now-generally-available-in-github-copilot/)
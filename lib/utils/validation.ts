import { z } from 'zod';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('validation');

// Common validation schemas
export const chatRequestSchema = z.object({
  messages: z.array(z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    content: z.string().min(1).max(10000), // Reasonable limits
    parts: z.array(z.any()).optional(),
    attachments: z.array(z.any()).optional(),
  })).min(1).max(50), // Reasonable limits
  model: z.string().min(1).max(100),
  chatId: z.string().uuid().optional(),
  title: z.string().max(200).optional(),
  selectedTool: z.string().max(100).optional(),
});

export const userSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().max(100).optional(),
  image: z.string().url().max(500).optional(),
});

export const chatSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  visibility: z.enum(['public', 'private']).optional(),
  isPinned: z.boolean().optional(),
});

export const messageSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string().min(1).max(50000), // Larger limit for messages
  parts: z.array(z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  parentMessageId: z.string().uuid().optional(),
});

// Validation helper functions
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    const errorMessage = result.error.issues
      .map((err: any) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    
    logger.warn({ 
      errors: result.error.issues,
      data: typeof data === 'object' ? JSON.stringify(data).substring(0, 500) : data
    }, `Validation failed for ${context}`);
    
    return { 
      success: false, 
      error: `Validation failed: ${errorMessage}` 
    };
  } catch (error) {
    logger.error({ error }, `Validation error for ${context}`);
    return { 
      success: false, 
      error: 'Internal validation error' 
    };
  }
}

// Sanitization helpers
export function sanitizeString(input: string, maxLength = 1000): string {
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL');
  }
}

// Rate limiting validation
export function validateRateLimit(
  ip: string,
  userAgent: string | null,
  referer: string | null
): { valid: boolean; reason?: string } {
  // Basic IP validation
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return { valid: false, reason: 'Invalid IP address' };
  }
  
  // Check for suspicious patterns
  if (userAgent && userAgent.length < 10) {
    return { valid: false, reason: 'Suspicious user agent' };
  }
  
  // Check for bot patterns (basic)
  if (userAgent && /bot|crawler|spider|scraper/i.test(userAgent)) {
    return { valid: false, reason: 'Bot detected' };
  }
  
  return { valid: true };
}
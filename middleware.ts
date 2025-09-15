
import { type NextRequest, NextResponse } from 'next/server';
import { createModuleLogger } from '@/lib/logger';
import { getClientIP } from '@/lib/utils/rate-limit';
import { validateRateLimit } from '@/lib/utils/validation';

const logger = createModuleLogger('middleware');

// Security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Rate limiting for API routes
async function checkApiRateLimit(request: NextRequest): Promise<boolean> {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent');
  const referer = request.headers.get('referer');
  
  // Basic validation
  const validation = validateRateLimit(ip, userAgent, referer);
  if (!validation.valid) {
    logger.warn({ 
      ip, 
      userAgent, 
      reason: validation.reason 
    }, 'Request blocked by validation');
    return false;
  }
  
  // Additional rate limiting could be added here
  // For now, we'll rely on the existing rate limiting in the API routes
  
  return true;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply security headers to all responses
  const response = NextResponse.next();
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const isAllowed = await checkApiRateLimit(request);
    if (!isAllowed) {
      return new NextResponse('Rate limit exceeded', { status: 429 });
    }
  }
  
  // Log suspicious activity
  if (pathname.includes('..') || pathname.includes('//')) {
    logger.warn({ 
      pathname, 
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent')
    }, 'Suspicious path detected');
    return new NextResponse('Invalid path', { status: 400 });
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, opengraph-image (favicon and og image)
     * - manifest files (.json, .webmanifest)
     * - Images and other static assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     * - models
     * - compare
     */
    '/((?!_next/static|_next/image|favicon.ico|opengraph-image|manifest|models|compare|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|webmanifest)$).*)',
  ],
};

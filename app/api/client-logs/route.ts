import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface LogEntry {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug' | 'warning' | 'verbose';
  text: string;
  source?: string;
  stack?: string;
}

interface LogPayload {
  entries: LogEntry[];
  sessionId?: string;
}

function normalizeLevel(
  level: string,
): 'log' | 'info' | 'warn' | 'error' | 'debug' {
  if (level === 'warning') return 'warn';
  if (level === 'verbose') return 'debug';
  return ['log', 'info', 'warn', 'error', 'debug'].includes(level)
    ? (level as 'log' | 'info' | 'warn' | 'error' | 'debug')
    : 'log';
}

function colorize(level: string, message: string): string {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    dim: '\x1b[2m',
  };

  switch (level) {
    case 'error':
      return colors.red + message + colors.reset;
    case 'warn':
      return colors.yellow + message + colors.reset;
    case 'debug':
      return colors.magenta + message + colors.reset;
    case 'info':
      return colors.cyan + message + colors.reset;
    default:
      return colors.white + message + colors.reset;
  }
}

function dim(text: string): string {
  return `\x1b[2m${text}\x1b[0m`;
}

function indent(text: string, prefix = '    '): string {
  return String(text)
    .split(/\r?\n/g)
    .map((line) => (line.length ? prefix + line : line))
    .join('\n');
}

function print(level: string, message: string): void {
  switch (level) {
    case 'error':
      console.error(message);
      break;
    case 'warn':
      console.warn(message);
      break;
    default:
      console.log(message);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: LogPayload;

  try {
    payload = await request.json();
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  if (!payload || !Array.isArray(payload.entries)) {
    return new NextResponse('Invalid payload', { status: 400 });
  }

  const sessionId = (payload.sessionId ?? 'anon').slice(0, 8);

  for (const entry of payload.entries) {
    const level = normalizeLevel(entry.level);
    let line = `[browser] [${sessionId}] ${level.toUpperCase()}: ${entry.text}`;

    if (entry.source) {
      line += ` (${entry.source})`;
    }

    print(level, colorize(level, line));

    if (entry.stack) {
      print(level, dim(indent(entry.stack)));
    }
  }

  return new NextResponse(null, { status: 204 });
}

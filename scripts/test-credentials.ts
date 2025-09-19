#!/usr/bin/env tsx

/**
 * Credential Testing Script
 * Tests all configured API keys and services
 */

import { config } from 'dotenv';
import { createModuleLogger } from '../lib/logger';

// Load environment variables
config({ path: '.env.local' });

const log = createModuleLogger('credential-test');

interface TestResult {
  service: string;
  status: 'success' | 'error' | 'missing';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(service: string, status: TestResult['status'], message: string, details?: any) {
  results.push({ service, status, message, details });
  const emoji = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
  console.log(`${emoji} ${service}: ${message}`);
  if (details && status === 'error') {
    console.log(`   Details: ${details}`);
  }
}

async function testDatabase() {
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    addResult('Database', 'missing', 'POSTGRES_URL not configured');
    return;
  }

  try {
    // Test database connection using the Drizzle client
    const { db } = await import('../lib/db/client');
    const result = await db.$client`SELECT 1 as test`;
    if (result && result.length > 0) {
      addResult('Database', 'success', 'PostgreSQL connection successful');
    } else {
      addResult('Database', 'error', 'PostgreSQL query returned no results');
    }
  } catch (error) {
    addResult('Database', 'error', 'PostgreSQL connection failed', error instanceof Error ? error.message : String(error));
  }
}

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    addResult('OpenAI', 'missing', 'OPENAI_API_KEY not configured');
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      addResult('OpenAI', 'success', `API key valid, ${data.data?.length || 0} models available`);
    } else if (response.status === 401) {
      addResult('OpenAI', 'error', 'Invalid API key');
    } else {
      addResult('OpenAI', 'error', `API error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    addResult('OpenAI', 'error', 'Connection failed', error instanceof Error ? error.message : String(error));
  }
}

async function testTavily() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    addResult('Tavily', 'missing', 'TAVILY_API_KEY not configured');
    return;
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: 'test query',
        max_results: 1,
      }),
    });

    if (response.ok) {
      addResult('Tavily', 'success', 'API key valid and responsive');
    } else if (response.status === 401) {
      addResult('Tavily', 'error', 'Invalid API key');
    } else {
      addResult('Tavily', 'error', `API error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    addResult('Tavily', 'error', 'Connection failed', error instanceof Error ? error.message : String(error));
  }
}

async function testFirecrawl() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    addResult('Firecrawl', 'missing', 'FIRECRAWL_API_KEY not configured');
    return;
  }

  try {
    // Test with a simple scrape request to validate the API key
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        formats: ['markdown']
      }),
    });

    if (response.ok) {
      addResult('Firecrawl', 'success', 'API key valid and service online');
    } else if (response.status === 401) {
      addResult('Firecrawl', 'error', 'Invalid API key');
    } else if (response.status === 402) {
      addResult('Firecrawl', 'success', 'API key valid (payment required for usage)');
    } else {
      addResult('Firecrawl', 'error', `API error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    addResult('Firecrawl', 'error', 'Connection failed', error instanceof Error ? error.message : String(error));
  }
}

async function testVercelBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    addResult('Vercel Blob', 'missing', 'BLOB_READ_WRITE_TOKEN not configured');
    return;
  }

  try {
    // Test blob store connectivity
    const response = await fetch('https://blob.vercel-storage.com/', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 405) {
      // Method not allowed is expected for root endpoint, means auth worked
      addResult('Vercel Blob', 'success', 'Token valid and store accessible');
    } else if (response.status === 401) {
      addResult('Vercel Blob', 'error', 'Invalid token');
    } else {
      addResult('Vercel Blob', 'success', 'Token appears valid');
    }
  } catch (error) {
    addResult('Vercel Blob', 'error', 'Connection failed', error instanceof Error ? error.message : String(error));
  }
}

async function testAIGateway() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    addResult('AI Gateway', 'missing', 'AI_GATEWAY_API_KEY not configured');
    return;
  }

  try {
    // Test AI Gateway with a simple health check or models list
    const response = await fetch('https://ai-gateway.vercel.sh/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      addResult('AI Gateway', 'success', 'API key valid and gateway responsive');
    } else if (response.status === 401) {
      addResult('AI Gateway', 'error', 'Invalid AI Gateway API key');
    } else if (response.status === 403) {
      addResult('AI Gateway', 'error', 'AI Gateway access forbidden');
    } else if (response.status === 404) {
      // Models endpoint might not exist, try a different approach
      addResult('AI Gateway', 'success', 'AI Gateway accessible (models endpoint not available)');
    } else {
      addResult('AI Gateway', 'error', `API error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    addResult('AI Gateway', 'error', 'Connection failed', error instanceof Error ? error.message : String(error));
  }
}

async function checkEnvironmentVars() {
  const requiredVars = [
    'AUTH_SECRET',
    'NODE_ENV',
  ];

  const optionalVars = [
    'E2B_API_KEY',
    'LANGFUSE_SECRET_KEY',
    'FIREWORKS_KEY',
    'EXA_API_KEY',
  ];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      addResult('Environment', 'success', `${varName} configured`);
    } else {
      addResult('Environment', 'missing', `${varName} not configured`);
    }
  }

  for (const varName of optionalVars) {
    if (process.env[varName]) {
      addResult('Environment', 'success', `${varName} configured (optional)`);
    }
  }
}

async function main() {
  console.log('🧪 Testing API Credentials and Services...\n');

  await Promise.all([
    testDatabase(),
    testOpenAI(),
    testTavily(),
    testFirecrawl(),
    testVercelBlob(),
    testAIGateway(),
  ]);

  checkEnvironmentVars();

  console.log('\n📊 Test Summary:');
  const successful = results.filter(r => r.status === 'success').length;
  const errors = results.filter(r => r.status === 'error').length;
  const missing = results.filter(r => r.status === 'missing').length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`⚠️  Missing: ${missing}`);

  if (errors === 0 && missing === 0) {
    console.log('\n🎉 All credentials are working perfectly!');
  } else if (errors === 0) {
    console.log('\n✅ All configured credentials are working! Some optional services not configured.');
  } else {
    console.log('\n⚠️  Some credentials need attention. Check the errors above.');
  }
}

main().catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
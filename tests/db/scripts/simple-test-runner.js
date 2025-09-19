#!/usr/bin/env node

/**
 * Simple Database Test Runner
 * Alternative to pgTAP that uses standard SQL and Node.js
 */

import postgres from 'postgres';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const DB_CONFIG = {
  host: process.env.PGHOST || 'localhost',
  port: Number.parseInt(process.env.PGPORT || '5433'),
  database: process.env.PGDATABASE || 'test_db',
  user: process.env.PGUSER || 'test_user',
  password: process.env.PGPASSWORD || 'test_password',
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class SimpleTestRunner {
  constructor() {
    this.client = null;
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      failures: [],
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async connect() {
    try {
      this.client = postgres({
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        database: DB_CONFIG.database,
        user: DB_CONFIG.user,
        password: DB_CONFIG.password,
      });
      // Test the connection
      await this.client`SELECT 1`;
      this.log('✓ Connected to test database', 'green');
      return true;
    } catch (error) {
      this.log(`✗ Failed to connect to database: ${error.message}`, 'red');
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      this.log('✓ Disconnected from database', 'green');
    }
  }

  async runQuery(sql, description) {
    try {
      const result = await this.client.unsafe(sql);
      this.results.passed++;
      this.log(`  ✓ ${description}`, 'green');
      return { success: true, result };
    } catch (error) {
      this.results.failed++;
      this.results.failures.push({
        description,
        sql: `${sql.substring(0, 100)}...`,
        error: error.message,
      });
      this.log(`  ✗ ${description}: ${error.message}`, 'red');
      return { success: false, error };
    }
  }

  async testTableExists(tableName) {
    const result = await this.client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      );
    `;
    return result[0].exists;
  }

  async testColumnExists(tableName, columnName) {
    const result = await this.client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName} 
        AND column_name = ${columnName}
      );
    `;
    return result[0].exists;
  }

  async testConstraintExists(tableName, constraintName) {
    const result = await this.client`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName} 
        AND constraint_name = ${constraintName}
      );
    `;
    return result[0].exists;
  }

  async testIndexExists(indexName) {
    const result = await this.client`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname = ${indexName}
      );
    `;
    return result[0].exists;
  }

  async runSchemaValidationTests() {
    this.log('\n🔍 Running Schema Validation Tests', 'cyan');
    
    // Test required tables exist
    const requiredTables = ['User', 'Chat', 'Message', 'Vote', 'Document', 'Suggestion'];
    
    for (const table of requiredTables) {
      const exists = await this.testTableExists(table);
      if (exists) {
        this.results.passed++;
        this.log(`  ✓ Table '${table}' exists`, 'green');
      } else {
        this.results.failed++;
        this.results.failures.push({
          description: `Table '${table}' should exist`,
          sql: 'Schema validation',
          error: `Table '${table}' not found`,
        });
        this.log(`  ✗ Table '${table}' missing`, 'red');
      }
    }

    // Test User table columns
    const userColumns = ['id', 'createdAt', 'email', 'name', 'image', 'credits', 'reservedCredits'];
    for (const column of userColumns) {
      const exists = await this.testColumnExists('User', column);
      if (exists) {
        this.results.passed++;
        this.log(`  ✓ User.${column} column exists`, 'green');
      } else {
        this.results.failed++;
        this.results.failures.push({
          description: `User.${column} column should exist`,
          sql: 'Schema validation',
          error: `Column '${column}' not found in User table`,
        });
        this.log(`  ✗ User.${column} column missing`, 'red');
      }
    }

    // Test Chat table columns
    const chatColumns = ['id', 'createdAt', 'updatedAt', 'title', 'userId', 'visibility', 'isPinned'];
    for (const column of chatColumns) {
      const exists = await this.testColumnExists('Chat', column);
      if (exists) {
        this.results.passed++;
        this.log(`  ✓ Chat.${column} column exists`, 'green');
      } else {
        this.results.failed++;
        this.results.failures.push({
          description: `Chat.${column} column should exist`,
          sql: 'Schema validation',
          error: `Column '${column}' not found in Chat table`,
        });
        this.log(`  ✗ Chat.${column} column missing`, 'red');
      }
    }

    // Test Message table columns
    const messageColumns = ['id', 'chatId', 'parentMessageId', 'role', 'parts', 'attachments', 'createdAt', 'annotations', 'isPartial', 'selectedModel', 'selectedTool', 'lastContext'];
    for (const column of messageColumns) {
      const exists = await this.testColumnExists('Message', column);
      if (exists) {
        this.results.passed++;
        this.log(`  ✓ Message.${column} column exists`, 'green');
      } else {
        this.results.failed++;
        this.results.failures.push({
          description: `Message.${column} column should exist`,
          sql: 'Schema validation',
          error: `Column '${column}' not found in Message table`,
        });
        this.log(`  ✗ Message.${column} column missing`, 'red');
      }
    }

    this.results.total += requiredTables.length + userColumns.length + chatColumns.length + messageColumns.length;
  }

  async runConstraintTests() {
    this.log('\n🔗 Running Constraint Tests', 'cyan');
    
    // Test primary keys exist
    const tables = ['User', 'Chat', 'Message', 'Vote', 'Document', 'Suggestion'];
    
    for (const table of tables) {
      const result = await this.client`
        SELECT COUNT(*) as pk_count
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = ${table} 
        AND constraint_type = 'PRIMARY KEY';
      `;
      const hasPrimaryKey = result[0].pk_count > 0;
      
      if (hasPrimaryKey) {
        this.results.passed++;
        this.log(`  ✓ ${table} has primary key`, 'green');
      } else {
        this.results.failed++;
        this.results.failures.push({
          description: `${table} should have a primary key`,
          sql: 'Constraint validation',
          error: `No primary key found for table '${table}'`,
        });
        this.log(`  ✗ ${table} missing primary key`, 'red');
      }
    }

    this.results.total += tables.length;
  }

  async runDataIntegrityTests() {
    this.log('\n🔒 Running Data Integrity Tests', 'cyan');
    
    // Test foreign key relationships
    const foreignKeys = [
      { table: 'Chat', column: 'userId', references: 'User' },
      { table: 'Message', column: 'chatId', references: 'Chat' },
      { table: 'Vote', column: 'messageId', references: 'Message' },
      { table: 'Document', column: 'userId', references: 'User' },
      { table: 'Suggestion', column: 'userId', references: 'User' },
    ];

    for (const fk of foreignKeys) {
      const result = await this.client`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.table_schema = 'public'
            AND tc.table_name = ${fk.table}
            AND kcu.column_name = ${fk.column}
            AND ccu.table_name = ${fk.references}
            AND tc.constraint_type = 'FOREIGN KEY'
        );
      `;
      
      const hasForeignKey = result[0].exists;
      
      if (hasForeignKey) {
        this.results.passed++;
        this.log(`  ✓ ${fk.table}.${fk.column} → ${fk.references} foreign key exists`, 'green');
      } else {
        this.results.failed++;
        this.results.failures.push({
          description: `${fk.table}.${fk.column} should reference ${fk.references}`,
          sql: 'Foreign key validation',
          error: `Foreign key constraint not found`,
        });
        this.log(`  ✗ ${fk.table}.${fk.column} → ${fk.references} foreign key missing`, 'red');
      }
    }

    this.results.total += foreignKeys.length;
  }

  async runBasicQueryTests() {
    this.log('\n📊 Running Basic Query Tests', 'cyan');
    
    // Test basic CRUD operations work
    const queries = [
      {
        description: 'Can count tables in public schema',
        sql: "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'",
      },
      {
        description: 'Can select from User table',
        sql: 'SELECT COUNT(*) FROM "User"',
      },
      {
        description: 'Can select from Chat table',
        sql: 'SELECT COUNT(*) FROM "Chat"',
      },
      {
        description: 'Can select from Message table',
        sql: 'SELECT COUNT(*) FROM "Message"',
      },
    ];

    for (const query of queries) {
      await this.runQuery(query.sql, query.description);
    }

    this.results.total += queries.length;
  }

  async runAllTests() {
    this.log('🚀 Starting Database Tests', 'blue');
    this.log(`📍 Testing database: ${DB_CONFIG.database} at ${DB_CONFIG.host}:${DB_CONFIG.port}`, 'blue');
    
    if (!(await this.connect())) {
      return false;
    }

    try {
      await this.runSchemaValidationTests();
      await this.runConstraintTests();
      await this.runDataIntegrityTests();
      await this.runBasicQueryTests();

      this.printSummary();
      return this.results.failed === 0;

    } finally {
      await this.disconnect();
    }
  }

  printSummary() {
    this.log('\n📊 Test Summary', 'cyan');
    this.log('=' * 50, 'cyan');
    
    this.log(`Total Tests: ${this.results.total}`, 'blue');
    this.log(`Passed: ${this.results.passed}`, 'green');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'green');
    
    if (this.results.failures.length > 0) {
      this.log('\n❌ Failures:', 'red');
      for (const failure of this.results.failures) {
        this.log(`  • ${failure.description}`, 'red');
        this.log(`    Error: ${failure.error}`, 'yellow');
      }
    }
    
    if (this.results.failed === 0) {
      this.log('\n🎉 All tests passed!', 'green');
    } else {
      this.log(`\n💥 ${this.results.failed} test(s) failed`, 'red');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new SimpleTestRunner();
  
  runner.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

export default SimpleTestRunner;
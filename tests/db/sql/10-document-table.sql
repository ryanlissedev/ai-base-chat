-- Test Document table specific functionality
BEGIN;

SELECT plan(12);

-- Test Document table has composite primary key
SELECT has_pk('public', 'Document', 'Document table should have primary key');

-- Test Document table column types
SELECT col_type_is('public', 'Document', 'id', 'uuid', 'Document.id should be uuid');
SELECT col_type_is('public', 'Document', 'createdAt', 'timestamp without time zone', 'Document.createdAt should be timestamp');
SELECT col_type_is('public', 'Document', 'title', 'text', 'Document.title should be text');
SELECT col_type_is('public', 'Document', 'content', 'text', 'Document.content should be text');
SELECT col_type_is('public', 'Document', 'kind', 'character varying', 'Document.kind should be varchar');
SELECT col_type_is('public', 'Document', 'userId', 'uuid', 'Document.userId should be uuid');
SELECT col_type_is('public', 'Document', 'messageId', 'uuid', 'Document.messageId should be uuid');

-- Test Document table NOT NULL constraints
SELECT col_not_null('public', 'Document', 'createdAt', 'Document.createdAt should be NOT NULL');
SELECT col_not_null('public', 'Document', 'title', 'Document.title should be NOT NULL');
SELECT col_not_null('public', 'Document', 'userId', 'Document.userId should be NOT NULL');
SELECT col_not_null('public', 'Document', 'messageId', 'Document.messageId should be NOT NULL');

-- Test Document table default values
SELECT col_default_is('public', 'Document', 'kind', '''text''::character varying', 'Document.kind should default to text');

SELECT * FROM finish();
ROLLBACK;
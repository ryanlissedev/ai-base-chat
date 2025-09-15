-- Test Suggestion table specific functionality
BEGIN;

SELECT plan(13);

-- Test Suggestion table has primary key
SELECT has_pk('public', 'Suggestion', 'Suggestion table should have primary key');
SELECT col_is_pk('public', 'Suggestion', 'id', 'Suggestion.id should be primary key');

-- Test Suggestion table column types
SELECT col_type_is('public', 'Suggestion', 'id', 'uuid', 'Suggestion.id should be uuid');
SELECT col_type_is('public', 'Suggestion', 'documentId', 'uuid', 'Suggestion.documentId should be uuid');
SELECT col_type_is('public', 'Suggestion', 'documentCreatedAt', 'timestamp without time zone', 'Suggestion.documentCreatedAt should be timestamp');
SELECT col_type_is('public', 'Suggestion', 'originalText', 'text', 'Suggestion.originalText should be text');
SELECT col_type_is('public', 'Suggestion', 'suggestedText', 'text', 'Suggestion.suggestedText should be text');
SELECT col_type_is('public', 'Suggestion', 'description', 'text', 'Suggestion.description should be text');
SELECT col_type_is('public', 'Suggestion', 'isResolved', 'boolean', 'Suggestion.isResolved should be boolean');
SELECT col_type_is('public', 'Suggestion', 'userId', 'uuid', 'Suggestion.userId should be uuid');
SELECT col_type_is('public', 'Suggestion', 'createdAt', 'timestamp without time zone', 'Suggestion.createdAt should be timestamp');

-- Test Suggestion table NOT NULL constraints
SELECT col_not_null('public', 'Suggestion', 'originalText', 'Suggestion.originalText should be NOT NULL');
SELECT col_not_null('public', 'Suggestion', 'suggestedText', 'Suggestion.suggestedText should be NOT NULL');

-- Test Suggestion table default values
SELECT col_default_is('public', 'Suggestion', 'isResolved', 'false', 'Suggestion.isResolved should default to false');

SELECT * FROM finish();
ROLLBACK;
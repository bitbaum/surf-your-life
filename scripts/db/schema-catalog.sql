-- One line per schema fact in "public": tables, columns (type, null, default),
-- enums, indexes and constraints. scripts/db/check-migration-drift.sh diffs
-- this between a database built from drizzle/*.sql and one pushed from
-- lib/db/schema.ts. Constraint names (and the names of the indexes that back
-- them) are left out on purpose: inline REFERENCES in the early migrations got
-- Postgres's names (threads_client_id_fkey), drizzle-kit uses its own
-- (threads_client_id_users_id_fk), and the app never refers to either. What a
-- constraint does is compared; what it is called is not.
SELECT 'table ' || c.relname
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
UNION ALL
SELECT 'column ' || ic.table_name || '.' || ic.column_name || ' '
  || format_type(a.atttypid, a.atttypmod)
  || ' null=' || ic.is_nullable
  || ' default=' || coalesce(ic.column_default, '')
FROM information_schema.columns ic
JOIN pg_attribute a
  ON a.attrelid = format('public.%I', ic.table_name)::regclass
 AND a.attname = ic.column_name
WHERE ic.table_schema = 'public'
UNION ALL
SELECT 'enum ' || t.typname || ' ' || string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder)
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typnamespace = 'public'::regnamespace
GROUP BY t.typname
UNION ALL
SELECT 'index ' || i.indexname || ' ' || i.indexdef
FROM pg_indexes i
WHERE i.schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_constraint k
    WHERE k.conindid = format('public.%I', i.indexname)::regclass
  )
UNION ALL
SELECT 'constraint ' || k.conrelid::regclass::text || ' ' || k.contype::text || ' '
  || pg_get_constraintdef(k.oid)
FROM pg_constraint k
WHERE k.connamespace = 'public'::regnamespace
ORDER BY 1;

# 🔧 Fix Migration Errors - Quick Resolution Guide

## Problem
You're getting this error:
```
ERROR: 42710: policy "System can insert application logs" for table "application_logs" already exists
```

## 🚀 Quick Fix (Choose One Option)

### Option 1: Reset and Reapply (Recommended for Development)
```bash
# 1. Reset your local Supabase database
supabase db reset

# 2. Apply all migrations in order
supabase db push

# 3. Verify everything works
supabase db diff
```

### Option 2: Manual Cleanup (For Production/Staging)
```bash
# 1. Run the cleanup migration first
supabase migration new cleanup_policies
# Copy content from 20250721000007_cleanup_duplicate_policies.sql

# 2. Apply the cleanup
supabase db push

# 3. Then apply remaining migrations
```

### Option 3: SQL Console Fix (Immediate)
Run this in your Supabase SQL console:

```sql
-- Drop duplicate policies
DROP POLICY IF EXISTS "System can insert application logs" ON application_logs;
DROP POLICY IF EXISTS "System can insert performance metrics" ON performance_metrics;

-- Recreate them cleanly
CREATE POLICY "System can insert application logs"
  ON application_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "System can insert performance metrics"
  ON performance_metrics
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
```

## 🔍 Root Cause
This happens when:
1. Migrations are run multiple times
2. Migrations are applied out of order
3. Manual SQL was run that conflicts with migrations

## ✅ Prevention
1. Always use `supabase db reset` for development
2. Use migration versioning properly
3. Test migrations on staging first
4. Use `IF NOT EXISTS` clauses in migrations

## 🧪 Verify Fix
After applying the fix, test that logging works:

```sql
-- Test logging function
SELECT log_application_event('info', 'test', 'Migration fix test');

-- Check if log was created
SELECT * FROM application_logs WHERE message = 'Migration fix test';
```

## 📋 Migration Order (Current)
Your migrations should be applied in this order:
1. `20250721000001_atomic_stock_management.sql` ✅
2. `20250721000002_secure_price_validation.sql` ✅
3. `20250721000003_fix_rls_policies.sql` ✅
4. `20250721000004_performance_optimizations.sql` ⚠️ (causing issues)
5. `20250721000005_rate_limiting.sql` ✅
6. `20250721000006_fix_logging_functions.sql` ⚠️ (fixed)
7. `20250721000007_cleanup_duplicate_policies.sql` 🆕 (cleanup)

## 🎯 Next Steps After Fix
1. Verify all functions exist:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name LIKE '%log%';
   ```

2. Test order processing:
   ```sql
   SELECT * FROM process_order_with_atomic_stock(
     'test-user-id'::uuid,
     '{"amount": 100}'::jsonb,
     '[{"product_id": "test", "quantity": 1}]'::jsonb
   );
   ```

3. Check security policies:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

## 🆘 If Still Having Issues
1. Check Supabase logs in dashboard
2. Verify your local Supabase CLI version: `supabase --version`
3. Ensure you're connected to the right project: `supabase status`
4. Try running migrations one by one to isolate the issue

## 📞 Emergency Rollback
If you need to rollback quickly:
```bash
# Rollback to a specific migration
supabase db reset --db-url "your-db-url"

# Or restore from backup if available
supabase db dump --db-url "your-db-url" > backup.sql
```

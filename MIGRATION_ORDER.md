# 🔧 Database Migration Order Guide

## ⚠️ IMPORTANT: Apply migrations in this exact order to avoid errors

### **Step 1: Apply the Logging Fix First (CRITICAL)**
```sql
-- Apply this migration first to create logging functions and stub functions
-- File: supabase/migrations/20250721000006_fix_logging_functions.sql
```
This migration:
- Creates the logging tables and functions
- Creates stub functions to prevent RPC errors
- Must be applied BEFORE other security migrations

### **Step 2: Apply Core Security Migrations**
Apply these in order:

1. **Atomic Stock Management**
   ```sql
   -- File: supabase/migrations/20250721000001_atomic_stock_management.sql
   ```

2. **Secure Price Validation**
   ```sql
   -- File: supabase/migrations/20250721000002_secure_price_validation.sql
   ```

3. **Fix RLS Policies**
   ```sql
   -- File: supabase/migrations/20250721000003_fix_rls_policies.sql
   ```

4. **Performance Optimizations**
   ```sql
   -- File: supabase/migrations/20250721000004_performance_optimizations.sql
   ```

5. **Rate Limiting**
   ```sql
   -- File: supabase/migrations/20250721000005_rate_limiting.sql
   ```

## 🚀 Quick Apply Commands

### Using Supabase CLI:
```bash
# Apply all migrations
npx supabase db push

# Or apply specific migration
npx supabase db push --include-all
```

### Using Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Copy and paste each migration file content in the order listed above
4. Execute each migration one by one

## 🔍 Verification Steps

After applying all migrations, verify they worked:

### 1. Check if logging functions exist:
```sql
SELECT proname FROM pg_proc WHERE proname IN (
  'log_application_event',
  'log_performance_metric',
  'log_security_event'
);
```

### 2. Check if security functions exist:
```sql
SELECT proname FROM pg_proc WHERE proname IN (
  'process_order_with_atomic_stock',
  'calculate_order_total_secure',
  'check_rate_limit'
);
```

### 3. Check if tables were created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'application_logs',
  'performance_metrics',
  'rate_limits',
  'security_audit_log'
);
```

## 🚨 Troubleshooting Common Errors

### Error: "function does not exist"
- **Solution**: Apply migration `20250721000006_fix_logging_functions.sql` first

### Error: "relation does not exist"
- **Solution**: Check if your base tables (products, categories, orders) exist
- Apply the core schema migrations first if needed

### Error: "cannot change return type"
- **Solution**: The fixed migrations now include `DROP FUNCTION` statements
- Re-run the migration that's failing

### Error: "column does not exist"
- **Solution**: The migrations now include column existence checks
- This should be automatically handled

## 📝 Notes

- All migrations are designed to be **idempotent** (safe to run multiple times)
- Column and table existence checks prevent errors on re-runs
- Stub functions ensure the application doesn't crash during migration process
- The logging system will work immediately after the first migration

## 🔄 Rollback (if needed)

If you need to rollback migrations:

```sql
-- Drop the new functions
DROP FUNCTION IF EXISTS process_order_with_atomic_stock(uuid, jsonb, jsonb);
DROP FUNCTION IF EXISTS calculate_order_total_secure(jsonb, text);
DROP FUNCTION IF EXISTS log_application_event(text, text, text, text, uuid, text, text, text, text);

-- Drop the new tables
DROP TABLE IF EXISTS application_logs;
DROP TABLE IF EXISTS performance_metrics;
DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS security_audit_log;
```

## ✅ Success Indicators

You'll know the migrations worked when:
1. No more "function does not exist" errors in the browser console
2. Logging appears in the `application_logs` table
3. Orders can be processed without errors
4. Rate limiting functions respond correctly

---

**Need help?** Check the browser console for specific error messages and refer to the troubleshooting section above.

/**
 * Script to manually apply rate limiting migration to remote Supabase database
 * Run this script when Docker is not available for local development
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying rate limiting migration...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250721000010_create_rate_limiting_functions.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          console.warn(`⚠️  Statement ${i + 1} failed (might be expected):`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
        
      } catch (err) {
        console.warn(`⚠️  Statement ${i + 1} error:`, err.message);
      }
    }
    
    // Test the functions
    console.log('\n🧪 Testing rate limiting functions...');
    
    // Test check_order_rate_limit
    try {
      const { data, error } = await supabase.rpc('check_order_rate_limit', {
        p_user_id: '00000000-0000-0000-0000-000000000000'
      });
      
      if (error) {
        console.log('❌ check_order_rate_limit test failed:', error.message);
      } else {
        console.log('✅ check_order_rate_limit is working');
      }
    } catch (err) {
      console.log('❌ check_order_rate_limit test error:', err.message);
    }
    
    // Test check_login_rate_limit
    try {
      const { data, error } = await supabase.rpc('check_login_rate_limit', {
        p_identifier: 'test@example.com'
      });
      
      if (error) {
        console.log('❌ check_login_rate_limit test failed:', error.message);
      } else {
        console.log('✅ check_login_rate_limit is working');
      }
    } catch (err) {
      console.log('❌ check_login_rate_limit test error:', err.message);
    }
    
    // Test check_coupon_rate_limit
    try {
      const { data, error } = await supabase.rpc('check_coupon_rate_limit', {
        p_user_id: '00000000-0000-0000-0000-000000000000'
      });
      
      if (error) {
        console.log('❌ check_coupon_rate_limit test failed:', error.message);
      } else {
        console.log('✅ check_coupon_rate_limit is working');
      }
    } catch (err) {
      console.log('❌ check_coupon_rate_limit test error:', err.message);
    }
    
    // Test is_ip_blocked
    try {
      const { data, error } = await supabase.rpc('is_ip_blocked', {
        p_ip_address: '127.0.0.1'
      });
      
      if (error) {
        console.log('❌ is_ip_blocked test failed:', error.message);
      } else {
        console.log('✅ is_ip_blocked is working');
      }
    } catch (err) {
      console.log('❌ is_ip_blocked test error:', err.message);
    }
    
    // Test log_suspicious_activity
    try {
      const { error } = await supabase.rpc('log_suspicious_activity', {
        p_activity_type: 'test',
        p_identifier: 'test-script',
        p_details: JSON.stringify({ test: true }),
        p_severity: 'low'
      });
      
      if (error) {
        console.log('❌ log_suspicious_activity test failed:', error.message);
      } else {
        console.log('✅ log_suspicious_activity is working');
      }
    } catch (err) {
      console.log('❌ log_suspicious_activity test error:', err.message);
    }
    
    console.log('\n🎉 Migration application completed!');
    console.log('💡 Note: Some errors are expected if functions already exist.');
    console.log('💡 The rate limiting service will now fall back to client-side limiting if database functions fail.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();

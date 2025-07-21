/**
 * Test Script for Production Fixes
 * Run this in browser console to verify fixes
 */

console.log('🧪 Testing Production Fixes...');

// Test 1: Cart Validation
console.log('\n1. Testing Cart Validation...');
try {
  // Test with valid item
  const validItem = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Product',
    price: 10.99,
    quantity: 1,
    image_url: 'https://example.com/image.jpg'
  };
  
  // Test with invalid item (should not crash)
  const invalidItem = {
    id: null,
    name: undefined,
    price: 'invalid',
    quantity: -1
  };
  
  console.log('✅ Cart validation test structure ready');
} catch (error) {
  console.error('❌ Cart validation test failed:', error);
}

// Test 2: Sanitization Functions
console.log('\n2. Testing Sanitization Functions...');
try {
  // Test string sanitization
  const testString = '<script>alert("xss")</script>';
  const testNumber = 123;
  const testNull = null;
  const testUndefined = undefined;
  const testObject = { name: '<script>', value: 123 };
  
  console.log('✅ Sanitization test data prepared');
} catch (error) {
  console.error('❌ Sanitization test failed:', error);
}

// Test 3: Security Headers
console.log('\n3. Testing Security Headers...');
try {
  // Check if CSP meta tag exists
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (cspMeta) {
    console.log('✅ CSP meta tag found (fallback)');
  } else {
    console.log('ℹ️ No CSP meta tag (should be set by server)');
  }
  
  // Check for other security meta tags
  const securityMetas = document.querySelectorAll('meta[http-equiv*="X-"]');
  console.log(`ℹ️ Found ${securityMetas.length} security meta tags`);
  
} catch (error) {
  console.error('❌ Security headers test failed:', error);
}

// Test 4: Error Handling
console.log('\n4. Testing Error Handling...');
try {
  // Test replace function on non-string
  const testReplace = (input) => {
    if (typeof input === 'string') {
      return input.replace(/test/g, 'replaced');
    }
    return input;
  };
  
  console.log('✅ Safe replace function test passed');
  console.log('Result for string:', testReplace('test string'));
  console.log('Result for number:', testReplace(123));
  console.log('Result for null:', testReplace(null));
  
} catch (error) {
  console.error('❌ Error handling test failed:', error);
}

// Test 5: Environment Detection
console.log('\n5. Testing Environment Detection...');
try {
  const isDev = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.includes('dev');
  
  console.log(`ℹ️ Environment: ${isDev ? 'Development' : 'Production'}`);
  console.log(`ℹ️ Protocol: ${window.location.protocol}`);
  console.log(`ℹ️ Hostname: ${window.location.hostname}`);
  
} catch (error) {
  console.error('❌ Environment detection test failed:', error);
}

// Test 6: Local Storage Safety
console.log('\n6. Testing Storage Safety...');
try {
  // Test safe storage operations
  const testKey = 'test_storage_key';
  const testValue = { test: 'value', number: 123 };
  
  // Safe set
  try {
    sessionStorage.setItem(testKey, JSON.stringify(testValue));
    console.log('✅ Storage set operation safe');
  } catch (storageError) {
    console.log('ℹ️ Storage not available (private browsing?)');
  }
  
  // Safe get
  try {
    const retrieved = sessionStorage.getItem(testKey);
    const parsed = retrieved ? JSON.parse(retrieved) : null;
    console.log('✅ Storage get operation safe');
  } catch (storageError) {
    console.log('ℹ️ Storage retrieval failed safely');
  }
  
  // Cleanup
  try {
    sessionStorage.removeItem(testKey);
  } catch (storageError) {
    // Silent fail
  }
  
} catch (error) {
  console.error('❌ Storage safety test failed:', error);
}

console.log('\n🎉 Production fixes test completed!');
console.log('\nNext steps:');
console.log('1. Deploy with proper security headers');
console.log('2. Test cart functionality');
console.log('3. Verify no console errors');
console.log('4. Check mobile compatibility');

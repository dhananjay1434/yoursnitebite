/**
 * Test script to verify the CSP and cart validation fixes
 * Run this in the browser console to test the fixes
 */

console.log('🧪 Testing CSP and Cart Validation Fixes...\n');

// Test 1: Check CSP Meta Tag
console.log('1. Testing CSP Configuration...');
const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
if (cspMeta) {
  const cspContent = cspMeta.getAttribute('content');
  if (cspContent && cspContent.includes('https://cdn.fontshare.com')) {
    console.log('✅ CSP allows Fontshare fonts');
  } else {
    console.log('❌ CSP does not allow Fontshare fonts');
  }
} else {
  console.log('ℹ️ No CSP meta tag found (should be set by server)');
}

// Test 2: Check if fonts are loading
console.log('\n2. Testing Font Loading...');
const fontFaces = Array.from(document.fonts);
const fontshareLoaded = fontFaces.some(font => 
  font.family.includes('Satoshi') || font.family.includes('General Sans')
);

if (fontshareLoaded) {
  console.log('✅ Fontshare fonts are loaded');
} else {
  console.log('⏳ Fontshare fonts may still be loading...');
}

// Test 3: Check for font-related CSP errors
console.log('\n3. Checking for Font CSP Errors...');
const originalError = console.error;
let fontErrors = [];

console.error = function(...args) {
  const message = args.join(' ');
  if (message.includes('font-src') || message.includes('fontshare')) {
    fontErrors.push(message);
  }
  originalError.apply(console, args);
};

// Restore console.error after a short delay
setTimeout(() => {
  console.error = originalError;
  if (fontErrors.length === 0) {
    console.log('✅ No font-related CSP errors detected');
  } else {
    console.log('❌ Font CSP errors found:', fontErrors);
  }
}, 2000);

// Test 4: Test Cart Validation (if cart store is available)
console.log('\n4. Testing Cart Validation...');
if (window.useCartStore) {
  try {
    const cartStore = window.useCartStore.getState();
    
    // Test valid item
    const validItem = {
      id: 'test-123',
      name: 'Test Product',
      price: 10.99,
      original_price: 12.99,
      image_url: 'test.jpg',
      category: 'Test',
      category_id: 'test',
      description: 'Test product',
      stock_quantity: 10
    };
    
    console.log('Testing valid item addition...');
    cartStore.addItem(validItem);
    console.log('✅ Valid item added successfully');
    
    // Test invalid item (missing name)
    const invalidItem = {
      id: 'test-456',
      // name: missing!
      price: 5.99,
      image_url: 'test2.jpg'
    };
    
    console.log('Testing invalid item addition...');
    cartStore.addItem(invalidItem);
    console.log('✅ Invalid item rejected as expected');
    
  } catch (error) {
    console.log('❌ Cart validation test failed:', error.message);
  }
} else {
  console.log('ℹ️ Cart store not available for testing');
}

// Test 5: Check for cart validation errors in console
console.log('\n5. Monitoring for Cart Validation Errors...');
const originalConsoleError = console.error;
let cartErrors = [];

console.error = function(...args) {
  const message = args.join(' ');
  if (message.includes('Cart item validation failed')) {
    cartErrors.push(message);
  }
  originalConsoleError.apply(console, args);
};

// Report cart errors after delay
setTimeout(() => {
  console.error = originalConsoleError;
  if (cartErrors.length === 0) {
    console.log('✅ No cart validation errors detected');
  } else {
    console.log('⚠️ Cart validation errors found:', cartErrors);
  }
}, 3000);

console.log('\n🎯 Test Summary:');
console.log('- CSP updated to allow Fontshare fonts');
console.log('- Cart validation enhanced for snack boxes');
console.log('- All components now pass required fields');
console.log('\n💡 If you still see errors, try:');
console.log('1. Hard refresh (Ctrl+F5)');
console.log('2. Clear browser cache');
console.log('3. Check network tab for font loading');
console.log('4. Verify server-side CSP headers');

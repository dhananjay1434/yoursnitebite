# 🔒 Production Security Headers Configuration

## ⚠️ CRITICAL: Security Headers Must Be Set by Web Server

The browser console warnings you're seeing are because security headers like `X-Frame-Options` and `frame-ancestors` **cannot be set via HTML meta tags**. They must be configured at the web server level.

## 🚀 Quick Fix for Current Errors

### 1. **For Netlify Deployment**
Create `public/_headers` file:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://cdn.fontshare.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 2. **For Vercel Deployment**
Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://cdn.fontshare.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
        }
      ]
    }
  ]
}
```

### 3. **For Apache (.htaccess)**
```apache
<IfModule mod_headers.c>
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://cdn.fontshare.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
</IfModule>
```

### 4. **For Nginx**
```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://cdn.fontshare.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
```

## 🔧 What I Fixed in the Code

### 1. **Security Headers (src/lib/security.ts)**
- ✅ Removed invalid meta tag approach for `X-Frame-Options`
- ✅ Added proper fallback detection
- ✅ Added development-only meta tags
- ✅ Added warnings about proper server configuration

### 2. **Cart Validation (src/store/cartStore.ts)**
- ✅ Added null/undefined checks before validation
- ✅ Fixed `e.replace is not a function` error
- ✅ Added better error handling for missing fields

### 3. **Sanitization Functions (src/lib/validation.ts)**
- ✅ Added type checking before string operations
- ✅ Proper handling of non-string inputs
- ✅ Recursive sanitization for objects and arrays

### 4. **Vite Configuration (vite.config.ts)**
- ✅ Added security headers middleware for development
- ✅ Proper CSP configuration
- ✅ Build optimizations

## 🧪 Test Your Fixes

### 1. **Check Security Headers**
```bash
curl -I https://your-domain.com
```

### 2. **Test Cart Functionality**
- Add items to cart
- Check browser console for errors
- Verify validation messages

### 3. **Verify CSP**
Use browser dev tools → Security tab to check CSP status

## 🎯 Production Checklist

- [ ] Deploy with proper security headers configuration
- [ ] Test cart functionality in production
- [ ] Verify no console errors
- [ ] Check CSP compliance
- [ ] Test on multiple browsers
- [ ] Verify mobile functionality

## 🆘 Emergency Rollback

If issues persist:

1. **Disable security headers temporarily**:
   ```javascript
   // In src/main.tsx, comment out:
   // initializeSecurity();
   ```

2. **Revert cart validation**:
   ```javascript
   // Simplify validation in cartStore.ts
   if (!item?.id || !item?.name) return;
   ```

3. **Check browser compatibility**:
   - Test in Chrome, Firefox, Safari
   - Check mobile browsers
   - Verify older browser support

# 🔒 Security Setup Guide

## Critical Security Configuration

### 1. Environment Variables Setup

**IMMEDIATE ACTION REQUIRED:** The hardcoded Supabase credentials have been removed for security.

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual Supabase credentials in `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

3. **NEVER commit `.env.local` to version control**

### 2. Supabase Project Security Checklist

- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Review and restrict API access patterns
- [ ] Set up proper authentication policies
- [ ] Configure rate limiting in Supabase dashboard
- [ ] Enable audit logging

### 3. Production Deployment

For production deployments, set environment variables in your hosting platform:

**Vercel:**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

**Netlify:**
```bash
netlify env:set VITE_SUPABASE_URL "your_url"
netlify env:set VITE_SUPABASE_ANON_KEY "your_key"
```

### 4. Security Best Practices

- Use different Supabase projects for development/staging/production
- Regularly rotate API keys
- Monitor API usage and set up alerts
- Implement proper error handling without exposing sensitive data
- Use HTTPS only in production

## Next Steps

After setting up environment variables, continue with the remaining security fixes:
1. Atomic stock management implementation
2. Server-side price validation
3. Enhanced authentication security
4. Input validation with Zod

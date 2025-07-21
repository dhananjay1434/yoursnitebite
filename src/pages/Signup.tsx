import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  useEffect(() => {
    // Check for OAuth redirect result
    const handleRedirectResult = async () => {
      try {
        // Get the current session
        const { data } = await supabase.auth.getSession();

        // Check if we have a session and if this is a redirect from OAuth
        if (data?.session?.user && (window.location.hash.includes('access_token') || sessionStorage.getItem('oauth_redirect'))) {
          // Clear the redirect flag
          sessionStorage.removeItem('oauth_redirect');

          // This is a redirect from OAuth (Google signup)
          const user = data.session.user;

          // Ensure profile exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (!profile) {
            // Create profile if it doesn't exist
            await supabase.from('profiles').upsert({
              user_id: user.id,
              email: user.email,
              full_name: user.user_metadata.full_name || user.user_metadata.name,
            });
          }

          toast.success('Account created with Google successfully');
          navigate('/account');
        }
      } catch (error) {
        console.error('Error handling OAuth redirect:', error);
      }
    };

    handleRedirectResult();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, _session: any) => {
      if (event === 'SIGNED_IN') {
        navigate('/account');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        toast.success('Account created successfully!');
        navigate('/login');
      } else {
        toast.error('Signup failed. Please try again.');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      // Set a flag to indicate we're starting an OAuth flow
      sessionStorage.setItem('oauth_redirect', 'true');

      // Start the Google OAuth flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/signup`, // Redirect back to signup page to handle the session
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }

      // The OAuth flow will redirect the user to Google's login page
      // After successful login, Google will redirect back to the redirectTo URL
      // The auth state change listener in useEffect will handle the redirect
    } catch (error: any) {
      // Clear the flag if there's an error
      sessionStorage.removeItem('oauth_redirect');
      toast.error(error.message || 'Google signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-nitebite-dark">
      <Navbar transparent={false} />
      <main className="pt-24 pb-16">
        <div className="page-container max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glassmorphic-card p-8 rounded-2xl"
          >
            <h1 className="text-3xl font-bold text-nitebite-highlight text-center mb-8">
              Create Account
            </h1>
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-nitebite-text mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nitebite-text-muted w-5 h-5" />
                  <Input
                    type="text"
                    value={formData.full_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="pl-10 bg-nitebite-dark-accent/50 border-white/10"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-nitebite-text mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nitebite-text-muted w-5 h-5" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-10 bg-nitebite-dark-accent/50 border-white/10"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-nitebite-text mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nitebite-text-muted w-5 h-5" />
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10 bg-nitebite-dark-accent/50 border-white/10"
                    placeholder="Create a password"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full glassmorphic-button"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Sign Up with Email'}
              </Button>
            </form>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-nitebite-dark-accent text-nitebite-text-muted">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full bg-nitebite-dark-accent/50 border-white/10 text-nitebite-text hover:bg-nitebite-dark-accent"
              onClick={handleGoogleSignup}
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-5 h-5 mr-2"
              />
              Sign Up with Google
            </Button>
            <p className="mt-6 text-center text-sm text-nitebite-text-muted">
              Already have an account?{' '}
              <Button
                variant="link"
                className="text-nitebite-accent hover:text-nitebite-accent-light p-0"
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
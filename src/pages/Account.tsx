import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, Phone, User, LogOut } from 'lucide-react';
import { supabase, type Order, type UserProfile } from '@/supabaseClient';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Account = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
  });

  useEffect(() => {
    // Check if user is authenticated and load data
    const loadUserData = async () => {
      const user = await checkUser();
      if (user) {
        await Promise.all([
          fetchOrders(user.id),
          fetchProfile()
        ]);
      }
    };

    loadUserData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      } else if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return null;
    }
    setLoading(false);
    return user;
  };

  const fetchOrders = async (userId: string) => {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch orders');
    } else {
      setOrders(orders || []);
    }
  };

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        toast.error('Failed to fetch profile');
        return;
      }

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          phone_number: profileData.phone_number || '',
        });
      } else {
        const { error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: user.id,
              email: user.email,
            },
          ]);

        if (createError) {
          toast.error('Failed to create profile');
        } else {
          fetchProfile();
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      toast.error('An error occurred while fetching your profile');
    }
  };

  const handleUpdateProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        email: user.email,
      });

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-nitebite-dark">
      <Navbar transparent={false} />
      <main className="pt-24 pb-16">
        <div className="page-container max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="glassmorphic-ghost-button rounded-full mr-4"
                onClick={() => navigate('/')}
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold text-nitebite-highlight">
                My Account
              </h1>
            </div>
            <Button
              variant="ghost"
              className="text-nitebite-text hover:text-nitebite-highlight"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="glassmorphic-card p-6 rounded-2xl mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-nitebite-highlight">
                Profile Information
              </h2>
              <Button
                variant="ghost"
                onClick={() => setEditing(!editing)}
                className="text-nitebite-accent hover:text-nitebite-accent-light"
              >
                {editing ? 'Cancel' : 'Edit'}
              </Button>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-nitebite-text mb-2">
                    Full Name
                  </label>
                  <Input
                    value={formData.full_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        full_name: e.target.value,
                      })
                    }
                    className="bg-nitebite-dark-accent/50 border-white/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-nitebite-text mb-2">
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone_number}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        phone_number: e.target.value,
                      })
                    }
                    className="bg-nitebite-dark-accent/50 border-white/10"
                  />
                </div>
                <Button
                  className="glassmorphic-button mt-4"
                  onClick={handleUpdateProfile}
                >
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center text-nitebite-text">
                  <User className="w-5 h-5 mr-3 text-nitebite-accent" />
                  <span>{profile?.full_name || 'Not set'}</span>
                </div>
                <div className="flex items-center text-nitebite-text">
                  <Mail className="w-5 h-5 mr-3 text-nitebite-accent" />
                  <span>{profile?.email || 'Not set'}</span>
                </div>
                <div className="flex items-center text-nitebite-text">
                  <Phone className="w-5 h-5 mr-3 text-nitebite-accent" />
                  <span>{profile?.phone_number || 'Not set'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="glassmorphic-card p-6 rounded-2xl mb-8">
            <h2 className="text-xl font-medium text-nitebite-highlight mb-6">
              Order History
            </h2>
            {orders.length === 0 ? (
              <p className="text-nitebite-text-muted text-center py-8">
                No orders yet
              </p>
            ) : (
              <div className="space-y-4">
                {orders.map((order: Order) => (
                  <div
                    key={order.id}
                    className="bg-nitebite-dark-accent/30 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-nitebite-highlight font-medium">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-nitebite-text-muted text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-nitebite-text font-medium">
                          ₹{order.amount.toFixed(2)}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            order.payment_status === 'paid'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {order.payment_status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-nitebite-text">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-nitebite-text-muted">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glassmorphic-card p-6 rounded-2xl">
            <h2 className="text-xl font-medium text-nitebite-highlight mb-6">
              Customer Support
            </h2>
            <div className="space-y-4">
              <div className="bg-nitebite-dark-accent/30 rounded-lg p-4 border border-white/10">
                <h3 className="text-nitebite-accent font-medium mb-2">
                  Contact Us
                </h3>
                <p className="text-nitebite-text-muted mb-4">
                  Need help? Reach out to our support team through any of these
                  channels:
                </p>
                <div className="space-y-3">
                  <a
                    href="mailto:nitebite4u@gmail.com"
                    className="flex items-center text-nitebite-text hover:text-nitebite-highlight transition-colors"
                  >
                    <Mail className="w-5 h-5 mr-3 text-nitebite-accent" />
                    nitebite4u@gmail.com
                  </a>
                  <a
                    href="tel:+919123252856"
                    className="flex items-center text-nitebite-text hover:text-nitebite-highlight transition-colors"
                  >
                    <Phone className="w-5 h-5 mr-3 text-nitebite-accent" />
                    +91 9123252856
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
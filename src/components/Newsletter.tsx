import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, CheckCircle } from 'lucide-react';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // In a real app, you would send this to your backend
      console.log('Subscribing email:', email);
      setIsSubmitted(true);
      setEmail('');
      
      // Reset the submitted state after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-nitebite-midnight to-nitebite-dark-accent/80 w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Bell className="w-10 h-10 text-nitebite-yellow mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold text-nitebite-purple mb-2">
              Never Miss a Late-Night Deal
            </h2>
            <p className="text-white/70 max-w-xl mx-auto">
              Subscribe to our newsletter for exclusive offers, new product alerts, and late-night delivery updates.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-nitebite-yellow"
              required
              disabled={isSubmitted}
            />
            <Button 
              type="submit"
              className="bg-nitebite-yellow hover:bg-nitebite-yellow/90 text-black font-medium"
              disabled={isSubmitted}
            >
              {isSubmitted ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Subscribed!
                </span>
              ) : (
                'Subscribe'
              )}
            </Button>
          </motion.form>

          <motion.p
            className="text-white/50 text-xs text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            By subscribing, you agree to our Privacy Policy and Terms of Service.
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;

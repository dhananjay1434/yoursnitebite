import React, { useState, useEffect, KeyboardEvent, FormEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

// Define TypeScript interface for testimonial data
interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  image: string;
  date?: string;
}

// Testimonial data with proper typing
const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Priya Sharma',
    role: 'College Student',
    content: 'NiteBite saved my exam week! The Study Fuel box had everything I needed to power through late-night study sessions.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80',
    date: '2 weeks ago'
  },
  {
    id: 2,
    name: 'Arjun Patel',
    role: 'Software Developer',
    content: 'The Midnight Munchies box is perfect for coding marathons. Quick delivery and great selection of snacks!',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80',
    date: '1 month ago'
  },
  {
    id: 3,
    name: 'Neha Gupta',
    role: 'Graphic Designer',
    content: 'I love how I can customize my own box. The delivery is always on time, even at 2 AM!',
    rating: 4,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80',
    date: '3 weeks ago'
  }
];

const Testimonials: React.FC = () => {
  const [activeTestimonial, setActiveTestimonial] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Handle joining community
  const handleJoinCommunity = () => {
    setShowEmailForm(true);
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email) {
      setIsJoining(true);
      // Simulate API call
      setTimeout(() => {
        setIsJoining(false);
        setShowEmailForm(false);
        // Show success message or notification here
        alert('Thank you for joining our community!');
      }, 1500);
    }
  };

  return (
    <section
      className="section-spacing bg-gradient-to-b from-nitebite-midnight to-nitebite-dark-accent/50 w-full relative overflow-hidden"
      id="testimonials"
      aria-labelledby="testimonials-heading"
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-nitebite-purple/5 to-transparent" aria-hidden="true"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-nitebite-purple/5 blur-3xl" aria-hidden="true"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-nitebite-yellow/5 blur-3xl" aria-hidden="true"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-12 bg-nitebite-purple/50"></div>
            <span className="text-nitebite-yellow font-medium uppercase text-sm tracking-wider">Testimonials</span>
            <div className="h-px w-12 bg-nitebite-purple/50"></div>
          </div>

          <h2 id="testimonials-heading" className="section-title text-balance">
            What Our Customers Say
          </h2>
          <p className="section-subtitle text-balance">
            Join thousands of satisfied night owls who trust NiteBite for their late-night cravings
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
              transition={{ duration: 0.6, delay: isLoaded ? index * 0.1 : 0 }}
              className="professional-card p-8 relative group card-hover"
              onClick={() => setActiveTestimonial(activeTestimonial === testimonial.id ? null : testimonial.id)}
              onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveTestimonial(activeTestimonial === testimonial.id ? null : testimonial.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={activeTestimonial === testimonial.id}
              aria-label={`Testimonial from ${testimonial.name}`}
            >
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-nitebite-yellow/20 blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true"></div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 rounded-full bg-nitebite-purple/20 blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true"></div>

              <Quote className="absolute top-6 right-6 text-nitebite-purple/20 w-12 h-12 group-hover:text-nitebite-purple/30 transition-colors duration-300" aria-hidden="true" />

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-nitebite-purple/30 to-nitebite-yellow/30 rounded-full blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
                  <img
                    src={testimonial.image}
                    alt={`${testimonial.name}, ${testimonial.role}`}
                    className="w-16 h-16 rounded-full object-cover relative border-2 border-white/10 group-hover:border-white/20 transition-colors duration-300"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{testimonial.name}</h3>
                  <p className="text-white/60 text-sm">{testimonial.role}</p>
                  <div className="flex mt-2" aria-label={`Rating: ${testimonial.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating
                            ? 'text-nitebite-yellow fill-nitebite-yellow'
                            : 'text-gray-400'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-2 bg-nitebite-purple/5 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
                <p className="text-white/80 italic text-base relative leading-relaxed">"{testimonial.content}"</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 group-hover:border-white/20 transition-colors duration-300 flex justify-between items-center">
                <div className="text-nitebite-yellow text-xs font-medium">Verified Customer</div>
                <div className="text-white/40 text-xs">{testimonial.date}</div>
              </div>

              {/* Expanded content when clicked */}
              <AnimatePresence>
                {activeTestimonial === testimonial.id && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-nitebite-dark-accent/95 to-nitebite-midnight/95 backdrop-blur-sm p-8 flex flex-col justify-center items-center rounded-xl z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <button
                      className="absolute top-4 right-4 text-white/60 hover:text-white"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setActiveTestimonial(null);
                      }}
                      aria-label="Close details"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>

                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-nitebite-yellow/50 mb-4"
                    />
                    <h3 className="font-bold text-white text-xl mb-1">{testimonial.name}</h3>
                    <p className="text-nitebite-yellow text-sm mb-4">{testimonial.role}</p>
                    <p className="text-white/90 text-center mb-4">"{testimonial.content}"</p>
                    <div className="flex mb-4" aria-label={`Rating: ${testimonial.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < testimonial.rating
                              ? 'text-nitebite-yellow fill-nitebite-yellow'
                              : 'text-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      className="mt-4 px-6 py-2 bg-nitebite-yellow text-black rounded-full font-medium text-sm hover:bg-nitebite-yellow/90 transition-colors"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        // In a real app, this would navigate to a product page
                        alert(`You would be redirected to view ${testimonial.name}'s recommended products`);
                      }}
                    >
                      View Recommended Products
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.6, delay: isLoaded ? 0.3 : 0 }}
        >
          <div className="inline-flex items-center gap-6 justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <p className="text-white font-medium">
                <span className="text-nitebite-yellow font-bold">10,000+</span> Happy Customers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <p className="text-white font-medium">
                <span className="text-nitebite-yellow font-bold">24/7</span> Delivery
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <p className="text-white font-medium">
                <span className="text-nitebite-yellow font-bold">4.8/5</span> Average Rating
              </p>
            </div>
          </div>

          <AnimatePresence>
            {!showEmailForm ? (
              <motion.div
                className="mt-8 inline-block"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="join-button"
              >
                <div className="relative inline-block">
                  <div className="absolute -inset-1 bg-gradient-to-r from-nitebite-yellow via-nitebite-accent to-nitebite-yellow opacity-70 blur-lg rounded-full"></div>
                  <button
                    className="relative px-8 py-3 bg-gradient-to-r from-nitebite-yellow to-nitebite-accent text-black font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    onClick={handleJoinCommunity}
                    aria-label="Join our community"
                  >
                    Join Our Community
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                className="mt-8 max-w-md mx-auto"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                key="email-form"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-grow">
                    <input
                      type="email"
                      value={email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder:text-white/50 focus:outline-none focus:border-nitebite-yellow"
                      required
                      disabled={isJoining}
                      aria-label="Email address"
                    />
                  </div>
                  <button
                    type="submit"
                    className={`px-6 py-3 bg-gradient-to-r from-nitebite-yellow to-nitebite-accent text-black font-semibold rounded-full shadow-lg transition-all duration-300 ${
                      isJoining ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-1'
                    }`}
                    disabled={isJoining}
                  >
                    {isJoining ? 'Joining...' : 'Subscribe'}
                  </button>
                </div>
                <p className="text-white/50 text-xs mt-2">
                  We respect your privacy and will never share your information.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;

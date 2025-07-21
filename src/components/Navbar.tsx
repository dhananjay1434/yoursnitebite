import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingBag, Search, User, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import NiteBiteLogo from '@/components/NiteBiteLogo';

interface NavbarProps {
  transparent?: boolean;
}

const NewNavbar: React.FC<NavbarProps> = ({ transparent = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const itemCount = useCartStore((state) => state.getItemCount());

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getNavbarClasses = () => {
    return isScrolled || !transparent
      ? 'bg-nitebite-midnight/95 backdrop-blur-lg shadow-md'
      : 'bg-transparent';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to products page with search query
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/snack-boxes', label: 'Boxes' },
    { to: '/box-builder', label: 'Build Your Box' },
    { to: '/products', label: 'All Items' },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${getNavbarClasses()}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <NiteBiteLogo className="z-10" size="md" showText />

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`font-medium transition-colors duration-300 ${location.pathname === link.to ? 'text-nitebite-yellow' : 'text-white hover:text-nitebite-purple'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Search and Cart - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {!isSearchOpen ? (
                <Button
                  onClick={() => setIsSearchOpen(true)}
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-white hover:text-nitebite-yellow transition-colors duration-300"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </Button>
              ) : (
                <motion.form
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '240px', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                  onSubmit={handleSearchSubmit}
                >
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-full bg-white/10 border-white/20 text-white placeholder-white/50 pr-10"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 rounded-full text-white hover:text-nitebite-yellow"
                    onClick={() => setIsSearchOpen(false)}
                    aria-label="Close search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.form>
              )}

              <Link to="/account" className="text-white hover:text-nitebite-yellow transition-colors duration-300">
                <User className="h-5 w-5" />
              </Link>

              <Link to="/checkout" className="relative text-white hover:text-nitebite-yellow transition-colors duration-300">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-nitebite-yellow text-nitebite-midnight text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-3">
              <Link to="/checkout" className="relative text-white hover:text-nitebite-yellow transition-colors duration-300">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-nitebite-yellow text-nitebite-midnight text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                variant="ghost"
                size="icon"
                className="rounded-full text-white hover:text-nitebite-yellow transition-colors duration-300"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-0 right-0 z-40 bg-nitebite-midnight border-t border-nitebite-purple/20 shadow-lg"
          >
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`font-medium py-2 transition-colors duration-300 ${location.pathname === link.to ? 'text-nitebite-yellow' : 'text-white hover:text-nitebite-yellow'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/account"
                  className="font-medium text-white hover:text-nitebite-yellow py-2 transition-colors duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Account
                </Link>
              </nav>

              <div className="mt-4 pt-4 border-t border-white/10">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-full bg-white/10 border-white/20 text-white placeholder-white/50 pr-10"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 rounded-full text-white"
                    aria-label="Search"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NewNavbar;

import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Instagram, Linkedin, Facebook, Twitter, CreditCard, Shield, Clock, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer id="footer" className="bg-nitebite-dark-accent/80 backdrop-blur-lg py-12 w-full">
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: About */}
          <div>
            <h3 className="font-bold text-2xl text-gradient-accent mb-4">nitebite</h3>
            <p className="text-white/70 text-sm mb-4">
              Your late-night delivery service for snacks, beverages, and essentials. Available 24/7 across India.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/nitebit.e/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full glassmorphic-ghost-button text-nitebite-text hover:text-nitebite-accent transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/company/nitebite"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full glassmorphic-ghost-button text-nitebite-text hover:text-nitebite-accent transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full glassmorphic-ghost-button text-nitebite-text hover:text-nitebite-accent transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full glassmorphic-ghost-button text-nitebite-text hover:text-nitebite-accent transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-white/70 hover:text-nitebite-yellow text-sm transition-colors duration-300">Home</Link>
              </li>
              <li>
                <Link to="/snack-boxes" className="text-white/70 hover:text-nitebite-yellow text-sm transition-colors duration-300">Snack Boxes</Link>
              </li>
              <li>
                <Link to="/box-builder" className="text-white/70 hover:text-nitebite-yellow text-sm transition-colors duration-300">Build Your Box</Link>
              </li>
              <li>
                <Link to="/products" className="text-white/70 hover:text-nitebite-yellow text-sm transition-colors duration-300">All Products</Link>
              </li>
              <li>
                <Link to="/account" className="text-white/70 hover:text-nitebite-yellow text-sm transition-colors duration-300">My Account</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Us */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-nitebite-yellow mt-0.5" />
                <span className="text-white/70 text-sm">123 Night Street, Bangalore, Karnataka 560001, India</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-nitebite-yellow" />
                <span className="text-white/70 text-sm">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-nitebite-yellow" />
                <a
                  href="mailto:nitebite4u@gmail.com"
                  className="text-white/70 hover:text-nitebite-yellow text-sm transition-colors duration-300"
                >
                  nitebite4u@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-nitebite-yellow" />
                <span className="text-white/70 text-sm">Open 24/7</span>
              </li>
            </ul>
          </div>

          {/* Column 4: We Accept */}
          <div>
            <h4 className="font-semibold text-white mb-4">We Accept</h4>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="bg-white/10 p-2 rounded-md">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="bg-white/10 p-2 rounded-md">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/2560px-Paytm_Logo_%28standalone%29.svg.png" alt="Paytm" className="w-6 h-6" />
              </div>
              <div className="bg-white/10 p-2 rounded-md">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png" alt="Google Pay" className="w-6 h-6" />
              </div>
              <div className="bg-white/10 p-2 rounded-md">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png" alt="PhonePe" className="w-6 h-6" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-nitebite-yellow" />
              <span className="text-white/70 text-sm">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-nitebite-yellow" />
              <span className="text-white/70 text-sm">Fast Delivery</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/50 text-xs mb-4 md:mb-0">
            © {new Date().getFullYear()} nitebite. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="text-white/50 hover:text-white text-xs transition-colors duration-300">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-white/50 hover:text-white text-xs transition-colors duration-300">
              Terms of Service
            </Link>
            <Link to="/refund-policy" className="text-white/50 hover:text-white text-xs transition-colors duration-300">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

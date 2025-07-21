
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NiteBiteLogoProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const NiteBiteLogo: React.FC<NiteBiteLogoProps> = ({ 
  showText = true, 
  size = 'md',
  className = '' 
}) => {
  // Size mapping
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <motion.div 
        className="relative"
        initial={{ rotate: -10 }}
        animate={{ rotate: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        {/* Moon icon */}
        <div className={`${sizeClasses[size]} rounded-full bg-nitebite-yellow text-nitebite-midnight flex items-center justify-center`}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4/5 h-4/5">
            <path d="M21.5287 15.9294C21.3687 15.6594 20.9187 15.2394 19.7987 15.4394C19.1787 15.5494 18.5487 15.5994 17.9187 15.5694C15.5887 15.4694 13.4787 14.3994 12.0087 12.7494C10.7087 11.2994 9.90873 9.40938 9.89873 7.36938C9.89873 6.22938 10.1187 5.12938 10.5687 4.08938C11.0087 3.07938 10.6987 2.54938 10.4787 2.32938C10.2487 2.09938 9.70873 1.77938 8.64873 2.21938C4.55873 3.93938 2.02873 8.03938 2.32873 12.4294C2.62873 16.5594 5.52873 20.0894 9.36873 21.4194C10.2887 21.7394 11.2587 21.9294 12.2587 21.9694C12.4187 21.9794 12.5787 21.9894 12.7387 21.9894C16.0887 21.9894 19.2287 20.4094 21.2087 17.7194C21.8787 16.7894 21.6987 16.1994 21.5287 15.9294Z" fill="currentColor" />
          </svg>
        </div>
        {/* Star sparkle */}
        <motion.div 
          className="absolute -top-1 -right-1 text-white text-xs"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        >
          ✨
        </motion.div>
      </motion.div>
      
      {showText && (
        <motion.span 
          className={`font-bold ${textSizeClasses[size]} text-transparent bg-clip-text bg-gradient-to-r from-nitebite-purple to-nitebite-purple/80`}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          NiteBite
        </motion.span>
      )}
    </Link>
  );
};

export default NiteBiteLogo;

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import VibeSelector from './VibeSelector';

// Utility component for animated background stars
const StarField: React.FC = () => (
  <>
    {Array.from({ length: 30 }).map((_, i) => {
      const size = Math.random() * 2 + 1; // 1px to 3px
      const style = {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        opacity: 0.2 + Math.random() * 0.8,
      } as React.CSSProperties;

      return (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full"
          style={style}
          animate={{ opacity: [style.opacity, style.opacity + 0.3, style.opacity] }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            repeatType: 'mirror',
          }}
        />
      );
    })}
  </>
);

interface HeroProps {
  scrollToCuratedBoxes?: () => void;
}

const Hero: React.FC<HeroProps> = ({ scrollToCuratedBoxes }) => {
  return (
    <section className="relative min-h-screen w-full bg-gradient-to-br from-nitebite-midnight via-[#1A1F2C] to-nitebite-midnight overflow-hidden">
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-nitebite-midnight/90 to-nitebite-midnight" aria-hidden />

      {/* Animated stars */}
      <StarField />

      {/* Floating elements for visual interest */}
      <div className="absolute top-1/4 left-1/6 w-24 h-24 rounded-full bg-nitebite-purple/10 blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
      <div className="absolute bottom-1/3 right-1/5 w-32 h-32 rounded-full bg-nitebite-yellow/10 blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-2/3 left-1/3 w-20 h-20 rounded-full bg-nitebite-accent/10 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Main content */}
      <div className="w-full relative z-10 flex flex-col items-center justify-center text-center mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="inline-block mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-nitebite-purple/20 text-nitebite-yellow border border-nitebite-purple/30 animate-pulse">
            <span className="w-2 h-2 bg-nitebite-yellow rounded-full mr-2"></span> Now Delivering 24/7
          </span>
        </div>

        <motion.h1
          className="max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#9b87f5] to-nitebite-purple leading-tight text-balance"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          Fuel Your All‑Nighters
        </motion.h1>

        <motion.p
          className="mt-4 max-w-xl text-base sm:text-lg text-white/80 text-balance"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Get curated snack boxes delivered to your doorstep when you need them most.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col sm:flex-row gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } }
          }}
        >
          <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <Button
              className="bg-gradient-to-r from-nitebite-yellow to-nitebite-accent text-black font-medium rounded-full py-6 px-8 text-base w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              asChild
            >
              <Link to="/snack-boxes" aria-label="Quick Delivery" className="inline-flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                  <path d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Quick Delivery
              </Link>
            </Button>
          </motion.div>
          <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <Button
              className="bg-transparent border-2 border-nitebite-purple/50 text-white hover:bg-nitebite-purple/10 rounded-full py-6 px-8 text-base w-full sm:w-auto transition-all duration-300 hover:-translate-y-1"
              onClick={scrollToCuratedBoxes}
            >
              <span className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                  <path d="M21 10H3M21 10C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12V20C23 20.5304 22.7893 21.0391 22.4142 21.4142C22.0391 21.7893 21.5304 22 21 22H3C2.46957 22 1.96086 21.7893 1.58579 21.4142C1.21071 21.0391 1 20.5304 1 20V12C1 11.4696 1.21071 10.9609 1.58579 10.5858C1.96086 10.2107 2.46957 10 3 10M21 10V8C21 7.46957 20.7893 6.96086 20.4142 6.58579C20.0391 6.21071 19.5304 6 19 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V10M12 15H12.01V15.01H12V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                See All Boxes
              </span>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-6 flex items-center gap-2 text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Clock className="w-5 h-5 text-nitebite-yellow" aria-hidden />
          <span className="text-sm sm:text-base">Delivery in 20–30 min</span>
        </motion.div>

        {/* Vibe selector */}
        <motion.div
          className="mt-12 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <VibeSelector />
        </motion.div>

        {/* Call-to-action card */}
        <motion.div
          className="mt-20 bg-gradient-to-br from-nitebite-dark-accent/90 to-nitebite-midnight/90 backdrop-blur-xl border border-nitebite-purple/30 p-8 sm:p-10 rounded-2xl w-full max-w-4xl shadow-lg professional-shadow"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-nitebite-purple/20 rounded-full mb-4 border border-nitebite-purple/30">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-nitebite-yellow">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs font-medium text-nitebite-yellow">Most Popular</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-nitebite-yellow to-nitebite-accent bg-clip-text text-transparent">
                Craft Your Perfect Stash
              </h2>
              <p className="text-sm sm:text-base text-white/80 mb-6 max-w-lg">
                Customize your snack box to your exact cravings, with over 100+ items to choose from. Delivered right to your door in minutes.
              </p>
              <Button
                className="bg-gradient-to-r from-nitebite-yellow to-nitebite-accent text-black font-medium rounded-full py-4 px-8 text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto"
                asChild
              >
                <Link to="/box-builder" aria-label="Customize Your Own Box" className="inline-flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 16V8.00002C20.9996 7.6493 20.9071 7.30483 20.7315 7.00119C20.556 6.69754 20.3037 6.44539 20 6.27002L13 2.27002C12.696 2.09449 12.3511 2.00208 12 2.00208C11.6489 2.00208 11.304 2.09449 11 2.27002L4 6.27002C3.69626 6.44539 3.44398 6.69754 3.26846 7.00119C3.09294 7.30483 3.00036 7.6493 3 8.00002V16C3.00036 16.3508 3.09294 16.6952 3.26846 16.9989C3.44398 17.3025 3.69626 17.5547 4 17.73L11 21.73C11.304 21.9056 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9056 13 21.73L20 17.73C20.3037 17.5547 20.556 17.3025 20.7315 16.9989C20.9071 16.6952 20.9996 16.3508 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.27002 6.96002L12 12L20.73 6.96002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Build Your Custom Box
                </Link>
              </Button>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 relative animate-float">
                <div className="absolute inset-0 bg-gradient-to-br from-nitebite-yellow/20 to-nitebite-accent/20 rounded-full blur-xl"></div>
                <div className="absolute inset-0 flex items-center justify-center text-5xl">🎁</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;


import React from 'react';
import { Package, CheckCircle, Truck, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: <Package className="w-12 h-12 md:w-16 md:h-16 text-nitebite-accent" />,
      title: "Choose Items",
      description: "Browse our menu and select your late-night cravings",
      delay: 0.1
    },
    {
      icon: <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-nitebite-accent" />,
      title: "Confirm Your Order",
      description: "Review your order and proceed to checkout",
      delay: 0.3
    },
    {
      icon: <Truck className="w-12 h-12 md:w-16 md:h-16 text-nitebite-accent" />,
      title: "Fast Delivery",
      description: "Your order arrives at your doorstep in no time",
      delay: 0.5
    },
    {
      icon: <Utensils className="w-12 h-12 md:w-16 md:h-16 text-nitebite-accent" />,
      title: "Enjoy!",
      description: "Satisfy your cravings without leaving home",
      delay: 0.7
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-gradient-to-b from-nitebite-dark to-nitebite-dark-accent overflow-hidden">
      {/* Section heading */}
      <div className="text-center mb-16">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-nitebite-text mb-4"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          How It <span className="text-gradient-accent">Works</span>
        </motion.h2>
        <motion.div 
          className="w-24 h-1 bg-nitebite-accent mx-auto"
          initial={{ width: 0 }}
          whileInView={{ width: 96 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </div>

      {/* Steps container */}
      <div className="page-container">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              variants={itemVariants}
              transition={{ duration: 0.4, delay: step.delay }}
            >
              {/* Step card */}
              <div className="flex flex-col items-center group">
                {/* Circle for the icon */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-nitebite-accent/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300 opacity-70 group-hover:opacity-100 scale-75 group-hover:scale-110"></div>
                  <div className="relative glassmorphic-card rounded-full p-6 mb-4 group-hover:scale-110 transition-all duration-300">
                    {step.icon}
                  </div>
                  
                  {/* Step number */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-nitebite-accent flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                </div>
                
                {/* Connection line to next step (hide for last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 left-[calc(100%_-_32px)] w-[calc(100%_-_64px)] h-0.5 bg-gradient-to-r from-nitebite-accent to-transparent transform -translate-y-1/2"></div>
                )}
                
                {/* Text content */}
                <h3 className="text-xl font-semibold text-nitebite-text mb-2">{step.title}</h3>
                <p className="text-nitebite-text-muted text-center">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Mobile stick figure animation */}
        <div className="mt-16 flex justify-center">
          <motion.div 
            className="relative h-20 w-full max-w-md hidden md:block"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <motion.div 
              className="absolute left-0 w-16 h-16"
              initial={{ x: -50 }}
              whileInView={{ x: "calc(100% - 64px)" }}
              viewport={{ once: true }}
              transition={{ 
                duration: 3, 
                delay: 1,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              {/* Simple stick figure animation */}
              <div className="relative">
                <div className="w-6 h-6 bg-nitebite-accent rounded-full mx-auto"></div>
                <div className="w-0.5 h-6 bg-nitebite-accent mx-auto my-1"></div>
                <div className="flex justify-center space-x-4">
                  <div className="w-0.5 h-8 bg-nitebite-accent transform rotate-12 origin-top"></div>
                  <div className="w-0.5 h-8 bg-nitebite-accent transform -rotate-12 origin-top"></div>
                </div>
                <motion.div 
                  className="absolute -bottom-1 left-0 right-0 flex justify-center space-x-4"
                  animate={{
                    rotate: [0, 15, 0, -15, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <div className="w-0.5 h-6 bg-nitebite-accent transform rotate-12 origin-top"></div>
                  <div className="w-0.5 h-6 bg-nitebite-accent transform -rotate-12 origin-top"></div>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Progress line */}
            <div className="absolute top-8 left-0 w-full h-0.5 bg-gradient-to-r from-nitebite-accent/50 via-nitebite-accent to-nitebite-accent/50"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

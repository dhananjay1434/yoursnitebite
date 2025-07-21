
import React from 'react';
import { Clock } from 'lucide-react';

const DeliveryTimer: React.FC = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full bg-nitebite-accent/20 flex items-center justify-center mr-4">
          <Clock className="w-6 h-6 text-nitebite-accent" />
        </div>
        <div>
          <h3 className="text-nitebite-highlight font-medium">Super Fast Delivery</h3>
          <p className="text-nitebite-text-muted text-sm">Order now for instant dispatch</p>
        </div>
      </div>
      <div className="flex items-center">
        <div className="text-center">
          <span className="block text-3xl font-bold text-nitebite-accent animate-soft-pulse">10</span>
          <span className="text-nitebite-text-muted text-xs">MINS</span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTimer;

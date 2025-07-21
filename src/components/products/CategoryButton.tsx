
import React from 'react';
import { cn } from '@/lib/utils';

interface CategoryProps {
  id: string;
  name: string;
  icon: string;
}

interface CategoryButtonProps {
  category: CategoryProps;
  isSelected: boolean;
  onClick: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ category, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 flex flex-col items-center gap-1 transition-all text-center touch-manipulation",
        isSelected 
          ? "bg-nitebite-dark border-l-2 border-nitebite-accent text-nitebite-highlight" 
          : "text-nitebite-text-muted hover:bg-nitebite-dark/50"
      )}
    >
      <span className="text-2xl mb-1">{category.icon}</span>
      <span className="text-xs line-clamp-1">{category.name}</span>
    </button>
  );
};

export default CategoryButton;


// Helper function to get icon for category
export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'chips': return '🍟';
    case 'drinks': return '🥤';
    case 'coffee': return '☕';
    case 'chocolate': return '🍫';
    case 'biscuits': return '🍪';
    default: return '📦';
  }
}

// New function to safely parse React Three Fiber events
export function handleR3FEvent<T extends Event>(
  event: T, 
  handler: (event: T) => void
): void {
  // Safely prevent event propagation if the method exists
  if ('stopPropagation' in event) {
    event.stopPropagation();
  }
  
  // Call the original handler
  handler(event);
}

// New function to safely get properties to avoid "undefined.lov" errors
export function safeProps(props: Record<string, any>): Record<string, any> {
  // Create a clean copy of props without any data-lov attributes
  const cleanProps = { ...props };
  
  // Remove any data-lov-* attributes that might cause issues
  Object.keys(cleanProps).forEach(key => {
    if (key.startsWith('data-lov')) {
      delete cleanProps[key];
    }
  });
  
  return cleanProps;
}

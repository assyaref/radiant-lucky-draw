import { type ReactNode } from 'react';

interface SafeAreaProps {
  children: ReactNode;
  className?: string;
}

/**
 * TV Safe Area wrapper
 * Ensures no content is closer than 60px to screen edge
 * Prevents clipping on 55", 65", 75" 4K TVs
 */
export function SafeArea({ children, className = '' }: SafeAreaProps) {
  return (
    <div
      className={`safe-area ${className}`}
      style={{
        padding: '60px',
        minHeight: '100vh',
        minWidth: '100vw',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
}

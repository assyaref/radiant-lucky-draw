import { useEffect } from 'react';

/**
 * Accessibility Provider
 * - Large typography via CSS
 * - High contrast mode support
 * - Safe flashing frequency (no animations > 3Hz)
 * - Keyboard navigation for operator mode
 */
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Keyboard navigation for operator mode
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+O to toggle operator mode
      if (e.altKey && e.key === 'o') {
        document.documentElement.classList.toggle('operator-mode');
      }
      // Alt+H for high contrast
      if (e.altKey && e.key === 'h') {
        document.documentElement.classList.toggle('high-contrast');
      }
      // Alt+P to pause animations
      if (e.altKey && e.key === 'p') {
        document.documentElement.classList.toggle('reduce-motion');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <>{children}</>;
}

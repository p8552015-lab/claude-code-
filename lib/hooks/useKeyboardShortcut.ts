import { useEffect } from 'react';

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === key) {
        e.preventDefault();
        callback();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, callback]);
}

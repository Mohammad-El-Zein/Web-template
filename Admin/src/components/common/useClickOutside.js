import { useEffect } from 'react';

// Schließt Menüs bei Klick außerhalb oder Escape
export const useClickOutside = (ref, onClose) => {
  useEffect(() => {
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, onClose]);
};

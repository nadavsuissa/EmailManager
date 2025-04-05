import React, { createContext, useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

type Direction = 'ltr' | 'rtl';

interface DirectionContextType {
  direction: Direction;
  toggleDirection: () => void;
  setDirection: (dir: Direction) => void;
}

// Create the context with a default value
const DirectionContext = createContext<DirectionContextType>({
  direction: 'ltr',
  toggleDirection: () => {},
  setDirection: () => {},
});

// Create caches for both directions
const ltrCache = createCache({
  key: 'muiltr',
  prepend: true,
});

const rtlCache = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
  prepend: true,
});

interface DirectionProviderProps {
  children: React.ReactNode;
}

export const DirectionProvider: React.FC<DirectionProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [direction, setDirection] = useState<Direction>('ltr');

  // Effect to update direction when language changes
  useEffect(() => {
    const isRtl = i18n.language === 'he';
    setDirection(isRtl ? 'rtl' : 'ltr');
    
    // Update document direction
    document.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    document.body.style.textAlign = isRtl ? 'right' : 'left';
  }, [i18n.language]);

  // Toggle direction manually if needed
  const toggleDirection = () => {
    const newDirection = direction === 'ltr' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    document.dir = newDirection;
    document.body.style.textAlign = newDirection === 'rtl' ? 'right' : 'left';
  };

  // Cache provider based on current direction
  const cache = direction === 'rtl' ? rtlCache : ltrCache;

  return (
    <DirectionContext.Provider value={{ direction, toggleDirection, setDirection }}>
      <CacheProvider value={cache}>
        {children}
      </CacheProvider>
    </DirectionContext.Provider>
  );
};

// Hook for easy context usage
export const useDirection = () => useContext(DirectionContext);

export default DirectionContext; 
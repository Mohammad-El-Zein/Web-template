import { createContext, useContext } from 'react';

// Gemeinsamer Zustand aller Website-Seiten (siehe WebsiteLayout)
export const WebsiteContext = createContext(null);

export const useWebsite = () => useContext(WebsiteContext);

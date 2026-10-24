import { createContext, useContext } from 'react';

// Profil des eingeloggten Admins + Abmelden, für alle Seiten verfügbar
export const AdminContext = createContext(null);

export const useAdmin = () => useContext(AdminContext);

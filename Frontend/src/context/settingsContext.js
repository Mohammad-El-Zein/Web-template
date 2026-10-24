import { createContext, useContext } from "react";

// Website-Einstellungen aus /api/settings (siehe SettingsProvider)
export const SettingsContext = createContext(null);

export const useSettings = () => useContext(SettingsContext);

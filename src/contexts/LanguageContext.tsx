import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "kn";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    settings: "Settings",
    locationServices: "Location Services",
    locationServicesDesc: "Enable for better item matching",
    darkMode: "Dark Mode",
    darkModeDesc: "Switch between light and dark theme",
    language: "Language",
    languageDesc: "Select your preferred language",
    privacySettings: "Privacy Settings",
    privacySettingsDesc: "Manage your data and privacy",
    appVersion: "Version 1.0.0",
    logOut: "Log Out",
  },
  kn: {
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    locationServices: "ಸ್ಥಳ ಸೇವೆಗಳು",
    locationServicesDesc: "ಉತ್ತಮ ಐಟಂ ಹೊಂದಾಣಿಕೆಗಾಗಿ ಸಕ್ರಿಯಗೊಳಿಸಿ",
    darkMode: "ಡಾರ್ಕ್ ಮೋಡ್",
    darkModeDesc: "ಬೆಳಕು ಮತ್ತು ಡಾರ್ಕ್ ಥೀಮ್ ನಡುವೆ ಬದಲಾಯಿಸಿ",
    language: "ಭಾಷೆ",
    languageDesc: "ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    privacySettings: "ಗೌಪ್ಯತೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    privacySettingsDesc: "ನಿಮ್ಮ ಡೇಟಾ ಮತ್ತು ಗೌಪ್ಯತೆಯನ್ನು ನಿರ್ವಹಿಸಿ",
    appVersion: "ಆವೃತ್ತಿ 1.0.0",
    logOut: "ಲಾಗ್ ಔಟ್",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

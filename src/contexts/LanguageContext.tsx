import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "kn";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Settings
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

    // Dashboard - Passenger
    welcomeBack: "Welcome back",
    lostSomething: "Lost something? We'll help you find it.",
    reportLostItem: "Report Lost Item",
    activeReports: "Active Reports",
    resolved: "Resolved",
    recentReports: "Recent Reports",
    viewAll: "View All",
    emergencyContacts: "Emergency Contacts",
    quickAccessHelp: "Quick access to help",
    view: "View",

    // Dashboard - Driver
    driverDashboard: "Driver Dashboard",
    online: "Online",
    offline: "Offline",
    totalEarnings: "Total Earnings",
    rating: "Rating",
    reviews: "reviews",
    smartMatch: "Smart Match - Find Item Owner",
    browseLostItems: "Browse Lost Item Reports",

    // My Reports
    myReports: "My Reports",
    newReport: "New Report",
    searchReports: "Search reports...",
    all: "All",
    active: "Active",
    matched: "Matched",
    noReportsFound: "No reports found",
    tryDifferentSearch: "Try a different search term",
    startByReporting: "Start by reporting a lost item",
    noActiveReports: "No active reports",
    noMatchedReports: "No matched reports",
    noResolvedReports: "No resolved reports",
    failedToLoad: "Failed to load reports",
    tryAgain: "Try Again",
    lost: "Lost",
    auto: "Auto",
    noDescription: "No description",

    // Profile
    profile: "Profile",
    verified: "Verified",
    underReview: "Under Review",
    rejected: "Rejected",
    notVerified: "Not Verified",
    driver: "Driver",
    passenger: "Passenger",
    itemsReturned: "Items Returned",
    reportsFiled: "Reports Filed",
    contactInformation: "Contact Information",
    phone: "Phone",
    email: "Email",
    notSet: "Not set",
    verificationStatus: "Verification Status",
    availableReports: "Available Reports",
    rewardsAndTips: "Rewards & Tips",

    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    back: "Back",
    next: "Next",
    submit: "Submit",
    confirm: "Confirm",
    close: "Close",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    refresh: "Refresh",
    
    // Navigation
    home: "Home",
    reports: "Reports",
    chat: "Chat",
    
    // Emergency
    emergency: "Emergency",
    localPolice: "Local Police",
    transportAuthority: "Transport Authority",
    appSupport: "App Support",
  },
  kn: {
    // Settings
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

    // Dashboard - Passenger
    welcomeBack: "ಮರಳಿ ಸ್ವಾಗತ",
    lostSomething: "ಏನಾದರೂ ಕಳೆದುಕೊಂಡಿರಾ? ನಾವು ಹುಡುಕಲು ಸಹಾಯ ಮಾಡುತ್ತೇವೆ.",
    reportLostItem: "ಕಳೆದ ವಸ್ತು ವರದಿ ಮಾಡಿ",
    activeReports: "ಸಕ್ರಿಯ ವರದಿಗಳು",
    resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
    recentReports: "ಇತ್ತೀಚಿನ ವರದಿಗಳು",
    viewAll: "ಎಲ್ಲವನ್ನೂ ನೋಡಿ",
    emergencyContacts: "ತುರ್ತು ಸಂಪರ್ಕಗಳು",
    quickAccessHelp: "ಸಹಾಯಕ್ಕೆ ತ್ವರಿತ ಪ್ರವೇಶ",
    view: "ನೋಡಿ",

    // Dashboard - Driver
    driverDashboard: "ಚಾಲಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    online: "ಆನ್‌ಲೈನ್",
    offline: "ಆಫ್‌ಲೈನ್",
    totalEarnings: "ಒಟ್ಟು ಗಳಿಕೆ",
    rating: "ರೇಟಿಂಗ್",
    reviews: "ವಿಮರ್ಶೆಗಳು",
    smartMatch: "ಸ್ಮಾರ್ಟ್ ಮ್ಯಾಚ್ - ಮಾಲೀಕರನ್ನು ಹುಡುಕಿ",
    browseLostItems: "ಕಳೆದ ವಸ್ತು ವರದಿಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ",

    // My Reports
    myReports: "ನನ್ನ ವರದಿಗಳು",
    newReport: "ಹೊಸ ವರದಿ",
    searchReports: "ವರದಿಗಳನ್ನು ಹುಡುಕಿ...",
    all: "ಎಲ್ಲಾ",
    active: "ಸಕ್ರಿಯ",
    matched: "ಹೊಂದಾಣಿಕೆಯಾಗಿದೆ",
    noReportsFound: "ಯಾವುದೇ ವರದಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    tryDifferentSearch: "ಬೇರೆ ಹುಡುಕಾಟ ಪದವನ್ನು ಪ್ರಯತ್ನಿಸಿ",
    startByReporting: "ಕಳೆದ ವಸ್ತುವನ್ನು ವರದಿ ಮಾಡುವ ಮೂಲಕ ಪ್ರಾರಂಭಿಸಿ",
    noActiveReports: "ಯಾವುದೇ ಸಕ್ರಿಯ ವರದಿಗಳಿಲ್ಲ",
    noMatchedReports: "ಯಾವುದೇ ಹೊಂದಾಣಿಕೆಯ ವರದಿಗಳಿಲ್ಲ",
    noResolvedReports: "ಯಾವುದೇ ಪರಿಹರಿಸಿದ ವರದಿಗಳಿಲ್ಲ",
    failedToLoad: "ವರದಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ",
    tryAgain: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    lost: "ಕಳೆದುಹೋಯಿತು",
    auto: "ಆಟೋ",
    noDescription: "ವಿವರಣೆ ಇಲ್ಲ",

    // Profile
    profile: "ಪ್ರೊಫೈಲ್",
    verified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    underReview: "ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ",
    rejected: "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
    notVerified: "ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ",
    driver: "ಚಾಲಕ",
    passenger: "ಪ್ರಯಾಣಿಕ",
    itemsReturned: "ಹಿಂದಿರುಗಿಸಿದ ವಸ್ತುಗಳು",
    reportsFiled: "ಸಲ್ಲಿಸಿದ ವರದಿಗಳು",
    contactInformation: "ಸಂಪರ್ಕ ಮಾಹಿತಿ",
    phone: "ಫೋನ್",
    email: "ಇಮೇಲ್",
    notSet: "ಹೊಂದಿಸಲಾಗಿಲ್ಲ",
    verificationStatus: "ಪರಿಶೀಲನೆ ಸ್ಥಿತಿ",
    availableReports: "ಲಭ್ಯವಿರುವ ವರದಿಗಳು",
    rewardsAndTips: "ಬಹುಮಾನಗಳು ಮತ್ತು ಟಿಪ್ಸ್",

    // Common
    loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    error: "ದೋಷ",
    success: "ಯಶಸ್ಸು",
    cancel: "ರದ್ದುಮಾಡಿ",
    save: "ಉಳಿಸಿ",
    delete: "ಅಳಿಸಿ",
    edit: "ಸಂಪಾದಿಸಿ",
    back: "ಹಿಂದೆ",
    next: "ಮುಂದೆ",
    submit: "ಸಲ್ಲಿಸಿ",
    confirm: "ದೃಢೀಕರಿಸಿ",
    close: "ಮುಚ್ಚಿ",
    search: "ಹುಡುಕಿ",
    filter: "ಫಿಲ್ಟರ್",
    sort: "ವಿಂಗಡಿಸಿ",
    refresh: "ರಿಫ್ರೆಶ್",
    
    // Navigation
    home: "ಮುಖಪುಟ",
    reports: "ವರದಿಗಳು",
    chat: "ಚಾಟ್",
    
    // Emergency
    emergency: "ತುರ್ತು",
    localPolice: "ಸ್ಥಳೀಯ ಪೊಲೀಸ್",
    transportAuthority: "ಸಾರಿಗೆ ಪ್ರಾಧಿಕಾರ",
    appSupport: "ಅಪ್ಲಿಕೇಶನ್ ಬೆಂಬಲ",
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

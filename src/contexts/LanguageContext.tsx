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
    saveDraft: "Save Draft",
    submitReport: "Submit Report",
    step: "Step",
    of: "of",
    
    // Navigation
    home: "Home",
    reports: "Reports",
    chat: "Chat",
    messages: "Messages",
    
    // Report Item Form
    reportItemTitle: "Report Lost Item",
    itemDetails: "Item Details",
    itemDetailsDesc: "Tell us about the item you lost",
    locationTime: "Location & Time",
    locationTimeDesc: "When and where did you lose it?",
    autoDetails: "Auto Details",
    autoDetailsDesc: "Information about the auto-rickshaw",
    photos: "Photos",
    photosDesc: "Add photos of your item (optional)",
    category: "Category",
    selectCategory: "Select a category",
    itemTitle: "Item Title",
    itemTitlePlaceholder: "e.g., Black leather wallet",
    description: "Description",
    descriptionPlaceholder: "Describe your item in detail...",
    lostDate: "Lost Date",
    selectDate: "Select date",
    lostLocation: "Lost Location",
    lostLocationPlaceholder: "Enter address or landmark",
    autoNumber: "Auto Number",
    autoNumberPlaceholder: "e.g., KA-01-1234",
    routeDescription: "Route Description",
    routePlaceholder: "e.g., From MG Road to Koramangala",
    driverDescription: "Driver Description",
    driverPlaceholder: "Any details about the driver...",
    uploadPhotos: "Upload Photos",
    dragDropPhotos: "Drag & drop photos here, or click to select",
    maxPhotos: "Maximum 5 photos",
    fillRequiredFields: "Please fill in at least item category, title, and date",
    
    // Emergency
    emergency: "Emergency",
    emergencyContactsTitle: "Emergency Contacts",
    immeditateDanger: "If you're in immediate danger, call",
    forPoliceAssistance: "for police assistance.",
    policeEmergency: "Police Emergency",
    forImmediatePolice: "For immediate police assistance",
    womenHelpline: "Women Helpline",
    womenHelplineDesc: "24/7 women safety helpline",
    transportAuthorityDesc: "Regional Transport Office helpline",
    autoConnectSupport: "AutoConnect Support",
    autoConnectSupportDesc: "24/7 app support (toll-free)",
    safetyTips: "Safety Tips",
    safetyTip1: "Always meet in public, well-lit places when retrieving items",
    safetyTip2: "Verify the driver's identity through the app before meeting",
    safetyTip3: "Share your live location with a trusted contact",
    safetyTip4: "Report any suspicious behavior immediately",
    callPolice: "Call Police (100)",
    
    // Chat & Conversations
    conversationNotFound: "Conversation not found",
    backToConversations: "Back to conversations",
    conversationAbout: "Conversation about:",
    noMessagesYet: "No messages yet",
    startConversation: "Start the conversation!",
    typeMessage: "Type a message...",
    viewReport: "View Report",
    reportIssue: "Report Issue",
    sharedLocation: "Shared location",
    sharedImage: "Shared image",
    noConversationsYet: "No conversations yet",
    driverRespondPrompt: "Respond to a lost item report to start a conversation",
    passengerWaitPrompt: "When a driver responds to your report, you'll see it here",
    activeConversations: "Active",
    resolvedConversations: "Resolved",
    noMessagesPreview: "No messages yet",
    photoPreview: "📷 Photo",
    locationPreview: "📍 Location",
    today: "Today",
    yesterday: "Yesterday",
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
    saveDraft: "ಡ್ರಾಫ್ಟ್ ಉಳಿಸಿ",
    submitReport: "ವರದಿ ಸಲ್ಲಿಸಿ",
    step: "ಹಂತ",
    of: "ರಲ್ಲಿ",
    
    // Navigation
    home: "ಮುಖಪುಟ",
    reports: "ವರದಿಗಳು",
    chat: "ಚಾಟ್",
    messages: "ಸಂದೇಶಗಳು",
    
    // Report Item Form
    reportItemTitle: "ಕಳೆದ ವಸ್ತು ವರದಿ ಮಾಡಿ",
    itemDetails: "ವಸ್ತುವಿನ ವಿವರಗಳು",
    itemDetailsDesc: "ನೀವು ಕಳೆದುಕೊಂಡ ವಸ್ತುವಿನ ಬಗ್ಗೆ ಹೇಳಿ",
    locationTime: "ಸ್ಥಳ ಮತ್ತು ಸಮಯ",
    locationTimeDesc: "ನೀವು ಎಲ್ಲಿ ಮತ್ತು ಯಾವಾಗ ಕಳೆದುಕೊಂಡಿರಿ?",
    autoDetails: "ಆಟೋ ವಿವರಗಳು",
    autoDetailsDesc: "ಆಟೋ-ರಿಕ್ಷಾ ಬಗ್ಗೆ ಮಾಹಿತಿ",
    photos: "ಫೋಟೋಗಳು",
    photosDesc: "ನಿಮ್ಮ ವಸ್ತುವಿನ ಫೋಟೋಗಳನ್ನು ಸೇರಿಸಿ (ಐಚ್ಛಿಕ)",
    category: "ವರ್ಗ",
    selectCategory: "ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    itemTitle: "ವಸ್ತುವಿನ ಹೆಸರು",
    itemTitlePlaceholder: "ಉದಾ: ಕಪ್ಪು ಚರ್ಮದ ಪರ್ಸ್",
    description: "ವಿವರಣೆ",
    descriptionPlaceholder: "ನಿಮ್ಮ ವಸ್ತುವನ್ನು ವಿವರವಾಗಿ ವಿವರಿಸಿ...",
    lostDate: "ಕಳೆದ ದಿನಾಂಕ",
    selectDate: "ದಿನಾಂಕ ಆಯ್ಕೆಮಾಡಿ",
    lostLocation: "ಕಳೆದ ಸ್ಥಳ",
    lostLocationPlaceholder: "ವಿಳಾಸ ಅಥವಾ ಹೆಗ್ಗುರುತು ನಮೂದಿಸಿ",
    autoNumber: "ಆಟೋ ನಂಬರ್",
    autoNumberPlaceholder: "ಉದಾ: KA-01-1234",
    routeDescription: "ಮಾರ್ಗ ವಿವರಣೆ",
    routePlaceholder: "ಉದಾ: MG ರಸ್ತೆಯಿಂದ ಕೋರಮಂಗಲಕ್ಕೆ",
    driverDescription: "ಚಾಲಕ ವಿವರಣೆ",
    driverPlaceholder: "ಚಾಲಕರ ಬಗ್ಗೆ ಯಾವುದೇ ವಿವರಗಳು...",
    uploadPhotos: "ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    dragDropPhotos: "ಫೋಟೋಗಳನ್ನು ಇಲ್ಲಿ ಡ್ರ್ಯಾಗ್ & ಡ್ರಾಪ್ ಮಾಡಿ ಅಥವಾ ಆಯ್ಕೆ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ",
    maxPhotos: "ಗರಿಷ್ಠ 5 ಫೋಟೋಗಳು",
    fillRequiredFields: "ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ವಸ್ತು ವರ್ಗ, ಹೆಸರು ಮತ್ತು ದಿನಾಂಕವನ್ನು ಭರ್ತಿ ಮಾಡಿ",
    
    // Emergency
    emergency: "ತುರ್ತು",
    emergencyContactsTitle: "ತುರ್ತು ಸಂಪರ್ಕಗಳು",
    immeditateDanger: "ನೀವು ತಕ್ಷಣದ ಅಪಾಯದಲ್ಲಿದ್ದರೆ, ಕರೆ ಮಾಡಿ",
    forPoliceAssistance: "ಪೊಲೀಸ್ ಸಹಾಯಕ್ಕಾಗಿ.",
    policeEmergency: "ಪೊಲೀಸ್ ತುರ್ತು",
    forImmediatePolice: "ತಕ್ಷಣದ ಪೊಲೀಸ್ ಸಹಾಯಕ್ಕಾಗಿ",
    womenHelpline: "ಮಹಿಳಾ ಸಹಾಯವಾಣಿ",
    womenHelplineDesc: "24/7 ಮಹಿಳಾ ಸುರಕ್ಷತೆ ಸಹಾಯವಾಣಿ",
    transportAuthorityDesc: "ಪ್ರಾದೇಶಿಕ ಸಾರಿಗೆ ಕಚೇರಿ ಸಹಾಯವಾಣಿ",
    autoConnectSupport: "ಆಟೋಕನೆಕ್ಟ್ ಬೆಂಬಲ",
    autoConnectSupportDesc: "24/7 ಅಪ್ಲಿಕೇಶನ್ ಬೆಂಬಲ (ಟೋಲ್-ಫ್ರೀ)",
    safetyTips: "ಸುರಕ್ಷತಾ ಸಲಹೆಗಳು",
    safetyTip1: "ವಸ್ತುಗಳನ್ನು ಹಿಂಪಡೆಯುವಾಗ ಯಾವಾಗಲೂ ಸಾರ್ವಜನಿಕ, ಚೆನ್ನಾಗಿ ಬೆಳಕು ಇರುವ ಸ್ಥಳಗಳಲ್ಲಿ ಭೇಟಿಯಾಗಿ",
    safetyTip2: "ಭೇಟಿಯಾಗುವ ಮೊದಲು ಅಪ್ಲಿಕೇಶನ್ ಮೂಲಕ ಚಾಲಕರ ಗುರುತನ್ನು ಪರಿಶೀಲಿಸಿ",
    safetyTip3: "ನಿಮ್ಮ ನೇರ ಸ್ಥಳವನ್ನು ವಿಶ್ವಾಸಾರ್ಹ ಸಂಪರ್ಕದೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ",
    safetyTip4: "ಯಾವುದೇ ಅನುಮಾನಾಸ್ಪದ ನಡವಳಿಕೆಯನ್ನು ತಕ್ಷಣ ವರದಿ ಮಾಡಿ",
    callPolice: "ಪೊಲೀಸ್‌ಗೆ ಕರೆ ಮಾಡಿ (100)",
    
    // Chat & Conversations
    conversationNotFound: "ಸಂಭಾಷಣೆ ಕಂಡುಬಂದಿಲ್ಲ",
    backToConversations: "ಸಂಭಾಷಣೆಗಳಿಗೆ ಹಿಂತಿರುಗಿ",
    conversationAbout: "ಇದರ ಬಗ್ಗೆ ಸಂಭಾಷಣೆ:",
    noMessagesYet: "ಇನ್ನೂ ಸಂದೇಶಗಳಿಲ್ಲ",
    startConversation: "ಸಂಭಾಷಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ!",
    typeMessage: "ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ...",
    viewReport: "ವರದಿ ನೋಡಿ",
    reportIssue: "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
    sharedLocation: "ಸ್ಥಳ ಹಂಚಲಾಗಿದೆ",
    sharedImage: "ಚಿತ್ರ ಹಂಚಲಾಗಿದೆ",
    noConversationsYet: "ಇನ್ನೂ ಸಂಭಾಷಣೆಗಳಿಲ್ಲ",
    driverRespondPrompt: "ಸಂಭಾಷಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಲು ಕಳೆದ ವಸ್ತು ವರದಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಿ",
    passengerWaitPrompt: "ಚಾಲಕರು ನಿಮ್ಮ ವರದಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಿದಾಗ ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತದೆ",
    activeConversations: "ಸಕ್ರಿಯ",
    resolvedConversations: "ಪರಿಹರಿಸಲಾಗಿದೆ",
    noMessagesPreview: "ಇನ್ನೂ ಸಂದೇಶಗಳಿಲ್ಲ",
    photoPreview: "📷 ಫೋಟೋ",
    locationPreview: "📍 ಸ್ಥಳ",
    today: "ಇಂದು",
    yesterday: "ನಿನ್ನೆ",
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

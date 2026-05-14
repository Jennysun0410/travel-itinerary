'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Locale = 'zh-Hant' | 'en';

export const translations = {
  'zh-Hant': {
    brand: '旅行行程',
    navTrips: '我的行程',
    navInbox: '待整理行程',
    settings: '設定',
    labelDisplayName: '稱呼',
    labelConnectedEmail: '連結信箱',
    labelLanguage: '介面語言',
    phDisplayName: '要如何稱呼你',
    btnSave: '儲存',
    savedHint: '已儲存',
    greet: '嗨，{name}',
    newTrip: '+ 新增行程',
    pageTitle: '我的行程',
    pageSub: '飛機、住宿、票券等來自不同渠道的訂單，可收斂在同一趟旅程底下檢視與規劃。',
    searchPlaceholder: '搜尋行程名稱或目的地…',
    filterAll: '全部',
    filterUpcoming: '即將出發',
    filterPast: '已結束',
    badgeSoon: '即將出發',
    chFlight: '航班',
    chStay: '住宿',
    chTicket: '門票',
    emptyTitle: '還沒有行程',
    emptyDesc: '建立一趟旅程後，即可把各渠道的訂單或確認信關聯進來，在單一時間軸檢視。',
    emptyCta: '建立第一趟行程',
    langZh: '繁體中文',
    langEn: 'English',
    openMenu: '開啟選單',
    help: '說明',
    orders: '訂單',
    timeline: '時間軸',
    members: '成員',
    backToTrips: '← 我的行程',
    noEmailConnected: '尚未連結',
    manageEmail: '管理信箱',
  },
  en: {
    brand: 'Travel Itinerary',
    navTrips: 'My trips',
    navInbox: 'Inbox',
    settings: 'Settings',
    labelDisplayName: 'Display name',
    labelConnectedEmail: 'Connected email',
    labelLanguage: 'Language',
    phDisplayName: 'What should we call you?',
    btnSave: 'Save',
    savedHint: 'Saved',
    greet: 'Hi, {name}',
    newTrip: '+ New trip',
    pageTitle: 'My trips',
    pageSub: 'Flights, stays, tickets from different channels — pull them into one trip to plan in one place.',
    searchPlaceholder: 'Search trip name or destination…',
    filterAll: 'All',
    filterUpcoming: 'Upcoming',
    filterPast: 'Past',
    badgeSoon: 'Soon',
    chFlight: 'Flights',
    chStay: 'Stays',
    chTicket: 'Tickets',
    emptyTitle: 'No trips yet',
    emptyDesc: 'Create a trip, then attach bookings or confirmations from any channel and view them on one timeline.',
    emptyCta: 'Create your first trip',
    langZh: '繁體中文',
    langEn: 'English',
    openMenu: 'Open menu',
    help: 'Help',
    orders: 'Orders',
    timeline: 'Timeline',
    members: 'Members',
    backToTrips: '← My trips',
    noEmailConnected: 'Not connected',
    manageEmail: 'Manage',
  },
} as const;

export type TranslationKey = keyof typeof translations['zh-Hant'];

interface I18nContextValue {
  locale: Locale;
  t: (key: TranslationKey) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh-Hant');

  useEffect(() => {
    const saved = localStorage.getItem('ti_locale');
    if (saved === 'en' || saved === 'zh-Hant') setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('ti_locale', l);
  };

  const t = (key: TranslationKey): string => translations[locale][key] as string;

  return <I18nContext.Provider value={{ locale, t, setLocale }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

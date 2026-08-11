import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Language scaffold.
 *
 * The selection is real and persisted, and `t()` resolves through the tables
 * below. Only the strings that have been translated are listed — everything
 * else falls back to English rather than rendering a key, so an untranslated
 * screen degrades to readable English instead of `nav.dashboard`.
 *
 * Adding a language is a new entry in `LANGUAGES` plus a table in `STRINGS`.
 */
export type Lang = "en" | "ru" | "uz";

export const LANGUAGES: Array<{ code: Lang; label: string; english: string }> = [
  { code: "en", label: "English", english: "English" },
  { code: "ru", label: "Русский", english: "Russian" },
  { code: "uz", label: "O‘zbek", english: "Uzbek" },
];

type Table = Record<string, string>;

const STRINGS: Record<Lang, Table> = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.communities": "Communities",
    "nav.challenges": "Challenges",
    "nav.library": "Library",
    "nav.profile": "Profile",
    "nav.settings": "Settings",
    "nav.logout": "Log out",
    "nav.premium": "Go Premium",
    "library.title": "Library",
    "library.books": "Books",
    "library.videos": "Videos",
    "library.saved": "Saved",
    "library.search": "Search the whole library…",
    "library.filter": "Filter",
    "library.clear": "Clear all",
    "library.year": "Year",
    "library.allYears": "All years",
    "common.open": "Open",
    "common.read": "Read",
    "common.watch": "Watch",
    "common.save": "Save",
    "common.saved": "Saved",
    "settings.language": "Language",
  },
  ru: {
    "nav.dashboard": "Панель",
    "nav.communities": "Сообщества",
    "nav.challenges": "Испытания",
    "nav.library": "Библиотека",
    "nav.profile": "Профиль",
    "nav.settings": "Настройки",
    "nav.logout": "Выйти",
    "nav.premium": "Премиум",
    "library.title": "Библиотека",
    "library.books": "Книги",
    "library.videos": "Видео",
    "library.saved": "Сохранённое",
    "library.search": "Поиск по библиотеке…",
    "library.filter": "Фильтр",
    "library.clear": "Сбросить",
    "library.year": "Год",
    "library.allYears": "Все годы",
    "common.open": "Открыть",
    "common.read": "Читать",
    "common.watch": "Смотреть",
    "common.save": "Сохранить",
    "common.saved": "Сохранено",
    "settings.language": "Язык",
  },
  uz: {
    "nav.dashboard": "Boshqaruv",
    "nav.communities": "Hamjamiyatlar",
    "nav.challenges": "Sinovlar",
    "nav.library": "Kutubxona",
    "nav.profile": "Profil",
    "nav.settings": "Sozlamalar",
    "nav.logout": "Chiqish",
    "nav.premium": "Premium",
    "library.title": "Kutubxona",
    "library.books": "Kitoblar",
    "library.videos": "Videolar",
    "library.saved": "Saqlangan",
    "library.search": "Kutubxonadan qidirish…",
    "library.filter": "Filtr",
    "library.clear": "Tozalash",
    "library.year": "Yil",
    "library.allYears": "Barcha yillar",
    "common.open": "Ochish",
    "common.read": "O‘qish",
    "common.watch": "Ko‘rish",
    "common.save": "Saqlash",
    "common.saved": "Saqlangan",
    "settings.language": "Til",
  },
};

const KEY = "medly.lang";

export function readLang(): Lang {
  try {
    const stored = localStorage.getItem(KEY) as Lang | null;
    if (stored && LANGUAGES.some((item) => item.code === stored)) return stored;
  } catch {
    /* private browsing */
  }
  return "en";
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (next: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key, fallback) => fallback ?? STRINGS.en[key] ?? key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private browsing — the choice simply does not persist */
    }
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) =>
      STRINGS[lang][key] ?? STRINGS.en[key] ?? fallback ?? key,
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

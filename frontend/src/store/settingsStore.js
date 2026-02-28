import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
    persist(
        (set) => ({
            theme: 'Dark Mode',
            language: 'English',
            units: 'Metric',

            setTheme: (theme) => set({ theme }),
            setLanguage: (lang) => set({ language: lang }),
            setUnits: (units) => set({ units })
        }),
        {
            name: 'arogya-settings'
        }
    )
)

import { translations } from '../i18n/translations'

export function useTranslation() {
    const { language } = useSettingsStore()

    const getLangCode = () => {
        if (language === 'Hindi (हिंदी)') return 'hi'
        if (language === 'Telugu (తెలుగు)') return 'te'
        return 'en'
    }

    const t = (key) => {
        const langCode = getLangCode()
        return translations[key]?.[langCode] || translations[key]?.['en'] || key
    }

    return { t, language }
}

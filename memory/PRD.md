# İslami Yaşam Asistanı - PRD

## Problem Statement
Comprehensive Digital Islamic Life and Knowledge Assistant as a mobile-first web application.
Supports multiple languages (TR/EN/AR), international prayer times, Quran reading with tafsir, and more.

## Architecture
- **Frontend**: React 18 + TailwindCSS (mobile-first, max-width 430px)
- **Backend**: Python/FastAPI
- **Database**: MongoDB (sessions, tafsir cache, bookmarks)
- **Data**: Local JSON for Quran (AR/TR/EN), Hadith, Quiz
- **Audio**: alquran.cloud API (Arabic recitation), YouTube embeds (Turkish meal)
- **AI**: Anthropic Claude via Emergent LLM Key (chat, scholars, tafsir generation)

## Core Features
1. **Dashboard**: Prayer times, daily verse, feature navigation
2. **Prayer Times**: 81 Turkish provinces + 25 international cities, 6 prayer times, Qibla direction
3. **Quran Reader**: 114 surahs, Arabic + Turkish, verse audio, 8 reciters
4. **Tafsir System**: İbn Kesir, Taberi, Elmalılı Hamdi Yazır, Fahreddin Razi - AI-generated cached in MongoDB
5. **Turkish Meal Audio**: Mazlum Kiper YouTube (30 cüz)
6. **Hadith Browser**: 9 categories, Arabic/Turkish/source
7. **AI Islamic Advisor**: Chat with session management
8. **Scholar Perspectives**: 7 Islamic scholars Q&A
9. **Quiz System**: Categories, scoring, animated results
10. **i18n**: Full TR/EN/AR language support with language-based default countries
11. **Settings**: Language, city (106 cities), Qibla direction

## Preview URL
https://quranic-login-1.preview.emergentagent.com

## Backlog
- P1: Enhanced audio player (background play, playlist mode)
- P2: Quiz animations (Lottie)
- P2: Offline caching
- P3: More hadith data
- P3: User registration
- P3: Push notifications for prayer times

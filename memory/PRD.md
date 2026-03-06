# İslami Yaşam Asistanı - PRD

## Problem Statement
Build a comprehensive Digital Islamic Life and Knowledge Assistant as a mobile-first web application.
The app provides Quran reading (Arabic + Turkish meal), prayer times, hadith browsing, AI-powered Islamic advice, scholar perspectives, and quizzes.

## Architecture
- **Frontend**: React 18 + TailwindCSS (mobile-first, max-width 430px)
- **Backend**: Python/FastAPI (monolithic server.py)
- **Database**: MongoDB (for user sessions, bookmarks)
- **Data**: Local JSON files for Quran (Arabic, Turkish, English), Hadith, Quiz data
- **Audio**: alquran.cloud API for Arabic recitation, YouTube embeds for Turkish meal

## Core Features (Implemented)
1. **Dashboard**: Prayer times (15 Turkish cities), daily random verse, feature cards
2. **Quran Reader**: 114 surahs with full Arabic text + Turkish translation, verse-by-verse audio playback, 8 reciters, full surah playback
3. **Turkish Meal Audio**: Mazlum Kiper's YouTube recordings (30 cüz, mapped to surahs)
4. **Hadith Browser**: 9 categories, 10+ hadiths with Arabic/Turkish/source/explanation
5. **AI Islamic Advisor**: Chat interface with session management (Anthropic Claude)
6. **Scholar Perspectives**: 7 Islamic scholars with specialty-based Q&A
7. **Quiz System**: Solo quiz with categories, scoring, progress tracking
8. **Settings**: City selection, user info, Qibla direction
9. **Guest Authentication**: Auto guest login with session cookies

## Data Sources
- Quran Arabic: api.alquran.cloud (cached to quran_arabic.json)
- Quran Turkish: api.alquran.cloud (cached to quran_turkish.json)
- Audio: cdn.islamic.network/quran/audio/
- Turkish Meal: YouTube (Kuranmeali7 channel, Mazlum Kiper playlist)
- Prayer times: Calculated by backend for 15 cities

## Key Endpoints
- GET /api/quran/surahs - 114 surahs with Turkish names
- GET /api/quran/surah/{n} - Full surah with verses and audio
- GET /api/quran/surah/{n}/meal-video - Mazlum Kiper YouTube video
- GET /api/quran/meal-audio - All 30 juz YouTube videos
- GET /api/prayer-times/{city} - Prayer times
- POST /api/ai/chat - AI Islamic advisor
- POST /api/scholars/ask - Scholar Q&A
- GET/POST /api/quiz/* - Quiz system

## Preview URL
https://deen-companion-38.preview.emergentagent.com

## What's Been Implemented (Feb 2026)
- Complete React web frontend (rebuilt from Expo)
- All 114 surah Turkish names & meanings
- Mazlum Kiper YouTube meal audio (30 cüz)
- Full Quran reader with audio playback
- Dashboard with prayer times
- All 7 pages functional and tested

## Backlog
- P1: Full language switching (TR/EN/AR)
- P1: Audio player improvements (background play, playlist mode)
- P2: Quiz UI animations
- P2: Offline data caching
- P3: More hadith data
- P3: Comparative religions feature

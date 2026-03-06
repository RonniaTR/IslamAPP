# İslami Yaşam Asistanı - Changelog

## 2026-03-06 - Complete Web App Rebuild
- Rebuilt entire frontend from Expo/React Native to React web (mobile-first)
- Created 8 pages: Dashboard, Quran List, Surah Detail, Hadith, AI Chat, Scholars, Quiz, Settings
- Added full Turkish surah names and meanings for all 114 surahs
- Integrated Mazlum Kiper's YouTube Quran meal audio (30 cüz)
- Added meal audio browsing page with YouTube embeds
- Fixed MongoDB ObjectId serialization in guest auth
- Set up proper nginx reverse proxy for K8s ingress
- All backend API endpoints tested and passing (15/15)
- All frontend pages tested on mobile viewport (390x844)

# İslami Yaşam Asistanı - PRD

## Architecture
- Frontend: React 18 + TailwindCSS (mobile-first 430px)
- Backend: Python/FastAPI
- Database: MongoDB
- TTS: OpenAI TTS HD (onyx male voice) via Emergent LLM Key
- AI: Anthropic Claude via Emergent LLM Key
- Auth: Emergent Google OAuth + Guest Login

## Design: Dark green (#0A1F14) + Gold (#D4AF37) + Cream (#F5F5DC)

## Keşfet Screen (10 Sections)
1. Mood: 4 horizontal scroll cards → ayet + hadis + dua (TTS + Share)
2. Günün Ayeti: Arabic + Turkish + TTS (male voice) + Share
3. Günün Hadisi: Arabic + Turkish + TTS + Share
4. İslam Bilgi Hazinesi: 8 categories, 108+ items, huge cards, shuffled each visit, Dinle + Paylaş per item
5. Zikir Sayacı: 8 dhikr types, tap counter
6. Günlük İbadet Takibi: 4 checkboxes, MongoDB persistence
7. Ramazan Mini: İftar countdown
8. Namaz Vakitleri: 6 prayer times
9. Hocaya Sor: 12 scholars CTA
10. Sesli Komut: Mic button, Web Speech API

## Knowledge Card Categories (108+ items)
- İslam Tarihinde Bugün (14)
- Peygamberlerden Hikmet (14)
- İslam Bilgi Serisi (18)
- Sahabe Hayatı (14)
- İslam Ahlakı ve Edep (12)
- Kur'an Mucizeleri (12)
- İslam Medeniyeti (12)
- Tasavvuf ve Hikmet (12)

## 12 Turkish Scholars
Nihat Hatipoğlu, Hayrettin Karaman, Mustafa İslamoğlu, Diyanet, Ömer Nasuhi Bilmen, Elmalılı Hamdi Yazır, Said Nursi, Mehmet Okuyan, Süleyman Ateş, Yaşar Nuri Öztürk, Cübbeli Ahmet, Ali Erbaş

## API Endpoints
- POST /api/tts — OpenAI TTS HD, onyx voice, mp3 base64
- GET /api/mood/{id} — Random mood content
- GET /api/knowledge-cards — 8 categories
- GET /api/knowledge-cards/{id} — Card detail
- GET /api/dhikr — 8 dhikr items
- POST /api/worship/track — Track daily worship
- GET /api/worship/today — Today's tracking
- GET /api/scholars — 12 scholars

## Completed (2026-03-08)
- [x] OpenAI TTS HD (onyx male voice) for verse, hadith, mood, knowledge items
- [x] 108+ Islamic knowledge items across 8 categories
- [x] Mood cards horizontal scroll with TTS + Share
- [x] Hadith TTS + Share
- [x] Knowledge cards HUGE with shuffle + share + TTS
- [x] All previous features maintained

## Backlog
- P1: Enhanced Quran audio player
- P2: Quran keyword search
- P2: Offline caching

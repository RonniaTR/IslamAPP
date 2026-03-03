from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date, timedelta
import math
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ===================== LOAD QURAN DATA =====================
QURAN_ARABIC = None
QURAN_TURKISH = None

def load_quran_data():
    global QURAN_ARABIC, QURAN_TURKISH
    try:
        arabic_path = ROOT_DIR / 'data' / 'quran_arabic.json'
        turkish_path = ROOT_DIR / 'data' / 'quran_turkish.json'
        
        if arabic_path.exists():
            with open(arabic_path, 'r', encoding='utf-8') as f:
                QURAN_ARABIC = json.load(f)['data']['surahs']
        
        if turkish_path.exists():
            with open(turkish_path, 'r', encoding='utf-8') as f:
                QURAN_TURKISH = json.load(f)['data']['surahs']
        
        print(f"Loaded Quran data: {len(QURAN_ARABIC) if QURAN_ARABIC else 0} surahs")
    except Exception as e:
        print(f"Error loading Quran data: {e}")

load_quran_data()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# City Model
class City(BaseModel):
    id: str
    name: str
    country: str
    latitude: float
    longitude: float
    timezone: str
    qibla_direction: float

# Prayer Times
class PrayerTimes(BaseModel):
    city_id: str
    date: str
    fajr: str
    sunrise: str
    dhuhr: str
    asr: str
    maghrib: str
    isha: str

# AI Chat
class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

# Hocaların Görüşü - Scholar Persona Request
class ScholarRequest(BaseModel):
    session_id: str
    question: str
    scholar_id: str

class ScholarResponse(BaseModel):
    response: str
    scholar_name: str
    sources: List[str]

# Pomodoro Session
class PomodoroSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    topic: str
    duration_minutes: int
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PomodoroCreate(BaseModel):
    user_id: str
    topic: str
    duration_minutes: int

class PomodoroUpdate(BaseModel):
    completed: bool

# User Preferences
class UserPreferences(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    city_id: str = "istanbul"
    madhab: str = "hanafi"
    language: str = "tr"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserPreferencesCreate(BaseModel):
    user_id: str
    city_id: str = "istanbul"
    madhab: str = "hanafi"
    language: str = "tr"

# Gamification Models
class UserStats(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    total_points: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    quran_pages_read: int = 0
    hadith_read: int = 0
    pomodoro_minutes: int = 0
    last_activity_date: str = ""
    badges: List[str] = []
    level: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ActivityLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    activity_type: str  # "quran_read", "hadith_read", "pomodoro", "prayer", "chat"
    points_earned: int
    details: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ActivityCreate(BaseModel):
    user_id: str
    activity_type: str
    details: str = ""

# ===================== TURKISH CITIES DATA =====================

TURKISH_CITIES = [
    {"id": "istanbul", "name": "İstanbul", "country": "Türkiye", "latitude": 41.0082, "longitude": 28.9784, "timezone": "Europe/Istanbul", "qibla_direction": 149.67},
    {"id": "ankara", "name": "Ankara", "country": "Türkiye", "latitude": 39.9334, "longitude": 32.8597, "timezone": "Europe/Istanbul", "qibla_direction": 152.47},
    {"id": "izmir", "name": "İzmir", "country": "Türkiye", "latitude": 38.4192, "longitude": 27.1287, "timezone": "Europe/Istanbul", "qibla_direction": 145.23},
    {"id": "bursa", "name": "Bursa", "country": "Türkiye", "latitude": 40.1885, "longitude": 29.0610, "timezone": "Europe/Istanbul", "qibla_direction": 148.87},
    {"id": "antalya", "name": "Antalya", "country": "Türkiye", "latitude": 36.8841, "longitude": 30.7056, "timezone": "Europe/Istanbul", "qibla_direction": 150.65},
    {"id": "adana", "name": "Adana", "country": "Türkiye", "latitude": 37.0000, "longitude": 35.3213, "timezone": "Europe/Istanbul", "qibla_direction": 159.21},
    {"id": "konya", "name": "Konya", "country": "Türkiye", "latitude": 37.8746, "longitude": 32.4932, "timezone": "Europe/Istanbul", "qibla_direction": 154.87},
    {"id": "gaziantep", "name": "Gaziantep", "country": "Türkiye", "latitude": 37.0662, "longitude": 37.3833, "timezone": "Europe/Istanbul", "qibla_direction": 165.32},
    {"id": "kayseri", "name": "Kayseri", "country": "Türkiye", "latitude": 38.7312, "longitude": 35.4787, "timezone": "Europe/Istanbul", "qibla_direction": 159.78},
    {"id": "samsun", "name": "Samsun", "country": "Türkiye", "latitude": 41.2867, "longitude": 36.3300, "timezone": "Europe/Istanbul", "qibla_direction": 161.45},
    {"id": "trabzon", "name": "Trabzon", "country": "Türkiye", "latitude": 41.0027, "longitude": 39.7168, "timezone": "Europe/Istanbul", "qibla_direction": 168.92},
    {"id": "eskisehir", "name": "Eskişehir", "country": "Türkiye", "latitude": 39.7767, "longitude": 30.5206, "timezone": "Europe/Istanbul", "qibla_direction": 150.34},
    {"id": "diyarbakir", "name": "Diyarbakır", "country": "Türkiye", "latitude": 37.9144, "longitude": 40.2306, "timezone": "Europe/Istanbul", "qibla_direction": 171.56},
    {"id": "erzurum", "name": "Erzurum", "country": "Türkiye", "latitude": 39.9055, "longitude": 41.2658, "timezone": "Europe/Istanbul", "qibla_direction": 175.23},
    {"id": "mersin", "name": "Mersin", "country": "Türkiye", "latitude": 36.8121, "longitude": 34.6415, "timezone": "Europe/Istanbul", "qibla_direction": 156.87},
]

# ===================== SCHOLARS DATA (HOCALAR) =====================

SCHOLARS = [
    {
        "id": "nihat_hatipoglu",
        "name": "Prof. Dr. Nihat Hatipoğlu",
        "title": "İlahiyatçı, TV Programcısı",
        "style": "Halka yakın, duygusal, hikayeli anlatım, güncel örneklerle açıklama",
        "specialty": "Siyer, Hadis, Güncel Meseleler",
        "image": "nihat_hatipoglu.jpg",
        "sources": ["Diyanet İşleri Başkanlığı", "Sahih Hadis Kaynakları", "Siyer Kitapları"]
    },
    {
        "id": "hayrettin_karaman",
        "name": "Prof. Dr. Hayrettin Karaman",
        "title": "İslam Hukuku Profesörü",
        "style": "Akademik, detaylı, mezhep karşılaştırmalı, fıkhi derinlik",
        "specialty": "Fıkıh, İslam Hukuku, Güncel Fetvalar",
        "image": "hayrettin_karaman.jpg",
        "sources": ["hayrettinkaraman.net", "İslam Hukuku Kaynakları", "Klasik Fıkıh Kitapları"]
    },
    {
        "id": "mustafa_islamoglu",
        "name": "Mustafa İslamoğlu",
        "title": "Tefsir Uzmanı, Yazar",
        "style": "Analitik, Kur'an merkezli, linguistik yaklaşım, modern yorumlama",
        "specialty": "Tefsir, Kur'an Dili, Meal",
        "image": "mustafa_islamoglu.jpg",
        "sources": ["Hayat Kitabı Kur'an", "Meal ve Tefsir Çalışmaları"]
    },
    {
        "id": "diyanet",
        "name": "Diyanet İşleri Başkanlığı",
        "title": "Resmi Dini Kurum",
        "style": "Resmi, dengeli, genel kabul görmüş görüşler, Hanefi ağırlıklı",
        "specialty": "Fetvalar, İbadet, Günlük Dini Meseleler",
        "image": "diyanet.jpg",
        "sources": ["diyanet.gov.tr", "Din İşleri Yüksek Kurulu Kararları"]
    },
    {
        "id": "omer_nasuhi",
        "name": "Ömer Nasuhi Bilmen",
        "title": "Eski Diyanet İşleri Başkanı",
        "style": "Klasik, detaylı, Osmanlı ilim geleneği, kapsamlı",
        "specialty": "Fıkıh, İlmihal, Tefsir",
        "image": "omer_nasuhi.jpg",
        "sources": ["Büyük İslam İlmihali", "Kur'an-ı Kerim'in Türkçe Meal-i Âlisi ve Tefsiri"]
    },
    {
        "id": "elmalili",
        "name": "Elmalılı Muhammed Hamdi Yazır",
        "title": "Müfessir, Alim",
        "style": "Derin tefsir, Arapça/Osmanlıca terminoloji, ilmi derinlik",
        "specialty": "Tefsir, Felsefe, Kelam",
        "image": "elmalili.jpg",
        "sources": ["Hak Dini Kur'an Dili Tefsiri"]
    },
    {
        "id": "said_nursi",
        "name": "Bediüzzaman Said Nursi",
        "title": "İslam Alimi, Müellif",
        "style": "Felsefi, iman esaslı, modern sorulara cevap, derin tefekkür",
        "specialty": "İman, Felsefe, Modern Çağ Sorunları",
        "image": "said_nursi.jpg",
        "sources": ["Risale-i Nur Külliyatı", "erisale.com"]
    }
]

# ===================== QURAN DATA (SURELER) =====================

SURAHS = [
    {"number": 1, "name": "Fatiha", "arabic": "الفاتحة", "meaning": "Açılış", "verses": 7, "revelation": "Mekke", "juz": 1},
    {"number": 2, "name": "Bakara", "arabic": "البقرة", "meaning": "Sığır", "verses": 286, "revelation": "Medine", "juz": 1},
    {"number": 3, "name": "Al-i İmran", "arabic": "آل عمران", "meaning": "İmran Ailesi", "verses": 200, "revelation": "Medine", "juz": 3},
    {"number": 4, "name": "Nisa", "arabic": "النساء", "meaning": "Kadınlar", "verses": 176, "revelation": "Medine", "juz": 4},
    {"number": 5, "name": "Maide", "arabic": "المائدة", "meaning": "Sofra", "verses": 120, "revelation": "Medine", "juz": 6},
    {"number": 6, "name": "En'am", "arabic": "الأنعام", "meaning": "Hayvanlar", "verses": 165, "revelation": "Mekke", "juz": 7},
    {"number": 7, "name": "A'raf", "arabic": "الأعراف", "meaning": "Yüksekler", "verses": 206, "revelation": "Mekke", "juz": 8},
    {"number": 8, "name": "Enfal", "arabic": "الأنفال", "meaning": "Ganimetler", "verses": 75, "revelation": "Medine", "juz": 9},
    {"number": 9, "name": "Tevbe", "arabic": "التوبة", "meaning": "Tövbe", "verses": 129, "revelation": "Medine", "juz": 10},
    {"number": 10, "name": "Yunus", "arabic": "يونس", "meaning": "Yunus", "verses": 109, "revelation": "Mekke", "juz": 11},
    {"number": 36, "name": "Yasin", "arabic": "يس", "meaning": "Yasin", "verses": 83, "revelation": "Mekke", "juz": 22},
    {"number": 55, "name": "Rahman", "arabic": "الرحمن", "meaning": "Esirgeyen", "verses": 78, "revelation": "Medine", "juz": 27},
    {"number": 56, "name": "Vakıa", "arabic": "الواقعة", "meaning": "Kıyamet", "verses": 96, "revelation": "Mekke", "juz": 27},
    {"number": 67, "name": "Mülk", "arabic": "الملك", "meaning": "Egemenlik", "verses": 30, "revelation": "Mekke", "juz": 29},
    {"number": 78, "name": "Nebe", "arabic": "النبأ", "meaning": "Haber", "verses": 40, "revelation": "Mekke", "juz": 30},
    {"number": 112, "name": "İhlas", "arabic": "الإخلاص", "meaning": "Samimiyet", "verses": 4, "revelation": "Mekke", "juz": 30},
    {"number": 113, "name": "Felak", "arabic": "الفلق", "meaning": "Şafak", "verses": 5, "revelation": "Mekke", "juz": 30},
    {"number": 114, "name": "Nas", "arabic": "الناس", "meaning": "İnsanlar", "verses": 6, "revelation": "Mekke", "juz": 30},
]

# Sample verses for popular surahs
SAMPLE_VERSES = {
    "fatiha": [
        {"verse": 1, "arabic": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "turkish": "Rahman ve Rahim olan Allah'ın adıyla", "transliteration": "Bismillahirrahmanirrahim"},
        {"verse": 2, "arabic": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", "turkish": "Hamd, âlemlerin Rabbi Allah'a mahsustur", "transliteration": "Elhamdulillahi rabbil alemin"},
        {"verse": 3, "arabic": "الرَّحْمَٰنِ الرَّحِيمِ", "turkish": "O, Rahman'dır, Rahim'dir", "transliteration": "Er-rahmanir-rahim"},
        {"verse": 4, "arabic": "مَالِكِ يَوْمِ الدِّينِ", "turkish": "Din gününün sahibidir", "transliteration": "Maliki yevmiddin"},
        {"verse": 5, "arabic": "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", "turkish": "Yalnız sana ibadet eder, yalnız senden yardım dileriz", "transliteration": "İyyake na'budu ve iyyake nesta'in"},
        {"verse": 6, "arabic": "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", "turkish": "Bizi doğru yola ilet", "transliteration": "İhdinas-sıratal mustakim"},
        {"verse": 7, "arabic": "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", "turkish": "Nimet verdiklerinin yoluna; gazaba uğrayanların ve sapkınların yoluna değil", "transliteration": "Sıratal-ledhine en'amte aleyhim, ğayril mağdubi aleyhim ve led-dallin"},
    ],
    "ihlas": [
        {"verse": 1, "arabic": "قُلْ هُوَ اللَّهُ أَحَدٌ", "turkish": "De ki: O Allah birdir", "transliteration": "Kul huvallahu ehad"},
        {"verse": 2, "arabic": "اللَّهُ الصَّمَدُ", "turkish": "Allah Samed'dir (her şey O'na muhtaç, O hiçbir şeye muhtaç değil)", "transliteration": "Allahus-samed"},
        {"verse": 3, "arabic": "لَمْ يَلِدْ وَلَمْ يُولَدْ", "turkish": "Doğurmamıştır, doğurulmamıştır", "transliteration": "Lem yelid ve lem yuled"},
        {"verse": 4, "arabic": "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", "turkish": "Hiçbir şey O'nun dengi değildir", "transliteration": "Ve lem yekun lehu kufuven ehad"},
    ],
    "nas": [
        {"verse": 1, "arabic": "قُلْ أَعُوذُ بِرَبِّ النَّاسِ", "turkish": "De ki: İnsanların Rabbine sığınırım", "transliteration": "Kul e'uzu bi rabbin-nas"},
        {"verse": 2, "arabic": "مَلِكِ النَّاسِ", "turkish": "İnsanların melikine (hükümdarına)", "transliteration": "Melikin-nas"},
        {"verse": 3, "arabic": "إِلَٰهِ النَّاسِ", "turkish": "İnsanların ilahına", "transliteration": "İlahin-nas"},
        {"verse": 4, "arabic": "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ", "turkish": "Sinsi vesvesecinin şerrinden", "transliteration": "Min şerril-vesvasil-hannas"},
        {"verse": 5, "arabic": "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ", "turkish": "O ki insanların göğüslerine vesvese verir", "transliteration": "Ellezi yuvesvisu fi sudurin-nas"},
        {"verse": 6, "arabic": "مِنَ الْجِنَّةِ وَالنَّاسِ", "turkish": "Cinlerden ve insanlardan", "transliteration": "Minel-cinneti ven-nas"},
    ]
}

# ===================== HADITH DATA =====================

HADITH_CATEGORIES = [
    {"id": "iman", "name": "İman", "description": "İman esasları ve inanç konuları"},
    {"id": "namaz", "name": "Namaz", "description": "Namaz ile ilgili hadisler"},
    {"id": "oruc", "name": "Oruç", "description": "Oruç ve Ramazan"},
    {"id": "zekat", "name": "Zekat", "description": "Zekat ve sadaka"},
    {"id": "hac", "name": "Hac", "description": "Hac ve umre"},
    {"id": "ahlak", "name": "Ahlak", "description": "Güzel ahlak ve davranışlar"},
    {"id": "aile", "name": "Aile", "description": "Aile hayatı ve evlilik"},
    {"id": "ilim", "name": "İlim", "description": "İlim öğrenme ve öğretme"},
    {"id": "dua", "name": "Dua", "description": "Dualar ve zikirler"},
]

SAMPLE_HADITHS = [
    {
        "id": "h1",
        "arabic": "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
        "turkish": "Ameller niyetlere göredir.",
        "source": "Buhari, Müslim",
        "narrator": "Hz. Ömer (r.a.)",
        "category": "iman",
        "explanation": "Bu hadis-i şerif, İslam'ın temel prensiplerinden birini açıklar. Her amelin değeri, arkasındaki niyete bağlıdır.",
        "authenticity": "Sahih"
    },
    {
        "id": "h2",
        "arabic": "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
        "turkish": "Müslüman, dilinden ve elinden diğer Müslümanların güvende olduğu kimsedir.",
        "source": "Buhari, Müslim",
        "narrator": "Hz. Abdullah bin Amr (r.a.)",
        "category": "ahlak",
        "explanation": "Gerçek Müslümanlık, başkalarına zarar vermemek ve toplum içinde güvenilir olmakla ölçülür.",
        "authenticity": "Sahih"
    },
    {
        "id": "h3",
        "arabic": "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
        "turkish": "Sizden biriniz, kendisi için sevdiğini kardeşi için de sevmedikçe gerçek mümin olamaz.",
        "source": "Buhari, Müslim",
        "narrator": "Hz. Enes (r.a.)",
        "category": "iman",
        "explanation": "İmanın kemali, kardeşlik duygusunun samimiyetiyle ölçülür.",
        "authenticity": "Sahih"
    },
    {
        "id": "h4",
        "arabic": "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
        "turkish": "Allah'a ve ahiret gününe iman eden kimse ya hayır söylesin ya da sussun.",
        "source": "Buhari, Müslim",
        "narrator": "Hz. Ebu Hureyre (r.a.)",
        "category": "ahlak",
        "explanation": "Dilin korunması ve söz söylemede dikkatli olunması gerektiğini vurgular.",
        "authenticity": "Sahih"
    },
    {
        "id": "h5",
        "arabic": "الطُّهُورُ شَطْرُ الْإِيمَانِ",
        "turkish": "Temizlik imanın yarısıdır.",
        "source": "Müslim",
        "narrator": "Hz. Ebu Malik el-Eş'ari (r.a.)",
        "category": "iman",
        "explanation": "İslam'da temizliğin önemi ve imanla olan bağlantısı vurgulanır.",
        "authenticity": "Sahih"
    },
    {
        "id": "h6",
        "arabic": "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
        "turkish": "En hayırlınız Kur'an'ı öğrenen ve öğretendir.",
        "source": "Buhari",
        "narrator": "Hz. Osman (r.a.)",
        "category": "ilim",
        "explanation": "Kur'an eğitiminin fazileti ve önemi anlatılır.",
        "authenticity": "Sahih"
    },
    {
        "id": "h7",
        "arabic": "الصَّلَوَاتُ الْخَمْسُ كَفَّارَاتٌ لِمَا بَيْنَهُنَّ",
        "turkish": "Beş vakit namaz, aralarındaki günahlara kefarettir.",
        "source": "Müslim",
        "narrator": "Hz. Ebu Hureyre (r.a.)",
        "category": "namaz",
        "explanation": "Beş vakit namazın günahları temizlediği müjdelenir.",
        "authenticity": "Sahih"
    },
    {
        "id": "h8",
        "arabic": "مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ",
        "turkish": "Kim inanarak ve sevabını Allah'tan bekleyerek Ramazan orucunu tutarsa, geçmiş günahları bağışlanır.",
        "source": "Buhari, Müslim",
        "narrator": "Hz. Ebu Hureyre (r.a.)",
        "category": "oruc",
        "explanation": "Ramazan orucunun faziletleri ve mükafatı açıklanır.",
        "authenticity": "Sahih"
    },
    {
        "id": "h9",
        "arabic": "الدُّعَاءُ هُوَ الْعِبَادَةُ",
        "turkish": "Dua ibadetin özüdür.",
        "source": "Tirmizi, Ebu Davud",
        "narrator": "Hz. Nu'man bin Beşir (r.a.)",
        "category": "dua",
        "explanation": "Duanın ibadet içindeki merkezi konumu vurgulanır.",
        "authenticity": "Sahih"
    },
    {
        "id": "h10",
        "arabic": "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ",
        "turkish": "İlim öğrenmek her Müslümana farzdır.",
        "source": "İbn Mace",
        "narrator": "Hz. Enes (r.a.)",
        "category": "ilim",
        "explanation": "İlim öğrenmenin dini bir vecibe olduğu belirtilir.",
        "authenticity": "Hasen"
    }
]

# ===================== BADGES DATA =====================

BADGES = [
    {"id": "first_step", "name": "İlk Adım", "description": "İlk aktiviteni tamamladın", "icon": "footsteps", "points_required": 0},
    {"id": "quran_starter", "name": "Kur'an Yolcusu", "description": "İlk surenizi okudunuz", "icon": "book", "points_required": 10},
    {"id": "hadith_learner", "name": "Hadis Öğrencisi", "description": "10 hadis okudunuz", "icon": "school", "points_required": 50},
    {"id": "streak_3", "name": "Kararlı", "description": "3 gün üst üste aktif oldunuz", "icon": "flame", "points_required": 0},
    {"id": "streak_7", "name": "Azimli", "description": "7 gün üst üste aktif oldunuz", "icon": "flame", "points_required": 0},
    {"id": "streak_30", "name": "Sebatkâr", "description": "30 gün üst üste aktif oldunuz", "icon": "trophy", "points_required": 0},
    {"id": "pomodoro_master", "name": "İlim Ustası", "description": "100 dakika odaklanma tamamladınız", "icon": "timer", "points_required": 100},
    {"id": "scholar_seeker", "name": "Alim Araştırmacısı", "description": "5 hocadan görüş aldınız", "icon": "people", "points_required": 75},
    {"id": "level_5", "name": "Seviye 5", "description": "5. seviyeye ulaştınız", "icon": "star", "points_required": 500},
    {"id": "level_10", "name": "Seviye 10", "description": "10. seviyeye ulaştınız", "icon": "star", "points_required": 1000},
]

# ===================== PRAYER TIME CALCULATION =====================

def calculate_prayer_times(latitude: float, longitude: float, date_obj: date, madhab: str = "hanafi") -> dict:
    """Calculate prayer times using Diyanet method for Turkey"""
    import math
    
    day_of_year = date_obj.timetuple().tm_yday
    B = 2 * math.pi * (day_of_year - 81) / 365
    equation_of_time = 9.87 * math.sin(2 * B) - 7.53 * math.cos(B) - 1.5 * math.sin(B)
    declination = 23.45 * math.sin(2 * math.pi * (day_of_year - 81) / 365)
    
    timezone_offset = 3
    solar_noon = 12 - equation_of_time / 60 - longitude / 15 + timezone_offset
    
    lat_rad = math.radians(latitude)
    dec_rad = math.radians(declination)
    
    def time_for_angle(angle):
        angle_rad = math.radians(angle)
        cos_hour_angle = (math.sin(angle_rad) - math.sin(lat_rad) * math.sin(dec_rad)) / (math.cos(lat_rad) * math.cos(dec_rad))
        if cos_hour_angle > 1 or cos_hour_angle < -1:
            return None
        hour_angle = math.degrees(math.acos(cos_hour_angle)) / 15
        return hour_angle
    
    fajr_angle = time_for_angle(-18)
    fajr = solar_noon - fajr_angle if fajr_angle else solar_noon - 1.5
    
    sunrise_angle = time_for_angle(-0.833)
    sunrise = solar_noon - sunrise_angle if sunrise_angle else solar_noon - 0.5
    
    dhuhr = solar_noon + 0.083
    
    if madhab == "hanafi":
        asr_shadow_ratio = 2
    else:
        asr_shadow_ratio = 1
    
    asr_altitude = math.degrees(math.atan(1 / (asr_shadow_ratio + math.tan(lat_rad - dec_rad))))
    asr_angle = time_for_angle(asr_altitude)
    asr = solar_noon + asr_angle if asr_angle else solar_noon + 3
    
    maghrib_angle = time_for_angle(-0.833)
    maghrib = solar_noon + maghrib_angle + 0.05 if maghrib_angle else solar_noon + 6
    
    isha_angle = time_for_angle(-17)
    isha = solar_noon + isha_angle if isha_angle else maghrib + 1.5
    
    def format_time(hours):
        hours = hours % 24
        h = int(hours)
        m = int((hours - h) * 60)
        return f"{h:02d}:{m:02d}"
    
    return {
        "fajr": format_time(fajr),
        "sunrise": format_time(sunrise),
        "dhuhr": format_time(dhuhr),
        "asr": format_time(asr),
        "maghrib": format_time(maghrib),
        "isha": format_time(isha)
    }

# ===================== GAMIFICATION HELPERS =====================

POINTS_CONFIG = {
    "quran_read": 10,
    "hadith_read": 5,
    "pomodoro": 15,
    "scholar_question": 8,
    "chat": 3,
    "daily_login": 5,
}

def calculate_level(points: int) -> int:
    """Calculate level based on points"""
    if points < 50:
        return 1
    elif points < 150:
        return 2
    elif points < 300:
        return 3
    elif points < 500:
        return 4
    elif points < 750:
        return 5
    elif points < 1000:
        return 6
    elif points < 1500:
        return 7
    elif points < 2000:
        return 8
    elif points < 3000:
        return 9
    else:
        return 10

def get_earned_badges(stats: dict) -> List[str]:
    """Check which badges user has earned"""
    badges = []
    
    if stats.get("total_points", 0) > 0:
        badges.append("first_step")
    if stats.get("quran_pages_read", 0) >= 1:
        badges.append("quran_starter")
    if stats.get("hadith_read", 0) >= 10:
        badges.append("hadith_learner")
    if stats.get("current_streak", 0) >= 3:
        badges.append("streak_3")
    if stats.get("current_streak", 0) >= 7:
        badges.append("streak_7")
    if stats.get("current_streak", 0) >= 30:
        badges.append("streak_30")
    if stats.get("pomodoro_minutes", 0) >= 100:
        badges.append("pomodoro_master")
    if stats.get("level", 1) >= 5:
        badges.append("level_5")
    if stats.get("level", 1) >= 10:
        badges.append("level_10")
    
    return badges

# ===================== ROUTES =====================

@api_router.get("/")
async def root():
    return {"message": "İslami Yaşam Asistanı API", "version": "2.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Cities
@api_router.get("/cities", response_model=List[City])
async def get_cities():
    return [City(**city) for city in TURKISH_CITIES]

@api_router.get("/cities/{city_id}", response_model=City)
async def get_city(city_id: str):
    for city in TURKISH_CITIES:
        if city["id"] == city_id:
            return City(**city)
    raise HTTPException(status_code=404, detail="City not found")

# Prayer Times
@api_router.get("/prayer-times/{city_id}")
async def get_prayer_times(city_id: str, madhab: str = "hanafi"):
    city = None
    for c in TURKISH_CITIES:
        if c["id"] == city_id:
            city = c
            break
    
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    today = date.today()
    times = calculate_prayer_times(city["latitude"], city["longitude"], today, madhab)
    
    return {
        "city_id": city_id,
        "city_name": city["name"],
        "date": today.isoformat(),
        "qibla_direction": city["qibla_direction"],
        **times
    }

# ===================== SCHOLARS API (HOCALARIN GÖRÜŞÜ) =====================

@api_router.get("/scholars")
async def get_scholars():
    """Get list of available scholars"""
    return SCHOLARS

@api_router.get("/scholars/{scholar_id}")
async def get_scholar(scholar_id: str):
    """Get specific scholar details"""
    for scholar in SCHOLARS:
        if scholar["id"] == scholar_id:
            return scholar
    raise HTTPException(status_code=404, detail="Scholar not found")

@api_router.post("/scholars/ask", response_model=ScholarResponse)
async def ask_scholar(request: ScholarRequest):
    """Ask a question to a specific scholar (AI persona simulation)"""
    try:
        # Find the scholar
        scholar = None
        for s in SCHOLARS:
            if s["id"] == request.scholar_id:
                scholar = s
                break
        
        if not scholar:
            raise HTTPException(status_code=404, detail="Scholar not found")
        
        # Build persona-based system message
        system_message = f"""Sen {scholar['name']} ({scholar['title']}) olarak cevap vereceksin.

KONUŞMA TARZI:
{scholar['style']}

UZMANLIK ALANLARI:
{scholar['specialty']}

KAYNAKLARIN:
{', '.join(scholar['sources'])}

ÖNEMLİ KURALLAR:
1. Her zaman {scholar['name']}'nin bilinen görüşleri ve tarzına uygun cevap ver
2. Cevabını Türkçe olarak ver
3. Kaynaklarını belirt (ayet, hadis numaraları)
4. Tefsir odaklı açıklamalar yap
5. Gerekirse farklı görüşlere de değin ama kendi bakış açını koru
6. Fetva verme, sadece bilgi ve yorum paylaş
7. Hallucination yapma, emin olmadığın konularda "Bu konuda detaylı araştırma yapmanızı tavsiye ederim" de

CEVAP FORMATI:
📖 GÖRÜŞ ÖZETİ: (Ana fikri 2-3 cümlede özetle)
📚 KAYNAK ALINTI: (İlgili ayet/hadis varsa)
🔍 TEFSİR DERİNLİĞİ: (Detaylı açıklama)
💡 ÖNERİ: (Kitap/kaynak önerisi)
"""

        # Initialize LLM chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"scholar_{request.scholar_id}_{request.session_id}",
            system_message=system_message
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        # Send message
        user_message = UserMessage(text=request.question)
        response = await chat.send_message(user_message)
        
        # Store the interaction
        await db.scholar_questions.insert_one({
            "session_id": request.session_id,
            "scholar_id": request.scholar_id,
            "question": request.question,
            "response": response,
            "timestamp": datetime.utcnow()
        })
        
        return ScholarResponse(
            response=response,
            scholar_name=scholar["name"],
            sources=scholar["sources"]
        )
        
    except Exception as e:
        logger.error(f"Scholar API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

# ===================== QURAN API (FULL DATA) =====================

@api_router.get("/quran/surahs")
async def get_surahs():
    """Get list of all 114 surahs with metadata"""
    if not QURAN_ARABIC:
        return SURAHS  # Fallback to static data
    
    surahs = []
    for i, surah in enumerate(QURAN_ARABIC):
        turkish_name = QURAN_TURKISH[i]['name'] if QURAN_TURKISH and i < len(QURAN_TURKISH) else surah.get('englishName', '')
        surahs.append({
            "number": surah['number'],
            "name": surah.get('englishName', ''),
            "arabic": surah.get('name', ''),
            "turkish_name": turkish_name,
            "meaning": surah.get('englishNameTranslation', ''),
            "verses": surah.get('numberOfAyahs', 0),
            "revelation": "Mekke" if surah.get('revelationType') == 'Meccan' else "Medine"
        })
    return surahs

@api_router.get("/quran/surah/{surah_number}")
async def get_surah(surah_number: int):
    """Get surah details with all verses"""
    if not QURAN_ARABIC or surah_number < 1 or surah_number > 114:
        raise HTTPException(status_code=404, detail="Surah not found")
    
    arabic_surah = QURAN_ARABIC[surah_number - 1]
    turkish_surah = QURAN_TURKISH[surah_number - 1] if QURAN_TURKISH else None
    
    verses = []
    for i, ayah in enumerate(arabic_surah['ayahs']):
        verse = {
            "number": ayah['numberInSurah'],
            "arabic": ayah['text'],
            "turkish": turkish_surah['ayahs'][i]['text'] if turkish_surah else "",
            "page": ayah.get('page', 0),
            "juz": ayah.get('juz', 0),
            "hizbQuarter": ayah.get('hizbQuarter', 0)
        }
        verses.append(verse)
    
    return {
        "number": arabic_surah['number'],
        "name": arabic_surah.get('englishName', ''),
        "arabic_name": arabic_surah.get('name', ''),
        "meaning": arabic_surah.get('englishNameTranslation', ''),
        "revelation": "Mekke" if arabic_surah.get('revelationType') == 'Meccan' else "Medine",
        "total_verses": len(verses),
        "verses": verses
    }

@api_router.get("/quran/verse/{surah_number}/{verse_number}")
async def get_verse(surah_number: int, verse_number: int):
    """Get specific verse with Arabic and Turkish"""
    if not QURAN_ARABIC or surah_number < 1 or surah_number > 114:
        raise HTTPException(status_code=404, detail="Surah not found")
    
    arabic_surah = QURAN_ARABIC[surah_number - 1]
    turkish_surah = QURAN_TURKISH[surah_number - 1] if QURAN_TURKISH else None
    
    if verse_number < 1 or verse_number > len(arabic_surah['ayahs']):
        raise HTTPException(status_code=404, detail="Verse not found")
    
    ayah = arabic_surah['ayahs'][verse_number - 1]
    
    return {
        "surah_number": surah_number,
        "surah_name": arabic_surah.get('englishName', ''),
        "surah_arabic": arabic_surah.get('name', ''),
        "verse_number": verse_number,
        "arabic": ayah['text'],
        "turkish": turkish_surah['ayahs'][verse_number - 1]['text'] if turkish_surah else "",
        "page": ayah.get('page', 0),
        "juz": ayah.get('juz', 0)
    }

@api_router.get("/quran/search")
async def search_quran(query: str = Query(..., min_length=2)):
    """Search in Quran verses (Turkish translation)"""
    if not QURAN_TURKISH:
        raise HTTPException(status_code=500, detail="Quran data not loaded")
    
    results = []
    query_lower = query.lower()
    
    for surah in QURAN_TURKISH:
        for ayah in surah['ayahs']:
            if query_lower in ayah['text'].lower():
                arabic_text = ""
                if QURAN_ARABIC:
                    arabic_surah = QURAN_ARABIC[surah['number'] - 1]
                    arabic_text = arabic_surah['ayahs'][ayah['numberInSurah'] - 1]['text']
                
                results.append({
                    "surah_number": surah['number'],
                    "surah_name": surah.get('englishName', ''),
                    "verse_number": ayah['numberInSurah'],
                    "arabic": arabic_text,
                    "turkish": ayah['text']
                })
                
                if len(results) >= 50:  # Limit results
                    break
        if len(results) >= 50:
            break
    
    return {"query": query, "count": len(results), "results": results}

@api_router.get("/quran/juz/{juz_number}")
async def get_juz(juz_number: int):
    """Get all verses in a specific Juz (1-30)"""
    if not QURAN_ARABIC or juz_number < 1 or juz_number > 30:
        raise HTTPException(status_code=404, detail="Juz not found")
    
    verses = []
    for i, surah in enumerate(QURAN_ARABIC):
        for j, ayah in enumerate(surah['ayahs']):
            if ayah.get('juz') == juz_number:
                turkish_text = ""
                if QURAN_TURKISH:
                    turkish_text = QURAN_TURKISH[i]['ayahs'][j]['text']
                
                verses.append({
                    "surah_number": surah['number'],
                    "surah_name": surah.get('englishName', ''),
                    "verse_number": ayah['numberInSurah'],
                    "arabic": ayah['text'],
                    "turkish": turkish_text
                })
    
    return {"juz": juz_number, "total_verses": len(verses), "verses": verses}

@api_router.get("/quran/page/{page_number}")
async def get_page(page_number: int):
    """Get all verses in a specific page (1-604)"""
    if not QURAN_ARABIC or page_number < 1 or page_number > 604:
        raise HTTPException(status_code=404, detail="Page not found")
    
    verses = []
    for i, surah in enumerate(QURAN_ARABIC):
        for j, ayah in enumerate(surah['ayahs']):
            if ayah.get('page') == page_number:
                turkish_text = ""
                if QURAN_TURKISH:
                    turkish_text = QURAN_TURKISH[i]['ayahs'][j]['text']
                
                verses.append({
                    "surah_number": surah['number'],
                    "surah_name": surah.get('englishName', ''),
                    "surah_arabic": surah.get('name', ''),
                    "verse_number": ayah['numberInSurah'],
                    "arabic": ayah['text'],
                    "turkish": turkish_text
                })
    
    return {"page": page_number, "total_verses": len(verses), "verses": verses}

@api_router.get("/quran/random")
async def get_random_verse():
    """Get a random verse"""
    import random
    if not QURAN_ARABIC:
        raise HTTPException(status_code=500, detail="Quran data not loaded")
    
    surah_idx = random.randint(0, 113)
    surah = QURAN_ARABIC[surah_idx]
    verse_idx = random.randint(0, len(surah['ayahs']) - 1)
    ayah = surah['ayahs'][verse_idx]
    
    turkish_text = ""
    if QURAN_TURKISH:
        turkish_text = QURAN_TURKISH[surah_idx]['ayahs'][verse_idx]['text']
    
    return {
        "surah_number": surah['number'],
        "surah_name": surah.get('englishName', ''),
        "surah_arabic": surah.get('name', ''),
        "verse_number": ayah['numberInSurah'],
        "arabic": ayah['text'],
        "turkish": turkish_text
    }

@api_router.post("/quran/bookmark")
async def add_bookmark(user_id: str, surah: int, verse: int):
    """Bookmark a verse"""
    bookmark = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "surah": surah,
        "verse": verse,
        "created_at": datetime.utcnow()
    }
    await db.quran_bookmarks.insert_one(bookmark)
    return bookmark

@api_router.get("/quran/bookmarks/{user_id}")
async def get_bookmarks(user_id: str):
    """Get user's bookmarks"""
    bookmarks = await db.quran_bookmarks.find({"user_id": user_id}).to_list(100)
    return [{"id": str(b.get("_id", b.get("id", ""))), "surah": b["surah"], "verse": b["verse"]} for b in bookmarks]

# ===================== HADITH API =====================

@api_router.get("/hadith/categories")
async def get_hadith_categories():
    """Get hadith categories"""
    return HADITH_CATEGORIES

@api_router.get("/hadith/all")
async def get_all_hadiths():
    """Get all hadiths"""
    return SAMPLE_HADITHS

@api_router.get("/hadith/category/{category_id}")
async def get_hadiths_by_category(category_id: str):
    """Get hadiths by category"""
    filtered = [h for h in SAMPLE_HADITHS if h["category"] == category_id]
    return filtered

@api_router.get("/hadith/{hadith_id}")
async def get_hadith(hadith_id: str):
    """Get specific hadith"""
    for hadith in SAMPLE_HADITHS:
        if hadith["id"] == hadith_id:
            return hadith
    raise HTTPException(status_code=404, detail="Hadith not found")

@api_router.get("/hadith/search/{query}")
async def search_hadiths(query: str):
    """Search hadiths"""
    query_lower = query.lower()
    results = [h for h in SAMPLE_HADITHS if query_lower in h["turkish"].lower() or query_lower in h["explanation"].lower()]
    return results

# ===================== GAMIFICATION API =====================

@api_router.get("/gamification/stats/{user_id}")
async def get_user_stats(user_id: str):
    """Get user's gamification stats"""
    stats = await db.user_stats.find_one({"user_id": user_id})
    
    if not stats:
        # Create new stats
        stats = UserStats(user_id=user_id).dict()
        await db.user_stats.insert_one(stats)
    
    # Calculate earned badges
    stats["badges"] = get_earned_badges(stats)
    stats["level"] = calculate_level(stats.get("total_points", 0))
    
    return stats

@api_router.post("/gamification/activity")
async def log_activity(activity: ActivityCreate):
    """Log an activity and award points"""
    points = POINTS_CONFIG.get(activity.activity_type, 0)
    
    # Get or create user stats
    stats = await db.user_stats.find_one({"user_id": activity.user_id})
    
    if not stats:
        stats = UserStats(user_id=activity.user_id).dict()
        await db.user_stats.insert_one(stats)
    
    # Update stats
    today = date.today().isoformat()
    update_data = {
        "total_points": stats.get("total_points", 0) + points,
        "updated_at": datetime.utcnow()
    }
    
    # Update streak
    last_activity = stats.get("last_activity_date", "")
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    
    if last_activity == yesterday:
        update_data["current_streak"] = stats.get("current_streak", 0) + 1
    elif last_activity != today:
        update_data["current_streak"] = 1
    
    update_data["last_activity_date"] = today
    
    if update_data.get("current_streak", 0) > stats.get("longest_streak", 0):
        update_data["longest_streak"] = update_data["current_streak"]
    
    # Update activity-specific counters
    if activity.activity_type == "quran_read":
        update_data["quran_pages_read"] = stats.get("quran_pages_read", 0) + 1
    elif activity.activity_type == "hadith_read":
        update_data["hadith_read"] = stats.get("hadith_read", 0) + 1
    elif activity.activity_type == "pomodoro":
        update_data["pomodoro_minutes"] = stats.get("pomodoro_minutes", 0) + 25
    
    # Calculate new level
    update_data["level"] = calculate_level(update_data["total_points"])
    
    await db.user_stats.update_one(
        {"user_id": activity.user_id},
        {"$set": update_data}
    )
    
    # Log the activity
    activity_log = ActivityLog(
        user_id=activity.user_id,
        activity_type=activity.activity_type,
        points_earned=points,
        details=activity.details
    )
    await db.activity_logs.insert_one(activity_log.dict())
    
    return {
        "points_earned": points,
        "total_points": update_data["total_points"],
        "level": update_data["level"],
        "current_streak": update_data.get("current_streak", 1)
    }

@api_router.get("/gamification/badges")
async def get_all_badges():
    """Get all available badges"""
    return BADGES

@api_router.get("/gamification/leaderboard")
async def get_leaderboard():
    """Get top users leaderboard"""
    users = await db.user_stats.find().sort("total_points", -1).limit(20).to_list(20)
    
    leaderboard = []
    for i, user in enumerate(users):
        leaderboard.append({
            "rank": i + 1,
            "user_id": user["user_id"][:8] + "...",  # Anonymize
            "points": user.get("total_points", 0),
            "level": calculate_level(user.get("total_points", 0)),
            "streak": user.get("current_streak", 0)
        })
    
    return leaderboard

# ===================== AI CHAT (İSLAMİ DANIŞMAN) =====================

ISLAMIC_ADVISOR_SYSTEM_PROMPT = """Sen bir İslami danışman AI'sın. Kullanıcıların İslami, hayati veya gündelik yaşamla ilgili sorunlarını, sorularını öncelikle Kur'an-ı Kerim ayetlerine dayalı olarak yanıtla, ardından Kur'an'a uygun ve sahih hadis kaynaklarından (Buhârî, Müslim gibi muteber kaynaklar) destekleyici sözlerle güçlendir.

## CEVAP FORMATI (Bu formatı her zaman kullan):

### 📋 SORU ÖZETİ
Kullanıcının sorusunu kısaca özetle.

### 📖 KUR'AN-I KERİM'DEN
Soruya doğrudan ilgili Kur'an ayetlerini (sure adı ve ayet numarasıyla) bul ve alıntıla.
- Ayetleri orijinal Arapça metinle birlikte ver
- Türkçe mealini ekle
- Ayetin bağlamını açıkla

### 📚 HADİS-İ ŞERİFLER
Konuya uygun sahih hadisleri kaynak belirterek ekle.
Format: "Peygamber Efendimiz (s.a.v.) şöyle buyurmuştur: '...' (Buhârî/Müslim, Kitap Adı)"

### 🙏 DUA ÖNERİSİ
Soruna göre uygun dua öner:
- Arapça metin
- Türkçe okunuşu (transliterasyon)
- Türkçe meali
- Referans (Hisnü'l-Müslim veya benzeri kaynaklardan)

### 📜 İLGİLİ KISSA/HİKAYE
Sorunla ilgili İslami kıssalar veya hikayeler ekle:
- Peygamber Efendimiz'in (s.a.v.) hayatından
- Sahabe kıssaları
- Din alimlerinin özlü sözleri
Muteber kaynak belirt (Siyer kitapları, Tabakat vb.)

### 💡 TAVSİYE VE SONUÇ
- Kullanıcıya ne yapması gerektiğini net ve adım adım açıkla
- Kişisel yorum ekleme, ayetlerin ve hadislerin öğretisine sadık kal
- Teşvik edici ve umut verici bir kapanış yap

## ÖNEMLİ KURALLAR:
1. Her zaman Türkçe yanıt ver
2. Ayet ve hadis numaralarını doğru ver
3. Fetva verme, sadece bilgi ve yönlendirme yap
4. Kaynakları mutlaka belirt
5. Saygılı ve nazik ol
6. Emin olmadığın konularda "Bu konuda bir ilim ehline danışmanızı tavsiye ederim" de
7. Ayetleri Arapça + Türkçe ver
8. Hadislerin sahihlik derecesini belirt (Sahih, Hasen, Zayıf)

## ÖRNEK KAYNAK KULLANIMI:
- Kur'an: "(Bakara Suresi, 2:286)"
- Hadis: "(Buhârî, Kitâbü'l-Îmân, No: 8)" 
- Dua: "(Hisnü'l-Müslim, Sabah-Akşam Duaları)"
- Siyer: "(İbn Hişâm, es-Sîretü'n-Nebeviyye)"
"""

@api_router.post("/ai/chat", response_model=ChatResponse)
async def ai_chat(request: ChatRequest):
    try:
        user_msg = ChatMessage(
            session_id=request.session_id,
            role="user",
            content=request.message
        )
        await db.chat_messages.insert_one(user_msg.dict())
        
        history = await db.chat_messages.find(
            {"session_id": request.session_id}
        ).sort("timestamp", 1).to_list(20)
        
        context = ""
        for msg in history[-10:]:
            role = "Kullanıcı" if msg["role"] == "user" else "Asistan"
            context += f"{role}: {msg['content']}\n"
        
        system_message = ISLAMIC_ADVISOR_SYSTEM_PROMPT + f"\n\nMevcut sohbet geçmişi:\n{context}"
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"islamic_advisor_{request.session_id}",
            system_message=system_message
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        assistant_msg = ChatMessage(
            session_id=request.session_id,
            role="assistant",
            content=response
        )
        await db.chat_messages.insert_one(assistant_msg.dict())
        
        return ChatResponse(response=response, session_id=request.session_id)
        
    except Exception as e:
        logger.error(f"AI Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.get("/ai/history/{session_id}")
async def get_chat_history(session_id: str):
    messages = await db.chat_messages.find(
        {"session_id": session_id}
    ).sort("timestamp", 1).to_list(100)
    
    return [{"role": msg["role"], "content": msg["content"], "timestamp": msg["timestamp"]} for msg in messages]

@api_router.delete("/ai/history/{session_id}")
async def clear_chat_history(session_id: str):
    result = await db.chat_messages.delete_many({"session_id": session_id})
    return {"deleted_count": result.deleted_count}

# ===================== POMODORO (EXISTING) =====================

@api_router.post("/pomodoro", response_model=PomodoroSession)
async def create_pomodoro_session(session: PomodoroCreate):
    session_obj = PomodoroSession(**session.dict())
    await db.pomodoro_sessions.insert_one(session_obj.dict())
    return session_obj

@api_router.get("/pomodoro/{user_id}")
async def get_pomodoro_sessions(user_id: str):
    sessions = await db.pomodoro_sessions.find(
        {"user_id": user_id}
    ).sort("created_at", -1).to_list(50)
    return [PomodoroSession(**s) for s in sessions]

@api_router.patch("/pomodoro/{session_id}")
async def update_pomodoro_session(session_id: str, update: PomodoroUpdate):
    result = await db.pomodoro_sessions.update_one(
        {"id": session_id},
        {"$set": update.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True}

@api_router.get("/pomodoro/stats/{user_id}")
async def get_pomodoro_stats(user_id: str):
    sessions = await db.pomodoro_sessions.find({"user_id": user_id}).to_list(1000)
    
    total_sessions = len(sessions)
    completed_sessions = sum(1 for s in sessions if s.get("completed", False))
    total_minutes = sum(s.get("duration_minutes", 0) for s in sessions if s.get("completed", False))
    
    topics = {}
    for s in sessions:
        topic = s.get("topic", "Diğer")
        if topic not in topics:
            topics[topic] = {"count": 0, "minutes": 0}
        topics[topic]["count"] += 1
        if s.get("completed", False):
            topics[topic]["minutes"] += s.get("duration_minutes", 0)
    
    return {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "total_minutes": total_minutes,
        "topics": topics
    }

# ===================== USER PREFERENCES (EXISTING) =====================

@api_router.post("/preferences", response_model=UserPreferences)
async def create_or_update_preferences(prefs: UserPreferencesCreate):
    existing = await db.user_preferences.find_one({"user_id": prefs.user_id})
    
    if existing:
        await db.user_preferences.update_one(
            {"user_id": prefs.user_id},
            {"$set": {**prefs.dict(), "updated_at": datetime.utcnow()}}
        )
        updated = await db.user_preferences.find_one({"user_id": prefs.user_id})
        return UserPreferences(**updated)
    else:
        prefs_obj = UserPreferences(**prefs.dict())
        await db.user_preferences.insert_one(prefs_obj.dict())
        return prefs_obj

@api_router.get("/preferences/{user_id}", response_model=UserPreferences)
async def get_preferences(user_id: str):
    prefs = await db.user_preferences.find_one({"user_id": user_id})
    if not prefs:
        return UserPreferences(user_id=user_id)
    return UserPreferences(**prefs)

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

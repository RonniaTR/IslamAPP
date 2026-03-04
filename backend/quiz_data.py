# ===================== QUIZ SYSTEM MODELS & ROUTES =====================
# This file contains the complete quiz system for the Islamic Life Assistant app

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import random

# ===================== QUIZ MODELS =====================

class QuizCategory(BaseModel):
    id: str
    name: str
    name_en: str
    description: str
    icon: str
    color: str
    question_count: int = 0

class QuizQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str
    question: str
    options: List[str]
    correct_answer: int  # Index of correct option (0-3)
    explanation: str
    source: str  # Kaynak (Ayet, Hadis, vb.)
    difficulty: str = "medium"  # easy, medium, hard
    points: int = 10

class QuizRoom(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    host_id: str
    host_name: str
    players: List[Dict[str, Any]] = []  # [{user_id, username, score, answers}]
    status: str = "waiting"  # waiting, playing, finished
    current_question: int = 0
    questions: List[Dict] = []
    max_players: int = 4
    question_count: int = 10
    time_per_question: int = 20  # seconds
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

class QuizAnswer(BaseModel):
    room_id: str
    user_id: str
    question_index: int
    answer: int
    time_taken: float  # seconds

class CreateRoomRequest(BaseModel):
    user_id: str
    username: str
    category: str
    room_name: str
    question_count: int = 10
    time_per_question: int = 20

class JoinRoomRequest(BaseModel):
    user_id: str
    username: str

class SubmitAnswerRequest(BaseModel):
    user_id: str
    question_index: int
    answer: int
    time_taken: float

class UserQuizStats(BaseModel):
    user_id: str
    total_games: int = 0
    games_won: int = 0
    total_points: int = 0
    correct_answers: int = 0
    total_answers: int = 0
    best_streak: int = 0
    current_streak: int = 0
    categories_played: Dict[str, int] = {}
    last_played: Optional[datetime] = None

# ===================== QUIZ CATEGORIES =====================

QUIZ_CATEGORIES = [
    {
        "id": "ramazan",
        "name": "Ramazan",
        "name_en": "Ramadan",
        "description": "Ramazan ayı, oruç ve ibadetler hakkında sorular",
        "icon": "moon",
        "color": "#8b5cf6"
    },
    {
        "id": "namaz",
        "name": "Namaz",
        "name_en": "Prayer",
        "description": "Namaz, abdest ve ibadet hakkında sorular",
        "icon": "hand-left",
        "color": "#10b981"
    },
    {
        "id": "hadis",
        "name": "Hadis",
        "name_en": "Hadith",
        "description": "Peygamberimizin hadisleri hakkında sorular",
        "icon": "book",
        "color": "#f59e0b"
    },
    {
        "id": "tefsir",
        "name": "Tefsir",
        "name_en": "Tafsir",
        "description": "Kur'an tefsiri ve ayetler hakkında sorular",
        "icon": "library",
        "color": "#3b82f6"
    },
    {
        "id": "fikih",
        "name": "Fıkıh",
        "name_en": "Fiqh",
        "description": "İslam hukuku ve helal-haram konuları",
        "icon": "scale",
        "color": "#ec4899"
    }
]

# ===================== SAMPLE QUIZ QUESTIONS =====================

QUIZ_QUESTIONS = {
    "ramazan": [
        {
            "question": "Ramazan orucu hangi hicri yılda farz kılınmıştır?",
            "options": ["Hicretin 1. yılı", "Hicretin 2. yılı", "Hicretin 3. yılı", "Hicretin 4. yılı"],
            "correct_answer": 1,
            "explanation": "Ramazan orucu, Hicretin 2. yılında Şaban ayında farz kılınmıştır.",
            "source": "Bakara Suresi, 183-185. Ayetler",
            "difficulty": "medium"
        },
        {
            "question": "Kadir Gecesi hangi ayda yer alır?",
            "options": ["Şaban", "Ramazan", "Şevval", "Zilhicce"],
            "correct_answer": 1,
            "explanation": "Kadir Gecesi, Ramazan ayının son on gününde, tek gecelerde aranır.",
            "source": "Kadir Suresi, 1-5. Ayetler",
            "difficulty": "easy"
        },
        {
            "question": "Orucu bozan durumlardan hangisi hem kaza hem kefaret gerektirir?",
            "options": ["Unutarak yemek-içmek", "Bilerek yemek-içmek", "Kusma", "Kan aldırmak"],
            "correct_answer": 1,
            "explanation": "Bilerek ve isteyerek orucu bozmak hem kaza hem kefaret gerektirir. Unutarak yapılan fiiller orucu bozmaz.",
            "source": "Hanefi Fıkhı, Büyük İslam İlmihali",
            "difficulty": "medium"
        },
        {
            "question": "Sahur vakti ne zaman sona erer?",
            "options": ["Gece yarısı", "İmsak vakti", "Güneş doğduğunda", "Sabah namazı vakti girince"],
            "correct_answer": 1,
            "explanation": "Sahur vakti, imsak vakti (fecr-i sadık) ile sona erer. Bu vakitten sonra oruç başlar.",
            "source": "Bakara Suresi, 187. Ayet",
            "difficulty": "easy"
        },
        {
            "question": "Ramazan Bayramı kaç gün sürer?",
            "options": ["1 gün", "2 gün", "3 gün", "4 gün"],
            "correct_answer": 2,
            "explanation": "Ramazan Bayramı (Şeker Bayramı) 3 gün sürer ve Şevval ayının ilk üç günüdür.",
            "source": "İslami Takvim",
            "difficulty": "easy"
        },
        {
            "question": "Teravih namazı kaç rekattır?",
            "options": ["8 rekat", "12 rekat", "20 rekat", "8 veya 20 rekat"],
            "correct_answer": 3,
            "explanation": "Teravih namazı Hanefi mezhebine göre 20 rekat, bazı mezheplere göre 8 rekattır. Her iki uygulama da caizdir.",
            "source": "Buhârî, Teheccüd; Tirmizî, Salât",
            "difficulty": "medium"
        },
        {
            "question": "Fitre (Sadaka-i Fıtr) ne zaman verilmelidir?",
            "options": ["Ramazan başında", "Ramazan ortasında", "Bayram namazından önce", "Bayramdan sonra"],
            "correct_answer": 2,
            "explanation": "Fitre, bayram namazından önce verilmelidir. Bayram namazından sonra verilen fitre, normal sadaka hükmündedir.",
            "source": "Buhârî, Zekât; Müslim, Zekât",
            "difficulty": "medium"
        },
        {
            "question": "Oruçlu iken misvak kullanmak orucu bozar mı?",
            "options": ["Evet, bozar", "Hayır, bozmaz", "Sadece öğleden sonra bozar", "Sadece ikindiden sonra bozar"],
            "correct_answer": 1,
            "explanation": "Misvak kullanmak orucu bozmaz. Peygamberimiz (s.a.v.) oruçlu iken de misvak kullanmıştır.",
            "source": "Buhârî, Savm; Tirmizî, Savm",
            "difficulty": "easy"
        },
        {
            "question": "İtikaf ne demektir?",
            "options": ["Hac ibadeti", "Camide ibadet için kalmak", "Zekat vermek", "Kurban kesmek"],
            "correct_answer": 1,
            "explanation": "İtikaf, ibadet niyetiyle camide kalmaktır. Özellikle Ramazan'ın son on gününde yapılması sünnettir.",
            "source": "Buhârî, İ'tikâf; Müslim, İ'tikâf",
            "difficulty": "medium"
        },
        {
            "question": "Ramazan ayında hangi gece bin aydan hayırlıdır?",
            "options": ["İlk gece", "15. gece", "Kadir Gecesi", "Son gece"],
            "correct_answer": 2,
            "explanation": "Kadir Gecesi bin aydan hayırlıdır. 'Kadir gecesi bin aydan hayırlıdır.' (Kadir Suresi, 3)",
            "source": "Kadir Suresi, 3. Ayet",
            "difficulty": "easy"
        }
    ],
    "namaz": [
        {
            "question": "Günde kaç vakit namaz farzdır?",
            "options": ["3 vakit", "4 vakit", "5 vakit", "6 vakit"],
            "correct_answer": 2,
            "explanation": "Günde 5 vakit namaz farzdır: Sabah, Öğle, İkindi, Akşam ve Yatsı.",
            "source": "Nisa Suresi, 103. Ayet; Buhârî, Mevâkît",
            "difficulty": "easy"
        },
        {
            "question": "Sabah namazının farzı kaç rekattır?",
            "options": ["2 rekat", "3 rekat", "4 rekat", "1 rekat"],
            "correct_answer": 0,
            "explanation": "Sabah namazının farzı 2 rekattır. Toplamda 4 rekat (2 sünnet + 2 farz) kılınır.",
            "source": "Buhârî, Mevâkît",
            "difficulty": "easy"
        },
        {
            "question": "Abdest alırken yıkanması farz olan uzuvlar kaç tanedir?",
            "options": ["3", "4", "5", "6"],
            "correct_answer": 1,
            "explanation": "Abdestin farzları 4'tür: Yüzü yıkamak, kolları dirseklerle beraber yıkamak, başın dörtte birini meshetmek, ayakları topuklarla beraber yıkamak.",
            "source": "Maide Suresi, 6. Ayet",
            "difficulty": "medium"
        },
        {
            "question": "Namazda Fatiha Suresi okunması hangi hükümdedir?",
            "options": ["Sünnet", "Vacip", "Farz", "Mekruh"],
            "correct_answer": 2,
            "explanation": "Namazda Fatiha Suresi okumak farzdır. Peygamberimiz (s.a.v.): 'Fatiha'sız namaz olmaz' buyurmuştur.",
            "source": "Buhârî, Ezan; Müslim, Salât",
            "difficulty": "medium"
        },
        {
            "question": "Cuma namazı kimlere farzdır?",
            "options": ["Sadece erkeklere", "Sadece kadınlara", "Herkese", "Sadece yaşlılara"],
            "correct_answer": 0,
            "explanation": "Cuma namazı, hür, akıl baliğ, mukim (yolcu olmayan), sağlıklı erkeklere farzdır.",
            "source": "Cuma Suresi, 9. Ayet",
            "difficulty": "medium"
        },
        {
            "question": "Secdede hangi uzuvların yere değmesi gerekir?",
            "options": ["Sadece alın", "Alın ve burun", "7 uzuv", "5 uzuv"],
            "correct_answer": 2,
            "explanation": "Secdede 7 uzuv yere değmelidir: Alın, iki el, iki diz, iki ayağın parmakları.",
            "source": "Buhârî, Ezan; Müslim, Salât",
            "difficulty": "hard"
        },
        {
            "question": "Vitir namazı hangi vakitte kılınır?",
            "options": ["Sabah namazından önce", "Öğle namazından sonra", "Yatsı namazından sonra", "Akşam namazından sonra"],
            "correct_answer": 2,
            "explanation": "Vitir namazı, yatsı namazından sonra kılınır ve Hanefi mezhebine göre vaciptir.",
            "source": "Tirmizî, Vitr; Ebû Dâvûd, Vitr",
            "difficulty": "easy"
        },
        {
            "question": "Namazı bozan durumlardan hangisi doğrudur?",
            "options": ["Sessiz gülmek", "Yüksek sesle konuşmak", "Gözleri yummak", "Secdeyi uzatmak"],
            "correct_answer": 1,
            "explanation": "Namazda kasıtlı olarak konuşmak namazı bozar. Sessiz gülmek ise sadece abdesti bozar.",
            "source": "Hanefi Fıkhı",
            "difficulty": "medium"
        },
        {
            "question": "Tahiyyat duası namazın hangi bölümünde okunur?",
            "options": ["Kıyamda", "Rükûda", "Secdede", "Oturuşta (Ka'de)"],
            "correct_answer": 3,
            "explanation": "Tahiyyat duası, namazın oturuş (ka'de) bölümünde okunur.",
            "source": "Buhârî, Ezan; Müslim, Salât",
            "difficulty": "easy"
        },
        {
            "question": "Seferîlik (yolculuk) durumunda 4 rekatlık farz namazlar kaç rekat kılınır?",
            "options": ["4 rekat", "3 rekat", "2 rekat", "1 rekat"],
            "correct_answer": 2,
            "explanation": "Seferî olan kişi, 4 rekatlık farz namazları 2 rekat olarak kılar (kasr).",
            "source": "Nisa Suresi, 101. Ayet",
            "difficulty": "medium"
        }
    ],
    "hadis": [
        {
            "question": "'Ameller niyetlere göredir' hadisini rivayet eden sahabi kimdir?",
            "options": ["Hz. Ebu Hureyre", "Hz. Ömer", "Hz. Ali", "Hz. Aişe"],
            "correct_answer": 1,
            "explanation": "Bu meşhur hadis, Hz. Ömer (r.a.) tarafından rivayet edilmiştir ve Buhârî'nin ilk hadisidir.",
            "source": "Buhârî, Bed'ü'l-Vahy, 1",
            "difficulty": "medium"
        },
        {
            "question": "En çok hadis rivayet eden sahabi kimdir?",
            "options": ["Hz. Ömer", "Hz. Aişe", "Hz. Ebu Hureyre", "Hz. İbn Abbas"],
            "correct_answer": 2,
            "explanation": "Hz. Ebu Hureyre (r.a.), 5374 hadis ile en çok hadis rivayet eden sahabidir.",
            "source": "Hadis İlmi",
            "difficulty": "easy"
        },
        {
            "question": "Kütüb-i Sitte (Altı Hadis Kitabı) hangisini içermez?",
            "options": ["Buhârî", "Müslim", "Muvatta", "Nesâî"],
            "correct_answer": 2,
            "explanation": "Kütüb-i Sitte: Buhârî, Müslim, Tirmizî, Ebû Dâvûd, Nesâî, İbn Mâce'dir. Muvatta, İmam Malik'in eseridir.",
            "source": "Hadis İlmi",
            "difficulty": "hard"
        },
        {
            "question": "'Müslüman, elinden ve dilinden Müslümanların güvende olduğu kimsedir' hadisi hangi konuyla ilgilidir?",
            "options": ["İman", "İbadet", "Ahlak", "Ticaret"],
            "correct_answer": 2,
            "explanation": "Bu hadis, güzel ahlak ve toplumsal yaşam hakkındadır.",
            "source": "Buhârî, İman; Müslim, İman",
            "difficulty": "easy"
        },
        {
            "question": "Peygamberimizin veda hutbesini okuduğu yer neresidir?",
            "options": ["Medine", "Mekke", "Arafat", "Mina"],
            "correct_answer": 2,
            "explanation": "Peygamberimiz (s.a.v.) veda hutbesini Arafat'ta okumuştur.",
            "source": "Müslim, Hac",
            "difficulty": "medium"
        },
        {
            "question": "'Din nasihattir' hadisinde nasihat kimlere yapılmalıdır?",
            "options": ["Sadece Allah'a", "Sadece insanlara", "Allah'a, Kitabına, Peygamberine ve Müslümanlara", "Sadece yöneticilere"],
            "correct_answer": 2,
            "explanation": "Hadiste nasihat: Allah'a, Kitabına, Rasulüne, Müslümanların imamlarına ve geneline yapılır.",
            "source": "Müslim, İman",
            "difficulty": "medium"
        },
        {
            "question": "Hadis ilminde 'Sahih' ne anlama gelir?",
            "options": ["Zayıf hadis", "Güvenilir hadis", "Uydurma hadis", "Mürsel hadis"],
            "correct_answer": 1,
            "explanation": "Sahih hadis, senedi kesintisiz, ravileri güvenilir ve metni şaz olmayan hadistir.",
            "source": "Hadis Usulü İlmi",
            "difficulty": "easy"
        },
        {
            "question": "'Kolaylaştırın, zorlaştırmayın' hadisi hangi ilkeyi vurgular?",
            "options": ["Dinde zorlama", "Dinde kolaylık", "Dinde sertlik", "Dinde gevşeklik"],
            "correct_answer": 1,
            "explanation": "Bu hadis, İslam'ın kolaylık dini olduğunu ve zorlaştırmamayı emreder.",
            "source": "Buhârî, İlim; Müslim, Cihad",
            "difficulty": "easy"
        },
        {
            "question": "Peygamberimizin en uzun hadisi hangisidir?",
            "options": ["Cibril hadisi", "Veda hutbesi", "Burak hadisi", "İsra hadisi"],
            "correct_answer": 0,
            "explanation": "Cibril hadisi (İman, İslam ve İhsan hadisi) Peygamberimizin en kapsamlı hadislerinden biridir.",
            "source": "Müslim, İman",
            "difficulty": "hard"
        },
        {
            "question": "'Temizlik imanın yarısıdır' hadisi neyi vurgular?",
            "options": ["Sadece beden temizliği", "Sadece kalp temizliği", "Hem beden hem kalp temizliği", "Sadece elbise temizliği"],
            "correct_answer": 2,
            "explanation": "Bu hadis hem maddi (beden, elbise, mekan) hem de manevi (kalp, niyet) temizliği kapsar.",
            "source": "Müslim, Tahâret",
            "difficulty": "medium"
        }
    ],
    "tefsir": [
        {
            "question": "Kur'an-ı Kerim kaç sureden oluşur?",
            "options": ["100", "110", "114", "120"],
            "correct_answer": 2,
            "explanation": "Kur'an-ı Kerim 114 sureden oluşmaktadır.",
            "source": "Kur'an-ı Kerim",
            "difficulty": "easy"
        },
        {
            "question": "İlk inen ayet hangisidir?",
            "options": ["Fatiha Suresi", "Alak Suresi 1-5", "Bakara Suresi", "Müddesir Suresi"],
            "correct_answer": 1,
            "explanation": "'Oku! Yaratan Rabbinin adıyla oku!' (Alak Suresi 1-5) ilk inen ayetlerdir.",
            "source": "Alak Suresi, 1-5; Buhârî, Bed'ü'l-Vahy",
            "difficulty": "easy"
        },
        {
            "question": "En uzun sure hangisidir?",
            "options": ["Fatiha", "Bakara", "Al-i İmran", "Nisa"],
            "correct_answer": 1,
            "explanation": "Bakara Suresi 286 ayetle Kur'an'ın en uzun suresidir.",
            "source": "Kur'an-ı Kerim, Bakara Suresi",
            "difficulty": "easy"
        },
        {
            "question": "Kur'an'da adı geçen tek kadın sahabi kimdir?",
            "options": ["Hz. Hatice", "Hz. Aişe", "Hz. Meryem", "Hz. Fatıma"],
            "correct_answer": 2,
            "explanation": "Hz. Meryem, Kur'an'da adı geçen tek kadındır ve bir sure de onun adıyla anılır (Meryem Suresi).",
            "source": "Meryem Suresi",
            "difficulty": "medium"
        },
        {
            "question": "Ayetel Kürsi hangi surede yer alır?",
            "options": ["Fatiha", "Bakara", "Al-i İmran", "Nisa"],
            "correct_answer": 1,
            "explanation": "Ayetel Kürsi, Bakara Suresi'nin 255. ayetidir.",
            "source": "Bakara Suresi, 255. Ayet",
            "difficulty": "easy"
        },
        {
            "question": "Besmele ile başlamayan sure hangisidir?",
            "options": ["Fatiha", "Bakara", "Tevbe", "İhlas"],
            "correct_answer": 2,
            "explanation": "Tevbe Suresi besmele ile başlamaz. Bunun sebebi hakkında farklı rivayetler vardır.",
            "source": "Tevbe Suresi",
            "difficulty": "medium"
        },
        {
            "question": "Kur'an'da kaç cüz vardır?",
            "options": ["20", "25", "30", "40"],
            "correct_answer": 2,
            "explanation": "Kur'an-ı Kerim 30 cüze ayrılmıştır.",
            "source": "Kur'an-ı Kerim",
            "difficulty": "easy"
        },
        {
            "question": "'Elif Lam Mim' gibi harflere ne denir?",
            "options": ["Ayet", "Sure", "Huruf-u Mukattaa", "Cüz"],
            "correct_answer": 2,
            "explanation": "Bazı surelerin başındaki kesik harflere 'Huruf-u Mukattaa' denir. Anlamları Allah'a mahsustur.",
            "source": "Tefsir İlmi",
            "difficulty": "hard"
        },
        {
            "question": "Son inen sure hangisidir?",
            "options": ["Bakara", "Maide", "Nasr", "Fatiha"],
            "correct_answer": 2,
            "explanation": "Nasr Suresi, en son inen surelerden biridir ve veda suresi olarak da bilinir.",
            "source": "Nasr Suresi; Tefsir Kaynakları",
            "difficulty": "medium"
        },
        {
            "question": "Kur'an'da en çok tekrar edilen kıssa hangisidir?",
            "options": ["Hz. Adem", "Hz. Musa", "Hz. İsa", "Hz. İbrahim"],
            "correct_answer": 1,
            "explanation": "Hz. Musa (a.s.) kıssası Kur'an'da en çok tekrar edilen kıssadır.",
            "source": "Kur'an-ı Kerim",
            "difficulty": "medium"
        }
    ],
    "fikih": [
        {
            "question": "İslam'ın şartları kaç tanedir?",
            "options": ["4", "5", "6", "7"],
            "correct_answer": 1,
            "explanation": "İslam'ın 5 şartı: Kelime-i şehadet, namaz, oruç, zekat ve hacdır.",
            "source": "Buhârî, İman; Müslim, İman",
            "difficulty": "easy"
        },
        {
            "question": "Zekat nisabı altın için ne kadardır?",
            "options": ["20 gr", "40 gr", "80.18 gr", "100 gr"],
            "correct_answer": 2,
            "explanation": "Altının zekat nisabı 20 miskal, yani yaklaşık 80.18 gramdır.",
            "source": "Hanefi Fıkhı",
            "difficulty": "hard"
        },
        {
            "question": "Hac ibadeti kimlere farzdır?",
            "options": ["Tüm Müslümanlara", "Sadece erkeklere", "Gücü yeten Müslümanlara", "Sadece zenginlere"],
            "correct_answer": 2,
            "explanation": "Hac, maddi ve bedeni gücü yerinde olan her Müslümana ömürde bir kez farzdır.",
            "source": "Al-i İmran Suresi, 97. Ayet",
            "difficulty": "easy"
        },
        {
            "question": "Dört büyük mezhep imamından hangisi en erken yaşamıştır?",
            "options": ["İmam Şafii", "İmam Ebu Hanife", "İmam Malik", "İmam Ahmed b. Hanbel"],
            "correct_answer": 1,
            "explanation": "İmam Ebu Hanife (699-767) dört mezhep imamının en eskisidir.",
            "source": "İslam Tarihi",
            "difficulty": "medium"
        },
        {
            "question": "Hanefi mezhebinin kurucusu kimdir?",
            "options": ["İmam Malik", "İmam Şafii", "İmam Ebu Hanife", "İmam Ahmed"],
            "correct_answer": 2,
            "explanation": "Hanefi mezhebinin kurucusu İmam-ı Azam Ebu Hanife'dir.",
            "source": "Fıkıh Tarihi",
            "difficulty": "easy"
        },
        {
            "question": "Kurban bayramında kurban kesmek hangi hükümdedir?",
            "options": ["Farz", "Vacip", "Sünnet", "Mübah"],
            "correct_answer": 1,
            "explanation": "Hanefi mezhebine göre kurban kesmek vacip, diğer mezheplere göre müekked sünnettir.",
            "source": "Hanefi Fıkhı",
            "difficulty": "medium"
        },
        {
            "question": "Namaz kılabilmek için gerekli şartlardan değildir?",
            "options": ["Abdestli olmak", "Kıbleye dönmek", "Cemaate katılmak", "Setr-i avret"],
            "correct_answer": 2,
            "explanation": "Cemaate katılmak sünnet-i müekkededir, namazın sıhhat şartı değildir.",
            "source": "Fıkıh İlmi",
            "difficulty": "medium"
        },
        {
            "question": "Hangi durumda teyemmüm alınır?",
            "options": ["Su varken", "Temiz su yokken", "Her zaman", "Sadece Cuma namazında"],
            "correct_answer": 1,
            "explanation": "Su bulunamadığında veya kullanılamadığında teyemmüm alınır.",
            "source": "Maide Suresi, 6. Ayet",
            "difficulty": "easy"
        },
        {
            "question": "Gusül abdesti ne zaman farz olur?",
            "options": ["Her gün", "Cünüplük halinde", "Her namaz öncesi", "Sadece Cuma günü"],
            "correct_answer": 1,
            "explanation": "Cünüplük, hayız ve nifas durumlarında gusül abdesti almak farzdır.",
            "source": "Maide Suresi, 6. Ayet",
            "difficulty": "easy"
        },
        {
            "question": "Fıkıhta 'mübah' ne demektir?",
            "options": ["Yapılması günah", "Yapılması sevap", "Yapılıp yapılmaması serbest", "Yapılması farz"],
            "correct_answer": 2,
            "explanation": "Mübah, yapılıp yapılmaması dinen serbest olan fiillerdir.",
            "source": "Fıkıh Usulü",
            "difficulty": "easy"
        }
    ]
}

# Convert to list format with IDs
def get_questions_for_category(category: str) -> List[Dict]:
    questions = QUIZ_QUESTIONS.get(category, [])
    result = []
    for i, q in enumerate(questions):
        result.append({
            "id": f"{category}_{i}",
            "category": category,
            "question": q["question"],
            "options": q["options"],
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"],
            "source": q["source"],
            "difficulty": q.get("difficulty", "medium"),
            "points": 10 if q.get("difficulty") == "easy" else (15 if q.get("difficulty") == "medium" else 20)
        })
    return result

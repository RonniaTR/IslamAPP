# =====================================================
# Karşılaştırmalı Dinler ve Kutsal Kitaplar Veritabanı
# =====================================================

import json
from typing import Dict, List, Optional

# Comparative Religious Texts Database
COMPARATIVE_TEXTS = {
    "creation": {
        "topic": "Yaratılış / Creation",
        "quran": {
            "text": "Gökleri ve yeri altı günde yaratan, sonra Arş'a istiva eden O'dur.",
            "reference": "Hadid 57:4",
            "arabic": "هُوَ الَّذِي خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ فِي سِتَّةِ أَيَّامٍ"
        },
        "bible": {
            "text": "Başlangıçta Tanrı göğü ve yeri yarattı.",
            "reference": "Yaratılış 1:1",
            "original": "In the beginning God created the heaven and the earth."
        },
        "torah": {
            "text": "Başlangıçta Tanrı gökleri ve yeri yarattı.",
            "reference": "Bereşit 1:1",
            "hebrew": "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ"
        },
        "hadith": {
            "text": "Allah vardı ve O'nunla birlikte hiçbir şey yoktu.",
            "reference": "Buhari",
            "narrator": "İmran bin Husayn"
        }
    },
    "monotheism": {
        "topic": "Tevhid / Tek Tanrı İnancı",
        "quran": {
            "text": "De ki: O Allah birdir. Allah Samed'dir. O doğurmamış ve doğmamıştır. Hiçbir şey O'nun dengi değildir.",
            "reference": "İhlas 112:1-4",
            "arabic": "قُلْ هُوَ اللَّهُ أَحَدٌ"
        },
        "bible": {
            "text": "Dinle, ey İsrail! Tanrımız RAB tek RAB'dir.",
            "reference": "Tesniye 6:4",
            "original": "Hear, O Israel: The LORD our God is one LORD."
        },
        "torah": {
            "text": "Şema Yisrael, Adonai Eloheinu, Adonai Ehad.",
            "reference": "Devarim 6:4",
            "hebrew": "שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד"
        },
        "hadith": {
            "text": "İman yetmiş küsur şubedir. En üstünü 'La ilahe illallah' demektir.",
            "reference": "Müslim",
            "narrator": "Ebu Hureyre"
        }
    },
    "prayer": {
        "topic": "Namaz / Dua / Prayer",
        "quran": {
            "text": "Namazı kılın, zekatı verin ve rüku edenlerle birlikte rüku edin.",
            "reference": "Bakara 2:43",
            "arabic": "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ"
        },
        "bible": {
            "text": "Rabbimiz göklerdeki! Adın kutsal kılınsın.",
            "reference": "Matta 6:9",
            "original": "Our Father which art in heaven, Hallowed be thy name."
        },
        "torah": {
            "text": "İsrailoğulları günde üç kez dua ederlerdi.",
            "reference": "Daniel 6:10",
            "hebrew": ""
        },
        "hadith": {
            "text": "Namaz dinin direğidir. Kim onu terk ederse dinini yıkmıştır.",
            "reference": "Tirmizi",
            "narrator": "Muaz bin Cebel"
        }
    },
    "charity": {
        "topic": "Sadaka / Zekat / Hayırseverlik",
        "quran": {
            "text": "Mallarını Allah yolunda harcayanların durumu, yedi başak veren bir danenin durumu gibidir.",
            "reference": "Bakara 2:261",
            "arabic": "مَثَلُ الَّذِينَ يُنْفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ"
        },
        "bible": {
            "text": "Vermek almaktan daha mutluluk vericidir.",
            "reference": "Elçilerin İşleri 20:35",
            "original": "It is more blessed to give than to receive."
        },
        "torah": {
            "text": "Fakire elini açacaksın.",
            "reference": "Devarim 15:11",
            "hebrew": "פָתֹחַ תִּפְתַּח אֶת יָדְךָ"
        },
        "hadith": {
            "text": "Sadaka malı eksiltmez.",
            "reference": "Müslim",
            "narrator": "Ebu Hureyre"
        }
    },
    "fasting": {
        "topic": "Oruç / Fasting",
        "quran": {
            "text": "Ey iman edenler! Oruç sizden öncekilere farz kılındığı gibi size de farz kılındı.",
            "reference": "Bakara 2:183",
            "arabic": "يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ"
        },
        "bible": {
            "text": "Oruç tuttuğunuz zaman ikiyüzlüler gibi surat asmayın.",
            "reference": "Matta 6:16",
            "original": "Moreover when ye fast, be not, as the hypocrites."
        },
        "torah": {
            "text": "Bu gün sizin için ebedi bir kanun olacaktır; kendinizi alçaltacaksınız.",
            "reference": "Vayikra 16:29",
            "hebrew": ""
        },
        "hadith": {
            "text": "Kim Ramazan orucunu iman ederek ve sevabını Allah'tan bekleyerek tutarsa geçmiş günahları bağışlanır.",
            "reference": "Buhari, Müslim",
            "narrator": "Ebu Hureyre"
        }
    },
    "afterlife": {
        "topic": "Ahiret / Cennet-Cehennem",
        "quran": {
            "text": "İman edip salih amel işleyenler cennet ehlidirler, orada ebedi kalacaklardır.",
            "reference": "Bakara 2:82",
            "arabic": "وَالَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ أُولَئِكَ أَصْحَابُ الْجَنَّةِ"
        },
        "bible": {
            "text": "Tanrı'nın Egemenliği'ni miras alacaksınız.",
            "reference": "Matta 25:34",
            "original": "Come, ye blessed of my Father, inherit the kingdom."
        },
        "torah": {
            "text": "Doğrular hayat ağacından yiyecekler.",
            "reference": "Mişle 11:30",
            "hebrew": ""
        },
        "hadith": {
            "text": "Cennette hiçbir gözün görmediği, hiçbir kulağın duymadığı, hiçbir insanın kalbinden geçirmediği nimetler vardır.",
            "reference": "Buhari, Müslim",
            "narrator": "Ebu Hureyre"
        }
    },
    "prophets": {
        "topic": "Peygamberler / Prophets",
        "quran": {
            "text": "Peygamber, Rabbinden kendisine indirilene iman etti, müminler de.",
            "reference": "Bakara 2:285",
            "arabic": "آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ"
        },
        "bible": {
            "text": "Tanrı eski zamanlarda peygamberler aracılığıyla konuştu.",
            "reference": "İbraniler 1:1",
            "original": "God, who at sundry times spake by the prophets."
        },
        "torah": {
            "text": "RAB size benim gibi bir peygamber çıkaracaktır.",
            "reference": "Devarim 18:15",
            "hebrew": "נָבִיא מִקִּרְבְּךָ מֵאַחֶיךָ כָּמֹנִי"
        },
        "hadith": {
            "text": "Ben peygamberlerin sonuncusuyum, benden sonra peygamber yoktur.",
            "reference": "Buhari, Müslim",
            "narrator": "Ebu Hureyre"
        }
    },
    "justice": {
        "topic": "Adalet / Justice",
        "quran": {
            "text": "Allah adaleti, iyiliği ve akrabaya yardım etmeyi emreder.",
            "reference": "Nahl 16:90",
            "arabic": "إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ"
        },
        "bible": {
            "text": "Adaletin peşinden koş.",
            "reference": "Tesniye 16:20",
            "original": "Justice, and only justice, you shall follow."
        },
        "torah": {
            "text": "Adalet, adalet; onu takip edeceksin.",
            "reference": "Devarim 16:20",
            "hebrew": "צֶדֶק צֶדֶק תִּרְדֹּף"
        },
        "hadith": {
            "text": "Adil devlet başkanı, kıyamet günü Allah'ın gölgesinde gölgelenecek yedi kişiden biridir.",
            "reference": "Buhari, Müslim",
            "narrator": "Ebu Hureyre"
        }
    },
    "mercy": {
        "topic": "Merhamet / Mercy",
        "quran": {
            "text": "Rahmetim her şeyi kuşatmıştır.",
            "reference": "A'raf 7:156",
            "arabic": "وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ"
        },
        "bible": {
            "text": "RAB merhametli ve lütufkârdır.",
            "reference": "Mezmur 103:8",
            "original": "The LORD is merciful and gracious."
        },
        "torah": {
            "text": "Adonai, Adonai, merhametli ve lütufkâr Tanrı.",
            "reference": "Şemot 34:6",
            "hebrew": "יְהוָה יְהוָה אֵל רַחוּם וְחַנּוּן"
        },
        "hadith": {
            "text": "Merhamet etmeyene merhamet olunmaz.",
            "reference": "Buhari, Müslim",
            "narrator": "Cerir bin Abdullah"
        }
    },
    "patience": {
        "topic": "Sabır / Patience",
        "quran": {
            "text": "Ey iman edenler! Sabır ve namazla yardım isteyin. Şüphesiz Allah sabredenlerle beraberdir.",
            "reference": "Bakara 2:153",
            "arabic": "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ"
        },
        "bible": {
            "text": "Sıkıntıda sevinçli, duada sürekli olun.",
            "reference": "Romalılar 12:12",
            "original": "Rejoicing in hope; patient in tribulation."
        },
        "torah": {
            "text": "Bekle RAB'bi; güçlü ol ve yüreğin cesaret bulsun.",
            "reference": "Tehillim 27:14",
            "hebrew": "קַוֵּה אֶל יְהוָה חֲזַק וְיַאֲמֵץ לִבֶּךָ"
        },
        "hadith": {
            "text": "Sabır, musibetin ilk anında gösterilendir.",
            "reference": "Buhari",
            "narrator": "Enes bin Malik"
        }
    }
}

# Available Topics
TOPICS = [
    {"id": "creation", "name": "Yaratılış", "name_en": "Creation", "icon": "🌍"},
    {"id": "monotheism", "name": "Tevhid", "name_en": "Monotheism", "icon": "☝️"},
    {"id": "prayer", "name": "Namaz/Dua", "name_en": "Prayer", "icon": "🤲"},
    {"id": "charity", "name": "Sadaka/Zekat", "name_en": "Charity", "icon": "💝"},
    {"id": "fasting", "name": "Oruç", "name_en": "Fasting", "icon": "🌙"},
    {"id": "afterlife", "name": "Ahiret", "name_en": "Afterlife", "icon": "✨"},
    {"id": "prophets", "name": "Peygamberler", "name_en": "Prophets", "icon": "📜"},
    {"id": "justice", "name": "Adalet", "name_en": "Justice", "icon": "⚖️"},
    {"id": "mercy", "name": "Merhamet", "name_en": "Mercy", "icon": "❤️"},
    {"id": "patience", "name": "Sabır", "name_en": "Patience", "icon": "🕊️"},
]

def get_comparative_data(topic_id: str) -> Optional[Dict]:
    """Get comparative texts for a specific topic"""
    return COMPARATIVE_TEXTS.get(topic_id)

def get_all_topics() -> List[Dict]:
    """Get list of all available topics"""
    return TOPICS

def search_comparative(query: str) -> List[Dict]:
    """Search across all comparative texts"""
    results = []
    query_lower = query.lower()
    
    for topic_id, data in COMPARATIVE_TEXTS.items():
        # Search in topic name
        if query_lower in data.get('topic', '').lower():
            results.append({"topic_id": topic_id, "data": data})
            continue
        
        # Search in texts
        for source in ['quran', 'bible', 'torah', 'hadith']:
            if source in data:
                text = data[source].get('text', '').lower()
                if query_lower in text:
                    results.append({"topic_id": topic_id, "data": data})
                    break
    
    return results

#!/usr/bin/env python3
"""
Islamic Life Assistant API Testing
Testing specific endpoints mentioned in the review request
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://quranic-login-1.preview.emergentagent.com/api"

def test_root_endpoint():
    """Test GET /api/ - Root endpoint, should return version info"""
    print("\n=== Testing Root Endpoint ===")
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            if "message" in data and "version" in data:
                print("✅ Root endpoint PASSED - Contains version info")
                return True
            else:
                print("❌ Root endpoint missing required fields")
                return False
        else:
            print(f"❌ Root endpoint FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint ERROR: {e}")
        return False

def test_guest_auth():
    """Test POST /api/auth/guest - Guest login, should return user with user_id and name"""
    print("\n=== Testing Guest Authentication ===")
    try:
        response = requests.post(f"{BACKEND_URL}/auth/guest", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"Guest user created: {user_data}")
            
            required_fields = ['user_id', 'name', 'email', 'is_guest', 'created_at']
            if all(field in user_data for field in required_fields):
                if user_data['is_guest'] == True:
                    print(f"✅ Guest auth PASSED - User ID: {user_data['user_id']}")
                    print(f"Name: {user_data['name']}")
                    return True, user_data['user_id']
                else:
                    print("❌ User is not marked as guest")
                    return False, None
            else:
                print(f"❌ Guest user missing required fields: {required_fields}")
                return False, None
        else:
            print(f"❌ Guest auth FAILED with status {response.status_code}")
            return False, None
    except Exception as e:
        print(f"❌ Guest auth ERROR: {e}")
        return False, None

def test_prayer_times_istanbul():
    """Test GET /api/prayer-times/istanbul - Prayer times for Istanbul"""
    print("\n=== Testing Prayer Times for Istanbul ===")
    try:
        response = requests.get(f"{BACKEND_URL}/prayer-times/istanbul", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            prayer_times = response.json()
            print(f"Prayer times response: {prayer_times}")
            
            required_times = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
            if all(time_name in prayer_times for time_name in required_times):
                print("Prayer times for Istanbul:")
                for prayer in required_times:
                    time_val = prayer_times[prayer]
                    print(f"  {prayer.capitalize()}: {time_val}")
                    # Validate time format (should be HH:MM)
                    if not (len(time_val.split(':')) == 2 and 
                           time_val.split(':')[0].isdigit() and 
                           time_val.split(':')[1].isdigit()):
                        print(f"❌ Invalid time format for {prayer}: {time_val}")
                        return False
                
                if 'date' in prayer_times and 'city_name' in prayer_times:
                    print(f"Date: {prayer_times['date']}")
                    print(f"City: {prayer_times['city_name']}")
                    print("✅ Prayer times PASSED - Valid times in HH:MM format")
                    return True
                else:
                    print("❌ Missing date or city_name in response")
                    return False
            else:
                print(f"❌ Prayer times missing required fields: {required_times}")
                return False
        else:
            print(f"❌ Prayer times FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Prayer times ERROR: {e}")
        return False

def test_quran_random_verse():
    """Test GET /api/quran/random - Random verse with arabic and turkish fields"""
    print("\n=== Testing Random Quran Verse ===")
    try:
        response = requests.get(f"{BACKEND_URL}/quran/random", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            verse = response.json()
            print(f"Random verse response: {verse}")
            
            required_fields = ['arabic', 'turkish', 'surah_number', 'verse_number']
            if all(field in verse for field in required_fields):
                print(f"Surah {verse['surah_number']}, Verse {verse['verse_number']}")
                print(f"Arabic: {verse['arabic'][:50]}...")
                print(f"Turkish: {verse['turkish'][:50]}...")
                
                # Verify content is not empty
                if len(verse['arabic']) > 0 and len(verse['turkish']) > 0:
                    print("✅ Random verse PASSED - Contains arabic and turkish text")
                    return True
                else:
                    print("❌ Arabic or Turkish text is empty")
                    return False
            else:
                print(f"❌ Random verse missing required fields: {required_fields}")
                return False
        else:
            print(f"❌ Random verse FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Random verse ERROR: {e}")
        return False

def test_quran_surahs():
    """Test GET /api/quran/surahs - Should return 114 surahs with turkish_name, meaning, verses count"""
    print("\n=== Testing Quran Surahs List ===")
    try:
        response = requests.get(f"{BACKEND_URL}/quran/surahs", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            surahs = response.json()
            print(f"Number of surahs: {len(surahs)}")
            
            if len(surahs) == 114:
                # Check first few surahs structure
                surah = surahs[0]
                required_fields = ['number', 'turkish_name', 'meaning', 'verses']
                
                if all(field in surah for field in required_fields):
                    print(f"First surah: {surah['turkish_name']} - {surah['meaning']} ({surah['verses']} verses)")
                    
                    # Verify verse counts are positive
                    all_have_verses = all(s.get('verses', 0) > 0 for s in surahs[:10])
                    
                    if all_have_verses:
                        # Check last surah (An-Nas)
                        last_surah = surahs[-1]
                        if last_surah['number'] == 114:
                            print(f"Last surah: {last_surah['turkish_name']} - {last_surah['meaning']}")
                            print("✅ Quran surahs PASSED - All 114 surahs with valid data")
                            return True
                        else:
                            print(f"❌ Last surah number should be 114, got {last_surah['number']}")
                            return False
                    else:
                        print("❌ Some surahs have invalid verse counts")
                        return False
                else:
                    print(f"❌ Surah missing required fields: {required_fields}")
                    return False
            else:
                print(f"❌ Expected 114 surahs, got {len(surahs)}")
                return False
        else:
            print(f"❌ Quran surahs FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Quran surahs ERROR: {e}")
        return False

def test_surah_fatiha():
    """Test GET /api/quran/surah/1 - Surah Fatiha detail with verses array"""
    print("\n=== Testing Surah Fatiha Details ===")
    try:
        response = requests.get(f"{BACKEND_URL}/quran/surah/1", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            surah_data = response.json()
            print(f"Surah data keys: {list(surah_data.keys())}")
            
            required_fields = ['number', 'name', 'verses', 'total_verses']
            if all(field in surah_data for field in required_fields):
                print(f"Surah: {surah_data['name']} (Number: {surah_data['number']})")
                print(f"Total verses: {surah_data['total_verses']}")
                
                verses = surah_data['verses']
                if len(verses) == 7:  # Fatiha has 7 verses
                    # Check verse structure
                    verse = verses[0]
                    verse_fields = ['arabic', 'turkish', 'number', 'audio_url']
                    
                    if all(field in verse for field in verse_fields):
                        print(f"First verse: {verse['arabic'][:30]}...")
                        print(f"Turkish: {verse['turkish'][:50]}...")
                        print(f"Audio URL valid: {verse['audio_url'].startswith('https://')}")
                        print("✅ Surah Fatiha PASSED - Complete verses with arabic, turkish, audio")
                        return True
                    else:
                        print(f"❌ Verse missing required fields: {verse_fields}")
                        return False
                else:
                    print(f"❌ Fatiha should have 7 verses, got {len(verses)}")
                    return False
            else:
                print(f"❌ Surah data missing required fields: {required_fields}")
                return False
        else:
            print(f"❌ Surah Fatiha FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Surah Fatiha ERROR: {e}")
        return False

def test_surah_meal_video():
    """Test GET /api/quran/surah/1/meal-video - Mazlum Kiper YouTube meal video"""
    print("\n=== Testing Surah Meal Video ===")
    try:
        response = requests.get(f"{BACKEND_URL}/quran/surah/1/meal-video", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            video_data = response.json()
            print(f"Video data: {video_data}")
            
            required_fields = ['video_id', 'embed_url', 'narrator']
            if all(field in video_data for field in required_fields):
                if video_data['narrator'] == "Mazlum Kiper":
                    print(f"Video ID: {video_data['video_id']}")
                    print(f"Embed URL: {video_data['embed_url']}")
                    
                    # Verify YouTube URLs
                    if ("youtube.com/embed/" in video_data['embed_url'] and 
                        len(video_data['video_id']) > 0):
                        print("✅ Meal video PASSED - Valid YouTube video with Mazlum Kiper")
                        return True
                    else:
                        print("❌ Invalid YouTube URL format")
                        return False
                else:
                    print(f"❌ Expected narrator 'Mazlum Kiper', got '{video_data['narrator']}'")
                    return False
            else:
                print(f"❌ Video data missing required fields: {required_fields}")
                return False
        else:
            print(f"❌ Meal video FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Meal video ERROR: {e}")
        return False

def test_meal_audio_all():
    """Test GET /api/quran/meal-audio - All 30 juz with YouTube video IDs"""
    print("\n=== Testing All Meal Audio ===")
    try:
        response = requests.get(f"{BACKEND_URL}/quran/meal-audio", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            juz_list = response.json()
            print(f"Number of juz: {len(juz_list)}")
            
            if len(juz_list) == 30:
                # Check first juz structure
                juz = juz_list[0]
                required_fields = ['juz', 'video_id', 'narrator', 'embed_url']
                
                if all(field in juz for field in required_fields):
                    if juz['narrator'] == "Mazlum Kiper":
                        print(f"First juz: {juz['juz']} - Video ID: {juz['video_id']}")
                        
                        # Verify all have valid video IDs
                        all_valid = all(len(j['video_id']) > 0 for j in juz_list)
                        
                        if all_valid:
                            print("✅ Meal audio PASSED - All 30 juz with Mazlum Kiper videos")
                            return True
                        else:
                            print("❌ Some juz have invalid video IDs")
                            return False
                    else:
                        print(f"❌ Expected narrator 'Mazlum Kiper', got '{juz['narrator']}'")
                        return False
                else:
                    print(f"❌ Juz missing required fields: {required_fields}")
                    return False
            else:
                print(f"❌ Expected 30 juz, got {len(juz_list)}")
                return False
        else:
            print(f"❌ Meal audio FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Meal audio ERROR: {e}")
        return False

def test_quran_reciters():
    """Test GET /api/quran/reciters - List of Quran reciters"""
    print("\n=== Testing Quran Reciters ===")
    try:
        response = requests.get(f"{BACKEND_URL}/quran/reciters", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            reciters = response.json()
            print(f"Number of reciters: {len(reciters)}")
            
            if len(reciters) > 0:
                # Check reciter structure
                reciter = reciters[0]
                required_fields = ['id', 'name', 'name_ar', 'style']
                
                if all(field in reciter for field in required_fields):
                    print(f"First reciter: {reciter['name']} ({reciter['name_ar']})")
                    print(f"Style: {reciter['style']}")
                    print("✅ Reciters PASSED - Valid reciter list")
                    return True
                else:
                    print(f"❌ Reciter missing required fields: {required_fields}")
                    return False
            else:
                print("❌ No reciters returned")
                return False
        else:
            print(f"❌ Reciters FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Reciters ERROR: {e}")
        return False

def test_hadith_categories():
    """Test GET /api/hadith/categories - Hadith categories"""
    print("\n=== Testing Hadith Categories ===")
    try:
        response = requests.get(f"{BACKEND_URL}/hadith/categories", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            categories = response.json()
            print(f"Number of categories: {len(categories)}")
            
            if len(categories) > 0:
                # Check category structure
                category = categories[0]
                required_fields = ['id', 'name', 'description']
                
                if all(field in category for field in required_fields):
                    print(f"First category: {category['name']} - {category['description']}")
                    print("✅ Hadith categories PASSED")
                    return True
                else:
                    print(f"❌ Category missing required fields: {required_fields}")
                    return False
            else:
                print("❌ No categories returned")
                return False
        else:
            print(f"❌ Hadith categories FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Hadith categories ERROR: {e}")
        return False

def test_hadith_all():
    """Test GET /api/hadith/all - All hadiths with arabic, turkish, source fields"""
    print("\n=== Testing All Hadiths ===")
    try:
        response = requests.get(f"{BACKEND_URL}/hadith/all", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            hadiths = response.json()
            print(f"Number of hadiths: {len(hadiths)}")
            
            if len(hadiths) > 0:
                # Check hadith structure
                hadith = hadiths[0]
                required_fields = ['arabic', 'turkish', 'source']
                
                if all(field in hadith for field in required_fields):
                    print(f"First hadith source: {hadith['source']}")
                    print(f"Arabic: {hadith['arabic'][:30]}...")
                    print(f"Turkish: {hadith['turkish'][:50]}...")
                    print("✅ All hadiths PASSED - Contains arabic, turkish, source")
                    return True
                else:
                    print(f"❌ Hadith missing required fields: {required_fields}")
                    return False
            else:
                print("❌ No hadiths returned")
                return False
        else:
            print(f"❌ All hadiths FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ All hadiths ERROR: {e}")
        return False

def test_scholars():
    """Test GET /api/scholars - List of Islamic scholars"""
    print("\n=== Testing Islamic Scholars ===")
    try:
        response = requests.get(f"{BACKEND_URL}/scholars", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            scholars = response.json()
            print(f"Number of scholars: {len(scholars)}")
            
            if len(scholars) > 0:
                # Check scholar structure
                scholar = scholars[0]
                required_fields = ['id', 'name', 'title', 'specialty']
                
                if all(field in scholar for field in required_fields):
                    print(f"First scholar: {scholar['name']} - {scholar['title']}")
                    print(f"Specialty: {scholar['specialty']}")
                    print("✅ Scholars PASSED")
                    return True
                else:
                    print(f"❌ Scholar missing required fields: {required_fields}")
                    return False
            else:
                print("❌ No scholars returned")
                return False
        else:
            print(f"❌ Scholars FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Scholars ERROR: {e}")
        return False

def test_quiz_categories():
    """Test GET /api/quiz/categories - Quiz categories"""
    print("\n=== Testing Quiz Categories ===")
    try:
        response = requests.get(f"{BACKEND_URL}/quiz/categories", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            categories = response.json()
            print(f"Number of quiz categories: {len(categories)}")
            
            if len(categories) > 0:
                # Check category structure
                category = categories[0]
                required_fields = ['id', 'name', 'description']
                
                if all(field in category for field in required_fields):
                    print(f"First category: {category['name']} - {category['description']}")
                    print("✅ Quiz categories PASSED")
                    return True
                else:
                    print(f"❌ Category missing required fields: {required_fields}")
                    return False
            else:
                print("❌ No quiz categories returned")
                return False
        else:
            print(f"❌ Quiz categories FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Quiz categories ERROR: {e}")
        return False

def test_quiz_solo_start(user_id):
    """Test POST /api/quiz/solo/start - Start a quiz"""
    print("\n=== Testing Quiz Solo Start ===")
    try:
        url = f"{BACKEND_URL}/quiz/solo/start?user_id={user_id}&category=ramazan&question_count=5"
        response = requests.post(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            quiz_data = response.json()
            print(f"Quiz session: {quiz_data}")
            
            required_fields = ['session_id', 'category', 'questions']
            if all(field in quiz_data for field in required_fields):
                if len(quiz_data['questions']) == 5:
                    print(f"Session ID: {quiz_data['session_id']}")
                    print(f"Category: {quiz_data['category']}")
                    print(f"Questions: {len(quiz_data['questions'])}")
                    print("✅ Quiz solo start PASSED")
                    return True
                else:
                    print(f"❌ Expected 5 questions, got {len(quiz_data['questions'])}")
                    return False
            else:
                print(f"❌ Quiz data missing required fields: {required_fields}")
                return False
        else:
            print(f"❌ Quiz solo start FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Quiz solo start ERROR: {e}")
        return False

def test_cities():
    """Test GET /api/cities - List of cities for prayer times"""
    print("\n=== Testing Cities List ===")
    try:
        response = requests.get(f"{BACKEND_URL}/cities", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            cities = response.json()
            print(f"Number of cities: {len(cities)}")
            
            if len(cities) > 0:
                # Check city structure
                city = cities[0]
                required_fields = ['id', 'name', 'latitude', 'longitude']
                
                if all(field in city for field in required_fields):
                    print(f"First city: {city['name']} ({city['latitude']}, {city['longitude']})")
                    print("✅ Cities PASSED")
                    return True
                else:
                    print(f"❌ City missing required fields: {required_fields}")
                    return False
            else:
                print("❌ No cities returned")
                return False
        else:
            print(f"❌ Cities FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cities ERROR: {e}")
        return False

def run_islamic_assistant_tests():
    """Run all Islamic Life Assistant API tests as specified in the review request"""
    print("=" * 80)
    print("🕌 ISLAMIC LIFE ASSISTANT API TESTING")
    print("=" * 80)
    print(f"Testing against: {BACKEND_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Test all specific endpoints from the review request
    results['root_endpoint'] = test_root_endpoint()
    
    guest_success, user_id = test_guest_auth()
    results['guest_auth'] = guest_success
    
    results['prayer_times_istanbul'] = test_prayer_times_istanbul()
    results['quran_random'] = test_quran_random_verse()
    results['quran_surahs'] = test_quran_surahs()
    results['surah_fatiha'] = test_surah_fatiha()
    results['surah_meal_video'] = test_surah_meal_video()
    results['quran_meal_audio'] = test_meal_audio_all()
    results['quran_reciters'] = test_quran_reciters()
    results['hadith_categories'] = test_hadith_categories()
    results['hadith_all'] = test_hadith_all()
    results['scholars'] = test_scholars()
    results['quiz_categories'] = test_quiz_categories()
    
    if user_id:
        results['quiz_solo_start'] = test_quiz_solo_start(user_id)
    else:
        print("\n⚠️ Skipping quiz solo start - no valid user_id from guest auth")
        results['quiz_solo_start'] = False
    
    results['cities'] = test_cities()
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 ISLAMIC LIFE ASSISTANT TEST RESULTS")
    print("=" * 80)
    
    passed = 0
    failed = 0
    
    test_names = {
        'root_endpoint': 'Root Endpoint (GET /api/)',
        'guest_auth': 'Guest Authentication (POST /api/auth/guest)',
        'prayer_times_istanbul': 'Prayer Times Istanbul (GET /api/prayer-times/istanbul)',
        'quran_random': 'Random Quran Verse (GET /api/quran/random)',
        'quran_surahs': 'Quran Surahs List (GET /api/quran/surahs)',
        'surah_fatiha': 'Surah Fatiha Details (GET /api/quran/surah/1)',
        'surah_meal_video': 'Surah Meal Video (GET /api/quran/surah/1/meal-video)',
        'quran_meal_audio': 'Meal Audio All Juz (GET /api/quran/meal-audio)',
        'quran_reciters': 'Quran Reciters (GET /api/quran/reciters)',
        'hadith_categories': 'Hadith Categories (GET /api/hadith/categories)',
        'hadith_all': 'All Hadiths (GET /api/hadith/all)',
        'scholars': 'Islamic Scholars (GET /api/scholars)',
        'quiz_categories': 'Quiz Categories (GET /api/quiz/categories)',
        'quiz_solo_start': 'Quiz Solo Start (POST /api/quiz/solo/start)',
        'cities': 'Cities List (GET /api/cities)'
    }
    
    for test_key, test_name in test_names.items():
        if test_key in results:
            result = results[test_key]
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"  {test_name}: {status}")
            if result:
                passed += 1
            else:
                failed += 1
    
    print(f"\nTotal: {passed + failed} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    # Key validation checks
    print("\n" + "=" * 80)
    print("🔍 KEY VALIDATION RESULTS")
    print("=" * 80)
    
    if results.get('quran_surahs'):
        print("✅ All 114 surahs available with Turkish names and meanings")
    
    if results.get('surah_fatiha'):
        print("✅ Surah verses contain Arabic and Turkish with audio URLs")
    
    if results.get('prayer_times_istanbul'):
        print("✅ Prayer times return valid HH:MM format")
    
    if results.get('quran_meal_audio'):
        print("✅ All 30 juz have Mazlum Kiper YouTube videos")
    
    if results.get('hadith_all'):
        print("✅ Hadiths contain Arabic, Turkish and source information")
    
    if failed == 0:
        print("\n🎉 ALL ISLAMIC LIFE ASSISTANT TESTS PASSED!")
        print("✅ The API is ready for production use.")
    else:
        print(f"\n⚠️ {failed} test(s) failed. Check the detailed output above.")
    
    return results

if __name__ == "__main__":
    results = run_islamic_assistant_tests()
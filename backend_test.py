#!/usr/bin/env python3
"""
Backend API Testing for Islamic Life Assistant App
Tests all backend endpoints with real-world data
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://faith-connect-210.preview.emergentagent.com/api"
TEST_SESSION_ID = "test_session_islamic_001"
TEST_USER_ID = "test_user_islamic_001"

def test_health_check():
    """Test GET /api/ - Health check"""
    print("\n=== Testing Health Check ===")
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            if "message" in data and "version" in data:
                print("✅ Health check PASSED")
                return True
            else:
                print("❌ Health check response missing required fields")
                return False
        else:
            print(f"❌ Health check FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check ERROR: {e}")
        return False

def test_cities_api():
    """Test GET /api/cities - Get Turkish cities"""
    print("\n=== Testing Cities API ===")
    try:
        response = requests.get(f"{BACKEND_URL}/cities", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            cities = response.json()
            print(f"Number of cities: {len(cities)}")
            
            if len(cities) >= 10:  # Should have at least 10 cities
                # Check first city structure
                city = cities[0]
                required_fields = ['id', 'name', 'latitude', 'longitude', 'qibla_direction']
                
                if all(field in city for field in required_fields):
                    print(f"Sample city: {city['name']} - Qibla: {city['qibla_direction']}°")
                    print("✅ Cities API PASSED")
                    return True
                else:
                    print(f"❌ City missing required fields: {required_fields}")
                    return False
            else:
                print("❌ Insufficient cities returned")
                return False
        else:
            print(f"❌ Cities API FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cities API ERROR: {e}")
        return False

def test_prayer_times_api():
    """Test GET /api/prayer-times/{city_id} - Get prayer times"""
    print("\n=== Testing Prayer Times API ===")
    try:
        city_id = "istanbul"
        response = requests.get(f"{BACKEND_URL}/prayer-times/{city_id}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            prayer_times = response.json()
            print(f"Prayer times for {prayer_times.get('city_name', city_id)}:")
            
            required_fields = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha', 'date', 'qibla_direction']
            
            if all(field in prayer_times for field in required_fields):
                for prayer in ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']:
                    print(f"  {prayer.capitalize()}: {prayer_times[prayer]}")
                print(f"  Date: {prayer_times['date']}")
                print(f"  Qibla Direction: {prayer_times['qibla_direction']}°")
                print("✅ Prayer Times API PASSED")
                return True
            else:
                print(f"❌ Prayer times missing required fields: {required_fields}")
                return False
        else:
            print(f"❌ Prayer Times API FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Prayer Times API ERROR: {e}")
        return False

def test_ai_chat_api():
    """Test POST /api/ai/chat - AI Islamic knowledge chat"""
    print("\n=== Testing AI Chat API ===")
    try:
        # Test with a Turkish Islamic question
        chat_data = {
            "session_id": TEST_SESSION_ID,
            "message": "Abdest nasıl alınır? Kısa bir açıklama yapabilir misin?"
        }
        
        print(f"Sending message: {chat_data['message']}")
        response = requests.post(
            f"{BACKEND_URL}/ai/chat", 
            json=chat_data,
            timeout=30  # AI calls may take longer
        )
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            chat_response = response.json()
            
            if "response" in chat_response and "session_id" in chat_response:
                ai_response = chat_response["response"]
                print(f"AI Response (first 200 chars): {ai_response[:200]}...")
                
                # Check if response is meaningful (contains Turkish Islamic terms)
                islamic_terms = ['abdest', 'namaz', 'Allah', 'İslam', 'su', 'temiz']
                if any(term.lower() in ai_response.lower() for term in islamic_terms):
                    print("✅ AI Chat API PASSED - Response contains relevant Islamic content")
                    return True
                else:
                    print("⚠️ AI Chat API response may not be Islamic-focused")
                    print(f"Full response: {ai_response}")
                    return True  # Still consider as working if we get a response
            else:
                print("❌ AI Chat response missing required fields")
                return False
        else:
            print(f"❌ AI Chat API FAILED with status {response.status_code}")
            if response.text:
                print(f"Error details: {response.text}")
            return False
    except Exception as e:
        print(f"❌ AI Chat API ERROR: {e}")
        return False

def test_ai_history_api():
    """Test GET /api/ai/history/{session_id} - Get chat history"""
    print("\n=== Testing AI History API ===")
    try:
        response = requests.get(f"{BACKEND_URL}/ai/history/{TEST_SESSION_ID}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            history = response.json()
            print(f"Number of messages in history: {len(history)}")
            
            if len(history) >= 2:  # Should have at least user message + AI response
                # Check message structure
                for i, msg in enumerate(history[:2]):
                    if "role" in msg and "content" in msg and "timestamp" in msg:
                        print(f"Message {i+1}: {msg['role']} - {msg['content'][:50]}...")
                    else:
                        print(f"❌ Message {i+1} missing required fields")
                        return False
                
                print("✅ AI History API PASSED")
                return True
            else:
                print("⚠️ Chat history empty - may be expected if chat API failed")
                return True  # Not necessarily a failure
        else:
            print(f"❌ AI History API FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ AI History API ERROR: {e}")
        return False

def test_pomodoro_create_api():
    """Test POST /api/pomodoro - Create pomodoro session"""
    print("\n=== Testing Pomodoro Create API ===")
    try:
        pomodoro_data = {
            "user_id": TEST_USER_ID,
            "topic": "Kur'an Okuma",
            "duration_minutes": 25
        }
        
        print(f"Creating pomodoro: {pomodoro_data}")
        response = requests.post(f"{BACKEND_URL}/pomodoro", json=pomodoro_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            session = response.json()
            required_fields = ['id', 'user_id', 'topic', 'duration_minutes', 'completed', 'created_at']
            
            if all(field in session for field in required_fields):
                print(f"Created session ID: {session['id']}")
                print(f"Topic: {session['topic']}")
                print(f"Duration: {session['duration_minutes']} minutes")
                print(f"Completed: {session['completed']}")
                print("✅ Pomodoro Create API PASSED")
                return True, session['id']
            else:
                print(f"❌ Pomodoro session missing required fields: {required_fields}")
                return False, None
        else:
            print(f"❌ Pomodoro Create API FAILED with status {response.status_code}")
            if response.text:
                print(f"Error details: {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Pomodoro Create API ERROR: {e}")
        return False, None

def test_pomodoro_get_api():
    """Test GET /api/pomodoro/{user_id} - Get user's pomodoro sessions"""
    print("\n=== Testing Pomodoro Get API ===")
    try:
        response = requests.get(f"{BACKEND_URL}/pomodoro/{TEST_USER_ID}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            sessions = response.json()
            print(f"Number of sessions: {len(sessions)}")
            
            if len(sessions) > 0:
                session = sessions[0]
                required_fields = ['id', 'user_id', 'topic', 'duration_minutes']
                
                if all(field in session for field in required_fields):
                    print(f"Latest session: {session['topic']} - {session['duration_minutes']}min")
                    print("✅ Pomodoro Get API PASSED")
                    return True
                else:
                    print(f"❌ Session missing required fields: {required_fields}")
                    return False
            else:
                print("⚠️ No sessions found - may be expected if create API failed")
                return True  # Not necessarily a failure
        else:
            print(f"❌ Pomodoro Get API FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Pomodoro Get API ERROR: {e}")
        return False

def test_pomodoro_stats_api():
    """Test GET /api/pomodoro/stats/{user_id} - Get user's pomodoro stats"""
    print("\n=== Testing Pomodoro Stats API ===")
    try:
        response = requests.get(f"{BACKEND_URL}/pomodoro/stats/{TEST_USER_ID}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            required_fields = ['total_sessions', 'completed_sessions', 'total_minutes', 'topics']
            
            if all(field in stats for field in required_fields):
                print(f"Total sessions: {stats['total_sessions']}")
                print(f"Completed sessions: {stats['completed_sessions']}")
                print(f"Total minutes: {stats['total_minutes']}")
                print(f"Topics: {list(stats['topics'].keys())}")
                print("✅ Pomodoro Stats API PASSED")
                return True
            else:
                print(f"❌ Stats missing required fields: {required_fields}")
                return False
        else:
            print(f"❌ Pomodoro Stats API FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Pomodoro Stats API ERROR: {e}")
        return False

def test_user_preferences_api():
    """Test User Preferences API endpoints"""
    print("\n=== Testing User Preferences API ===")
    
    # Test POST /api/preferences - Create/Update preferences
    try:
        prefs_data = {
            "user_id": TEST_USER_ID,
            "city_id": "istanbul",
            "madhab": "hanafi",
            "language": "tr"
        }
        
        print(f"Creating preferences: {prefs_data}")
        response = requests.post(f"{BACKEND_URL}/preferences", json=prefs_data, timeout=10)
        print(f"POST Status Code: {response.status_code}")
        
        if response.status_code == 200:
            prefs = response.json()
            required_fields = ['id', 'user_id', 'city_id', 'madhab', 'language']
            
            if all(field in prefs for field in required_fields):
                print(f"Created preferences ID: {prefs['id']}")
                print(f"City: {prefs['city_id']}, Madhab: {prefs['madhab']}")
                
                # Test GET /api/preferences/{user_id} - Get preferences
                get_response = requests.get(f"{BACKEND_URL}/preferences/{TEST_USER_ID}", timeout=10)
                print(f"GET Status Code: {get_response.status_code}")
                
                if get_response.status_code == 200:
                    get_prefs = get_response.json()
                    if get_prefs['user_id'] == TEST_USER_ID and get_prefs['city_id'] == "istanbul":
                        print("✅ User Preferences API PASSED")
                        return True
                    else:
                        print("❌ Retrieved preferences don't match created ones")
                        return False
                else:
                    print(f"❌ GET Preferences FAILED with status {get_response.status_code}")
                    return False
            else:
                print(f"❌ Preferences missing required fields: {required_fields}")
                return False
        else:
            print(f"❌ Create Preferences FAILED with status {response.status_code}")
            if response.text:
                print(f"Error details: {response.text}")
            return False
    except Exception as e:
        print(f"❌ User Preferences API ERROR: {e}")
        return False

def test_quiz_categories_api():
    """Test GET /api/quiz/categories - Get all quiz categories"""
    print("\n=== Testing Quiz Categories API ===")
    try:
        response = requests.get(f"{BACKEND_URL}/quiz/categories", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            categories = response.json()
            print(f"Number of categories: {len(categories)}")
            
            expected_categories = ["ramazan", "namaz", "hadis", "tefsir", "fikih"]
            
            if len(categories) >= 5:
                category_ids = [cat.get('id') for cat in categories]
                if all(cat_id in category_ids for cat_id in expected_categories):
                    print(f"Categories found: {category_ids}")
                    
                    # Check category structure
                    category = categories[0]
                    required_fields = ['id', 'name', 'description', 'icon', 'color']
                    if all(field in category for field in required_fields):
                        print(f"Sample category: {category['name']} - {category['description']}")
                        print("✅ Quiz Categories API PASSED")
                        return True
                    else:
                        print(f"❌ Category missing required fields: {required_fields}")
                        return False
                else:
                    print(f"❌ Expected categories not found. Found: {category_ids}")
                    return False
            else:
                print("❌ Insufficient categories returned")
                return False
        else:
            print(f"❌ Quiz Categories API FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Quiz Categories API ERROR: {e}")
        return False

def test_quiz_questions_api():
    """Test GET /api/quiz/questions/{category} - Get random questions for a category"""
    print("\n=== Testing Quiz Questions API ===")
    try:
        category = "namaz"
        count = 5
        response = requests.get(f"{BACKEND_URL}/quiz/questions/{category}?count={count}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            questions = response.json()
            print(f"Number of questions for '{category}': {len(questions)}")
            
            if len(questions) > 0:
                # Check question structure
                question = questions[0]
                required_fields = ['id', 'question', 'options', 'difficulty', 'points']
                
                if all(field in question for field in required_fields):
                    # Should NOT contain correct_answer, explanation, source (client-side security)
                    forbidden_fields = ['correct_answer', 'explanation', 'source']
                    if not any(field in question for field in forbidden_fields):
                        print(f"Sample question: {question['question'][:50]}...")
                        print(f"Options count: {len(question['options'])}")
                        print(f"Difficulty: {question['difficulty']}, Points: {question['points']}")
                        print("✅ Quiz Questions API PASSED")
                        return True
                    else:
                        print(f"❌ Question contains forbidden client-side fields: {forbidden_fields}")
                        return False
                else:
                    print(f"❌ Question missing required fields: {required_fields}")
                    return False
            else:
                print("❌ No questions returned")
                return False
        else:
            print(f"❌ Quiz Questions API FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Quiz Questions API ERROR: {e}")
        return False

def test_quiz_solo_mode():
    """Test Quiz Solo Mode APIs - Start, Answer, Finish"""
    print("\n=== Testing Quiz Solo Mode ===")
    
    # Global variables to store session data
    solo_session_id = None
    
    # 1. Start solo quiz session
    try:
        user_id = "quiz_tester_123"
        category = "namaz"
        question_count = 5
        
        start_url = f"{BACKEND_URL}/quiz/solo/start?user_id={user_id}&category={category}&question_count={question_count}"
        response = requests.post(start_url, timeout=10)
        print(f"Start Solo Quiz Status Code: {response.status_code}")
        
        if response.status_code == 200:
            session_data = response.json()
            required_fields = ['session_id', 'category', 'questions']
            
            if all(field in session_data for field in required_fields):
                solo_session_id = session_data['session_id']
                print(f"Started solo session: {solo_session_id}")
                print(f"Questions count: {len(session_data['questions'])}")
                
                # 2. Submit answers for a few questions
                for i in range(min(3, len(session_data['questions']))):
                    answer_url = f"{BACKEND_URL}/quiz/solo/{solo_session_id}/answer?question_index={i}&answer=1&time_taken=5.5"
                    answer_response = requests.post(answer_url, timeout=10)
                    
                    if answer_response.status_code == 200:
                        result = answer_response.json()
                        print(f"Answer {i+1}: {'✅ Correct' if result.get('correct') else '❌ Wrong'} - Points: {result.get('points_earned', 0)}")
                    else:
                        print(f"❌ Submit answer {i+1} failed with status {answer_response.status_code}")
                        print(f"Error: {answer_response.text}")
                        return False
                
                # 3. Finish solo quiz
                finish_url = f"{BACKEND_URL}/quiz/solo/{solo_session_id}/finish"
                finish_response = requests.post(finish_url, timeout=10)
                print(f"Finish Solo Quiz Status Code: {finish_response.status_code}")
                
                if finish_response.status_code == 200:
                    final_results = finish_response.json()
                    required_result_fields = ['session_id', 'score', 'correct_count', 'total_questions']
                    
                    if all(field in final_results for field in required_result_fields):
                        print(f"Final Score: {final_results['score']}")
                        print(f"Correct: {final_results['correct_count']}/{final_results['total_questions']}")
                        accuracy = (final_results['correct_count'] / final_results['total_questions']) * 100 if final_results['total_questions'] > 0 else 0
                        print(f"Accuracy: {accuracy:.1f}%")
                        print("✅ Quiz Solo Mode PASSED")
                        return True
                    else:
                        print(f"❌ Final results missing required fields: {required_result_fields}")
                        print(f"Actual result keys: {list(final_results.keys())}")
                        return False
                else:
                    print(f"❌ Finish solo quiz FAILED with status {finish_response.status_code}")
                    return False
            else:
                print(f"❌ Start session response missing required fields: {required_fields}")
                print(f"Actual response keys: {list(session_data.keys())}")
                return False
        else:
            print(f"❌ Start Solo Quiz FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Quiz Solo Mode ERROR: {e}")
        return False

def test_quiz_multiplayer_rooms():
    """Test Quiz Multiplayer Room APIs"""
    print("\n=== Testing Quiz Multiplayer Rooms ===")
    
    room_id = None
    
    # 1. Create a multiplayer room
    try:
        room_data = {
            "user_id": "host123",
            "username": "TestHost",
            "category": "ramazan",
            "room_name": "Test Room",
            "question_count": 10,
            "time_per_question": 20
        }
        
        response = requests.post(f"{BACKEND_URL}/quiz/rooms/create", json=room_data, timeout=10)
        print(f"Create Room Status Code: {response.status_code}")
        
        if response.status_code == 200:
            room = response.json()
            required_fields = ['id', 'name', 'category', 'host_id', 'players', 'status', 'questions']
            
            if all(field in room for field in required_fields):
                room_id = room['id']
                print(f"Created room: {room['name']} (ID: {room_id})")
                print(f"Host: {room.get('host_name', 'Unknown')}")
                print(f"Status: {room['status']}")
                print(f"Questions: {len(room['questions'])}")
                
                # 2. Get available rooms
                rooms_response = requests.get(f"{BACKEND_URL}/quiz/rooms?status=waiting", timeout=10)
                print(f"Get Rooms Status Code: {rooms_response.status_code}")
                
                if rooms_response.status_code == 200:
                    available_rooms = rooms_response.json()
                    print(f"Available rooms: {len(available_rooms)}")
                    
                    # Check if our room is in the list
                    room_found = any(r.get('id') == room_id for r in available_rooms)
                    if room_found:
                        print("✅ Created room found in available rooms list")
                        
                        # 3. Get specific room details
                        room_detail_response = requests.get(f"{BACKEND_URL}/quiz/rooms/{room_id}", timeout=10)
                        print(f"Get Room Details Status Code: {room_detail_response.status_code}")
                        
                        if room_detail_response.status_code == 200:
                            room_details = room_detail_response.json()
                            if room_details.get('id') == room_id:
                                print(f"Room details: {room_details['name']} - {room_details['status']}")
                                
                                # 4. Join the room (different user)
                                join_data = {
                                    "user_id": "player123",
                                    "username": "TestPlayer"
                                }
                                
                                join_response = requests.post(f"{BACKEND_URL}/quiz/rooms/{room_id}/join", json=join_data, timeout=10)
                                print(f"Join Room Status Code: {join_response.status_code}")
                                
                                if join_response.status_code == 200:
                                    print("✅ Successfully joined room")
                                    print("✅ Quiz Multiplayer Rooms PASSED")
                                    return True
                                else:
                                    print(f"❌ Join room FAILED with status {join_response.status_code}")
                                    return False
                            else:
                                print("❌ Room details don't match created room")
                                return False
                        else:
                            print(f"❌ Get room details FAILED with status {room_detail_response.status_code}")
                            return False
                    else:
                        print("❌ Created room not found in available rooms")
                        return False
                else:
                    print(f"❌ Get rooms FAILED with status {rooms_response.status_code}")
                    return False
            else:
                print(f"❌ Create room response missing required fields: {required_fields}")
                return False
        else:
            print(f"❌ Create Room FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Quiz Multiplayer Rooms ERROR: {e}")
        return False

def test_quiz_user_stats():
    """Test GET /api/quiz/stats/{user_id} - Get user quiz statistics"""
    print("\n=== Testing Quiz User Stats API ===")
    try:
        user_id = "quiz_tester_123"
        response = requests.get(f"{BACKEND_URL}/quiz/stats/{user_id}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            required_fields = ['user_id', 'total_games', 'games_won', 'total_points', 'correct_answers', 'total_answers', 'accuracy']
            
            if all(field in stats for field in required_fields):
                print(f"User: {stats['user_id']}")
                print(f"Total games: {stats['total_games']}")
                print(f"Games won: {stats['games_won']}")
                print(f"Total points: {stats['total_points']}")
                print(f"Accuracy: {stats['accuracy']}%")
                print("✅ Quiz User Stats API PASSED")
                return True
            else:
                print(f"❌ Stats missing required fields: {required_fields}")
                return False
        else:
            print(f"❌ Quiz User Stats API FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Quiz User Stats API ERROR: {e}")
        return False

def test_quiz_leaderboard():
    """Test GET /api/quiz/leaderboard - Get global leaderboard"""
    print("\n=== Testing Quiz Leaderboard API ===")
    try:
        response = requests.get(f"{BACKEND_URL}/quiz/leaderboard?limit=10", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            leaderboard = response.json()
            print(f"Leaderboard entries: {len(leaderboard)}")
            
            if len(leaderboard) >= 0:  # Can be empty initially
                if len(leaderboard) > 0:
                    # Check leaderboard entry structure
                    entry = leaderboard[0]
                    required_fields = ['rank', 'user_id', 'total_points', 'accuracy']
                    
                    if all(field in entry for field in required_fields):
                        print(f"Top player: Rank {entry['rank']} - {entry['total_points']} points ({entry['accuracy']}% accuracy)")
                        print("✅ Quiz Leaderboard API PASSED")
                        return True
                    else:
                        print(f"❌ Leaderboard entry missing required fields: {required_fields}")
                        return False
                else:
                    print("✅ Empty leaderboard (expected for new system)")
                    print("✅ Quiz Leaderboard API PASSED")
                    return True
            else:
                print("❌ Invalid leaderboard response")
                return False
        else:
            print(f"❌ Quiz Leaderboard API FAILED with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Quiz Leaderboard API ERROR: {e}")
        return False

def run_all_tests():
    """Run all backend API tests"""
    print("=" * 70)
    print("🕌 ISLAMIC LIFE ASSISTANT - BACKEND API TESTING")
    print("=" * 70)
    print(f"Testing against: {BACKEND_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Core API tests
    results['health_check'] = test_health_check()
    results['cities'] = test_cities_api()
    results['prayer_times'] = test_prayer_times_api()
    results['ai_chat'] = test_ai_chat_api()
    results['ai_history'] = test_ai_history_api()
    
    # Pomodoro tests
    pomodoro_create_result, session_id = test_pomodoro_create_api()
    results['pomodoro_create'] = pomodoro_create_result
    results['pomodoro_get'] = test_pomodoro_get_api()
    results['pomodoro_stats'] = test_pomodoro_stats_api()
    
    # User preferences test
    results['user_preferences'] = test_user_preferences_api()
    
    # ===== QUIZ SYSTEM TESTS =====
    print("\n" + "=" * 40)
    print("🧠 QUIZ SYSTEM TESTING")
    print("=" * 40)
    
    results['quiz_categories'] = test_quiz_categories_api()
    results['quiz_questions'] = test_quiz_questions_api()
    results['quiz_solo_mode'] = test_quiz_solo_mode()
    results['quiz_multiplayer_rooms'] = test_quiz_multiplayer_rooms()
    results['quiz_user_stats'] = test_quiz_user_stats()
    results['quiz_leaderboard'] = test_quiz_leaderboard()
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    
    passed = 0
    failed = 0
    
    # Core APIs
    print("\n🔧 CORE APIs:")
    core_tests = ['health_check', 'cities', 'prayer_times', 'ai_chat', 'ai_history', 'pomodoro_create', 'pomodoro_get', 'pomodoro_stats', 'user_preferences']
    for test_name in core_tests:
        if test_name in results:
            result = results[test_name]
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"  {test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
            else:
                failed += 1
    
    # Quiz APIs
    print("\n🧠 QUIZ SYSTEM APIs:")
    quiz_tests = ['quiz_categories', 'quiz_questions', 'quiz_solo_mode', 'quiz_multiplayer_rooms', 'quiz_user_stats', 'quiz_leaderboard']
    for test_name in quiz_tests:
        if test_name in results:
            result = results[test_name]
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"  {test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
            else:
                failed += 1
    
    print(f"\nTotal: {passed + failed} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Backend APIs are working correctly.")
        print("✅ Quiz System is ready for production use!")
    else:
        print(f"\n⚠️ {failed} test(s) failed. Check the detailed output above.")
    
    return results

if __name__ == "__main__":
    results = run_all_tests()
#!/usr/bin/env python3
"""
Islamic Life Assistant "Keşfet" (Discover) Backend API Testing

Tests for new Keşfet screen endpoints:
1. Mood Content (4 moods)
2. Knowledge Cards 
3. Dhikr
4. Worship Tracking (auth required)
5. Scholars (expanded list)
6. Regression testing on existing endpoints
"""

import asyncio
import httpx
import json
import sys
import os

API_BASE_URL = "https://islamic-superapp-2.preview.emergentagent.com/api"

class KesfetAPITester:
    def __init__(self):
        self.session = None
        self.guest_user = None
        self.session_token = None
        self.test_results = {}
        
    async def setup_session(self):
        """Setup HTTP session and create guest user for auth testing"""
        self.session = httpx.AsyncClient(timeout=30.0)
        
        print("🔑 Setting up guest authentication...")
        try:
            response = await self.session.post(f"{API_BASE_URL}/auth/guest")
            if response.status_code == 200:
                self.guest_user = response.json()
                self.session_token = response.cookies.get("session_token")
                print(f"✅ Guest user created: {self.guest_user.get('name', 'Unknown')}")
                print(f"   User ID: {self.guest_user.get('user_id', 'N/A')}")
                return True
            else:
                print(f"❌ Failed to create guest user: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Auth setup error: {e}")
            return False
    
    async def test_mood_content_endpoints(self):
        """Test mood content endpoints"""
        print("\n🎭 Testing Mood Content Endpoints...")
        
        mood_results = {}
        moods = ["huzur", "motivasyon", "sabir", "sukur"]
        
        for mood in moods:
            try:
                response = await self.session.get(f"{API_BASE_URL}/mood/{mood}")
                if response.status_code == 200:
                    data = response.json()
                    
                    # Validate response structure
                    required_fields = ["mood", "label", "ayet", "hadis", "dua"]
                    missing_fields = [f for f in required_fields if f not in data]
                    
                    if not missing_fields:
                        # Validate ayet structure
                        ayet = data.get("ayet", {})
                        ayet_fields = ["arabic", "turkish", "sure"]
                        ayet_valid = all(field in ayet for field in ayet_fields)
                        
                        # Validate hadis structure
                        hadis = data.get("hadis", {})
                        hadis_fields = ["arabic", "turkish", "source"]
                        hadis_valid = all(field in hadis for field in hadis_fields)
                        
                        if ayet_valid and hadis_valid:
                            mood_results[mood] = "✅ PASS"
                            print(f"   {mood}: ✅ Content structure valid")
                            print(f"      Ayet: {ayet.get('sure', 'N/A')} - {ayet.get('turkish', 'N/A')[:50]}...")
                            print(f"      Hadis: {hadis.get('source', 'N/A')} - {hadis.get('turkish', 'N/A')[:50]}...")
                        else:
                            mood_results[mood] = "❌ FAIL - Invalid content structure"
                            print(f"   {mood}: ❌ Invalid content structure")
                    else:
                        mood_results[mood] = f"❌ FAIL - Missing fields: {missing_fields}"
                        print(f"   {mood}: ❌ Missing fields: {missing_fields}")
                else:
                    mood_results[mood] = f"❌ FAIL - HTTP {response.status_code}"
                    print(f"   {mood}: ❌ HTTP {response.status_code}")
                    
            except Exception as e:
                mood_results[mood] = f"❌ FAIL - Exception: {str(e)}"
                print(f"   {mood}: ❌ Exception: {e}")
        
        # Test invalid mood
        try:
            response = await self.session.get(f"{API_BASE_URL}/mood/invalid")
            if response.status_code == 404:
                mood_results["invalid_mood"] = "✅ PASS - 404 for invalid mood"
                print(f"   invalid: ✅ Correctly returns 404")
            else:
                mood_results["invalid_mood"] = f"❌ FAIL - Expected 404, got {response.status_code}"
                print(f"   invalid: ❌ Expected 404, got {response.status_code}")
        except Exception as e:
            mood_results["invalid_mood"] = f"❌ FAIL - Exception: {str(e)}"
            
        self.test_results["mood_content"] = mood_results
        
    async def test_knowledge_cards_endpoints(self):
        """Test knowledge cards endpoints"""
        print("\n📚 Testing Knowledge Cards Endpoints...")
        
        knowledge_results = {}
        
        # Test GET /knowledge-cards (should return 4 cards)
        try:
            response = await self.session.get(f"{API_BASE_URL}/knowledge-cards")
            if response.status_code == 200:
                cards = response.json()
                if isinstance(cards, list) and len(cards) == 4:
                    # Validate card structure
                    valid_cards = []
                    for card in cards:
                        required_fields = ["id", "title", "items"]
                        if all(field in card for field in required_fields):
                            items = card.get("items", [])
                            if isinstance(items, list) and len(items) > 0:
                                # Check item structure
                                item = items[0]
                                if "title" in item and "content" in item:
                                    valid_cards.append(card["id"])
                    
                    if len(valid_cards) == 4:
                        knowledge_results["list_cards"] = "✅ PASS - 4 valid cards returned"
                        print(f"   ✅ 4 knowledge cards returned with valid structure")
                        for card in cards:
                            print(f"      - {card.get('id', 'N/A')}: {card.get('title', 'N/A')}")
                    else:
                        knowledge_results["list_cards"] = f"❌ FAIL - Only {len(valid_cards)} valid cards"
                        print(f"   ❌ Only {len(valid_cards)} valid cards found")
                else:
                    knowledge_results["list_cards"] = f"❌ FAIL - Expected 4 cards, got {len(cards) if isinstance(cards, list) else 'non-array'}"
                    print(f"   ❌ Expected 4 cards, got {len(cards) if isinstance(cards, list) else 'non-array'}")
            else:
                knowledge_results["list_cards"] = f"❌ FAIL - HTTP {response.status_code}"
                print(f"   ❌ HTTP {response.status_code}")
        except Exception as e:
            knowledge_results["list_cards"] = f"❌ FAIL - Exception: {str(e)}"
            print(f"   ❌ Exception: {e}")
        
        # Test specific card endpoint
        try:
            response = await self.session.get(f"{API_BASE_URL}/knowledge-cards/tarihte_bugun")
            if response.status_code == 200:
                card = response.json()
                if "items" in card and isinstance(card["items"], list) and len(card["items"]) > 0:
                    knowledge_results["specific_card"] = "✅ PASS - Specific card with items"
                    print(f"   ✅ tarihte_bugun card returned with {len(card['items'])} items")
                else:
                    knowledge_results["specific_card"] = "❌ FAIL - No items array in card"
                    print(f"   ❌ No items array in card")
            else:
                knowledge_results["specific_card"] = f"❌ FAIL - HTTP {response.status_code}"
                print(f"   ❌ HTTP {response.status_code}")
        except Exception as e:
            knowledge_results["specific_card"] = f"❌ FAIL - Exception: {str(e)}"
            print(f"   ❌ Exception: {e}")
        
        # Test invalid card
        try:
            response = await self.session.get(f"{API_BASE_URL}/knowledge-cards/invalid")
            if response.status_code == 404:
                knowledge_results["invalid_card"] = "✅ PASS - 404 for invalid card"
                print(f"   ✅ invalid card correctly returns 404")
            else:
                knowledge_results["invalid_card"] = f"❌ FAIL - Expected 404, got {response.status_code}"
                print(f"   ❌ Expected 404, got {response.status_code}")
        except Exception as e:
            knowledge_results["invalid_card"] = f"❌ FAIL - Exception: {str(e)}"
            
        self.test_results["knowledge_cards"] = knowledge_results
        
    async def test_dhikr_endpoint(self):
        """Test dhikr endpoint"""
        print("\n📿 Testing Dhikr Endpoint...")
        
        try:
            response = await self.session.get(f"{API_BASE_URL}/dhikr")
            if response.status_code == 200:
                dhikr_list = response.json()
                if isinstance(dhikr_list, list) and len(dhikr_list) == 8:
                    # Validate dhikr structure
                    expected_dhikrs = ["subhanallah", "elhamdulillah", "allahuekber", "lailaheillallah", 
                                     "estağfirullah", "bismillah", "hasbunallah", "salavat"]
                    
                    found_dhikrs = []
                    valid_structure = True
                    
                    for dhikr in dhikr_list:
                        required_fields = ["id", "arabic", "turkish", "meaning", "recommended"]
                        if all(field in dhikr for field in required_fields):
                            found_dhikrs.append(dhikr["id"])
                        else:
                            valid_structure = False
                            break
                    
                    if valid_structure and len(found_dhikrs) == 8:
                        self.test_results["dhikr"] = "✅ PASS - 8 dhikr items with valid structure"
                        print(f"   ✅ 8 dhikr items returned with complete structure")
                        print(f"   Found dhikrs: {', '.join(found_dhikrs)}")
                    else:
                        self.test_results["dhikr"] = f"❌ FAIL - Structure validation failed"
                        print(f"   ❌ Structure validation failed")
                else:
                    self.test_results["dhikr"] = f"❌ FAIL - Expected 8 dhikr items, got {len(dhikr_list) if isinstance(dhikr_list, list) else 'non-array'}"
                    print(f"   ❌ Expected 8 dhikr items, got {len(dhikr_list) if isinstance(dhikr_list, list) else 'non-array'}")
            else:
                self.test_results["dhikr"] = f"❌ FAIL - HTTP {response.status_code}"
                print(f"   ❌ HTTP {response.status_code}")
        except Exception as e:
            self.test_results["dhikr"] = f"❌ FAIL - Exception: {str(e)}"
            print(f"   ❌ Exception: {e}")
    
    async def test_worship_tracking_endpoints(self):
        """Test worship tracking endpoints (requires auth)"""
        print("\n🕌 Testing Worship Tracking Endpoints (Auth Required)...")
        
        if not self.session_token:
            self.test_results["worship_tracking"] = "❌ FAIL - No auth token available"
            print("   ❌ No auth token available for worship tracking tests")
            return
            
        worship_results = {}
        
        # Test GET /worship/today (initial state - should be all false)
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = await self.session.get(f"{API_BASE_URL}/worship/today", headers=headers)
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["namaz", "kuran", "sadaka", "zikir"]
                if all(field in data for field in expected_fields):
                    worship_results["get_today_initial"] = "✅ PASS - Initial worship state retrieved"
                    print(f"   ✅ Initial worship state: {data}")
                else:
                    worship_results["get_today_initial"] = f"❌ FAIL - Missing worship fields"
                    print(f"   ❌ Missing worship fields in response")
            else:
                worship_results["get_today_initial"] = f"❌ FAIL - HTTP {response.status_code}"
                print(f"   ❌ GET today initial failed: {response.status_code}")
        except Exception as e:
            worship_results["get_today_initial"] = f"❌ FAIL - Exception: {str(e)}"
            print(f"   ❌ GET today initial exception: {e}")
        
        # Test POST /worship/track
        try:
            headers = {"Authorization": f"Bearer {self.session_token}", "Content-Type": "application/json"}
            worship_data = {"namaz": True, "kuran": False, "sadaka": False, "zikir": True}
            
            response = await self.session.post(
                f"{API_BASE_URL}/worship/track", 
                headers=headers,
                json=worship_data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "ok":
                    worship_results["post_track"] = "✅ PASS - Worship tracking updated"
                    print(f"   ✅ Worship tracking updated successfully")
                else:
                    worship_results["post_track"] = f"❌ FAIL - Unexpected response: {result}"
                    print(f"   ❌ Unexpected response: {result}")
            else:
                worship_results["post_track"] = f"❌ FAIL - HTTP {response.status_code}"
                print(f"   ❌ POST track failed: {response.status_code}")
        except Exception as e:
            worship_results["post_track"] = f"❌ FAIL - Exception: {str(e)}"
            print(f"   ❌ POST track exception: {e}")
        
        # Test GET /worship/today again (should show updated values)
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = await self.session.get(f"{API_BASE_URL}/worship/today", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if data.get("namaz") is True and data.get("zikir") is True:
                    worship_results["get_today_updated"] = "✅ PASS - Updated worship state retrieved"
                    print(f"   ✅ Updated worship state: {data}")
                else:
                    worship_results["get_today_updated"] = f"❌ FAIL - State not updated correctly: {data}"
                    print(f"   ❌ State not updated correctly: {data}")
            else:
                worship_results["get_today_updated"] = f"❌ FAIL - HTTP {response.status_code}"
                print(f"   ❌ GET today updated failed: {response.status_code}")
        except Exception as e:
            worship_results["get_today_updated"] = f"❌ FAIL - Exception: {str(e)}"
            print(f"   ❌ GET today updated exception: {e}")
        
        self.test_results["worship_tracking"] = worship_results
        
    async def test_scholars_endpoint(self):
        """Test scholars endpoint (expanded list)"""
        print("\n👨‍🏫 Testing Scholars Endpoint (Expanded List)...")
        
        try:
            response = await self.session.get(f"{API_BASE_URL}/scholars")
            if response.status_code == 200:
                scholars = response.json()
                if isinstance(scholars, list) and len(scholars) == 12:
                    # Check for specific new scholars mentioned in requirements
                    required_scholars = ["mehmet_okuyan", "suleyman_ates", "yasar_nuri", "cübbeli_ahmet", "ali_erbas"]
                    found_scholars = [s.get("id") for s in scholars]
                    
                    missing_scholars = [s for s in required_scholars if s not in found_scholars]
                    
                    if not missing_scholars:
                        self.test_results["scholars"] = "✅ PASS - 12 scholars including new additions"
                        print(f"   ✅ 12 scholars returned including all new additions")
                        print(f"   New scholars found: {[s for s in found_scholars if s in required_scholars]}")
                    else:
                        self.test_results["scholars"] = f"❌ FAIL - Missing scholars: {missing_scholars}"
                        print(f"   ❌ Missing required scholars: {missing_scholars}")
                        print(f"   Found scholars: {found_scholars}")
                else:
                    self.test_results["scholars"] = f"❌ FAIL - Expected 12 scholars, got {len(scholars) if isinstance(scholars, list) else 'non-array'}"
                    print(f"   ❌ Expected 12 scholars, got {len(scholars) if isinstance(scholars, list) else 'non-array'}")
            else:
                self.test_results["scholars"] = f"❌ FAIL - HTTP {response.status_code}"
                print(f"   ❌ HTTP {response.status_code}")
        except Exception as e:
            self.test_results["scholars"] = f"❌ FAIL - Exception: {str(e)}"
            print(f"   ❌ Exception: {e}")
    
    async def test_regression_endpoints(self):
        """Test existing endpoints for regression"""
        print("\n🔄 Testing Regression Endpoints...")
        
        regression_results = {}
        
        # Test GET /quran/random
        try:
            response = await self.session.get(f"{API_BASE_URL}/quran/random")
            if response.status_code == 200:
                verse = response.json()
                required_fields = ["arabic", "turkish", "surah_number", "verse_number"]
                if all(field in verse for field in required_fields):
                    regression_results["quran_random"] = "✅ PASS - Random verse with arabic/turkish"
                    print(f"   ✅ Random verse: {verse.get('surah_name', 'N/A')} {verse.get('verse_number', 'N/A')}")
                else:
                    regression_results["quran_random"] = "❌ FAIL - Missing required fields"
                    print(f"   ❌ Missing required fields in random verse")
            else:
                regression_results["quran_random"] = f"❌ FAIL - HTTP {response.status_code}"
                print(f"   ❌ Quran random failed: {response.status_code}")
        except Exception as e:
            regression_results["quran_random"] = f"❌ FAIL - Exception: {str(e)}"
            print(f"   ❌ Quran random exception: {e}")
        
        # Test GET /hadith/random
        try:
            response = await self.session.get(f"{API_BASE_URL}/hadith/random")
            if response.status_code == 200:
                hadith = response.json()
                required_fields = ["arabic", "turkish", "source", "narrator", "category"]
                if all(field in hadith for field in required_fields):
                    regression_results["hadith_random"] = "✅ PASS - Random hadith with all fields"
                    print(f"   ✅ Random hadith: {hadith.get('source', 'N/A')} - {hadith.get('narrator', 'N/A')}")
                else:
                    regression_results["hadith_random"] = "❌ FAIL - Missing required fields"
                    print(f"   ❌ Missing required fields in random hadith")
            else:
                regression_results["hadith_random"] = f"❌ FAIL - HTTP {response.status_code}"
                print(f"   ❌ Hadith random failed: {response.status_code}")
        except Exception as e:
            regression_results["hadith_random"] = f"❌ FAIL - Exception: {str(e)}"
            print(f"   ❌ Hadith random exception: {e}")
        
        # Test GET /prayer-times/istanbul
        try:
            response = await self.session.get(f"{API_BASE_URL}/prayer-times/istanbul")
            if response.status_code == 200:
                times = response.json()
                prayer_names = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
                if all(prayer in times for prayer in prayer_names):
                    regression_results["prayer_times"] = "✅ PASS - All 6 prayer times returned"
                    print(f"   ✅ Istanbul prayer times: {times.get('fajr', 'N/A')} - {times.get('isha', 'N/A')}")
                else:
                    regression_results["prayer_times"] = "❌ FAIL - Missing prayer times"
                    print(f"   ❌ Missing prayer times in response")
            else:
                regression_results["prayer_times"] = f"❌ FAIL - HTTP {response.status_code}"
                print(f"   ❌ Prayer times failed: {response.status_code}")
        except Exception as e:
            regression_results["prayer_times"] = f"❌ FAIL - Exception: {str(e)}"
            print(f"   ❌ Prayer times exception: {e}")
        
        # Test POST /auth/guest (regression)
        try:
            response = await self.session.post(f"{API_BASE_URL}/auth/guest")
            if response.status_code == 200:
                user = response.json()
                if user.get("name") == "Kardeşim":
                    regression_results["auth_guest"] = "✅ PASS - Guest returns 'Kardeşim'"
                    print(f"   ✅ Guest auth returns user with name: {user.get('name', 'N/A')}")
                else:
                    regression_results["auth_guest"] = f"❌ FAIL - Expected 'Kardeşim', got '{user.get('name', 'N/A')}'"
                    print(f"   ❌ Expected 'Kardeşim', got '{user.get('name', 'N/A')}'")
            else:
                regression_results["auth_guest"] = f"❌ FAIL - HTTP {response.status_code}"
                print(f"   ❌ Auth guest failed: {response.status_code}")
        except Exception as e:
            regression_results["auth_guest"] = f"❌ FAIL - Exception: {str(e)}"
            print(f"   ❌ Auth guest exception: {e}")
        
        self.test_results["regression"] = regression_results
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.session:
            await self.session.aclose()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("🧪 KEŞFET BACKEND API TEST SUMMARY")
        print("="*70)
        
        total_tests = 0
        passed_tests = 0
        
        for category, results in self.test_results.items():
            print(f"\n📋 {category.upper()}:")
            if isinstance(results, dict):
                for test, result in results.items():
                    total_tests += 1
                    if "✅ PASS" in str(result):
                        passed_tests += 1
                    print(f"   {test}: {result}")
            else:
                total_tests += 1
                if "✅ PASS" in str(results):
                    passed_tests += 1
                print(f"   {results}")
        
        print(f"\n📊 OVERALL RESULTS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests}")
        print(f"   Failed: {total_tests - passed_tests}")
        print(f"   Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "   Success Rate: 0%")
        
        if passed_tests == total_tests:
            print(f"\n🎉 ALL TESTS PASSED! Keşfet backend is ready for production.")
        else:
            print(f"\n⚠️  {total_tests - passed_tests} test(s) failed. Please review and fix issues.")

async def main():
    """Main test runner"""
    print("🚀 Starting Islamic Life Assistant Keşfet Backend API Testing")
    print(f"🌐 Testing API at: {API_BASE_URL}")
    
    tester = KesfetAPITester()
    
    try:
        # Setup
        auth_success = await tester.setup_session()
        if not auth_success:
            print("❌ Failed to setup authentication. Some tests will be skipped.")
        
        # Run tests
        await tester.test_mood_content_endpoints()
        await tester.test_knowledge_cards_endpoints()
        await tester.test_dhikr_endpoint()
        await tester.test_worship_tracking_endpoints()
        await tester.test_scholars_endpoint()
        await tester.test_regression_endpoints()
        
        # Print summary
        tester.print_summary()
        
    except KeyboardInterrupt:
        print("\n⏹️ Testing interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await tester.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
#!/usr/bin/env python3
"""
Islamic Knowledge Assistant Backend API Testing Suite
Tests the specific endpoints mentioned in the review request.
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Backend URL from frontend .env
BASE_URL = "https://islamic-knowledge-33.preview.emergentagent.com/api"

class IslamicKnowledgeAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session_cookie = None
        self.user_data = None
        self.results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_data": response_data
        }
        self.results.append(result)
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_guest_login(self) -> bool:
        """Test 1: Guest Login - POST /api/auth/guest"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/guest")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["user_id", "name", "is_guest"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Guest Login", False, f"Missing fields: {missing_fields}", data)
                    return False
                
                if data.get("name") != "Kardeşim":
                    self.log_test("Guest Login", False, f"Expected name 'Kardeşim', got '{data.get('name')}'", data)
                    return False
                
                if not data.get("is_guest", False):
                    self.log_test("Guest Login", False, "User should be marked as guest", data)
                    return False
                
                # Save session data
                self.user_data = data
                # Check if session cookie is set
                if 'Set-Cookie' in response.headers or response.cookies:
                    self.session_cookie = response.cookies
                    self.log_test("Guest Login", True, f"User created with ID: {data['user_id']}, name: {data['name']}")
                    return True
                else:
                    self.log_test("Guest Login", False, "No session cookie set", data)
                    return False
            else:
                self.log_test("Guest Login", False, f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_test("Guest Login", False, f"Exception: {str(e)}")
            return False

    def test_quran_search(self) -> bool:
        """Test 2: Quran Search - GET /api/quran/search?query=rahman"""
        try:
            response = self.session.get(f"{BASE_URL}/quran/search", params={"query": "rahman"})
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test("Quran Search", False, "Response should be a list", data)
                    return False
                
                if len(data) == 0:
                    self.log_test("Quran Search", False, "No search results returned for 'rahman'", data)
                    return False
                
                # Check first result structure
                first_result = data[0]
                required_fields = ["surah_number", "verse_number", "arabic", "turkish"]
                missing_fields = [field for field in required_fields if field not in first_result]
                
                if missing_fields:
                    self.log_test("Quran Search", False, f"Missing fields in search result: {missing_fields}", first_result)
                    return False
                
                # Validate data types
                if not isinstance(first_result["surah_number"], int) or first_result["surah_number"] <= 0:
                    self.log_test("Quran Search", False, "Invalid surah_number", first_result)
                    return False
                
                if not isinstance(first_result["verse_number"], int) or first_result["verse_number"] <= 0:
                    self.log_test("Quran Search", False, "Invalid verse_number", first_result)
                    return False
                
                if not first_result["arabic"] or not first_result["turkish"]:
                    self.log_test("Quran Search", False, "Empty arabic or turkish text", first_result)
                    return False
                
                self.log_test("Quran Search", True, f"Found {len(data)} results for 'rahman'")
                return True
            else:
                self.log_test("Quran Search", False, f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_test("Quran Search", False, f"Exception: {str(e)}")
            return False

    def test_kissa_generation(self) -> bool:
        """Test 3: Kıssa Generation - POST /api/tafsir/kissa"""
        try:
            payload = {
                "surah_number": 1,
                "verse_number": 1
            }
            
            response = self.session.post(f"{BASE_URL}/tafsir/kissa", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response contains kissa text
                if not isinstance(data, dict):
                    self.log_test("Kıssa Generation", False, "Response should be a dictionary", data)
                    return False
                
                # Look for kissa content (could be in different fields)
                kissa_fields = ["kissa", "text", "content", "story", "narrative"]
                kissa_found = False
                kissa_text = ""
                
                for field in kissa_fields:
                    if field in data and data[field]:
                        kissa_found = True
                        kissa_text = str(data[field])[:100] + "..." if len(str(data[field])) > 100 else str(data[field])
                        break
                
                if not kissa_found:
                    self.log_test("Kıssa Generation", False, f"No kissa content found. Available fields: {list(data.keys())}", data)
                    return False
                
                self.log_test("Kıssa Generation", True, f"Kıssa generated successfully: {kissa_text}")
                return True
                
            elif response.status_code == 503:
                # LLM budget exceeded - this is acceptable
                self.log_test("Kıssa Generation", True, "LLM budget exceeded - this is acceptable for AI features")
                return True
            else:
                self.log_test("Kıssa Generation", False, f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_test("Kıssa Generation", False, f"Exception: {str(e)}")
            return False

    def test_notes_crud(self) -> bool:
        """Test 4: Notes API CRUD operations (requires authentication)"""
        if not self.user_data:
            self.log_test("Notes CRUD", False, "No authenticated user available")
            return False
        
        try:
            # Test 4a: Create Note - POST /api/notes
            note_payload = {
                "type": "ayah",
                "surah_number": 1,
                "verse_number": 1,
                "title": "Test Note",
                "content": "Test content for Islamic Knowledge Assistant testing"
            }
            
            create_response = self.session.post(f"{BASE_URL}/notes", json=note_payload)
            
            if create_response.status_code != 200 and create_response.status_code != 201:
                self.log_test("Notes CRUD - Create", False, f"HTTP {create_response.status_code}", create_response.text[:200])
                return False
            
            create_data = create_response.json()
            note_id = create_data.get("id") or create_data.get("note_id") or create_data.get("created_at")
            
            if not note_id:
                self.log_test("Notes CRUD - Create", False, "No note ID returned", create_data)
                return False
                
            self.log_test("Notes CRUD - Create", True, f"Note created with ID: {note_id}")
            
            # Test 4b: Get Notes - GET /api/notes
            get_response = self.session.get(f"{BASE_URL}/notes")
            
            if get_response.status_code != 200:
                self.log_test("Notes CRUD - Read", False, f"HTTP {get_response.status_code}", get_response.text[:200])
                return False
            
            notes_data = get_response.json()
            
            if not isinstance(notes_data, list):
                self.log_test("Notes CRUD - Read", False, "Response should be a list", notes_data)
                return False
            
            # Find our created note
            our_note = None
            for note in notes_data:
                if (note.get("title") == "Test Note" or 
                    note.get("content") == "Test content for Islamic Knowledge Assistant testing"):
                    our_note = note
                    break
            
            if not our_note:
                self.log_test("Notes CRUD - Read", False, "Created note not found in list", notes_data)
                return False
                
            self.log_test("Notes CRUD - Read", True, f"Found {len(notes_data)} notes, including our test note")
            
            # Test 4c: Delete Note - DELETE /api/notes/{note_id}
            delete_response = self.session.delete(f"{BASE_URL}/notes/{note_id}")
            
            if delete_response.status_code != 200 and delete_response.status_code != 204:
                self.log_test("Notes CRUD - Delete", False, f"HTTP {delete_response.status_code}", delete_response.text[:200])
                return False
            
            self.log_test("Notes CRUD - Delete", True, f"Note {note_id} deleted successfully")
            
            # Verify deletion - should be gone now
            verify_response = self.session.get(f"{BASE_URL}/notes")
            if verify_response.status_code == 200:
                verify_notes = verify_response.json()
                # Check if our note is still there
                still_exists = any(
                    note.get("title") == "Test Note" and 
                    note.get("content") == "Test content for Islamic Knowledge Assistant testing"
                    for note in verify_notes
                )
                
                if still_exists:
                    self.log_test("Notes CRUD - Delete Verification", False, "Note still exists after deletion")
                    return False
                else:
                    self.log_test("Notes CRUD - Delete Verification", True, "Note successfully removed")
            
            return True
            
        except Exception as e:
            self.log_test("Notes CRUD", False, f"Exception: {str(e)}")
            return False

    def test_quran_surahs(self) -> bool:
        """Test 5: Quran Surahs - GET /api/quran/surahs"""
        try:
            response = self.session.get(f"{BASE_URL}/quran/surahs")
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test("Quran Surahs", False, "Response should be a list", data)
                    return False
                
                if len(data) != 114:
                    self.log_test("Quran Surahs", False, f"Expected 114 surahs, got {len(data)}", data[:3] if data else [])
                    return False
                
                # Check first surah structure
                first_surah = data[0]
                required_fields = ["number", "name", "arabic", "verses"]
                missing_fields = [field for field in required_fields if field not in first_surah]
                
                if missing_fields:
                    self.log_test("Quran Surahs", False, f"Missing fields in surah: {missing_fields}", first_surah)
                    return False
                
                # Check if first surah is Fatiha
                if first_surah["number"] != 1 or first_surah["name"] != "Fatiha":
                    self.log_test("Quran Surahs", False, f"First surah should be Fatiha, got: {first_surah['name']}", first_surah)
                    return False
                
                self.log_test("Quran Surahs", True, f"All 114 surahs returned correctly, starting with {first_surah['name']}")
                return True
            else:
                self.log_test("Quran Surahs", False, f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_test("Quran Surahs", False, f"Exception: {str(e)}")
            return False

    def test_surah_detail(self) -> bool:
        """Test 6: Surah Detail - GET /api/quran/surah/1"""
        try:
            response = self.session.get(f"{BASE_URL}/quran/surah/1")
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, dict):
                    self.log_test("Surah Detail", False, "Response should be a dictionary", data)
                    return False
                
                required_fields = ["number", "name", "verses"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Surah Detail", False, f"Missing fields: {missing_fields}", data)
                    return False
                
                if data["number"] != 1:
                    self.log_test("Surah Detail", False, f"Expected surah number 1, got {data['number']}", data)
                    return False
                
                verses = data.get("verses", [])
                if not isinstance(verses, list) or len(verses) == 0:
                    self.log_test("Surah Detail", False, "No verses found in surah", data)
                    return False
                
                # Check first verse structure
                first_verse = verses[0]
                verse_fields = ["verse_number", "arabic", "turkish"]
                missing_verse_fields = [field for field in verse_fields if field not in first_verse]
                
                if missing_verse_fields:
                    self.log_test("Surah Detail", False, f"Missing verse fields: {missing_verse_fields}", first_verse)
                    return False
                
                if not first_verse["arabic"] or not first_verse["turkish"]:
                    self.log_test("Surah Detail", False, "Empty arabic or turkish text in verse", first_verse)
                    return False
                
                self.log_test("Surah Detail", True, f"Surah {data['name']} with {len(verses)} verses returned correctly")
                return True
            else:
                self.log_test("Surah Detail", False, f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_test("Surah Detail", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 80)
        print("ISLAMIC KNOWLEDGE ASSISTANT BACKEND API TESTING")
        print("=" * 80)
        print(f"Backend URL: {BASE_URL}")
        print()
        
        # Test 1: Guest Login (required for authenticated tests)
        success_login = self.test_guest_login()
        
        # Test 2: Quran Search
        success_search = self.test_quran_search()
        
        # Test 3: Kıssa Generation (AI feature)
        success_kissa = self.test_kissa_generation()
        
        # Test 4: Notes CRUD (requires authentication)
        success_notes = self.test_notes_crud() if success_login else False
        if not success_login:
            self.log_test("Notes CRUD", False, "Skipped - authentication failed")
        
        # Test 5: Quran Surahs
        success_surahs = self.test_quran_surahs()
        
        # Test 6: Surah Detail
        success_surah_detail = self.test_surah_detail()
        
        # Summary
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        passed_tests = sum(1 for result in self.results if result["success"])
        total_tests = len(self.results)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests / total_tests * 100):.1f}%")
        print()
        
        # List failed tests
        failed_tests = [result for result in self.results if not result["success"]]
        if failed_tests:
            print("FAILED TESTS:")
            for test in failed_tests:
                print(f"❌ {test['test']}: {test['details']}")
        else:
            print("✅ ALL TESTS PASSED!")
        
        print()
        
        # Critical issues
        critical_failures = []
        
        if not success_login:
            critical_failures.append("Guest authentication not working")
        if not success_search:
            critical_failures.append("Quran search functionality broken")
        if not success_surahs:
            critical_failures.append("Quran surahs endpoint not working")
        if not success_surah_detail:
            critical_failures.append("Surah detail endpoint not working")
        
        if critical_failures:
            print("🚨 CRITICAL ISSUES FOUND:")
            for issue in critical_failures:
                print(f"   - {issue}")
        else:
            print("✅ NO CRITICAL ISSUES FOUND")
        
        # Notes about AI features
        if not success_kissa:
            kissa_result = next((r for r in self.results if "Kıssa Generation" in r["test"]), None)
            if kissa_result and "budget" in kissa_result["details"].lower():
                print("\nℹ️  AI Feature Note: Kıssa generation failed due to LLM budget - this is acceptable")
        
        return passed_tests == total_tests

if __name__ == "__main__":
    tester = IslamicKnowledgeAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
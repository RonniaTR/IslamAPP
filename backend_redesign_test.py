#!/usr/bin/env python3
"""
Backend API Tests for Islamic Life Assistant after UI Redesign
Tests the specific endpoints mentioned in the review request
"""

import requests
import json
from typing import Dict, Any

# Backend URL from frontend/.env
BASE_URL = "https://islamic-superapp-2.preview.emergentagent.com/api"

def test_auth_endpoints():
    """Test authentication endpoints"""
    print("\n🔐 Testing Authentication Endpoints...")
    
    # Test 1: GET /api/auth/me without auth should return 401
    print("1. Testing GET /auth/me without authentication...")
    response = requests.get(f"{BASE_URL}/auth/me")
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    print("   ✅ Returns 401 without auth as expected")
    
    # Test 2: POST /api/auth/guest should return user with name "Kardeşim"
    print("2. Testing POST /auth/guest...")
    response = requests.post(f"{BASE_URL}/auth/guest")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    user_data = response.json()
    assert user_data["name"] == "Kardeşim", f"Expected name 'Kardeşim', got '{user_data['name']}'"
    print(f"   ✅ Guest user created with name: {user_data['name']}")
    
    # Extract session token from cookie
    session_token = None
    if 'set-cookie' in response.headers:
        cookies = response.headers['set-cookie']
        if 'session_token=' in cookies:
            session_token = cookies.split('session_token=')[1].split(';')[0]
    
    # Test auth/me with the session cookies
    print("3. Testing GET /auth/me with guest session cookies...")
    auth_response = requests.get(f"{BASE_URL}/auth/me", cookies=response.cookies)
    assert auth_response.status_code == 200, f"Expected 200, got {auth_response.status_code}"
    
    auth_data = auth_response.json()
    assert auth_data["name"] == "Kardeşim", f"Auth endpoint returned wrong name: {auth_data['name']}"
    print("   ✅ Auth/me works with guest session cookies")
    
    return session_token

def test_hadith_random_endpoint():
    """Test the new random hadith endpoint"""
    print("\n📖 Testing New Hadith Random Endpoint...")
    
    response = requests.get(f"{BASE_URL}/hadith/random")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    hadith = response.json()
    
    # Check required fields
    required_fields = ["id", "arabic", "turkish", "source", "narrator", "category"]
    for field in required_fields:
        assert field in hadith, f"Missing required field: {field}"
        assert hadith[field], f"Field {field} is empty"
    
    print(f"   ✅ Random hadith returned with all required fields")
    print(f"   📋 ID: {hadith['id']}")
    print(f"   📋 Category: {hadith['category']}")
    print(f"   📋 Narrator: {hadith['narrator']}")
    print(f"   📋 Source: {hadith['source']}")
    print(f"   📋 Arabic text length: {len(hadith['arabic'])} characters")
    print(f"   📋 Turkish text length: {len(hadith['turkish'])} characters")

def test_existing_endpoints_regression():
    """Test existing endpoints to ensure they still work after redesign"""
    print("\n🔄 Testing Existing Endpoints (Regression Tests)...")
    
    # Test 1: GET /api/quran/random
    print("1. Testing GET /quran/random...")
    response = requests.get(f"{BASE_URL}/quran/random")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    verse = response.json()
    assert "arabic" in verse, "Random verse missing 'arabic' field"
    assert "turkish" in verse, "Random verse missing 'turkish' field"
    print(f"   ✅ Random verse returned - Surah {verse.get('surah_number', 'N/A')}, Verse {verse.get('verse_number', 'N/A')}")
    
    # Test 2: GET /api/prayer-times/istanbul
    print("2. Testing GET /prayer-times/istanbul...")
    response = requests.get(f"{BASE_URL}/prayer-times/istanbul")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    prayer_times = response.json()
    expected_prayers = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
    for prayer in expected_prayers:
        assert prayer in prayer_times, f"Missing prayer time: {prayer}"
    print(f"   ✅ Istanbul prayer times returned with all 6 prayers")
    
    # Test 3: GET /api/hadith/all
    print("3. Testing GET /hadith/all...")
    response = requests.get(f"{BASE_URL}/hadith/all")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    hadiths = response.json()
    assert isinstance(hadiths, list), "Hadiths should be returned as array"
    assert len(hadiths) > 0, "Should return at least one hadith"
    
    # Check first hadith structure
    first_hadith = hadiths[0]
    required_fields = ["id", "arabic", "turkish", "source", "narrator", "category"]
    for field in required_fields:
        assert field in first_hadith, f"Missing field {field} in hadith"
    
    print(f"   ✅ All hadiths returned - Total count: {len(hadiths)}")
    
    # Test 4: GET /api/quran/surahs
    print("4. Testing GET /quran/surahs...")
    response = requests.get(f"{BASE_URL}/quran/surahs")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    surahs = response.json()
    assert isinstance(surahs, list), "Surahs should be returned as array"
    assert len(surahs) == 114, f"Should return exactly 114 surahs, got {len(surahs)}"
    
    # Check first surah structure
    first_surah = surahs[0]
    assert "number" in first_surah, "Surah missing 'number' field"
    assert "name" in first_surah, "Surah missing 'name' field"
    assert "turkish_name" in first_surah, "Surah missing 'turkish_name' field"
    assert first_surah["number"] == 1, "First surah should be number 1 (Al-Fatiha)"
    
    print(f"   ✅ All 114 surahs returned - First surah: {first_surah['name']} ({first_surah['turkish_name']})")

def main():
    """Main test function"""
    print("🧪 Islamic Life Assistant Backend API Tests - Post UI Redesign")
    print("=" * 70)
    
    try:
        # Test authentication endpoints
        session_token = test_auth_endpoints()
        
        # Test new hadith random endpoint
        test_hadith_random_endpoint()
        
        # Test existing endpoints for regression
        test_existing_endpoints_regression()
        
        print("\n" + "=" * 70)
        print("🎉 ALL BACKEND API TESTS PASSED SUCCESSFULLY!")
        print("✅ Auth endpoints working correctly")
        print("✅ New random hadith endpoint working")
        print("✅ All existing endpoints still functional")
        print("🚀 Backend API is ready for production after UI redesign")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        print("🚨 Backend API has issues that need to be addressed")
        raise

if __name__ == "__main__":
    main()
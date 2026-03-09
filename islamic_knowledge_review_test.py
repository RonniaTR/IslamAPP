#!/usr/bin/env python3
"""
Islamic Knowledge Assistant API Testing
Testing the 6 specific endpoints from review request
"""

import asyncio
import aiohttp
import json
from datetime import datetime
import sys

# Backend URL
BACKEND_URL = "https://islamic-superapp-2.preview.emergentagent.com/api"

# Global session cookie storage
session_cookies = None

async def test_guest_login(session):
    """Test 1: POST /api/auth/guest - Returns user with session cookie"""
    global session_cookies
    
    print("=== Test 1: Guest Login ===")
    try:
        async with session.post(f"{BACKEND_URL}/auth/guest") as resp:
            print(f"Status: {resp.status}")
            
            if resp.status == 200:
                data = await resp.json()
                print(f"✅ Guest user created: {data.get('name')} (user_id: {data.get('user_id')})")
                
                # Extract session cookie
                cookies = resp.cookies
                if 'session_token' in cookies:
                    session_cookies = {'session_token': cookies['session_token'].value}
                    print(f"✅ Session cookie saved")
                else:
                    print("⚠️ No session cookie in response")
                
                return True
            else:
                print(f"❌ Failed with status {resp.status}")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def test_quran_search(session):
    """Test 2: GET /api/quran/search?query=sabir - Turkish keyword search"""
    print("\n=== Test 2: Quran Search ===")
    try:
        params = {'query': 'sabir'}  # Note: Changed from 'rahman' to 'sabir' as requested
        async with session.get(f"{BACKEND_URL}/quran/search", params=params) as resp:
            print(f"Status: {resp.status}")
            
            if resp.status == 200:
                data = await resp.json()
                print(f"✅ Search results: {len(data)} verses found for 'sabir'")
                if data:
                    # Show first result
                    verse = data[0]
                    print(f"   First result: Surah {verse.get('surah_number')}, Verse {verse.get('verse_number')}")
                    print(f"   Turkish: {verse.get('turkish', '')[:100]}...")
                return True
            else:
                print(f"❌ Failed with status {resp.status}")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def test_kissa_generation(session):
    """Test 3: POST /api/tafsir/kissa with surah 2, verse 255 (Ayetel Kursi)"""
    print("\n=== Test 3: Kıssa Generation ===")
    try:
        payload = {
            "surah_number": 2,
            "verse_number": 255
        }
        
        # Use longer timeout for AI generation
        timeout = aiohttp.ClientTimeout(total=30)
        async with session.post(f"{BACKEND_URL}/tafsir/kissa", json=payload, timeout=timeout) as resp:
            print(f"Status: {resp.status}")
            
            if resp.status == 200:
                data = await resp.json()
                kissa_text = data.get('kissa', '')
                print(f"✅ Kıssa generated successfully")
                print(f"   Surah: {data.get('surah_name')} ({data.get('surah_number')})")
                print(f"   Verse: {data.get('verse_number')}")
                print(f"   Kıssa length: {len(kissa_text)} characters")
                print(f"   Scholar: {data.get('scholar_name')}")
                if kissa_text:
                    print(f"   Preview: {kissa_text[:150]}...")
                return True
            else:
                error_text = await resp.text()
                print(f"❌ Failed with status {resp.status}")
                print(f"   Error: {error_text}")
                return False
                
    except asyncio.TimeoutError:
        print("❌ Timeout: Kıssa generation took too long (>30s)")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def test_notes_crud(session):
    """Test 4: Notes CRUD - Create, List, Delete (requires auth cookie)"""
    print("\n=== Test 4: Notes CRUD ===")
    
    if not session_cookies:
        print("❌ No session cookie available for authentication")
        return False
    
    try:
        # Step 4a: Create a note
        note_data = {
            "type": "kissa",
            "surah_number": 2,
            "verse_number": 255,
            "title": "Test Note - Ayetel Kursi",
            "content": "This is a test note for Ayetel Kursi verse",
            "scholar_name": "Test Scholar"
        }
        
        async with session.post(f"{BACKEND_URL}/notes", json=note_data, cookies=session_cookies) as resp:
            print(f"Create Note Status: {resp.status}")
            if resp.status != 200:
                error = await resp.text()
                print(f"❌ Create note failed: {error}")
                return False
            
            created_note = await resp.json()
            note_created_at = created_note.get('created_at')
            print(f"✅ Note created: {created_note.get('title')}")
        
        # Step 4b: List notes
        async with session.get(f"{BACKEND_URL}/notes", cookies=session_cookies) as resp:
            print(f"List Notes Status: {resp.status}")
            if resp.status != 200:
                error = await resp.text()
                print(f"❌ List notes failed: {error}")
                return False
            
            notes = await resp.json()
            print(f"✅ Notes retrieved: {len(notes)} notes found")
            
            # Find our test note
            test_note_found = False
            for note in notes:
                if note.get('title') == "Test Note - Ayetel Kursi":
                    test_note_found = True
                    print(f"   Found test note: {note.get('title')}")
                    break
            
            if not test_note_found:
                print("⚠️ Test note not found in list")
        
        # Step 4c: Delete the note
        if note_created_at:
            delete_url = f"{BACKEND_URL}/notes/{note_created_at}"
            async with session.delete(delete_url, cookies=session_cookies) as resp:
                print(f"Delete Note Status: {resp.status}")
                if resp.status != 200:
                    error = await resp.text()
                    print(f"❌ Delete note failed: {error}")
                    return False
                
                print(f"✅ Note deleted successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in Notes CRUD: {e}")
        return False

async def test_quran_surahs(session):
    """Test 5: GET /api/quran/surahs"""
    print("\n=== Test 5: Quran Surahs List ===")
    try:
        async with session.get(f"{BACKEND_URL}/quran/surahs") as resp:
            print(f"Status: {resp.status}")
            
            if resp.status == 200:
                data = await resp.json()
                print(f"✅ Surahs retrieved: {len(data)} surahs")
                if len(data) >= 114:
                    print(f"✅ Complete Quran: All 114 surahs present")
                    # Show first few surahs
                    for i in range(min(3, len(data))):
                        surah = data[i]
                        print(f"   {surah.get('number')}: {surah.get('name')} ({surah.get('verses')} verses)")
                else:
                    print(f"⚠️ Incomplete: Only {len(data)} surahs found")
                return True
            else:
                print(f"❌ Failed with status {resp.status}")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def test_surah_detail(session):
    """Test 6: GET /api/quran/surah/2?reciter=alafasy"""
    print("\n=== Test 6: Surah Detail ===")
    try:
        params = {'reciter': 'alafasy'}
        async with session.get(f"{BACKEND_URL}/quran/surah/2", params=params) as resp:
            print(f"Status: {resp.status}")
            
            if resp.status == 200:
                data = await resp.json()
                print(f"✅ Surah details retrieved")
                print(f"   Surah: {data.get('name')} (Number: {data.get('number')})")
                print(f"   Verses: {len(data.get('verses', []))}")
                print(f"   Reciter: {data.get('reciter_name')}")
                print(f"   Audio URL: {data.get('full_surah_audio')}")
                
                # Check if verses have required fields
                verses = data.get('verses', [])
                if verses:
                    first_verse = verses[0]
                    has_arabic = bool(first_verse.get('arabic'))
                    has_turkish = bool(first_verse.get('turkish'))
                    has_audio = bool(first_verse.get('audio_url'))
                    print(f"   Verse content: Arabic ✅" if has_arabic else "   Verse content: Arabic ❌")
                    print(f"   Verse content: Turkish ✅" if has_turkish else "   Verse content: Turkish ❌")
                    print(f"   Verse content: Audio ✅" if has_audio else "   Verse content: Audio ❌")
                
                return True
            else:
                print(f"❌ Failed with status {resp.status}")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def run_all_tests():
    """Run all tests in sequence"""
    print("🧪 Islamic Knowledge Assistant API Testing")
    print("=" * 60)
    
    # Configure session with proper headers
    connector = aiohttp.TCPConnector(ssl=False)
    timeout = aiohttp.ClientTimeout(total=30)
    headers = {
        'User-Agent': 'Islamic-Knowledge-Test/1.0',
        'Content-Type': 'application/json'
    }
    
    async with aiohttp.ClientSession(connector=connector, timeout=timeout, headers=headers) as session:
        
        results = []
        
        # Run tests in order
        tests = [
            ("Guest Login", test_guest_login),
            ("Quran Search", test_quran_search),
            ("Kıssa Generation", test_kissa_generation),
            ("Notes CRUD", test_notes_crud),
            ("Quran Surahs", test_quran_surahs),
            ("Surah Detail", test_surah_detail),
        ]
        
        for test_name, test_func in tests:
            try:
                result = await test_func(session)
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results.append((test_name, False))
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name:20} {status}")
            if result:
                passed += 1
        
        print("-" * 60)
        print(f"Total: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 All tests passed! API is working correctly.")
            return True
        else:
            failed = total - passed
            print(f"⚠️  {failed} test(s) failed. See details above.")
            return False

if __name__ == "__main__":
    try:
        success = asyncio.run(run_all_tests())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Fatal error: {e}")
        sys.exit(1)
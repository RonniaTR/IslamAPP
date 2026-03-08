#!/usr/bin/env python3
"""
Debug Authentication Issues - Islamic Life Assistant
"""

import asyncio
import subprocess
import aiohttp
import time

BASE_URL = "https://quranic-login-1.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

async def debug_logout_issue():
    """Debug the logout session invalidation issue"""
    print("🔍 DEBUGGING LOGOUT ISSUE")
    print("=" * 50)
    
    # Create test user and session
    timestamp = int(time.time() * 1000)
    user_id = f"debug-user-{timestamp}"
    session_token = f"debug_session_{timestamp}"
    
    mongo_cmd = f'''mongosh --eval "
use('test_database');
var userId = '{user_id}';
var sessionToken = '{session_token}';
db.users.insertOne({{
  user_id: userId,
  email: 'debug.user.{timestamp}@example.com',
  name: 'Debug User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date(),
  is_guest: false,
  language: 'tr',
  theme: 'dark',
  total_points: 0,
  quizzes_played: 0,
  streak_days: 0
}});
db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
print('Debug session created: ' + sessionToken);
"'''
    
    result = subprocess.run(mongo_cmd, shell=True, capture_output=True, text=True)
    if "Debug session created:" not in result.stdout:
        print(f"❌ Failed to create debug session: {result.stderr}")
        return
    
    print(f"✅ Created debug user: {user_id}")
    print(f"✅ Created debug session: {session_token}")
    
    async with aiohttp.ClientSession() as session:
        headers = {"Authorization": f"Bearer {session_token}"}
        
        # Test 1: Verify session works before logout
        print("\n1. Testing session before logout...")
        async with session.get(f"{API_BASE}/auth/me", headers=headers) as resp:
            if resp.status == 200:
                user_data = await resp.json()
                print(f"✅ Session valid - User: {user_data.get('name')}")
            else:
                print(f"❌ Session invalid - Status: {resp.status}")
                return
        
        # Check session in database before logout
        print("\n2. Checking session in database before logout...")
        check_cmd = f'''mongosh --eval "
use('test_database');
var session = db.user_sessions.findOne({{'session_token': '{session_token}'}});
print('Session exists: ' + (session ? 'YES' : 'NO'));
if (session) print('User ID: ' + session.user_id);
"'''
        result = subprocess.run(check_cmd, shell=True, capture_output=True, text=True)
        print(f"Database check: {result.stdout.strip()}")
        
        # Test 2: Perform logout
        print("\n3. Performing logout...")
        async with session.post(f"{API_BASE}/auth/logout", headers=headers) as resp:
            if resp.status == 200:
                logout_data = await resp.json()
                print(f"✅ Logout response: {logout_data}")
            else:
                print(f"❌ Logout failed - Status: {resp.status}")
        
        # Check session in database after logout
        print("\n4. Checking session in database after logout...")
        check_cmd = f'''mongosh --eval "
use('test_database');
var session = db.user_sessions.findOne({{'session_token': '{session_token}'}});
print('Session exists: ' + (session ? 'YES' : 'NO'));
var count = db.user_sessions.countDocuments({{'session_token': '{session_token}'}});
print('Session count: ' + count);
"'''
        result = subprocess.run(check_cmd, shell=True, capture_output=True, text=True)
        print(f"Database check: {result.stdout.strip()}")
        
        # Test 3: Verify session is invalidated after logout
        print("\n5. Testing session after logout...")
        async with session.get(f"{API_BASE}/auth/me", headers=headers) as resp:
            if resp.status == 401:
                print("✅ Session correctly invalidated - Returns 401")
            else:
                user_data = await resp.json() if resp.status == 200 else await resp.text()
                print(f"❌ Session still valid - Status: {resp.status}, Data: {user_data}")
        
        # Test 4: Check if there are multiple sessions for this token
        print("\n6. Checking for duplicate sessions...")
        check_cmd = f'''mongosh --eval "
use('test_database');
var sessions = db.user_sessions.find({{'session_token': '{session_token}'}}).toArray();
print('Total sessions found: ' + sessions.length);
sessions.forEach(function(s, i) {{
  print('Session ' + (i+1) + ': user_id=' + s.user_id + ', expires_at=' + s.expires_at);
}});
"'''
        result = subprocess.run(check_cmd, shell=True, capture_output=True, text=True)
        print(f"Duplicate check: {result.stdout.strip()}")

async def debug_cookie_auth():
    """Debug cookie-based authentication"""
    print("\n\n🍪 DEBUGGING COOKIE AUTHENTICATION")
    print("=" * 50)
    
    # Create a fresh session for cookie testing
    timestamp = int(time.time() * 1000)
    user_id = f"cookie-user-{timestamp}"
    session_token = f"cookie_session_{timestamp}"
    
    mongo_cmd = f'''mongosh --eval "
use('test_database');
var userId = '{user_id}';
var sessionToken = '{session_token}';
db.users.insertOne({{
  user_id: userId,
  email: 'cookie.user.{timestamp}@example.com',
  name: 'Cookie User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date(),
  is_guest: false,
  language: 'tr',
  theme: 'dark',
  total_points: 0,
  quizzes_played: 0,
  streak_days: 0
}});
db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
print('Cookie session created: ' + sessionToken);
"'''
    
    result = subprocess.run(mongo_cmd, shell=True, capture_output=True, text=True)
    print(f"✅ Created cookie test session: {session_token}")
    
    # Test cookie authentication
    cookies = {"session_token": session_token}
    
    async with aiohttp.ClientSession(cookies=cookies) as session:
        print("\n1. Testing cookie-based authentication...")
        async with session.get(f"{API_BASE}/auth/me") as resp:
            if resp.status == 200:
                user_data = await resp.json()
                print(f"✅ Cookie auth works - User: {user_data.get('name')}")
            else:
                text = await resp.text()
                print(f"❌ Cookie auth failed - Status: {resp.status}, Response: {text}")
        
        # Test both header and cookie (header should take precedence)
        headers = {"Authorization": f"Bearer {session_token}"}
        print("\n2. Testing both cookie and Bearer token...")
        async with session.get(f"{API_BASE}/auth/me", headers=headers) as resp:
            if resp.status == 200:
                user_data = await resp.json()
                print(f"✅ Both auth methods work - User: {user_data.get('name')}")
            else:
                text = await resp.text()
                print(f"❌ Both auth methods failed - Status: {resp.status}, Response: {text}")

async def test_specific_cities():
    """Test specific city IDs that should exist"""
    print("\n\n🌍 DEBUGGING PRAYER TIMES ENDPOINT")
    print("=" * 50)
    
    async with aiohttp.ClientSession() as session:
        # Get available cities first
        print("1. Getting available cities...")
        async with session.get(f"{API_BASE}/cities") as resp:
            if resp.status == 200:
                cities = await resp.json()
                print(f"✅ Found {len(cities)} cities")
                # Print first few cities
                for i, city in enumerate(cities[:3]):
                    print(f"   City {city['id']}: {city['name']}")
                
                # Test prayer times for first city
                if cities:
                    first_city_id = cities[0]['id']
                    print(f"\n2. Testing prayer times for city ID: {first_city_id}")
                    async with session.get(f"{API_BASE}/prayer-times/{first_city_id}") as prayer_resp:
                        if prayer_resp.status == 200:
                            prayer_data = await prayer_resp.json()
                            print(f"✅ Prayer times work for city {first_city_id}")
                        else:
                            text = await prayer_resp.text()
                            print(f"❌ Prayer times failed - Status: {prayer_resp.status}, Response: {text}")
            else:
                text = await resp.text()
                print(f"❌ Cities endpoint failed - Status: {resp.status}, Response: {text}")

async def cleanup_debug_data():
    """Clean up debug test data"""
    print("\n\n🧹 CLEANING UP DEBUG DATA")
    print("=" * 30)
    
    cleanup_cmd = '''mongosh --eval "
use('test_database');
var result1 = db.users.deleteMany({email: /debug\\.user\\./});
var result2 = db.user_sessions.deleteMany({session_token: /debug_session/});
var result3 = db.users.deleteMany({email: /cookie\\.user\\./});
var result4 = db.user_sessions.deleteMany({session_token: /cookie_session/});
print('Deleted ' + (result1.deletedCount + result3.deletedCount) + ' debug users');
print('Deleted ' + (result2.deletedCount + result4.deletedCount) + ' debug sessions');
"'''
    
    result = subprocess.run(cleanup_cmd, shell=True, capture_output=True, text=True)
    print(f"Cleanup result: {result.stdout.strip()}")

async def main():
    """Run debug tests"""
    await debug_logout_issue()
    await debug_cookie_auth()
    await test_specific_cities()
    await cleanup_debug_data()

if __name__ == "__main__":
    asyncio.run(main())
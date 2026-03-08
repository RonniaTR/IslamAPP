#!/usr/bin/env python3
"""
Debug Frontend Cookie Authentication Issues
"""

import asyncio
import subprocess
import time
from playwright.async_api import async_playwright
import aiohttp

BASE_URL = "https://quranic-login-1.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

async def create_test_session():
    """Create a test session and return user_id and session_token"""
    timestamp = int(time.time() * 1000)
    user_id = f"cookie-debug-{timestamp}"
    session_token = f"cookie_debug_session_{timestamp}"
    
    mongo_cmd = f'''mongosh --eval "
use('test_database');
var userId = '{user_id}';
var sessionToken = '{session_token}';
db.users.insertOne({{
  user_id: userId,
  email: 'cookie.debug.{timestamp}@example.com',
  name: 'Cookie Debug User',
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
print('Cookie debug session created: ' + sessionToken);
"'''
    
    result = subprocess.run(mongo_cmd, shell=True, capture_output=True, text=True)
    if "Cookie debug session created:" in result.stdout:
        return user_id, session_token
    else:
        print(f"Failed to create session: {result.stderr}")
        return None, None

async def test_backend_cookie_scenarios():
    """Test different cookie scenarios on backend"""
    print("🔍 TESTING BACKEND COOKIE SCENARIOS")
    print("=" * 50)
    
    user_id, session_token = await create_test_session()
    if not session_token:
        return
    
    print(f"✅ Created session: {session_token}")
    
    # Test 1: Direct API call with cookies
    async with aiohttp.ClientSession() as session:
        cookies = {"session_token": session_token}
        
        print("\n1. Testing direct cookie authentication...")
        async with session.get(f"{API_BASE}/auth/me", cookies=cookies) as resp:
            if resp.status == 200:
                data = await resp.json()
                print(f"✅ Direct cookie auth works: {data['name']}")
            else:
                text = await resp.text()
                print(f"❌ Direct cookie auth failed: {resp.status} - {text}")
        
        # Test 2: Cookie with proper headers
        print("\n2. Testing cookie with credentials headers...")
        headers = {
            "Origin": BASE_URL,
            "Referer": BASE_URL,
            "Cookie": f"session_token={session_token}"
        }
        
        async with session.get(f"{API_BASE}/auth/me", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                print(f"✅ Cookie with headers works: {data['name']}")
            else:
                text = await resp.text()
                print(f"❌ Cookie with headers failed: {resp.status} - {text}")

async def test_browser_cookie_scenarios():
    """Test different browser cookie scenarios"""
    print("\n\n🌐 TESTING BROWSER COOKIE SCENARIOS")
    print("=" * 50)
    
    user_id, session_token = await create_test_session()
    if not session_token:
        return
    
    print(f"✅ Created browser session: {session_token}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 390, 'height': 844}
        )
        page = await context.new_page()
        
        print("\n1. Testing cookie set via JavaScript...")
        
        # Navigate to the site first
        await page.goto(BASE_URL)
        await page.wait_for_load_state('networkidle')
        
        # Set cookie via JavaScript
        await page.evaluate(f"""
            document.cookie = "session_token={session_token}; path=/; domain=quranic-login-1.preview.emergentagent.com; secure; samesite=none";
        """)
        
        # Check if cookie was set
        cookies = await page.context.cookies()
        session_cookie = next((c for c in cookies if c['name'] == 'session_token'), None)
        
        if session_cookie:
            print(f"✅ Cookie set via JS: {session_cookie['value'][:20]}...")
        else:
            print("❌ Cookie not set via JavaScript")
        
        # Reload and check auth
        await page.reload(wait_until='networkidle')
        current_url = page.url
        
        print(f"URL after reload with cookie: {current_url}")
        
        if "/login" not in current_url:
            print("✅ Cookie authentication successful - not on login page")
        else:
            print("❌ Cookie authentication failed - still on login page")
            
            # Debug: Check what the frontend is doing
            print("\n2. Debugging frontend auth check...")
            
            # Check if AuthContext is making the /auth/me call
            page.on('request', lambda request: print(f"Request: {request.method} {request.url}"))
            page.on('response', lambda response: print(f"Response: {response.status} {response.url}"))
            
            # Wait a bit more and check console logs
            await page.wait_for_timeout(3000)
            
            # Check console logs
            logs = []
            page.on('console', lambda msg: logs.append(f"Console: {msg.text}"))
            
            await page.reload(wait_until='networkidle')
            await page.wait_for_timeout(2000)
            
            print("\nConsole logs:")
            for log in logs[-10:]:  # Last 10 logs
                print(f"  {log}")
        
        print("\n3. Testing manual API call from browser...")
        
        # Test making the API call directly from browser context
        api_response = await page.evaluate(f"""
            fetch('{API_BASE}/auth/me', {{
                method: 'GET',
                credentials: 'include',
                headers: {{
                    'Content-Type': 'application/json'
                }}
            }}).then(r => r.json()).then(data => {{
                return {{ status: 'success', data: data }};
            }}).catch(err => {{
                return {{ status: 'error', error: err.message }};
            }})
        """)
        
        print(f"Direct API call result: {api_response}")
        
        await browser.close()

async def test_logout_verification_fix():
    """Test logout with proper session isolation"""
    print("\n\n🔐 TESTING LOGOUT VERIFICATION (FIXED)")
    print("=" * 50)
    
    user_id, session_token = await create_test_session()
    if not session_token:
        return
    
    print(f"✅ Created logout test session: {session_token}")
    
    # Test with separate sessions to avoid connection reuse issues
    headers = {"Authorization": f"Bearer {session_token}"}
    
    # Step 1: Verify session works
    async with aiohttp.ClientSession() as session1:
        async with session1.get(f"{API_BASE}/auth/me", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                print(f"✅ Session valid before logout: {data['name']}")
            else:
                print(f"❌ Session invalid before logout: {resp.status}")
                return
    
    # Step 2: Perform logout
    async with aiohttp.ClientSession() as session2:
        async with session2.post(f"{API_BASE}/auth/logout", headers=headers) as resp:
            if resp.status == 200:
                print("✅ Logout successful")
            else:
                print(f"❌ Logout failed: {resp.status}")
                return
    
    # Step 3: Verify session is invalidated (using fresh session)
    async with aiohttp.ClientSession() as session3:
        async with session3.get(f"{API_BASE}/auth/me", headers=headers) as resp:
            if resp.status == 401:
                print("✅ Session correctly invalidated after logout")
            else:
                data = await resp.json() if resp.status == 200 else await resp.text()
                print(f"❌ Session still valid after logout: {resp.status} - {data}")

async def cleanup():
    """Clean up debug data"""
    cleanup_cmd = '''mongosh --eval "
use('test_database');
var result1 = db.users.deleteMany({email: /cookie\\.debug\\./});
var result2 = db.user_sessions.deleteMany({session_token: /cookie_debug_session/});
print('Cleaned up ' + result1.deletedCount + ' users and ' + result2.deletedCount + ' sessions');
"'''
    
    result = subprocess.run(cleanup_cmd, shell=True, capture_output=True, text=True)
    print(f"\n🧹 Cleanup: {result.stdout.strip()}")

async def main():
    try:
        await test_backend_cookie_scenarios()
        await test_browser_cookie_scenarios()
        await test_logout_verification_fix()
    finally:
        await cleanup()

if __name__ == "__main__":
    asyncio.run(main())
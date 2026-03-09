#!/usr/bin/env python3
"""
Comprehensive Google OAuth Authentication Testing - FINAL VERSION
Tests all authentication flows with proper endpoint validation
"""

import asyncio
import json
import uuid
import subprocess
import time
from datetime import datetime, timezone, timedelta
from playwright.async_api import async_playwright
import aiohttp

# Test configuration
BASE_URL = "https://islamic-superapp-2.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

def print_header(title):
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}{Colors.BOLD}{title:^60}{Colors.RESET}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.RESET}\n")

def print_test(name, status, details=""):
    status_color = Colors.GREEN if status == "PASS" else Colors.RED if status == "FAIL" else Colors.YELLOW
    print(f"{Colors.CYAN}• {name:<50}{status_color}{status:>8}{Colors.RESET}")
    if details:
        print(f"  {Colors.WHITE}{details}{Colors.RESET}")

async def create_test_user_session():
    """Create test user and session in MongoDB"""
    try:
        # Generate unique test data
        timestamp = int(time.time() * 1000)
        user_id = f"test-user-{timestamp}"
        session_token = f"test_session_{timestamp}"
        
        # MongoDB command to create test user and session
        mongo_cmd = f'''mongosh --eval "
use('test_database');
var userId = '{user_id}';
var sessionToken = '{session_token}';
db.users.insertOne({{
  user_id: userId,
  email: 'test.user.{timestamp}@example.com',
  name: 'Test User Auth',
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
print('SUCCESS: User and session created');
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"'''
        
        result = subprocess.run(mongo_cmd, shell=True, capture_output=True, text=True, timeout=30)
        
        if "SUCCESS: User and session created" in result.stdout:
            # Extract session token from output
            for line in result.stdout.split('\n'):
                if 'Session token:' in line:
                    session_token = line.split('Session token:')[1].strip()
                elif 'User ID:' in line:
                    user_id = line.split('User ID:')[1].strip()
            
            return user_id, session_token
        else:
            print_test("Create test user & session", "FAIL", result.stderr or result.stdout)
            return None, None
            
    except Exception as e:
        print_test("Create test user & session", "FAIL", str(e))
        return None, None

async def test_backend_auth_apis():
    """Test all authentication API endpoints comprehensively"""
    print_header("BACKEND AUTH API COMPREHENSIVE TESTS")
    
    # Step 1: Create test user and session
    user_id, session_token = await create_test_user_session()
    if not session_token:
        print_test("Create test session for API tests", "FAIL", "Could not create session")
        return False
    
    print_test("Create test session", "PASS", f"User: {user_id}")
    
    async with aiohttp.ClientSession() as session:
        
        # Test 1: GET /api/auth/me without auth → should return 401
        try:
            async with session.get(f"{API_BASE}/auth/me") as resp:
                if resp.status == 401:
                    print_test("GET /auth/me without auth", "PASS", "Returns 401 Unauthorized")
                else:
                    print_test("GET /auth/me without auth", "FAIL", f"Expected 401, got {resp.status}")
        except Exception as e:
            print_test("GET /auth/me without auth", "FAIL", str(e))
        
        # Test 2: GET /api/auth/me with valid Bearer token
        try:
            headers = {"Authorization": f"Bearer {session_token}"}
            async with session.get(f"{API_BASE}/auth/me", headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if "user_id" in data and "name" in data and data["name"] == "Test User Auth":
                        print_test("GET /auth/me with Bearer token", "PASS", f"Returns user: {data['name']}")
                    else:
                        print_test("GET /auth/me with Bearer token", "FAIL", f"Invalid user data: {data}")
                else:
                    text = await resp.text()
                    print_test("GET /auth/me with Bearer token", "FAIL", f"Status {resp.status}: {text}")
        except Exception as e:
            print_test("GET /auth/me with Bearer token", "FAIL", str(e))
        
        # Test 3: GET /api/auth/me with cookie authentication
        try:
            cookies = {"session_token": session_token}
            async with aiohttp.ClientSession(cookies=cookies) as cookie_session:
                async with cookie_session.get(f"{API_BASE}/auth/me") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if "user_id" in data and data["name"] == "Test User Auth":
                            print_test("GET /auth/me with cookie", "PASS", f"Cookie auth works: {data['name']}")
                        else:
                            print_test("GET /auth/me with cookie", "FAIL", f"Invalid cookie user data: {data}")
                    else:
                        text = await resp.text()
                        print_test("GET /auth/me with cookie", "FAIL", f"Cookie auth failed - Status {resp.status}: {text}")
        except Exception as e:
            print_test("GET /auth/me with cookie", "FAIL", str(e))
        
        # Test 4: POST /api/auth/session with invalid session_id → should return 401
        try:
            fake_session_id = "fake_session_12345"
            async with session.post(f"{API_BASE}/auth/session?session_id={fake_session_id}") as resp:
                if resp.status == 401:
                    print_test("POST /auth/session invalid session_id", "PASS", "Returns 401 Unauthorized")
                else:
                    text = await resp.text()
                    print_test("POST /auth/session invalid session_id", "FAIL", f"Expected 401, got {resp.status}: {text}")
        except Exception as e:
            print_test("POST /auth/session invalid session_id", "FAIL", str(e))
        
        # Test 5: POST /auth/guest → should create guest user
        try:
            async with session.post(f"{API_BASE}/auth/guest") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if "user_id" in data and "is_guest" in data and data["is_guest"] == True:
                        print_test("POST /auth/guest", "PASS", f"Created guest user: {data['user_id']}")
                    else:
                        print_test("POST /auth/guest", "FAIL", f"Invalid guest user data: {data}")
                else:
                    text = await resp.text()
                    print_test("POST /auth/guest", "FAIL", f"Status {resp.status}: {text}")
        except Exception as e:
            print_test("POST /auth/guest", "FAIL", str(e))
        
        # Test 6: POST /api/auth/logout with Bearer token → should clear session
        try:
            headers = {"Authorization": f"Bearer {session_token}"}
            async with session.post(f"{API_BASE}/auth/logout", headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if "message" in data and "Logged out" in data["message"]:
                        print_test("POST /auth/logout with Bearer", "PASS", "Session cleared successfully")
                        
                        # Verify session is invalidated
                        async with session.get(f"{API_BASE}/auth/me", headers=headers) as verify_resp:
                            if verify_resp.status == 401:
                                print_test("Verify session invalidated after logout", "PASS", "Auth endpoint returns 401")
                            else:
                                print_test("Verify session invalidated after logout", "FAIL", f"Still authenticated after logout")
                    else:
                        print_test("POST /auth/logout with Bearer", "FAIL", f"Unexpected response: {data}")
                else:
                    text = await resp.text()
                    print_test("POST /auth/logout with Bearer", "FAIL", f"Status {resp.status}: {text}")
        except Exception as e:
            print_test("POST /auth/logout with Bearer", "FAIL", str(e))
        
    return True

async def test_protected_endpoints():
    """Test protected endpoints with authentication"""
    print_header("PROTECTED ENDPOINTS AUTHENTICATION TESTS")
    
    # Create a fresh session for protected tests
    user_id, session_token = await create_test_user_session()
    if not session_token:
        print_test("Create session for protected tests", "FAIL", "Could not create test session")
        return
    
    print_test("Create session for protected tests", "PASS", f"User: {user_id}")
    
    async with aiohttp.ClientSession() as session:
        headers = {"Authorization": f"Bearer {session_token}"}
        
        # Test authenticated endpoints that should work
        protected_endpoints = [
            ("/quran/surahs", "Quran surahs list", "GET"),
            ("/cities", "Cities list", "GET"),
            ("/prayer-times/istanbul", "Prayer times for Istanbul", "GET"),
        ]
        
        for endpoint, description, method in protected_endpoints:
            try:
                if method == "GET":
                    async with session.get(f"{API_BASE}{endpoint}", headers=headers) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            print_test(f"{method} {endpoint} with auth", "PASS", f"{description} - {len(data) if isinstance(data, list) else 'OK'}")
                        else:
                            text = await resp.text()
                            print_test(f"{method} {endpoint} with auth", "FAIL", f"Status {resp.status}: {text}")
            except Exception as e:
                print_test(f"{method} {endpoint} with auth", "FAIL", str(e))
        
        # Test AI chat with POST (correct method)
        try:
            ai_payload = {"message": "Merhaba, test mesajı", "session_id": f"test_session_{int(time.time())}"}
            async with session.post(f"{API_BASE}/ai/chat", headers=headers, json=ai_payload) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if "response" in data:
                        print_test("POST /ai/chat with auth", "PASS", f"AI response received: {len(data['response'])} chars")
                    else:
                        print_test("POST /ai/chat with auth", "FAIL", f"Invalid AI response: {data}")
                else:
                    text = await resp.text()
                    print_test("POST /ai/chat with auth", "FAIL", f"Status {resp.status}: {text}")
        except Exception as e:
            print_test("POST /ai/chat with auth", "FAIL", str(e))

async def test_frontend_browser_auth():
    """Test frontend authentication flow using browser automation"""
    print_header("FRONTEND BROWSER AUTHENTICATION TESTS")
    
    # Create test session for browser testing
    user_id, session_token = await create_test_user_session()
    if not session_token:
        print_test("Create browser test session", "FAIL", "Could not create test session")
        return
    
    print_test("Create browser test session", "PASS", f"User: {user_id}")
    
    async with async_playwright() as p:
        try:
            # Launch browser in headless mode
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={'width': 390, 'height': 844},  # iPhone 12 dimensions
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
            )
            page = await context.new_page()
            
            # Test 1: Unauthenticated visit to / → should redirect to /login
            await page.goto(BASE_URL, wait_until="networkidle")
            await asyncio.sleep(2)  # Give time for any redirects
            
            current_url = page.url
            is_login_page = "/login" in current_url or await page.locator('[data-testid="login-page"]').count() > 0
            
            if is_login_page:
                print_test("Unauthenticated redirect to login", "PASS", "Redirects to login page")
                
                # Test 2: Login page should show Google login button
                try:
                    await page.wait_for_selector('[data-testid="google-login-btn"]', timeout=5000)
                    google_btn = page.locator('[data-testid="google-login-btn"]')
                    btn_text = await google_btn.text_content()
                    if "Google ile Giriş Yap" in btn_text:
                        print_test("Google login button present", "PASS", f"Button text: '{btn_text}'")
                    else:
                        print_test("Google login button present", "FAIL", f"Wrong text: '{btn_text}'")
                except Exception as e:
                    print_test("Google login button present", "FAIL", f"Button not found: {e}")
            else:
                print_test("Unauthenticated redirect to login", "FAIL", f"No redirect, URL: {current_url}")
            
            # Test 3: Set session cookie and visit / → should show Dashboard
            print_test("Setting authentication cookie", "INFO", "Injecting session cookie...")
            
            # Clear any existing cookies and set our test cookie
            await context.clear_cookies()
            await context.add_cookies([{
                "name": "session_token",
                "value": session_token,
                "domain": "quranic-login-1.preview.emergentagent.com",
                "path": "/",
                "httpOnly": True,
                "secure": True,
                "sameSite": "None"
            }])
            
            # Navigate to homepage with auth cookie
            await page.goto(BASE_URL, wait_until="networkidle")
            await asyncio.sleep(3)  # Give time for auth check and any redirects
            
            current_url = page.url
            is_authenticated = "/login" not in current_url and await page.locator('[data-testid="login-page"]').count() == 0
            
            if is_authenticated:
                print_test("Authenticated access to homepage", "PASS", "Loads dashboard without redirect")
                
                # Test 4: Check for user content or Islamic app content
                try:
                    await page.wait_for_timeout(2000)  # Wait for content to load
                    page_content = await page.content()
                    
                    # Look for Islamic app indicators
                    islamic_indicators = [
                        "İslami Yaşam Asistanı",
                        "Namaz Vakitleri", 
                        "Kur'an",
                        "Test User Auth"
                    ]
                    
                    found_indicators = [indicator for indicator in islamic_indicators if indicator in page_content]
                    
                    if found_indicators:
                        print_test("Dashboard shows Islamic content", "PASS", f"Found: {', '.join(found_indicators)}")
                    else:
                        print_test("Dashboard shows Islamic content", "FAIL", "No Islamic app content found")
                        
                except Exception as e:
                    print_test("Dashboard content check", "FAIL", f"Error checking content: {e}")
                    
            else:
                print_test("Authenticated access to homepage", "FAIL", f"Still redirected to login: {current_url}")
            
            # Test 5: Test auth-gated pages (only if authenticated)
            if is_authenticated:
                print_test("Testing auth-gated pages", "INFO", "Checking protected routes...")
                
                auth_pages = [
                    ("/quran", "Quran List"),
                    ("/settings", "Settings"),
                    ("/quiz", "Quiz page"),
                    ("/chat", "Chat page")
                ]
                
                for route, name in auth_pages:
                    try:
                        await page.goto(f"{BASE_URL}{route}", wait_until="networkidle")
                        await asyncio.sleep(2)
                        
                        current_url = page.url
                        if "/login" not in current_url:
                            print_test(f"Access {name} ({route})", "PASS", "Page loads without redirect to login")
                        else:
                            print_test(f"Access {name} ({route})", "FAIL", "Redirected to login page")
                            
                    except Exception as e:
                        print_test(f"Access {name} ({route})", "FAIL", f"Error: {e}")
                
                # Test 6: Settings page logout button
                try:
                    await page.goto(f"{BASE_URL}/settings", wait_until="networkidle")
                    await asyncio.sleep(2)
                    
                    logout_btn = page.locator('[data-testid="logout-btn"]')
                    if await logout_btn.count() > 0:
                        btn_text = await logout_btn.text_content()
                        print_test("Settings logout button present", "PASS", f"Button text: '{btn_text}'")
                    else:
                        print_test("Settings logout button present", "FAIL", "Logout button not found")
                        
                except Exception as e:
                    print_test("Settings page access", "FAIL", f"Error accessing settings: {e}")
            
            await browser.close()
            
        except Exception as e:
            print_test("Frontend browser testing", "FAIL", f"Browser automation error: {e}")

async def cleanup_test_data():
    """Clean up test data from database"""
    print_header("CLEANUP: REMOVING TEST DATA")
    
    try:
        cleanup_cmd = '''mongosh --eval "
use('test_database');
var result1 = db.users.deleteMany({email: /test\\.user\\./});
var result2 = db.user_sessions.deleteMany({session_token: /test_session/});
print('Deleted ' + result1.deletedCount + ' test users');
print('Deleted ' + result2.deletedCount + ' test sessions');
"'''
        
        result = subprocess.run(cleanup_cmd, shell=True, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print_test("Clean up test data", "PASS", "Test users and sessions removed")
        else:
            print_test("Clean up test data", "FAIL", result.stderr or result.stdout)
            
    except Exception as e:
        print_test("Clean up test data", "FAIL", str(e))

async def main():
    """Run comprehensive authentication tests"""
    print_header("GOOGLE OAUTH AUTHENTICATION - COMPREHENSIVE TESTING")
    print(f"{Colors.CYAN}Testing Islamic Life Assistant Auth at: {BASE_URL}{Colors.RESET}")
    print(f"{Colors.CYAN}API Base URL: {API_BASE}{Colors.RESET}")
    
    try:
        # Test 1: Backend Authentication APIs  
        backend_success = await test_backend_auth_apis()
        
        if backend_success:
            # Test 2: Protected Endpoints Authentication
            await test_protected_endpoints()
            
            # Test 3: Frontend Browser Authentication Flow
            await test_frontend_browser_auth()
        else:
            print_test("Skipping remaining tests", "WARN", "Backend auth tests failed")
        
        # Cleanup
        await cleanup_test_data()
        
        print_header("AUTHENTICATION TESTING COMPLETE")
        print(f"{Colors.GREEN}✅ Comprehensive authentication testing completed{Colors.RESET}")
        print(f"{Colors.YELLOW}📋 Check individual test results above for pass/fail status{Colors.RESET}")
        
    except Exception as e:
        print_test("Main test execution", "FAIL", str(e))

if __name__ == "__main__":
    asyncio.run(main())
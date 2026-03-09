#!/usr/bin/env python3
"""
Google OAuth Authentication Testing for Islamic Life Assistant
Tests all authentication flows including backend API and browser testing
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
    print(f"{Colors.CYAN}• {name:<45}{status_color}{status:>8}{Colors.RESET}")
    if details:
        print(f"  {Colors.WHITE}{details}{Colors.RESET}")

async def create_test_user_session():
    """Create test user and session in MongoDB"""
    print_header("STEP 1: CREATING TEST USER & SESSION")
    
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
  name: 'Test User',
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
            
            print_test("Create test user", "PASS", f"User ID: {user_id}")
            print_test("Create test session", "PASS", f"Session token: {session_token[:20]}...")
            return user_id, session_token
        else:
            print_test("Create test user & session", "FAIL", result.stderr or result.stdout)
            return None, None
            
    except Exception as e:
        print_test("Create test user & session", "FAIL", str(e))
        return None, None

async def test_auth_api_endpoints(session_token):
    """Test all authentication API endpoints"""
    print_header("STEP 2: BACKEND AUTH API TESTS")
    
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
                    if "user_id" in data and "name" in data and data["name"] == "Test User":
                        print_test("GET /auth/me with Bearer token", "PASS", f"Returns user: {data['name']}")
                    else:
                        print_test("GET /auth/me with Bearer token", "FAIL", f"Invalid user data: {data}")
                else:
                    text = await resp.text()
                    print_test("GET /auth/me with Bearer token", "FAIL", f"Status {resp.status}: {text}")
        except Exception as e:
            print_test("GET /auth/me with Bearer token", "FAIL", str(e))
        
        # Test 3: POST /api/auth/session with invalid session_id → should return 401
        try:
            fake_session_id = "fake_session_12345"
            async with session.post(f"{API_BASE}/auth/session?session_id={fake_session_id}") as resp:
                if resp.status == 401:
                    print_test("POST /auth/session with invalid session_id", "PASS", "Returns 401 Unauthorized")
                else:
                    text = await resp.text()
                    print_test("POST /auth/session with invalid session_id", "FAIL", f"Expected 401, got {resp.status}: {text}")
        except Exception as e:
            print_test("POST /auth/session with invalid session_id", "FAIL", str(e))
        
        # Test 4: POST /api/auth/logout → should clear session
        try:
            headers = {"Authorization": f"Bearer {session_token}"}
            async with session.post(f"{API_BASE}/auth/logout", headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if "message" in data and "Logged out" in data["message"]:
                        print_test("POST /auth/logout", "PASS", "Session cleared successfully")
                        
                        # Verify session is invalidated
                        async with session.get(f"{API_BASE}/auth/me", headers=headers) as verify_resp:
                            if verify_resp.status == 401:
                                print_test("Verify session invalidated after logout", "PASS", "Auth endpoint returns 401")
                            else:
                                print_test("Verify session invalidated after logout", "FAIL", f"Still authenticated after logout")
                    else:
                        print_test("POST /auth/logout", "FAIL", f"Unexpected response: {data}")
                else:
                    text = await resp.text()
                    print_test("POST /auth/logout", "FAIL", f"Status {resp.status}: {text}")
        except Exception as e:
            print_test("POST /auth/logout", "FAIL", str(e))
        
        # Test 5: Guest user creation
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

async def test_protected_endpoints_with_auth(session_token):
    """Test protected endpoints with authentication"""
    print_header("STEP 3: PROTECTED ENDPOINTS TEST")
    
    # First create a new test session since the previous one was logged out
    user_id, new_session_token = await create_test_user_session()
    if not new_session_token:
        print_test("Create new session for protected tests", "FAIL", "Could not create test session")
        return
    
    async with aiohttp.ClientSession() as session:
        headers = {"Authorization": f"Bearer {new_session_token}"}
        
        protected_endpoints = [
            ("/quran/surahs", "Quran surahs list"),
            ("/cities", "Cities list"),
            ("/prayer-times/1", "Prayer times for city"),
            ("/ai/chat", "AI chat endpoint (GET)"),
        ]
        
        for endpoint, description in protected_endpoints:
            try:
                async with session.get(f"{API_BASE}{endpoint}", headers=headers) as resp:
                    if resp.status == 200:
                        print_test(f"GET {endpoint} with auth", "PASS", description)
                    else:
                        text = await resp.text()
                        print_test(f"GET {endpoint} with auth", "FAIL", f"Status {resp.status}: {text}")
            except Exception as e:
                print_test(f"GET {endpoint} with auth", "FAIL", str(e))

async def test_frontend_auth_flow():
    """Test frontend authentication flow using browser automation"""
    print_header("STEP 4: FRONTEND BROWSER TESTS")
    
    # Create test session for browser testing
    user_id, session_token = await create_test_user_session()
    if not session_token:
        print_test("Create browser test session", "FAIL", "Could not create test session")
        return
    
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
            print_test("Loading unauthenticated homepage", "INFO", "Testing redirect to /login")
            await page.goto(BASE_URL)
            await page.wait_for_load_state('networkidle', timeout=10000)
            
            current_url = page.url
            if "/login" in current_url or await page.locator('[data-testid="login-page"]').count() > 0:
                print_test("Unauthenticated redirect to login", "PASS", "Redirects to login page")
                
                # Test 2: Login page should show Google login button
                google_btn = page.locator('[data-testid="google-login-btn"]')
                if await google_btn.count() > 0:
                    btn_text = await google_btn.text_content()
                    if "Google ile Giriş Yap" in btn_text:
                        print_test("Google login button present", "PASS", f"Button text: '{btn_text}'")
                    else:
                        print_test("Google login button present", "FAIL", f"Wrong text: '{btn_text}'")
                else:
                    print_test("Google login button present", "FAIL", "Button not found with data-testid='google-login-btn'")
            else:
                print_test("Unauthenticated redirect to login", "FAIL", f"No redirect, URL: {current_url}")
            
            # Test 3: Set session cookie and visit / → should show Dashboard
            print_test("Setting session cookie", "INFO", "Injecting authentication cookie")
            await context.add_cookies([{
                "name": "session_token",
                "value": session_token,
                "domain": "quranic-login-1.preview.emergentagent.com",
                "path": "/",
                "httpOnly": True,
                "secure": True,
                "sameSite": "None"
            }])
            
            await page.goto(BASE_URL)
            await page.wait_for_load_state('networkidle', timeout=15000)
            
            # Check if we're on dashboard (not login)
            current_url = page.url
            if "/login" not in current_url and await page.locator('[data-testid="login-page"]').count() == 0:
                print_test("Authenticated access to homepage", "PASS", "Loads dashboard without redirect")
                
                # Test 4: Dashboard should show user name
                try:
                    # Look for user info in settings or profile area
                    await page.wait_for_selector('h1, .text-xl, [data-testid="user-info"]', timeout=5000)
                    page_content = await page.content()
                    
                    if "Test User" in page_content:
                        print_test("Dashboard shows user name", "PASS", "Test User name found on page")
                    elif "İslami Yaşam Asistanı" in page_content:
                        print_test("Dashboard shows user name", "PARTIAL", "Dashboard loaded but user name not visible on main page")
                    else:
                        print_test("Dashboard shows user name", "FAIL", "User name not found anywhere")
                except Exception as e:
                    print_test("Dashboard shows user name", "FAIL", f"Error checking user name: {e}")
                    
            else:
                print_test("Authenticated access to homepage", "FAIL", f"Still on login page: {current_url}")
            
            # Test 5: Test auth-gated pages
            print_test("Testing auth-gated pages", "INFO", "Checking protected routes")
            
            auth_pages = [
                ("/", "Dashboard"),
                ("/quran", "Quran List"),
                ("/settings", "Settings"),
                ("/quiz", "Quiz page"),
                ("/chat", "Chat page")
            ]
            
            for route, name in auth_pages:
                try:
                    await page.goto(f"{BASE_URL}{route}")
                    await page.wait_for_load_state('networkidle', timeout=10000)
                    
                    current_url = page.url
                    if "/login" not in current_url:
                        print_test(f"Access {name} ({route})", "PASS", "Page loads without redirect to login")
                    else:
                        print_test(f"Access {name} ({route})", "FAIL", "Redirected to login page")
                        
                except Exception as e:
                    print_test(f"Access {name} ({route})", "FAIL", f"Error: {e}")
            
            # Test 6: Settings page should show logout button
            try:
                await page.goto(f"{BASE_URL}/settings")
                await page.wait_for_load_state('networkidle', timeout=10000)
                
                logout_btn = page.locator('[data-testid="logout-btn"]')
                if await logout_btn.count() > 0:
                    btn_text = await logout_btn.text_content()
                    print_test("Settings logout button present", "PASS", f"Button text: '{btn_text}'")
                    
                    # Test logout functionality (optional)
                    try:
                        await logout_btn.click()
                        await page.wait_for_load_state('networkidle', timeout=10000)
                        
                        current_url = page.url
                        if "/login" in current_url:
                            print_test("Logout functionality", "PASS", "Redirected to login after logout")
                        else:
                            print_test("Logout functionality", "FAIL", f"Not redirected to login: {current_url}")
                    except Exception as e:
                        print_test("Logout functionality", "FAIL", f"Error during logout: {e}")
                        
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
    """Run all authentication tests"""
    print_header("GOOGLE OAUTH AUTHENTICATION TESTING")
    print(f"{Colors.CYAN}Testing Islamic Life Assistant Auth at: {BASE_URL}{Colors.RESET}")
    print(f"{Colors.CYAN}API Base URL: {API_BASE}{Colors.RESET}")
    
    try:
        # Step 1: Create test user and session
        user_id, session_token = await create_test_user_session()
        
        if session_token:
            # Step 2: Test backend auth API endpoints
            await test_auth_api_endpoints(session_token)
            
            # Step 3: Test protected endpoints
            await test_protected_endpoints_with_auth(session_token)
            
            # Step 4: Test frontend authentication flow
            await test_frontend_auth_flow()
        else:
            print_test("Authentication Testing", "FAIL", "Could not create test session - skipping remaining tests")
        
        # Cleanup
        await cleanup_test_data()
        
        print_header("AUTHENTICATION TESTING COMPLETE")
        print(f"{Colors.GREEN}✅ All authentication tests completed{Colors.RESET}")
        print(f"{Colors.YELLOW}📋 Check individual test results above for details{Colors.RESET}")
        
    except Exception as e:
        print_test("Main test execution", "FAIL", str(e))

if __name__ == "__main__":
    asyncio.run(main())
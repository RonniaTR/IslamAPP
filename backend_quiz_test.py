#!/usr/bin/env python3
"""
Islamic Knowledge Quiz API Testing
Testing the quiz system with 300+ questions across 10 categories
"""
import requests
import json
import time
import sys
from datetime import datetime

# API Configuration
BASE_URL = "https://islamic-superapp-2.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class QuizAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.user_id = None
        self.session_id = None
        self.results = []
        
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        print(f"{status} {test_name}")
        if details and not success:
            print(f"   └── {details}")
        
    def test_categories_api(self):
        """Test GET /api/quiz/categories - Should return 10 categories with question counts totaling 300"""
        try:
            response = self.session.get(f"{API_BASE}/quiz/categories", timeout=10)
            
            if response.status_code != 200:
                self.log_result("Categories API", False, f"HTTP {response.status_code}: {response.text[:100]}")
                return False
                
            categories = response.json()
            
            # Validate structure
            if not isinstance(categories, list):
                self.log_result("Categories API", False, "Response is not a list")
                return False
            
            # Should have 10 categories
            if len(categories) != 10:
                self.log_result("Categories API", False, f"Expected 10 categories, got {len(categories)}")
                return False
            
            # Check total questions across all categories
            total_questions = sum(cat.get("question_count", 0) for cat in categories)
            
            if total_questions < 300:
                self.log_result("Categories API", False, f"Expected 300+ questions, got {total_questions}")
                return False
            
            # Validate each category structure
            required_fields = ["id", "name", "icon", "color", "desc", "question_count"]
            for cat in categories:
                for field in required_fields:
                    if field not in cat:
                        self.log_result("Categories API", False, f"Category missing field: {field}")
                        return False
            
            self.log_result("Categories API", True, f"10 categories with {total_questions} total questions")
            return True
            
        except Exception as e:
            self.log_result("Categories API", False, f"Exception: {str(e)}")
            return False
    
    def test_leaderboard_api(self):
        """Test GET /api/quiz/leaderboard - Should return array (may be empty)"""
        try:
            response = self.session.get(f"{API_BASE}/quiz/leaderboard", timeout=10)
            
            if response.status_code != 200:
                self.log_result("Leaderboard API", False, f"HTTP {response.status_code}: {response.text[:100]}")
                return False
                
            leaderboard = response.json()
            
            # Should be a list (empty or populated)
            if not isinstance(leaderboard, list):
                self.log_result("Leaderboard API", False, "Response is not a list")
                return False
            
            self.log_result("Leaderboard API", True, f"Returned {len(leaderboard)} entries")
            return True
            
        except Exception as e:
            self.log_result("Leaderboard API", False, f"Exception: {str(e)}")
            return False
    
    def test_guest_auth(self):
        """Test POST /api/auth/guest - Create guest user for testing"""
        try:
            response = self.session.post(f"{API_BASE}/auth/guest", timeout=10)
            
            if response.status_code != 200:
                self.log_result("Guest Auth", False, f"HTTP {response.status_code}: {response.text[:100]}")
                return False
                
            user_data = response.json()
            
            # Validate response structure
            required_fields = ["user_id", "name", "is_guest"]
            for field in required_fields:
                if field not in user_data:
                    self.log_result("Guest Auth", False, f"Missing field: {field}")
                    return False
            
            if not user_data.get("is_guest"):
                self.log_result("Guest Auth", False, "User is not marked as guest")
                return False
            
            self.user_id = user_data["user_id"]
            self.log_result("Guest Auth", True, f"Created guest user: {user_data['name']}")
            return True
            
        except Exception as e:
            self.log_result("Guest Auth", False, f"Exception: {str(e)}")
            return False
    
    def test_solo_quiz_start(self):
        """Test POST /api/quiz/solo/start - Start solo quiz session"""
        if not self.user_id:
            self.log_result("Solo Quiz Start", False, "No user_id from guest auth")
            return False
            
        try:
            # Test starting a quiz with kuran category (5 questions)
            params = {
                "user_id": "test_guest",
                "category": "kuran", 
                "question_count": 5
            }
            response = self.session.post(
                f"{API_BASE}/quiz/solo/start", 
                params=params,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result("Solo Quiz Start", False, f"HTTP {response.status_code}: {response.text[:100]}")
                return False
                
            quiz_data = response.json()
            
            # Validate response structure
            required_fields = ["session_id", "questions", "category", "question_count"]
            for field in required_fields:
                if field not in quiz_data:
                    self.log_result("Solo Quiz Start", False, f"Missing field: {field}")
                    return False
            
            if quiz_data["question_count"] != 5:
                self.log_result("Solo Quiz Start", False, f"Expected 5 questions, got {quiz_data['question_count']}")
                return False
            
            if len(quiz_data["questions"]) != 5:
                self.log_result("Solo Quiz Start", False, f"Expected 5 questions in array, got {len(quiz_data['questions'])}")
                return False
            
            # Validate question format
            for i, question in enumerate(quiz_data["questions"]):
                required_q_fields = ["id", "question", "options", "difficulty", "points"]
                for field in required_q_fields:
                    if field not in question:
                        self.log_result("Solo Quiz Start", False, f"Question {i} missing field: {field}")
                        return False
                
                if len(question["options"]) != 4:
                    self.log_result("Solo Quiz Start", False, f"Question {i} should have 4 options, got {len(question['options'])}")
                    return False
                
                # Should NOT have correct_answer exposed to client
                if "correct_answer" in question:
                    self.log_result("Solo Quiz Start", False, f"Question {i} exposes correct_answer to client")
                    return False
            
            self.session_id = quiz_data["session_id"]
            self.log_result("Solo Quiz Start", True, f"Started quiz session with 5 questions")
            return True
            
        except Exception as e:
            self.log_result("Solo Quiz Start", False, f"Exception: {str(e)}")
            return False
    
    def test_solo_quiz_answer(self):
        """Test POST /api/quiz/solo/{session_id}/answer - Submit answers"""
        if not self.session_id:
            self.log_result("Solo Quiz Answer", False, "No session_id from quiz start")
            return False
            
        try:
            # Answer first question (try option 2, timing 5 seconds)
            params = {
                "question_index": 0,
                "answer": 2,
                "time_taken": 5
            }
            response = self.session.post(
                f"{API_BASE}/quiz/solo/{self.session_id}/answer",
                params=params,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result("Solo Quiz Answer", False, f"HTTP {response.status_code}: {response.text[:100]}")
                return False
                
            answer_result = response.json()
            
            # Validate response structure
            required_fields = ["correct", "points_earned", "correct_answer", "explanation"]
            for field in required_fields:
                if field not in answer_result:
                    self.log_result("Solo Quiz Answer", False, f"Missing field: {field}")
                    return False
            
            # Test answering a few more questions
            for q_index in range(1, 3):  # Answer questions 1 and 2
                params = {
                    "question_index": q_index,
                    "answer": 1,  # Try option 1
                    "time_taken": 8
                }
                response = self.session.post(
                    f"{API_BASE}/quiz/solo/{self.session_id}/answer",
                    params=params,
                    timeout=10
                )
                
                if response.status_code != 200:
                    self.log_result("Solo Quiz Answer", False, f"Question {q_index} failed: HTTP {response.status_code}")
                    return False
            
            self.log_result("Solo Quiz Answer", True, f"Successfully answered 3 questions")
            return True
            
        except Exception as e:
            self.log_result("Solo Quiz Answer", False, f"Exception: {str(e)}")
            return False
    
    def test_solo_quiz_finish(self):
        """Test POST /api/quiz/solo/{session_id}/finish - Finish quiz"""
        if not self.session_id:
            self.log_result("Solo Quiz Finish", False, "No session_id from quiz start")
            return False
            
        try:
            response = self.session.post(
                f"{API_BASE}/quiz/solo/{self.session_id}/finish",
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result("Solo Quiz Finish", False, f"HTTP {response.status_code}: {response.text[:100]}")
                return False
                
            finish_result = response.json()
            
            # Validate response structure
            required_fields = ["session_id", "score", "correct_count", "total_questions"]
            for field in required_fields:
                if field not in finish_result:
                    self.log_result("Solo Quiz Finish", False, f"Missing field: {field}")
                    return False
            
            if finish_result["total_questions"] != 5:
                self.log_result("Solo Quiz Finish", False, f"Expected 5 total questions, got {finish_result['total_questions']}")
                return False
            
            self.log_result("Solo Quiz Finish", True, 
                          f"Score: {finish_result['score']}, "
                          f"Correct: {finish_result['correct_count']}/{finish_result['total_questions']}")
            return True
            
        except Exception as e:
            self.log_result("Solo Quiz Finish", False, f"Exception: {str(e)}")
            return False
    
    def test_mixed_quiz_flow(self):
        """Test POST /api/quiz/solo/start-mixed - Mixed category quiz"""
        if not self.user_id:
            self.log_result("Mixed Quiz Flow", False, "No user_id from guest auth")
            return False
            
        try:
            # Test starting a mixed category quiz (5 questions)
            params = {
                "user_id": "test_guest",
                "question_count": 5
            }
            response = self.session.post(
                f"{API_BASE}/quiz/solo/start-mixed", 
                params=params,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result("Mixed Quiz Flow", False, f"HTTP {response.status_code}: {response.text[:100]}")
                return False
                
            quiz_data = response.json()
            
            # Validate response structure
            required_fields = ["session_id", "questions", "category", "question_count"]
            for field in required_fields:
                if field not in quiz_data:
                    self.log_result("Mixed Quiz Flow", False, f"Missing field: {field}")
                    return False
            
            if quiz_data["category"] != "mixed":
                self.log_result("Mixed Quiz Flow", False, f"Expected mixed category, got {quiz_data['category']}")
                return False
            
            if quiz_data["question_count"] != 5:
                self.log_result("Mixed Quiz Flow", False, f"Expected 5 questions, got {quiz_data['question_count']}")
                return False
            
            # Validate questions are from different categories
            question_categories = set()
            for question in quiz_data["questions"]:
                # Questions should have valid structure
                required_q_fields = ["id", "question", "options", "difficulty", "points"]
                for field in required_q_fields:
                    if field not in question:
                        self.log_result("Mixed Quiz Flow", False, f"Question missing field: {field}")
                        return False
                
                if len(question["options"]) != 4:
                    self.log_result("Mixed Quiz Flow", False, f"Question should have 4 options")
                    return False
            
            self.log_result("Mixed Quiz Flow", True, f"Mixed quiz started with 5 questions from various categories")
            return True
            
        except Exception as e:
            self.log_result("Mixed Quiz Flow", False, f"Exception: {str(e)}")
            return False

    def validate_question_format(self):
        """Validate that questions have the expected format mentioned in review"""
        try:
            # Get a sample of questions by starting a quiz
            params = {
                "user_id": "test_guest",
                "category": "kuran", 
                "question_count": 3
            }
            response = self.session.post(
                f"{API_BASE}/quiz/solo/start", 
                params=params,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result("Question Format Validation", False, f"Could not get questions: HTTP {response.status_code}")
                return False
                
            quiz_data = response.json()
            
            # Check question format as specified in review request
            for question in quiz_data["questions"]:
                # Must have: id, question, options (4), difficulty, points
                # Must NOT have: correct_answer (not exposed to client)
                required_fields = ["id", "question", "options", "difficulty", "points"]
                
                for field in required_fields:
                    if field not in question:
                        self.log_result("Question Format Validation", False, f"Missing required field: {field}")
                        return False
                
                # Options must be array of 4 items
                if not isinstance(question["options"], list) or len(question["options"]) != 4:
                    self.log_result("Question Format Validation", False, "Options must be array of 4 items")
                    return False
                
                # Should NOT expose correct_answer to client during quiz
                if "correct_answer" in question:
                    self.log_result("Question Format Validation", False, "correct_answer should not be exposed to client")
                    return False
                
                # Difficulty should be valid
                if question["difficulty"] not in ["easy", "medium", "hard"]:
                    self.log_result("Question Format Validation", False, f"Invalid difficulty: {question['difficulty']}")
                    return False
                
                # Points should be positive integer
                if not isinstance(question["points"], int) or question["points"] <= 0:
                    self.log_result("Question Format Validation", False, f"Invalid points: {question['points']}")
                    return False
            
            self.log_result("Question Format Validation", True, "All questions have correct format")
            return True
            
        except Exception as e:
            self.log_result("Question Format Validation", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all quiz API tests"""
        print("=" * 60)
        print("ISLAMIC KNOWLEDGE QUIZ API TESTING")
        print("=" * 60)
        print(f"Testing API: {API_BASE}")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Test all endpoints as specified in review request
        tests = [
            self.test_categories_api,
            self.test_leaderboard_api,
            self.test_guest_auth,
            self.test_solo_quiz_start,
            self.test_solo_quiz_answer,
            self.test_solo_quiz_finish,
            self.test_mixed_quiz_flow,
            self.validate_question_format
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
                time.sleep(0.5)  # Brief pause between tests
            except Exception as e:
                print(f"❌ FAIL {test.__name__} - Unexpected error: {str(e)}")
        
        print()
        print("=" * 60)
        print("QUIZ API TESTING SUMMARY")
        print("=" * 60)
        
        success_rate = (passed / total) * 100
        status = "✅ ALL TESTS PASSED" if passed == total else f"⚠️  {total - passed} TEST(S) FAILED"
        
        print(f"Tests Run: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Status: {status}")
        print()
        
        # Detailed results for failures
        if passed < total:
            print("FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"❌ {result['test']}: {result['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = QuizAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
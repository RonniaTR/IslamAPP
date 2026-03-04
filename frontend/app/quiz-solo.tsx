import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Question {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
  points: number;
  correct_answer?: number;
  explanation?: string;
  source?: string;
}

export default function QuizSoloScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const category = params.category as string;
  const userId = params.userId as string;

  const [gameState, setGameState] = useState<'loading' | 'playing' | 'finished'>('loading');
  const [sessionId, setSessionId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [answers, setAnswers] = useState<any[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startQuiz();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startQuiz = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/quiz/solo/start?user_id=${userId}&category=${category}&question_count=10`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        setQuestions(data.questions);
        setGameState('playing');
        startTimer();
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimeLeft(20);
    startTimeRef.current = Date.now();
    progressAnim.setValue(1);
    
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 20000,
      useNativeDriver: false,
    }).start();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          // Auto submit wrong answer
          if (selectedAnswer === null) {
            submitAnswer(-1);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const submitAnswer = async (answer: number) => {
    if (selectedAnswer !== null) return;
    
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    setSelectedAnswer(answer);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    try {
      const response = await fetch(
        `${API_BASE}/api/quiz/solo/${sessionId}/answer?question_index=${currentIndex}&answer=${answer}&time_taken=${timeTaken}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const result = await response.json();
        setAnswerResult(result);
        
        if (result.correct) {
          setScore(prev => prev + result.points_earned);
          setCorrectCount(prev => prev + 1);
        }
        
        setAnswers(prev => [...prev, {
          question_index: currentIndex,
          answer,
          correct: result.correct,
          points: result.points_earned,
          time_taken: timeTaken
        }]);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const nextQuestion = async () => {
    if (currentIndex + 1 >= questions.length) {
      // Finish quiz
      try {
        await fetch(`${API_BASE}/api/quiz/solo/${sessionId}/finish`, { method: 'POST' });
      } catch (error) {
        console.error('Error finishing quiz:', error);
      }
      setGameState('finished');
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswerResult(null);
      startTimer();
    }
  };

  const getCategoryName = (cat: string): string => {
    const names: { [key: string]: string } = {
      ramazan: 'Ramazan',
      namaz: 'Namaz',
      hadis: 'Hadis',
      tefsir: 'Tefsir',
      fikih: 'Fıkıh',
    };
    return names[cat] || cat;
  };

  const renderPlaying = () => {
    const currentQuestion = questions[currentIndex];
    
    return (
      <ScrollView style={styles.playingContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.categoryName}>{getCategoryName(category)}</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{score}</Text>
            <Text style={styles.scoreLabel}>puan</Text>
          </View>
        </View>
        
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.questionCounter}>
            <Text style={styles.questionCounterText}>
              Soru {currentIndex + 1}/{questions.length}
            </Text>
          </View>
          <View style={styles.timerContainer}>
            <Ionicons name="time" size={16} color={timeLeft <= 5 ? '#ef4444' : '#10b981'} />
            <Text style={[styles.timerText, timeLeft <= 5 && styles.timerTextWarning]}>
              {timeLeft}s
            </Text>
          </View>
        </View>
        
        <Animated.View style={[
          styles.progressBar,
          {
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%']
            }),
            backgroundColor: progressAnim.interpolate({
              inputRange: [0, 0.25, 0.5, 1],
              outputRange: ['#ef4444', '#f59e0b', '#10b981', '#10b981']
            })
          }
        ]} />

        {/* Question */}
        {currentQuestion && (
          <View style={styles.questionContainer}>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>
                {currentQuestion.difficulty === 'easy' ? 'Kolay' : 
                 currentQuestion.difficulty === 'hard' ? 'Zor' : 'Orta'}
                {' • '}{currentQuestion.points} puan
              </Text>
            </View>
            
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => {
                let optionStyle = styles.option;
                let optionTextStyle = styles.optionText;
                
                if (answerResult) {
                  if (index === answerResult.correct_answer) {
                    optionStyle = { ...styles.option, ...styles.correctOption };
                    optionTextStyle = { ...styles.optionText, ...styles.correctOptionText };
                  } else if (index === selectedAnswer && !answerResult.correct) {
                    optionStyle = { ...styles.option, ...styles.wrongOption };
                    optionTextStyle = { ...styles.optionText, ...styles.wrongOptionText };
                  }
                } else if (selectedAnswer === index) {
                  optionStyle = { ...styles.option, ...styles.selectedOption };
                }
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={optionStyle}
                    onPress={() => submitAnswer(index)}
                    disabled={selectedAnswer !== null}
                  >
                    <View style={styles.optionLetter}>
                      <Text style={styles.optionLetterText}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={optionTextStyle}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Answer Result */}
        {answerResult && (
          <View style={[
            styles.resultContainer,
            answerResult.correct ? styles.correctResult : styles.wrongResult
          ]}>
            <View style={styles.resultHeader}>
              <Ionicons 
                name={answerResult.correct ? 'checkmark-circle' : 'close-circle'} 
                size={32} 
                color={answerResult.correct ? '#10b981' : '#ef4444'} 
              />
              <Text style={[
                styles.resultText,
                answerResult.correct ? styles.correctResultText : styles.wrongResultText
              ]}>
                {answerResult.correct ? `Doğru! +${answerResult.points_earned} puan` : 'Yanlış!'}
              </Text>
            </View>
            <Text style={styles.explanationText}>{answerResult.explanation}</Text>
            <Text style={styles.sourceText}>Kaynak: {answerResult.source}</Text>
            
            <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
              <Text style={styles.nextButtonText}>
                {currentIndex + 1 >= questions.length ? 'Sonuçları Gör' : 'Sonraki Soru'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderFinished = () => {
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    
    return (
      <ScrollView style={styles.finishedContainer}>
        <View style={styles.finishedHeader}>
          <Ionicons 
            name={accuracy >= 70 ? 'trophy' : accuracy >= 40 ? 'medal' : 'ribbon'} 
            size={80} 
            color={accuracy >= 70 ? '#fbbf24' : accuracy >= 40 ? '#94a3b8' : '#cd7f32'} 
          />
          <Text style={styles.finishedTitle}>Quiz Tamamlandı!</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>Toplam Puan</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{correctCount}/{questions.length}</Text>
            <Text style={styles.statLabel}>Doğru Cevap</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: accuracy >= 70 ? '#10b981' : accuracy >= 40 ? '#f59e0b' : '#ef4444' }]}>
              %{accuracy}
            </Text>
            <Text style={styles.statLabel}>Başarı Oranı</Text>
          </View>
        </View>

        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>
            {accuracy >= 80 ? 'Mükemmel! 🎉' : 
             accuracy >= 60 ? 'Çok İyi! 👏' : 
             accuracy >= 40 ? 'İyi Çalışma! 💪' : 
             'Daha Fazla Çalış! 📚'}
          </Text>
          <Text style={styles.feedbackText}>
            {accuracy >= 80 ? 'Bu konuda harika bir bilgi birikimine sahipsin!' : 
             accuracy >= 60 ? 'Güzel bir performans! Biraz daha çalışmayla mükemmele ulaşabilirsin.' : 
             accuracy >= 40 ? 'İyi bir başlangıç! Bu konuyu biraz daha gözden geçirmeni öneririm.' : 
             'Bu konuyu daha derinlemesine çalışmak faydalı olabilir.'}
          </Text>
        </View>

        <View style={styles.answersReview}>
          <Text style={styles.answersReviewTitle}>Cevap Özeti</Text>
          {answers.map((ans, index) => (
            <View key={index} style={styles.answerItem}>
              <View style={[styles.answerIcon, ans.correct ? styles.correctAnswerIcon : styles.wrongAnswerIcon]}>
                <Ionicons 
                  name={ans.correct ? 'checkmark' : 'close'} 
                  size={16} 
                  color="#fff" 
                />
              </View>
              <Text style={styles.answerLabel}>Soru {index + 1}</Text>
              <Text style={[styles.answerPoints, ans.correct && styles.correctAnswerPoints]}>
                +{ans.points}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setGameState('loading');
              setCurrentIndex(0);
              setScore(0);
              setCorrectCount(0);
              setAnswers([]);
              setSelectedAnswer(null);
              setAnswerResult(null);
              startQuiz();
            }}
          >
            <Ionicons name="refresh" size={20} color="#10b981" />
            <Text style={styles.retryButtonText}>Tekrar Oyna</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.exitButton}
            onPress={() => router.back()}
          >
            <Text style={styles.exitButtonText}>Lobiye Dön</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  if (gameState === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Sorular hazırlanıyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {gameState === 'playing' && renderPlaying()}
      {gameState === 'finished' && renderFinished()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 16,
  },
  
  // Playing
  playingContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  categoryName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: '700',
  },
  scoreLabel: {
    color: '#64748b',
    fontSize: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionCounter: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  questionCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  timerText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '700',
  },
  timerTextWarning: {
    color: '#ef4444',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  questionContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  difficultyText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
  },
  selectedOption: {
    borderColor: '#10b981',
    backgroundColor: '#10b98120',
  },
  correctOption: {
    borderColor: '#10b981',
    backgroundColor: '#10b98130',
  },
  wrongOption: {
    borderColor: '#ef4444',
    backgroundColor: '#ef444430',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    color: '#fff',
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  correctOptionText: {
    color: '#10b981',
    fontWeight: '600',
  },
  wrongOptionText: {
    color: '#ef4444',
  },
  resultContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  correctResult: {
    borderLeftColor: '#10b981',
  },
  wrongResult: {
    borderLeftColor: '#ef4444',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '700',
  },
  correctResultText: {
    color: '#10b981',
  },
  wrongResultText: {
    color: '#ef4444',
  },
  explanationText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  sourceText: {
    color: '#64748b',
    fontSize: 12,
    fontStyle: 'italic',
  },
  nextButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Finished
  finishedContainer: {
    flex: 1,
    padding: 20,
  },
  finishedHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  finishedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  statsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  feedbackCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  feedbackTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  feedbackText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  answersReview: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  answersReviewTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  answerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  correctAnswerIcon: {
    backgroundColor: '#10b981',
  },
  wrongAnswerIcon: {
    backgroundColor: '#ef4444',
  },
  answerLabel: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 14,
  },
  answerPoints: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  correctAnswerPoints: {
    color: '#10b981',
  },
  actionButtons: {
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '700',
  },
  exitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

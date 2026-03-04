import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const WS_BASE = API_BASE.replace('https://', 'wss://').replace('http://', 'ws://');

interface Player {
  user_id: string;
  username: string;
  score: number;
  correct_count: number;
}

interface Question {
  index: number;
  question: string;
  options: string[];
  difficulty: string;
  points: number;
}

export default function QuizGameScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const isHost = params.isHost === 'true';
  const userId = params.userId as string;
  const username = params.username as string;

  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timePerQuestion = useRef(20);
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchRoomData();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const fetchRoomData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/quiz/rooms/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setRoom(data);
        setPlayers(data.players || []);
        setTotalQuestions(data.question_count || 10);
        timePerQuestion.current = data.time_per_question || 20;
        setTimeLeft(timePerQuestion.current);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching room:', error);
      Alert.alert('Hata', 'Oda bilgileri alınamadı');
    }
  };

  const connectWebSocket = () => {
    const wsUrl = `${WS_BASE}/api/quiz/ws/${roomId}/${userId}`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };
  };

  const handleWebSocketMessage = useCallback((data: any) => {
    console.log('WS Message:', data.type);
    
    switch (data.type) {
      case 'player_joined':
      case 'player_left':
      case 'player_disconnected':
        setPlayers(data.players || []);
        break;
      
      case 'game_started':
        setGameState('playing');
        setQuestionIndex(data.current_question);
        setTotalQuestions(data.total_questions);
        setCurrentQuestion(data.question);
        timePerQuestion.current = data.time_per_question || 20;
        startTimer();
        break;
      
      case 'answer_result':
        setAnswerResult(data);
        break;
      
      case 'scores_updated':
        setPlayers(data.players || []);
        break;
      
      case 'next_question':
        setSelectedAnswer(null);
        setAnswerResult(null);
        setQuestionIndex(data.current_question);
        setCurrentQuestion(data.question);
        startTimer();
        break;
      
      case 'game_finished':
        setGameState('finished');
        setPlayers(data.players || []);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        break;
    }
  }, []);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimeLeft(timePerQuestion.current);
    progressAnim.setValue(1);
    
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: timePerQuestion.current * 1000,
      useNativeDriver: false,
    }).start();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          // Auto submit if no answer selected
          if (selectedAnswer === null) {
            submitAnswer(-1);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_game' }));
    }
  };

  const submitAnswer = (answer: number) => {
    if (selectedAnswer !== null) return;
    
    const timeTaken = timePerQuestion.current - timeLeft;
    setSelectedAnswer(answer);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'submit_answer',
        question_index: questionIndex,
        answer: answer,
        time_taken: timeTaken
      }));
    }
  };

  const nextQuestion = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'next_question' }));
    }
  };

  const leaveRoom = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room' }));
    }
    router.back();
  };

  const renderWaiting = () => (
    <View style={styles.waitingContainer}>
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{room?.name}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {room?.category?.charAt(0).toUpperCase() + room?.category?.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.waitingTitle}>Oyuncular Bekleniyor...</Text>
      
      <View style={styles.playersList}>
        {players.map((player, index) => (
          <View key={player.user_id} style={styles.playerItem}>
            <View style={styles.playerAvatar}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
            <Text style={styles.playerName}>{player.username}</Text>
            {room?.host_id === player.user_id && (
              <View style={styles.hostBadge}>
                <Text style={styles.hostBadgeText}>Host</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <Text style={styles.playerCountText}>
        {players.length}/{room?.max_players || 4} oyuncu
      </Text>

      {isHost ? (
        <TouchableOpacity 
          style={[
            styles.startButton,
            players.length < 1 && styles.startButtonDisabled
          ]}
          onPress={startGame}
          disabled={players.length < 1}
        >
          <Ionicons name="play" size={24} color="#fff" />
          <Text style={styles.startButtonText}>Oyunu Başlat</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.waitingMessage}>
          <ActivityIndicator size="small" color="#10b981" />
          <Text style={styles.waitingMessageText}>Host oyunu başlatacak...</Text>
        </View>
      )}

      <TouchableOpacity style={styles.leaveButton} onPress={leaveRoom}>
        <Text style={styles.leaveButtonText}>Odadan Ayrıl</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlaying = () => (
    <View style={styles.playingContainer}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.questionCounter}>
          <Text style={styles.questionCounterText}>
            Soru {questionIndex + 1}/{totalQuestions}
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
          
          {isHost && (
            <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
              <Text style={styles.nextButtonText}>
                {questionIndex + 1 >= totalQuestions ? 'Sonuçlar' : 'Sonraki Soru'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Scoreboard */}
      <View style={styles.miniScoreboard}>
        {players.sort((a, b) => b.score - a.score).slice(0, 4).map((player, index) => (
          <View 
            key={player.user_id} 
            style={[
              styles.miniScoreItem,
              player.user_id === userId && styles.currentUserScore
            ]}
          >
            <Text style={styles.miniScoreRank}>{index + 1}</Text>
            <Text style={styles.miniScoreName} numberOfLines={1}>
              {player.username.substring(0, 8)}
            </Text>
            <Text style={styles.miniScorePoints}>{player.score}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderFinished = () => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const myRank = sortedPlayers.findIndex(p => p.user_id === userId) + 1;
    const myScore = players.find(p => p.user_id === userId);

    return (
      <View style={styles.finishedContainer}>
        <View style={styles.trophyContainer}>
          <Ionicons name="trophy" size={80} color="#fbbf24" />
        </View>
        
        <Text style={styles.finishedTitle}>Oyun Bitti!</Text>
        
        <View style={styles.winnerCard}>
          <Text style={styles.winnerLabel}>Kazanan</Text>
          <Text style={styles.winnerName}>{winner?.username}</Text>
          <Text style={styles.winnerScore}>{winner?.score} puan</Text>
        </View>

        <View style={styles.myResultCard}>
          <Text style={styles.myResultLabel}>Senin Sonucun</Text>
          <Text style={styles.myResultRank}>{myRank}. Sıra</Text>
          <Text style={styles.myResultScore}>{myScore?.score || 0} puan</Text>
          <Text style={styles.myResultCorrect}>
            {myScore?.correct_count || 0}/{totalQuestions} doğru
          </Text>
        </View>

        <View style={styles.finalScoreboard}>
          <Text style={styles.scoreboardTitle}>Sıralama</Text>
          {sortedPlayers.map((player, index) => (
            <View 
              key={player.user_id}
              style={[
                styles.finalScoreItem,
                player.user_id === userId && styles.currentUserFinalScore
              ]}
            >
              <View style={styles.finalScoreRank}>
                {index < 3 ? (
                  <Ionicons 
                    name="trophy" 
                    size={20} 
                    color={index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : '#cd7f32'} 
                  />
                ) : (
                  <Text style={styles.finalScoreRankText}>{index + 1}</Text>
                )}
              </View>
              <Text style={styles.finalScoreName}>{player.username}</Text>
              <Text style={styles.finalScoreCorrect}>
                {player.correct_count}/{totalQuestions}
              </Text>
              <Text style={styles.finalScorePoints}>{player.score}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.exitButton} onPress={() => router.back()}>
          <Text style={styles.exitButtonText}>Lobiye Dön</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {gameState === 'waiting' && renderWaiting()}
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
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  
  // Waiting State
  waitingContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  roomInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  roomName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#fff',
    fontWeight: '600',
  },
  waitingTitle: {
    fontSize: 18,
    color: '#94a3b8',
    marginBottom: 24,
  },
  playersList: {
    width: '100%',
    marginBottom: 16,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  hostBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hostBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  playerCountText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  waitingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  waitingMessageText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  leaveButton: {
    padding: 12,
  },
  leaveButtonText: {
    color: '#ef4444',
    fontSize: 14,
  },
  
  // Playing State
  playingContainer: {
    flex: 1,
    padding: 16,
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
  miniScoreboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
  },
  miniScoreItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  currentUserScore: {
    backgroundColor: '#10b98120',
  },
  miniScoreRank: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
  },
  miniScoreName: {
    color: '#94a3b8',
    fontSize: 11,
  },
  miniScorePoints: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Finished State
  finishedContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  trophyContainer: {
    marginBottom: 16,
  },
  finishedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  winnerCard: {
    backgroundColor: '#fbbf2420',
    borderWidth: 2,
    borderColor: '#fbbf24',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  winnerLabel: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '600',
  },
  winnerName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 4,
  },
  winnerScore: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: '600',
  },
  myResultCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  myResultLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  myResultRank: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  myResultScore: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: '700',
  },
  myResultCorrect: {
    color: '#94a3b8',
    fontSize: 14,
  },
  finalScoreboard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  scoreboardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  finalScoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  currentUserFinalScore: {
    backgroundColor: '#10b98120',
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  finalScoreRank: {
    width: 32,
    alignItems: 'center',
  },
  finalScoreRankText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '700',
  },
  finalScoreName: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  finalScoreCorrect: {
    color: '#64748b',
    fontSize: 12,
    marginRight: 16,
  },
  finalScorePoints: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'right',
  },
  exitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Home, Book, MessageSquare, Settings, User } from 'lucide-react-native';

// Screen Imports (We will create these next)
import DashboardScreen from '../screens/DashboardScreen';
import QuranListScreen from '../screens/QuranListScreen';
import SurahDetailScreen from '../screens/SurahDetailScreen';
import HadithScreen from '../screens/HadithScreen';
import ChatScreen from '../screens/ChatScreen';
import LoginScreen from '../screens/LoginScreen';
import QuizScreen from '../screens/QuizScreen';
import ScholarsScreen from '../screens/ScholarsScreen';
import RamadanScreen from '../screens/RamadanScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0A1F14', borderTopColor: '#D4AF37' },
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#FFFFFF80',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Quran" 
        component={QuranListScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Book color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Hadith" 
        component={HadithScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Book color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ user, onLogin }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#0A1F14' } }}>
        {!user ? (
          <Stack.Screen name="Login">
            {props => <LoginScreen {...props} onLogin={onLogin} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="SurahDetail" component={SurahDetailScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="Scholars" component={ScholarsScreen} />
            <Stack.Screen name="Ramadan" component={RamadanScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

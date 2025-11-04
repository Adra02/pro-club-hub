import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import LoadingScreen from '../screens/LoadingScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/main/HomeScreen';
import TeamsScreen from '../screens/main/TeamsScreen';
import FavoritesScreen from '../screens/main/FavoritesScreen';
import RequestsScreen from '../screens/main/RequestsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import PlayerDetailScreen from '../screens/main/PlayerDetailScreen';
import TeamDetailScreen from '../screens/main/TeamDetailScreen';
import CreateTeamScreen from '../screens/main/CreateTeamScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import AdminPanelScreen from '../screens/admin/AdminPanelScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { unreadCount } = useNotification();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Teams') {
            iconName = focused ? 'shield' : 'shield-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Requests') {
            iconName = focused ? 'mail' : 'mail-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#0a0f1e',
          borderTopColor: '#334155',
        },
        headerStyle: {
          backgroundColor: '#0a0f1e',
        },
        headerTintColor: '#f1f5f9',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Giocatori' }} />
      <Tab.Screen name="Teams" component={TeamsScreen} options={{ title: 'Squadre' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Preferiti' }} />
      <Tab.Screen name="Requests" component={RequestsScreen} options={{ title: 'Richieste' }} />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ 
          title: 'Notifiche',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }} 
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profilo' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading, token } = useContext(AuthContext);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0a0f1e',
        },
        headerTintColor: '#f1f5f9',
        headerTitleStyle: {
          fontWeight: '600',
        },
        cardStyle: {
          backgroundColor: '#0a0f1e',
        },
      }}
    >
      {!user ? (
        <>
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : (
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabs} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="PlayerDetail" 
            component={PlayerDetailScreen}
            options={{ title: 'Dettaglio Giocatore' }}
          />
          <Stack.Screen 
            name="TeamDetail" 
            component={TeamDetailScreen}
            options={{ title: 'Dettaglio Squadra' }}
          />
          <Stack.Screen 
            name="CreateTeam" 
            component={CreateTeamScreen}
            options={{ title: 'Crea Squadra' }}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfileScreen}
            options={{ title: 'Modifica Profilo' }}
          />
          {user.isAdmin && (
            <Stack.Screen 
              name="AdminPanel" 
              component={AdminPanelScreen}
              options={{ title: 'Admin Panel' }}
            />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}
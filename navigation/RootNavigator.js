import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

import FotosScreen from '../screens/FotosScreen';
import AuthScreen from '../screens/Auth/AuthScreen';
import ReglamentoScreen from '../screens/ReglamentoScreen';
import MiGaleria from '../screens/MiGaleria';
import GestionUsuarios from '../screens/GestionUsuarios';
import GestionFotos from '../screens/GestionFotos';
import Perfil from '../screens/Perfil';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            switch (route.name) {
              case 'Fotos':
                iconName = focused ? 'images' : 'images-outline';
                break;
              case 'Bases':
                iconName = focused ? 'book' : 'book-outline';
                break;
              case 'Entrar / Registrar':
                iconName = focused ? 'log-in' : 'log-in-outline';
                break;
              case 'Perfil':
                iconName = focused ? 'person' : 'person-outline';
                break;
              case 'MiGalería':
                iconName = focused ? 'albums' : 'albums-outline';
                break;
              case 'Gestión Usuarios':
                iconName = focused ? 'people' : 'people-outline';
                break;
              case 'Gestión Fotos':
                iconName = focused ? 'camera' : 'camera-outline';
                break;
              default:
                iconName = 'help-circle-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e5e7eb',
            paddingBottom: 6,
            height: 64,
            paddingTop: 2,
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '500',
          },
        })}
      >
        <Tab.Screen name="Fotos" component={FotosScreen} />
        <Tab.Screen name="Bases" component={ReglamentoScreen} />

        {user ? (
          <>
            <Tab.Screen name="Perfil" component={Perfil} />
            {user.rol === 'participante' && user.status === 'active' && (
              <Tab.Screen name="MiGalería" component={MiGaleria} />
            )}
            {user.rol === 'admin' && (
              <Tab.Screen name="Gestión Usuarios" component={GestionUsuarios} />
            )}
            {user.rol === 'admin' && (
              <Tab.Screen name="Gestión Fotos" component={GestionFotos} />
            )}
          </>
        ) : (
          <Tab.Screen name="Entrar / Registrar" component={AuthScreen} />
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

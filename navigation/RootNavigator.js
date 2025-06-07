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
  // Obtiene el usuario actual y el estado de carga desde el contexto de autenticación
  const { user, loading } = useAuth();

  // Mientras se carga la información de autenticación, mostramos un spinner centrado
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
          headerShown: false, // Oculta la cabecera estándar para cada pantalla
          tabBarIcon: ({ focused, color, size }) => {
            // Selecciona el icono de Ionicons según el nombre de la ruta y si está activo o no
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
          tabBarActiveTintColor: '#2563eb',    // Color del texto e icono cuando la pestaña está activa
          tabBarInactiveTintColor: '#94a3b8',  // Color del texto e icono cuando la pestaña está inactiva
          tabBarStyle: {
            backgroundColor: '#ffffff',        // Color de fondo de la barra de pestañas
            borderTopColor: '#e5e7eb',         // Color del borde superior de la barra
            paddingBottom: 6,                  // Espaciado inferior para iconos y texto
            height: 64,                        // Altura total de la barra de pestañas
            paddingTop: 2,                     // Espaciado superior mínimamente necesario
          },
          tabBarLabelStyle: {
            fontSize: 13,     // Tamaño de la letra para la etiqueta de cada pestaña
            fontWeight: '500',// Grosor de la fuente para una mejor visibilidad
          },
        })}
      >
        {/* Pantalla pública que muestra todas las fotos */}
        <Tab.Screen name="Fotos" component={FotosScreen} />

        {/* Pantalla pública con las bases y reglamentos */}
        <Tab.Screen name="Bases" component={ReglamentoScreen} />

        {user ? (
          // Si existe un usuario autenticado, mostramos las pantallas privadas según su rol y estado
          <>
            {/* Pantalla de perfil accesible para todos los usuarios autenticados */}
            <Tab.Screen name="Perfil" component={Perfil} />

            {/* Si el usuario es participante y está activo, mostramos su galería */}
            {user.rol === 'participante' && user.status === 'active' && (
              <Tab.Screen name="MiGalería" component={MiGaleria} />
            )}

            {/* Si el usuario es administrador, mostramos la gestión de usuarios */}
            {user.rol === 'admin' && (
              <Tab.Screen name="Gestión Usuarios" component={GestionUsuarios} />
            )}

            {/* Si el usuario es administrador, mostramos la gestión de fotos */}
            {user.rol === 'admin' && (
              <Tab.Screen name="Gestión Fotos" component={GestionFotos} />
            )}
          </>
        ) : (
          // Si no hay usuario autenticado, mostramos la pantalla de login/registro
          <Tab.Screen name="Entrar / Registrar" component={AuthScreen} />
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
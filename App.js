import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthContext'; // Opcional, pero recomendado para manejar autenticación global

export default function App() {
  return (
    <AuthProvider> {/* Si usas Context API para autenticación */}
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
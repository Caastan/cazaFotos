import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import RootNavigator from './navigation/RootNavigator';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_300Light, Poppins_100Thin } from '@expo-google-fonts/poppins';
import { AuthProvider } from './contexts/AuthContext';
import { theme } from './lib/theme';

export default function App() {
    const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_300Light,
    Poppins_100Thin,
  });

  if (!fontsLoaded) return null;

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator/>
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}
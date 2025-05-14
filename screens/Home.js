// En /screens/Home/HomeScreen.js
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rally Fotográfico 2025</Text>
      
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate('Register')}
      >
        <Text>Registrarse</Text>
      </Button>

      <Button
        mode="outlined"
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text>Iniciar Sesión</Text>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    marginVertical: 10,
    padding: 8,
  },
});
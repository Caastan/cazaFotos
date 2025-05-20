// /screens/Home.js
import React, { useContext } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);   // <── sabemos si hay sesión

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>📸</Text>
      <Text style={styles.title}>Rally Fotográfico 2025</Text>
      <Text style={styles.subtitle}>Explora, dispara, comparte.</Text>

      {/* SI NO está logueado muestro los botones */}
      {!user && (
        <>
          <Button
            mode="contained"
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            Iniciar Sesión
          </Button>

          <Button
            mode="outlined"
            style={styles.button}
            onPress={() => navigation.navigate('Register')}
          >
            Registrarse
          </Button>
        </>
      )}

      {/* SI está logueado, enseño un saludo */}
      {user && (
        <Text style={styles.welcome}>¡Bienvenido, {user.nombre}!</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,                      // ← garantiza ocupar todo el alto
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  logo:     { fontSize: 64, marginBottom: 20 },
  title:    { fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#777', marginBottom: 30 },
  button:   { width: '80%', marginVertical: 6, paddingVertical: 4 },
  welcome:  { marginTop: 20, fontSize: 18, color: '#555' },
});
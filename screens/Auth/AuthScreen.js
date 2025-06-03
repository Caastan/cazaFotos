// screens/Auth/AuthScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function AuthScreen() {
  const { register, signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rol, setRol] = useState('general'); // 'general' o 'participante'
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setRol('general');
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await register({ email, password, displayName, rolElegido: rol });
      setIsLogin(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn({ email, password });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</Text>
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Contraseña"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {!isLogin && (
        <>
          <TextInput
            placeholder="Confirmar Contraseña"
            style={styles.input}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TextInput
            placeholder="Nombre para mostrar"
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <View style={styles.rolContainer}>
            <TouchableOpacity
              style={[
                styles.rolButton,
                rol === 'general' ? styles.rolButtonSelected : null,
              ]}
              onPress={() => setRol('general')}
            >
              <Text>General</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rolButton,
                rol === 'participante' ? styles.rolButtonSelected : null,
              ]}
              onPress={() => setRol('participante')}
            >
              <Text>Participante</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={isLogin ? handleLogin : handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isLogin ? 'Entrar' : 'Registrarme'}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={toggleMode} style={styles.toggleContainer}>
        <Text style={styles.toggleText}>
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  rolContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  rolButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 6,
  },
  rolButtonSelected: {
    backgroundColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#007aff',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  toggleContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleText: {
    color: '#007aff',
  },
});

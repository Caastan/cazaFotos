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
  const [rol, setRol] = useState('general');
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
        placeholderTextColor="#999"
      />
      <TextInput
        placeholder="Contraseña"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#999"
      />
      {!isLogin && (
        <>
          <TextInput
            placeholder="Confirmar Contraseña"
            style={styles.input}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholderTextColor="#999"
          />
          <TextInput
            placeholder="Nombre para mostrar"
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholderTextColor="#999"
          />
          <View style={styles.rolContainer}>
            <TouchableOpacity
              style={[
                styles.rolButton,
                rol === 'general' ? styles.rolButtonSelected : null,
              ]}
              onPress={() => setRol('general')}
            >
              <Text style={styles.rolText}>General</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rolButton,
                rol === 'participante' ? styles.rolButtonSelected : null,
              ]}
              onPress={() => setRol('participante')}
            >
              <Text style={styles.rolText}>Participante</Text>
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
    padding: 28,
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    color: '#111',
  },
  rolContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  rolButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f1f5f9',
  },
  rolButtonSelected: {
    backgroundColor: '#2563eb20',
    borderColor: '#2563eb',
  },
  rolText: {
    color: '#1f2937',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    marginTop: 28,
    alignItems: 'center',
  },
  toggleText: {
    color: '#2563eb',
    fontSize: 14,
  },
});

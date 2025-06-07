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
import { Formik } from 'formik';
import * as Yup from 'yup';

export default function AuthScreen() {
  // Obtiene las funciones de registro e inicio de sesión desde el contexto de autenticación
  const { register, signIn } = useAuth();
  // Estado que determina si estamos en modo "login" o "registro"
  const [isLogin, setIsLogin] = useState(true);
  // Estados para los campos de texto del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  // Estado para el rol seleccionado; por defecto es "general"
  const [rol, setRol] = useState('general');
  // Estado para mostrar un spinner mientras se procesa la petición
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Esquema de validación para Formik y Yup
  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Email inválido')
      .required('Campo requerido'),
    password: Yup.string()
      .min(8, 'Mínimo 8 caracteres')
      .max(16, 'Máximo 16 caracteres')
      .matches(/[a-z]/, 'Debe contener al menos una minúscula')
      .matches(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .matches(/[\d\W]/, 'Debe contener un número o símbolo')
      .required('Campo requerido'),
  });

  // Alterna entre el formulario de "login" y el de "registro" y resetea los campos
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setRol('general');
  };

  // Maneja el registro de un usuario nuevo
  const handleRegister = async () => {
     // Validación con Yup antes de enviar los datos
    try {
      await validationSchema.validate({ email, password });
    } catch (validationError) {
      Alert.alert('Error de validación', validationError.message);
      return;
    }
    // Verifica que las contraseñas coincidan antes de llamar al servicio
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      // Llama a la función de registro del contexto, pasándole los datos necesarios
      await register({ email, password, displayName, rolElegido: rol });
      // Si el registro fue exitoso, cambiamos al modo "login" para que el usuario inicie sesión
      setIsLogin(true);
    } catch (error) {
      console.log('Error en registro:', error);
      const msg = error?.message || String(error);
      Alert.alert('Error de registro', msg);
    } finally {
      // Desactiva el spinner independientemente de si hubo error o no
      setLoading(false);
    }
  };

  // Maneja el inicio de sesión de un usuario existente
  const handleLogin = async () => {
    setLoading(true);
    try {
      // Llama a la función de login del contexto, pasándole email y contraseña
      await signIn({ email, password });
      // Si el inicio de sesión fue exitoso, es posible navegar a la pantalla principal automáticamente
      // (Dependiendo de la lógica de navegación global, aquí no se hace nada más)
    } catch (error) {
       console.log('Error en login:', error);
        const msg = error?.message || String(error);
    } finally {
      // Desactiva el spinner independientemente del resultado
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Título dinámico según si estamos en modo login o registro */}
      <Text style={styles.title}>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</Text>

      {/* Campo de email */}
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#999"
      />

      {/* Campo de contraseña */}
      <TextInput
        placeholder="Contraseña"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#999"
      />

      {/* Si estamos en modo "registro", mostramos campos adicionales */}
      {!isLogin && (
        <>
          {/* Campo para confirmar contraseña */}
          <TextInput
            placeholder="Confirmar Contraseña"
            style={styles.input}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholderTextColor="#999"
          />

          {/* Campo para el nombre que mostrará el usuario */}
          <TextInput
            placeholder="Nombre para mostrar"
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholderTextColor="#999"
          />

          {/* Selector de rol: General o Participante */}
          <View style={styles.rolContainer}>
            <TouchableOpacity
              // Aplica estilo especial si el rol "general" está seleccionado
              style={[
                styles.rolButton,
                rol === 'general' ? styles.rolButtonSelected : null,
              ]}
              onPress={() => setRol('general')}
            >
              <Text style={styles.rolText}>General</Text>
            </TouchableOpacity>
            <TouchableOpacity
              // Aplica estilo especial si el rol "participante" está seleccionado
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

      {/* Botón principal: muestra spinner si loading=true, texto según modo */}
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

      {/* Enlace para cambiar entre modo login y registro */}
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
    backgroundColor: '#f8fafc', // Fondo claro para toda la pantalla
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
    color: '#1f2937', // Título oscuro para contraste
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db', // Borde gris claro
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#fff', // Fondo blanco para inputs
    color: '#111',          // Texto oscuro
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
    backgroundColor: '#f1f5f9', // Fondo ligeramente gris
  },
  rolButtonSelected: {
    backgroundColor: '#2563eb20', // Azul claro semitransparente cuando está seleccionado
    borderColor: '#2563eb',       // Borde azul más fuerte para énfasis
  },
  rolText: {
    color: '#1f2937',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2563eb', // Botón azul primario
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,               // Sombra en Android
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
    color: '#2563eb', // Texto azul para enlace de cambio de modo
    fontSize: 14,
  },
});
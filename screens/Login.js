import { View, StyleSheet, Text } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { db } from '../services/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

// Esquema de validación
const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Email inválido').required('Email obligatorio'),
  contrasena: Yup.string().required('Contraseña obligatoria'),
});

export default function LoginScreen() {
  const navigation = useNavigation();

  const handleLogin = async (values) => {
    try {
      // Consultar usuarios en Firestore
      const q = query(
        collection(db, 'usuarios'),
        where('email', '==', values.email),
        where('contrasena', '==', values.contrasena)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert('Usuario o contraseña incorrectos');
      } else {
        const userData = querySnapshot.docs[0].data();
        alert(`¡Bienvenido, ${userData.nombre}!`);
        navigation.navigate('Home'); // Redirige a la pantalla principal
      }
    } catch (error) {
      alert('Error al iniciar sesión: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Formik
        initialValues={{ email: '', contrasena: '' }}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View>
            <TextInput
              label="Email"
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              value={values.email}
              keyboardType="email-address"
              style={styles.input}
            />
            {touched.email && errors.email && (
              <Text style={styles.error}>{errors.email}</Text>
            )}

            <TextInput
              label="Contraseña"
              onChangeText={handleChange('contrasena')}
              onBlur={handleBlur('contrasena')}
              value={values.contrasena}
              secureTextEntry
              style={styles.input}
            />
            {touched.contrasena && errors.contrasena && (
              <Text style={styles.error}>{errors.contrasena}</Text>
            )}

            <Button mode="contained" onPress={handleSubmit} style={styles.button}>
              <Text>Iniciar Sesión</Text>
            </Button>

            <Button 
              style={styles.link} 
              onPress={() => navigation.navigate('Register')}
            >
              ¿No tienes cuenta? Regístrate
            </Button>
          </View>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
  },
  link: {
    marginTop: 15,
  },
});
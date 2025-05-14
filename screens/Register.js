import { View, StyleSheet, Text } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { db } from '../services/firebaseConfig';
import { collection, addDoc } from "firebase/firestore";

// Esquema de validación
const RegisterSchema = Yup.object().shape({
  nombre: Yup.string().required('Nombre obligatorio'),
  email: Yup.string().email('Email inválido').required('Email obligatorio'),
  contrasena: Yup.string()
    .min(6, 'Mínimo 6 caracteres')
    .required('Contraseña obligatoria'),
  rol: Yup.string().required('Rol obligatorio'),
});

export default function RegisterScreen() {
  const handleRegister = async (values) => {
    try {
      // Guardar en Firestore
      await addDoc(collection(db, "usuarios"), {
        nombre: values.nombre,
        email: values.email,
        contrasena: values.contrasena, // ⚠️ En la práctica NUNCA guardes contraseñas en Firestore
        rol: values.rol,
      });
      alert("¡Registro exitoso!");
    } catch (error) {
      alert("Error al registrar: " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Formik
        initialValues={{ nombre: '', email: '', contrasena: '', rol: 'participante' }}
        validationSchema={RegisterSchema}
        onSubmit={handleRegister}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View>
            <TextInput
              label="Nombre"
              onChangeText={handleChange('nombre')}
              onBlur={handleBlur('nombre')}
              value={values.nombre}
              error={touched.nombre && !!errors.nombre}
              style={styles.input}
            />
            {touched.nombre && errors.nombre && (
              <Text style={styles.error}>{errors.nombre}</Text>
            )}

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
              label="Contrasena"
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
              <Text>Registrarse</Text>
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
});
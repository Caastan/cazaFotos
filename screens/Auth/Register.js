// src/screens/Auth/Register.js
import React, { useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../../contexts/AuthContext';

const RegisterSchema = Yup.object().shape({
  nombre:     Yup.string().required('Nombre obligatorio'),
  email:      Yup.string().email('Email inválido').required('Email obligatorio'),
  password:   Yup.string().min(6,'Mínimo 6 caracteres').required('Contraseña obligatoria'),
  rol:        Yup.string().required('Rol obligatorio'),
});

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register } = useContext(AuthContext);

  const handleRegister = async (values) => {
    try {
      await register(values);
+     // Al inscribirnos, volvemos a la pantalla de Login
+     navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Formik
        initialValues={{ nombre:'', email:'', password:'', rol:'participante' }}
        validationSchema={RegisterSchema}
        onSubmit={handleRegister}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <>
            <TextInput
              label="Nombre"
              value={values.nombre}
              onChangeText={handleChange('nombre')}
              onBlur={handleBlur('nombre')}
              style={styles.input}
            />
            {touched.nombre && errors.nombre && <Text style={styles.error}>{errors.nombre}</Text>}

            <TextInput
              label="Email"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              keyboardType="email-address"
              style={styles.input}
            />
            {touched.email && errors.email && <Text style={styles.error}>{errors.email}</Text>}

            <TextInput
              label="Contraseña"
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              secureTextEntry
              style={styles.input}
            />
            {touched.password && errors.password && <Text style={styles.error}>{errors.password}</Text>}

            <Button mode="contained" onPress={handleSubmit} style={styles.button}>
              Registrarse
            </Button>
          </>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:20, justifyContent:'center' },
  input:    { marginBottom:10 },
  button:   { marginTop:20 },
  error:    { color:'red', fontSize:12, marginBottom:5 },
});

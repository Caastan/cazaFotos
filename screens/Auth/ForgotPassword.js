import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

const Schema = Yup.object().shape({
  email: Yup.string().email('Email inválido').required('Email requerido'),
});

export default function ForgotPasswordScreen() {
  const { resetPassword } = useContext(AuthContext);

  const handleReset = async ({ email }) => {
    try {
      await resetPassword(email);
      Alert.alert(
        'Revisa tu correo',
        'Hemos enviado un link para restablecer tu contraseña.'
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Formik
        initialValues={{ email: '' }}
        validationSchema={Schema}
        onSubmit={handleReset}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <>
            <TextInput
              label="Email"
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              value={values.email}
              style={styles.input}
            />
            {touched.email && errors.email && (
              <Text style={styles.error}>{errors.email}</Text>
            )}
            <Button mode="contained" onPress={handleSubmit} style={styles.button}>
              Restablecer contraseña
            </Button>
          </>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:20 },
  input:     { marginBottom:10 },
  button:    { marginTop:20 },
  error:     { color:'red' },
});

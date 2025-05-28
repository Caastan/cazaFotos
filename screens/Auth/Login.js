import React, { useContext } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../../contexts/AuthContext';

const LoginSchema = Yup.object().shape({
  email:     Yup.string().email('Email inválido').required('Email obligatorio'),
  password:  Yup.string().required('Contraseña obligatoria'),
});

export default function LoginScreen() {
  const navigation = useNavigation();
  const { signIn }  = useContext(AuthContext);

  const handleLogin = async (values) => {
    try {
      await signIn(values);
    } catch(e) {
      if (e.message.includes('Email not confirmed')) {
      return Alert.alert(
        'Correo no confirmado',
        'Revisa tu email y pulsa el enlace que te hemos enviado antes de iniciar sesión.'
      );
    }
    Alert.alert('Error al iniciar sesión', e.message);
      }
  };

  return (
    <View style={styles.container}>
      <Formik
        initialValues={{ email:'', password:'' }}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched })=>(
          <View>
            <TextInput
              label="Email"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              keyboardType="email-address"
              style={styles.input}
            />
            {touched.email && errors.email && (
              <Text style={styles.error}>{errors.email}</Text>
            )}
            <TextInput
              label="Contraseña"
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              secureTextEntry
              style={styles.input}
            />
            {touched.password && errors.password && (
              <Text style={styles.error}>{errors.password}</Text>
            )}
            <Button mode="contained" onPress={handleSubmit} style={styles.button}>
              Iniciar Sesión
            </Button>
            <Button onPress={()=>navigation.navigate('Register')}>
              ¿No tienes cuenta? Regístrate
            </Button>
            <Button onPress={()=>navigation.navigate('ForgotPassword')}>
              ¿Has olvidado la contraseña?
            </Button>
          </View>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:20, justifyContent:'center'},
  input:    {marginBottom:10},
  button:   {marginVertical:10},
  error:    {color:'red', fontSize:12, marginBottom:5},
});

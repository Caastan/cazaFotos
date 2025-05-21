import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const Schema = Yup.object().shape({
  email: Yup.string().email('Email inválido').required('Email requerido'),
});

export default function ForgotPasswordScreen() {
  const handleReset = async ({ email }) => {
    try {
      const q = query(collection(db,'usuarios'), where('email','==',email));
      const snap = await getDocs(q);
      if (snap.empty) return Alert.alert('No existe ninguna cuenta con ese email');

      const userDoc = snap.docs[0];
      const nueva   = Math.random().toString(36).slice(-8); // pass aleatoria

      await updateDoc(doc(db,'usuarios',userDoc.id), { contrasena:nueva });

      Alert.alert(
        'Contraseña restablecida',
        `Tu nueva contraseña temporal es: ${nueva}\nCámbiala al iniciar sesión.`
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Formik initialValues={{ email:'' }} validationSchema={Schema} onSubmit={handleReset}>
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched })=>(
          <>
            <TextInput
              label="Email"
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              value={values.email}
              style={styles.input}
            />
            {touched.email && errors.email && <Text style={styles.error}>{errors.email}</Text>}
            <Button mode="contained" onPress={handleSubmit} style={styles.button}>
              Restablecer contraseña
            </Button>
          </>
        )}
      </Formik>
    </View>
  );
}
const styles=StyleSheet.create({ container:{flex:1,justifyContent:'center',padding:20},
  input:{marginBottom:10},button:{marginTop:20},error:{color:'red'}});
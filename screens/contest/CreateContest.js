import React, { useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { db } from '../../config/firebaseConfig';
import { addDoc, collection, Timestamp, setDoc, doc } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const schema=Yup.object().shape({
  titulo:Yup.string().required(),
  descripcion:Yup.string().required(),
  tema:Yup.string().required(),
  premios:Yup.string().required(),
  fechaFinSubida:Yup.date().required(),
  fechaVeredicto:Yup.date().min(Yup.ref('fechaFinSubida')),
});

export default function CreateContestScreen(){
  const { user } = useContext(AuthContext);
  const navigation=useNavigation();

  if(!user) return null; // seguridad

  const handleCreate = async(values)=>{
    try{
       const docRef = await addDoc(collection(db,'concursos'),{
            ...values,
            fechaInicio: Timestamp.now(),
            fechaFinSubida: Timestamp.fromDate(new Date(values.fechaFinSubida)),
            fechaVeredicto: Timestamp.fromDate(new Date(values.fechaVeredicto)),
            creadoPor: user.id,
        });
      Alert.alert('Concurso creado');
      navigation.goBack();
    }catch(e){Alert.alert('Error',e.message);}
  };

  return(
    <View style={styles.container}>
      <Formik
        initialValues={{
          titulo:'',descripcion:'',tema:'',
          premios:'',fechaFinSubida:'',fechaVeredicto:''
        }}
        validationSchema={schema} onSubmit={handleCreate}>
        {({handleChange,handleBlur,handleSubmit,values})=>(
          <>
            <TextInput label="Título"   value={values.titulo}   onChangeText={handleChange('titulo')}   style={styles.input}/>
            <TextInput label="Descripción" multiline value={values.descripcion} onChangeText={handleChange('descripcion')} style={styles.input}/>
            <TextInput label="Tema"      value={values.tema}    onChangeText={handleChange('tema')}      style={styles.input}/>
            <TextInput label="Premios"   value={values.premios} onChangeText={handleChange('premios')}   style={styles.input}/>
            <TextInput label="Plazo subida (AAAA-MM-DD)" value={values.fechaFinSubida} onChangeText={handleChange('fechaFinSubida')} style={styles.input}/>
            <TextInput label="Fecha veredicto (AAAA-MM-DD)" value={values.fechaVeredicto} onChangeText={handleChange('fechaVeredicto')} style={styles.input}/>
            <Button mode="contained" onPress={handleSubmit}>Crear</Button>
          </>
        )}
      </Formik>
    </View>
  );
}
const styles=StyleSheet.create({container:{flex:1,padding:20},input:{marginBottom:10}});
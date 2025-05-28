import React, { useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { db } from '../../lib/supabaseClients';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const schema = Yup.object().shape({
  titulo:         Yup.string().required(),
  descripcion:    Yup.string().required(),
  tema:           Yup.string().required(),
  premios:        Yup.string().required(),
  fechaFinSubida: Yup.date().required(),
  fechaVeredicto: Yup.date().min(Yup.ref('fechaFinSubida')),
});

export default function CreateContestScreen() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  if (!user) return null;

  const handleCreate = async (values) => {
    try {
      const { error } = await db.from('concursos').insert([{
        titulo:           values.titulo,
        descripcion:      values.descripcion,
        tema:             values.tema,
        premios:          values.premios,
        fecha_inicio:     new Date().toISOString(),
        fecha_fin_subida: values.fechaFinSubida,
        fecha_veredicto:  values.fechaVeredicto,
        created_by:       user.id,
      }]);
      if (error) throw error;
      Alert.alert('Concurso creado');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Formik
        initialValues={{
          titulo:'', descripcion:'', tema:'',
          premios:'', fechaFinSubida:'', fechaVeredicto:''
        }}
        validationSchema={schema}
        onSubmit={handleCreate}
      >
        {({ handleChange, handleSubmit, values }) => (
          <>
            <TextInput label="Título"   value={values.titulo}        onChangeText={handleChange('titulo')}        style={styles.input}/>
            <TextInput label="Descripción" multiline                 value={values.descripcion} onChangeText={handleChange('descripcion')} style={styles.input}/>
            <TextInput label="Tema"      value={values.tema}          onChangeText={handleChange('tema')}           style={styles.input}/>
            <TextInput label="Premios"   value={values.premios}       onChangeText={handleChange('premios')}        style={styles.input}/>
            <TextInput label="Plazo subida (YYYY-MM-DD)"
                       value={values.fechaFinSubida}
                       onChangeText={handleChange('fechaFinSubida')}
                       style={styles.input}/>
            <TextInput label="Fecha veredicto (YYYY-MM-DD)"
                       value={values.fechaVeredicto}
                       onChangeText={handleChange('fechaVeredicto')}
                       style={styles.input}/>
            <Button mode="contained" onPress={handleSubmit}>Crear</Button>
          </>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:20 },
  input:    { marginBottom:10 },
});

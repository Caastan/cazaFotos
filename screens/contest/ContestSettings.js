import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../config/supabase';

const schema = Yup.object().shape({
  titulo:         Yup.string().required('Requerido'),
  descripcion:    Yup.string().required('Requerido'),
  tema:           Yup.string().required('Requerido'),
  premios:        Yup.string().required('Requerido'),
  fecha_fin_subida: Yup.date().required('Requerido'),
  fecha_veredicto:  Yup.date().min(
    Yup.ref('fecha_fin_subida'),
    'Veredicto ≥ plazo subida'
  ),
});

export default function ContestSettingsScreen({ route, navigation }) {
  const { contestId } = route.params;
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', contestId)
        .single();
      if (error) return Alert.alert('Error', error.message);
      setInitialValues({
        titulo: data.titulo,
        descripcion: data.descripcion,
        tema: data.tema,
        premios: data.premios,
        fecha_fin_subida: data.fecha_fin_subida.slice(0,16),
        fecha_veredicto: data.fecha_veredicto.slice(0,16),
      });
    })();
  }, []);

  if (!initialValues) return null;

  return (
    <View style={styles.container}>
      <Formik
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values) => {
          const { error } = await supabase
            .from('concursos')
            .update({
              titulo: values.titulo,
              descripcion: values.descripcion,
              tema: values.tema,
              premios: values.premios,
              fecha_fin_subida: new Date(values.fecha_fin_subida).toISOString(),
              fecha_veredicto: new Date(values.fecha_veredicto).toISOString(),
            })
            .eq('id', contestId);
          if (error) return Alert.alert('Error', error.message);
          Alert.alert('Guardado');
          navigation.goBack();
        }}
      >
        {({ handleChange, handleSubmit, values }) => (
          <>
            <TextInput label="Título" value={values.titulo} onChangeText={handleChange('titulo')} />
            <TextInput label="Descripción" multiline value={values.descripcion} onChangeText={handleChange('descripcion')} />
            <TextInput label="Tema" value={values.tema} onChangeText={handleChange('tema')} />
            <TextInput label="Premios" value={values.premios} onChangeText={handleChange('premios')} />
            <TextInput
              label="Plazo subida (aaaa-MM-ddTHH:mm)"
              value={values.fecha_fin_subida}
              onChangeText={handleChange('fecha_fin_subida')}
            />
            <TextInput
              label="Veredicto (aaaa-MM-ddTHH:mm)"
              value={values.fecha_veredicto}
              onChangeText={handleChange('fecha_veredicto')}
            />
            <Button mode="contained" onPress={handleSubmit} style={styles.button}>
              Guardar cambios
            </Button>
          </>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20 },
  button: { marginTop:20 }
});
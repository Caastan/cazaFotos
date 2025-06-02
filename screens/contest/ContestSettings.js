import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';

const schema = Yup.object().shape({
  titulo:          Yup.string().required('Requerido'),
  descripcion:     Yup.string().required('Requerido'),
  tema:            Yup.string().required('Requerido'),
  premios:         Yup.string().required('Requerido'),
  fecha_fin_subida: Yup.date().required('Requerido'),
  fecha_veredicto:  Yup.date().min(
    Yup.ref('fecha_fin_subida'),
    'Veredicto ≥ plazo subida'
  ),
});

export default function ContestSettingsScreen({ route, navigation }) {
  const { colors, fonts } = useTheme();
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
        fecha_fin_subida: data.fecha_fin_subida.slice(0, 16),
        fecha_veredicto: data.fecha_veredicto.slice(0, 16),
      });
    })();
  }, []);

  if (!initialValues) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text
        style={[
          styles.header,
          { color: colors.primary, fontFamily: fonts.titleMedium.fontFamily },
        ]}
      >
        Editar Concurso
      </Text>
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
        {({ handleChange, handleSubmit, values, errors, touched }) => (
          <>
            <TextInput
              label="Título"
              value={values.titulo}
              onChangeText={handleChange('titulo')}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              placeholderTextColor={colors.placeholder}
              outlineColor={colors.placeholder}
              activeOutlineColor={colors.primary}
              theme={{
                fonts: { regular: { fontFamily: fonts.titleMedium.fontFamily } },
              }}
            />
            {touched.titulo && errors.titulo && (
              <Text
                style={[
                  styles.errorText,
                  { color: colors.primary, fontFamily: fonts.bodySmall.fontFamily },
                ]}
              >
                {errors.titulo}
              </Text>
            )}

            <TextInput
              label="Descripción"
              multiline
              value={values.descripcion}
              onChangeText={handleChange('descripcion')}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              placeholderTextColor={colors.placeholder}
              outlineColor={colors.placeholder}
              activeOutlineColor={colors.primary}
              theme={{
                fonts: { regular: { fontFamily: fonts.bodyMedium.fontFamily } },
              }}
            />
            {touched.descripcion && errors.descripcion && (
              <Text
                style={[
                  styles.errorText,
                  { color: colors.primary, fontFamily: fonts.bodySmall.fontFamily },
                ]}
              >
                {errors.descripcion}
              </Text>
            )}

            <TextInput
              label="Tema"
              value={values.tema}
              onChangeText={handleChange('tema')}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              placeholderTextColor={colors.placeholder}
              outlineColor={colors.placeholder}
              activeOutlineColor={colors.primary}
              theme={{
                fonts: { regular: { fontFamily: fonts.bodyMedium.fontFamily } },
              }}
            />
            {touched.tema && errors.tema && (
              <Text
                style={[
                  styles.errorText,
                  { color: colors.primary, fontFamily: fonts.bodySmall.fontFamily },
                ]}
              >
                {errors.tema}
              </Text>
            )}

            <TextInput
              label="Premios"
              value={values.premios}
              onChangeText={handleChange('premios')}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              placeholderTextColor={colors.placeholder}
              outlineColor={colors.placeholder}
              activeOutlineColor={colors.primary}
              theme={{
                fonts: { regular: { fontFamily: fonts.bodyMedium.fontFamily } },
              }}
            />
            {touched.premios && errors.premios && (
              <Text
                style={[
                  styles.errorText,
                  { color: colors.primary, fontFamily: fonts.bodySmall.fontFamily },
                ]}
              >
                {errors.premios}
              </Text>
            )}

            <TextInput
              label="Plazo subida (aaaa-MM-ddTHH:mm)"
              value={values.fecha_fin_subida}
              onChangeText={handleChange('fecha_fin_subida')}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              placeholderTextColor={colors.placeholder}
              outlineColor={colors.placeholder}
              activeOutlineColor={colors.primary}
              theme={{
                fonts: { regular: { fontFamily: fonts.bodyMedium.fontFamily } },
              }}
            />
            {touched.fecha_fin_subida && errors.fecha_fin_subida && (
              <Text
                style={[
                  styles.errorText,
                  { color: colors.primary, fontFamily: fonts.bodySmall.fontFamily },
                ]}
              >
                {errors.fecha_fin_subida}
              </Text>
            )}

            <TextInput
              label="Veredicto (aaaa-MM-ddTHH:mm)"
              value={values.fecha_veredicto}
              onChangeText={handleChange('fecha_veredicto')}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              placeholderTextColor={colors.placeholder}
              outlineColor={colors.placeholder}
              activeOutlineColor={colors.primary}
              theme={{
                fonts: { regular: { fontFamily: fonts.bodyMedium.fontFamily } },
              }}
            />
            {touched.fecha_veredicto && errors.fecha_veredicto && (
              <Text
                style={[
                  styles.errorText,
                  { color: colors.primary, fontFamily: fonts.bodySmall.fontFamily },
                ]}
              >
                {errors.fecha_veredicto}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={[styles.button, { backgroundColor: colors.primary }]}
              labelStyle={[
                styles.buttonLabel,
                { color: '#fff', fontFamily: fonts.titleMedium.fontFamily },
              ]}
            >
              Guardar cambios
            </Button>
          </>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, marginBottom: 16 },
  input: { marginBottom: 12, borderRadius: 8 },
  button: { marginTop: 20, borderRadius: 20 },
  buttonLabel: { fontSize: 16, textTransform: 'none' },
  errorText: { marginBottom: 8, fontSize: 13 },
});

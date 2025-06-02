import React, { useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const schema = Yup.object().shape({
  titulo:         Yup.string().required('Requerido'),
  descripcion:    Yup.string().required('Requerido'),
  tema:           Yup.string().required('Requerido'),
  premios:        Yup.string().required('Requerido'),
  fechaFinSubida: Yup.date().required('Requerido'),
  fechaVeredicto: Yup.date().min(Yup.ref('fechaFinSubida'), 'Veredicto ≥ plazo subida'),
});

export default function CreateContestScreen() {
  const { colors, fonts } = useTheme();
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  if (!user) return null;

  const handleCreate = async (values) => {
    try {
      const { data, error } = await supabase
        .from('concursos')
        .insert([{
          titulo:           values.titulo,
          descripcion:      values.descripcion,
          tema:             values.tema,
          premios:          values.premios,
          fecha_inicio:     new Date().toISOString(),
          fecha_fin_subida: new Date(values.fechaFinSubida).toISOString(),
          fecha_veredicto:  new Date(values.fechaVeredicto).toISOString(),
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text
        style={[
          styles.header,
          { color: colors.primary, fontFamily: fonts.titleMedium.fontFamily },
        ]}
      >
        Crear Concurso
      </Text>
      <Formik
        initialValues={{
          titulo: '',
          descripcion: '',
          tema: '',
          premios: '',
          fechaFinSubida: '',
          fechaVeredicto: '',
        }}
        validationSchema={schema}
        onSubmit={handleCreate}
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
              label="Plazo subida (YYYY-MM-DD)"
              value={values.fechaFinSubida}
              onChangeText={handleChange('fechaFinSubida')}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              placeholderTextColor={colors.placeholder}
              outlineColor={colors.placeholder}
              activeOutlineColor={colors.primary}
              theme={{
                fonts: { regular: { fontFamily: fonts.bodyMedium.fontFamily } },
              }}
            />
            {touched.fechaFinSubida && errors.fechaFinSubida && (
              <Text
                style={[
                  styles.errorText,
                  { color: colors.primary, fontFamily: fonts.bodySmall.fontFamily },
                ]}
              >
                {errors.fechaFinSubida}
              </Text>
            )}

            <TextInput
              label="Fecha veredicto (YYYY-MM-DD)"
              value={values.fechaVeredicto}
              onChangeText={handleChange('fechaVeredicto')}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              placeholderTextColor={colors.placeholder}
              outlineColor={colors.placeholder}
              activeOutlineColor={colors.primary}
              theme={{
                fonts: { regular: { fontFamily: fonts.bodyMedium.fontFamily } },
              }}
            />
            {touched.fechaVeredicto && errors.fechaVeredicto && (
              <Text
                style={[
                  styles.errorText,
                  { color: colors.primary, fontFamily: fonts.bodySmall.fontFamily },
                ]}
              >
                {errors.fechaVeredicto}
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
              Crear
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
  errorText: {
    marginBottom: 8,
    fontSize: 13,
  },
});

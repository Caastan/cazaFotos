import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TEMA_DEL_MES, TEXTO_REGLAMENTO } from '../utils/constantes';

export default function ReglamentoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bases del Concurso</Text>
      <Text style={styles.subtittle}>Tema del Mes: {TEMA_DEL_MES}</Text>    
      <Text style={styles.content}>{TEXTO_REGLAMENTO}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    marginTop: 22,
    backgroundColor: '#f8fafc',
  },
  subtittle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1f2937',
    textAlign: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1f2937',
    textAlign: 'center',
  },
  content: {
    fontSize: 16,
    lineHeight: 26,
    color: '#374151',
  },
});

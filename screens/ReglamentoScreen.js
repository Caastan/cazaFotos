import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TEXTO_REGLAMENTO } from '../utils/constantes';

export default function ReglamentoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bases del Concurso</Text>
      <Text style={styles.content}>{TEXTO_REGLAMENTO}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f8fafc',
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

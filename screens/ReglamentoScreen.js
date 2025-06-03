// screens/ReglamentoScreen.js
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
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
  },
});

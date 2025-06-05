import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TEMA_DEL_MES, TEXTO_REGLAMENTO } from '../utils/constantes';

export default function ReglamentoScreen() {
  return (
    // ScrollView permite desplazar el contenido si excede la pantalla
    <ScrollView contentContainerStyle={styles.container}>
      {/* Título principal de la pantalla */}
      <Text style={styles.title}>Bases del Concurso</Text>

      {/* Subtítulo que muestra el tema del mes desde las constantes */}
      <Text style={styles.subtittle}>Tema del Mes: {TEMA_DEL_MES}</Text>

      {/* Texto del reglamento completo, almacenado en constantes */}
      <Text style={styles.content}>{TEXTO_REGLAMENTO}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    // Espaciado interior y margen superior para evitar el notch/status bar
    padding: 24,
    marginTop: 22,
    backgroundColor: '#f8fafc', // Fondo claro para toda la pantalla
  },
  subtittle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1f2937', // Texto oscuro para buena legibilidad
    textAlign: 'center', // Centrar el subtítulo
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1f2937', // Mismo color que el subtítulo
    textAlign: 'center', // Centrar el título
  },
  content: {
    fontSize: 16,
    lineHeight: 26, // Espaciado entre líneas más cómodo para lectura
    color: '#374151', // Gris oscuro para el contenido largo
  },
});
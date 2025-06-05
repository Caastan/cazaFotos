import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../config/supabase';
import { db } from '../lib/supabaseClients';
import Constants from 'expo-constants';

export default function GestionFotos() {
  const [fotos, setFotos] = useState([]);       // Almacena la lista de fotos pendientes
  const [loading, setLoading] = useState(true); // Controla el indicador de carga

  /**
   * Función que trae todas las fotos cuyo status sea 'pending'
   * - Selecciona id, url, usuario_id y el display_name del autor
   * - Ordena por fecha de creación (ascendente)
   * - Actualiza el estado 'fotos' o muestra alerta si hay error
   */
  const fetchFotosPendientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('fotos')
        .select('id, url, usuario_id, usuarios(display_name)')
        .eq('status', 'pending')                       // Filtra solo fotos pendientes
        .order('created_at', { ascending: true });      // Ordena por fecha de subida, de más antigua a más nueva

      if (error) throw error;
      setFotos(data || []);                             // Guarda datos o array vacío
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las fotos pendientes.');
    } finally {
      setLoading(false);                                // Desactiva el spinner al terminar
    }
  };

  // Al montar el componente, obtenemos las fotos pendientes una única vez
  useEffect(() => {
    fetchFotosPendientes();
  }, []);

  /**
   * Función para actualizar el estado de una foto:
   * - Puede aprobar, rechazar o eliminar (borrar de base + bucket)
   * - Tras la operación, vuelve a recargar la lista pendiente
   */
  const handleActualizarEstado = async (fotoId, nuevoEstado, fotoUrl) => {
    try {
      if (nuevoEstado === 'deleted') {
        // 1) Elimina la fila de la tabla 'fotos'
        const { error: deleteError } = await db.from('fotos').delete().eq('id', fotoId);
        if (deleteError) throw deleteError;

        // 2) Extrae el path relativo del archivo en Storage a partir de su URL pública
        const publicUrlPrefix = `${Constants.expoConfig.extra.SUPABASE_URL}/storage/v1/object/public/photos/`;
        const filePath = fotoUrl.replace(publicUrlPrefix, '');
        if (filePath) {
          // 3) Elimina el archivo del bucket 'photos' en Supabase Storage
          const { error: removeError } = await supabase.storage
            .from('photos')
            .remove([filePath]);
          if (removeError) {
            Alert.alert('Error', 'No se pudo eliminar el archivo del bucket.');
          }
        }
      } else {
        // Actualiza solo la columna 'status' de la foto (approved o rejected)
        const { error: updateError } = await db
          .from('fotos')
          .update({ status: nuevoEstado })
          .eq('id', fotoId);
        if (updateError) throw updateError;
      }

      // Refresca la lista de fotos pendientes tras cualquier cambio
      await fetchFotosPendientes();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el estado.');
    }
  };

  /**
   * Función para renderizar cada tarjeta de foto pendiente:
   * - Muestra imagen, autor y botones según acción permitida
   */
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <Text style={styles.nameText}>Autor: {item.usuarios.display_name}</Text>
      <View style={styles.buttonRow}>
        {/* Botón para aprobar la foto */}
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleActualizarEstado(item.id, 'approved', item.url)}
        >
          <Text style={styles.actionButtonText}>Aprobar</Text>
        </TouchableOpacity>
        {/* Botón para rechazar la foto */}
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleActualizarEstado(item.id, 'rejected', item.url)}
        >
          <Text style={styles.actionButtonText}>Rechazar</Text>
        </TouchableOpacity>
        {/* Botón para eliminar la foto por completo */}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleActualizarEstado(item.id, 'deleted', item.url)}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Muestra indicador de carga mientras fetchFotosPendientes está en curso
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Lista de fotos pendientes; si no hay ninguna, muestra mensaje correspondiente
  return (
    <FlatList
      data={fotos}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No hay fotos pendientes.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    marginTop: 22,
    backgroundColor: '#f8fafc', // Fondo claro para consistencia visual
  },
  card: {
    backgroundColor: '#fff',    // Fondo blanco para cada tarjeta
    borderRadius: 16,           // Bordes redondeados para estética suave
    marginBottom: 24,
    elevation: 3,               // Sombra ligera para Android
    overflow: 'hidden',
    shadowColor: '#000',        // Sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  image: {
    width: '100%',
    height: 200,                // Altura fija para uniformidad
  },
  nameText: {
    fontSize: 16,
    fontWeight: '500',
    padding: 14,
    color: '#111827',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 30,           // Botones redondeados
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#22c55e', // Verde para aprobar
  },
  rejectButton: {
    backgroundColor: '#f59e0b', // Amarillo/naranja para rechazar
  },
  deleteButton: {
    backgroundColor: '#ef4444', // Rojo para eliminar
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#9ca3af',           // Gris suave para mensaje vacío
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
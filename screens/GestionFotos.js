// screens/GestionFotos.js
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
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1) Carga todas las fotos pendientes (status = 'pending')
  const fetchFotosPendientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('fotos')
        .select('id, url, usuario_id, usuarios(display_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFotos(data || []);
    } catch (error) {
      console.log('Error fetching fotos pendientes:', error);
      Alert.alert('Error', 'No se pudieron cargar las fotos pendientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFotosPendientes();
  }, []);

  // 2) Cambia el estado o elimina la foto
  const handleActualizarEstado = async (fotoId, nuevoEstado, fotoUrl) => {
    try {
      if (nuevoEstado === 'deleted') {
        // 2.1) Eliminar registro de la tabla
        const { error: deleteError } = await db.from('fotos').delete().eq('id', fotoId);
        if (deleteError) throw deleteError;

        // 2.2) Eliminar archivo en Storage
        const publicUrlPrefix = `${Constants.expoConfig.extra.SUPABASE_URL}/storage/v1/object/public/photos/`;
        const filePath = fotoUrl.replace(publicUrlPrefix, '');
        if (filePath) {
          const { error: removeError } = await supabase.storage
            .from('photos')
            .remove([filePath]);
          if (removeError) {
            console.log('Error al eliminar archivo de Storage:', removeError);
            Alert.alert('Error', 'No se pudo eliminar el archivo del bucket.');
          }
        }
      } else {
        // 2.3) Actualizar status a 'approved' o 'rejected'
        const { error: updateError } = await db
          .from('fotos')
          .update({ status: nuevoEstado })
          .eq('id', fotoId);
        if (updateError) throw updateError;
      }

      // 2.4) Refrescar lista de fotos pendientes
      await fetchFotosPendientes();
    } catch (error) {
      console.log('Error actualizando foto:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar el estado.');
    }
  };

  // 3) Render de cada tarjeta de foto pendiente
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <Text style={styles.nameText}>Autor: {item.usuarios.display_name}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#34c759' }]}
          onPress={() =>
            handleActualizarEstado(item.id, 'approved', item.url)
          }
        >
          <Text style={styles.actionButtonText}>Aprobar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ff9f0a' }]}
          onPress={() =>
            handleActualizarEstado(item.id, 'rejected', item.url)
          }
        >
          <Text style={styles.actionButtonText}>Rechazar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ff3b30' }]}
          onPress={() =>
            handleActualizarEstado(item.id, 'deleted', item.url)
          }
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
    padding: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 200,
  },
  nameText: {
    fontSize: 16,
    margin: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

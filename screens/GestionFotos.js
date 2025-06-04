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
      Alert.alert('Error', 'No se pudieron cargar las fotos pendientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFotosPendientes();
  }, []);

  const handleActualizarEstado = async (fotoId, nuevoEstado, fotoUrl) => {
    try {
      if (nuevoEstado === 'deleted') {
        const { error: deleteError } = await db.from('fotos').delete().eq('id', fotoId);
        if (deleteError) throw deleteError;

        const publicUrlPrefix = `${Constants.expoConfig.extra.SUPABASE_URL}/storage/v1/object/public/photos/`;
        const filePath = fotoUrl.replace(publicUrlPrefix, '');
        if (filePath) {
          const { error: removeError } = await supabase.storage
            .from('photos')
            .remove([filePath]);
          if (removeError) {
            Alert.alert('Error', 'No se pudo eliminar el archivo del bucket.');
          }
        }
      } else {
        const { error: updateError } = await db
          .from('fotos')
          .update({ status: nuevoEstado })
          .eq('id', fotoId);
        if (updateError) throw updateError;
      }

      await fetchFotosPendientes();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el estado.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <Text style={styles.nameText}>Autor: {item.usuarios.display_name}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleActualizarEstado(item.id, 'approved', item.url)}
        >
          <Text style={styles.actionButtonText}>Aprobar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleActualizarEstado(item.id, 'rejected', item.url)}
        >
          <Text style={styles.actionButtonText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleActualizarEstado(item.id, 'deleted', item.url)}
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
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    elevation: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  image: {
    width: '100%',
    height: 200,
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
    borderRadius: 30,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#22c55e',
  },
  rejectButton: {
    backgroundColor: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#9ca3af',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

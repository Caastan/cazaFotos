// screens/GestionUsuarios.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { db } from '../lib/supabaseClients';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsuariosPendientes = async () => {
    try {
      const { data, error } = await db
        .from('usuarios')
        .select('id, display_name, email')
        .eq('rol', 'participante')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setUsuarios(data);
    } catch (error) {
      console.log('Error fetching usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuariosPendientes();
  }, []);

  const handleActualizarEstado = async (usuarioId, nuevoEstado) => {
    try {
      await db
        .from('usuarios')
        .update({ status: nuevoEstado })
        .eq('id', usuarioId);
      fetchUsuariosPendientes();
    } catch (error) {
      console.log('Error actualizando usuario:', error);
      Alert.alert('Error', error.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.nameText}>{item.display_name}</Text>
      <Text style={styles.emailText}>{item.email}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#34c759' }]}
          onPress={() => handleActualizarEstado(item.id, 'active')}
        >
          <Text style={styles.actionButtonText}>Aprobar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ff3b30' }]}
          onPress={() => handleActualizarEstado(item.id, 'rejected')}
        >
          <Text style={styles.actionButtonText}>Rechazar</Text>
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
      data={usuarios}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={<Text style={styles.emptyText}>No hay usuarios pendientes.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    elevation: 2,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emailText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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
    fontSize: 16,
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

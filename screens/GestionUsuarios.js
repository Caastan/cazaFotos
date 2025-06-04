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
      setUsuarios(data || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios pendientes.');
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
      Alert.alert('Error', error.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.nameText}>{item.display_name}</Text>
      <Text style={styles.emailText}>{item.email}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleActualizarEstado(item.id, 'active')}
        >
          <Text style={styles.actionButtonText}>Aprobar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
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
      ListEmptyComponent={
        <Text style={styles.emptyText}>No hay usuarios pendientes.</Text>
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
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  approveButton: {
    backgroundColor: '#22c55e',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
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

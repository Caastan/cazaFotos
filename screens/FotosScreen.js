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
import { db } from '../lib/supabaseClients';
import { useAuth } from '../contexts/AuthContext';
import { startOfToday } from 'date-fns';
import { useIsFocused } from '@react-navigation/native';

export default function FotosScreen() {
  const { user } = useAuth();
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchFotos = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('fotos')
        .select(`
          id,
          url,
          votes_count,
          usuario_id,
          created_at,
          usuarios (
            display_name
          )
        `)
        .eq('status', 'approved')
        .order('votes_count', { ascending: false });
      if (error) throw error;
      setFotos(data || []);
    } catch (error) {
      console.log('Error fetching fotos:', error);
      Alert.alert('Error', 'No se pudieron cargar las fotos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     if (isFocused) {
      fetchFotos();
    }
  }, [isFocused]);

  const handleVotar = async (foto) => {
    if (!user || user.rol !== 'general' || user.status !== 'active') return;
    try {
      const { count, error: countError } = await db
        .from('votos')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', user.id)
        .gte('created_at', startOfToday());
      if (countError) throw countError;
      if (count >= 10) {
        Alert.alert('Límite diario alcanzado', 'Solo puedes votar 10 veces al día.');
        return;
      }
      await db.from('votos').insert({ usuario_id: user.id, foto_id: foto.id });
      await db
        .from('fotos')
        .update({ votes_count: foto.votes_count + 1 })
        .eq('id', foto.id);
      Alert.alert('¡Gracias por tu voto!');
      fetchFotos();
    } catch (error) {
      console.log('Error al votar:', error);
      Alert.alert('Error al votar', error.message);
    }
  };

  const renderItem = ({ item }) => {
    const fecha = new Date(item.created_at).toLocaleDateString();
    return (
      <View style={styles.card}>
        <Image source={{ uri: item.url }} style={styles.image} />
        <View style={styles.infoContainer}>
          <Text style={styles.userText}>
            Subida por <Text style={styles.bold}>{item.usuarios.display_name}</Text>
          </Text>
          <Text style={styles.dateText}>Fecha: {fecha}</Text>
          <Text style={styles.votesText}>❤️ {item.votes_count}</Text>
          {user?.rol === 'general' && user.status === 'active' && (
            <TouchableOpacity
              style={styles.voteButton}
              onPress={() => handleVotar(item)}
            >
              <Text style={styles.voteButtonText}>Votar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

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
        <Text style={styles.emptyText}>No hay fotos aprobadas.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 12,
    backgroundColor: '#fff',
  },
  card: {
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fdfdfd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 240,
  },
  infoContainer: {
    padding: 16,
  },
  userText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  bold: {
    fontWeight: '600',
    color: '#111',
  },
  votesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  voteButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  },
  voteButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    color: '#888',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

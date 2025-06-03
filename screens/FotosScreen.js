// screens/FotosScreen.js
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

export default function FotosScreen() {
  const { user } = useAuth();
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFotos = async () => {
    setLoading(true);
    try {
      // Seleccionamos solo fotos APPROVED e incluimos nombre de usuario y fecha de creación
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
    fetchFotos();
  }, []);

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
    // Formateamos la fecha de creación
    const fecha = new Date(item.created_at).toLocaleDateString();
    return (
      <View style={styles.card}>
        <Image source={{ uri: item.url }} style={styles.image} />
        <View style={styles.infoContainer}>
          <View style={styles.textColumn}>
            <Text style={styles.subtitle}>
              Subidor por: {item.usuarios.display_name}
            </Text>
            <Text style={styles.subtitle}>Fecha: {fecha}</Text>
            <Text style={styles.votesText}>Votos: {item.votes_count}</Text>
          </View>
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
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 200,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  textColumn: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  votesText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  voteButton: {
    backgroundColor: '#007aff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  voteButtonText: {
    color: '#fff',
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

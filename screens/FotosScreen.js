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
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { startOfToday } from 'date-fns';
import { useIsFocused } from '@react-navigation/native';

export default function FotosScreen() {
  const { user } = useAuth();
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  // 1) Trae todas las fotos con status = 'approved'
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

  // 2a) Cada vez que esta pantalla reciba foco, volvemos a leer las fotos
  useEffect(() => {
    if (isFocused) {
      fetchFotos();
    }
  }, [isFocused]);

  // 2b) Suscripción en tiempo real: si cualquier fila de "fotos" cambia el votes_count,
  //    actualizamos nuestro estado local para que la UI refleje el nuevo valor.
  useEffect(() => {
     const fotosChannel = supabase
    .channel('public:fotos')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'fotos' },
      (payload) => {
        const updated = payload.new;
        // Solo nos interesan fotos que estén aprobadas
        if (updated.status === 'approved') {
          setFotos((prev) =>
            prev.map((f) =>
              f.id === updated.id
                ? { ...f, votes_count: updated.votes_count }
                : f
            )
          );
        }
      }
    )
    .subscribe();

    return () => {
      // 2) Nos desinscribimos al desmontar el componente
    supabase.removeChannel(fotosChannel);
    };
  }, []);

  // 3) Función para votar: inserta fila en "votos" y hace UPDATE en "fotos"
 const handleVotar = async (foto) => {
  // Sólo “general” activo puede votar
  if (!user || user.rol !== 'general' || user.status !== 'active') {
    return;
  }

  try {
    // 1) Contar votos de hoy, usando ISOString para el filtro
    const hoy = startOfToday();
    const isoHoy = hoy.toISOString();

    const { count, error: countError } = await db
      .from('votos')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .gte('created_at', isoHoy);

    if (countError) {
      console.log('— countError:', {
        code: countError.code,
        details: countError.details,
        hint: countError.hint,
        message: countError.message,
        status: countError.status,
      });
      throw countError;
    }

    if (count >= 10) {
      Alert.alert('Límite diario alcanzado', 'Solo puedes votar 10 veces al día.');
      return;
    }

    // 2) Insertar un nuevo voto
    const { data: votoData, error: insertVotoError } = await db
      .from('votos')
      .insert({ usuario_id: user.id, foto_id: foto.id })
      .select(); // devuelve la fila insertada (opcional)

    if (insertVotoError) {
      console.log('— insertVotoError:', {
        code: insertVotoError.code,
        details: insertVotoError.details,
        hint: insertVotoError.hint,
        message: insertVotoError.message,
        status: insertVotoError.status,
      });

      // Si ya existe un voto igual (constraint UNIQUE), el código será 23505
      if (insertVotoError.code === '23505') {
        Alert.alert('Ya votaste esta foto', 'No puedes votar dos veces la misma foto.');
        return;
      }
      throw insertVotoError;
    }

    // 3) Optimistic UI (subir contador localmente)
    const nuevaCuenta = foto.votes_count + 1;
    setFotos((prev) =>
      prev.map((f) =>
        f.id === foto.id
          ? { ...f, votes_count: nuevaCuenta }
          : f
      )
    );

    // 4) Actualizar el votes_count en la tabla fotos
    const { error: updateFotoError } = await db
      .from('fotos')
      .update({ votes_count: nuevaCuenta })
      .eq('id', foto.id);

    if (updateFotoError) {
      console.log('— updateFotoError:', {
        code: updateFotoError.code,
        details: updateFotoError.details,
        hint: updateFotoError.hint,
        message: updateFotoError.message,
        status: updateFotoError.status,
      });
      throw updateFotoError;
    }

    Alert.alert('¡Gracias por tu voto!');
  } catch (error) {
    // Imprimimos todas las propiedades posibles
    console.log('— Error al votar completo:', {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
      status: error.status,
      // Por si tuviera otras keys no estándar:
      ...error,
    });

    // Construir un alerta con el contenido útil (preferimos details/hint si message está vacío)
    let texto = error.message;
    if (!texto) {
      if (error.details) texto = error.details;
      else if (error.hint) texto = error.hint;
      else texto = 'Ha ocurrido un error al votar. Revisa la consola.';
    }
    Alert.alert('Error al votar', texto);
  }
};

  // 4) Renderizamos cada foto en la lista
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

  // 5) Indicador de carga
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 6) Lista de fotos aprobadas
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

// 7) Estilos originales (no han cambiado)
const styles = StyleSheet.create({
  listContainer: {
    padding: 12,
    backgroundColor: '#fff',
  },
  card: {
    marginTop: 40,
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

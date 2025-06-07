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
  const [fotos, setFotos] = useState([]);         // Lista de fotos aprobadas
  const [loading, setLoading] = useState(true);   // Controla el indicador de carga
  const isFocused = useIsFocused();               // Detecta si la pantalla está en foco

  /**
   * 1) Obtiene todas las fotos cuyo status sea 'approved', junto con el nombre de usuario
   *    y ordena por votos de mayor a menor.
   */
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
        .eq('status', 'approved')               // Filtrar solo fotos aprobadas
        .order('votes_count', { ascending: false }); // Ordenar por votos descendente

      if (error) throw error;
      setFotos(data || []);                     // Guardar resultado (o array vacío)
    } catch (error) {
      Alert.alert('Error fetching fotos:', error);
      Alert.alert('Error', 'No se pudieron cargar las fotos.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2a) Cada vez que esta pantalla recibe foco, recarga la lista de fotos.
   *     Esto asegura que siempre veas datos actualizados al volver aquí.
   */
  useEffect(() => {
    if (isFocused) {
      fetchFotos();
    }
  }, [isFocused]);

  /**
   * 2b) Suscripción en tiempo real a la tabla "fotos".
   *     Si cambia el votes_count de cualquier foto,
   *     actualiza el estado local para reflejar el nuevo conteo sin tener que recargar toda la lista.
   */
  useEffect(() => {
    const fotosChannel = supabase
      .channel('public:fotos')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'fotos' },
        (payload) => {
          const updated = payload.new;
          // Solo actualizamos fotos aprobadas
          if (updated.status === 'approved') {
            setFotos((prev) =>
              prev.map((f) =>
                f.id === updated.id
                  ? { ...f, votes_count: updated.votes_count } // Actualiza solo el votes_count
                  : f
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      // Al desmontar el componente, cancelamos la suscripción para evitar fugas de memoria
      supabase.removeChannel(fotosChannel);
    };
  }, []);

  /**
   * 3) Función para votar por una foto:
   *    - Verifica que el usuario sea "general" y esté activo.
   *    - Cuenta cuántos votos ha emitido hoy (límite 10).
   *    - Inserta un registro en la tabla "votos".
   *    - Actualiza localmente (optimistic UI) y en la tabla "fotos" el nuevo votes_count.
   */
  const handleVotar = async (foto) => {
    // Solamente usuarios con rol 'general' y estado 'active' pueden votar
    if (!user || user.rol !== 'general' || user.status !== 'active') {
      return;
    }

    try {
      // 3.1) Determinar el inicio del día en formato ISO para filtrar los votos de hoy
      const hoy = startOfToday();
      const isoHoy = hoy.toISOString();

      // Contar cuántos votos ha hecho el usuario hoy
      const { count, error: countError } = await db
        .from('votos')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', user.id)
        .gte('created_at', isoHoy);

      if (countError) {
        Alert.alert('— countError:', {
          code: countError.code,
          details: countError.details,
          hint: countError.hint,
          message: countError.message,
          status: countError.status,
        });
        throw countError;
      }

      // Si el usuario ya votó 10 veces hoy, mostramos alerta y salimos
      if (count >= 10) {
        Alert.alert('Límite diario alcanzado', 'Solo puedes votar 10 veces al día.');
        return;
      }

      // 3.2) Insertar el voto en la tabla "votos"
      const { data: votoData, error: insertVotoError } = await db
        .from('votos')
        .insert({ usuario_id: user.id, foto_id: foto.id })
        .select(); // .select() para obtener la fila insertada (opcional)

      if (insertVotoError) {
        Alert.alert('— insertVotoError:', {
          code: insertVotoError.code,
          details: insertVotoError.details,
          hint: insertVotoError.hint,
          message: insertVotoError.message,
          status: insertVotoError.status,
        });

        // Si ya existe un voto para esta combinación usuario–foto, Postgres devuelve código 23505
        if (insertVotoError.code === '23505') {
          Alert.alert('Ya votaste esta foto', 'No puedes votar dos veces la misma foto.');
          return;
        }
        throw insertVotoError;
      }

      // 3.3) Optimistic UI: actualizar localmente el contador de votos antes de la confirmación en BD
      const nuevaCuenta = foto.votes_count + 1;
      setFotos((prev) =>
        prev.map((f) =>
          f.id === foto.id
            ? { ...f, votes_count: nuevaCuenta }
            : f
        )
      );

      // 3.4) Actualizar el votes_count en la tabla "fotos"
      const { error: updateFotoError } = await db
        .from('fotos')
        .update({ votes_count: nuevaCuenta })
        .eq('id', foto.id);

      if (updateFotoError) {
        Alert.alert('— updateFotoError:', {
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
      // Registrar todos los campos del error para debugging
      Alert.alert('— Error al votar completo:', {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
        status: error.status,
        ...error, // Cualquier otra propiedad extra
      });

      // Construir un mensaje amigable para mostrar en la alerta
      let texto = error.message;
      if (!texto) {
        if (error.details) texto = error.details;
        else if (error.hint) texto = error.hint;
        else texto = 'Ha ocurrido un error al votar. Revisa la consola.';
      }
      Alert.alert('Error al votar', texto);
    }
  };

  /**
   * 4) Función para renderizar cada elemento (foto) en la lista:
   *    - Muestra imagen, nombre de usuario, fecha y cantidad de votos.
   *    - Si el usuario puede votar, muestra botón de "Votar".
   */
  const renderItem = ({ item }) => {
    // Convertir la fecha ISO a formato local legible
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

  /**
   * 5) Mientras se cargan las fotos, mostramos un indicador de carga centrado.
   */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /**
   * 6) Renderiza la lista de fotos aprobadas usando FlatList.
   *    - Si no hay fotos, muestra un mensaje de lista vacía.
   */
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

// Estilos para el componente FotosScreen
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
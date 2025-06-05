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
  // Estado local para almacenar la lista de usuarios pendientes de aprobación
  const [usuarios, setUsuarios] = useState([]);
  // Estado para controlar el indicador de carga mientras se obtienen datos
  const [loading, setLoading] = useState(true);

  /**
   * Obtiene los usuarios con rol 'participante' cuyo estado sea 'pending'
   * - Selecciona id, display_name y email de la tabla "usuarios"
   * - Ordena por fecha de creación (de más antiguo a más reciente)
   * - Actualiza el estado 'usuarios' o muestra alerta en caso de error
   */
  const fetchUsuariosPendientes = async () => {
    try {
      const { data, error } = await db
        .from('usuarios')
        .select('id, display_name, email')
        .eq('rol', 'participante')                        // Filtrar solo participantes
        .eq('status', 'pending')                          // Filtrar solo con estado pendiente
        .order('created_at', { ascending: true });         // Ordenar por fecha de registro ascendente

      if (error) throw error;
      // Guardamos los usuarios o un array vacío si no hay datos
      setUsuarios(data || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios pendientes.');
    } finally {
      // Dejamos de mostrar el indicador de carga
      setLoading(false);
    }
  };

  // Al montar el componente, se ejecuta la función para traer los usuarios pendientes
  useEffect(() => {
    fetchUsuariosPendientes();
  }, []);

  /**
   * Actualiza el estado de un usuario (active o rejected)
   * - Recibe el id del usuario y el nuevo estado a asignar
   * - Realiza la actualización en la tabla "usuarios"
   * - Vuelve a recargar la lista para reflejar cambios
   */
  const handleActualizarEstado = async (usuarioId, nuevoEstado) => {
    try {
      await db
        .from('usuarios')
        .update({ status: nuevoEstado })   // Cambiar solo la columna 'status'
        .eq('id', usuarioId);              // Filtrar por el id del usuario
      // Tras actualizar, volvemos a obtener la lista de usuarios pendientes
      fetchUsuariosPendientes();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  /**
   * Renderiza cada tarjeta de usuario pendiente
   * - Muestra display_name y email
   * - Incluye botones para aprobar o rechazar, que llaman a handleActualizarEstado
   */
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.nameText}>{item.display_name}</Text>
      <Text style={styles.emailText}>{item.email}</Text>
      <View style={styles.buttonRow}>
        {/* Botón para aprobar al usuario: asigna status 'active' */}
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleActualizarEstado(item.id, 'active')}
        >
          <Text style={styles.actionButtonText}>Aprobar</Text>
        </TouchableOpacity>
        {/* Botón para rechazar al usuario: asigna status 'rejected' */}
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleActualizarEstado(item.id, 'rejected')}
        >
          <Text style={styles.actionButtonText}>Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Mientras se cargan los datos, se muestra un indicador de carga centrado
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /**
   * Lista de usuarios pendientes:
   * - Usa FlatList para renderizar cada usuario con renderItem
   * - Si no hay usuarios, muestra un texto indicándolo
   */
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
    marginTop: 22,
    backgroundColor: '#f8fafc', // Fondo claro para consistencia visual
  },
  card: {
    backgroundColor: '#fff',    // Tarjeta con fondo blanco
    padding: 18,
    borderRadius: 16,           // Bordes redondeados
    marginBottom: 16,
    elevation: 3,               // Sombra para Android
    shadowColor: '#000',        // Sombra para iOS
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
    flexDirection: 'row',       // Botones uno al lado del otro
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 30,           // Botones redondeados
    alignItems: 'center',
    marginHorizontal: 6,
  },
  approveButton: {
    backgroundColor: '#22c55e', // Verde para aprobar
  },
  rejectButton: {
    backgroundColor: '#ef4444', // Rojo para rechazar
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
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
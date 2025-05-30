// src/screens/request/PhotoRequestsScreen.js
import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, Image, Alert, StyleSheet } from 'react-native';
import { Card, Button, Text } from 'react-native-paper';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';

export default function PhotoRequestsScreen({ route }) {
  const { contestId } = route.params;
  const { user }     = useContext(AuthContext);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('photo_requests')
      .select('id, concurso_id, user_id, ruta, url, status, created_at')
      .eq('concurso_id', contestId)
      .eq('status', 'pending');

    if (error) {
      return Alert.alert('Error al cargar solicitudes', error.message);
    }
    setRequests(data);
  };

  const handleDecision = async (item, decision) => {
    const { id, user_id, ruta, url } = item;

    // 1) Si es admitido, inserta en la tabla `fotos`
    if (decision === 'admitted') {
      const { error: insertError } = await supabase
        .from('fotos')
        .insert([{
          concurso_id: contestId,
          usuario_id:  user_id,
          ruta:        ruta,
          url:         url,
          status:      'admitted',
          created_at:  new Date().toISOString(),
        }]);
      if (insertError) {
        return Alert.alert('Error al insertar foto', insertError.message);
      }
    }

    // 2) Actualiza el estado en `photo_requests`
    const { error: updateError } = await supabase
      .from('photo_requests')
      .update({ status: decision })
      .eq('id', id);
    if (updateError) {
      return Alert.alert('Error al actualizar solicitud', updateError.message);
    }

    // 3) Refresca la lista
    fetchRequests();
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <Card.Content>
        <Text>Subida por: {item.user_id}</Text>
        <Text>Fecha: {new Date(item.created_at).toLocaleString()}</Text>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => handleDecision(item, 'admitted')}>Admitir</Button>
        <Button onPress={() => handleDecision(item, 'rejected')}>Rechazar</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No hay fotos pendientes.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card:      { marginVertical: 8 },
  image:     { width: '100%', height: 200, borderRadius: 8, marginBottom: 8 },
  empty:     { textAlign: 'center', marginTop: 20 },
});

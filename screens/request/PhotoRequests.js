import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, Image, Alert, StyleSheet } from 'react-native';
import { Card, Button, Text } from 'react-native-paper';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';

export default function PhotoRequestsScreen({ route }) {
  const { contestId } = route.params;
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('photo_requests')
      .select('id, url, user_id, status')
      .eq('concurso_id', contestId)
      .eq('status', 'pending');
    if (error) return Alert.alert('Error', error.message);
    setRequests(data);
  };

  const handleDecision = async (id, decision, url) => {
    if (decision === 'admitted') {
      // Insert en tabla fotos
      const { error: e1 } = await supabase
        .from('fotos')
        .insert([{ concurso_id: contestId, usuario_id: user.id, ruta: url, status: 'admitted' }]);
      if (e1) return Alert.alert('Error', e1.message);
    }
    // Actualizar photo_requests
    const { error: e2 } = await supabase
      .from('photo_requests')
      .update({ status: decision })
      .eq('id', id);
    if (e2) return Alert.alert('Error', e2.message);
    fetchRequests();
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <Card.Actions>
        <Button onPress={() => handleDecision(item.id, 'admitted', item.url)}>Admitir</Button>
        <Button onPress={() => handleDecision(item.id, 'rejected')}>Rechazar</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No hay fotos pendientes.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginVertical: 8 },
  image: { width: '100%', height: 200, borderRadius: 8 },
});
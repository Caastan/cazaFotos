import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, Alert, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';

export default function ParticipationRequestsScreen({ route }) {
  const { contestId } = route.params;
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('participation_requests')
      .select('id, user_id, status, created_at, usuarios(display_name)')
      .eq('concurso_id', contestId)
      .eq('status', 'pending');
    if (error) return Alert.alert('Error', error.message);
    setRequests(data);
  };

  const handleDecision = async (id, decision) => {
    const { error } = await supabase
      .from('participation_requests')
      .update({ status: decision })
      .eq('id', id);
    if (error) return Alert.alert('Error', error.message);
    fetchRequests();
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title title={item.usuarios.display_name} subtitle={item.user_id} />
      <Card.Actions>
        <Button onPress={() => handleDecision(item.id, 'admitted')}>Admitir</Button>
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
        ListEmptyComponent={<Text>No hay solicitudes pendientes.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginVertical: 8 },
});
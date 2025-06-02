import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, Alert, StyleSheet } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';

export default function ParticipationRequestsScreen({ route }) {
  const { colors, fonts } = useTheme();
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
    <Card style={[styles.card, { backgroundColor: colors.surface }]}>
      <Card.Title
        title={item.usuarios.display_name}
        titleStyle={[
          styles.cardTitle,
          { color: colors.text, fontFamily: fonts.titleMedium.fontFamily },
        ]}
        subtitle={item.user_id}
        subtitleStyle={{
          color: colors.placeholder,
          fontFamily: fonts.bodyMedium.fontFamily,
        }}
      />
      <Card.Content style={{ marginBottom: 8 }}>
        <Text
          style={[
            styles.dateText,
            { color: colors.placeholder, fontFamily: fonts.bodyMedium.fontFamily },
          ]}
        >
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </Card.Content>
      <Card.Actions
        style={{ justifyContent: 'flex-end', paddingRight: 8, paddingBottom: 8 }}
      >
        <Button
          mode="contained"
          onPress={() => handleDecision(item.id, 'admitted')}
          contentStyle={styles.actionBtnContent}
          labelStyle={[
            styles.actionBtnLabel,
            { color: '#fff', fontFamily: fonts.titleMedium.fontFamily },
          ]}
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
        >
          Admitir
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleDecision(item.id, 'rejected')}
          contentStyle={styles.actionBtnContent}
          labelStyle={[
            styles.actionBtnLabel,
            { color: colors.primary, fontFamily: fonts.titleMedium.fontFamily },
          ]}
          style={[styles.actionBtn, { borderColor: colors.primary, marginLeft: 8 }]}
        >
          Rechazar
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              styles.emptyText,
              { color: colors.placeholder, fontFamily: fonts.bodyMedium.fontFamily },
            ]}
          >
            No hay solicitudes pendientes.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginVertical: 8, borderRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 18 },
  dateText: { fontSize: 14 },
  actionBtn: { borderRadius: 20 },
  actionBtnContent: { height: 36 },
  actionBtnLabel: { fontSize: 14, textTransform: 'none' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16 },
});

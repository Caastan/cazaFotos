import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { db } from '../lib/supabaseClients';
import { AuthContext } from '../contexts/AuthContext';

export default function MyContests() {
  const { user } = useContext(AuthContext);
  const [adminContests, setAdminContests] = useState([]);
  const [participContests, setParticipContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: members, error: memberError } = await db
        .from('miembros')
        .select('concurso_id, rol')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error fetching memberships', memberError);
        setLoading(false);
        return;
      }

      const adminIds = members.filter(m => m.rol === 'admin').map(m => m.concurso_id);
      const partIds  = members.filter(m => m.rol !== 'admin').map(m => m.concurso_id);

      let adminData = [];
      if (adminIds.length) {
        const { data, error } = await db
          .from('concursos')
          .select('*')
          .in('id', adminIds)
          .order('fecha_inicio', { ascending: false });
        if (!error) adminData = data;
      }

      let partData = [];
      if (partIds.length) {
        const { data, error } = await db
          .from('concursos')
          .select('*')
          .in('id', partIds)
          .order('fecha_inicio', { ascending: false });
        if (!error) partData = data;
      }

      setAdminContests(adminData);
      setParticipContests(partData);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  const renderItem = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() =>
        navigation.navigate('ContestDetail', { contest: item })
      }
    >
      <Card.Title title={item.titulo} subtitle={`Tema: ${item.tema}`} />
      <Card.Content>
        <Text>
          Plazo subida: {new Date(item.fecha_fin_subida).toLocaleDateString()}
        </Text>
        <Text>Premios: {item.premios}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {adminContests.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Mis concursos (Admin)</Text>
          <FlatList
            data={adminContests}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </>
      )}
      {participContests.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Concursos en los que participo</Text>
          <FlatList
            data={participContests}
            keyExtractor={i => i.id}
            renderItem={renderItem}
          />
        </>
      )}
      {adminContests.length === 0 && participContests.length === 0 && (
        <View style={styles.empty}>
          <Text>No estás participando en ningún concurso.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, padding: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  card:         { marginBottom: 10 },
  empty:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

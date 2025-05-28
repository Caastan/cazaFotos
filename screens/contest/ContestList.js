import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, FAB, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../lib/supabaseClients';
import { AuthContext } from '../../contexts/AuthContext';

export default function ContestListScreen() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      const { data, error } = await db
        .from('concursos')
        .select('*')
        .order('fecha_inicio', { ascending: false });
      if (!error) setContests(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  const renderItem = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('ContestDetail', { contest: item })}
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
      <FlatList
        data={contests}
        keyExtractor={i => i.id}
        renderItem={renderItem}
      />
      {user && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate('CreateContest')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1 },
  card:      { margin:8 },
  fab:       { position:'absolute', right:20, bottom:20 },
});

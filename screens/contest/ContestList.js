// src/screens/contest/ContestListScreen.js
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, FAB, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';

export default function ContestListScreen() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const fetchContests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('concursos')
        .select('*')
        .order('fecha_fin_subida', { ascending: false });
      if (error) throw error;
      setContests(data);
    } catch (e) {
      console.error('Error fetching contests:', e.message);
    } finally {
      setLoading(false);
    }
  };
  // Refetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchContests();
    }, [])
  );

  // Realtime subscription for new contests using supabase-js v2 realtime API
  useEffect(() => {
    // Create a realtime channel on the 'concursos' table
    const channel = supabase
      .channel('public:concursos')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'concursos' },
        (payload) => {
          setContests((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  const renderItem = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('ContestDetail', { contest: item })}
    >
      <Card.Title title={item.titulo} subtitle={`Tema: ${item.tema}`} />
      <Card.Content>
        <Text>Plazo subida: {new Date(item.fecha_fin_subida).toLocaleString()}</Text>
        <Text>Premios: {item.premios}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={contests}
        keyExtractor={item => item.id}
        renderItem={renderItem}
      />
      {user?.rol === 'admin' && (
        <FAB
          icon="plus"
          onPress={() => navigation.navigate('CreateContest')}
          style={styles.fab}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  card:      { marginVertical: 6 },
  fab:       { position: 'absolute', right: 20, bottom: 20 },
});

import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, FAB, ActivityIndicator, useTheme } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';

export default function ContestListScreen() {
  const { colors, fonts } = useTheme();
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
  // Refetch cuando la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      fetchContests();
    }, [])
  );

  // Suscripción en tiempo real a nuevos concursos (Supabase JS v2)
  useEffect(() => {
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
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('ContestDetail', { contest: item })}
    >
      <Card.Title
        title={item.titulo}
        titleStyle={[
          styles.cardTitle,
          { color: colors.primary, fontFamily: fonts.titleMedium.fontFamily },
        ]}
        subtitle={`Tema: ${item.tema}`}
        subtitleStyle={{
          color: colors.placeholder,
          fontFamily: fonts.bodyMedium.fontFamily,
        }}
      />
      <Card.Content style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
        <Text
          style={[
            styles.infoText,
            { color: colors.text, fontFamily: fonts.bodyMedium.fontFamily },
          ]}
        >
          Plazo subida: {new Date(item.fecha_fin_subida).toLocaleString()}
        </Text>
        <Text
          style={[
            styles.infoText,
            { color: colors.text, fontFamily: fonts.bodyMedium.fontFamily },
          ]}
        >
          Premios: {item.premios}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={contests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
      {user?.rol === 'admin' && (
        <FAB
          icon="plus"
          onPress={() => navigation.navigate('CreateContest')}
          style={[styles.fab, { backgroundColor: colors.primary }]}
          color="#fff"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  card: { marginVertical: 6, borderRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 20 },
  infoText: { fontSize: 14, marginVertical: 2 },
  fab: { position: 'absolute', right: 20, bottom: 20, borderRadius: 28, elevation: 4 },
});

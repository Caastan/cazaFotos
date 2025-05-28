import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../config/supabase';

export default function ContestStatsScreen({ route }) {
  const { contestId } = route.params;
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const [{ count: participantsCount }, { data: topPhotos }] = await Promise.all([
        supabase
          .from('participation_requests')
          .select('*', { count: 'exact', head: true })
          .eq('concurso_id', contestId)
          .eq('status', 'admitted'),
        supabase
          .from('fotos')
          .select('id, ruta, votos')
          .eq('concurso_id', contestId)
          .eq('status', 'admitted')
          .order('votos', { ascending: false })
          .limit(5)
      ]);
      setStats({ participantsCount, topPhotos });
    })();
  }, []);

  if (!stats) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <Text>Participantes admitidos: {stats.participantsCount}</Text>
      <Text style={styles.subTitle}>Top Fotos:</Text>
      {stats.topPhotos.map(photo => (
        <Text key={photo.id}>• {photo.ruta} ({photo.votos} votos)</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  subTitle: { marginTop: 16, fontWeight: 'bold' },
});
import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { supabase } from '../config/supabase';

export default function AllGalleriesScreen({ route }) {
  const { contestId } = route.params;
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('fotos')
        .select('*')
        .eq('concurso_id', contestId)
        .eq('status', 'admitted');
      if (error) return console.error(error.message);
      setPhotos(data);
    })();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.photoContainer}>
      <Image source={{ uri: item.ruta }} style={styles.photo} />
      <Text>Votos: {item.votos}</Text>
    </View>
  );

  return (
    <FlatList
      data={photos}
      keyExtractor={i => i.id}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
      ListEmptyComponent={<Text>No hay fotos admitidas.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 10 },
  photoContainer: { marginBottom: 20, alignItems: 'center' },
  photo: { width: 200, height: 200, borderRadius: 10 },
});

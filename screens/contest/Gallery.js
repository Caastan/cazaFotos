import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../../config/supabase';

export default function GalleryScreen() {
  const { params:{ contestId } } = useRoute();
  const [photos, setPhotos]      = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('fotos')
        .select('*')
        .eq('concurso_id', contestId);
      setPhotos(data);
    })();
  }, [contestId]);

  const renderItem = ({ item }) => (
    <View style={styles.photoContainer}>
      <Image source={{ uri: item.url }} style={styles.photo} />
      <Text>Votos: {item.votos}</Text>
    </View>
  );

  return (
    <FlatList
      data={photos}
      keyExtractor={i=>i.id}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container:{ padding:10 },
  photoContainer:{ marginBottom:20, alignItems:'center' },
  photo:{ width:200, height:200, borderRadius:10 },
});

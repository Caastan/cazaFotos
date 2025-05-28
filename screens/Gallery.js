// src/screens/Gallery.js
import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, StyleSheet, Button } from 'react-native';
import { Text } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { db } from '../lib/supabaseClients';

export default function GalleryScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const contestId = route.params?.contestId;  // ahora opcional
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (!contestId) return; 
    (async () => {
      const { data, error } = await db
        .from('fotos')
        .select('*')
        .eq('concurso_id', contestId);
      if (!error) setPhotos(data);
    })();
  }, [contestId]);

  // Si no hay contestId, mostramos un mensaje y botón para ir a concursos
  if (!contestId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No hay concurso seleccionado. Ve a Inicio y elige un concurso para ver su galería.
        </Text>
        <Button
          title="Ir a Concursos"
          onPress={() => navigation.navigate('Home', { screen: 'ContestList' })}
        />
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.photoContainer}>
      <Image source={{ uri: item.url }} style={styles.photo} />
      <Text>Votos: {item.votos}</Text>
    </View>
  );

  return (
    <FlatList
      data={photos}
      keyExtractor={i => i.id}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  photoContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  emptyContainer: {
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    padding:20,
  },
  emptyText: {
    marginBottom: 20,
    textAlign: 'center',
  },
});

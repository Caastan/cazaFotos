import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Alert, View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../contexts/AuthContext';
import { db, storage } from '../../lib/supabaseClients';

export default function ContestDetailScreen() {
  const { params:{ contest } } = useRoute();
  const navigation            = useNavigation();
  const { user }              = useContext(AuthContext);
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await db
        .from('miembros')
        .select('*')
        .eq('concurso_id', contest.id)
        .eq('user_id', user.id);
      setAlreadyJoined(data.length > 0);
    })();
  }, [user]);

  const handleJoin = async () => {
    if (!user) return Alert.alert('Inicia sesión para inscribirte');
    const { error } = await db.from('miembros').insert([{
      concurso_id: contest.id,
      user_id:     user.id,
      rol:         'participante',
    }]);
    if (error) return Alert.alert('Error', error.message);
    Alert.alert('Inscrito correctamente');
    setAlreadyJoined(true);
  };

  const handlePickImage = async () => {
    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (canceled) return;
    try {
      const blob = await fetch(assets[0].uri).then(r => r.blob());
      const filename = `${contest.id}/${user.id}_${Date.now()}.jpg`;

      await storage.upload(filename, blob, { upsert: false });
      const { publicUrl } = await storage.getPublicUrl(filename);

      const { error } = await db.from('fotos').insert([{
        concurso_id: contest.id,
        user_id:     user.id,
        ruta:        filename,
        url:         publicUrl,
        votos:       0,
        fecha:       new Date().toISOString(),
      }]);
      if (error) throw error;

      Alert.alert('Foto subida correctamente');
    } catch (e) {
      Alert.alert('Error al subir la foto', e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>{contest.titulo}</Text>
      <Text>{contest.descripcion}</Text>
      <View style={styles.box}>
        <Text>Fecha inicio: {new Date(contest.fecha_inicio).toLocaleDateString()}</Text>
        <Text>Plazo de subida: {new Date(contest.fecha_fin_subida).toLocaleDateString()}</Text>
        <Text>Veredicto: {new Date(contest.fecha_veredicto).toLocaleDateString()}</Text>
        <Text>Premios: {contest.premios}</Text>
        <Text>Tema: {contest.tema}</Text>
      </View>
      {!alreadyJoined && (
        <Button mode="contained" onPress={handleJoin} style={{ marginTop:20 }}>
          ¡Participar!
        </Button>
      )}
      <Button style={{ marginTop:10 }} onPress={()=>navigation.navigate('Gallery',{ contestId: contest.id })}>
        Ver galería
      </Button>
      <Button mode="contained" style={{ marginTop:10 }} onPress={handlePickImage}>
        Subir Foto
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:20 },
  title:    { marginBottom:10 },
  box:      { marginTop:15, backgroundColor:'#eee', padding:10, borderRadius:6 }
});

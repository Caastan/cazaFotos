import React, { useContext, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRoute } from '@react-navigation/native';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db, storage } from '../config/firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';

export default function UploadScreen(){
  const { user } = useContext(AuthContext);
  const { params:{ contestId } } = useRoute();
  const [uploading, setUploading] = useState(false);

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        await subirFoto(result.assets[0].uri, contestId, user.id);
        Alert.alert('Foto subida correctamente');
      } catch (error) {
        Alert.alert('Error al subir la foto', error.message);
      } finally {
        setUploading(false);
      }
    }
  }

  async function subirFoto(uri, contestId, userId) {
    // 1) convertir URI a blob
    const blob = await (await fetch(uri)).blob();
    // 2) ruta en Storage
    const path = `fotos/${contestId}_${userId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, path);
    // 3) subir
    await uploadBytes(storageRef, blob);
    // 4) obtener URL pública
    const url = await getDownloadURL(storageRef);
    // 5) guardar metadata en Firestore
    await addDoc(
      collection(db, 'concursos', contestId, 'fotos'),
      {
        url,
        userId,
        fecha: Timestamp.now(),
        votos: 0
      }
    );
  }

  return(
    <View style={styles.container}>
      {uploading ? <ActivityIndicator/> :
        <Button mode="contained" onPress={handlePickImage}>Seleccionar foto</Button>}
    </View>
  );
}
const styles=StyleSheet.create({container:{flex:1,justifyContent:'center',alignItems:'center'}});
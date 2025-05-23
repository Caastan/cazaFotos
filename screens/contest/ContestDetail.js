import React, { useContext, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { AuthContext } from '../../contexts/AuthContext';
import { db, storage } from '../../config/firebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc, setDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

export default function ContestDetailScreen(){
  const { params:{contest} } = useRoute();
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [alreadyJoined,setAlreadyJoined]=useState(false);

  useEffect(()=>{
  if(!user) return;
  (async()=>{
    const ref = doc(db,'concursos',contest.id,'miembros',user.id);
    const snap = await getDoc(ref);
    setAlreadyJoined(snap.exists());
  })();
},[user]);

  const handleJoin= async ()=>{
    if(!user) return Alert.alert('Inicia sesión para inscribirte');
    try{
       await setDoc(
        doc(db,'concursos',contest.id,'miembros',user.id),
        { rol:'participante', userId:user.id }
        );
      Alert.alert('Inscrito correctamente');
      setAlreadyJoined(true);
    }catch(e){Alert.alert('Error',e.message);}
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      try {
        const uri = result.assets[0].uri;
        const blob = await (await fetch(uri)).blob();
        const path = `fotos/${contest.id}_${user.id}_${Date.now()}.jpg`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        await addDoc(
          collection(db, 'concursos', contest.id, 'fotos'),
          {
            url,
            userId: user.id,
            fecha: Timestamp.now(),
            votos: 0,
          }
        );
        Alert.alert('Foto subida correctamente');
      } catch (error) {
        Alert.alert('Error al subir la foto', error.message);
      }
    }
  };

  return(
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{contest.titulo}</Text>
      <Text>{contest.descripcion}</Text>

      <View style={styles.box}>
        <Text>Fecha inicio: {toDate(contest.fechaInicio)}</Text>
        <Text>Plazo de subida: {toDate(contest.fechaFinSubida)}</Text>
        <Text>Veredicto: {toDate(contest.fechaVeredicto)}</Text>
        <Text>Premios: {contest.premios}</Text>
        <Text>Tema: {contest.tema}</Text>
      </View>

      {!alreadyJoined && (
        <Button mode="contained" onPress={handleJoin} style={{marginTop:20}}>
          ¡Participar!
        </Button>
      )}

      <Button
        style={{marginTop:10}}
        onPress={()=>navigation.navigate('Gallery',{contestId:contest.id})}>
        Ver galería
      </Button>

      <Button
        mode="contained"
        style={{ marginTop: 10 }}
        onPress={handlePickImage}
      >
        Subir Foto
      </Button>
    </ScrollView>
  );
}
const toDate = ts => new Date(ts.seconds*1000).toLocaleDateString();
const styles=StyleSheet.create({
  container:{padding:20}, title:{fontSize:24,fontWeight:'bold',marginBottom:10},
  box:{marginTop:15,backgroundColor:'#eee',padding:10,borderRadius:6}
});
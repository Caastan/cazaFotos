import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, Button, ActivityIndicator, FAB } from 'react-native-paper';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../contexts/AuthContext';

export default function ContestListScreen(){
  const [contests,setContests]=useState([]);
  const [loading,setLoading]=useState(true);
  const navigation=useNavigation();
  const { user } = useContext(AuthContext);

  useEffect(()=>{
    (async()=>{
      const snap = await getDocs(query(collection(db,'concursos'), orderBy('fechaInicio','desc')));
      const arr  = snap.docs.map(d=>({ id:d.id, ...d.data() }));
      setContests(arr);
      setLoading(false);
    })();
  },[]);

  if(loading) return <ActivityIndicator style={{marginTop:40}}/>;

  return(
    <View style={styles.container}>
      <FlatList
        data={contests}
        keyExtractor={i=>i.id}
        renderItem={({item})=>(
          <Card style={styles.card} onPress={()=>navigation.navigate('ContestDetail',{contest:item})}>
            <Card.Title title={item.titulo} subtitle={`Tema: ${item.tema}`}/>
            <Card.Content>
              <Text>Plazo de subida: {new Date(item.fechaFinSubida.seconds*1000).toLocaleDateString()}</Text>
              <Text>Premios: {item.premios}</Text>
            </Card.Content>
          </Card>
        )}
      />
      {user && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={()=>navigation.navigate('CreateContest')}
        />
      )}
    </View>
  );
}
const styles=StyleSheet.create({
  container:{flex:1},
  card:{margin:8},
  fab:{position:'absolute',right:20,bottom:20}
});
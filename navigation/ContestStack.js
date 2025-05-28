import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ContestListScreen    from '../screens/contest/ContestList';
import ContestDetailScreen  from '../screens/contest/ContestDetail';
import CreateContestScreen  from '../screens/contest/CreateContest';
import ParticipationRequestsScreen from '../screens/request/ParticipationRequests';
import PhotoRequestsScreen         from '../screens/request/PhotoRequests';
import AllGalleriesScreen          from '../screens/AllGalleries';
import ContestStatsScreen          from '../screens/contest/ContestStats';
import ContestSettingsScreen       from '../screens/contest/ContestSettings';


const Stack = createStackNavigator();
export default function ContestStack(){
  return(
    <Stack.Navigator screenOptions={{headerShown:true}}>
      <Stack.Screen name="ContestList"   component={ContestListScreen}  options={{title:'Concursos'}}/>
      <Stack.Screen name="ContestDetail" component={ContestDetailScreen} options={{title:'Detalle'}}/>
      <Stack.Screen name="CreateContest" component={CreateContestScreen} options={{title:'Crear concurso'}}/>
      <Stack.Screen name="ParticipationRequests" component={ParticipationRequestsScreen} options={{title:'Solicitudes'}}/>
      <Stack.Screen name="PhotoRequests" component={PhotoRequestsScreen}         options={{title:'Solicitudes Fotos'}}/>
      <Stack.Screen name="AllGalleries" component={AllGalleriesScreen}          options={{title:'Galería completa'}}/>
      <Stack.Screen name="ContestStats" component={ContestStatsScreen}          options={{title:'Estadísticas'}}/>
      <Stack.Screen name="ContestSettings" component={ContestSettingsScreen}       options={{title:'Configuración'}}/>
    </Stack.Navigator>
  );
}
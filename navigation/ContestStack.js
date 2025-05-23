import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ContestListScreen    from '../screens/contest/ContestList';
import ContestDetailScreen  from '../screens/contest/ContestDetail';
import CreateContestScreen  from '../screens/contest/CreateContest';

const Stack = createStackNavigator();
export default function ContestStack(){
  return(
    <Stack.Navigator screenOptions={{headerShown:true}}>
      <Stack.Screen name="ContestList"   component={ContestListScreen}  options={{title:'Concursos'}}/>
      <Stack.Screen name="ContestDetail" component={ContestDetailScreen} options={{title:'Detalle'}}/>
      <Stack.Screen name="CreateContest" component={CreateContestScreen} options={{title:'Crear concurso'}}/>
    </Stack.Navigator>
  );
}
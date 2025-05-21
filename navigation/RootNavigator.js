import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/AuthContext';

import AuthStack from './stacks/AuthStack';     // Login, Register, Forgot
import MainTabs  from './BottomTabNavigator';   // Home, Gallery…

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown:false }}>
      {user
        ? <Stack.Screen name="Main" component={MainTabs}/>
        : <Stack.Screen name="Auth" component={AuthStack}/>
      }
    </Stack.Navigator>
  );
}
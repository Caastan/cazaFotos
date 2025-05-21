import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen         from '../../screens/Auth/Login';
import RegisterScreen      from '../../screens/Auth/Register';
import ForgotPasswordScreen from '../../screens/Auth/ForgotPassword';


const Stack = createStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown:true }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title:'Iniciar Sesión' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title:'Registro' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title:'Restablecer contraseña' }}
      />
    </Stack.Navigator>
  );
}
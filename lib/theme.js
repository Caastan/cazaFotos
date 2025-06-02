// lib/theme.js

import { DefaultTheme, configureFonts } from 'react-native-paper';

// 1) Definimos una configuración de fonts que use Poppins en todos los variants:
const fontConfig = {
  default: {
    // Para cada variant (headlineLarge, bodyMedium, bodySmall, labelSmall, etc.)
    displayLarge:   { fontFamily: 'Poppins_600SemiBold', fontWeight: '600' },
    displayMedium:  { fontFamily: 'Poppins_500Medium',    fontWeight: '500' },
    displaySmall:   { fontFamily: 'Poppins_500Medium',    fontWeight: '500' },
    headlineLarge:  { fontFamily: 'Poppins_500Medium',    fontWeight: '500' },
    headlineMedium: { fontFamily: 'Poppins_500Medium',    fontWeight: '500' },
    headlineSmall:  { fontFamily: 'Poppins_500Medium',    fontWeight: '500' },
    titleLarge:     { fontFamily: 'Poppins_500Medium',    fontWeight: '500' },
    titleMedium:    { fontFamily: 'Poppins_500Medium',    fontWeight: '500' },
    titleSmall:     { fontFamily: 'Poppins_500Medium',    fontWeight: '500' },
    labelLarge:     { fontFamily: 'Poppins_500Medium',    fontWeight: '500' },
    labelMedium:    { fontFamily: 'Poppins_500Medium',    fontWeight: '500' },
    labelSmall:     { fontFamily: 'Poppins_500Medium',    fontWeight: '500' },
    bodyLarge:      { fontFamily: 'Poppins_400Regular',   fontWeight: '400' },
    bodyMedium:     { fontFamily: 'Poppins_400Regular',   fontWeight: '400' },
    bodySmall:      { fontFamily: 'Poppins_400Regular',   fontWeight: '400' },
  },
};

// 2) Construimos el tema tomando DefaultTheme y luego reemplazamos colors, roundness y fonts:
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary:    'rgb(240, 60, 50)',   // rojo intenso
    accent:     'rgb(230, 200, 50)',  // naranja-amarillo
    background: '#FFFFFF',
    surface:    '#F7F7F7',
    text:       '#222222',
    placeholder:'#666666',
  },
  roundness: 12,
  fonts: configureFonts(fontConfig),
};

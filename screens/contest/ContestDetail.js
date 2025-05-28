import React, { useEffect, useState, useContext, useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';

export default function ContestDetailScreen() {
  const { params: { contest } } = useRoute();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const [membershipRequest, setMembershipRequest] = useState(null);

  // Add settings icon for admins
  useLayoutEffect(() => {
    if (user?.rol === 'admin') {
      navigation.setOptions({
        headerRight: () => (
          <IconButton
            icon="cog"
            onPress={() => navigation.navigate('ContestSettings', { contestId: contest.id })}
          />
        ),
      });
    }
  }, [navigation, user, contest]);

  // Fetch membership request status for participant
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from('participation_requests')
        .select('status')
        .eq('concurso_id', contest.id)
        .eq('user_id', user.id)
        .single();
      if (!error) setMembershipRequest(data?.status || null);
    })();
  }, [user, contest.id]);

  const handleRequestParticipation = async () => {
    try {
      const { error } = await supabase
        .from('participation_requests')
        .insert([{ concurso_id: contest.id, user_id: user.id }]);
      if (error) throw error;
      setMembershipRequest('pending');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería');
    }
    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (canceled) return;
    try {
      const { uri } = assets[0];
      const filename = `${contest.id}/${user.id}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase
        .storage
        .from('photos')
        .upload(filename, await fetch(uri).then(r => r.blob()));
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = await supabase
        .storage
        .from('photos')
        .getPublicUrl(filename);
      const { error } = await supabase
        .from('photo_requests')
        .insert([{ concurso_id: contest.id, user_id: user.id, url: publicUrl, status: 'pending' }]);
      if (error) throw error;
      Alert.alert('Foto enviada', 'Tu foto está pendiente de revisión.');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  if (!user) return null;

  // Admin view
  if (user.rol === 'admin') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{contest.titulo}</Text>
        <Text style={styles.detail}>Descripción: {contest.descripcion}</Text>
        <Text style={styles.detail}>Tema: {contest.tema}</Text>
        <Text style={styles.detail}>Premios: {contest.premios}</Text>
        <Text style={styles.detail}>
          Plazo subida: {new Date(contest.fecha_fin_subida).toLocaleString()}
        </Text>
        <Text style={styles.detail}>
          Fecha veredicto: {new Date(contest.fecha_veredicto).toLocaleDateString()}
        </Text>
        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('ParticipationRequests', { contestId: contest.id })}
            style={styles.button}
          >
            Ver Solicitudes
          </Button>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('PhotoRequests', { contestId: contest.id })}
            style={styles.button}
          >
            Solicitudes de Fotos
          </Button>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AllGalleries', { contestId: contest.id })}
            style={styles.button}
          >
            Ver Galerías
          </Button>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('ContestStats', { contestId: contest.id })}
            style={styles.button}
          >
            Ver Estadísticas
          </Button>
        </View>
      </ScrollView>
    );
  }

  // Participant view
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{contest.titulo}</Text>
      <Text style={styles.detail}>Descripción: {contest.descripcion}</Text>
      <View style={styles.buttonRow}>
        {membershipRequest === null && (
          <Button
            mode="contained"
            onPress={handleRequestParticipation}
            style={styles.button}
          >
            ¡Participar!
          </Button>
        )}
        {membershipRequest === 'pending' && (
          <Text style={styles.status}>Solicitud pendiente...</Text>
        )}
        {membershipRequest === 'rejected' && (
          <Text style={styles.status}>Solicitud rechazada</Text>
        )}
        {membershipRequest === 'admitted' && (
          <>          
            <Button
              mode="contained"
              onPress={handlePickImage}
              style={styles.button}
            >
              Subir Foto
            </Button>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Gallery', { contestId: contest.id })}
              style={styles.button}
            >
              Ver Galería
            </Button>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title:     { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  detail:    { marginBottom: 6 },
  buttonRow: { marginTop: 20 },
  button:    { marginBottom: 12 },
  status:    { marginVertical: 12, fontSize: 16, textAlign: 'center' },
});

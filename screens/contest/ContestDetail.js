import React, { useEffect, useState, useContext, useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, Button, IconButton, ProgressBar } from 'react-native-paper'; // <-- import ProgressBar
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system'; // <-- import FileSystem
import { supabase } from '../../config/supabase';
import { storage, db } from '../../lib/supabaseClients';
import Constants from 'expo-constants';
import { AuthContext } from '../../contexts/AuthContext';

export default function ContestDetailScreen() {
  const { params: { contest } } = useRoute();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const [membershipRequest, setMembershipRequest] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    Alert.alert(
      'Sube la foto con 1 MB máximo',
      'Asegúrate de que la foto sea JPG o PNG',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aceptar', onPress: pickImage },
      ]
    );
  };

  const pickImage = async () => {

    // 1) permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso denegado');
    }

    // 2) picker
    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (canceled) return;

    try {
      const uri = assets[0].uri;
      // 2.1) chequear tamaño y formato
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const sizeInBytes = fileInfo.size || 0;
      const maxSize = 1 * 1024 * 1024; 
      if (sizeInBytes > maxSize) {
        return Alert.alert(
          'Archivo demasiado grande',
          'El archivo no puede pesar más de 1 MB'
        );
      }
      const ext = uri.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png'].includes(ext)) {
        return Alert.alert(
          'Formato no soportado',
          'El archivo debe ser JPG o PNG'
        );
      }

      // 3) nombre + subir al bucket
      const filename = `${contest.id}/${user.id}_${Date.now()}.jpg`;
      // Construimos el FormData sin usar blob()
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: 'image/jpeg' });

      // reset estados
      setUploading(true);
      setUploadProgress(0);

      // Hacemos la subida con XHR para progreso
      const url = `${Constants.expoConfig.extra.SUPABASE_URL}/storage/v1/object/photos/${encodeURIComponent(filename)}`;
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.setRequestHeader('apikey', Constants.expoConfig.extra.SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Authorization', `Bearer ${Constants.expoConfig.extra.SUPABASE_ANON_KEY}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress((event.loaded / event.total) / 2);
        }
      };

      xhr.onload = async () => {
        setUploading(false);
        console.log('Respuesta de subida:', xhr.status, xhr.status === 200);
        if (xhr.status !== 200) {
          const err = xhr.responseText;
          Alert.alert('Error al subir la foto', `Código: ${xhr.status}\n${err}`);
          return;
        }

        try {
          // 4) URL pública
          const { data: { publicUrl }, error: urlError } = await storage
            .from('photos')
            .getPublicUrl(filename);
          if (urlError) throw urlError;

          // 5) INSERT en photo_requests (política en la BD)
          const payload = {
            concurso_id: contest.id,
            user_id: user.id,
            ruta: filename,
            url: publicUrl,
          };
          const { error: prError } = await supabase
            .from('photo_requests')
            .insert([payload]);

          if (prError) {
            return Alert.alert('Error al registrar foto', prError.message);
          }

          Alert.alert('Foto pendiente de revisión');
        } catch (e) {
          Alert.alert('Error al subir la foto', e.message);
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        Alert.alert('Error de red', 'No se pudo conectar para subir la imagen');
      };

      xhr.send(formData);
    } catch (e) {
      setUploading(false);
      Alert.alert('Error al subir la foto', e.message);
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
              disabled={uploading}
            >
              Subir Foto
            </Button>

            {/* ProgressBar mientras sube */}
            {uploading && (
              <View style={styles.progressContainer}>
                <ProgressBar progress={uploadProgress} style={{ marginVertical: 8 }} />
                <Text>{Math.round(uploadProgress * 100)}%</Text>
              </View>
            )}

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
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  detail: { marginBottom: 6 },
  buttonRow: { marginTop: 20 },
  button: { marginBottom: 12 },
  status: { marginVertical: 12, fontSize: 16, textAlign: 'center' },
  progressContainer: {
    marginHorizontal: 20,
    alignItems: 'center',
  },
});

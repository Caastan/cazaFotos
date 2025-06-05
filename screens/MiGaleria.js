import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../lib/supabaseClients';
import Constants from 'expo-constants';
import { TEXTO_INSTRUCCIONES_SUBIDA_ALERT } from '../utils/constantes';

export default function MiGaleria() {
  const { user } = useAuth();
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchMisFotos = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('fotos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFotos(data || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar tus fotos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMisFotos();
  }, []);

  const handlePickImage = async () => {
       Alert.alert(
         "Instrucciones de subida",
         TEXTO_INSTRUCCIONES_SUBIDA_ALERT,
         [
           { text: "OK", onPress: () => pickImage() }  
         ]
       );
  }
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería');
    }

    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (canceled) return;

    setUploading(true);
    try {
      const { uri } = assets[0];
      const filename = `${user.id}_${Date.now()}.jpg`;

      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: 'image/jpeg' });

      const res = await fetch(
        `${Constants.expoConfig.extra.SUPABASE_URL}/storage/v1/object/photos/${filename}`,
        {
          method: 'POST',
          headers: {
            apikey: Constants.expoConfig.extra.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${Constants.expoConfig.extra.SUPABASE_ANON_KEY}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Error en subida: ${res.status} ${err}`);
      }

      const { data: { publicUrl }, error: urlError } = await storage
        .from('photos')
        .getPublicUrl(filename);
      if (urlError) throw urlError;

      const { error: insertError } = await db
        .from('fotos')
        .insert([{ url: publicUrl, usuario_id: user.id }]);
      if (insertError) throw insertError;

      Alert.alert('Foto subida', 'Tu foto se ha subido correctamente.');
      fetchMisFotos();
    } catch (e) {
      Alert.alert('Error al subir la foto', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEliminar = async (foto) => {
    try {
      await db.from('fotos').delete().eq('id', foto.id);

      const prefix = `${Constants.expoConfig.extra.SUPABASE_URL}/storage/v1/object/public/photos/`;
      const filePath = foto.url.replace(prefix, '');

      if (filePath) {
        const { error: removeError } = await supabase.storage.from('photos').remove([filePath]);
        if (removeError) {
          console.log('Error al remover archivo de Storage:', removeError);
        }
      }

      Alert.alert('Foto eliminada');
      fetchMisFotos();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la foto.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.status}>Estado: {item.status}</Text>
        <Text style={styles.votes}>❤️ {item.votes_count || 0}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleEliminar(item)}
        >
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.page}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={fotos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tienes fotos subidas.</Text>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.uploadButton, uploading && { opacity: 0.6 }]}
        onPress={handlePickImage}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>Subir Foto</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  uploadButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 24,
  },
  card: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 220,
  },
  infoContainer: {
    padding: 14,
  },
  status: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  votes: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

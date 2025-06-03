// screens/MiGaleria.js
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

export default function MiGaleria() {
  const { user } = useAuth();
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // 1) Carga las fotos del usuario
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
      console.log('Error fetching mis fotos:', error);
      Alert.alert('Error', 'No se pudieron cargar tus fotos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMisFotos();
  }, []);

  // 2) Función para seleccionar imagen y subirla (adaptada a nueva API de ImagePicker)
    const pickImage = async () => {
    // 1) permisos
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería');
    }

    // 2) picker
    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:   ImagePicker.MediaTypeOptions.Images,
      allowsEditing:true,
      quality:      0.8,
    });
    if (canceled) return;

    setUploading(true);
    try {
      const { uri } = assets[0];
      const filename = `${user.id}_${Date.now()}.jpg`;

      // Construimos el FormData sin usar blob()
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: 'image/jpeg' });
      console.log(formData.get('file'));

      // Hacemos el POST directamente al endpoint de Storage
      const res = await fetch(
        `${Constants.expoConfig.extra.SUPABASE_URL}/storage/v1/object/photos/${filename}`,
        {
          method: 'POST',
          headers: {
            apikey:        Constants.expoConfig.extra.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${Constants.expoConfig.extra.SUPABASE_ANON_KEY}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );
      console.log('Respuesta de subida:', res.status, res.ok);

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Error en subida: ${res.status} ${err}`);
      }

      // Obtenemos la URL pública con el cliente ligero
      const { data: { publicUrl }, error: urlError } = await storage
        .from('photos')
        .getPublicUrl(filename);
      if (urlError) throw urlError;
      console.log('URL pública obtenida:', publicUrl);

      
      // Insertamos la foto en la base de datos
      const { error: insertError } = await db
        .from('fotos')
        .insert([{ url: publicUrl, usuario_id: user.id }]);
      if (insertError) throw insertError;
      console.log('Foto subida correctamente:', publicUrl);

      Alert.alert('Foto subida', 'Tu foto se ha subido correctamente.');
    } catch (e) {
      Alert.alert('Error al subir la foto', e.message);
    } finally {
      setUploading(false);
    }
  };

  // 3) Función para eliminar foto
  const handleEliminar = async (foto) => {
    try {
      await db.from('fotos').delete().eq('id', foto.id);

      const prefix = `${Constants.expoConfig.extra.SUPABASE_URL}/storage/v1/object/public/photos/`;
      const filePath = foto.url.replace(prefix, '');
      console.log('Eliminando en Storage:', filePath);
      if (filePath) {
        const { error: removeError } = await supabase.storage.from('photos').remove([filePath]);
        if (removeError) {
          console.log('Error al remover archivo de Storage:', removeError);
        }
      }

      Alert.alert('Foto eliminada');
      fetchMisFotos();
    } catch (error) {
      console.log('Error eliminando foto:', error);
      Alert.alert('Error al eliminar', 'No se pudo eliminar la foto.');
    }
  };

  // 4) Renderizado
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.votesText}>Votos: {item.votes_count}</Text>
        <Text style={styles.statusText}>Estado: {item.status}</Text>
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
    <View style={styles.container}>
      {/* Botón para subir foto */}
      <TouchableOpacity
        style={[styles.uploadButton, uploading && { opacity: 0.7 }]}
        onPress={pickImage}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>Subir Foto</Text>
        )}
      </TouchableOpacity>

      {/* Lista de fotos */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  uploadButton: {
    backgroundColor: '#34c759',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 12,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 200,
  },
  infoContainer: {
    padding: 12,
  },
  votesText: {
    fontSize: 16,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

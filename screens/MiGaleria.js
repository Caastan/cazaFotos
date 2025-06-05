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
  const { user } = useAuth();              // Obtiene el usuario autenticado desde el contexto
  const [fotos, setFotos] = useState([]);   // Almacena las fotos propias del usuario
  const [loading, setLoading] = useState(true);    // Controla el indicador de carga al inicializar y actualizar lista
  const [uploading, setUploading] = useState(false); // Controla el estado de subida de imagen

  /**
   * 1) fetchMisFotos: obtiene todas las fotos del usuario desde la tabla "fotos"
   *    - Filtra por usuario_id igual al id del usuario autenticado
   *    - Ordena por fecha de creación descendente (más recientes primero)
   *    - Actualiza estado local con datos o muestra alerta en caso de error
   */
  const fetchMisFotos = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('fotos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFotos(data || []);  // Si no hay datos, se asigna array vacío
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar tus fotos.');
    } finally {
      setLoading(false);
    }
  };

  // Al montar el componente, llamamos a fetchMisFotos() una sola vez
  useEffect(() => {
    fetchMisFotos();
  }, []);

  /**
   * 2) handlePickImage: controla el flujo de validación de límite y muestra instrucciones
   *    - Cuenta cuántas fotos ha subido el usuario (sin importar estado)
   *    - Si ya son 5 o más, muestra alerta y retorna sin abrir picker
   *    - Si hay menos de 5, muestra una alerta con instrucciones y luego invoca pickImage()
   */
  const handlePickImage = async () => {
    try {
      // 2.1) Contar cuántas fotos ha subido el usuario en total
      const { count, error: countError } = await db
        .from('fotos')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', user.id);

      if (countError) {
        console.log('Error contando fotos existentes:', countError);
        // Permitimos continuar el flujo a pesar del error de conteo
      } else if (count >= 5) {
        // Si ya alcanzó el límite, mostramos alerta y retornamos
        Alert.alert(
          'Límite alcanzado',
          'Solo puedes subir un máximo de 5 fotos.'
        );
        return;
      }
    } catch (err) {
      console.log('Excepción al contar fotos:', err);
      // Bloqueamos la subida si no podemos verificar el número de fotos por seguridad
      Alert.alert(
        'Error',
        'No se pudo verificar cuántas fotos has subido. Intenta más tarde.'
      );
      return;
    }

    // 2.2) Si el usuario tiene menos de 5 fotos, mostramos instrucciones antes de abrir el picker
    Alert.alert(
      'Instrucciones de subida',
      TEXTO_INSTRUCCIONES_SUBIDA_ALERT,
      [{ text: 'OK', onPress: () => pickImage() }]
    );
  };

  /**
   * 3) pickImage: abre el selector de imágenes del dispositivo y gestiona la subida
   *    - Solicita permisos para acceder a la galería
   *    - Lanza el picker de imágenes permitiendo edición y calidad 0.8
   *    - Si el usuario selecciona una imagen, construye FormData y la sube directamente vía fetch
   *      al endpoint de Supabase Storage
   *    - Luego obtiene la URL pública con storage.getPublicUrl(...)
   *    - Inserta un registro en la tabla "fotos" con la URL y el id del usuario
   *    - Muestra alertas de éxito o error y vuelve a recargar la lista
   */
  const pickImage = async () => {
    // 3.1) Pedir permiso de acceso a la galería
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería');
    }

    // 3.2) Abrir el picker de imágenes
    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (canceled) return;  // Si el usuario cancela, salimos

    setUploading(true);
    try {
      // 3.3) Obtener URI y generar un nombre de archivo único
      const { uri } = assets[0];
      const filename = `${user.id}_${Date.now()}.jpg`;

      // 3.4) Construir FormData para subir vía fetch
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: 'image/jpeg' });

      // 3.5) Realizar petición POST al endpoint de Storage de Supabase
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

      // 3.6) Verificar respuesta del servidor
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Error en subida: ${res.status} ${err}`);
      }

      // 3.7) Obtener la URL pública del archivo subido
      const { data: { publicUrl }, error: urlError } = await storage
        .from('photos')
        .getPublicUrl(filename);
      if (urlError) throw urlError;

      // 3.8) Insertar registro en la tabla "fotos" con la URL pública y el usuario
      const { error: insertError } = await db
        .from('fotos')
        .insert([{ url: publicUrl, usuario_id: user.id }]);
      if (insertError) throw insertError;

      Alert.alert('Foto subida', 'Tu foto se ha subido correctamente.');
      fetchMisFotos();  // Volver a cargar la lista de fotos propias
    } catch (e) {
      Alert.alert('Error al subir la foto', e.message);
    } finally {
      setUploading(false);
    }
  };

  /**
   * 4) handleEliminar: elimina una foto tanto de la tabla "fotos" como del bucket de Storage
   *    - Recibe el objeto foto (contiene id y url pública)
   *    - Elimina la fila de la tabla "fotos"
   *    - Construye el path relativo a partir de la URL pública para borrar el archivo en Storage
   *    - Muestra alerta de confirmación o error y recarga la lista
   */
  const handleEliminar = async (foto) => {
    try {
      // 4.1) Eliminar registro de la tabla "fotos"
      await db.from('fotos').delete().eq('id', foto.id);

      // 4.2) Extraer path en el bucket a partir de la URL pública
      const prefix = `${Constants.expoConfig.extra.SUPABASE_URL}/storage/v1/object/public/photos/`;
      const filePath = foto.url.replace(prefix, '');

      if (filePath) {
        // 4.3) Eliminar el archivo del bucket "photos"
        const { error: removeError } = await supabase.storage.from('photos').remove([filePath]);
        if (removeError) {
          console.log('Error al remover archivo de Storage:', removeError);
        }
      }

      Alert.alert('Foto eliminada');
      fetchMisFotos();  // Recargar la lista después de eliminar
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la foto.');
    }
  };

  /**
   * 5) formatterStatus: convierte el estado interno de la foto ('pending', 'approved', 'rejected')
   *    en un texto legible para mostrar al usuario.
   */
  const formatterStatus = (name) => {
    switch (name) {
      case 'pending':
        return 'Pendiente de aprobación';
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      default:
        return ''; // Por seguridad, en caso de un estado no contemplado
    }
  };

  /**
   * 6) renderItem: renderiza cada tarjeta de la galería propia
   *    - Muestra la imagen, estado formateado y número de votos
   *    - Incluye botón para eliminar la foto
   */
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.status}>Estado: {formatterStatus(item.status)}</Text>
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
        // 7) Mientras se cargan las fotos propias, se muestra un ActivityIndicator
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        // 8) Si no hay carga, renderizamos FlatList con las fotos
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

      {/**
        * 9) Botón flotante para subir una nueva foto:
        *    - Deshabilitado y semitransparente mientras uploading=true
        *    - Al presionarlo, invoca handlePickImage() para iniciar proceso
        */}
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
    backgroundColor: '#f8fafc', // Fondo claro para la pantalla
    padding: 16,
  },
  uploadButton: {
    backgroundColor: '#22c55e',   // Botón verde para acción principal
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
    paddingBottom: 24, // Espacio inferior para que el último elemento no quede pegado al botón
  },
  card: {
    marginTop: 26,
    marginBottom: 20,
    backgroundColor: '#fff',      // Tarjeta blanca para contraste
    borderRadius: 16,
    elevation: 3,
    overflow: 'hidden',
    shadowColor: '#000',          // Sombra suave para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 220,                  // Altura fija para consistencia visual
  },
  infoContainer: {
    padding: 14,
  },
  status: {
    fontSize: 14,
    color: '#4b5563',             // Gris intermedio para texto secundario
    marginBottom: 4,
  },
  votes: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',             // Azul para resaltar cuenta de votos
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#ef4444',   // Rojo para acción destructiva
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
    color: '#9ca3af',             // Gris suave para mensaje vacío
    marginTop: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
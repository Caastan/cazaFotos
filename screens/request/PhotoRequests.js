import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, Image, Alert, StyleSheet } from 'react-native';
import { Card, Button, Text, useTheme } from 'react-native-paper';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';

export default function PhotoRequestsScreen({ route }) {
  const { colors, fonts } = useTheme();
  const { contestId } = route.params;
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('photo_requests')
      .select('id, concurso_id, user_id, ruta, url, status, created_at')
      .eq('concurso_id', contestId)
      .eq('status', 'pending');

    if (error) {
      return Alert.alert('Error al cargar solicitudes', error.message);
    }
    setRequests(data);
  };

  const handleDecision = async (item, decision) => {
    const { id, user_id, ruta, url } = item;

    // 1) Si es admitido, inserta en la tabla `fotos`
    if (decision === 'admitted') {
      const { error: insertError } = await supabase
        .from('fotos')
        .insert([{
          concurso_id: contestId,
          usuario_id: user_id,
          ruta: ruta,
          url: url,
          status: 'admitted',
          created_at: new Date().toISOString(),
        }]);
      if (insertError) {
        return Alert.alert('Error al insertar foto', insertError.message);
      }
    }

    // 2) Actualiza el estado en `photo_requests`
    const { error: updateError } = await supabase
      .from('photo_requests')
      .update({ status: decision })
      .eq('id', id);
    if (updateError) {
      return Alert.alert('Error al actualizar solicitud', updateError.message);
    }

    // 3) Refresca la lista
    fetchRequests();
  };

  const renderItem = ({ item }) => (
    <Card style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.url }} style={styles.image} />
      </View>
      <Card.Content style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
        <Text
          style={[
            styles.userText,
            {
              color: colors.primary,
              fontFamily: fonts.titleMedium.fontFamily,
            },
          ]}
        >
          Subida por: {item.user_id}
        </Text>
        <Text
          style={[
            styles.dateText,
            {
              color: colors.placeholder,
              fontFamily: fonts.bodyMedium.fontFamily,
            },
          ]}
        >
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </Card.Content>
      <Card.Actions
        style={{ justifyContent: 'flex-end', paddingRight: 12, paddingBottom: 12 }}
      >
        <Button
          mode="contained"
          onPress={() => handleDecision(item, 'admitted')}
          contentStyle={styles.actionBtnContent}
          labelStyle={[
            styles.actionBtnLabel,
            { color: '#fff', fontFamily: fonts.titleMedium.fontFamily },
          ]}
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
        >
          Admitir
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleDecision(item, 'rejected')}
          contentStyle={styles.actionBtnContent}
          labelStyle={[
            styles.actionBtnLabel,
            { color: colors.primary, fontFamily: fonts.titleMedium.fontFamily },
          ]}
          style={[styles.actionBtn, { borderColor: colors.primary, marginLeft: 8 }]}
        >
          Rechazar
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              styles.emptyText,
              { color: colors.placeholder, fontFamily: fonts.bodyMedium.fontFamily },
            ]}
          >
            No hay fotos pendientes.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  imageContainer: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  image: {
    width: '100%',
    height: 200,
  },
  userText: {
    fontSize: 16,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
  },
  actionBtn: {
    borderRadius: 20,
  },
  actionBtnContent: {
    height: 36,
  },
  actionBtnLabel: {
    fontSize: 14,
    textTransform: 'none',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

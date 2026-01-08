import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface SpeciesResult {
  scientific_name: string;
  common_name: string;
  description: string;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const uploadController = useRef<AbortController | null>(null);

  const [cameraKey, setCameraKey] = useState(Date.now());
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SpeciesResult | null>(null);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ------------------ TAKE PHOTO ------------------
  const takePhoto = async () => {
    if (!cameraRef.current || loading) return;

    try {
      setLoading(true);
      setResult(null);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
      });

      if (!photo.uri) throw new Error('No photo URI');

      setPhotoUri(photo.uri);
      await uploadPhoto(photo.uri);

      fadeAnim.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err) {
      console.error('Capture error:', err);
      setResult({
        scientific_name: 'Unknown',
        common_name: 'Unknown',
        description: 'Failed to identify species.',
      });
    } finally {
      setLoading(false);
    }
  };

  // ------------------ UPLOAD PHOTO ------------------
  const uploadPhoto = async (uri: string) => {
    if (uploadController.current) {
      uploadController.current.abort();
    }

    uploadController.current = new AbortController();
    const { signal } = uploadController.current;

    const safeUri = `${FileSystem.cacheDirectory}upload_${Date.now()}.jpg`;

    try {
      await FileSystem.copyAsync({ from: uri, to: safeUri });

      const formData = new FormData();
      formData.append('image', {
        uri: safeUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      

      const response = await fetch(
        `${API_BASE_URL}/api/species/identify`,
        {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
            Connection: 'close',
          },
          signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed (${response.status})`);
      }

      const json = await response.json();
      setResult(json);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Upload error:', err);
        throw err;
      }
    } finally {
      uploadController.current = null;
      try {
        await FileSystem.deleteAsync(safeUri, { idempotent: true });
      } catch {}
    }
  };

  // ------------------ RESET ------------------
  const resetCamera = () => {
    fadeAnim.stopAnimation();
    slideAnim.stopAnimation();

    setPhotoUri(null);
    setResult(null);
    setLoading(false);

    fadeAnim.setValue(0);
    slideAnim.setValue(SCREEN_HEIGHT);

    setCameraKey(Date.now());
    cameraRef.current = null;
  };

  // ------------------ FORMAT TEXT ------------------
  const renderFormattedText = (text: string) => {
    const regex = /(<\/?b>|<\/?i>)/g;
    const parts = text.split(regex).filter(Boolean);

    let bold = false;
    let italic = false;

    return (
      <Text style={styles.descriptionText}>
        {parts.map((part, idx) => {
          if (part === '<b>') {
            bold = true;
            return null;
          }
          if (part === '</b>') {
            bold = false;
            return null;
          }
          if (part === '<i>') {
            italic = true;
            return null;
          }
          if (part === '</i>') {
            italic = false;
            return null;
          }
          return (
            <Text
              key={idx}
              style={{
                fontWeight: bold ? 'bold' : 'normal',
                fontStyle: italic ? 'italic' : 'normal',
              }}
            >
              {part}
            </Text>
          );
        })}
      </Text>
    );
  };

  // ------------------ UI ------------------
  return (
    <View style={styles.container}>
      {!photoUri && (
        <CameraView
          key={cameraKey}
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />
      )}

      {photoUri && !loading && (
        <Image source={{ uri: photoUri }} style={styles.camera} />
      )}

      {!result && !loading && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={takePhoto}
          disabled={loading}
        >
          <MaterialIcons name="camera-alt" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Identifying species...</Text>
        </View>
      )}

      {result && (
        <Animated.View
          style={[
            styles.resultWrapper,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.resultCard}>
            <ScrollView>
              <Text style={styles.commonName}>{result.common_name}</Text>
              <Text style={styles.scientificName}>
                {result.scientific_name}
              </Text>
              {renderFormattedText(result.description)}

              <TouchableOpacity
                style={styles.anotherBtn}
                onPress={resetCamera}
              >
                <MaterialIcons name="refresh" size={24} color="#fff" />
                <Text style={styles.anotherBtnText}>
                  Take Another Photo
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ------------------ STYLES ------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: { fontSize: 18, marginBottom: 15 },
  grantBtn: {
    padding: 12,
    backgroundColor: '#2e7d32',
    borderRadius: 10,
  },
  grantBtnText: { color: '#fff', fontWeight: 'bold' },
  camera: { flex: 1, width: '100%', height: '100%' },
  floatingButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#2e7d32',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#fff', fontSize: 18, marginTop: 10 },
  resultWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: SCREEN_HEIGHT * 0.4,
  },
  resultCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  commonName: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2e7d32',
  },
  scientificName: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#555',
    marginBottom: 10,
  },
  descriptionText: { fontSize: 16, lineHeight: 22, color: '#333' },
  anotherBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 15,
    marginTop: 10,
  },
  anotherBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
});

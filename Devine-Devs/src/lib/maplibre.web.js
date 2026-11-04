// Web stand-in for @maplibre/maplibre-react-native, which is native-only.
// The trip panel, stop list and status buttons around the map still work in
// the browser; only the map canvas itself is replaced with a notice.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function Map({ style }) {
  return (
    <View style={[style, styles.box]}>
      <Ionicons name="map-outline" size={40} color="#6B7280" />
      <Text style={styles.title}>Live map is available in the mobile app</Text>
      <Text style={styles.body}>Your stops and trip controls below still work here.</Text>
    </View>
  );
}

const Nothing = () => null;
export const Camera = Nothing;
export const GeoJSONSource = Nothing;
export const Layer = Nothing;
export const Marker = Nothing;

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2EF', padding: 24 },
  title: { marginTop: 12, fontSize: 16, fontWeight: '600', color: '#111827', textAlign: 'center' },
  body: { marginTop: 6, fontSize: 13, color: '#6B7280', textAlign: 'center' },
});

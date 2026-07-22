import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function ProfileAvatar({
  name,
  imageUrl,
  size = 88,
  onPress,
  uploading = false,
  editable = false,
}) {
  const radius = size / 2;

  const content = imageUrl ? (
    <Image source={{ uri: imageUrl }} style={{ width: size, height: size, borderRadius: radius }} />
  ) : (
    <View style={[styles.initialsWrap, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.initials, { fontSize: size * 0.32 }]}>{getInitials(name)}</Text>
    </View>
  );

  const inner = (
    <View style={{ width: size, height: size }}>
      {content}
      {uploading ? (
        <View style={[styles.overlay, { borderRadius: radius }]}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}
      {editable ? (
        <View style={styles.editBadge}>
          <Ionicons name="camera" size={14} color="#fff" />
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} disabled={uploading}>
        {inner}
      </TouchableOpacity>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  initialsWrap: {
    backgroundColor: '#E7F1EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#15643E',
  },
  initials: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#15643E',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#15643E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

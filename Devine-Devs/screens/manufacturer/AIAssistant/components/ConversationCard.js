// screens/manufacturer/AIAssistant/components/ConversationCard.js
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, truncateText } from '../utils/helpers';

const ConversationCard = ({ conversation, onPress, onDelete }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => onPress());
  };

  const confirmDelete = () => {
    Alert.alert('Delete conversation', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  const lastMessage = conversation.messages?.[conversation.messages.length - 1];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        onLongPress={confirmDelete}
        activeOpacity={0.85}
        delayLongPress={400}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#10b981" />
        </View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {conversation.title}
            </Text>
            <Text style={styles.time}>
              {formatDate(conversation.lastModified)}
            </Text>
          </View>
          {lastMessage ? (
            <Text style={styles.preview} numberOfLines={2}>
              {truncateText(lastMessage.text, 90)}
            </Text>
          ) : (
            <Text style={styles.previewEmpty}>No messages yet</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={confirmDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: { flex: 1, paddingRight: 8 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  time: { fontSize: 11, color: '#9CA3AF' },
  preview: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  previewEmpty: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ConversationCard;
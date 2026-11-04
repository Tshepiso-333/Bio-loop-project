// screens/manufacturer/AIAssistant/components/ConversationList.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConversationCard from './ConversationCard';

const ConversationList = ({
  conversations,
  onSelectConversation,
  onDeleteConversation,
  insets,
  isLoading,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    onRefresh?.();
    setTimeout(() => setRefreshing(false), 800);
  }, [onRefresh]);

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="chatbubble-ellipses-outline" size={36} color="#2E8B5A" />
      </View>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptyText}>
        Start a new chat to ask about your inventory, quality, deliveries or
        finances.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading conversations…</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ConversationCard
          conversation={item}
          onPress={() => onSelectConversation(item)}
          onDelete={() => onDeleteConversation(item.id)}
        />
      )}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: insets.bottom + 100 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#2E8B5A"
          colors={['#2E8B5A']}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: { flexGrow: 1, paddingTop: 16 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginBottom: 100,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#122A1F',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7F75',
    textAlign: 'center',
    lineHeight: 19,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: { fontSize: 14, color: '#2E8B5A', fontFamily: 'PlusJakartaSans_600SemiBold' },
});

export default ConversationList;
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';

export default function AdminHomeScreen() {
  const [search, setSearch] = useState('');
  const [newUser, setNewUser] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('restaurant');

  const [restaurantUsers, setRestaurantUsers] = useState([
    { id: '1', name: 'KFC Braamfontein' },
    { id: '2', name: 'Chicken Licken Soweto' },
    { id: '3', name: 'Nandos Sandton' },
  ]);

  const [manufacturerUsers, setManufacturerUsers] = useState([
    { id: '4', name: 'EcoOil Recycling' },
    { id: '5', name: 'GreenFuel Manufacturing' },
    { id: '6', name: 'BioWaste Solutions' },
  ]);

  function addUser() {
    if (!newUser.trim()) return;

    const user = {
      id: Date.now().toString(),
      name: newUser,
    };

    if (selectedGroup === 'restaurant') {
      setRestaurantUsers([...restaurantUsers, user]);
    } else {
      setManufacturerUsers([...manufacturerUsers, user]);
    }

    setNewUser('');
  }

  function deleteUser(id, group) {
    Alert.alert('Delete User', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: () => {
          if (group === 'restaurant') {
            setRestaurantUsers(
              restaurantUsers.filter((user) => user.id !== id)
            );
          } else {
            setManufacturerUsers(
              manufacturerUsers.filter((user) => user.id !== id)
            );
          }
        },
      },
    ]);
  }

  const filteredRestaurants = restaurantUsers.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredManufacturers = manufacturerUsers.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  function renderUser({ item, group }) {
    return (
      <View style={styles.card}>
        <View>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userId}>ID: {item.id}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteUser(item.id, group)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>
      <Text style={styles.subHeader}>Manage all registered users</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search users..."
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.addSection}>
        <TextInput
          style={styles.addInput}
          placeholder="Enter new user"
          placeholderTextColor="#94a3b8"
          value={newUser}
          onChangeText={setNewUser}
        />

        <TouchableOpacity style={styles.addButton} onPress={addUser}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Group Selector */}
      <View style={styles.groupContainer}>
        <TouchableOpacity
          style={[
            styles.groupButton,
            selectedGroup === 'restaurant' && styles.activeGroup,
          ]}
          onPress={() => setSelectedGroup('restaurant')}
        >
          <Text style={styles.groupText}>Restaurant</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.groupButton,
            selectedGroup === 'manufacturer' && styles.activeGroup,
          ]}
          onPress={() => setSelectedGroup('manufacturer')}
        >
          <Text style={styles.groupText}>Manufacturer</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Restaurant Users</Text>
      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderUser({ item, group: 'restaurant' })}
      />

      <Text style={styles.sectionTitle}>Manufacturer Users</Text>
      <FlatList
        data={filteredManufacturers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderUser({ item, group: 'manufacturer' })}
      />
    </SafeAreaView>
  );
}

const GREEN = '#16a34a';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fffb',
    padding: 20,
  },

  header: {
    fontSize: 30,
    fontWeight: 'bold',
    color: GREEN,
  },

  subHeader: {
    color: '#64748b',
    marginBottom: 20,
  },

  searchInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },

  addSection: {
    flexDirection: 'row',
    marginBottom: 15,
  },

  addInput: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginRight: 10,
  },

  addButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 15,
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  groupContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  groupButton: {
    flex: 1,
    padding: 14,
    backgroundColor: 'white',
    borderRadius: 14,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },

  activeGroup: {
    backgroundColor: '#dcfce7',
  },

  groupText: {
    fontWeight: '600',
    color: '#166534',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
    marginVertical: 12,
  },

  card: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 5,
    borderLeftColor: GREEN,
  },

  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
  },

  userId: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },

  deleteButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 10,
  },

  deleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

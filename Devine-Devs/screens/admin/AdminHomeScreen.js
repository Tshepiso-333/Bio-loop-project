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
  Image,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function AdminHomeScreen() {
  const [search, setSearch] = useState('');
  const [newUser, setNewUser] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('restaurant');
  const [activeTab, setActiveTab] = useState('users');

  const [restaurantUsers, setRestaurantUsers] = useState([
    { id: '1', name: 'KFC Braamfontein', email: 'kfc.braamfontein@gmail.com', phone: '+27 11 123 4567', status: 'active', joinDate: '2024-01-15' },
    { id: '2', name: 'Chicken Licken Soweto', email: 'cl.soweto@gmail.com', phone: '+27 11 234 5678', status: 'active', joinDate: '2024-02-10' },
    { id: '3', name: 'Nandos Sandton', email: 'nandos.sandton@gmail.com', phone: '+27 11 345 6789', status: 'inactive', joinDate: '2024-01-22' },
  ]);

  const [manufacturerUsers, setManufacturerUsers] = useState([
    { id: '4', name: 'EcoOil Recycling', email: 'info@ecooil.co.za', phone: '+27 11 456 7890', status: 'active', joinDate: '2024-01-05' },
    { id: '5', name: 'GreenFuel Manufacturing', email: 'contact@greenfuel.co.za', phone: '+27 11 567 8901', status: 'active', joinDate: '2024-01-18' },
    { id: '6', name: 'BioWaste Solutions', email: 'hello@biowaste.co.za', phone: '+27 11 678 9012', status: 'pending', joinDate: '2024-02-20' },
  ]);

  const [drivers, setDrivers] = useState([
    { id: '7', name: 'Thobile Nkosi', email: 'thobile@bioloop.co.za', phone: '+27 71 234 5678', status: 'active', joinDate: '2024-01-10' },
    { id: '8', name: 'Sipho Dlamini', email: 'sipho@bioloop.co.za', phone: '+27 72 345 6789', status: 'active', joinDate: '2024-01-25' },
    { id: '9', name: 'Lerato Molefe', email: 'lerato@bioloop.co.za', phone: '+27 73 456 7890', status: 'inactive', joinDate: '2024-02-01' },
  ]);

  const [systemStats, setSystemStats] = useState({
    totalUsers: 9,
    activeUsers: 7,
    pendingApprovals: 1,
    monthlyGrowth: '+15%',
  });

  function addUser() {
    if (!newUser.trim()) return;

    const user = {
      id: Date.now().toString(),
      name: newUser,
      email: `${newUser.toLowerCase().replace(/\s/g, '')}@bioloop.co.za`,
      phone: '+27 XX XXX XXXX',
      status: 'pending',
      joinDate: new Date().toISOString().split('T')[0],
    };

    if (selectedGroup === 'restaurant') {
      setRestaurantUsers([...restaurantUsers, user]);
    } else if (selectedGroup === 'manufacturer') {
      setManufacturerUsers([...manufacturerUsers, user]);
    } else {
      setDrivers([...drivers, user]);
    }

    setSystemStats({
      ...systemStats,
      totalUsers: systemStats.totalUsers + 1,
      pendingApprovals: systemStats.pendingApprovals + 1,
    });

    setNewUser('');
    Alert.alert('Success', 'User added successfully!');
  }

  function deleteUser(id, group) {
    Alert.alert('Delete User', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (group === 'restaurant') {
            setRestaurantUsers(restaurantUsers.filter((user) => user.id !== id));
          } else if (group === 'manufacturer') {
            setManufacturerUsers(manufacturerUsers.filter((user) => user.id !== id));
          } else {
            setDrivers(drivers.filter((user) => user.id !== id));
          }
          
          setSystemStats({
            ...systemStats,
            totalUsers: systemStats.totalUsers - 1,
          });
          
          Alert.alert('Deleted', 'User has been removed.');
        },
      },
    ]);
  }

  function approveUser(id, group) {
    let updatedUsers;
    if (group === 'restaurant') {
      updatedUsers = restaurantUsers.map(user => 
        user.id === id ? { ...user, status: 'active' } : user
      );
      setRestaurantUsers(updatedUsers);
    } else if (group === 'manufacturer') {
      updatedUsers = manufacturerUsers.map(user => 
        user.id === id ? { ...user, status: 'active' } : user
      );
      setManufacturerUsers(updatedUsers);
    } else {
      updatedUsers = drivers.map(user => 
        user.id === id ? { ...user, status: 'active' } : user
      );
      setDrivers(updatedUsers);
    }
    
    setSystemStats({
      ...systemStats,
      pendingApprovals: systemStats.pendingApprovals - 1,
      activeUsers: systemStats.activeUsers + 1,
    });
    
    Alert.alert('Approved', 'User has been approved.');
  }

  const getCurrentUsers = () => {
    if (selectedGroup === 'restaurant') return restaurantUsers;
    if (selectedGroup === 'manufacturer') return manufacturerUsers;
    return drivers;
  };

  const filteredUsers = getCurrentUsers().filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#10b981';
      case 'inactive': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusBgColor = (status) => {
    switch(status) {
      case 'active': return '#D1FAE5';
      case 'inactive': return '#FEE2E2';
      case 'pending': return '#FEF3C7';
      default: return '#F3F4F6';
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.status) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userPhone}>{item.phone}</Text>
        <Text style={styles.userDate}>Joined: {item.joinDate}</Text>
      </View>
      
      <View style={styles.userActions}>
        {item.status === 'pending' && (
          <TouchableOpacity 
            style={styles.approveButton}
            onPress={() => approveUser(item.id, selectedGroup)}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteUser(item.id, selectedGroup)}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const StatCard = ({ title, value, icon, color }) => (
    <LinearGradient
      colors={[color + '20', color + '10']}
      style={styles.statCard}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </LinearGradient>
  );

  const Header = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image 
                source={require('../../assets/BioLoop_Logo.png')} 
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <View>
              <Text style={styles.appName}>BioLoop</Text>
              <Text style={styles.companyName}>Admin Portal</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileInitial}>AD</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Section */}
        <View style={styles.statsGrid}>
          <StatCard title="Total Users" value={systemStats.totalUsers} icon="people-outline" color="#10b981" />
          <StatCard title="Active Users" value={systemStats.activeUsers} icon="checkmark-circle-outline" color="#10b981" />
          <StatCard title="Pending" value={systemStats.pendingApprovals} icon="time-outline" color="#f59e0b" />
          <StatCard title="Growth" value={systemStats.monthlyGrowth} icon="trending-up-outline" color="#10b981" />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name or email..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Add User Section */}
        <View style={styles.addSection}>
          <TextInput
            style={styles.addInput}
            placeholder="Enter new user name..."
            placeholderTextColor="#9ca3af"
            value={newUser}
            onChangeText={setNewUser}
          />
          <TouchableOpacity style={styles.addButton} onPress={addUser}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addGradient}
            >
              <Ionicons name="add-outline" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* User Type Selector */}
        <View style={styles.groupContainer}>
          <TouchableOpacity
            style={[styles.groupButton, selectedGroup === 'restaurant' && styles.activeGroup]}
            onPress={() => setSelectedGroup('restaurant')}
          >
            <Ionicons 
              name="restaurant-outline" 
              size={20} 
              color={selectedGroup === 'restaurant' ? '#10b981' : '#6b7280'} 
            />
            <Text style={[styles.groupText, selectedGroup === 'restaurant' && styles.activeGroupText]}>
              Restaurants
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.groupButton, selectedGroup === 'manufacturer' && styles.activeGroup]}
            onPress={() => setSelectedGroup('manufacturer')}
          >
            <Ionicons 
              name="business-outline" 
              size={20} 
              color={selectedGroup === 'manufacturer' ? '#10b981' : '#6b7280'} 
            />
            <Text style={[styles.groupText, selectedGroup === 'manufacturer' && styles.activeGroupText]}>
              Manufacturers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.groupButton, selectedGroup === 'driver' && styles.activeGroup]}
            onPress={() => setSelectedGroup('driver')}
          >
            <Ionicons 
              name="car-outline" 
              size={20} 
              color={selectedGroup === 'driver' ? '#10b981' : '#6b7280'} 
            />
            <Text style={[styles.groupText, selectedGroup === 'driver' && styles.activeGroupText]}>
              Drivers
            </Text>
          </TouchableOpacity>
        </View>

        {/* Users List */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>
            {selectedGroup === 'restaurant' ? 'Restaurant Users' : 
             selectedGroup === 'manufacturer' ? 'Manufacturer Users' : 'Driver Users'}
          </Text>
          
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No users found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderUser}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  companyName: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.9,
    marginTop: 1,
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  addSection: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 15,
    color: '#111827',
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  groupContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    gap: 10,
  },
  groupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeGroup: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10b981',
  },
  groupText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeGroupText: {
    color: '#10b981',
  },
  usersSection: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10b981',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  userDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  userActions: {
    justifyContent: 'center',
    gap: 8,
  },
  approveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
  },
});
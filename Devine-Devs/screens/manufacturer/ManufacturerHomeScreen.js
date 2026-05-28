// screens/manufacturer/ManufacturerHomeScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

function ManufacturerHomeScreen({ navigation, route }) {
  const userName = route?.params?.userName || 'Kgopotso';

  const handleGoToDashboard = () => {
    // ✅ FIXED: Navigate to the screen inside the nested ManufacturerStack
    navigation.navigate('ManufacturerDashboardScreen');
  };

  return (
    <ImageBackground
      source={require('../../assets/welcome-page.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome Back,</Text>
              <Text style={styles.userName}>{userName}!</Text>
              <Text style={styles.subtitle}>
                Ready to manage your biodiesel supply chain?
              </Text>
            </View>

            <TouchableOpacity
              style={styles.dashboardButton}
              onPress={handleGoToDashboard}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Go to Dashboard →</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  userName: {
    fontSize: 48,
    fontWeight: '700',
    color: '#7EE92D',
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    lineHeight: 22,
    textAlign: 'center',
  },
  dashboardButton: {
    backgroundColor: '#7EE92D',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#7EE92D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ManufacturerHomeScreen;
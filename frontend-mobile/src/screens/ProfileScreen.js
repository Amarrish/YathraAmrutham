import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen = ({ navigation }) => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigation.navigate('Login');
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.notLoggedIn}>You are not logged in.</Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{user.name?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Details list */}
        <View style={styles.infoCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.val}>{user.phone || 'Not provided'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.val}>{user.address || 'Not provided'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>20% Advance Policy:</Text>
            <Text style={styles.valPolicy}>Non-Refundable</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 20
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  notLoggedIn: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16
  },
  signInBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14
  },
  signInText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14
  },
  avatarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  avatarLetter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a'
  },
  email: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  roleBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0369a1'
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  label: {
    fontSize: 12,
    color: '#64748b'
  },
  val: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b'
  },
  valPolicy: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b45309'
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 13
  }
});

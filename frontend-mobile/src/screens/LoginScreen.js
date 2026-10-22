import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigation.navigate('MainTabs');
    } else {
      Alert.alert('Login Failed', res.message || 'Invalid email or password');
    }
  };

  const handleQuickFill = (role) => {
    if (role === 'admin') {
      setEmail('admin@travel.com');
      setPassword('admin123');
    } else {
      setEmail('john@travel.com');
      setPassword('user123');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>WanderWise Tours</Text>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Enter your account details to access your tours</Text>

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>Forgot Password? (Get OTP)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginBtn}
          disabled={loading}
          onPress={handleLogin}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.loginText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Demo Fast Logins */}
        <View style={styles.demoBox}>
          <Text style={styles.demoLabel}>Demo Quick Logins:</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => handleQuickFill('user')}
            >
              <Text style={styles.demoBtnText}>Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoBtn, styles.demoAdminBtn]}
              onPress={() => handleQuickFill('admin')}
            >
              <Text style={styles.demoAdminBtnText}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4
  },
  brand: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0284c7',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 4
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 20
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#0f172a',
    marginBottom: 12
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16
  },
  forgotText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: 'bold'
  },
  loginBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  loginText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  demoBox: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center'
  },
  demoLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 6
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8
  },
  demoBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155'
  },
  demoAdminBtn: {
    backgroundColor: '#fef3c7'
  },
  demoAdminBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e'
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  },
  footerText: {
    fontSize: 12,
    color: '#64748b'
  },
  signupText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0284c7'
  }
});

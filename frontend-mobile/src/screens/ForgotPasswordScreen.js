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
import api from '../api/client';

export const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1 = Request, 2 = Enter OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your registered email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        if (res.data.devOtp) {
          setDevOtp(res.data.devOtp);
          setOtp(res.data.devOtp); // Auto-fill in dev
        }
        Alert.alert('OTP Sent', 'A 6-digit code has been sent to your email.');
        setStep(2);
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Could not send OTP. Check email.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      Alert.alert('Required', 'Please enter OTP and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Short Password', 'New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email,
        otp: otp.trim(),
        newPassword
      });
      if (res.data.success) {
        Alert.alert(
          'Success! 🎉',
          'Your password has been reset. You can now log in.',
          [
            {
              text: 'Go to Login',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
    } catch (err) {
      Alert.alert(
        'Reset Failed',
        err.response?.data?.message || 'Invalid or expired OTP code.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {step === 1 ? 'Forgot Password' : 'Reset Password'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? 'Enter your email to receive a 6-digit verification OTP'
            : `Enter the 6-digit OTP code sent to ${email}`}
        </Text>

        {devOtp ? (
          <View style={styles.devBanner}>
            <Text style={styles.devText}>
              🔑 Dev OTP: <Text style={styles.bold}>{devOtp}</Text>
            </Text>
          </View>
        ) : null}

        {step === 1 ? (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Registered Email Address"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TouchableOpacity
              style={styles.btn}
              disabled={loading}
              onPress={handleSendOTP}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.btnText}>Send 6-Digit OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="6-Digit OTP"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />

            <TextInput
              style={styles.input}
              placeholder="New Password (min 6 chars)"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={styles.btn}
              disabled={loading}
              onPress={handleResetPassword}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.btnText}>Set New Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStep(1)}
            >
              <Text style={styles.backText}>← Change Email</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>Back to Sign In</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 20
  },
  devBanner: {
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 14
  },
  devText: {
    fontSize: 12,
    color: '#0369a1'
  },
  bold: {
    fontWeight: 'bold',
    fontSize: 14
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
  otpInput: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 4,
    textAlign: 'center'
  },
  btn: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 12
  },
  backText: {
    fontSize: 12,
    color: '#64748b'
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20
  },
  loginText: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: 'bold'
  }
});

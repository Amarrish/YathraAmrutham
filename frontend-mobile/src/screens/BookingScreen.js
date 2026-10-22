import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AdvanceModal } from '../components/AdvanceModal';

export const BookingScreen = ({ route, navigation }) => {
  const { tour } = route.params;
  const { user } = useAuth();

  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const [members, setMembers] = useState([
    {
      name: user?.name || '',
      age: '',
      gender: 'Male',
      isChild: false,
      contact: user?.phone || '',
      address: user?.address || '',
      optionalImage: ''
    }
  ]);

  const [contactDetails, setContactDetails] = useState({
    primaryName: user?.name || '',
    primaryPhone: user?.phone || '',
    primaryEmail: user?.email || '',
    address: user?.address || ''
  });

  const [paymentMethod, setPaymentMethod] = useState('Online'); // 'Online' or 'Offline'
  const [offlineRef, setOfflineRef] = useState('');
  const [offlineMode, setOfflineMode] = useState('UPI');

  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Handle seat stepper
  const handleSeatChange = (count) => {
    const validCount = Math.max(1, Math.min(count, tour?.availableSeats || 6));
    setNumberOfSeats(validCount);

    const updated = [...members];
    if (validCount > updated.length) {
      for (let i = updated.length; i < validCount; i++) {
        updated.push({
          name: '',
          age: '',
          gender: 'Male',
          isChild: false,
          contact: contactDetails.primaryPhone,
          address: contactDetails.address,
          optionalImage: ''
        });
      }
    } else if (validCount < updated.length) {
      updated.splice(validCount);
    }
    setMembers(updated);
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const pricePerPerson = tour?.pricePerPerson || 0;
  const totalAmount = numberOfSeats * pricePerPerson;
  const advanceAmount = Math.round(totalAmount * 0.2); // 20%
  const remainingAmount = totalAmount - advanceAmount;

  const handlePreSubmit = () => {
    // Basic validation
    if (
      !contactDetails.primaryName.trim() ||
      !contactDetails.primaryPhone.trim() ||
      !contactDetails.primaryEmail.trim()
    ) {
      Alert.alert('Required Info', 'Please enter primary contact details.');
      return;
    }

    for (let i = 0; i < members.length; i++) {
      if (!members[i].name.trim() || !members[i].age) {
        Alert.alert('Required Info', `Please enter name and age for Passenger #${i + 1}`);
        return;
      }
    }

    if (paymentMethod === 'Offline' && !offlineRef.trim()) {
      Alert.alert('Offline Ref', 'Please enter UPI / Bank reference number for offline payment.');
      return;
    }

    // Open mandatory non-refundable advance modal
    setShowAdvanceModal(true);
  };

  const handleConfirmBooking = async () => {
    setShowAdvanceModal(false);
    setSubmitting(true);

    try {
      const payload = {
        tourId: tour._id,
        numberOfSeats,
        members: members.map((m) => ({
          name: m.name,
          age: Number(m.age),
          gender: m.gender,
          isChild: Boolean(m.isChild),
          contact: m.contact || contactDetails.primaryPhone,
          address: m.address || contactDetails.address,
          optionalImage: m.optionalImage || ''
        })),
        contactDetails,
        paymentMethod,
        offlinePaymentDetails:
          paymentMethod === 'Offline'
            ? {
                referenceNumber: offlineRef,
                paymentMode: offlineMode,
                notes: 'Mobile app submission',
                submittedAt: new Date()
              }
            : undefined,
        nonRefundableAcknowledged: true
      };

      const res = await api.post('/bookings', payload);

      if (res.data.success) {
        Alert.alert(
          'Booking Submitted!',
          paymentMethod === 'Online'
            ? `Your seats are confirmed! 20% Advance of ₹${advanceAmount.toLocaleString()} paid.`
            : `Booking submitted. Our Admin will verify your offline payment of ₹${advanceAmount.toLocaleString()} shortly.`,
          [
            {
              text: 'View My Bookings',
              onPress: () => navigation.navigate('MyBookings')
            }
          ]
        );
      }
    } catch (err) {
      Alert.alert(
        'Booking Failed',
        err.response?.data?.message || 'Error creating booking. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Title */}
        <Text style={styles.headerTitle}>Reserve Seats</Text>
        <Text style={styles.tourName}>{tour.title}</Text>
        <Text style={styles.vehicleInfo}>
          Vehicle: {tour.vehicleType} • {tour.availableSeats} seats open
        </Text>

        {/* 1. Seat Stepper */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Number of Seats Needed</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handleSeatChange(numberOfSeats - 1)}
            >
              <Text style={styles.stepBtnText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.seatCountText}>{numberOfSeats} Seat(s)</Text>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handleSeatChange(numberOfSeats + 1)}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Member Manifest Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            2. Passenger Details ({members.length})
          </Text>

          {members.map((member, index) => (
            <View key={index} style={styles.memberBox}>
              <View style={styles.memberHeader}>
                <Text style={styles.memberLabel}>Passenger #{index + 1}</Text>
                <TouchableOpacity
                  style={[styles.childChip, member.isChild && styles.childChipActive]}
                  onPress={() => handleMemberChange(index, 'isChild', !member.isChild)}
                >
                  <Text
                    style={[styles.childText, member.isChild && styles.childTextActive]}
                  >
                    {member.isChild ? '✓ Child' : '+ Mark as Child'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor="#94a3b8"
                value={member.name}
                onChangeText={(val) => handleMemberChange(index, 'name', val)}
              />

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Age *"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={String(member.age)}
                  onChangeText={(val) => handleMemberChange(index, 'age', val)}
                />

                {/* Gender toggle */}
                <View style={styles.genderRow}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderBtn,
                        member.gender === g && styles.genderBtnActive
                      ]}
                      onPress={() => handleMemberChange(index, 'gender', g)}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          member.gender === g && styles.genderTextActive
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 3. Primary Contact */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Primary Contact Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Primary Contact Name *"
            placeholderTextColor="#94a3b8"
            value={contactDetails.primaryName}
            onChangeText={(val) =>
              setContactDetails({ ...contactDetails, primaryName: val })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Contact Phone Number *"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={contactDetails.primaryPhone}
            onChangeText={(val) =>
              setContactDetails({ ...contactDetails, primaryPhone: val })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Contact Email *"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={contactDetails.primaryEmail}
            onChangeText={(val) =>
              setContactDetails({ ...contactDetails, primaryEmail: val })
            }
          />
        </View>

        {/* 4. Payment Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>4. Payment Method for 20% Advance</Text>
          <View style={styles.paymentMethodRow}>
            <TouchableOpacity
              style={[
                styles.methodBtn,
                paymentMethod === 'Online' && styles.methodBtnActive
              ]}
              onPress={() => setPaymentMethod('Online')}
            >
              <Text
                style={[
                  styles.methodTitle,
                  paymentMethod === 'Online' && styles.methodTitleActive
                ]}
              >
                Online Payment
              </Text>
              <Text style={styles.methodSubtitle}>Instant card / UPI confirmation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodBtn,
                paymentMethod === 'Offline' && styles.methodBtnActive
              ]}
              onPress={() => setPaymentMethod('Offline')}
            >
              <Text
                style={[
                  styles.methodTitle,
                  paymentMethod === 'Offline' && styles.methodTitleActive
                ]}
              >
                Offline Payment
              </Text>
              <Text style={styles.methodSubtitle}>Bank transfer / UPI reference</Text>
            </TouchableOpacity>
          </View>

          {paymentMethod === 'Offline' && (
            <View style={styles.offlineBox}>
              <Text style={styles.offlineHelp}>
                Transfer ₹{advanceAmount.toLocaleString()} to UPI ID:{' '}
                <Text style={{ fontWeight: 'bold' }}>wanderwise@upi</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter UPI / Bank Reference ID *"
                placeholderTextColor="#94a3b8"
                value={offlineRef}
                onChangeText={setOfflineRef}
              />
            </View>
          )}
        </View>

        {/* Calculation summary */}
        <View style={styles.calcCard}>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Total Tour Fee ({numberOfSeats} seat(s)):</Text>
            <Text style={styles.calcVal}>₹{totalAmount.toLocaleString()}</Text>
          </View>
          <View style={[styles.calcRow, styles.advanceHighlight]}>
            <Text style={styles.advLabel}>20% Non-Refundable Advance:</Text>
            <Text style={styles.advVal}>₹{advanceAmount.toLocaleString()}</Text>
          </View>
          <Text style={styles.balanceText}>
            Remaining 80% balance (₹{remainingAmount.toLocaleString()}) payable before trip.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          disabled={submitting}
          onPress={handlePreSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>
              Review & Pay 20% Advance (₹{advanceAmount.toLocaleString()})
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Advance Policy Modal */}
      <AdvanceModal
        visible={showAdvanceModal}
        onClose={() => setShowAdvanceModal(false)}
        onConfirm={handleConfirmBooking}
        advanceAmount={advanceAmount}
        totalAmount={totalAmount}
        seatsCount={numberOfSeats}
        tourTitle={tour.title}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scroll: {
    padding: 16,
    paddingBottom: 40
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a'
  },
  tourName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 2
  },
  vehicleInfo: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 16
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepBtnText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0369a1'
  },
  seatCountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  memberBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  memberLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1'
  },
  childChip: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8
  },
  childChipActive: {
    backgroundColor: '#fef3c7'
  },
  childText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600'
  },
  childTextActive: {
    color: '#92400e',
    fontWeight: 'bold'
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#0f172a',
    marginBottom: 8
  },
  row: {
    flexDirection: 'row'
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  genderBtn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginLeft: 4
  },
  genderBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7'
  },
  genderText: {
    fontSize: 10,
    color: '#475569'
  },
  genderTextActive: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 8
  },
  methodBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc'
  },
  methodBtnActive: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff'
  },
  methodTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  methodTitleActive: {
    color: '#0284c7'
  },
  methodSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },
  offlineBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 10
  },
  offlineHelp: {
    fontSize: 11,
    color: '#92400e',
    marginBottom: 8
  },
  calcCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  calcLabel: {
    fontSize: 12,
    color: '#64748b'
  },
  calcVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  advanceHighlight: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 6,
    paddingTop: 8
  },
  advLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#047857'
  },
  advVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857'
  },
  balanceText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3
  },
  submitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold'
  }
});

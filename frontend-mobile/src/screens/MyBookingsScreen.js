import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import api from '../api/client';

export const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching mobile bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderBookingCard = ({ item }) => {
    const tour = item.tour;
    const isConfirmed = item.bookingStatus === 'Confirmed';
    const isPending = item.paymentStatus === 'Offline Verification Pending';

    return (
      <View style={styles.ticketCard}>
        {/* Top header strip */}
        <View style={styles.ticketHeader}>
          <Text style={styles.bookingId}>{item.bookingId}</Text>
          <View
            style={[
              styles.statusBadge,
              isConfirmed ? styles.statusConfirmed : styles.statusPending
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isConfirmed ? styles.statusTextConfirmed : styles.statusTextPending
              ]}
            >
              {item.bookingStatus}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.ticketBody}>
          <Text style={styles.tourTitle}>{tour?.title}</Text>
          <Text style={styles.destination}>📍 {tour?.destination}</Text>

          <View style={styles.specBox}>
            <Text style={styles.specItem}>
              🚌 Vehicle: <Text style={styles.bold}>{tour?.vehicleType}</Text>
            </Text>
            <Text style={styles.specItem}>
              📅 Departure: <Text style={styles.bold}>{formatDate(tour?.startDate)}</Text>
            </Text>
            <Text style={styles.specItem}>
              🏁 Return: <Text style={styles.bold}>{formatDate(tour?.endDate)}</Text>
            </Text>
            <Text style={styles.specItem}>
              🚩 Pickup: <Text style={styles.bold}>{tour?.startLocation}</Text>
            </Text>
          </View>

          {/* Passengers */}
          <Text style={styles.passengerHeader}>
            Passengers ({item.numberOfSeats} Seat(s)):
          </Text>
          {item.members.map((m, idx) => (
            <View key={idx} style={styles.passengerRow}>
              <Text style={styles.passengerName}>
                #{idx + 1}. {m.name} ({m.age}y, {m.gender})
              </Text>
              {m.isChild && <Text style={styles.childBadge}>Child</Text>}
            </View>
          ))}

          {/* Financials & Status */}
          <View style={styles.paymentBox}>
            <View style={styles.paymentRow}>
              <Text style={styles.payLabel}>Total Amount:</Text>
              <Text style={styles.payVal}>₹{item.pricing?.totalAmount?.toLocaleString()}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.payLabel}>20% Advance:</Text>
              <Text style={styles.advVal}>₹{item.pricing?.advanceRequiredAmount?.toLocaleString()}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.payLabel}>Payment Status:</Text>
              <Text
                style={[
                  styles.payStatusText,
                  isPending ? styles.payStatusPending : styles.payStatusPaid
                ]}
              >
                {item.paymentStatus}
              </Text>
            </View>

            {item.paymentMethod === 'Offline' && (
              <Text style={styles.offlineNote}>
                Offline Ref: {item.offlinePaymentDetails?.referenceNumber || 'Pending'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>My Tour Tickets</Text>
        <Text style={styles.subTitle}>{bookings.length} reservations</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBookingCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchMyBookings();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No Bookings Found</Text>
              <Text style={styles.emptySub}>
                Explore our catalog and reserve your seat with a 20% advance!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a'
  },
  subTitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  list: {
    padding: 16
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  ticketHeader: {
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  bookingId: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#334155'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusConfirmed: {
    backgroundColor: '#d1fae5'
  },
  statusPending: {
    backgroundColor: '#fef3c7'
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  statusTextConfirmed: {
    color: '#065f46'
  },
  statusTextPending: {
    color: '#92400e'
  },
  ticketBody: {
    padding: 14
  },
  tourTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  destination: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 2
  },
  specBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  specItem: {
    fontSize: 11,
    color: '#475569',
    marginVertical: 1.5
  },
  bold: {
    fontWeight: 'bold',
    color: '#0f172a'
  },
  passengerHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 10,
    marginBottom: 4
  },
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc'
  },
  passengerName: {
    fontSize: 11,
    color: '#475569'
  },
  childBadge: {
    fontSize: 9,
    color: '#b45309',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: 'bold'
  },
  paymentBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2
  },
  payLabel: {
    fontSize: 11,
    color: '#64748b'
  },
  payVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  advVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#047857'
  },
  payStatusText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  payStatusPaid: {
    color: '#047857'
  },
  payStatusPending: {
    color: '#d97706'
  },
  offlineNote: {
    fontSize: 10,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    padding: 4,
    borderRadius: 6,
    marginTop: 4
  },
  empty: {
    padding: 40,
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4
  }
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const TourDetailScreen = ({ route, navigation }) => {
  const { tourId } = route.params;
  const { isAuthenticated } = useAuth();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTour();
  }, [tourId]);

  const fetchTour = async () => {
    try {
      const res = await api.get(`/tours/${tourId}`);
      if (res.data.success) {
        setTour(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tour detail:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (!tour) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Tour details not found</Text>
      </View>
    );
  }

  const advanceAmount = Math.round(tour.pricePerPerson * 0.2);
  const isSoldOut = tour.availableSeats <= 0;

  const handleBookPress = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
    } else {
      navigation.navigate('Booking', { tour });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <Image
          source={{
            uri:
              tour.images?.[0] ||
              'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80'
          }}
          style={styles.heroImage}
        />

        <View style={styles.content}>
          <Text style={styles.destination}>📍 {tour.destination}</Text>
          <Text style={styles.title}>{tour.title}</Text>
          <Text style={styles.description}>{tour.description}</Text>

          {/* Schedule box */}
          <View style={styles.infoCard}>
            <Text style={styles.cardHeader}>🗓️ Travel Schedule & Origin</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Departure Date:</Text>
              <Text style={styles.infoVal}>{formatDate(tour.startDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Coming Back Date:</Text>
              <Text style={styles.infoVal}>{formatDate(tour.endDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Starting From:</Text>
              <Text style={styles.infoVal} numberOfLines={1}>{tour.startLocation}</Text>
            </View>
          </View>

          {/* Vehicle & Seats */}
          <View style={styles.infoCard}>
            <Text style={styles.cardHeader}>🚌 Vehicle & Seat Availability</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle Assigned:</Text>
              <Text style={styles.infoValBold}>{tour.vehicleType}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Available Capacity:</Text>
              <Text style={styles.seatsAvailableVal}>
                {tour.availableSeats} of {tour.totalSeats} seats open
              </Text>
            </View>
          </View>

          {/* 20% Advance Alert Notice */}
          <View style={styles.advanceAlertBox}>
            <Text style={styles.advanceAlertTitle}>⚠️ 20% Non-Refundable Advance</Text>
            <Text style={styles.advanceAlertText}>
              Pre-registration requires an advance payment of ₹{advanceAmount.toLocaleString()} per seat.
              This advance is non-refundable upon cancellation to guarantee vehicle reservation.
            </Text>
          </View>

          {/* Itinerary */}
          {tour.itinerary && tour.itinerary.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.cardHeader}>🗺️ Daily Itinerary</Text>
              {tour.itinerary.map((item, idx) => (
                <View key={idx} style={styles.itineraryItem}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayText}>Day {item.day}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itineraryTitle}>{item.title}</Text>
                    <Text style={styles.itineraryDesc}>{item.details}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Inclusions */}
          <View style={styles.infoCard}>
            <Text style={styles.cardHeader}>✅ Inclusions</Text>
            {tour.inclusions?.map((inc, i) => (
              <Text key={i} style={styles.listItem}>✓ {inc}</Text>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPrice}>₹{tour.pricePerPerson?.toLocaleString()}</Text>
          <Text style={styles.bottomAdv}>20% Adv: ₹{advanceAmount.toLocaleString()}</Text>
        </View>

        <TouchableOpacity
          style={[styles.bookActionBtn, isSoldOut && styles.bookActionBtnDisabled]}
          disabled={isSoldOut}
          onPress={handleBookPress}
        >
          <Text style={styles.bookActionText}>
            {isSoldOut ? 'Sold Out' : 'Select & Book Seats'}
          </Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  heroImage: {
    width: '100%',
    height: 240
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  destination: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0284c7'
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 4
  },
  description: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginTop: 8
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b'
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b'
  },
  infoValBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0284c7'
  },
  seatsAvailableVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669'
  },
  advanceAlertBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  advanceAlertTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#78350f'
  },
  advanceAlertText: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 16,
    marginTop: 4
  },
  itineraryItem: {
    flexDirection: 'row',
    marginTop: 10
  },
  dayBadge: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginRight: 10,
    height: 26,
    justifyContent: 'center'
  },
  dayText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0369a1'
  },
  itineraryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  itineraryDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  listItem: {
    fontSize: 12,
    color: '#334155',
    marginVertical: 2
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a'
  },
  bottomAdv: {
    fontSize: 10,
    color: '#059669',
    fontWeight: 'bold'
  },
  bookActionBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14
  },
  bookActionBtnDisabled: {
    backgroundColor: '#cbd5e1'
  },
  bookActionText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13
  },
  errorText: {
    color: '#dc2626',
    fontWeight: 'bold'
  }
});

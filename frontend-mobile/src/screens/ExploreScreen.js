import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView
} from 'react-native';
import api from '../api/client';

export const ExploreScreen = ({ navigation }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('All');

  const vehicleFilters = [
    'All',
    'Volvo Multi-Axle Bus',
    'Force Tempo Traveller',
    'Toyota Innova Crysta SUV',
    'Luxury AC Sleeper Coach'
  ];

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tours');
      if (res.data.success) {
        setTours(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching mobile tours:', err);
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

  const filteredTours = tours.filter((tour) => {
    if (selectedVehicle !== 'All' && !tour.vehicleType.includes(selectedVehicle)) {
      return false;
    }
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      tour.title.toLowerCase().includes(s) ||
      tour.destination.toLowerCase().includes(s) ||
      tour.startLocation.toLowerCase().includes(s)
    );
  });

  const renderTourCard = ({ item }) => {
    const advanceAmount = Math.round(item.pricePerPerson * 0.2);
    const isSoldOut = item.availableSeats <= 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('TourDetail', { tourId: item._id })}
      >
        {/* Banner image */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                item.images?.[0] ||
                'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80'
            }}
            style={styles.image}
          />
          {/* Vehicle badge */}
          <View style={styles.vehiclePill}>
            <Text style={styles.vehicleText}>{item.vehicleType}</Text>
          </View>
          {/* Seats badge */}
          <View
            style={[
              styles.seatsPill,
              isSoldOut
                ? styles.seatsSoldOut
                : item.availableSeats <= 4
                ? styles.seatsLow
                : styles.seatsAvailable
            ]}
          >
            <Text style={styles.seatsText}>
              {isSoldOut ? 'Sold Out' : `${item.availableSeats} Seats Left`}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.tourTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.destination}>📍 {item.destination}</Text>

          {/* Schedule */}
          <View style={styles.scheduleBox}>
            <Text style={styles.scheduleText}>
              📅 Dep: <Text style={styles.bold}>{formatDate(item.startDate)}</Text> • Ret:{' '}
              <Text style={styles.bold}>{formatDate(item.endDate)}</Text>
            </Text>
            <Text style={styles.originText} numberOfLines={1}>
              🚩 Start: {item.startLocation}
            </Text>
          </View>

          {/* Pricing & CTA */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceVal}>₹{item.pricePerPerson?.toLocaleString()}</Text>
              <Text style={styles.advanceTag}>20% Adv: ₹{advanceAmount.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => navigation.navigate('TourDetail', { tourId: item._id })}
            >
              <Text style={styles.bookBtnText}>View Details →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.brandTitle}>WanderWise Tours</Text>
        <TextInput
          placeholder="Search destination, city, or tour..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={{ paddingRight: 10 }}
        >
          {vehicleFilters.map((vf) => (
            <TouchableOpacity
              key={vf}
              style={[
                styles.chip,
                selectedVehicle === vf && styles.chipActive
              ]}
              onPress={() => setSelectedVehicle(vf)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedVehicle === vf && styles.chipTextActive
                ]}
              >
                {vf}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tour List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Finding available tours...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTours}
          keyExtractor={(item) => item._id}
          renderItem={renderTourCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Tours Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search filters.</Text>
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
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a'
  },
  filterScroll: {
    marginTop: 10,
    flexDirection: 'row'
  },
  chip: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8
  },
  chipActive: {
    backgroundColor: '#0284c7'
  },
  chipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#ffffff'
  },
  listContainer: {
    padding: 16
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  vehiclePill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  vehicleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  seatsPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  seatsAvailable: {
    backgroundColor: '#059669'
  },
  seatsLow: {
    backgroundColor: '#d97706'
  },
  seatsSoldOut: {
    backgroundColor: '#dc2626'
  },
  seatsText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  cardContent: {
    padding: 14
  },
  tourTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  destination: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 2
  },
  scheduleBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  scheduleText: {
    fontSize: 11,
    color: '#475569'
  },
  originText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 3
  },
  bold: {
    fontWeight: 'bold',
    color: '#1e293b'
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  priceVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a'
  },
  advanceTag: {
    fontSize: 10,
    color: '#059669',
    fontWeight: 'bold'
  },
  bookBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748b'
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4
  }
});

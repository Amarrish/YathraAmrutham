require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const Gallery = require('../models/Gallery');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tours_and_travel_db');
    console.log('[Seed]: Connected to MongoDB database...');

    // Clear existing collections
    await User.deleteMany({});
    await Tour.deleteMany({});
    await Booking.deleteMany({});
    await Gallery.deleteMany({});
    console.log('[Seed]: Cleared existing Users, Tours, Bookings, and Gallery items.');

    // 1. Create Admin User
    const admin = await User.create({
      name: 'Admin Commander',
      email: 'admin@travel.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91 9998887770',
      address: 'Central Admin Operations, Connaught Place, New Delhi'
    });
    console.log('[Seed]: Admin user created -> admin@travel.com (password: admin123)');

    // 2. Create Sample Customer User
    const user = await User.create({
      name: 'John Traveler',
      email: 'john@travel.com',
      password: 'user123',
      role: 'user',
      phone: '+91 9876543210',
      address: '42 Orchid Heights, Indiranagar, Bengaluru'
    });
    console.log('[Seed]: Customer user created -> john@travel.com (password: user123)');

    // 3. Create Sample Tours with various vehicle types and dates
    const now = new Date();
    const addDays = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d;
    };

    // Helper to generate 10x7 custom bus grid (aisle in cols 3,4,5 for rows 1-9, full back row 7 seats)
    const generate10x7BusGrid = () => {
      const cells = [];
      let seatNum = 1;
      for (let r = 1; r <= 10; r++) {
        for (let c = 1; c <= 7; c++) {
          if (r < 10 && (c === 3 || c === 4 || c === 5)) {
            cells.push({ row: r, col: c, isSeat: false });
          } else {
            cells.push({
              row: r,
              col: c,
              isSeat: true,
              seatNumber: seatNum++,
              isBlockedByAdmin: seatNum === 4 // Sample blocked seat
            });
          }
        }
      }
      return { rows: 10, columns: 7, cells };
    };

    const sampleTours = [
      {
        title: 'Kerala God’s Own Country Houseboat & Hills',
        description:
          'Cruise Alleppey backwaters on private luxury houseboats, explore Munnar tea mist, Periyar wildlife sanctuary, and Marari beach sunsets.',
        destination: 'Alleppey, Munnar & Kochi, Kerala',
        startLocation: 'Cochin International Airport (COK) / Ernakulam South',
        startDate: addDays(8),
        endDate: addDays(14),
        pricePerPerson: 11500,
        totalSeats: 43,
        availableSeats: 39,
        vehicleType: 'Volvo Multi-Axle Bus',
        status: 'Active',
        seatingGrid: generate10x7BusGrid(),
        itinerary: [
          { day: 1, title: 'Arrival in Kochi & Fort Kochi Walk', details: 'Chinese fishing nets, Jewish synagogue and harbor cruise.' },
          { day: 2, title: 'Scenic Drive to Munnar', details: 'Cheeyappara waterfalls and check-in to tea estate bungalow.' },
          { day: 3, title: 'Munnar Tea Hills Exploration', details: 'Eravikulam National Park (Nilgiri Tahr) and Mattupetty Dam.' },
          { day: 4, title: 'Thekkady Periyar Wildlife', details: 'Spice plantation tour, boat safari and Kathakali cultural show.' },
          { day: 5, title: 'Alleppey Backwaters Houseboat', details: 'Boarding traditional luxury Kettuvallam houseboat with Kerala feast.' },
          { day: 6, title: 'Departure from Kochi', details: 'Breakfast on backwaters and transfer to Kochi airport.' }
        ],
        inclusions: [
          'Volvo Multi-Axle Bus Transport',
          'Overnight Houseboat Stay with Chef',
          '3-Star Tea Estate Resort in Munnar',
          'Daily Breakfast & Dinners',
          'Periyar Boating & Entry Permits'
        ],
        exclusions: ['Lunch Meals', 'Personal Ayurveda Spa Charges'],
        images: [
          'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1000&q=80'
        ],
        createdBy: admin._id
      },
      {
        title: 'Tamil Nadu Temple Architecture & Nilgiri Hills',
        description:
          'Marvel at Brihadeeswara Temple, Madurai Meenakshi Amman, UNESCO Shore Temples of Mahabalipuram, and cool off in Ooty botanical heights.',
        destination: 'Madurai, Thanjavur, Ooty & Mahabalipuram, Tamil Nadu',
        startLocation: 'Chennai Central Railway Station / Airport',
        startDate: addDays(12),
        endDate: addDays(18),
        pricePerPerson: 9800,
        totalSeats: 30,
        availableSeats: 30,
        vehicleType: 'Volvo Multi-Axle Bus',
        status: 'Active',
        itinerary: [
          { day: 1, title: 'Chennai to Mahabalipuram', details: 'Pancha Rathas, Shore Temple and Krishna Butter Ball.' },
          { day: 2, title: 'Thanjavur Chola Marvel', details: 'Brihadeeswara Temple architecture and Saraswathi Mahal library.' },
          { day: 3, title: 'Madurai Meenakshi Amman', details: 'Magnificent night ceremony and Thirumalai Nayakar Mahal.' },
          { day: 4, title: 'Ooty Queen of Hills', details: 'Ascent to Ooty, tea factory and botanical garden stroll.' },
          { day: 5, title: 'Coonoor & Nilgiri Toy Train', details: 'Heritage toy train ride, Sims Park and return departure.' }
        ],
        inclusions: [
          'AC Tourist Coach with Reclining Seats',
          'Heritage Hotels and Hill Resort',
          'Temple Entry Pass & Guide',
          'Daily Buffet Breakfast'
        ],
        exclusions: ['Camera Tolls', 'Special Darshan Tickets'],
        images: [
          'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1000&q=80'
        ],
        createdBy: admin._id
      },
      {
        title: 'Karnataka Royal Heritage & Western Ghats Trail',
        description:
          'Grand Mysore Palace illumination, Hoysala stone carvings of Belur & Halebidu, coffee estates of Coorg, and Hampi ancient ruins.',
        destination: 'Mysore, Coorg & Hampi, Karnataka',
        startLocation: 'Bangalore Majestic Kempegowda Bus Station',
        startDate: addDays(15),
        endDate: addDays(21),
        pricePerPerson: 10800,
        totalSeats: 20,
        availableSeats: 20,
        vehicleType: 'Force Tempo Traveller (12/17 Seater)',
        status: 'Active',
        itinerary: [
          { day: 1, title: 'Bangalore to Mysore', details: 'Srirangapatna, Mysore Palace and Brindavan Gardens musical fountain.' },
          { day: 2, title: 'Coorg Coffee Country', details: 'Abbi falls, Raja Seat sunset and Dubare elephant camp.' },
          { day: 3, title: 'Hoysala Architectural Wonders', details: 'Belur Chennakeshava and Halebidu Hoysaleshwara temples.' },
          { day: 4, title: 'Hampi Vijayanagara Empire', details: 'Virupaksha temple, Stone Chariot and Tungabhadra river coracle ride.' },
          { day: 5, title: 'Return to Bangalore', details: 'Souvenir shopping and evening arrival in Bangalore.' }
        ],
        inclusions: [
          'Comfortable Push-back Tempo Traveller',
          'Premium Coffee Estate Homestay & 3-Star Hotels',
          'Daily Breakfast & Dinner',
          'Expert Historian Guide for Hampi'
        ],
        exclusions: ['Coracle Ride Charges', 'Personal Expenses'],
        images: [
          'https://images.unsplash.com/photo-1600100397608-f010f4438317?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1000&q=80'
        ],
        createdBy: admin._id
      },
      {
        title: 'Kerala Monsoon Backwaters & Spice Odyssey (Completed Tour)',
        description:
          'Archived completed journey of our famous monsoon edition across Vembanad lake and Wayanad rainforests.',
        destination: 'Wayanad & Alleppey, Kerala',
        startLocation: 'Calicut Railway Station',
        startDate: addDays(-20),
        endDate: addDays(-14),
        pricePerPerson: 8500,
        totalSeats: 20,
        availableSeats: 0,
        vehicleType: 'Volvo Multi-Axle Bus',
        status: 'Completed',
        itinerary: [
          { day: 1, title: 'Wayanad Rainforest Welcome', details: 'Edakkal caves and treehouse check-in.' },
          { day: 2, title: 'Alleppey Backwaters Regatta', details: 'Traditional boat races and backwater cruise.' }
        ],
        inclusions: ['All Accommodations', 'Houseboat Cruise', 'All Meals'],
        exclusions: ['Personal Shopping'],
        images: [
          'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1000&q=80'
        ],
        createdBy: admin._id
      },
      {
        title: 'Goa Coastal Sun, Sand & Sunset Cruise Expedition',
        description:
          'Discover golden beaches, historic Portuguese churches, vibrant night flea markets, water sports, and Mandovi river sunset cruises.',
        destination: 'North & South Goa',
        startLocation: 'Goa Mopa / Dabolim Airport Pickup',
        startDate: addDays(5),
        endDate: addDays(9),
        pricePerPerson: 9200,
        totalSeats: 26,
        availableSeats: 26,
        vehicleType: 'Luxury AC Sleeper Coach',
        status: 'Active',
        itinerary: [
          { day: 1, title: 'Welcome to Coastal Paradise', details: 'Airport pickup, check-in to beach resort, leisure evening at Calangute.' },
          { day: 2, title: 'North Goa Forts & Watersports', details: 'Aguada fort, Chapora fort (Dil Chahta Hai point), Anjuna flea market.' },
          { day: 3, title: 'Old Goa & Mandovi River Cruise', details: 'Basilica of Bom Jesus, Se Cathedral, evening Mandovi sunset cruise with DJ.' },
          { day: 4, title: 'South Goa Serenity & Departure', details: 'Palolem beach, spice plantation tour with lunch, and departure drop.' }
        ],
        inclusions: [
          'Beachside 4-Star Resort with Swimming Pool',
          'Luxury AC Sleeper Coach Intercity Transit',
          'Evening Mandovi River Sunset Luxury Cruise Ticket',
          'Spice Plantation Guided Tour with Traditional Goan Buffet',
          'Daily Breakfast'
        ],
        exclusions: ['Water Sports Jet Ski / Parasailing Pack', 'Casino Entry Fees', 'Personal Dinners'],
        images: [
          'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'
        ],
        createdBy: admin._id
      }
    ];

    const insertedTours = await Tour.insertMany(sampleTours);
    console.log(`[Seed]: Successfully inserted ${insertedTours.length} high-quality tours.`);

    // 4. Create sample bookings
    const keralaTour = insertedTours[0];
    const completedTour = insertedTours[3];

    // 4a. Offline pending booking for Kerala Tour
    const seatsToBook = 2;
    const pricePerPerson = keralaTour.pricePerPerson;
    const totalAmount = pricePerPerson * seatsToBook;
    const advanceRequiredAmount = Math.round(totalAmount * 0.2);
    const remainingAmount = totalAmount - advanceRequiredAmount;

    await Booking.create({
      bookingId: 'BK-20261021-1001',
      user: user._id,
      tour: keralaTour._id,
      numberOfSeats: seatsToBook,
      allocatedSeats: [1, 2],
      members: [
        {
          name: 'John Traveler',
          age: 28,
          gender: 'Male',
          isChild: false,
          seatNumber: 1,
          address: '42 Orchid Heights, Bengaluru',
          contact: '+91 9876543210'
        },
        {
          name: 'Sarah Traveler',
          age: 7,
          gender: 'Female',
          isChild: true,
          seatNumber: 2,
          address: '42 Orchid Heights, Bengaluru',
          contact: '+91 9876543210'
        }
      ],
      contactDetails: {
        primaryName: 'John Traveler',
        primaryPhone: '+91 9876543210',
        primaryEmail: 'john@travel.com',
        address: '42 Orchid Heights, Bengaluru'
      },
      pricing: {
        pricePerPerson,
        totalAmount,
        advanceRequiredAmount,
        remainingAmount,
        amountPaid: 0
      },
      nonRefundableAcknowledged: true,
      paymentMethod: 'Offline',
      offlinePaymentDetails: {
        referenceNumber: 'UPI/HDFC/2026102199881',
        paymentMode: 'UPI',
        notes: 'Paid 20% advance via GPay to Travel Admin account. Please verify.',
        submittedAt: new Date()
      },
      paymentStatus: 'Offline Verification Pending',
      bookingStatus: 'Pending Confirmation'
    });

    // 4b. Confirmed passenger booking for the Completed Tour
    await Booking.create({
      bookingId: 'BK-20261001-9002',
      user: user._id,
      tour: completedTour._id,
      numberOfSeats: 2,
      allocatedSeats: [5, 6],
      members: [
        {
          name: 'Priya Nambiar',
          age: 32,
          gender: 'Female',
          isChild: false,
          seatNumber: 5,
          address: 'Panampilly Nagar, Kochi',
          contact: '+91 9847123456'
        },
        {
          name: 'Kiran Nambiar',
          age: 35,
          gender: 'Male',
          isChild: false,
          seatNumber: 6,
          address: 'Panampilly Nagar, Kochi',
          contact: '+91 9847123456'
        }
      ],
      contactDetails: {
        primaryName: 'Priya Nambiar',
        primaryPhone: '+91 9847123456',
        primaryEmail: 'priya@example.com',
        address: 'Panampilly Nagar, Kochi'
      },
      pricing: {
        pricePerPerson: completedTour.pricePerPerson,
        totalAmount: completedTour.pricePerPerson * 2,
        advanceRequiredAmount: Math.round(completedTour.pricePerPerson * 2 * 0.2),
        remainingAmount: 0,
        amountPaid: completedTour.pricePerPerson * 2
      },
      nonRefundableAcknowledged: true,
      paymentMethod: 'Online',
      paymentStatus: 'Fully Paid',
      bookingStatus: 'Confirmed'
    });

    // 5. Seed Gallery Items (Photos, Videos, and Upcoming Tour Programs)
    const galleryItems = [
      {
        title: 'Emerald Munnar Misty Tea Valleys',
        description: 'Spectacular sun rays piercing through the morning mist in Munnar highland tea estates.',
        mediaType: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80',
        category: 'Kerala',
        isUpcomingTourProgram: false,
        order: 1,
        createdBy: admin._id
      },
      {
        title: 'Alleppey Backwaters Golden Sunset Cruise',
        description: 'Cruising through serene palm-fringed backwaters aboard an authentic Kerala houseboat.',
        mediaType: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
        category: 'Kerala',
        isUpcomingTourProgram: false,
        order: 2,
        createdBy: admin._id
      },
      {
        title: 'Magnificent Madurai Meenakshi Gopuram',
        description: 'Intricate Dravidian architecture and towering multi-colored sculptures of Madurai.',
        mediaType: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
        category: 'Tamil Nadu',
        isUpcomingTourProgram: false,
        order: 3,
        createdBy: admin._id
      },
      {
        title: 'Hampi Vijayanagara Stone Chariot',
        description: 'Ancient UNESCO world heritage stone chariot glowing in the twilight at Vittala Temple.',
        mediaType: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1600100397608-f010f4438317?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600100397608-f010f4438317?auto=format&fit=crop&w=600&q=80',
        category: 'Karnataka',
        isUpcomingTourProgram: false,
        order: 4,
        createdBy: admin._id
      },
      {
        title: 'Discover Kerala: Land of Beauty Video Reel',
        description: 'Experience the magic of Kerala backwaters, Kathakali, and hill stations.',
        mediaType: 'video',
        mediaUrl: 'https://www.youtube.com/watch?v=R83BlU5nnbs',
        thumbnailUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
        category: 'Kerala',
        isUpcomingTourProgram: false,
        order: 5,
        createdBy: admin._id
      },
      {
        title: 'Upcoming Program: Royal Karnataka Heritage 2026',
        description: 'Upcoming 6-day luxury coach tour across Mysore, Coorg coffee retreats, and Hampi ruins.',
        mediaType: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80',
        category: 'Karnataka',
        isUpcomingTourProgram: true,
        upcomingProgram: {
          tourTitle: 'Royal Karnataka Heritage & Western Ghats Trail',
          destination: 'Mysore, Coorg & Hampi, Karnataka',
          dates: '15 Dec – 21 Dec 2026',
          itineraryBrief: 'Mysore palace illumination, Dubare elephant camp, and private Hampi historian guide.',
          relatedTourId: insertedTours[2]._id
        },
        order: 6,
        createdBy: admin._id
      },
      {
        title: 'Upcoming Program: Tamil Nadu Temple & Nilgiri Tour',
        description: 'Upcoming cultural and scenic expedition across Madurai, Thanjavur, and Ooty.',
        mediaType: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80',
        category: 'Tamil Nadu',
        isUpcomingTourProgram: true,
        upcomingProgram: {
          tourTitle: 'Tamil Nadu Temple Architecture & Nilgiri Hills',
          destination: 'Madurai, Thanjavur, Ooty & Mahabalipuram, Tamil Nadu',
          dates: '05 Jan – 11 Jan 2027',
          itineraryBrief: 'Brihadeeswara Chola marvel, Meenakshi night ceremony, and Nilgiri toy train ride.',
          relatedTourId: insertedTours[1]._id
        },
        order: 7,
        createdBy: admin._id
      }
    ];

    await Gallery.insertMany(galleryItems);
    console.log(`[Seed]: Inserted ${galleryItems.length} rich showcase Gallery items & Upcoming Tour Programs.`);

    console.log('[Seed]: Created initial sample offline booking pending admin confirmation.');
    console.log('[Seed]: Database seeding successfully completed! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDB();

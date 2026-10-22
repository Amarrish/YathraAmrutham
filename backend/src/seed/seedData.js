require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tours_and_travel_db');
    console.log('[Seed]: Connected to MongoDB database...');

    // Clear existing collections
    await User.deleteMany({});
    await Tour.deleteMany({});
    await Booking.deleteMany({});
    console.log('[Seed]: Cleared existing Users, Tours, and Bookings.');

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

    const sampleTours = [
      {
        title: 'Magical Manali & Rohtang Snow Adventure',
        description:
          'Experience the snow-capped Himalayan peaks, Solang Valley winter sports, apple orchards, and picturesque Beas river in a customized mountain journey.',
        destination: 'Manali, Himachal Pradesh',
        startLocation: 'Delhi Majnu Ka Tila ISBT (Boarding Point)',
        startDate: addDays(7),
        endDate: addDays(12),
        pricePerPerson: 7500,
        totalSeats: 16,
        availableSeats: 16,
        vehicleType: 'Force Tempo Traveller (12/17 Seater)',
        itinerary: [
          { day: 1, title: 'Departure from Delhi', details: 'Overnight journey through scenic mountain highway.' },
          { day: 2, title: 'Arrival & Local Sightseeing', details: 'Check-in, visit Hadimba Temple, Mall Road and Vashisht Hot Springs.' },
          { day: 3, title: 'Solang Valley & Atal Tunnel', details: 'Adventure sports, zorbing, paragliding, and drive through engineering marvel Atal Tunnel.' },
          { day: 4, title: 'Kasol & Manikaran Excursion', details: 'Explore Parvati valley, hot sulphur baths, and Manikaran Gurudwara.' },
          { day: 5, title: 'Shopping & Return Departure', details: 'Souvenir shopping at Tibetan market and overnight return.' }
        ],
        inclusions: [
          '3-Star Hotel Stay with Mountain View',
          'Daily Buffet Breakfast and Dinner',
          'Sanitized Force Tempo Traveller Transportation',
          'Experienced Himalayan Driver & Toll Taxes',
          'Atal Tunnel and Solang Valley Permits'
        ],
        exclusions: ['Lunches & Snacks', 'Personal Adventure Sports Fees', 'Heater Charges in Hotel'],
        images: [
          'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=1000&q=80'
        ],
        createdBy: admin._id
      },
      {
        title: 'Royal Rajasthan Heritage & Golden Sand Dunes',
        description:
          'Immerse yourself in grand Rajput fortresses, glowing sand dunes of Jaisalmer, royal palaces, camel safaris, and vibrant desert music festivals.',
        destination: 'Jaipur, Jodhpur & Jaisalmer, Rajasthan',
        startLocation: 'Jaipur Airport & Central Railway Station',
        startDate: addDays(14),
        endDate: addDays(20),
        pricePerPerson: 13500,
        totalSeats: 32,
        availableSeats: 32,
        vehicleType: 'Volvo Multi-Axle Bus',
        itinerary: [
          { day: 1, title: 'Pink City Royal Welcome', details: 'Arrival in Jaipur, visit Amber Fort and Hawa Mahal.' },
          { day: 2, title: 'City Palace & Jantar Mantar', details: 'Explore Royal astronomical observatory and local bazaar.' },
          { day: 3, title: 'Blue City Jodhpur', details: 'Drive to Jodhpur, tour majestic Mehrangarh Fort and Jaswant Thada.' },
          { day: 4, title: 'Golden City Jaisalmer', details: 'Drive to Jaisalmer, explore Living Fort and Patwon Ki Haveli.' },
          { day: 5, title: 'Sam Sand Dunes Camp', details: 'Camel safari, Rajasthani folk dance, campfire and luxury Swiss tents.' },
          { day: 6, title: 'Farewell & Departure', details: 'Breakfast and drop at Jodhpur/Jaipur airport.' }
        ],
        inclusions: [
          'Heritage Haveli and Luxury Desert Tent Accommodations',
          'Luxury Multi-Axle AC Volvo Bus with Reclining Seats',
          'All Buffet Breakfasts & Dinners with Traditional Rajasthani Thali',
          'Camel Safari & Cultural Folk Performance with Campfire',
          'Dedicated Tour Guide and All Inter-state Tolls'
        ],
        exclusions: ['Monument Entry Tickets', 'Monument Camera Fees', 'Personal Laundry & Mini-bar'],
        images: [
          'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1000&q=80'
        ],
        createdBy: admin._id
      },
      {
        title: 'Ooty & Kodaikanal Queen of Hills Private Retreat',
        description:
          'Unwind in emerald tea plantations, Nilgiri mountain railway, misty pine forests, and serene lake boating with private SUV luxury.',
        destination: 'Ooty, Coonoor & Kodaikanal, Tamil Nadu',
        startLocation: 'Coimbatore Airport / Railway Station',
        startDate: addDays(10),
        endDate: addDays(14),
        pricePerPerson: 8900,
        totalSeats: 6,
        availableSeats: 6,
        vehicleType: 'Toyota Innova Crysta SUV',
        itinerary: [
          { day: 1, title: 'Coimbatore to Ooty Hill Ride', details: 'Scenic climb through 36 hairpin bends, check-in to botanical resort.' },
          { day: 2, title: 'Doddabetta Peak & Tea Factory', details: 'Highest peak view, aromatic chocolate factory and Ooty lake boating.' },
          { day: 3, title: 'Coonoor & Scenic Kodaikanal Drive', details: 'Sims park, Dolphin nose viewpoint, and transfer to Kodaikanal.' },
          { day: 4, title: 'Pillar Rocks & Coakers Walk', details: 'Pine forest walk, Guna caves, cycling by Kodai lake and return to Coimbatore.' }
        ],
        inclusions: [
          'Exclusive Toyota Innova Crysta SUV with Captain Seats',
          '4-Star Colonial Tea Estate Resort Stay',
          'Daily Breakfast & Dinner with Fresh Hills Tea',
          'Driver Allowance, Hill Fuel, Parking and Tolls'
        ],
        exclusions: ['Toy Train Tickets', 'Boating Fees', 'Lunch Expenses'],
        images: [
          'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80'
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

    // 4. Create an initial sample booking for John Traveler (Offline payment pending admin verification)
    const manaliTour = insertedTours[0];
    const seatsToBook = 2;
    const pricePerPerson = manaliTour.pricePerPerson;
    const totalAmount = pricePerPerson * seatsToBook;
    const advanceRequiredAmount = Math.round(totalAmount * 0.2);
    const remainingAmount = totalAmount - advanceRequiredAmount;

    await Booking.create({
      bookingId: 'BK-20261021-1001',
      user: user._id,
      tour: manaliTour._id,
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

    console.log('[Seed]: Created initial sample offline booking pending admin confirmation.');
    console.log('[Seed]: Database seeding successfully completed! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDB();

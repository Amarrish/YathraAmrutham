require('dotenv').config();
const http = require('http');
const app = require('../app');
const connectDB = require('../config/db');

// Helper to make local HTTP requests using Node built-in http module
const request = (server, options, postData) => {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const reqOptions = {
      hostname: 'localhost',
      port: address.port,
      path: options.path,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (postData) {
      const dataStr = JSON.stringify(postData);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(dataStr);
    }

    const req = http.request(reqOptions, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: rawData });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n🧪 Starting Comprehensive API Automated Test Suite...\n');
  await connectDB();

  const server = app.listen(0); // Random free port
  const port = server.address().port;
  console.log(`[Test Server Listening on ephemeral port]: ${port}`);

  let passCount = 0;
  let failCount = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failCount++;
    }
  };

  try {
    // 1. Health check
    const healthRes = await request(server, { path: '/api/health' });
    assert(healthRes.status === 200 && healthRes.body.status === 'online', 'Health endpoint responds online');

    // 2. User registration
    const testEmail = `testuser_${Date.now()}@travel.com`;
    const regRes = await request(server, { path: '/api/auth/register', method: 'POST' }, {
      name: 'Alice Traveler',
      email: testEmail,
      password: 'mypassword123',
      phone: '+91 9123456789',
      address: 'Test City'
    });
    assert(regRes.status === 201 && regRes.body.token, 'User registration returns 201 and JWT token');
    const userToken = regRes.body.token;
    const userId = regRes.body.user.id;

    // 3. User login
    const loginRes = await request(server, { path: '/api/auth/login', method: 'POST' }, {
      email: testEmail,
      password: 'mypassword123'
    });
    assert(loginRes.status === 200 && loginRes.body.user.email === testEmail, 'User login succeeds with correct credentials');

    // 4. Forgot password & OTP generation
    const forgotRes = await request(server, { path: '/api/auth/forgot-password', method: 'POST' }, {
      email: testEmail
    });
    assert(forgotRes.status === 200 && forgotRes.body.devOtp, 'Forgot password generates OTP and returns devOtp');
    const otp = forgotRes.body.devOtp;

    // 5. Reset password with OTP
    const resetRes = await request(server, { path: '/api/auth/reset-password', method: 'POST' }, {
      email: testEmail,
      otp,
      newPassword: 'newsecurepassword456'
    });
    assert(resetRes.status === 200, 'Password reset succeeds with valid OTP');

    // 6. Login with new password
    const newLoginRes = await request(server, { path: '/api/auth/login', method: 'POST' }, {
      email: testEmail,
      password: 'newsecurepassword456'
    });
    assert(newLoginRes.status === 200, 'Login succeeds with new password after reset');

    // 7. Fetch tours list
    const toursRes = await request(server, { path: '/api/tours' });
    assert(toursRes.status === 200 && toursRes.body.data.length > 0, `Fetched ${toursRes.body.data.length} active tours`);
    const tourToBook = toursRes.body.data[0];
    const initialSeats = tourToBook.availableSeats;

    // 8. Book tour with online payment (2 seats, 20% advance calculation)
    const bookRes = await request(
      server,
      {
        path: '/api/bookings',
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` }
      },
      {
        tourId: tourToBook._id,
        numberOfSeats: 2,
        nonRefundableAcknowledged: true,
        paymentMethod: 'Online',
        contactDetails: {
          primaryName: 'Alice Traveler',
          primaryPhone: '+91 9123456789',
          primaryEmail: testEmail,
          address: '42 Main St'
        },
        members: [
          { name: 'Alice Traveler', age: 26, gender: 'Female', isChild: false, contact: '+91 9123456789' },
          { name: 'Bob Traveler', age: 28, gender: 'Male', isChild: false, contact: '+91 9123456789' }
        ]
      }
    );
    assert(
      bookRes.status === 201 &&
      bookRes.body.data.paymentStatus === 'Advance Paid' &&
      bookRes.body.data.bookingStatus === 'Confirmed' &&
      bookRes.body.data.pricing.advanceRequiredAmount === Math.round(tourToBook.pricePerPerson * 2 * 0.2),
      'Online booking automatically confirms and calculates 20% advance fee accurately'
    );

    // Verify seats were decremented
    const tourAfterBook = await request(server, { path: `/api/tours/${tourToBook._id}` });
    assert(tourAfterBook.body.data.availableSeats === initialSeats - 2, `Available seats decremented from ${initialSeats} to ${initialSeats - 2}`);

    // 9. Book tour with Offline payment
    const offlineBookRes = await request(
      server,
      {
        path: '/api/bookings',
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` }
      },
      {
        tourId: tourToBook._id,
        numberOfSeats: 1,
        nonRefundableAcknowledged: true,
        paymentMethod: 'Offline',
        contactDetails: {
          primaryName: 'Alice Traveler',
          primaryPhone: '+91 9123456789',
          primaryEmail: testEmail,
          address: '42 Main St'
        },
        members: [
          { name: 'Charlie Child', age: 8, gender: 'Male', isChild: true }
        ],
        offlinePaymentDetails: {
          referenceNumber: 'OFFLINE-UPI-REF-5544',
          paymentMode: 'UPI',
          notes: 'Transferred via UPI'
        }
      }
    );
    assert(
      offlineBookRes.status === 201 &&
      offlineBookRes.body.data.paymentStatus === 'Offline Verification Pending' &&
      offlineBookRes.body.data.bookingStatus === 'Pending Confirmation',
      'Offline booking flagged as Offline Verification Pending'
    );
    const offlineBookingId = offlineBookRes.body.data._id;

    // 10. Admin login
    const adminLoginRes = await request(server, { path: '/api/auth/login', method: 'POST' }, {
      email: 'admin@travel.com',
      password: 'admin123'
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.body.user.role === 'admin', 'Admin login successful');
    const adminToken = adminLoginRes.body.token;

    // 11. Admin view stats
    const statsRes = await request(server, {
      path: '/api/admin/stats',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(statsRes.status === 200 && statsRes.body.stats.pendingOfflinePaymentsCount >= 1, 'Admin stats report pending offline payments');

    // 12. Admin confirm offline payment
    const confirmRes = await request(server, {
      path: `/api/admin/bookings/${offlineBookingId}/confirm-offline-payment`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, { adminNotes: 'Verified funds received in bank account.' });
    assert(
      confirmRes.status === 200 &&
      confirmRes.body.data.paymentStatus === 'Advance Paid' &&
      confirmRes.body.data.bookingStatus === 'Confirmed',
      'Admin successfully verifies offline payment and promotes booking to Confirmed'
    );

    // 13. Admin resets user password
    const adminResetRes = await request(server, {
      path: `/api/admin/users/${userId}/reset-password`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, { newPassword: 'adminChangedPass789' });
    assert(adminResetRes.status === 200, 'Admin can reset customer password directly');

    // 14. Verify user can login with admin-set password
    const adminResetLoginRes = await request(server, { path: '/api/auth/login', method: 'POST' }, {
      email: testEmail,
      password: 'adminChangedPass789'
    });
    assert(adminResetLoginRes.status === 200, 'User logs in with admin-reset password');

    // 15. User selects specific seat numbers [5, 6]
    const seatBookRes = await request(
      server,
      {
        path: '/api/bookings',
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` }
      },
      {
        tourId: tourToBook._id,
        numberOfSeats: 2,
        selectedSeats: [5, 6],
        nonRefundableAcknowledged: true,
        paymentMethod: 'Online',
        contactDetails: {
          primaryName: 'Alice Traveler',
          primaryPhone: '+91 9123456789',
          primaryEmail: testEmail,
          address: '42 Main St'
        },
        members: [
          { name: 'Diana Traveler', age: 24, gender: 'Female', isChild: false },
          { name: 'Edward Traveler', age: 27, gender: 'Male', isChild: false }
        ]
      }
    );
    assert(
      seatBookRes.status === 201 &&
      JSON.stringify(seatBookRes.body.data.allocatedSeats) === JSON.stringify([5, 6]) &&
      seatBookRes.body.data.members[0].seatNumber === 5 &&
      seatBookRes.body.data.members[1].seatNumber === 6,
      'User can select specific seat numbers and seats are allocated to passengers'
    );

    // 16. Admin view seating chart
    const seatingChartRes = await request(server, {
      path: `/api/admin/tours/${tourToBook._id}/seating-chart`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const seat5 = seatingChartRes.body.data?.seats?.find((s) => s.seatNumber === 5);
    assert(
      seatingChartRes.status === 200 && seat5?.isOccupied && seat5?.passenger?.name === 'Diana Traveler',
      'Admin seating chart accurately identifies occupants on allocated seats'
    );

    // 17. Admin rearrange/reassign seat (Move Diana from Seat 5 to Seat 7)
    const rearrangeRes = await request(
      server,
      {
        path: `/api/admin/tours/${tourToBook._id}/reassign-seat`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` }
      },
      { fromSeat: 5, toSeat: 7 }
    );
    assert(
      rearrangeRes.status === 200 && rearrangeRes.body.success,
      'Admin can rearrange/reassign passenger to a different seat'
    );

    // Verify Seat 7 is now occupied by Diana and Seat 5 is empty
    const verifyChartRes = await request(server, {
      path: `/api/admin/tours/${tourToBook._id}/seating-chart`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const newSeat7 = verifyChartRes.body.data?.seats?.find((s) => s.seatNumber === 7);
    const oldSeat5 = verifyChartRes.body.data?.seats?.find((s) => s.seatNumber === 5);
    assert(
      newSeat7?.isOccupied && newSeat7?.passenger?.name === 'Diana Traveler' && !oldSeat5?.isOccupied,
      'Seating chart reflects rearranged seats: Seat 7 occupied, Seat 5 free'
    );

    // 18. Admin edits user profile
    const editUserRes = await request(server, {
      path: `/api/admin/users/${userId}`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      name: 'Alice Wonder',
      phone: '+91 9988776655',
      address: 'New Wonderland St',
      role: 'user'
    });
    assert(
      editUserRes.status === 200 && editUserRes.body.data.name === 'Alice Wonder',
      'Admin can edit user name, phone, address, and role'
    );

    // 19. Bug Fix Verification: Create tour with availableSeats=25 and totalSeats=30
    const createTourRes = await request(server, {
      path: '/api/tours',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      title: 'Himalayan Ridge Trek',
      description: 'Scenic high altitude trek through pine valleys and ridges.',
      destination: 'Kasol, Himachal Pradesh',
      startLocation: 'Chandigarh Sector 43',
      startDate: '2026-11-10',
      endDate: '2026-11-15',
      pricePerPerson: 6500,
      totalSeats: 30,
      availableSeats: 25,
      vehicleType: 'Volvo Multi-Axle Bus',
      inclusions: ['Camping', 'Meals'],
      exclusions: ['Personal expenses']
    });
    assert(
      createTourRes.status === 201 &&
      createTourRes.body.data.totalSeats === 30 &&
      createTourRes.body.data.availableSeats === 25,
      'Bug fixed: Creating tour with 25 available seats and 30 total seats correctly retains availableSeats=25'
    );

    // 20. Admin manually allocate seat for unallocated offline booking member
    const memberToAllocate = confirmRes.body.data.members[0];
    const allocRes = await request(server, {
      path: `/api/admin/bookings/${offlineBookingId}/allocate-seat`,
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      memberId: memberToAllocate._id,
      seatNumber: 15
    });
    assert(
      allocRes.status === 200 &&
      allocRes.body.data.allocatedSeats.includes(15),
      'Admin can manually allocate a specific seat number (Seat 15) to an offline booking member'
    );

    // 21. Admin send travel info email to confirmed passengers
    const sendInfoRes = await request(server, {
      path: `/api/admin/tours/${tourToBook._id}/send-travel-info`,
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      sendInfoRes.status === 200 && sendInfoRes.body.success && sendInfoRes.body.data.emailsSent > 0,
      `Admin can send travel information notifications to confirmed passengers (${sendInfoRes.body.data?.emailsSent} sent)`
    );

    // 22. Admin deletes a user
    const deleteUserRes = await request(server, {
      path: `/api/admin/users/${userId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteUserRes.status === 200 && deleteUserRes.body.success, 'Admin can remove a user and their bookings');

    // 23. Active & Completed Tour Status Toggle
    const statusCompletedRes = await request(
      server,
      {
        path: `/api/tours/${tourToBook._id}/status`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` }
      },
      { status: 'Completed' }
    );
    assert(
      statusCompletedRes.status === 200 && statusCompletedRes.body.data.status === 'Completed',
      'Admin can mark tour as "Completed"'
    );

    const statusActiveRes = await request(
      server,
      {
        path: `/api/tours/${tourToBook._id}/status`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` }
      },
      { status: 'Active' }
    );
    assert(
      statusActiveRes.status === 200 && statusActiveRes.body.data.status === 'Active',
      'Admin can reopen completed tour as "Active"'
    );

    // 24. Registered Users Manifest & Statistics Endpoint
    const regUsersRes = await request(server, {
      path: `/api/tours/${tourToBook._id}/registered-users`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      regUsersRes.status === 200 &&
      regUsersRes.body.data?.passengers?.length > 0 &&
      regUsersRes.body.data?.stats?.totalRevenue > 0,
      `Registered users manifest returns ${regUsersRes.body.data?.passengers?.length} passengers and financial summary`
    );

    // 25. Custom Row x Column Seating Grid Designer (e.g., 10 rows x 7 cols with back row full)
    const customGridCells = [];
    let seatCounter = 1;
    for (let r = 1; r <= 10; r++) {
      for (let c = 1; c <= 7; c++) {
        // Rows 1-9: columns 3,4,5 are aisle (disabled)
        if (r < 10 && (c === 3 || c === 4 || c === 5)) {
          customGridCells.push({ row: r, col: c, isSeat: false });
        } else {
          // Row 10 is full 7-seat back row; others have seats
          customGridCells.push({
            row: r,
            col: c,
            isSeat: true,
            seatNumber: seatCounter++,
            isBlockedByAdmin: false
          });
        }
      }
    }
    const expectedSeats = customGridCells.filter((c) => c.isSeat).length; // 9*4 + 7 = 43 seats

    const customGridTourRes = await request(
      server,
      {
        path: '/api/tours',
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      },
      {
        title: 'Custom Grid Volvo Bus Expedition',
        description: 'Advanced 10x7 alignment bus with full 7-seat back row.',
        destination: 'Ooty & Coonoor',
        startLocation: 'Bangalore Majestic',
        startDate: '2026-11-20',
        endDate: '2026-11-25',
        pricePerPerson: 4500,
        totalSeats: expectedSeats,
        availableSeats: expectedSeats,
        vehicleType: 'Volvo Multi-Axle Bus',
        seatingGrid: {
          rows: 10,
          columns: 7,
          cells: customGridCells
        }
      }
    );
    assert(
      customGridTourRes.status === 201 &&
      customGridTourRes.body.data.seatingGrid?.rows === 10 &&
      customGridTourRes.body.data.seatingGrid?.columns === 7 &&
      customGridTourRes.body.data.totalSeats === expectedSeats,
      `Custom 10x7 row-column seating grid saved with ${expectedSeats} seats and full back row`
    );
    const customTourId = customGridTourRes.body.data._id;

    // 26. Admin Seat Enable / Disable (Block/Unblock)
    const blockSeatRes = await request(
      server,
      {
        path: `/api/admin/tours/${customTourId}/toggle-seat-block`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` }
      },
      { seatNumber: 2 }
    );
    assert(
      blockSeatRes.status === 200 && blockSeatRes.body.data.isBlockedByAdmin === true,
      'Admin can block/disable a seat (Seat #2 disabled)'
    );

    const publicSeatingRes = await request(server, {
      path: `/api/tours/${customTourId}/seating`
    });
    assert(
      publicSeatingRes.status === 200 &&
      publicSeatingRes.body.data.blockedSeats.includes(2) &&
      !publicSeatingRes.body.data.availableSeatNumbers.includes(2),
      'Public seating layout reflects admin-blocked seat (Seat #2 disabled for booking)'
    );

    const unblockSeatRes = await request(
      server,
      {
        path: `/api/admin/tours/${customTourId}/toggle-seat-block`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` }
      },
      { seatNumber: 2 }
    );
    assert(
      unblockSeatRes.status === 200 && unblockSeatRes.body.data.isBlockedByAdmin === false,
      'Admin can unblock/enable a seat (Seat #2 re-enabled)'
    );

    // 27. Visitor Gallery & Upcoming Tour Program CRUD
    const createGalleryRes = await request(
      server,
      {
        path: '/api/gallery',
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      },
      {
        title: 'Munnar Tea Hills Panorama',
        description: 'Breathtaking sunrise over the Western Ghats tea plantations.',
        mediaType: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2',
        category: 'Kerala',
        isUpcomingTourProgram: true,
        upcomingProgram: {
          tourTitle: 'Munnar & Thekkady Holiday Special',
          destination: 'Kerala',
          dates: '10 Dec – 15 Dec 2026',
          itineraryBrief: '3 nights in Munnar tea estates, wildlife boat safari in Periyar.',
          relatedTourId: customTourId
        },
        order: 1
      }
    );
    assert(
      createGalleryRes.status === 201 &&
      createGalleryRes.body.data.isUpcomingTourProgram === true &&
      createGalleryRes.body.data.upcomingProgram.dates === '10 Dec – 15 Dec 2026',
      'Admin can create gallery photo item with upcoming tour program details'
    );
    const galleryItemId = createGalleryRes.body.data._id;

    const getGalleryRes = await request(server, {
      path: '/api/gallery?upcomingOnly=true'
    });
    assert(
      getGalleryRes.status === 200 && getGalleryRes.body.data.some((i) => i._id === galleryItemId),
      'Public can filter gallery items by upcoming tour programs'
    );

    const updateGalleryRes = await request(
      server,
      {
        path: `/api/gallery/${galleryItemId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` }
      },
      { title: 'Updated Munnar Misty Peaks' }
    );
    assert(
      updateGalleryRes.status === 200 && updateGalleryRes.body.data.title === 'Updated Munnar Misty Peaks',
      'Admin can update gallery item metadata'
    );

    const deleteGalleryRes = await request(server, {
      path: `/api/gallery/${galleryItemId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      deleteGalleryRes.status === 200 && deleteGalleryRes.body.success,
      'Admin can delete gallery item'
    );

    // 28. Bug Fix: Tour soft-delete preserves customer booking history ("Tour Name Unavailable")
    const deleteTourWithBookingsRes = await request(server, {
      path: `/api/tours/${tourToBook._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      deleteTourWithBookingsRes.status === 200 &&
      deleteTourWithBookingsRes.body.message.includes('safely archived as "Unavailable"'),
      'Removing tour with active bookings safely archives it so user bookings display "Tour Name Unavailable" without breaking'
    );

  } catch (err) {
    console.error('Test Suite Exception:', err);
    failCount++;
  } finally {
    server.close();
    console.log(`\n🏁 Test Suite Finished: ${passCount} passed, ${failCount} failed.\n`);
    process.exit(failCount === 0 ? 0 : 1);
  }
};

runTests();

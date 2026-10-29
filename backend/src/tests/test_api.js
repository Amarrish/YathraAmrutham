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

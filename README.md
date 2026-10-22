# WanderWise Tours & Travels — Full-Stack MERN Platform (Web & Native Mobile)

A comprehensive, production-ready Tours & Travel booking system built with **MongoDB, Express.js, React.js (Vite + Tailwind CSS), and React Native (Expo)**.

---

## 🌟 Key Architecture & Features

### 1. Two Dedicated Roles (User & Admin)
- **Customer User:**
  - Secure registration & login with **bcryptjs** (10 salt rounds) and **JWT**.
  - **Forgot Password with 6-digit OTP:** Generates cryptographic OTP, logged in server terminal and sent via email/SMTP.
  - Interactive tour discovery with real-time seat tracking and vehicle filters.
  - **Dynamic Booking Engine:**
    - Passenger manifest repeater: Name, Age, Gender, Child toggle, optional photo/ID upload, address, and contact.
    - **20% Advance Pre-Registration Fee Calculation:**
      $$\text{Total Fee} = \text{Seats} \times \text{PricePerPerson}$$
      $$\text{Advance Fee (20\%)} = 0.20 \times \text{Total Fee}$$
      $$\text{Remaining Balance (80\%)} = 0.80 \times \text{Total Fee}$$
    - **Non-Refundable Advance Warning Dialog:** High-priority notice alert requiring explicit policy agreement before proceeding.
    - **Payment Options:**
      - **Online Payment:** Instant digital payment simulation reserving seats immediately.
      - **Offline Payment:** Bank transfer / UPI reference number submission; marked as `Offline Verification Pending`.
  - **User Dashboard:**
    - Active reservations, digital boarding passes, vehicle details, departure points, and payment status badges.

- **Admin Operations:**
  - **Tour Catalog Management (CRUD):**
    - Add, edit, remove, and archive tours.
    - Full vehicle specifications (`Volvo Multi-Axle Bus`, `Force Tempo Traveller`, `Toyota Innova Crysta SUV`, `Luxury AC Sleeper Coach`).
    - Configurable total seats and real-time available seats.
    - Departure date, return date, and starting pickup location.
  - **Offline Payment Verification:**
    - Review customer UPI/bank reference numbers.
    - One-click **"Verify & Confirm Advance"**: Automatically transitions booking to `Confirmed`, records received advance, and decrements available seats.
    - Ability to record remaining 80% balance upon departure.
  - **User Management & Direct Password Reset:**
    - View all registered users and their booking statistics.
    - Directly reset any user's password from the admin panel.

---

## 📁 Project Structure

```
d:\tours-and-travel-mern\
├── backend/                       # Node.js + Express + MongoDB REST API
│   ├── src/
│   │   ├── config/db.js          # Mongoose connection
│   │   ├── controllers/          # Auth, Tours, Bookings, Admin controllers
│   │   ├── middlewares/          # JWT auth, role guard, Multer uploads
│   │   ├── models/               # User, Tour, Booking schemas
│   │   ├── routes/               # API endpoint routers
│   │   ├── seed/seedData.js      # Seed script (Admin, User, Tours, Bookings)
│   │   ├── tests/test_api.js     # 15 automated backend integration tests
│   │   ├── utils/                # OTP service & email transporter
│   │   ├── app.js                # Express app setup & CORS
│   │   └── server.js             # HTTP server entry point
│   ├── uploads/                  # Uploaded tour and member images
│   ├── package.json
│   └── .env
│
├── frontend-web/                  # React (Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── api/client.js         # Axios client with JWT interceptors
│   │   ├── context/AuthContext.jsx # Auth state, tokens, user roles
│   │   ├── components/           # Navbar, Footer, TourCard, AdvanceWarningModal, ProtectedRoute
│   │   ├── pages/                # Home, TourDetails, BookingPage, UserDashboard, Login, Register, ForgotPassword
│   │   │   └── admin/            # AdminDashboard, ManageTours, ManageBookings, ManageUsers
│   │   ├── App.jsx               # Routes setup
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
└── frontend-mobile/               # Cross-Platform React Native (Expo) Native App
    ├── src/
    │   ├── api/client.js         # Mobile Axios client
    │   ├── context/AuthContext.js# Mobile auth provider
    │   ├── components/           # AdvanceModal, StatusBadges
    │   ├── screens/              # ExploreScreen, TourDetailScreen, BookingScreen, MyBookingsScreen, LoginScreen, RegisterScreen, ForgotPasswordScreen, ProfileScreen
    │   └── navigation/           # AppNavigator (Native Stack + Bottom Tabs)
    ├── App.js
    ├── app.json
    └── package.json
```

---

## 🔑 Demo & Test Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@travel.com` | `admin123` | Full Admin Console, Manage Tours, Verify Payments, Reset Passwords |
| **Customer** | `john@travel.com` | `user123` | Book Tours, 20% Advance, My Bookings Dashboard, Forgot Password OTP |

---

## 🚀 How to Run the Applications

### 1. Backend Server
```bash
cd d:\tours-and-travel-mern\backend
npm start
# API runs on: http://localhost:5000
# Run automated tests: npm test
# Re-seed test data: npm run seed
```

### 2. React Web Application
```bash
cd d:\tours-and-travel-mern\frontend-web
npm run dev
# Web application runs on: http://localhost:5173
```

### 3. Native Mobile Application (Expo)
```bash
cd d:\tours-and-travel-mern\frontend-mobile
npx expo start
# Scan QR code with Expo Go app on iOS or Android, or press 'a' for Android emulator
```

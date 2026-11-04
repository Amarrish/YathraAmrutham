# Tours & Travel MERN — Working Notes

**Last Updated:** 2026-11-04  
**Branch:** `main`  
**Latest Commit:** `2ebb61a`  
**Repo:** `d:\tours-and-travel-mern`

---

## ⚠️ Environment Notes

- **All `npm`, `git`, and Node.js commands on `d:\` subdirs** require `BypassSandbox: true` (EPERM otherwise).
- **PowerShell does NOT support `&&`** — run commands separately, not chained.
- **Tailwind CSS v4**: use `@import "tailwindcss"` — NO `@tailwind base/components/utilities` directives.

---

## Default Credentials

| Role  | Email              | Password  |
|-------|--------------------|-----------|
| Admin | admin@travel.com   | admin123  |
| User  | john@travel.com    | user123   |

---

## Test Status

| Suite        | Tests | Passed | Failed |
|--------------|-------|--------|--------|
| Backend API  | 36    | 36     | 0      |

Run: `npm test` inside `backend/` (requires `BypassSandbox: true`)

## Build Status

- **Frontend:** Vite build ✅ 0 errors (548.52 kB bundle — normal chunk size warning only)  
- Run: `npm run build` inside `frontend-web/` (requires `BypassSandbox: true`)

---

## Completed Features (All Sessions)

### Session 1 — Core Platform
- Auth (JWT, bcrypt) — register/login for users & admin
- Tour CRUD (admin), tour listing (public)
- Booking flow (user) with seat selection
- User dashboard with booking history
- Admin dashboard with stats

### Session 2 — Seating, Payments & User Management
- Admin: edit/remove users (full access)
- Bug fix: `availableSeats` correctly stored vs `totalSeats`
- Vehicle type selector with total seats
- Seating chart for users (visual seat picker)
- Admin seating chart: view/reassign booked seats
- Confirm message after payment + seat selection
- Travel info SMS/email (stub — Twilio/Nodemailer placeholders)
- Offline user: admin can allocate seat manually
- Online payment: UPI / Netbanking redirect simulation (`PaymentGateway.jsx`)
- Offline payment: cash-at-office, seat held until admin verification

### Session 3 — Tour Lifecycle, Gallery, Seat Design & Exports
- **Active / Completed Tours** — separate tabs in Manage Tours; "Mark as Completed / Reopen" one-click toggle
- **Registered Users Manifest** — per-tour passenger list modal; CSV + `.doc` download; revenue stats
- **Bookings & Payments by Tour** — active tour cards in Bookings section with direct payment actions
- **Custom Seat Alignment Designer** (`SeatAlignmentDesigner.jsx`) — rows × columns grid (e.g. 10×7); aisle cell disable; last-row full-width; presets (Wide Bus, 2+2 Bus, 2+1 SUV); capacity auto-calc; integrated into Add/Edit Tour modal
- **Admin Seat Block/Unblock** — toggle any free seat as blocked/unblocked; booked seats disabled for users; admin can reassign seat between users
- **Visitor Gallery** (`/gallery`) — photos, videos, upcoming programs tabs; lightbox; YouTube/native video player; Book Tour CTA
- **Admin Gallery Manager** (`/admin/gallery`) — upload/edit/delete media; upcoming tour program sub-fields (title, destination, dates, itinerary, linked tour)
- **Bug Fix: Removed Tours** — soft-delete (`isDeleted: true`) preserves booking history; user dashboard shows "Tour Name Unavailable (Removed by Admin)" gracefully
- **Navbar** — added "Gallery & Programs" (public) + "Gallery Manager" (admin) links
- **Routes** — `/gallery` and `/admin/gallery` wired in `App.jsx`
- **36 Backend Tests** — covers all new endpoints; 0 failures

---

## New Files Added (Session 3)

### Backend
| File | Purpose |
|------|---------|
| `backend/src/models/Gallery.js` | Gallery schema (photos, videos, upcoming programs) |
| `backend/src/controllers/galleryController.js` | CRUD for gallery items |
| `backend/src/routes/galleryRoutes.js` | Public GET + Admin POST/PUT/DELETE |

### Frontend
| File | Purpose |
|------|---------|
| `frontend-web/src/components/SeatAlignmentDesigner.jsx` | Interactive grid designer for custom seat layouts |
| `frontend-web/src/components/RegisteredUsersModal.jsx` | Passenger manifest modal with CSV+doc export |
| `frontend-web/src/pages/Gallery.jsx` | Public gallery page |
| `frontend-web/src/pages/admin/ManageGallery.jsx` | Admin gallery management console |

---

## Modified Files (Session 3)

### Backend
- `backend/src/models/Tour.js` — added `'Completed'` status, `isDeleted`, `seatingGrid`
- `backend/src/controllers/tourController.js` — `updateTourStatus`, `getTourRegisteredUsers`, soft-delete, seatingGrid support
- `backend/src/controllers/adminController.js` — `toggleSeatBlock`, `getTourSeatingChart` returns `blockedSeats` + `seatingGrid`
- `backend/src/routes/tourRoutes.js` — `PUT /:id/status`, `GET /:id/registered-users`
- `backend/src/routes/adminRoutes.js` — `PUT /tours/:tourId/toggle-seat-block`
- `backend/src/app.js` — mounted `/api/gallery`
- `backend/src/tests/test_api.js` — expanded to 36 tests
- `backend/src/seed/seedData.js` — 5 tours (Kerala 10×7, Tamil Nadu, Karnataka, Kerala Completed, Goa), 7 gallery items

### Frontend
- `frontend-web/src/App.jsx` — added `/gallery` and `/admin/gallery` routes
- `frontend-web/src/components/Navbar.jsx` — gallery links (public + admin)
- `frontend-web/src/components/SeatMap.jsx` — accepts `seatingGrid`, `blockedSeats`
- `frontend-web/src/pages/BookingPage.jsx` — passes `blockedSeats` and `seatingGrid` to `SeatMap`
- `frontend-web/src/pages/UserDashboard.jsx` — "Tour Name Unavailable" banner, seat numbers per member
- `frontend-web/src/pages/admin/AdminDashboard.jsx` — Gallery & Programs quick-access button
- `frontend-web/src/pages/admin/AdminSeatChart.jsx` — block/unblock toggle, `RegisteredUsersModal`, stats
- `frontend-web/src/pages/admin/ManageBookings.jsx` — active tour cards, tour-specific filters, defensive `isDeleted` handling
- `frontend-web/src/pages/admin/ManageTours.jsx` — Active/Completed tabs, Mark as Completed/Reopen, `SeatAlignmentDesigner`

---

## API Endpoints Added (Session 3)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/api/tours/:id/status` | Admin | Toggle Active ↔ Completed |
| GET | `/api/tours/:id/registered-users` | Admin | Passenger manifest for a tour |
| PUT | `/api/admin/tours/:tourId/toggle-seat-block` | Admin | Block/unblock a free seat |
| GET | `/api/gallery` | Public | List gallery items |
| POST | `/api/gallery` | Admin | Add gallery item |
| PUT | `/api/gallery/:id` | Admin | Edit gallery item |
| DELETE | `/api/gallery/:id` | Admin | Delete gallery item |

---

## Potential Future Work

- Mobile app (`frontend-mobile`) — port Gallery and seating features
- Real Twilio SMS integration (replace stub in `sendTravelInfo`)
- Real Razorpay / Stripe integration (replace `PaymentGateway.jsx` simulation)
- PDF export for passenger manifest (complement to CSV/.doc)
- Push notifications for booking confirmation

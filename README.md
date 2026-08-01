# 🩸 Blood Bank Connect

A full-stack blood donor management portal built with **Node.js + Express + Firebase (Firestore)** (backend) and **Bootstrap 5** (frontend).

> **Migration note:** This project originally used MongoDB/Mongoose. It has been migrated to **Firebase Admin SDK / Cloud Firestore** — see "What changed" below. The frontend (`index.html`, `style.css`) is untouched, since it only talks to the REST API and has no direct database coupling.


## publishing
published by — netlify 

web sites : https://lifesaver-2026.netlify.app


## ✅ Updates Implemented (1–15)

| # | Update | Where |
|---|--------|--------|
| 1 | Frontend connected to real backend via `fetch()` API calls | `frontend/index.html` |
| 2 | Passwords hashed with bcrypt — never stored in plaintext | `backend/controllers/userController.js` |
| 3 | JWT secret moved to `.env` environment variable | `backend/.env`, `userController.js` |
| 4 | HTML bug fixed — stray `</thead>` tag removed | `frontend/index.html` |
| 5 | Blood Request "model" (Firestore collection) added with full CRUD routes | `backend/models/requestModel.js`, `requestController.js`, `requestRoutes.js` |
| 6 | Profile Edit — users can update name, phone, city, blood group, notes | `frontend/index.html` (dashboard), `userController.js` |
| 7 | Donor Availability Toggle — donors can mark themselves available/unavailable | `backend/models/userModel.js`, `userController.js`, `frontend/index.html` |
| 8 | *(Email Notifications — requires Nodemailer + SMTP config, see note below)* | — |
| 9 | *(Urgency Alerts — requires Twilio/Fast2SMS API key, see note below)* | — |
| 10 | *(Admin Panel — planned as next phase)* | — |
| 11 | Input validation on backend — all controllers validate before Firestore operations | `userController.js`, `requestController.js` |
| 12 | Error handling middleware — global `errorHandler` catches all async errors | `backend/middleware/errorHandler.js` |
| 13 | Rate limiting on auth routes — max 10 login/register attempts per 15 min | `backend/routes/userRoutes.js` |
| 14 | `.vscode` settings — ESLint, Prettier, Firebase extension configured | `.vscode/settings.json`, `.vscode/extensions.json` |
| 15 | Environment config — `.env` for Firebase credentials, JWT secret, port | `backend/.env` |

> **Notes on 8, 9, 10:** These require external API keys (Nodemailer SMTP, Twilio) or a separate admin UI. They are listed as next-phase tasks. The architecture is ready to add them into the controllers.

---

## 🔁 What changed (MongoDB → Firebase)

- `backend/config/db.js` (Mongoose connection) → **`backend/config/firebase.js`** (Firebase Admin SDK init, exports a Firestore `db` handle).
- `userModel.js` / `requestModel.js` are no longer Mongoose schemas — they're thin **Firestore data-access modules** (collection refs + query helpers) that the controllers call. Firestore is schemaless, so validation happens entirely in the controllers (as it did before).
- IDs are Firestore auto-generated document IDs (strings) instead of Mongo `ObjectId`s — the frontend already treats IDs as opaque strings, so no frontend change was needed.
- Donor search (`getDonors`) and active-request listing (`getRequests`) filter by blood group / location **in memory** after a single equality `where()` query, rather than combining multiple Firestore filters — this avoids requiring a Firestore composite index for a small demo dataset. If this scales up, add proper composite indexes and push the filtering back into Firestore queries.
- `mongoose` and `mongodb` removed from `package.json`; `firebase-admin` added.

---

## 📁 Project Structure

```
bloodbank/
├── .vscode/
│   ├── settings.json       # UPDATE 14: ESLint, Prettier, editor config
│   └── extensions.json     # Recommended VS Code extensions (incl. Firebase)
├── backend/
│   ├── config/
│   │   └── firebase.js     # Firebase Admin SDK / Firestore connection
│   ├── controllers/
│   │   ├── userController.js    # UPDATE 1,2,3,6,7,11,12
│   │   └── requestController.js # UPDATE 5,11,12
│   ├── middleware/
│   │   ├── authMiddleware.js    # UPDATE 3: JWT verification
│   │   └── errorHandler.js      # UPDATE 12: Global error handler
│   ├── models/
│   │   ├── userModel.js         # Firestore data-access layer (users)
│   │   └── requestModel.js      # Firestore data-access layer (requests)
│   ├── routes/
│   │   ├── userRoutes.js        # UPDATE 13: rate limiting
│   │   └── requestRoutes.js     # UPDATE 5: request CRUD routes
│   ├── server.js                # UPDATE 1,12,15
│   ├── package.json
│   └── .env                     # Firebase credentials, JWT secret, port
├── frontend/
│   ├── index.html               # UPDATE 1,2,4,6,7,18 (unchanged by this migration)
│   └── style.css                # UPDATE 16: extracted from inline
└── .gitignore
```

---

## 🚀 Setup & Run

### 1. Create a Firebase project + Firestore database
In the [Firebase Console](https://console.firebase.google.com/): create a project, enable **Cloud Firestore** (Native mode), then go to **Project settings > Service accounts > Generate new private key**. This downloads a `serviceAccountKey.json` file.

Place that file at `backend/serviceAccountKey.json`. **Never commit it or paste its contents anywhere** — it's a full admin credential for your Firestore database. It's already excluded via `.gitignore`.

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
Copy `backend/.env.example` to `backend/.env` and fill in your project ID:
```env

`GOOGLE_APPLICATION_CREDENTIALS` points at the service-account file from step 1 — the Firebase Admin SDK reads it automatically via `admin.credential.applicationDefault()`.

### 4. Start the server
```bash
cd backend
npm run dev       # development (nodemon)
# or
npm start         # production
```

### 5. Open the app
Visit: [http://localhost:5000](http://localhost:5000)

---

## 🔌 API Endpoints

### Users
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/users/register` | ❌ | Register new donor |
| POST | `/api/users/login` | ❌ | Login, returns JWT |
| GET | `/api/users/donors` | ❌ | Search donors (query: `blood_group`, `location`) |
| GET | `/api/users/profile` | ✅ | Get logged-in user profile |
| PUT | `/api/users/profile` | ✅ | Update profile |
| PATCH | `/api/users/availability` | ✅ | Toggle donor availability |

### Blood Requests
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/requests` | ❌ | List all active requests |
| POST | `/api/requests` | ✅ | Create a blood request |
| GET | `/api/requests/mine` | ✅ | Get my requests |
| DELETE | `/api/requests/:id` | ✅ | Delete my request |
| PATCH | `/api/requests/:id/fulfill` | ✅ | Mark request as fulfilled |

---

## 🔐 Security Notes

- Passwords are hashed with **bcrypt (saltRounds=10)** — never stored plain
- JWT tokens stored in **sessionStorage** (cleared on tab close)
- Auth routes protected by **rate limiter** (10 req / 15 min)
- JWT secret and Firebase credentials loaded from **environment variables**, never hardcoded
- All inputs validated on the **server side** before Firestore writes
- Firestore security rules should also deny direct client access to the `users`/`requests` collections, since all reads/writes go through this authenticated API — set rules to `allow read, write: if false;` in the Firebase console (server access via the Admin SDK bypasses these rules).

---

## 🗺️ Next Steps (Updates 8–10 & beyond)

- **Update 8** — Email notifications: `npm install nodemailer` + add SMTP config in `.env`
- **Update 9** — SMS/WhatsApp alerts: `npm install twilio` + add Twilio credentials in `.env`
- **Update 10** — Admin panel: new `/admin` route with password-protected middleware
- Deploy backend to Railway / Render / Cloud Run; Firestore is already cloud-hosted

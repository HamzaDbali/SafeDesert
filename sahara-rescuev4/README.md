# 🏜️ SaharaResque — React + Vite Frontend

A mobile-first prototype app built with React + Vite, displayed in a phone frame on desktop.

## 📁 Project Structure

```
src/
├── api/
│   └── index.js              ← All axios calls to all 5 microservices
├── context/
│   └── AppContext.jsx         ← Global state: auth, navigation, toast
├── hooks/
│   └── index.js              ← useLiveCoords, useSyncProgress, useFetch, useToggle
├── components/
│   ├── ui/
│   │   └── index.jsx         ← Button, Card, Badge, Toggle, Input, Avatar, Spinner...
│   ├── layout/
│   │   └── index.jsx         ← PhoneFrame, BottomNav, TopBar, ScreenShell
│   ├── map/
│   │   └── index.jsx         ← TopoBackground, MapPin, CoordsBar, SOSButton, SearchBar, ReportFAB
│   ├── auth/
│   │   └── index.jsx         ← LoginForm, SignupForm
│   ├── report/
│   │   └── index.jsx         ← ReportForm, TypeSelector, GPSCard
│   ├── sos/
│   │   └── index.jsx         ← SOSModal, ActiveSOSList, SOSCard, MySOSHistory
│   ├── sync/
│   │   └── index.jsx         ← SyncStatusCard, SyncProgress, SyncItemRow, SyncNowButton, SyncHistory
│   ├── profile/
│   │   └── index.jsx         ← ProfileHeader, ProfileActions, ProfileStats, EmergencyCard, SavedRegions, SettingsPanel
│   └── verification/
│       └── index.jsx         ← VerifyButtons, VerificationCount
├── screens/
│   └── index.jsx             ← AuthScreen, MapScreen, ReportScreen, SyncScreen, ProfileScreen
├── App.jsx                   ← Root: PhoneFrame wrapper + desktop sidebar nav
├── main.jsx
└── index.css
```

## 🔌 API Endpoints Used

| Component           | Service     | Port | Endpoint               |
|---------------------|-------------|------|------------------------|
| LoginForm           | Auth        | 3001 | POST /login            |
| SignupForm          | Auth        | 3001 | POST /signup           |
| ProfileActions      | Auth        | 3001 | PATCH /profile/:id     |
| MapScreen           | Location    | 3002 | GET /all               |
| ReportForm          | Location    | 3002 | POST /add              |
| VerifyButtons       | Verification| 3005 | POST /add              |
| SOSModal            | SOS         | 3003 | POST /send             |
| ActiveSOSList       | SOS         | 3003 | GET /active            |
| SOSCard             | SOS         | 3003 | PUT /resolve/:id       |
| SyncScreen          | Sync        | 3004 | POST /sync, GET /last  |
| SyncHistory         | Sync        | 3004 | GET /mine              |

## 🚀 Setup

```bash
# 1. Install dependencies
npm install

# 2. Make sure all 5 backend services are running:
#    Auth        → port 3001
#    Location    → port 3002
#    SOS         → port 3003
#    Sync        → port 3004
#    Verification→ port 3005

# 3. Start the frontend
npm run dev

# Opens at http://localhost:5173
```

## 📱 Features

- **Phone frame** on desktop with sidebar screen switcher
- **Auth** — login / signup with JWT stored in localStorage
- **Map** — topo background, live GPS coords, location pins from API, verify pins inline
- **Report** — select type, live GPS, submit to Location API
- **SOS** — send SOS with live coords, resolve own alerts, view active alerts
- **Sync** — animated progress, sync to API, view history
- **Profile** — edit username, emergency info, saved regions, settings

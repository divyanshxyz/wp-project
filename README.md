# Player Details Module 🎯

A full-stack web application for managing player information with a REST API backend and interactive web interface. Built for easy player CRUD operations with real-time filtering and statistics.

![alt text](./images/ss.png)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [Usage Guide](#usage-guide)
- [Database Schema](#database-schema)
- [Architecture & Design](#architecture--design)
- [Troubleshooting](#troubleshooting)

---

## 📱 Overview

The **Player Details Module** is a sports player management system that allows users to:
- **Create** new player records with comprehensive details
- **View** all players with sorting and statistics
- **Update** existing player information
- **Delete** players from the database
- **Search & Filter** players in real-time
- **Track Statistics** like total goals, average age, and position counts

This is a **single-page application (SPA)** with a clean, modern sports-themed interface and RESTful API backend.

---

## ✨ Features

### Frontend Features
- ⚡ **Real-time Search** — Filter players by name instantly without page reload
- 📊 **Live Statistics** — View aggregate stats (total players, goals, average age, positions)
- 📝 **Add/Edit Players** — Intuitive form for creating and updating player records
- 🗑️ **Delete Players** — Remove players with confirmation
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile devices
- 🎨 **Dark Theme UI** — Modern industrial aesthetic with electric amber accents
- ✅ **Form Validation** — Client and server-side validation for data integrity
- 🔄 **Toast Notifications** — Visual feedback for all user actions

### Backend Features
- 🔌 **RESTful API** — Clean HTTP endpoints for all CRUD operations
- 🗄️ **MongoDB Integration** — Persistent data storage
- 📦 **Static File Serving** — Single server for both API and frontend
- ⚠️ **Error Handling** — Comprehensive error messages and status codes
- 🚀 **Async/Await** — Non-blocking asynchronous operations
- ✔️ **Input Validation** — Required fields validation and type safety

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) | Interactive user interface |
| **Backend** | Node.js, Express.js | HTTP server & API routing |
| **Database** | MongoDB | Data persistence |
| **Runtime** | Node.js 14+ | JavaScript runtime environment |

### Dependencies
- `express` — Web framework for Node.js
- `mongodb` — Official MongoDB driver
- `path` — Node.js core module for file path handling

---

## 📂 Project Structure

```
WP Project/
├── server.js           # Express server & API routes
├── package.json        # Project dependencies & metadata
├── public/             # Static files served to browser
│   ├── index.html      # HTML structure & layout
│   ├── style.css       # Styling & theme
│   └── script.js       # Frontend logic & interactivity
├── README.md           # This file
└── explanation.md      # Detailed code documentation
```

### Key Files Breakdown

| File | Purpose | Key Responsibilities |
|------|---------|---------------------|
| `server.js` | Backend server | API routes, database connection, CRUD operations |
| `index.html` | HTML structure | Page layout, form, table, header |
| `style.css` | Styling | Dark theme, responsive layout, animations |
| `script.js` | Frontend logic | API calls, DOM manipulation, user interactions |

---

## 💻 Installation & Setup

### Prerequisites
- **Node.js** (v14.0.0 or higher) — [Download](https://nodejs.org/)
- **MongoDB** (running locally or accessible) — [Download](https://www.mongodb.com/try/download/community)
- **npm** (comes with Node.js)

### Step 1: Install Dependencies

```bash
cd "WP Project"
npm install
```

This installs `express` and `mongodb` packages from `package.json`.

### Step 2: Verify MongoDB Connection

Ensure MongoDB is running on your machine:

```bash
# On Windows (if installed as service, it starts automatically)
# Or manually start MongoDB:
mongod

# Test connection (in another terminal):
mongo
```

MongoDB should be accessible at `mongodb://127.0.0.1:27017` by default.

### Step 3: Project Ready

Your workspace is now configured. The server is ready to start!

---

## 🚀 Running the Project

### Start the Server

```bash
node server.js
```

**Expected output:**
```
✅ Connected to MongoDB → playerdb
🎯 Server running on http://localhost:3000
```

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the Player Management dashboard with:
- Header with LNMIIT logo
- Statistics bar (Total Players, Total Goals, Average Age, Positions)
- Player search field
- Add/Edit player form on the left
- Player table on the right

### Stop the Server

Press `Ctrl + C` in the terminal to stop the server.

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/players
```

### 1. **GET /api/players** — Retrieve All Players
- **Method:** `GET`
- **URL:** `/api/players`
- **Response:** Array of all player documents
- **Status:** `200 OK`

**Example Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Cristiano Ronaldo",
    "position": "Forward",
    "team": "Manchester United",
    "age": 37,
    "goals": 140,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Lionel Messi",
    "position": "Forward",
    "team": "Inter Miami",
    "age": 36,
    "goals": 129,
    "createdAt": "2024-01-15T10:35:00.000Z"
  }
]
```

---

### 2. **POST /api/players** — Create New Player
- **Method:** `POST`
- **URL:** `/api/players`
- **Content-Type:** `application/json`
- **Required Fields:** `name`, `position`
- **Optional Fields:** `team` (defaults to "Free Agent"), `age`, `goals`
- **Status:** `201 Created`

**Request Body:**
```json
{
  "name": "Lionel Messi",
  "position": "Forward",
  "team": "Inter Miami",
  "age": 36,
  "goals": 129
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Lionel Messi",
  "position": "Forward",
  "team": "Inter Miami",
  "age": 36,
  "goals": 129,
  "createdAt": "2024-01-15T10:35:00.000Z"
}
```

---

### 3. **PUT /api/players/:id** — Update Player
- **Method:** `PUT`
- **URL:** `/api/players/:id` (replace `:id` with the player's MongoDB `_id`)
- **Content-Type:** `application/json`
- **Status:** `200 OK`

**Request Body:**
```json
{
  "name": "Leo Messi",
  "position": "Forward",
  "team": "Paris Saint-Germain",
  "age": 36,
  "goals": 130
}
```

**Response:**
```json
{
  "success": true,
  "modifiedCount": 1
}
```

---

### 4. **DELETE /api/players/:id** — Delete Player
- **Method:** `DELETE`
- **URL:** `/api/players/:id`
- **Status:** `200 OK` (player deleted) or `404 Not Found`

**Response:**
```json
{
  "success": true,
  "deletedCount": 1
}
```

---

## 📖 Usage Guide

### Adding a Player

1. Fill in the form fields on the left:
   - **Name** (required): Player's full name
   - **Position** (required): e.g., Forward, Midfielder, Defender, Goalkeeper
   - **Team** (optional): Club name (defaults to "Free Agent")
   - **Age** (optional): Player's age
   - **Goals** (optional): Total career goals

2. Click **"Add Player"** button
3. A success toast notification appears
4. The new player appears in the table immediately
5. Statistics update automatically

### Editing a Player

1. Click the **"Edit"** button on any player row
2. The form populates with that player's data
3. Form title changes to "Edit Player"
4. Modify the fields as needed
5. Click **"Update Player"** button
6. The table updates immediately

### Deleting a Player

1. Click the **"Delete"** button on any player row
2. Confirm the deletion in the modal dialog
3. The player is removed from the database
4. The table updates immediately
5. Statistics recalculate

### Searching Players

1. Type in the **"Search Players"** field at the top
2. Table filters in real-time to show matching results
3. Search checks the player's name
4. Clear the field to see all players again

---

## 🗄️ Database Schema

### Collection: `players`

Each player document has the following structure:

```javascript
{
  _id: ObjectId,           // MongoDB auto-generated unique ID
  name: String,            // Player's full name (required)
  position: String,        // Playing position (required)
  team: String,            // Club name (optional, defaults to "Free Agent")
  age: Number,             // Player's age (optional, defaults to 0)
  goals: Number,           // Total goals scored (optional, defaults to 0)
  createdAt: Date          // Timestamp of record creation
}
```

### Sample Document
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "name": "Lionel Messi",
  "position": "Forward",
  "team": "Inter Miami",
  "age": 36,
  "goals": 129,
  "createdAt": ISODate("2024-01-15T10:35:00.000Z")
}
```

### Database & Collection Names
- **Database:** `playerdb`
- **Collection:** `players`
- **Connection String:** `mongodb://127.0.0.1:27017`

---

## 🏗️ Architecture & Design

### Overall Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (CLIENT)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │           index.html + style.css               │  │
│  │        Displays UI & user interactions          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              script.js (Frontend Logic)          │  │
│  │  • Fetch API calls to backend                   │  │
│  │  • DOM manipulation                             │  │
│  │  • Local state management (allPlayers array)    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
              ↕ HTTP (JSON over REST)
┌─────────────────────────────────────────────────────────┐
│                  NODE.js + EXPRESS (SERVER)             │
│  ┌──────────────────────────────────────────────────┐  │
│  │           server.js (Backend Logic)             │  │
│  │  • HTTP routing (GET, POST, PUT, DELETE)        │  │
│  │  • Request validation                           │  │
│  │  • MongoDB operations (CRUD)                    │  │
│  │  • Error handling & logging                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
              ↕ MongoDB Driver
┌─────────────────────────────────────────────────────────┐
│                    MONGODB (DATABASE)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  playerdb.players (Collections of documents)    │  │
│  │  Persistent storage of player information       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow for Adding a Player

```
User fills form & clicks "Add Player"
         ↓
script.js validates & calls fetch(POST /api/players)
         ↓
server.js receives POST request
         ↓
Validates: name & position required
         ↓
MongoDB insertOne() creates new document
         ↓
server.js responds with 201 + new player object
         ↓
script.js receives response, adds to allPlayers array
         ↓
script.js re-renders table & updates statistics
         ↓
Toast notification shows success
         ↓
User sees new player in table
```

### Key Design Decisions

#### 1. **Single-Page Application (SPA)**
- No page reloads — only data updates
- Faster user experience
- State managed in client-side `allPlayers` array

#### 2. **RESTful API**
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Stateless backend — each request is independent
- Easy to test, extend, and document

#### 3. **Async/Await Pattern**
- Cleaner, more readable code than callbacks or Promises
- Better error handling with try/catch
- Non-blocking operations

#### 4. **Module-Level State**
- `db` connection shared across all route handlers
- Avoids reconnecting for every request
- Simple singleton pattern

#### 5. **CSS Variables (Custom Properties)**
- Centralized color/sizing values
- Easy theme changes
- Better maintainability

---

## 🐛 Troubleshooting

### Issue: "MongoDB connection error"
**Cause:** MongoDB server is not running
**Solution:**
```bash
# Start MongoDB
mongod

# Verify it's running (in another terminal):
mongo
```

### Issue: "Port 3000 already in use"
**Cause:** Another process is using port 3000
**Solution:**
```bash
# Option 1: Kill the process (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Option 2: Use a different port
# Edit server.js, change const PORT = 3000 to PORT = 3001
```

### Issue: "Cannot find module 'express'"
**Cause:** Dependencies not installed
**Solution:**
```bash
npm install
```

### Issue: Empty player list after server start
**Expected behavior** — Database might be empty
**Solution:**
1. Click "Add Player" to create a new record
2. Or check MongoDB directly:
   ```bash
   mongo
   use playerdb
   db.players.find()
   ```

### Issue: Changes not appearing in table
**Cause:** Frontend cache or script not loaded
**Solution:**
1. Hard refresh browser: `Ctrl + Shift + R` (Windows)
2. Check browser console for JavaScript errors: `F12`
3. Check server logs in terminal

### Issue: Form not submitting
**Cause:** Validation error or network issue
**Solution:**
1. Check that Name and Position fields are filled
2. Open browser console (`F12 → Console`) and look for error messages
3. Verify server is running and accessible at `http://localhost:3000`

---

## 📝 Notes

- **No build step required** — Uses vanilla JavaScript, no Webpack or bundler
- **No authentication** — Assumes single-user or trusted environment
- **No pagination** — Works well for ~1000 players; consider adding for larger datasets
- **No logging** — Consider adding Winston or Morgan for production
- **Local MongoDB only** — For production, use a managed MongoDB service like MongoDB Atlas

---

## 📖 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Driver for Node.js](https://www.mongodb.com/docs/drivers/node/)
- [MDN Web Docs - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [RESTful API Best Practices](https://restfulapi.net/)

---

## 👨‍💻 Author

Created for LNMIIT Player Management System

---

**Last Updated:** May 1, 2026

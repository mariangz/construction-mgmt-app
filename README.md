# Construction Management App

An offline-first web application for managing construction sites, tasks, and reports. Built with SvelteKit.

## 🚀 Features

-   **Task Management**: Create, assign, and track construction tasks with ease.
-   **Daily Reports**: Generate and manage detailed site reports to keep everyone informed.
-   **Offline Support**: Powered by PouchDB for seamless data synchronization and offline capabilities.
-   **Interactive Site Map**: View and manage site locations using integrated maps.
-   **Responsive Design**: Optimized for both desktop and mobile devices in the field.

## 🛠 Tech Stack

-   **Frontend**: [SvelteKit](https://kit.svelte.dev/)
-   **Styling**: [Pico.css](https://picocss.com/)
-   **Database**: [PouchDB](https://pouchdb.com/) (Offline-first / Browser-based)
-   **Mapping**: [Leaflet](https://leafletjs.com/)

## 🏁 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/mariangz/construction-mgmt-app.git
    cd construction-mgmt-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Developing

Start the development server:

```bash
npm run dev
```

## ☁️ Database & Sync Setup

The app works offline by default using PouchDB. To sync data across devices, you'll need CouchDB.

### 1. Install CouchDB
- **Manual**: Download from [couchdb.apache.org](https://couchdb.apache.org/) and follow the installer.

### 2. Enable CORS
PouchDB needs CORS enabled to talk to CouchDB:
1. Open Fauxton (CouchDB Web UI): `http://localhost:5984/_utils`
2. Go to **Settings** -> **CORS**.
3. Click **Enable CORS**.
4. Choose **All domains (*)**

### 3. Connect the App
1. Open the app in your browser.
2. Go to **Settings** from the home screen.
3. Enter your CouchDB URL (`http://localhost:5984`), username, password, and a display name.
4. Click **Save Settings**.

## 📁 Project Structure

-   `src/lib`: Core logic, database configuration (`db.js`), and reusable components.
-   `src/routes`: SvelteKit pages and layouts.
    -   `/tasks`: Task listing and management.
    -   `/reports`: Daily site reports.
    -   `/settings`: Application configuration.


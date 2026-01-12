# Construction Management App

A modern, offline-first web application for managing construction sites, tasks, and reports. Built with SvelteKit.

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
-   **Build Tool**: [Vite](https://vitejs.dev/)

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

## 📁 Project Structure

-   `src/lib`: Core logic, database configuration (`db.js`), and reusable components.
-   `src/routes`: SvelteKit pages and layouts.
    -   `/tasks`: Task listing and management.
    -   `/reports`: Daily site reports.
    -   `/settings`: Application configuration.


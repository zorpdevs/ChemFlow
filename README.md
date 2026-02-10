# ChemFlow

**ChemFlow** is a comprehensive chemical equipment data visualization and analysis platform. It provides a seamless experience across Web and Desktop environments for managing, analyzing, and reporting on chemical plant equipment data.

![ChemFlow Logo](src/assets/logo.svg)

## 🚀 Features

-   **Data Management**: Upload and process CSV files containing chemical equipment data.
-   **Interactive Dashboard**: Visualize key metrics like Flow Rate, Pressure, and Temperature.
-   **Charts & Graphs**:
    -   Equipment Type Distribution (Pie Chart)
    -   Global Parameter Averages (Bar Chart)
-   **Detailed Reporting**: View granular data in tables and generate downloadable PDF reports.
-   **Cross-Platform Access**:
    -   **Web App**: Modern React-based interface.
    -   **Desktop App**: Native Windows application built with PyQt5.
-   **Secure Authentication**:
    -   Firebase Authentication (Email/Password)
    -   Google OAuth 2.0 Integration (Web & Desktop)

## 🛠️ Tech Stack

### Frontend (Web)
-   **Framework**: React (Vite)
-   **Styling**: CSS3, Lucide React (Icons)
-   **Visualization**: Chart.js, React-Chartjs-2
-   **Auth**: Firebase SDK

### Backend (API)
-   **Framework**: Django, Django Rest Framework (DRF)
-   **Data Processing**: Pandas
-   **PDF Generation**: ReportLab
-   **Database**: SQLite (Default) / Extensible to PostgreSQL

### Desktop Application
-   **GUI**: PyQt5
-   **Plotting**: Matplotlib
-   **Auth**: Google Auth OAuthlib, Requests

---

## 📦 Installation & Setup

### Prerequisites
-   Node.js (v16+)
-   Python (v3.8+)
-   Firebase Project with Authentication enabled (Email/Password & Google)

### 1. Backend Setup (Django)

```bash
cd backend
# Create virtual environment (optional but recommended)
python -m venv venv
# Activate: .\venv\Scripts\activate (Windows) or source venv/bin/activate (Mac/Linux)

# Install dependencies
pip install django djangorestframework django-cors-headers pandas reportlab

# Run migrations
python manage.py migrate

# Start the server
python manage.py runserver
```
*The backend runs on `http://localhost:8000`*

### 2. Frontend Setup (React)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
*The web app runs on `http://localhost:5173`*

### 3. Desktop App Setup (PyQt)

```bash
cd desktop
# Install dependencies
pip install PyQt5 requests pandas matplotlib google-auth-oauthlib

# Run the application
python main.py
```

---

## 🔑 Authentication Configuration

### Firebase Setup (Web & Desktop)
1.  Create a project in the [Firebase Console](https://console.firebase.google.com/).
2.  Enable **Authentication** and turn on **Email/Password** and **Google** providers.
3.  Copy your firebase config keys into `src/firebase.js`.

### Google OAuth for Desktop
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create **OAuth 2.0 Credentials** for a **Desktop App**.
3.  Download the JSON file, rename it to `client_secret.json`, and place it in the `desktop/` directory.

## 📄 License
This project is licensed under the MIT License.

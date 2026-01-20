# 📚 Library Booking System

![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Full%20Stack-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A robust, production-grade **Room Reservation Platform** designed to demonstrate modern web development practices, cloud infrastructure integration, and QA automation readiness.

🔗 **Live Demo:** [https://library-booking-system-m61q.vercel.app](https://library-booking-system-m61q.vercel.app)  
📄 **API Documentation (Swagger):** [https://library-booking-system.onrender.com/docs](https://library-booking-system.onrender.com/docs)

---

## 🚀 Project Overview

This project was developed to simulate a real-world booking scenario with strict business logic validation. It features a responsive Frontend, a high-performance RESTful Backend, and a serverless PostgreSQL Database, all deployed on separate cloud providers to mimic an enterprise microservices architecture.

**Key Objectives:**
- Implementing strict **Timezone Synchronization** (Asia/Bangkok) across Client/Server.
- Enforcing **Business Logic Constraints** (e.g., Operating hours, No double booking).
- Designing a **Testable API Architecture** suitable for Automation Testing (Playwright/Postman).

---

## 🛠 Tech Stack & Architecture

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) + TypeScript | Modern UI with TailwindCSS for styling. |
| **Backend** | Python (FastAPI) | High-performance async API with Pydantic validation. |
| **Database** | PostgreSQL (Neon) | Serverless cloud database managed via SQLAlchemy ORM. |
| **Deployment** | Vercel (FE) + Render (BE) | CI/CD enabled cloud hosting. |
| **Authentication** | JWT (JSON Web Tokens) | Secure stateless authentication with bcrypt hashing. |

---

## 📖 User Manual & Features

### 1. Authentication (Security First)
The system is protected. Users must authenticate to access booking features.
- **Registration:** Navigate to the "Sign Up" page. Create an account (e.g., `admin@test.com`). Passwords are hashed using `bcrypt` before storage.
- **Login:** Access the system securely. The backend issues a JWT token valid for the session.
- **Session Persistence:** Refreshing the browser does not log the user out (Local Storage implementation).

### 2. Room Discovery & Filtering
- **Dashboard:** View all available rooms (Type A, B, C) with real-time capacity and status.
- **Filtering:** Use the top filter bar to toggle between specific room types instantly.

### 3. Making a Reservation (Core Logic)
- **Select a Room:** Click on any available room card.
- **Time Selection:** Choose a Start and End time.
    - ✅ **Validation 1:** Users cannot select times in the past.
    - ✅ **Validation 2:** Operating Hours are strictly enforced (08:00 - 20:00). Attempting to book outside this window triggers a backend logic error.
    - ✅ **Validation 3:** Double Booking Prevention. The system checks database records to ensure no overlaps exist before confirming.
- **Confirmation:** Upon success, the user is redirected to the dashboard.

### 4. Booking Management & Cancellation
- **My Bookings:** Navigate to the "My Bookings" tab via the Navbar.
- **Time Display:** All booking times are automatically converted and displayed in **Local Thai Time** (GMT+7), resolving common UTC offset issues.
- **Cancellation:**
    1. Click the "Cancel" button on any active booking.
    2. A **Confirmation Dialog** appears (Safety Guard).
    3. Confirming removes the booking instantly from the database and updates the UI.

### 5. API Documentation (For QA/Devs)
- Click the **"API Documentation"** link in the Navbar.
- Access the interactive **Swagger UI** to test endpoints directly (`GET /rooms`, `POST /bookings`, etc.) without using the Frontend.

---

## ⚙️ Local Installation (For Developers)

If you wish to run this project locally, follow these steps:

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL Database URL

### 1. Clone the Repository
```bash
git clone https://github.com/FolkFizz/library-booking-system.git
cd library-booking-system
```

### 2. Backend Setup

Set up the Python virtual environment and install dependencies.
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# For Mac/Linux:
source venv/bin/activate
# For Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Configuration:** Create a `.env` file in the root directory and add your credentials:
```env
DATABASE_URL=your_neon_postgres_connection_string
SECRET_KEY=your_secret_key_here
```

### 3. Frontend Setup

Navigate to the frontend directory to launch the React application.
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## 🧪 QA & Testing Highlights

As a QA-focused project, special attention was given to:

- **Error Handling:** Clear error messages for 400 (Bad Request), 401 (Unauthorized), and 500 (Server Error).
- **Data Integrity:** Ensuring `created_at` and `booking_time` are consistent across timezones.
- **Edge Case Handling:** Testing boundaries (e.g., booking exactly at 20:00, or overlapping slots).

---

## 👨‍💻 Author

**Tanakrit Eiadra (FolkFizz)**  
Aspiring QA Automation Engineer | Tech Enthusiast

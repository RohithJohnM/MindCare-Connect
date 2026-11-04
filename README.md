# MindCare Connect
### AI-Powered Mental Wellness and Counselor Support Platform

<p align="center">
  <strong>A MERN Stack Application for Accessible Mental Wellness Support</strong>
</p>

## 🌐 Live Application

- **Live Website:** https://mindcare-connect.bytexl.live/
- **Admin Dashboard:** https://mindcare-connect.bytexl.live/admin/dashboard

*Note: Dashboard access requires authentication and appropriate user privileges. The live application may be unavailable when the ByteXL workspace or server is stopped.*

---

## 📌 Project Overview

**MindCare Connect** is a web-based mental wellness support platform developed using the MERN stack. The platform aims to make wellness resources, counselor access, appointment management and mood tracking available through a unified digital environment.

It provides separate interfaces for users, counselors and administrators, enabling each role to access relevant features and manage their activities.

The platform also integrates Google's Gemini API to provide an AI-powered wellness assistant that offers supportive conversations and relevant wellness resource recommendations.

## 🎯 Project Objectives

- Provide a centralized platform for mental wellness support.
- Enable users to connect with counselors and request appointments.
- Help users monitor their emotional well-being through mood journaling.
- Provide accessible educational and wellness resources.
- Integrate AI to deliver supportive wellness interactions.
- Implement secure authentication and role-based access control.
- Provide administrators with tools to manage platform activities.

## ✨ Key Features

### 1. User Module
- User registration and secure login.
- Personalized user dashboard.
- Counselor directory and profile browsing.
- Appointment booking and status tracking.
- Daily mood recording and mood history.
- Wellness resource library.
- AI-powered wellness assistant.

### 2. Counselor Module
- Counselor dashboard.
- Counselor profile management.
- Appointment request management.
- Appointment confirmation and rejection.
- Appointment history and status tracking.

### 3. Administrator Module
- Administrative dashboard.
- User management.
- Counselor application review and approval.
- Appointment monitoring.
- Wellness resource management.
- Platform activity overview.

### 4. AI Wellness Assistant
- AI-powered supportive conversations using Google Gemini.
- Sentiment-aware responses.
- Contextual wellness resource recommendations.
- User consent before AI interaction.
- Basic crisis phrase detection and emergency guidance.

*The AI assistant is intended for supportive wellness interactions and is not a substitute for professional mental healthcare or emergency services.*

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt |
| AI Integration | Google Gemini API |
| Development Tools | VS Code, npm, Git |
| Deployment | ByteXL, Docker |
| Version Control | Git, GitHub |

## 🏗️ System Architecture

The application follows a three-layer architecture:

1. **Presentation Layer:** React frontend provides role-based dashboards and user interfaces.
2. **Application Layer:** Express.js and Node.js handle API requests, authentication, authorization and application logic.
3. **Data Layer:** MongoDB stores user accounts, counselor profiles, appointments, mood entries and wellness resources.

The AI Wellness Assistant communicates with the Google Gemini API through the backend.

## 📂 Project Structure

```text
MindCare-Connect/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       └── pages/
│
├── middleware/
│   └── auth.js
│
├── models/
│   ├── User.js
│   ├── CounselorProfile.js
│   ├── Appointment.js
│   ├── MoodEntry.js
│   └── Resource.js
│
├── routes/
│   ├── auth.js
│   ├── counselors.js
│   ├── appointments.js
│   ├── mood.js
│   ├── resources.js
│   └── ai.js
│
├── index.js
├── package.json
├── Dockerfile
├── .env.example
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites
- Node.js and npm
- MongoDB database
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/RohithJohnM/MindCare-Connect.git
cd MindCare-Connect
```

### 2. Install Dependencies

```bash
npm run setup
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory using `.env.example` as the template.

Configure the following variables:

```env
PORT=5000

DB_HOST=your_database_host
DB_PORT=your_database_port
DB_NAME=your_database_name
DB_USER=your_database_username
DB_PASSWORD=your_database_password

JWT_SECRET=your_secure_jwt_secret

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Replace the placeholders with your actual configuration. Never upload `.env` or real credentials to GitHub.

### 4. Run the Application

```bash
npm run dev
```

The application starts the backend server and React development server.

## 🗄️ Database Modules

MongoDB is used to manage the following major entities:

| Collection / Model | Purpose |
|---|---|
| User | Stores user accounts and roles |
| CounselorProfile | Stores counselor information and availability |
| Appointment | Manages counseling appointments |
| MoodEntry | Stores user mood journal entries |
| Resource | Stores published wellness resources |

## 🔐 Security and Access Control

- Password hashing using bcrypt.
- JWT-based authentication.
- Role-based authorization for users, counselors and administrators.
- Protected application routes and API endpoints.
- Environment-based configuration for sensitive credentials.
- Consent-based access to the AI Wellness Assistant.

## 📊 Project Outcome

MindCare Connect brings together counselor discovery, appointment management, mood journaling, wellness resources and AI-assisted support in a single application.

The application was tested across its three primary roles: user, counselor and administrator. Core workflows, including authentication, appointment booking and management, mood entries, resource access and AI assistant interactions, were tested successfully in the demonstration environment.

## 🚀 Future Enhancements

- Real-time counselor communication.
- Online video consultation integration.
- Advanced mood analytics and visualization.
- Appointment reminders and notifications.
- Improved AI personalization and safety evaluation.
- Production-grade privacy and security enhancements.

## 👨‍💻 Repository

**GitHub:** https://github.com/RohithJohnM/MindCare-Connect

Developed as a MERN-stack mental wellness platform integrating web technologies, database management and AI-assisted support.

---

**MindCare Connect — Supporting Better Mental Wellness Through Technology.**
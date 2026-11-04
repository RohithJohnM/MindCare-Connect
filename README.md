# MindCare Connect

MindCare Connect is a MERN-stack mental wellness support platform
that connects users with counselors and provides tools for
self-monitoring and wellness support.

## Features

### User
- Register and log in securely.
- Browse the counselor directory.
- Request and manage counseling appointments.
- Record and review mood journal entries.
- Access wellness resources.
- Use the AI Wellness Assistant with consent.

### Counselor
- Manage counselor profile information.
- View appointment requests.
- Confirm, reject, and manage appointments.
- Review appointment history.

### Administrator
- View platform information and dashboard statistics.
- Manage users and counselor profiles.
- Review and approve counselor applications.
- Manage published wellness resources.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt |
| AI integration | Google Gemini API |
| Deployment | Docker / ByteXL |

## Project Structure

```text
MindCare-Connect/
├── client/                  # React frontend
├── middleware/              # Authentication and authorization
├── models/                  # MongoDB models
├── routes/                  # Backend API routes
├── index.js                 # Express application entry point
├── Dockerfile               # Docker build configuration
├── .dockerignore
├── .env.example             # Environment variable template
├── package.json
└── README.md
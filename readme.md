# ECE Alumni Platform

A web platform connecting ECE alumni with students for mentorship, networking, and career guidance.

## Tech Stack

- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.IO
- **Storage:** Cloudinary

## Features

- User registration & authentication (JWT)
- Alumni & student profiles
- Mentorship connections
- Real-time messaging
- Payment integration (Razorpay)

## Getting Started

### Prerequisites

- Node.js
- MongoDB

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/pranayg-2003/ECE_Alumni_platform.git
   cd ECE_Alumni_platform
   ```

2. Setup Backend
   ```bash
   cd backend
   cp .env.example .env   # Fill in your environment variables
   npm install
   npm run dev
   ```

3. Setup Frontend
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm start
   ```

The app will run at `http://localhost:3000` (frontend) and `http://localhost:5000` (backend).

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for required variables.

---

## Team

- Jatin Gupta
- Nitish Bhagat
- Pranay Gupta

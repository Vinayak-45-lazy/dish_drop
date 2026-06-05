# 🍽️ DishDrop — Food Delivered Fast

DishDrop is a full-stack food delivery web application inspired by platforms like Swiggy and Zomato. It enables users to browse restaurants, place orders, and track deliveries in real-time, with AI-powered recommendations and a scalable backend system.

---

## 🚀 Features

* 🍔 Browse restaurants and explore menus
* 🛒 Add items to cart and place orders
* 💳 Razorpay test payment integration
* 📍 Real-time order tracking with maps
* 🤖 AI-powered food recommendations
* 🔍 Smart search (e.g., “spicy food under ₹200”)
* 💬 AI chatbot for user support
* 👨‍🍳 Restaurant dashboard (manage menu & orders)
* 🚚 Delivery agent dashboard (accept & deliver orders)
* 🛠️ Admin panel with analytics & control

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Tailwind CSS
* React Router

### Backend

* Node.js
* Express.js

### Database & Auth

* Firebase Firestore
* Firebase Authentication

### AI & Integrations

* Groq API (LLM)
* LangChain

### Other Tools

* Cloudinary (image uploads)
* Razorpay (test payments)
* Leaflet.js (maps & tracking)
* Nodemailer (email notifications)

---

## ⚡ Key Highlights

* Built a complete multi-role system (Customer, Admin, Owner, Delivery Agent)
* Designed and implemented 10+ REST APIs
* Integrated AI for recommendations and chatbot
* Real-time tracking using maps
* Scalable and modular backend architecture

---

## 👥 User Roles

* **Customer:** Browse, order, track food
* **Restaurant Owner:** Manage menu and orders
* **Delivery Agent:** Accept and deliver orders
* **Admin:** Monitor platform and analytics

---

## 📂 Project Structure

```
dishdrop/
├── client/        # React frontend
├── server/        # Node.js backend
├── routes/        # API routes
├── controllers/   # Business logic
├── services/      # External integrations
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-link>
cd dishdrop
```

### 2. Backend Setup

```bash
cd server
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install
npm start
```

---

## 🔐 Environment Variables

Create a `.env` file in the server folder:

```
PORT=5000
GROQ_API_KEY=your_api_key
FIREBASE_CONFIG=your_config
RAZORPAY_KEY=your_test_key
```

---

## 📌 Use Case

* Users can order food seamlessly with real-time tracking
* Restaurants can manage orders efficiently
* Delivery agents can handle deliveries with live updates
* Admin can monitor and manage the platform

---

## 👨‍💻 Author

**Vinayak G Sanamani**
Full Stack Developer | DevOps & AWS Enthusiast

---

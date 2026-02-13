# 🏦 Finova Bank

A secure, role-based digital banking platform built with the MERN stack. Finova Bank simulates real-world banking operations with authentication, money transfers, transaction tracking, and loan management — featuring a clean modern UI and scalable backend architecture.

---

## ✨ Key Features

### 👤 Customer Features
- **Secure Registration & Login** — JWT-based authentication
- **Automatic ₹5000 Welcome Bonus** — Instant account funding on signup
- **View Account Balance** — Real-time balance display
- **Send Money to Other Users** — Secure peer-to-peer transfers
- **Transaction History** — Complete transaction tracking with status updates
- **Apply for Loans** — Request loans with reason specification
- **View Loan Status** — Track pending, approved, and rejected applications

### 🛡️ Admin Features
- **View All Users** — Complete user management dashboard
- **View All Transactions** — System-wide transaction monitoring
- **Manage Loan Requests** — Approve or reject loan applications
- **System Statistics** — Key metrics and analytics

---

## 🧱 Tech Stack

### Frontend
- **React** (Vite) — Modern UI library
- **React Router DOM** — Client-side routing
- **Context API** — Global authentication state management
- **Axios** — HTTP client for API requests
- **Custom CSS** — Red & white modern responsive design

### Backend
- **Node.js** — JavaScript runtime
- **Express.js** — Web application framework
- **MongoDB** — NoSQL database
- **Mongoose** — MongoDB object modeling
- **JWT** — Secure token-based authentication
- **RESTful API** — Standard API architecture

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────┐
│    Client (React + Vite)            │
│    - Dashboard                      │
│    - Transactions                   │
│    - Loan Management                │
└──────────────┬──────────────────────┘
               │ Axios HTTP Requests
               ↓
┌─────────────────────────────────────┐
│    Express Server                   │
│    - Authentication Routes          │
│    - Transaction Routes             │
│    - Admin Routes                   │
└──────────────┬──────────────────────┘
               │ Mongoose ODM
               ↓
┌─────────────────────────────────────┐
│    MongoDB Database                 │
│    - Users                          │
│    - Accounts                       │
│    - Transactions                   │
│    - Loans                          │
└─────────────────────────────────────┘
```

**Key Architectural Highlights:**
- JWT Middleware protects private routes
- Role-based access control (Admin vs Customer)
- Atomic balance updates during transactions
- Secure server-side transaction processing

---

## 📂 Project Structure

```
FinovaBank/
│
├── banking-app-frontend/
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # Page components
│   │   ├── context/             # Auth context & state management
│   │   ├── services/            # API service layer
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx
│   ├── public/                  # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── banking-app-backend/
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Account.js
│   │   ├── Transaction.js
│   │   └── Loan.js
│   ├── controllers/             # Business logic
│   ├── routes/                  # API endpoints
│   ├── middleware/              # Auth & validation middleware
│   ├── server.js                # Express server setup
│   ├── .env                     # Environment variables
│   └── package.json
│
└── README.md
```

---

## 🔐 Authentication Flow

1. **User Registration**
   - User submits registration form
   - Backend validates input
   - Password hashed using bcrypt
   - User document created in MongoDB

2. **Account Creation**
   - Account document linked to User ID
   - Account number auto-generated
   - Balance initialized with ₹5000 welcome bonus
   - Transaction record created for bonus credit

3. **JWT Token Generation**
   - Server generates JWT token
   - Token includes user ID and role
   - Token sent to client

4. **Token Storage & Usage**
   - Token stored in browser localStorage
   - Included in Authorization header for protected routes
   - Middleware validates token on each request

5. **Protected Routes**
   - Backend validates JWT on protected endpoints
   - Role-based access enforcement
   - Unauthorized requests rejected

---

## 💸 Transaction Flow

1. **User Initiates Transfer**
   - Sender selects recipient and amount
   - Frontend validates input

2. **Backend Validation**
   - Verify sender exists
   - Verify receiver exists
   - Check sender has sufficient balance
   - Validate amount

3. **Transaction Processing**
   - Deduct amount from sender's balance
   - Credit amount to receiver's balance
   - Create transaction record with "completed" status
   - Update transaction counters

4. **Response**
   - Return updated balances
   - Return transaction confirmation
   - Update UI on frontend

**Security:** All balance operations handled exclusively on backend to prevent manipulation.

---

## 🗄️ Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['customer', 'admin']),
  createdAt: Date
}
```

### Account
```javascript
{
  userId: ObjectId (ref: User),
  accountNumber: String (unique),
  balance: Number,
  totalTransactionsCount: Number,
  totalTransactionsAmount: Number,
  createdAt: Date
}
```

### Transaction
```javascript
{
  senderId: ObjectId (ref: User),
  senderName: String,
  receiverId: ObjectId (ref: User),
  receiverName: String,
  amount: Number,
  status: String (enum: ['completed', 'pending', 'failed']),
  reference: String (unique),
  description: String,
  createdAt: Date
}
```

### Loan
```javascript
{
  userId: ObjectId (ref: User),
  amount: Number,
  reason: String,
  status: String (enum: ['pending', 'approved', 'rejected']),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new customer account |
| POST | `/api/auth/login` | Authenticate and receive JWT token |

### Account
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/account/info` | Get authenticated user's account details |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transaction/transfer` | Send money to another user |
| GET | `/api/transaction/history` | Get user's transaction history |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | View all users (admin only) |
| GET | `/api/admin/transactions` | View all transactions (admin only) |
| GET | `/api/admin/loans` | View all loan requests (admin only) |
| PUT | `/api/admin/loans/:loanId` | Update loan status (admin only) |

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn package manager

### 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/FinovaBank.git
cd FinovaBank
```

### 2️⃣ Backend Setup

```bash
cd banking-app-backend
npm install
```

**Create `.env` file:**

```env
PORT=5189
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

**Run Backend:**

```bash
npm run dev
```

Backend will start on: `http://localhost:5189`

### 3️⃣ Frontend Setup

```bash
cd banking-app-frontend
npm install
npm run dev
```

Frontend will start on: `http://localhost:5173`

### 4️⃣ Access the Application

Open your browser and navigate to `http://localhost:5173`

---

## 🎨 UI Highlights

- **Modern Design** — Clean red & white color scheme
- **Fully Responsive** — Works seamlessly on desktop, tablet, and mobile
- **Dashboard** — Account overview with balance and quick actions
- **Transaction Status Badges** — Visual indicators for transaction states
- **Admin Analytics** — Statistics cards and management interfaces
- **Intuitive Navigation** — Organized menu and user-friendly interface

---

## 🔒 Security Considerations

- **Password Hashing** — Passwords hashed with bcrypt before storage
- **JWT Authentication** — Token-based secure authentication
- **Role-Based Access Control** — Distinct permissions for customers and admins
- **Backend Balance Updates** — All financial operations handled on server
- **Protected Endpoints** — Middleware validates authentication on private routes
- **Input Validation** — Server-side validation of all user inputs
- **HTTPS Ready** — Prepared for secure HTTPS deployment

---

## 🚀 Potential Enhancements

- **Payment Gateway Integration** — Razorpay or Stripe integration
- **Email Notifications** — Transactional emails for transfers and loan updates
- **Pagination & Filtering** — Enhanced data browsing for large datasets
- **Analytics Dashboard** — Charts and graphs for financial insights
- **Docker Containerization** — Containerize frontend and backend
- **CI/CD Pipeline** — GitHub Actions for automated testing and deployment
- **Cloud Deployment** — Deploy to AWS, Render, Vercel, or Heroku
- **Two-Factor Authentication** — Enhanced security with 2FA
- **Mobile App** — React Native version for iOS and Android

---

## 📸 Screenshots

*Include screenshots of:*
- Login/Registration page
- Customer dashboard
- Transfer funds interface
- Transaction history
- Admin panel

---

## 🛠️ Development Guide

### Running Tests
```bash
npm test
```

### Building for Production
```bash
# Frontend
cd banking-app-frontend
npm run build

# Backend
# Set NODE_ENV=production in .env
```

### Code Standards
- Use ES6+ syntax
- Follow RESTful API conventions
- Component-based architecture for React
- Mongoose schema validation

---

## 📝 API Documentation

For detailed API documentation and example requests, refer to the API documentation file or use tools like Postman with the provided collection.

---

## 🐛 Troubleshooting

**MongoDB Connection Error**
- Verify MongoDB is running
- Check `MONGO_URI` in `.env` file
- Ensure correct credentials if using MongoDB Atlas

**CORS Issues**
- Check backend CORS configuration
- Verify frontend URL is whitelisted
- Restart both servers

**JWT Token Errors**
- Clear localStorage and re-login
- Verify `JWT_SECRET` is consistent
- Check token expiration settings

---

## 👨‍💻 Author

**Harsh Chauhan**
- B.Tech Computer Science Engineering
- Full-Stack Developer (MERN Stack)
- Cloud & DevOps Enthusiast

---

## 📄 License

This project is built for educational and portfolio purposes.

Feel free to use, modify, and distribute for learning purposes.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any improvements or bug fixes.

---

## 📞 Contact & Support

For questions, suggestions, or support, please reach out through:
- GitHub Issues
- Email: [your.email@example.com]
- LinkedIn: [Your LinkedIn Profile]

---

**Made with ❤️ for secure digital banking**

# 💰 Personal Expense Tracker

A full-stack personal finance management web application built to manage income, expenses, monthly budgets, savings goals, payments, and financial reports from one secure dashboard.

The application uses **Firebase Authentication** for user accounts and **Cloud Firestore** for persistent, user-isolated financial data.

---

## 🚀 Project Overview

Personal Expense Tracker provides a centralized system for managing personal finances.

Users can securely sign in, record income and expenses, monitor their current balance, create monthly budgets, track savings goals, generate UPI payment requests, maintain payment history, and analyze their financial activity through reports.

The application is fully responsive and designed to work across desktop, tablet, and mobile devices.

---

## ✨ Features

### 🔐 Authentication

- Email and Password authentication
- Google Sign-In
- Secure login and logout
- Persistent authentication sessions
- Protected application pages
- User-specific Firestore data isolation

### 📊 Dashboard

- Total income
- Total expenses
- Current balance
- Total savings
- Monthly budget overview
- Recent transactions
- Savings goal progress
- Quick navigation actions
- Real-time calculations from Firestore data

### 💵 Transactions

- Add income
- Add expenses
- Edit transactions
- Delete transactions
- Transaction history
- Search transactions
- Filter transactions
- Category support
- Automatic dashboard synchronization

### 💳 Payments

- Create UPI payment requests
- UPI ID support
- 10-digit UPI-registered mobile number support
- UPI QR scanning
- Payment QR generation
- Payment preview
- Copy payment information
- Open supported UPI payment links
- Pending payment tracking

### 📜 Payment History

- View generated payments
- Pending payment status
- Confirm payments
- Edit supported payment information
- View payment details
- Record confirmed payments as expenses
- Automatic transaction integration
- Payment status tracking

### 📈 Reports

- Income analysis
- Expense analysis
- Net balance calculation
- Financial summaries
- Transaction-based reporting
- Automatically synchronized financial data

### 🗓️ Monthly Budget

- Set monthly budgets
- Track current spending
- Calculate remaining budget
- Budget progress monitoring
- Automatic synchronization with expense transactions

### 🎯 Savings Goals

- Create savings goals
- Set target amounts
- Add savings contributions
- Track goal progress
- Manage existing goals
- Dashboard savings integration

### ⚙️ Settings

- User profile information
- Application preferences
- Account management
- Secure logout
- Account deletion support

### 📱 Responsive Design

- Desktop layout
- Tablet layout
- Mobile layout
- Collapsible mobile sidebar
- Responsive cards and forms
- Mobile-friendly navigation

---

## 🛠️ Technologies Used

### Frontend

- HTML5
- CSS3
- JavaScript (ES Modules)

### Backend / Cloud

- Firebase Authentication
- Cloud Firestore

### Authentication Providers

- Email / Password
- Google

### APIs & Browser Features

- UPI payment URI integration
- Camera API
- Barcode Detector API
- Clipboard API

---

## 🔥 Firebase Architecture

Financial information is stored separately for each authenticated user.

```text
users/
│
├── USER_UID_1/
│   ├── transactions/
│   ├── payments/
│   ├── budgets/
│   └── savingsGoals/
│
└── USER_UID_2/
    ├── transactions/
    ├── payments/
    ├── budgets/
    └── savingsGoals/
```

This prevents financial records from different accounts from being mixed together.

---

## 🔒 Firestore Security

Firestore security rules restrict users to their own data.

Example:

```javascript
rules_version = '2';

service cloud.firestore {

    match /databases/{database}/documents {

        match /users/{userId} {

            allow read, write:
                if request.auth != null
                && request.auth.uid == userId;

            match /{document=**} {

                allow read, write:
                    if request.auth != null
                    && request.auth.uid == userId;
            }
        }
    }
}
```

Authentication in the frontend is not relied upon as the only security layer. Firestore rules enforce user ownership at the database level.

---

## 📂 Project Structure

```text
EXPENSES TRACKER SYSTEM/
│
├── CSS/
│   ├── dashboard.css
│   ├── responsive.css
│   └── style.css
│
├── HTML/
│   ├── index.html
│   ├── dashboard.html
│   ├── transactions.html
│   ├── payments.html
│   ├── payment-history.html
│   ├── reports.html
│   ├── budget.html
│   ├── savings.html
│   └── settings.html
│
├── JS/
│   ├── firebase-config.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── transactions.js
│   ├── payments.js
│   ├── payment-history.js
│   ├── reports.js
│   ├── budget.js
│   ├── savings.js
│   └── settings.js
│
└── README.md
```

> The exact CSS and JavaScript files may vary as the project evolves.

---

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
```

### 2. Open the project

```bash
cd "EXPENSES TRACKER SYSTEM"
```

Open the folder in VS Code.

### 3. Configure Firebase

Create a Firebase project and enable:

- Firebase Authentication
- Email/Password authentication
- Google authentication
- Cloud Firestore

Add your Firebase web configuration to:

```text
JS/firebase-config.js
```

### 4. Configure Firestore Rules

Use UID-based Firestore security rules so authenticated users can access only their own financial records.

### 5. Run the application

Because the application uses JavaScript ES Modules, run it through a local web server instead of opening the HTML file directly.

For example, use the **Live Server** extension in VS Code and open:

```text
HTML/index.html
```

---

## 🧪 Testing

The application has been tested for:

- Authentication persistence
- Login and logout
- Protected-page access
- User data isolation
- Firestore security
- Transaction CRUD operations
- Budget synchronization
- Savings goal synchronization
- Payment creation
- Payment history
- Payment-to-expense integration
- Dashboard calculations
- Reports synchronization
- Input validation
- Error handling
- Desktop responsiveness
- Tablet responsiveness
- Mobile responsiveness

---

## 📸 Screenshots

Project screenshots can be added here before the final release.

Suggested screenshots:

1. Login Page
2. Dashboard
3. Transactions
4. Payments
5. Payment History
6. Reports
7. Monthly Budget
8. Savings Goals
9. Settings
10. Mobile Dashboard

---

## 🔮 Future Improvements

Potential features for future versions:

- Progressive Web App (PWA)
- Installable desktop/mobile experience
- Offline support
- Advanced financial charts
- Data export to CSV/PDF
- Automated backups
- Additional currencies
- More advanced financial analytics
- Notification/reminder system
- Improved payment integrations

---

## 🛡️ Privacy & Security

Financial records are stored in Cloud Firestore under the authenticated user's UID.

Firestore security rules enforce account-level data isolation.

Sensitive server credentials, Firebase Admin private keys, and service-account credentials should never be committed to this repository.

---

## 📌 Project Status

**Version:** V1.0  
**Status:** Final testing and deployment preparation

Core functionality is complete and has passed functional, responsive, authentication, data-isolation, and integration testing.

---

## 👨‍💻 Developer

Developed as an engineering web-development project focused on:

- Frontend development
- Firebase integration
- Authentication
- Cloud database management
- Responsive UI/UX
- Application security
- Real-world project architecture

---

## 📄 License

This project is intended for educational and personal use.
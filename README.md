
# Toornament Backend API

This is the backend service for the Toornament platform, an online system for creating, managing, and participating in gaming tournaments.

## Features

-   **User Authentication**: Secure OTP and password-based login with JWT (Access & Refresh Tokens).
-   **Team Management**: Users can create, join, and manage teams.
-   **Tournament Lifecycle**: Full support for creating, registering, starting, and managing tournaments.
-   **Match & Dispute System**: Result reporting and a structured dispute resolution system.
-   **Payment Integration**: Wallet system with payment gateway integration (Zarinpal).
-   **Background Jobs**: Automated jobs for managing tournament statuses and sending notifications.
-   **Role-Based Access Control (RBAC)**: Differentiated access levels for users, managers, and admins.

## Architecture

The project follows a layered architecture to ensure separation of concerns, maintainability, and scalability:

**Routes -> Middlewares -> Controllers -> Services -> Models**

## Prerequisites

-   Node.js (v16.x or later)
-   MongoDB
-   Redis

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd toornament-backend
````

### 2\. Install dependencies

```bash
npm install
```

### 3\. Environment Variables

Create a `.env` file in the root of the project by copying the `.env.example` file. Fill in the required environment variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000

# Database & Cache
MONGO_URI=mongodb://localhost:27017/toornament
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Security
CORS_ORIGIN=http://localhost:3000
JWT_ACCESS_SECRET=<YourStrongAccessSecret>
JWT_REFRESH_SECRET=<YourStrongRefreshSecret>

# Payment Gateway (Zarinpal)
ZARINPAL_MERCHANT_ID=<YourMerchantId>
ZARINPAL_SANDBOX=true
```

### 4\. Running the Application

  - **Development Mode**: Runs the server with `nodemon` for automatic restarts on file changes.

    ```bash
    npm run dev
    ```

  - **Production Mode**: Starts the server in production mode.

    ```bash
    npm start
    ```

### 5\. Running Tests

To run the integration and unit tests:

```bash
npm test
```

## API Documentation

API documentation is available via Swagger UI once the server is running. Access it at:

**`http://localhost:5000/api/v1/docs`**

```
```
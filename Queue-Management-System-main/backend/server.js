/**
 * ============================================================================
 * ENTRY POINT - BACKEND SERVER
 * ============================================================================
 * This file (server.js) initializes the Express application, sets up the HTTP 
 * server, and configures Socket.io for real-time WebSocket communication.
 * It also applies global middleware (CORS, JSON parsing) and mounts the API routes.
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

// Initialize Express app and HTTP server
const app = express();
const server = require('http').createServer(app);

// Initialize Socket.io for real-time bi-directional communication
const io = require('socket.io')(server, {
    cors: {
        origin: "*", // Allow all origins for the websocket connection
        methods: ["GET", "POST"]
    }
});

// Apply global middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON payloads

// Make the Socket.io instance globally accessible in controllers via req.app.get('socketio')
app.set('socketio', io);

/**
 * ----------------------------------------------------------------------------
 * SOCKET.IO REAL-TIME CONNECTION HANDLING
 * ----------------------------------------------------------------------------
 * Handles clients connecting to specific rooms to receive targeted live updates.
 */
io.on('connection', (socket) => {
    // 1. Join service room: Used to broadcast updates to all users waiting for a specific service.
    // e.g., "Queue length updated for Billing Service"
    socket.on('join_queue_room', (serviceId) => {
        socket.join(serviceId);
    });

    // 2. Join counter room: Used for Admins at a specific counter to receive updates
    // about their current serving ticket.
    socket.on('join_counter_room', (counterId) => {
        socket.join(`counter_${counterId}`);
    });

    // 3. Join user-specific room: Used to send personal notifications to a specific customer.
    // e.g., "Your ticket has been called to Counter 3"
    socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
    });

    // Handle client disconnect gracefully
    socket.on('disconnect', () => {
        // Disconnect logic (if any) goes here
    });
});

/**
 * ----------------------------------------------------------------------------
 * API ROUTE MOUNTING
 * ----------------------------------------------------------------------------
 */
const authRoutes = require('./routes/authRoutes');
const queueRoutes = require('./routes/queueRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

// Mount routes to their respective base paths
app.use('/api/auth', authRoutes);   // Authentication (Login, Register)
app.use('/api/queue', queueRoutes); // Queue operations (Join queue, check status)
app.use('/api/admin', adminRoutes); // Admin & Super Admin tasks (Counters, Services)
app.use('/api/users', userRoutes);  // User profile & Notifications

// Basic health check routes
app.get('/', (req, res) => {
    res.send('API is running...');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend is healthy' });
});

// Error handling middleware (catches 404s and unhandled errors)
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

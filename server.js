import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const uri = "mongodb+srv://mongoku:WMwAVIcY0LZUBtqW@pina-chan.pxlz1kb.mongodb.net/?retryWrites=true&w=majority&appName=pina-chan";

mongoose.connect(uri, {
  dbName: 'komentar',
}).then(() => {
  console.log("✅ MongoDB connected");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
});

// Enhanced Chat Schema
const chatSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: "text", enum: ["text", "image", "file"] },
  timestamp: { type: Date, default: Date.now, index: true },
  seenBy: [{ type: String }]
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);

// Track active users
const activeUsers = new Map();

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // Handle joining room
  socket.on('joinRoom', async ({ roomId, username }) => {
    try {
      socket.join(roomId);
      activeUsers.set(socket.id, { roomId, username });
      
      // Notify others in the room
      socket.to(roomId).emit('userJoined', { username, timestamp: new Date() });
      
      // Send welcome message and room info
      const roomMessages = await Chat.find({ roomId }).sort({ timestamp: 1 }).limit(100);
      const roomUsers = Array.from(activeUsers.values())
        .filter(user => user.roomId === roomId)
        .map(user => user.username);
      
      socket.emit('roomData', {
        messages: roomMessages,
        users: [...new Set(roomUsers)] // Unique usernames
      });
      
      console.log(`${username} joined room ${roomId}`);
    } catch (err) {
      console.error('Join room error:', err);
    }
  });

  // Handle new messages
  socket.on('sendMessage', async (data) => {
    try {
      const newMessage = new Chat({
        roomId: data.roomId,
        senderId: socket.id,
        senderName: data.senderName,
        message: data.message,
        type: data.type || 'text'
      });
      
      const savedMessage = await newMessage.save();
      
      // Broadcast to room
      io.to(data.roomId).emit('newMessage', savedMessage);
      
      // Update seenBy
      await Chat.updateOne(
        { _id: savedMessage._id },
        { $addToSet: { seenBy: socket.id } }
      );
    } catch (err) {
      console.error('Message save error:', err);
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ roomId, username }) => {
    socket.to(roomId).emit('userTyping', username);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const userData = activeUsers.get(socket.id);
    if (userData) {
      socket.to(userData.roomId).emit('userLeft', {
        username: userData.username,
        timestamp: new Date()
      });
      activeUsers.delete(socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

// API Routes
app.post('/api/messages', async (req, res) => {
  try {
    const message = new Chat(req.body);
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/messages/:roomId', async (req, res) => {
  try {
    const messages = await Chat.find({ roomId: req.params.roomId })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms/:roomId/users', (req, res) => {
  const users = Array.from(activeUsers.values())
    .filter(user => user.roomId === req.params.roomId)
    .map(user => user.username);
  res.json([...new Set(users)]);
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
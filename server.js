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
  console.error("❌ Gagal konek MongoDB:", err);
});

// Mongoose Chat Schema
const chatSchema = new mongoose.Schema({
  roomId: String,
  senderId: String,
  senderName: String,
  message: String,
  type: { type: String, default: "text" },
  timestamp: { type: Date, default: Date.now },
  seenBy: [String]
});

const Chat = mongoose.model('Chat', chatSchema);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const chat = new Chat(data);
      await chat.save();
      
      // Broadcast to room
      io.to(data.roomId).emit('newMessage', chat);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ===== REST API ROUTES =====

// POST: Kirim pesan baru
app.post('/chat', async (req, res) => {
  try {
    const chat = new Chat(req.body);
    await chat.save();
    res.status(201).json({ success: true, message: "Pesan dikirim", data: chat });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal kirim pesan", error: err.message });
  }
});

// GET: Ambil semua chat dari satu room
app.get('/chat/:roomId', async (req, res) => {
  try {
    const chats = await Chat.find({ roomId: req.params.roomId }).sort({ timestamp: 1 });
    res.json({ success: true, data: chats });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal ambil chat", error: err.message });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server start
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
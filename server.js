const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const DATA_FILE = path.join(__dirname, 'messages.json');
let messages = [];
const MAX_HISTORY = 500;

// Load persisted messages if the file exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    messages = JSON.parse(raw) || [];
  }
} catch (err) {
  console.error('Failed to read message history:', err);
  messages = [];
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  // Send recent history to the connecting client
  try {
    socket.emit('history', messages);
  } catch (err) {
    console.error('Failed to send history:', err);
  }

  // Listen for chat messages (expect object with text, username, id, time)
  socket.on('chat message', (msg) => {
    if (!msg) return;
    // normalize message object
    const entry = {
      text: (msg.text || String(msg || '')).slice(0, 2000),
      username: msg.username || 'Anonymous',
      id: msg.id || socket.id,
      time: msg.time || new Date().toISOString(),
    };

    // append and persist
    messages.push(entry);
    if (messages.length > MAX_HISTORY) messages = messages.slice(-MAX_HISTORY);
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));
    } catch (err) {
      console.error('Failed to persist messages:', err);
    }

    // Broadcast message to all clients
    io.emit('chat message', entry);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

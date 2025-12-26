const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const axios = require('axios');

let messages = [];
try {
  messages = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
} catch (e) {
  messages = [];
}

const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com', // Outlook SMTP
  port: 587,
  secure: false,
  auth: {
    user: 'arhan.patil@hotmail.com', // Your email
    pass: 'Arohan@12' // Your regular email password
  }
});
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const mongoUrl = 'mongodb+srv://arhanpatil_db_user:1uq12tWWvfHVmKkr@chatroom.0lc2ugz.mongodb.net/chatroom?retryWrites=true&w=majority';

mongoose.connect(mongoUrl)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const GITHUB_APP_ID = process.env.GITHUB_APP_ID || '2471295';
const GITHUB_PRIVATE_KEY = process.env.GITHUB_PRIVATE_KEY || `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA9N8Aj6LGfJsUyK/0nMzvaWIbgbacjtPd5ojhlJVFPZcA6SNj
04R+4Bk/sdamgnMOTRPN1C1Hug/ooh7ThqlfL+6p7EtlK/gCCgT6ZsnTBSJiXO0S
EKjZ/EB02xI3RprCdX8is3/r4QzA8K2i+/KzqoeyxdQzL1tzr0ZesxqQ19Q7xFpa
MxItiB253+5G6wF8IciT7Sx6BxcwC+rSFTBd5dRc1uvdHDYbOi61v0hdc8kHi3jE
NQjA0ff4Z1dRI8RT/hxhbmbdCx7eomWrZnX2Jci/kq6wa4kicpahdkoJdd/qium6
GzTM8gX1M1qs8gqi37pAU2lsUTq9jz5J2CN6RQIDAQABAoIBAAsSJgFYd6bckBT+
t417Snu2Ps4fhnaCp66rk59XHFlLgXQI8JN4kw/otFODA+Yz83qSoaStI2gLHhZu
VFvrPm15Wd9gDUPuo5D2ZqfNCihaRJ407bMpHynjdCUPbsZXauFLDTOWXgC/xd1b
zFmdwHe+SNve2y2R8eoDwXZRhijrzeAn06I13i+suYOOWXFC/3CK5GwT/NcwK7Zl
9+rwfZtdQHG5ojXBEWl1BhlZCxJGH5uNQDVMnQ7cMogq3crFAaawucqU8pwgYtN2
eG4kzaGh1oqbI1AvRwi99eLB/MnYegUw7xlqFk/oBmdLxQERpCtlik2obJXL6J3g
7fIuFMUCgYEA+0I3qaixtYCd+8f8Mxilsa5sWBM6hYdGJwsSNq8xXWuV/PZGdeQ6
8/6SqDDdj/BIph7be+SDor4U6rXXOXqzG2bwa1Ky3TPztBlQUW+ISa6sSZ7+uf21
vtiPOH0DrD81fb0UFN8KASWwD7M6n16m794aRAec2aPmDLR2XzFnhTcCgYEA+X3t
fHBT0gKU+vsDh7ddMvJWiNXZVqIdrfngGK9QQYxmTq+mtG0BiEzD69Qg+101vfxO
2l4ZmzqSUrHPwXc7hSqJJOjsUJ35DxLdM4zlklXOma7Eyq7rY5mY8CBAcRmGwPw8
FufpgIuX9wMBLsRSZhun9cyOmptRMv1hNBS3umMCgYEA5J6r50QH7w7IsYCWiiez
HKmJC9rzNOyReJUqTXe7gzWRlErCciLpQXoyF7fe4knQ0Nbi/yg+XqZ2gdpTq4lp
z1UrDXyCI6RR613dJzxE1kaJnbN+M94WsUB7kPqvjNs24OJak2Mex0xzltWOUdTe
MQP3Ak+q+J2ZhZXu308k0qECgYEA3yEUaBo9nLDadKxRt+rx20KIydAXlDdgu9uh
4/HGoRjj1rOZL/vdRv0Aq8UHykbObZ9dFkbaN83mVzbXS3tLLAmipfP6hQ8DU8vX
MOdt2bYME74OGgbeVjFkaj0t5PijX602QHYgiupNeoihYiYKW2+Yg2fykaser6+U
Y3Oz7WkCgYAd5VjaIAGCI4tAYtiWWsJOfvjjcIk946DUmGdSkJ9y3eFpzsxvxvYO
ROLMNomjjHmNEa4u76zTsA3GqcvZN6oFd7vQaW1aw8COd4htRizJfQQOOcYEswQS
R+1t+tTaAKZmR9ku64UUbnixkxRx8qsh6AqOAaMavcn1yPVSGOiJTw==
-----END RSA PRIVATE KEY-----`;
const GITHUB_INSTALLATION_ID = process.env.GITHUB_INSTALLATION_ID || '99570858';
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'Coding-with-Pineapple';
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || 'ChatRoom';
const GITHUB_ISSUE_NUMBER = process.env.GITHUB_ISSUE_NUMBER || '1';

// Step 1: Create a JWT (JSON Web Token)
function createJWT() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now,
    exp: now + (10 * 60), // 10 minutes
    iss: GITHUB_APP_ID
  };
  try {
    return jwt.sign(payload, GITHUB_PRIVATE_KEY, { algorithm: 'RS256' });
  } catch (error) {
    console.error('Error creating JWT:', error.message);
    throw error;
  }
}

// Step 2: Exchange JWT for an Installation Access Token
async function getInstallationAccessToken() {
  const jwtToken = createJWT();
  const url = `https://api.github.com/app/installations/${GITHUB_INSTALLATION_ID}/access_tokens`;
  try {
    const response = await axios.post(url, {}, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    return response.data.token;
  } catch (error) {
    console.error('Error getting installation access token:', error.response?.data || error.message);
    throw error;
  }
}

// Step 3: Use the Installation Token
async function useInstallationToken() {
  try {
    const token = await getInstallationAccessToken();
    // Example: Get the repositories for the installation
    const url = 'https://api.github.com/installation/repositories';
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    console.log('Repositories:', response.data.repositories);
    return response.data;
  } catch (error) {
    console.error('Error using installation token:', error.response?.data || error.message);
    throw error;
  }
}

// Function to post a chat message to a GitHub issue (example usage)
async function postMessageToGitHub(message, repoOwner, repoName, issueNumber) {
  try {
    const token = await getInstallationAccessToken();
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${issueNumber}/comments`;
    const response = await axios.post(url, {
      body: `Chat message: ${message.text} by ${message.username}`
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    console.log('Posted to GitHub:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error posting to GitHub:', error.response?.data || error.message);
    throw error;
  }
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Models
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPrivate: { type: Boolean, default: false },
  password: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
const Room = mongoose.model('Room', roomSchema);

// Routes
app.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, username, password: hashedPassword });
    await user.save();
    req.session.userId = user._id;
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    req.session.userId = user._id;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/create-room', async (req, res) => {
  // if (!req.session.userId) return res.status(401).json({ success: false, error: 'Not logged in' });
  const { name, isPrivate, password } = req.body;
  // Mock
  res.json({ success: true, roomId: 'newroom' });
});

app.get('/rooms', async (req, res) => {
  // Mock rooms
  res.json([
    { _id: 'room1', name: 'General', creator: { username: 'Admin' } },
    { _id: 'room2', name: 'Random', creator: { username: 'Bot' } }
  ]);
});

app.get('/user', async (req, res) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      res.json({ username: user.username });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.get('/', (req, res) => {
  if (!req.session.userId) {
    res.sendFile(__dirname + '/login.html');
  } else {
    res.sendFile(__dirname + '/index.html');
  }
});

app.get('/login.html', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.get('/2fa.html', (req, res) => {
  res.sendFile(__dirname + '/2fa.html');
});

app.get('/github-auth', async (req, res) => {
  try {
    const data = await useInstallationToken();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  // Send history
  socket.emit('history', messages);

  // Listen for chat messages (expect object with text, username, id, time)
  socket.on('chat message', async (msg) => {
    // normalize message object
    const entry = {
      text: (msg.text || String(msg || '')).slice(0, 2000),
      username: msg.username || 'Anonymous',
      id: msg.id || socket.id,
      time: msg.time || new Date().toISOString(),
    };

    // Add to messages
    messages.push(entry);
    // Save to file
    fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2));

    // Broadcast message
    io.emit('chat message', entry);

    // Optionally post to GitHub issue
    try {
      await postMessageToGitHub(entry, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_ISSUE_NUMBER);
    } catch (err) {
      console.error('Failed to post to GitHub:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

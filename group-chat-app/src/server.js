require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// In-memory storage
const users = [];
const groups = [];
const messages = [];

// Auth middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'No token' });
  req.user = { id: token, username: 'User' + token.slice(-4) };
  next();
};

// ========== ROUTES ==========

// API Info
app.get('/api', (req, res) => {
  res.json({
    message: 'Group Chat API',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      groups: {
        create: 'POST /api/groups/create',
        list: 'GET /api/groups',
        toggleAdmin: 'POST /api/groups/:groupId/toggle-admin'
      },
      messages: {
        send: 'POST /api/messages/:groupId/send',
        get: 'GET /api/messages/:groupId'
      }
    }
  });
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  
  const user = {
    id: 'user_' + Date.now(),
    username,
    email,
    password,
    createdAt: new Date()
  };
  
  users.push(user);
  
  res.json({
    success: true,
    token: user.id,
    user: { id: user.id, username, email }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({
    success: true,
    token: user.id,
    user: { id: user.id, username: user.username, email }
  });
});

// Create Group
app.post('/api/groups/create', auth, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name required' });
  
  const group = {
    id: 'group_' + Date.now(),
    name,
    description: description || '',
    creator: req.user.id,
    isAdminOnly: false,
    createdAt: new Date(),
    members: [{ userId: req.user.id, role: 'admin' }]
  };
  
  groups.push(group);
  
  res.json({
    success: true,
    group,
    message: 'Group created'
  });
});

// List Groups
app.get('/api/groups', auth, (req, res) => {
  const userGroups = groups.filter(g => 
    g.members.some(m => m.userId === req.user.id)
  );
  
  res.json({ success: true, groups: userGroups });
});

// Toggle Admin-Only Mode
app.post('/api/groups/:groupId/toggle-admin', auth, (req, res) => {
  const { groupId } = req.params;
  const group = groups.find(g => g.id === groupId);
  
  if (!group) return res.status(404).json({ error: 'Group not found' });
  
  const member = group.members.find(m => m.userId === req.user.id);
  if (!member || member.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  group.isAdminOnly = !group.isAdminOnly;
  
  res.json({
    success: true,
    message: `Admin-only mode ${group.isAdminOnly ? 'ON' : 'OFF'}`,
    isAdminOnly: group.isAdminOnly
  });
});

// Send Message
app.post('/api/messages/:groupId/send', auth, (req, res) => {
  const { groupId } = req.params;
  const { content } = req.body;
  
  const group = groups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  
  const member = group.members.find(m => m.userId === req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });
  
  if (group.isAdminOnly && member.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can send messages' });
  }
  
  const message = {
    id: 'msg_' + Date.now(),
    groupId,
    sender: req.user.id,
    content,
    timestamp: new Date(),
    readBy: [req.user.id]
  };
  
  messages.push(message);
  
  res.json({
    success: true,
    message,
    timestamp: message.timestamp
  });
});

// Get Messages
app.get('/api/messages/:groupId', auth, (req, res) => {
  const { groupId } = req.params;
  const groupMessages = messages
    .filter(m => m.groupId === groupId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  res.json({ success: true, messages: groupMessages });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    stats: {
      users: users.length,
      groups: groups.length,
      messages: messages.length
    }
  });
});

// Serve Frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 Try these:`);
  console.log(`   • http://localhost:${PORT} - Web Interface`);
  console.log(`   • http://localhost:${PORT}/api - API Info`);
  console.log(`   • http://localhost:${PORT}/api/health - Health Check`);
});
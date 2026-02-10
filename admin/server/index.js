const express = require('express');
const Redis = require('ioredis');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// 确保加载正确的环境变量文件
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

// 中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// 配置CORS，支持HTTPS环境
app.use(cors({
  origin: true, // 允许所有来源，在生产环境中应该设置具体的域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.static('../client'));

// 认证中间件
const authMiddleware = require('./middleware/auth');

// 健康检查
app.get('/admin/health', (req, res) => {
  res.json({ success: true, message: 'Admin server is running' });
});

// 登录API
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (password === adminPassword) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// 用户管理API
app.get('/admin/users', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const ips = await redis.smembers('user:ips');
    const users = [];
    
    for (const ip of ips) {
      const userInfo = await redis.hgetall(`user:ip:${ip}`);
      if (userInfo) {
        users.push({ ip, ...userInfo });
      }
    }
    
    // 按照访问次数倒序排序
    users.sort((a, b) => {
      const countA = parseInt(a.visit_count) || 0;
      const countB = parseInt(b.visit_count) || 0;
      return countB - countA;
    });
    
    // 分页处理
    const total = users.length;
    const paginatedUsers = users.slice(offset, offset + limit);
    
    res.json({ 
      success: true, 
      users: paginatedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 按IP获取用户信息
app.get('/admin/users/ip/:ip', authMiddleware, async (req, res) => {
  try {
    const { ip } = req.params;
    const userInfo = await redis.hgetall(`user:ip:${ip}`);
    
    if (userInfo) {
      res.json({ success: true, user: { ip, ...userInfo } });
    } else {
      res.json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 按用户名获取IP列表
app.get('/admin/users/name/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const ips = await redis.smembers(`user:name:${username}`);
    
    res.json({ success: true, username, ips });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 获取访问记录
app.get('/admin/users/visits', authMiddleware, async (req, res) => {
  try {
    const visits = await redis.lrange('user:visits', 0, 99);
    const visitRecords = visits.map(v => JSON.parse(v));
    
    res.json({ success: true, visits: visitRecords });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 消息管理API
app.get('/admin/messages', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const messages = [];
    const horseTypes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
    
    for (const type of horseTypes) {
      const typeMessages = await redis.lrange(`horse:messages:${type}`, 0, 99);
      typeMessages.forEach(msg => {
        try {
          const msgObj = JSON.parse(msg);
          messages.push({ ...msgObj, horseId: type });
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      });
    }
    
    // 按时间倒序排序，最新的消息在前
    messages.sort((a, b) => {
      const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timestampB - timestampA;
    });
    
    // 分页处理
    const total = messages.length;
    const paginatedMessages = messages.slice(offset, offset + limit);
    
    res.json({ 
      success: true, 
      messages: paginatedMessages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 删除消息
app.delete('/admin/messages/:horseId', authMiddleware, async (req, res) => {
  try {
    const { horseId } = req.params;
    const { content, timestamp } = req.body;
    
    if (!content) {
      return res.json({ success: false, message: 'Message content is required' });
    }
    
    const messages = await redis.lrange(`horse:messages:${horseId}`, 0, 99);
    let messageFound = false;
    const newMessages = [];
    
    for (const msgStr of messages) {
      try {
        const msgObj = JSON.parse(msgStr);
        // 检查消息内容是否匹配
        if (msgObj.content === content && (!timestamp || msgObj.timestamp === timestamp)) {
          messageFound = true;
          // 跳过这条消息，不添加到新列表中
        } else {
          newMessages.push(msgStr);
        }
      } catch (e) {
        // 解析错误，保留原始消息
        newMessages.push(msgStr);
      }
    }
    
    if (messageFound) {
      // 清空并重新添加消息
      await redis.del(`horse:messages:${horseId}`);
      for (const msg of newMessages.reverse()) {
        await redis.lpush(`horse:messages:${horseId}`, msg);
      }
      
      res.json({ success: true, message: 'Message deleted' });
    } else {
      res.json({ success: false, message: 'Message not found' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 统计API
app.get('/admin/stats', authMiddleware, async (req, res) => {
  try {
    const stats = {};
    
    // 消息统计
    const horseTypes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
    let totalMessages = 0;
    
    for (const type of horseTypes) {
      const count = await redis.llen(`horse:messages:${type}`);
      stats[`horse_${type}`] = count;
      totalMessages += count;
    }
    
    // 用户统计
    const totalUsers = await redis.scard('user:ips');
    
    // 访问统计
    const totalVisits = await redis.llen('user:visits');
    
    stats.total_messages = totalMessages;
    stats.total_users = totalUsers;
    stats.total_visits = totalVisits;
    
    res.json({ success: true, stats });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 排行榜API
app.get('/admin/stats/leaderboard', authMiddleware, async (req, res) => {
  try {
    const stats = {};
    
    // 获取各马类型的消息数量
    const horseTypes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
    let total = 0;
    
    for (const type of horseTypes) {
      const count = await redis.llen(`horse:messages:${type}`);
      stats[type] = count;
      total += count;
    }
    
    res.json({ success: true, stats, total });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

const PORT = process.env.ADMIN_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Admin server running on port ${PORT}`);
});

module.exports = app;
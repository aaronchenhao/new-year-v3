const express = require('express');
const Redis = require('ioredis');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// 尝试连接Redis，如果失败则使用内存存储
let redis;
let useMemoryStore = false;
const memoryStore = {
  userIps: new Set(),
  userInfo: {},
  visits: [],
  horseMessages: {}
};

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 3) {
        console.log('Redis连接失败，使用内存存储');
        useMemoryStore = true;
        return null;
      }
      return 1000;
    }
  });

  redis.on('error', (err) => {
    console.log('Redis错误，使用内存存储:', err.message);
    useMemoryStore = true;
  });

  redis.on('connect', () => {
    console.log('Redis连接成功');
    useMemoryStore = false;
  });
} catch (err) {
  console.log('Redis初始化失败，使用内存存储');
  useMemoryStore = true;
}

app.use(helmet());
app.use(cors());
app.use(express.json());

const getRealIP = (req) => {
  let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.connection.socket.remoteAddress ||
           '0.0.0.0';
  
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  return ip;
};

const trackUser = async (req, res, next) => {
  try {
    const ip = getRealIP(req);
    
    console.log('Tracking user IP:', ip);
    
    if (ip && ip !== '0.0.0.0') {
      const now = new Date().toISOString();
      
      try {
        if (useMemoryStore) {
          memoryStore.userIps.add(ip);
          const userInfo = memoryStore.userInfo[ip] || {};
          
          let visitCount = 1;
          if (userInfo && userInfo.visit_count) {
            const parsedCount = parseInt(userInfo.visit_count);
            visitCount = isNaN(parsedCount) ? 1 : parsedCount + 1;
          }
          
          const hasFirstSeen = userInfo && userInfo.first_seen;
          
          memoryStore.userInfo[ip] = {
            last_seen: now,
            visit_count: visitCount,
            ...(!hasFirstSeen && { first_seen: now })
          };
          
          memoryStore.visits.unshift({
            ip: ip,
            timestamp: now
          });
          
          if (memoryStore.visits.length > 1000) {
            memoryStore.visits = memoryStore.visits.slice(0, 1000);
          }
        } else {
          await redis.sadd('user:ips', ip);
          console.log('Added IP to set:', ip);
          
          const userInfo = await redis.hgetall(`user:ip:${ip}`);
          console.log('Existing user info:', userInfo);
          
          let visitCount = 1;
          if (userInfo && userInfo.visit_count) {
            const parsedCount = parseInt(userInfo.visit_count);
            visitCount = isNaN(parsedCount) ? 1 : parsedCount + 1;
          }
          
          const hasFirstSeen = userInfo && userInfo.first_seen;
          
          await redis.hset(`user:ip:${ip}`, {
            last_seen: now,
            visit_count: visitCount,
            ...(!hasFirstSeen && { first_seen: now })
          });
          console.log('Updated user info for IP:', ip);
          
          await redis.lpush('user:visits', JSON.stringify({
            ip: ip,
            timestamp: now
          }));
          console.log('Added visit record');
          
          await redis.ltrim('user:visits', 0, 999);
        }
      } catch (redisError) {
        console.error('存储错误:', redisError);
      }
    }
  } catch (error) {
    console.error('Error tracking user:', error);
  }
  next();
};
app.use(trackUser);

app.get('/api/messages/:horseId', async (req, res) => {
  try {
    const { horseId } = req.params;
    const key = `horse:messages:${horseId}`;
    
    let messages = [];
    
    if (useMemoryStore) {
      messages = memoryStore.horseMessages[horseId] || [];
    } else {
      messages = await redis.lrange(key, 0, 9);
    }
    
    if (messages.length > 0) {
      const messageObj = useMemoryStore ? messages[0] : JSON.parse(messages[0]);
      res.json({ 
        success: true, 
        message: messageObj.content,
        username: messageObj.username 
      });
    } else {
      res.json({ 
        success: false, 
        message: '这是你的首条马蹄印，没人接你哦',
        username: '' 
      });
    }
  } catch (error) {
    console.error('Error getting message:', error);
    res.json({ 
      success: false, 
      message: '获取祝福失败，请重试',
      username: '' 
    });
  }
});

app.post('/api/messages/:horseId', async (req, res) => {
  try {
    const { horseId } = req.params;
    const { content, username } = req.body;
    const ip = getRealIP(req);
    
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: '消息内容不能为空' });
    }
    
    const key = `horse:messages:${horseId}`;
    const message = {
      content: content.trim(),
      username: username || '匿名牛马',
      ip: ip,
      timestamp: new Date().toISOString(),
    };
    
    if (useMemoryStore) {
      if (!memoryStore.horseMessages[horseId]) {
        memoryStore.horseMessages[horseId] = [];
      }
      memoryStore.horseMessages[horseId].unshift(message);
      if (memoryStore.horseMessages[horseId].length > 100) {
        memoryStore.horseMessages[horseId] = memoryStore.horseMessages[horseId].slice(0, 100);
      }
    } else {
      await redis.lpush(key, JSON.stringify(message));
      await redis.ltrim(key, 0, 99);
    }
    
    res.json({ success: true, message: '消息传递成功！' });
  } catch (error) {
    console.error('Error submitting message:', error);
    res.status(500).json({ success: false, message: '消息传递失败，请重试' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = {};
    for (let i = 1; i <= 10; i++) {
      const key = `horse:messages:${i}`;
      
      if (useMemoryStore) {
        stats[i] = (memoryStore.horseMessages[i] || []).length;
      } else {
        stats[i] = await redis.llen(key);
      }
    }
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, message: '获取统计失败' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    storage: useMemoryStore ? 'memory' : 'redis'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`存储模式: ${useMemoryStore ? '内存存储' : 'Redis存储'}`);
});

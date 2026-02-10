const express = require('express');
const Redis = require('ioredis');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// 获取真实IP地址（考虑代理情况和IPv4映射的IPv6地址）
const getRealIP = (req) => {
  let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.connection.socket.remoteAddress ||
           '0.0.0.0';
  
  // 处理 IPv4 映射的 IPv6 地址
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  return ip;
};

// 用户跟踪中间件
const trackUser = async (req, res, next) => {
  try {
    const ip = getRealIP(req);
    
    console.log('Tracking user IP:', ip);
    
    if (ip && ip !== '0.0.0.0') {
      const now = new Date().toISOString();
      
      try {
        // 添加到IP集合
        await redis.sadd('user:ips', ip);
        console.log('Added IP to set:', ip);
        
        // 获取现有用户信息
        const userInfo = await redis.hgetall(`user:ip:${ip}`);
        console.log('Existing user info:', userInfo);
        
        // 计算访问次数，处理NaN情况
        let visitCount = 1;
        if (userInfo && userInfo.visit_count) {
          const parsedCount = parseInt(userInfo.visit_count);
          visitCount = isNaN(parsedCount) ? 1 : parsedCount + 1;
        }
        
        // 检查是否需要记录首次访问时间
        const hasFirstSeen = userInfo && userInfo.first_seen;
        
        // 更新IP信息
        await redis.hset(`user:ip:${ip}`, {
          last_seen: now,
          visit_count: visitCount,
          ...(!hasFirstSeen && { first_seen: now })
        });
        console.log('Updated user info for IP:', ip);
        
        if (!hasFirstSeen) {
          console.log('Added first seen time for IP:', ip);
        }
        
        // 记录访问历史
        await redis.lpush('user:visits', JSON.stringify({
          ip: ip,
          timestamp: now
        }));
        console.log('Added visit record');
        
        // 限制访问记录数量
        await redis.ltrim('user:visits', 0, 999);
      } catch (redisError) {
        console.error('Redis error:', redisError);
        // 即使Redis错误，也继续处理请求
      }
    }
  } catch (error) {
    console.error('Error tracking user:', error);
  }
  next();
};
app.use(trackUser);

// 获取消息
app.get('/api/messages/:horseId', async (req, res) => {
  try {
    const { horseId } = req.params;
    const key = `horse:messages:${horseId}`;
    
    // 获取最新的 10 条消息
    const messages = await redis.lrange(key, 0, 9);
    
    if (messages.length > 0) {
      // 获取最新的消息（Redis lpush 会将新消息添加到列表头部，所以索引0是最新的）
      const messageObj = JSON.parse(messages[0]);
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

// 提交消息
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
    
    // 添加消息到队列
    await redis.lpush(key, JSON.stringify(message));
    
    // 限制队列长度为 100 条
    await redis.ltrim(key, 0, 99);
    
    res.json({ success: true, message: '消息传递成功！' });
  } catch (error) {
    console.error('Error submitting message:', error);
    res.status(500).json({ success: false, message: '消息传递失败，请重试' });
  }
});

// 获取统计
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {};
    // 假设马的类型 ID 为 1-10
    for (let i = 1; i <= 10; i++) {
      const key = `horse:messages:${i}`;
      const count = await redis.llen(key);
      stats[i] = count;
    }
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, message: '获取统计失败' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
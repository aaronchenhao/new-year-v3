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

// 获取消息
app.get('/api/messages/:horseId', async (req, res) => {
  try {
    const { horseId } = req.params;
    const key = `horse:messages:${horseId}`;
    
    // 获取最新的 10 条消息
    const messages = await redis.lrange(key, 0, 9);
    
    if (messages.length > 0) {
      // 随机选择一条消息
      const randomIndex = Math.floor(Math.random() * messages.length);
      const messageObj = JSON.parse(messages[randomIndex]);
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
    
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: '消息内容不能为空' });
    }
    
    const key = `horse:messages:${horseId}`;
    const message = {
      content: content.trim(),
      username: username || '匿名牛马',
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
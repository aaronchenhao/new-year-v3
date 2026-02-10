const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

const trackUser = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log('Tracking user IP:', ip);
    
    if (ip) {
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
        
        // 更新IP信息，只保留IP相关字段
        await redis.hset(`user:ip:${ip}`, {
          last_seen: now,
          visit_count: visitCount,
          ...(!hasFirstSeen && { first_seen: now })
        });
        console.log('Updated user info for IP:', ip);
        
        if (!hasFirstSeen) {
          console.log('Added first seen time for IP:', ip);
        }
        
        // 清除旧的用户名相关字段
        if (userInfo && (userInfo.username || userInfo.horseId || userInfo.lastActive)) {
          await redis.hdel(`user:ip:${ip}`, 'username', 'horseId', 'lastActive');
          console.log('Cleared old username-related fields for IP:', ip);
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

module.exports = trackUser;
const authMiddleware = (req, res, next) => {
  // 简单的认证实现
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  // 从配置中获取密码
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const expectedAuth = 'Basic ' + Buffer.from('admin:' + adminPassword).toString('base64');
  
  if (authHeader !== expectedAuth) {
    // 打印认证头信息，方便调试
    console.log('Received auth header:', authHeader);
    console.log('Expected auth header:', expectedAuth);
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  next();
};

module.exports = authMiddleware;
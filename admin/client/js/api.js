// API请求工具
const API_BASE_URL = '/admin';

// 存储认证信息
let authToken = localStorage.getItem('authToken');

// 设置认证头
const getAuthHeaders = () => {
  if (authToken) {
    return { 'Authorization': `Bearer ${authToken}` };
  }
  // 备用方案：使用Basic认证
  const adminPassword = localStorage.getItem('adminPassword') || 'Chenshutong@821';
  const basicAuth = btoa(`admin:${adminPassword}`);
  return { 'Authorization': `Basic ${basicAuth}` };
};

// 通用请求函数
const request = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers
      }
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || '请求失败');
    }

    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
};

// 认证API
export const authAPI = {
  login: async (password) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // 存储认证信息
      authToken = 'dummy-token'; // 实际项目中应该使用真实的token
      localStorage.setItem('authToken', authToken);
    }
    
    return data;
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    authToken = null;
  },
  
  isAuthenticated: () => {
    return !!authToken;
  }
};

// 用户管理API
export const userAPI = {
  getUsers: async () => {
    return await request('/users');
  },
  
  getUserByIP: async (ip) => {
    return await request(`/users/ip/${ip}`);
  },
  
  getUsersByName: async (username) => {
    return await request(`/users/name/${encodeURIComponent(username)}`);
  },
  
  getVisits: async () => {
    return await request('/users/visits');
  }
};

// 消息管理API
export const messageAPI = {
  getMessages: async () => {
    return await request('/messages');
  },
  
  deleteMessage: async (horseId, index) => {
    return await request(`/messages/${horseId}/${index}`, {
      method: 'DELETE'
    });
  }
};

// 统计API
export const statsAPI = {
  getStats: async () => {
    return await request('/stats');
  },
  
  getLeaderboard: async () => {
    return await request('/stats/leaderboard');
  }
};

// 健康检查
export const healthAPI = {
  check: async () => {
    return await request('/health');
  }
};

// 导出默认API对象
export default {
  auth: authAPI,
  user: userAPI,
  message: messageAPI,
  stats: statsAPI,
  health: healthAPI
};
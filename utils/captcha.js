const crypto = require('crypto');

// 从环境变量读取配置
const getCaptchaConfig = () => ({
  enabled: process.env.CAPTCHA_ENABLED === 'true',
  expireMinutes: parseInt(process.env.CAPTCHA_EXPIRE_MINUTES) || 5,
  maxAttempts: parseInt(process.env.CAPTCHA_MAX_ATTEMPTS) || 3
});

const captchaConfig = getCaptchaConfig();

// 验证码存储（生产环境应该使用Redis）
const captchaStore = new Map();

// 生成验证码
const generateCaptcha = () => {
  if (!captchaConfig.enabled) {
    return { id: null, code: '0000' };
  }

  // 生成4位数字验证码
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const id = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + captchaConfig.expireMinutes * 60 * 1000;
  
  // 存储验证码
  captchaStore.set(id, {
    code,
    expiresAt,
    attempts: 0
  });
  
  // 清理过期验证码
  setTimeout(() => {
    captchaStore.delete(id);
  }, captchaConfig.expireMinutes * 60 * 1000);
  
  return { id, code };
};

// 验证验证码
const verifyCaptcha = (id, code) => {
  if (!captchaConfig.enabled) {
    return { valid: true, message: '验证码验证已禁用' };
  }

  const captcha = captchaStore.get(id);
  
  if (!captcha) {
    return { valid: false, message: '验证码不存在或已过期' };
  }
  
  if (Date.now() > captcha.expiresAt) {
    captchaStore.delete(id);
    return { valid: false, message: '验证码已过期' };
  }
  
  if (captcha.attempts >= captchaConfig.maxAttempts) {
    captchaStore.delete(id);
    return { valid: false, message: '验证码尝试次数过多' };
  }
  
  captcha.attempts++;
  
  if (captcha.code !== code) {
    return { valid: false, message: '验证码错误' };
  }
  
  // 验证成功后删除验证码
  captchaStore.delete(id);
  
  return { valid: true, message: '验证码正确' };
};

// 生成图形验证码（简单实现）
const generateImageCaptcha = () => {
  if (!captchaConfig.enabled) {
    return {
      id: null,
      image: `data:image/svg+xml;base64,${Buffer.from(`
        <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="40" fill="#f0f0f0"/>
          <text x="60" y="25" font-family="Arial" font-size="18" text-anchor="middle" fill="#333">0000</text>
        </svg>
      `).toString('base64')}`,
      code: '0000'
    };
  }

  const { id, code } = generateCaptcha();
  
  // 这里应该生成实际的图片验证码
  // 暂时返回SVG格式的简单验证码
  const svg = `
    <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" fill="#f0f0f0"/>
      <text x="60" y="25" font-family="Arial" font-size="18" text-anchor="middle" fill="#333">${code}</text>
    </svg>
  `;
  
  return {
    id,
    image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    code // 实际生产环境不应该返回code
  };
};

module.exports = {
  generateCaptcha,
  verifyCaptcha,
  generateImageCaptcha,
  captchaConfig
};

/**
 * 手机号脱敏处理
 * @param {string} phone 完整手机号
 * @returns {string} 脱敏后的手机号
 */
function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string' || phone.length < 7) {
    return phone;
  }
  
  // 保留前2位和后2位，中间用*替代
  const prefix = phone.substring(0, 2);
  const suffix = phone.substring(phone.length - 2);
  const middle = '*'.repeat(phone.length - 4);
  
  return `${prefix}${middle}${suffix}`;
}

/**
 * 根据用户登录状态决定是否脱敏
 * @param {string} phone 完整手机号
 * @param {boolean} isLoggedIn 是否已登录
 * @returns {string} 处理后的手机号
 */
function processPhoneNumber(phone, isLoggedIn) {
  if (!phone) return phone;
  
  // 已登录用户显示完整号码，未登录用户脱敏
  return isLoggedIn ? phone : maskPhoneNumber(phone);
}

module.exports = {
  maskPhoneNumber,
  processPhoneNumber
};

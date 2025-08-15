/**
 * 联系信息提取工具
 * 用于从contact_info字段中提取联系人姓名和电话号码
 */

/**
 * 从联系信息中提取联系人姓名和电话号码
 * @param {Object} vehicleData - 车辆数据对象
 * @returns {Object} 处理后的车辆数据
 */
function extractContactInfo(vehicleData) {
  // 如果contact_name或phone_number为null，尝试从contact_info中提取
  if (!vehicleData.contact_name || !vehicleData.phone_number) {
    if (vehicleData.contact_info) {
      // 提取联系人姓名（通常在开头）
      if (!vehicleData.contact_name) {
        const nameMatch = vehicleData.contact_info.match(/^([^\s]+(?:\s+[^\s]+)*?)(?:\s|電|电|郵|邮|Tel|tel|電話|电话|手機|手机|WhatsApp|微信|:|：)/i);
        if (nameMatch) {
          vehicleData.contact_name = nameMatch[1].trim();
        }
      }
      
      // 提取电话号码（支持多种格式：8位数字、带区号等）
      if (!vehicleData.phone_number) {
        const phoneMatch = vehicleData.contact_info.match(/(?:電話|电话|Tel|tel|手機|手机|WhatsApp|微信|Phone|phone)[：:]?\s*([\d\s\-\+\(\)]{8,15})|\b(\d{8})\b/);
        if (phoneMatch) {
          vehicleData.phone_number = (phoneMatch[1] || phoneMatch[2]).replace(/[\s\-\(\)]/g, '');
        }
      }
    }
  }
  
  return vehicleData;
}

/**
 * 批量处理车辆数据的联系信息提取
 * @param {Array} vehicles - 车辆数据数组
 * @returns {Array} 处理后的车辆数据数组
 */
function batchExtractContactInfo(vehicles) {
  return vehicles.map(vehicle => {
    const vehicleData = vehicle.toJSON ? vehicle.toJSON() : vehicle;
    return extractContactInfo(vehicleData);
  });
}

module.exports = {
  extractContactInfo,
  batchExtractContactInfo
};
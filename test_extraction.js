const { Vehicle } = require('./models');

async function testExtraction() {
  try {
    console.log('测试从contact_info中提取联系人信息...');
    
    // 查询一个有电话号码的车辆
    const vehicleWithPhone = await Vehicle.findOne({
      where: {
        contact_info: {
          [require('sequelize').Op.like]: '%電話%'
        }
      },
      attributes: ['vehicle_id', 'contact_name', 'phone_number', 'contact_info'],
      limit: 1
    });
    
    if (vehicleWithPhone) {
      console.log('\n=== 测试有电话号码的车辆 ===')
      const vehicleData = vehicleWithPhone.toJSON();
      console.log('车辆ID:', vehicleData.vehicle_id);
      console.log('原始contact_name:', vehicleData.contact_name);
      console.log('原始phone_number:', vehicleData.phone_number);
      console.log('contact_info:', vehicleData.contact_info);
      
      // 模拟提取逻辑
      if (!vehicleData.contact_name || !vehicleData.phone_number) {
        if (vehicleData.contact_info) {
          console.log('\n开始提取...');
          
          // 提取联系人姓名
          if (!vehicleData.contact_name) {
            const nameMatch = vehicleData.contact_info.match(/^([^\s]+(?:\s+[^\s]+)*?)(?:\s|電|电|郵|邮|Tel|tel|電話|电话|手機|手机|WhatsApp|微信|:|：)/i);
            if (nameMatch) {
              vehicleData.contact_name = nameMatch[1].trim();
              console.log('提取到联系人姓名:', vehicleData.contact_name);
            }
          }
          
          // 提取电话号码
          if (!vehicleData.phone_number) {
            const phoneMatch = vehicleData.contact_info.match(/(?:電話|电话|Tel|tel|手機|手机|WhatsApp|微信|Phone|phone)[：:]?\s*([\d\s\-\+\(\)]{8,15})|\b(\d{8})\b/);
            if (phoneMatch) {
              vehicleData.phone_number = (phoneMatch[1] || phoneMatch[2]).replace(/[\s\-\(\)]/g, '');
              console.log('提取到电话号码:', vehicleData.phone_number);
            }
          }
        }
      }
      
      console.log('\n最终结果:');
      console.log('contact_name:', vehicleData.contact_name);
      console.log('phone_number:', vehicleData.phone_number);
    }
    
    // 测试车辆s2527586
    console.log('\n\n=== 测试车辆s2527586 ===')
    const vehicle = await Vehicle.findOne({
      where: { vehicle_id: 's2527586' },
      attributes: ['vehicle_id', 'contact_name', 'phone_number', 'contact_info']
    });
    
    if (vehicle) {
      const vehicleData = vehicle.toJSON();
      console.log('原始contact_name:', vehicleData.contact_name);
      console.log('原始phone_number:', vehicleData.phone_number);
      console.log('contact_info:', vehicleData.contact_info);
      
      // 模拟提取逻辑
      if (!vehicleData.contact_name || !vehicleData.phone_number) {
        if (vehicleData.contact_info) {
          console.log('\n开始提取...');
          
          // 提取联系人姓名
          if (!vehicleData.contact_name) {
            const nameMatch = vehicleData.contact_info.match(/^([^\s]+(?:\s+[^\s]+)*?)(?:\s|電|电|郵|邮|Tel|tel|電話|电话|手機|手机|WhatsApp|微信|:|：)/i);
            if (nameMatch) {
              vehicleData.contact_name = nameMatch[1].trim();
              console.log('提取到联系人姓名:', vehicleData.contact_name);
            }
          }
          
          // 提取电话号码
          if (!vehicleData.phone_number) {
            const phoneMatch = vehicleData.contact_info.match(/(?:電話|电话|Tel|tel|手機|手机|WhatsApp|微信|Phone|phone)[：:]?\s*([\d\s\-\+\(\)]{8,15})|\b(\d{8})\b/);
            if (phoneMatch) {
              vehicleData.phone_number = (phoneMatch[1] || phoneMatch[2]).replace(/[\s\-\(\)]/g, '');
              console.log('提取到电话号码:', vehicleData.phone_number);
            } else {
              console.log('未能提取到电话号码（contact_info中只有邮箱）');
            }
          }
        }
      }
      
      console.log('\n最终结果:');
      console.log('contact_name:', vehicleData.contact_name);
      console.log('phone_number:', vehicleData.phone_number);
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testExtraction();
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const IPLocationCache = sequelize.define('IPLocationCache', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      comment: '缓存ID'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: false,
      unique: true,
      comment: 'IP地址'
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '国家'
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '省份/州'
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '城市'
    },
    isp: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '网络服务商'
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '时区'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      comment: '纬度'
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      comment: '经度'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '更新时间'
    }
  }, {
    tableName: 'ip_location_cache',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: 'IP地理位置缓存表',
    indexes: [
      {
        name: 'uk_ip_address',
        unique: true,
        fields: ['ip_address']
      },
      {
        name: 'idx_country',
        fields: ['country']
      },
      {
        name: 'idx_region',
        fields: ['region']
      },
      {
        name: 'idx_city',
        fields: ['city']
      },
      {
        name: 'idx_updated_at',
        fields: ['updated_at']
      }
    ]
  });

  return IPLocationCache;
};

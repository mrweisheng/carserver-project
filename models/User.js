const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50]
    },
    comment: '用户名（用作登录）'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    },
    comment: '密码'
  },
  real_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '联络人姓名'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    },
    comment: '邮箱（客户信息，可选）'
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false,
    comment: '性别'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '联络电话'
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '地区（根据IP自动获取）'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: '注册时的IP地址'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '头像URL'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '用户状态：1=正常, 2=禁用, 3=待验证'
  },
  role: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '用户角色：1=普通用户, 2=管理员, 3=超级管理员'
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login_ip: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// 实例方法：验证密码
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// 实例方法：获取用户信息（排除密码）
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User;

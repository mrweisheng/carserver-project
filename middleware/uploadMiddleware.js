const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '../uploads');
const vehicleUploadsDir = path.join(uploadsDir, 'vehicles');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(vehicleUploadsDir)) {
  fs.mkdirSync(vehicleUploadsDir, { recursive: true });
}

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 按日期创建子目录
    const date = new Date();
    const datePath = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const finalUploadPath = path.join(vehicleUploadsDir, datePath);

    if (!fs.existsSync(finalUploadPath)) {
      fs.mkdirSync(finalUploadPath, { recursive: true });
    }

    cb(null, finalUploadPath);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名: 时间戳_随机数.扩展名
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, webp)'));
  }
};

// 上传限制
const uploadLimits = {
  fileSize: 5 * 1024 * 1024, // 5MB
  files: 10 // 最多10个文件
};

// 创建multer实例
const upload = multer({
  storage: storage,
  limits: uploadLimits,
  fileFilter: fileFilter
});

// 车辆图片上传中间件
const vehicleImageUpload = upload.array('images', 10);

// 错误处理中间件
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer错误
    let message = '文件上传失败';
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = '文件大小超过限制（最大5MB）';
        break;
      case 'LIMIT_FILE_COUNT':
        message = '上传文件数量超过限制（最多10个）';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = '意外的文件字段';
        break;
      default:
        message = `文件上传错误: ${err.message}`;
    }
    return res.status(400).json({
      code: 400,
      message: message,
      data: null
    });
  } else if (err) {
    // 其他错误
    return res.status(400).json({
      code: 400,
      message: err.message || '文件上传失败',
      data: null
    });
  }
  next();
};

// 单个图片上传中间件
const singleImageUpload = upload.single('image');

module.exports = {
  vehicleImageUpload,
  singleImageUpload,
  handleUploadError
};
# 贡献指南 (Contributing Guide)

感谢您对汽车信息服务器项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- 🧪 编写测试用例

## 📋 贡献前准备

### 1. 环境要求
- Node.js >= 14.0.0
- MySQL >= 5.7
- Git

### 2. 开发环境搭建
```bash
# 克隆项目
git clone <repository-url>
cd carserver

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动开发服务器
npm run dev
```

## 🔄 贡献流程

### 1. Fork 项目
1. 访问项目 GitHub 页面
2. 点击右上角的 "Fork" 按钮
3. 将项目 Fork 到你的 GitHub 账户

### 2. 创建功能分支
```bash
# 克隆你的 Fork
git clone https://github.com/your-username/carserver.git
cd carserver

# 添加上游仓库
git remote add upstream https://github.com/original-owner/carserver.git

# 创建功能分支
git checkout -b feature/your-feature-name
# 或者修复分支
git checkout -b fix/your-fix-name
```

### 3. 开发规范

#### 代码风格
- 使用 **ESLint** 进行代码检查
- 遵循 **JavaScript Standard Style**
- 使用 **Prettier** 进行代码格式化

#### 提交信息规范
使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 功能新增
git commit -m "feat: 添加用户头像上传功能"

# 问题修复
git commit -m "fix: 修复手机号脱敏显示问题"

# 文档更新
git commit -m "docs: 更新API文档"

# 性能优化
git commit -m "perf: 优化数据库查询性能"

# 重构代码
git commit -m "refactor: 重构用户认证中间件"

# 测试相关
git commit -m "test: 添加用户注册接口测试"
```

#### 分支命名规范
- `feature/功能名称` - 新功能开发
- `fix/问题描述` - 问题修复
- `docs/文档类型` - 文档更新
- `test/测试内容` - 测试相关
- `refactor/重构内容` - 代码重构

### 4. 测试验证
```bash
# 运行代码检查
npm run lint

# 运行测试（如果有）
npm test

# 启动服务验证功能
npm run dev
```

### 5. 提交 Pull Request
1. 推送你的分支到你的 Fork
```bash
git push origin feature/your-feature-name
```

2. 在 GitHub 上创建 Pull Request
3. 填写 PR 模板，包括：
   - 功能描述
   - 测试情况
   - 相关 Issue 链接

## 📝 代码审查

### 审查标准
- ✅ 代码符合项目规范
- ✅ 功能测试通过
- ✅ 文档更新完整
- ✅ 没有引入新的 Bug
- ✅ 性能影响评估

### 审查流程
1. **自动化检查**：CI/CD 流水线自动运行
2. **代码审查**：维护者进行代码审查
3. **功能测试**：验证功能是否正常
4. **合并代码**：审查通过后合并到主分支

## 🐛 报告 Bug

### Bug 报告模板
```markdown
## Bug 描述
简要描述 Bug 的情况

## 重现步骤
1. 访问 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 预期行为
描述你期望看到的行为

## 实际行为
描述实际发生的行为

## 环境信息
- 操作系统：Windows 10
- 浏览器：Chrome 90.0
- Node.js 版本：14.17.0
- 数据库版本：MySQL 8.0

## 附加信息
截图、日志文件等
```

## 💡 功能建议

### 建议模板
```markdown
## 功能描述
详细描述你想要的功能

## 使用场景
描述在什么情况下需要这个功能

## 实现建议
如果有的话，提供实现思路

## 优先级
高/中/低
```

## 📚 文档贡献

### 文档类型
- **API 文档**：接口说明、参数描述、示例代码
- **部署文档**：环境配置、部署步骤
- **用户指南**：功能使用说明
- **开发文档**：架构设计、开发规范

### 文档规范
- 使用 Markdown 格式
- 添加适当的标题层级
- 包含代码示例
- 使用表格整理信息
- 添加相关链接

## 🧪 测试贡献

### 测试类型
- **单元测试**：测试单个函数或模块
- **集成测试**：测试模块间交互
- **API 测试**：测试接口功能
- **性能测试**：测试系统性能

### 测试规范
- 使用 Jest 测试框架
- 测试覆盖率 > 80%
- 包含正向和异常测试
- 测试数据独立

## 🏷️ 版本发布

### 发布流程
1. **功能冻结**：停止新功能开发
2. **Bug 修复**：修复已知问题
3. **测试验证**：全面测试
4. **文档更新**：更新相关文档
5. **版本标记**：创建 Git 标签
6. **发布公告**：发布更新日志

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- **GitHub Issues**：报告 Bug 和功能建议
- **GitHub Discussions**：技术讨论
- **邮箱**：your-email@example.com

## 🙏 致谢

感谢所有为项目做出贡献的开发者！

---

**注意**：请确保你的贡献符合项目的开源许可证要求。

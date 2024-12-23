# LLM-Web-UI


## 简介

**LLM-Web-UI** 是一个基于 Web 的用户界面，旨在为用户提供与大型语言模型（LLM）进行交互的流畅、智能和个性化体验。该应用集成了多种功能，如主题切换、字体大小调整、API 密钥配置以及其他实用设置，确保用户在各种设备上都能获得最佳的使用体验。

**在线体验**：[https://gemini-by-yeahhe.pages.dev/](https://gemini-by-yeahhe.pages.dev/)

## 功能

- **智能对话**：与 Gemini AI 聊天机器人进行自然流畅的对话，获取智能回复。
- **主题切换**：支持明亮和暗色主题，用户可根据喜好自由切换。
- **字体大小调整**：提供小、中、大三种字体大小选项，满足不同阅读需求。
- **API Key 配置**：用户可以在设置中输入和管理 API Key，确保安全性和个性化体验。
- **自动滚动**：启用后，聊天记录会自动滚动到最新消息，保持对话连贯。
- **流式输出**：支持 AI 回复的实时流式展示，提升互动体验。
- **消息管理**：
  - **复制消息**：轻松复制聊天记录中的任意消息，方便分享或保存。
  - **删除消息**：删除不需要的消息，保持聊天记录整洁。
- **缓存清理**：一键清理所有缓存，包括聊天记录和设置，确保隐私和性能。
- **响应式设计**：适配各种屏幕尺寸，确保在手机、平板和桌面设备上均有良好显示效果。
- **代码高亮**：支持多种编程语言的代码高亮显示，方便开发者查看和复制代码片段。
- **数学公式渲染**：集成 MathJax，支持 LaTeX 数学公式的渲染，适用于学术和技术交流。

## 技术栈

- **前端**：
  - HTML5
  - CSS3
  - JavaScript (ES6)
  - [Prism.js](https://prismjs.com/) - 代码高亮
  - [Marked.js](https://marked.js.org/) - Markdown 渲染
  - [DOMPurify](https://github.com/cure53/DOMPurify) - 防止 XSS 攻击
  - [MathJax](https://www.mathjax.org/) - 数学公式渲染

## 安装与使用

### 前提条件

- **Web 浏览器**：现代浏览器如 Chrome、Firefox、Edge 或 Safari。
- **API Key**：需要拥有有效的 Gemini AI API Key 以访问大型语言模型服务。

### 克隆仓库

```bash
git clone https://github.com/yeahhe365/LLM-Web-UI.git
cd LLM-Web-UI
```

### 配置 API Key

1. 打开项目文件夹。
2. 启动应用后，点击顶部设置按钮，进入设置界面。
3. 在“API 设置”部分，输入你的 API Key 并保存。

### 运行应用

1. **本地运行**：
   - 直接双击 `index.html` 文件，在浏览器中打开。
   - 或者，使用本地开发服务器（如 [VSCode 的 Live Server 扩展](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)）运行项目，以确保所有功能正常工作。

2. **部署到 GitHub Pages**：

   1. 确保你已将代码推送到 GitHub 仓库。
   2. 在 GitHub 仓库页面，点击 **Settings**。
   3. 滚动到 **GitHub Pages** 部分。
   4. 在 **Source** 下拉菜单中，选择 `main` 分支（或其他分支）和 `/root` 目录。
   5. 点击 **Save**，几分钟后，你的应用将通过 `https://yeahhe365.github.io/LLM-Web-UI/` 访问。

## 使用说明

1. **发送消息**：在输入框中键入你的消息，点击“发送”按钮或按回车键发送。
2. **清除聊天**：点击“清除”按钮，删除所有聊天记录。
3. **打开设置**：点击顶部的设置按钮（齿轮图标），打开设置弹窗。
4. **配置设置**：
   - **外观**：切换主题和调整字体大小。
   - **API 设置**：输入和管理你的 API Key。
   - **功能**：启用或禁用自动滚动和流式输出。
   - **缓存**：一键清理所有缓存，包括聊天记录和设置。
5. **消息管理**：
   - **复制消息**：点击消息右上角的复制按钮，复制该消息内容。
   - **删除消息**：点击消息右上角的删除按钮，删除该消息。

## 示例截图

<!-- 请将以下图片链接替换为您项目中的实际截图链接 -->

![PixPin_2024-12-23_11-05-35](https://github.com/user-attachments/assets/2191167e-6f31-4def-bb68-5d885e728954)


![PixPin_2024-12-23_11-05-55](https://github.com/user-attachments/assets/be5f2fc2-8deb-489c-a4eb-f4d96e933d1b)


## 常见问题 (FAQ)

**Q1: 如何获取 API Key？**  
A1: 请访问 [Gemini AI 官方网站](https://www.yourserviceprovider.com) 获取 API Key。注册并登录后，你可以在用户面板中找到并生成 API Key。

**Q2: 是否支持多种语言？**  
A2: 是的，LLM-Web-UI 支持多种语言，包括中文、英文等。你可以在设置中选择你喜欢的语言。

**Q3: 如何报告错误或建议？**  
A3: 你可以在 [GitHub Issues](https://github.com/yeahhe365/LLM-Web-UI/issues) 中提交错误报告或建议，我们会尽快处理。

## 贡献

欢迎贡献者加入我们的项目！请按照以下步骤进行：

1. **Fork** 本仓库。
2. **创建分支** (`git checkout -b feature/你的功能`)。
3. **提交更改** (`git commit -m '添加了某某功能'`)。
4. **推送分支** (`git push origin feature/你的功能`)。
5. **创建 Pull Request**，描述你的更改和新增功能。

请确保你的代码符合现有代码风格，并通过必要的测试。

## 许可证

本项目采用 [MIT 许可证](https://github.com/yeahhe365/LLM-Web-UI/blob/main/LICENSE) 许可。详情请参阅 [LICENSE](https://github.com/yeahhe365/LLM-Web-UI/blob/main/LICENSE) 文件。

## 联系我们

如果你有任何问题、建议或反馈，请通过以下方式与我们联系：

- **邮箱**：your-email@example.com <!-- 请替换为您的实际邮箱 -->
- **GitHub Issues**：在 [GitHub Issues](https://github.com/yeahhe365/LLM-Web-UI/issues) 中提交问题。
- **社交媒体**：关注我们的 [Twitter](https://twitter.com/yourprofile) 或 [LinkedIn](https://www.linkedin.com/in/yourprofile/) 页面。<!-- 请替换为您的实际社交媒体链接 -->

## 致谢

感谢所有为本项目贡献代码和建议的开发者和社区成员！特别感谢以下资源和工具：

- [Prism.js](https://prismjs.com/)
- [Marked.js](https://marked.js.org/)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [MathJax](https://www.mathjax.org/)

---

希望你喜欢使用 **LLM-Web-UI**！如果有任何问题或建议，欢迎随时与我们联系。

*最后，如果你喜欢这个项目，请给我们一个 ⭐️！*



---

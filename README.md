![image](https://github.com/user-attachments/assets/4f067fa8-515b-4d1c-8a74-e051e42c56ec)---

# LLM Chat

LLM Chat 是一个轻量级的网页聊天界面，用于与大语言模型（如 OpenAI、Gemini 等）交互。项目支持 Markdown 渲染（包括 LaTeX 数学公式）、代码高亮、流式输出、多会话管理以及多 API 配置，所有数据均存储在浏览器的 localStorage 中。

**在线体验**：https://gemini-by-yeahhe.pages.dev/

## 截图
![image](https://github.com/user-attachments/assets/c4543d83-917c-40ff-b9eb-ae36f94e2405)
![image](https://github.com/user-attachments/assets/f168aee0-5188-4dd6-b7fe-fa156e46cdf2)
![image](https://github.com/user-attachments/assets/3bfc789d-0804-418e-8a82-f18816e3f245)
![image](https://github.com/user-attachments/assets/9fa7c3e9-0f60-4255-827f-0e51ce45bff6)
![image](https://github.com/user-attachments/assets/8987d18a-1fb3-408b-968c-6db05aa94e3f)
![image](https://github.com/user-attachments/assets/7d8b5667-f05a-4d86-804f-87a55f3a81e2)



## 特性

- **Markdown & LaTeX 支持**：使用 Marked.js 与 MathJax 渲染文本和数学公式。  
- **代码高亮**：内置 Prism.js，支持多种语言。  
- **流式输出**：提供打字机效果的消息显示，并支持中断。  
- **聊天记录管理**：支持新建、切换和删除对话。  
- **多 API 配置**：可配置多个语言模型 API，并在界面中自由切换。  
- **自定义设置**：主题、字体大小、自动滚动等可自定义。

## 文件结构

```
LLM-Web-UI copy 3
├── favicon_io/         // 网站图标资源
├── index.html          // 页面入口
├── js/                 // 聊天逻辑、设置、侧边栏等脚本
└── styles.css          // 页面样式
```

## 使用方法

1. 下载或克隆本仓库到本地。  
2. 直接打开 `index.html`，或使用静态文件服务器（如 VS Code Live Server）启动项目。  
3. 在设置中配置 API Key 及相关参数，即可开始聊天。

## 外部依赖

- [Marked.js](https://github.com/markedjs/marked)
- [MathJax](https://www.mathjax.org/)
- [Prism.js](https://prismjs.com/)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- Google Fonts & Material Icons

## 备注

- 本项目为纯前端静态页面，聊天记录和设置均保存在浏览器中。  
- 请确保正确配置 API Key，否则可能无法生成回复。

---

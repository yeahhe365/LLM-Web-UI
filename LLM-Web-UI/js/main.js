// main.js: 应用入口

import {
	initChat,
	createNewConversation,
	clearChat,
	sendMessage,
	adjustTextareaHeight
} from './chat.js';

import {
	renderHistorySidebar,
	initSidebarEvents
} from './sidebar.js';

import {
	loadSettings,
	initSettingsEvents
} from './settings.js';

import { addCopyButtonsToCodeBlocks, showToast } from './utils.js';

function initApp() {
	// 初始化聊天逻辑
	initChat();

	// 初始化侧边栏
	renderHistorySidebar();
	initSidebarEvents();

	// 初始化设置
	loadSettings();
	initSettingsEvents();

	// 绑定按钮事件
	document.getElementById('clearButton').addEventListener('click', clearChat);
	document.getElementById('sendButton').addEventListener('click', sendMessage);
	document.getElementById('newChatButton').addEventListener('click', createNewConversation);

	// 绑定 textarea 的输入事件, 自动增高
	const messageInput = document.getElementById('messageInput');
	messageInput.addEventListener('input', () => adjustTextareaHeight(messageInput));

	// ★ 监听键盘事件，实现 Enter 发送、Shift+Enter 换行
	messageInput.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	});

	// 代码块复制按钮（在页面内容就绪后执行）
	document.addEventListener('DOMContentLoaded', () => {
		const chatHistory = document.getElementById("chatHistory");
		addCopyButtonsToCodeBlocks(chatHistory);
	});

  // ★ 绑定头部 API 配置下拉框的切换事件
  const apiConfigSelect = document.getElementById('apiConfigSelect');
  if(apiConfigSelect) {
    apiConfigSelect.addEventListener('change', () => {
      localStorage.setItem('activeApiConfigId', apiConfigSelect.value);
      const selectedText = apiConfigSelect.options[apiConfigSelect.selectedIndex].textContent;
      showToast('已切换 API: ' + selectedText);
    });
  }
}

initApp();
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

import { addCopyButtonsToCodeBlocks } from './utils.js';

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
		// 如果按下 Enter 且没有按下 Shift，则发送消息
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault(); // 阻止默认换行
			sendMessage();
		}
	});

	// 代码块复制按钮（在页面内容就绪后执行）
	document.addEventListener('DOMContentLoaded', () => {
		const chatHistory = document.getElementById("chatHistory");
		addCopyButtonsToCodeBlocks(chatHistory);
	});
}

initApp();
// chat.js: 聊天核心逻辑

import { showToast, copyMessage, deleteMessage, addCopyButtonsToCodeBlocks, escapeHTML } from './utils.js';
import { renderHistorySidebar } from './sidebar.js';

let isSending = false;
let autoScroll = true;
let enableStreaming = true;

// 存储所有会话
let conversations = [];
// 当前会话 ID
let currentConversationId = null;

// ========== 设置项 ==========
export function setAutoScroll(value) {
  autoScroll = value;
}
export function setEnableStreaming(value) {
  enableStreaming = value;
}

// ========== 初始化入口 ==========
export function initChat() {
  loadConversations();
  if (!conversations || conversations.length === 0) {
    createNewConversation();
  } else {
    const lastUsedId = localStorage.getItem('currentConversationId');
    if (lastUsedId && conversations.some(c => c.id === lastUsedId)) {
      switchConversation(lastUsedId);
    } else {
      switchConversation(conversations[0].id);
    }
  }
}

// ========== 新建会话 ==========
export function createNewConversation() {
  const newId = generateConversationId();
  const newTitle = `对话 ${conversations.length + 1}`;
  const newConversation = {
    id: newId,
    title: newTitle,
    messages: []
  };
  conversations.push(newConversation);
  saveConversations();
  switchConversation(newId);
  showToast('已创建新对话');

  const input = document.getElementById('messageInput');
  if (input) {
    input.focus();
  }
}

// ========== 切换会话 ==========
export function switchConversation(conversationId) {
  currentConversationId = conversationId;
  localStorage.setItem('currentConversationId', conversationId);
  renderCurrentConversation();
  renderHistorySidebar();
}

// ========== 渲染当前会话 ==========
function renderCurrentConversation() {
  const chatHistory = document.getElementById("chatHistory");
  if (!chatHistory) return;

  chatHistory.innerHTML = '';

  const conversation = getCurrentConversation();
  if (!conversation) return;

  conversation.messages.forEach(msg => {
    addMessageToChat(msg.author, msg.content, msg.className, false);
  });
}

// ========== 获取当前会话对象 ==========
function getCurrentConversation() {
  return conversations.find(c => c.id === currentConversationId);
}

// ========== 发送消息 ==========
export async function sendMessage() {
  if (isSending) return;
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const message = messageInput.value.trim();
  if (!message) return;

  const apiKey = localStorage.getItem('apiKey');
  if (!apiKey) {
    showToast('请在设置中配置 API Key。');
    return;
  }
  // 读取 Base URL，默认 https://generativelanguage.googleapis.com
  const baseUrl = localStorage.getItem('apiBaseUrl') || 'https://generativelanguage.googleapis.com';
  // 读取模型 ID，默认 gemini-2.0-flash-exp
  const modelId = localStorage.getItem('modelId') || 'gemini-2.0-flash-exp';

  const conversation = getCurrentConversation();
  if (!conversation) {
    showToast('当前对话不存在，请新建或切换对话。');
    return;
  }

  isSending = true;
  sendButton.disabled = true;
  sendButton.innerHTML = '<span class="material-icons">sync</span> 发送中...';

  // 1. 添加用户消息
  addMessageToChat('User', message, 'user-message', false);
  conversation.messages.push({
    author: 'User',
    content: message,
    className: 'user-message',
    isStream: false
  });

  // 如果是该对话的第一条，则更新标题
  if (conversation.messages.length === 1) {
    conversation.title = truncateTitle(message, 20);
    saveConversations();
    renderHistorySidebar();
  }

  messageInput.value = '';
  adjustTextareaHeight(messageInput);

  // 2. “生成中”占位
  const loadingMessage = addMessageToChat('Gemini AI', '生成回复中...', 'bot-message', true);

  try {
    // 拼接路径：/v1beta/models/${modelId}:generateContent
    const response = await fetch(
      `${baseUrl}/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: message }] }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP 错误！状态: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，我无法生成回复。';

    removeLoadingMessage(loadingMessage);

    if (enableStreaming) {
      addStreamMessageToChat('Gemini AI', botResponse, 'bot-message');
      conversation.messages.push({
        author: 'Gemini AI',
        content: botResponse,
        className: 'bot-message',
        isStream: true
      });
    } else {
      addMessageToChat('Gemini AI', botResponse, 'bot-message', false);
      conversation.messages.push({
        author: 'Gemini AI',
        content: botResponse,
        className: 'bot-message',
        isStream: false
      });
    }

    saveConversations();
  } catch (error) {
    console.error("错误:", error);
    removeLoadingMessage(loadingMessage);
    addMessageToChat('Gemini AI', `错误: ${error.message}`, 'bot-message', false);
    conversation.messages.push({
      author: 'Gemini AI',
      content: `错误: ${error.message}`,
      className: 'bot-message',
      isStream: false
    });
    saveConversations();
  } finally {
    sendButton.disabled = false;
    sendButton.innerHTML = '<span class="material-icons">send</span> 发送';
    isSending = false;
  }
}

// ========== 添加静态消息到聊天区 ==========
export function addMessageToChat(author, message, className, isLoading = false) {
  const chatHistory = document.getElementById("chatHistory");
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${className}`;
  messageDiv.setAttribute('tabindex', '0');

  let content = '';
  if (isLoading && className === 'bot-message') {
    content = '<div class="spinner" aria-label="加载中"></div>';
  } else {
    content = DOMPurify.sanitize(marked.parse(message));
  }

  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="author">${escapeHTML(author)}:</div>
      <div class="content">${content}</div>
      ${
        !isLoading
          ? `
            <div class="message-actions">
              <button class="copy-button" aria-label="复制消息">
                <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24" fill="#555">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z"/>
                </svg>
              </button>
              <button class="delete-button" aria-label="删除消息">
                <span class="material-icons">delete</span>
              </button>
            </div>
          `
          : ''
      }
    </div>
  `;
  chatHistory.appendChild(messageDiv);

  setTimeout(() => messageDiv.classList.add('show'), 10);
  scrollToBottomIfNeeded(chatHistory);

  if (!isLoading) {
    const copyBtn = messageDiv.querySelector('.copy-button');
    const deleteBtn = messageDiv.querySelector('.delete-button');
    if (copyBtn) copyBtn.addEventListener('click', () => copyMessage(messageDiv));
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        deleteMessage(messageDiv);
        removeMessageFromCurrentConversation(author, message);
      });
    }

    // 渲染公式与代码
    MathJax.typesetPromise([messageDiv.querySelector('.content')]).then(() => {
      Prism.highlightAllUnder(messageDiv);
      addCopyButtonsToCodeBlocks(messageDiv);
    }).catch(err => console.error('MathJax 渲染错误:', err));

    renderHistorySidebar();
  }
  return messageDiv;
}

// ========== 流式输出（打字机效果） ==========
function addStreamMessageToChat(author, fullMessage, className) {
  const chatHistory = document.getElementById("chatHistory");
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${className}`;
  messageDiv.setAttribute('tabindex', '0');
  messageDiv.dataset.stream = 'true';

  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="author">${escapeHTML(author)}:</div>
      <div class="content"></div>
      <div class="message-actions">
        <button class="copy-button" aria-label="复制消息">
          <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24" fill="#555">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z"/>
          </svg>
        </button>
        <button class="delete-button" aria-label="删除消息">
          <span class="material-icons">delete</span>
        </button>
      </div>
    </div>
  `;
  chatHistory.appendChild(messageDiv);

  setTimeout(() => messageDiv.classList.add('show'), 10);
  scrollToBottomIfNeeded(chatHistory);

  const copyBtn = messageDiv.querySelector('.copy-button');
  const deleteBtn = messageDiv.querySelector('.delete-button');
  if (copyBtn) copyBtn.addEventListener('click', () => copyMessage(messageDiv));
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      deleteMessage(messageDiv);
      removeMessageFromCurrentConversation(author, fullMessage);
    });
  }

  const contentDiv = messageDiv.querySelector('.content');
  let index = 0;
  let partialText = '';

  function typeNextChar() {
    if (index < fullMessage.length) {
      partialText += fullMessage.charAt(index);
      index++;
      const safeHTML = DOMPurify.sanitize(marked.parse(partialText));
      contentDiv.innerHTML = safeHTML;

      MathJax.typesetPromise([contentDiv]).then(() => {
        Prism.highlightAllUnder(contentDiv);
        addCopyButtonsToCodeBlocks(messageDiv);
        scrollToBottomIfNeeded(chatHistory);
      }).catch(err => console.error('MathJax 渲染错误:', err));

      setTimeout(typeNextChar, 5);
    } else {
      messageDiv.dataset.stream = 'false';
      const conversation = getCurrentConversation();
      if (conversation && conversation.messages.length > 0) {
        const lastMsg = conversation.messages[conversation.messages.length - 1];
        if (lastMsg.isStream) {
          lastMsg.isStream = false;
          saveConversations();
        }
      }
      renderHistorySidebar();
    }
  }

  typeNextChar();
}

function removeLoadingMessage(messageDiv) {
  if (messageDiv) {
    messageDiv.classList.remove('show');
    setTimeout(() => {
      messageDiv.remove();
    }, 300);
  }
}

// ========== 清空当前对话 ==========
export function clearChat() {
  const conversation = getCurrentConversation();
  if (conversation) {
    conversation.messages = [];
  }
  saveConversations();
  renderCurrentConversation();
  renderHistorySidebar();
  showToast('当前对话已清除。');
}

function removeMessageFromCurrentConversation(author, content) {
  const conversation = getCurrentConversation();
  if (!conversation) return;
  const idx = conversation.messages.findIndex(msg => msg.author === author && msg.content === content);
  if (idx !== -1) {
    conversation.messages.splice(idx, 1);
    saveConversations();
  }
}

// ========== 本地存储 ==========
function saveConversations() {
  localStorage.setItem('conversations', JSON.stringify(conversations));
}
function loadConversations() {
  const data = localStorage.getItem('conversations');
  if (data) {
    conversations = JSON.parse(data);
  } else {
    conversations = [];
  }
}

// ========== 工具函数 ==========

function generateConversationId() {
  return 'conv-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}
function scrollToBottomIfNeeded(element) {
  if (autoScroll && isScrolledToBottom(element)) {
    element.scrollTop = element.scrollHeight;
  }
}
function isScrolledToBottom(element) {
  return element.scrollHeight - element.clientHeight <= element.scrollTop + 1;
}

export function adjustTextareaHeight(textarea) {
  const maxHeight = window.innerHeight / 3; 
  textarea.style.height = 'auto';
  const newHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = newHeight + 'px';
}

function truncateTitle(str, maxLength = 20) {
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
}
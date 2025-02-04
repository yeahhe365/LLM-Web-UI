// chat.js: 聊天核心逻辑（已修改支持直接渲染 LaTeX 公式、“停止”功能以及连续对话时传递完整历史）

import { showToast, copyMessage, deleteMessage, addCopyButtonsToCodeBlocks, escapeHTML } from './utils.js';
import { renderHistorySidebar } from './sidebar.js';

let isSending = false;
let stopStreaming = false;      // 当用户点击停止时置为 true
let currentAbortController = null;  // 用于中断 fetch 请求
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

// ★ 新增：格式化会话历史记录，转换为 OpenAI 接口所需的消息数组
function getFormattedMessages(conversation) {
  // 将会话中的每条消息转换为 { role, content } 格式
  // 这里约定：用户消息（author 为 "User"）对应 role "user"，其他消息视为 "assistant"
  return conversation.messages.map(msg => {
    return {
      role: msg.author === "User" ? "user" : "assistant",
      content: msg.content
    };
  });
}

// ★ 新增：读取当前激活的 API 配置
function getActiveApiConfig() {
  let apiConfigs = [];
  try {
    apiConfigs = JSON.parse(localStorage.getItem('apiConfigs')) || [];
  } catch (e) {
    apiConfigs = [];
  }
  const activeId = localStorage.getItem('activeApiConfigId');
  let activeConfig = apiConfigs.find(cfg => cfg.id === activeId);
  if (!activeConfig) {
    // 若没有配置或激活项，则使用默认配置
    activeConfig = {
      id: 'default',
      name: '默认模型',
      apiKey: '',
      apiBaseUrl: 'https://api.openai.com',
      modelId: '',
      apiFormat: 'openai'
    };
  }
  return activeConfig;
}

// ========== 发送消息 ==========
export async function sendMessage() {
  if (isSending) return;
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const message = messageInput.value.trim();
  if (!message) return;

  // ★ 读取当前激活的 API 配置
  const activeConfig = getActiveApiConfig();
  if (!activeConfig.apiKey) {
    showToast('请在设置中配置 API Key。');
    return;
  }
  const { apiKey, apiBaseUrl, modelId, apiFormat } = activeConfig;

  const conversation = getCurrentConversation();
  if (!conversation) {
    showToast('当前对话不存在，请新建或切换对话。');
    return;
  }

  // ★ 新增：设置中断相关变量，并创建 AbortController（用于中断 fetch）
  isSending = true;
  stopStreaming = false;
  currentAbortController = new AbortController();

  // ★ 修改：发送中按钮变为“停止”按钮（按钮保持可点击状态）
  sendButton.innerHTML = '<span class="material-icons">stop</span> 停止';

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

  // 2. “生成中”占位，使用 botName
  const botName = activeConfig.name || "LLM Chat";
  const loadingMessage = addMessageToChat(botName, '生成回复中...', 'bot-message', true);

  try {
    let botResponse = '';
    if (apiFormat === 'openai') {
      // OpenAI 接口调用，传递整个会话历史（格式化后）以便连续对话时上下文完整
      const response = await fetch(`${apiBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: getFormattedMessages(conversation)
        }),
        signal: currentAbortController.signal
      });
      if (!response.ok) {
        throw new Error(`HTTP 错误！状态: ${response.status}`);
      }
      const data = await response.json();
      botResponse = data.choices?.[0]?.message?.content || '抱歉，我无法生成回复。';
    } else {
      // LLM Chat（原 Gemini 格式）接口调用（此处未修改历史传递逻辑，可根据实际 API 要求调整）
      const response = await fetch(
        `${apiBaseUrl}/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: message }] }
            ]
          }),
          signal: currentAbortController.signal
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP 错误！状态: ${response.status}`);
      }
      const data = await response.json();
      botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，我无法生成回复。';
    }

    removeLoadingMessage(loadingMessage);

    if (enableStreaming) {
      addStreamMessageToChat(botName, botResponse, 'bot-message');
      conversation.messages.push({
        author: botName,
        content: botResponse,
        className: 'bot-message',
        isStream: true
      });
    } else {
      addMessageToChat(botName, botResponse, 'bot-message', false);
      conversation.messages.push({
        author: botName,
        content: botResponse,
        className: 'bot-message',
        isStream: false
      });
    }

    saveConversations();
  } catch (error) {
    console.error("错误:", error);
    removeLoadingMessage(loadingMessage);
    if (error.name === 'AbortError') {
      addMessageToChat(botName, '生成已停止。', 'bot-message', false);
    } else {
      addMessageToChat(botName, `错误: ${error.message}`, 'bot-message', false);
    }
    conversation.messages.push({
      author: botName,
      content: error.name === 'AbortError' ? '生成已停止。' : `错误: ${error.message}`,
      className: 'bot-message',
      isStream: false
    });
    saveConversations();
  } finally {
    // ★ 恢复按钮显示为“发送”
    sendButton.innerHTML = '<span class="material-icons">send</span> 发送';
    isSending = false;
    currentAbortController = null;
  }
}

// ★ 新增：停止当前发送（中断 fetch 和流式打字效果）
export function stopSending() {
  if (isSending && currentAbortController) {
    currentAbortController.abort();
    stopStreaming = true;
  }
}

// ★ 新增：获取发送状态
export function getIsSending() {
  return isSending;
}

// ========== 添加静态消息到聊天区 ==========
export function addMessageToChat(author, message, className, isLoading = false) {
  const chatHistory = document.getElementById("chatHistory");
  if (!chatHistory) return null;
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${className}`;
  messageDiv.setAttribute('tabindex', '0');
  // ★ 保存原始 Markdown 文本
  messageDiv.setAttribute('data-original-markdown', message);

  let content = '';
  if (isLoading && className === 'bot-message') {
    content = '<div class="spinner" aria-label="加载中"></div>';
  } else {
    // ★ 使用 marked.parse 将消息转换为 HTML；此时数学公式（$…$ 或 $$…$$）会按扩展规则保留原样
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

    // ★ 修改：只对 <pre> 内的 <code> 元素执行 Prism 高亮
    MathJax.typesetPromise([messageDiv.querySelector('.content')]).then(() => {
      messageDiv.querySelectorAll('pre > code').forEach(block => {
        Prism.highlightElement(block);
      });
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
  // ★ 保存原始 Markdown 文本
  messageDiv.setAttribute('data-original-markdown', fullMessage);

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
  let lastTime = performance.now();

  function typeNextChar() {
    if (stopStreaming) {
      // ★ 若用户已点击停止，则直接将完整内容显示出来
      const safeHTML = DOMPurify.sanitize(marked.parse(fullMessage));
      contentDiv.innerHTML = safeHTML;
      MathJax.typesetPromise([contentDiv]).then(() => {
        contentDiv.querySelectorAll('pre > code').forEach(block => {
          Prism.highlightElement(block);
        });
        addCopyButtonsToCodeBlocks(messageDiv);
        scrollToBottomIfNeeded(chatHistory);
      }).catch(err => console.error('MathJax 渲染错误:', err));
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
      return;
    }
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    let charsToAdd = Math.floor(delta / 5);
    if (charsToAdd < 1) charsToAdd = 1;
    const newIndex = Math.min(index + charsToAdd, fullMessage.length);
    partialText = fullMessage.substring(0, newIndex);
    index = newIndex;
    const safeHTML = DOMPurify.sanitize(marked.parse(partialText));
    contentDiv.innerHTML = safeHTML;
    MathJax.typesetPromise([contentDiv]).then(() => {
      contentDiv.querySelectorAll('pre > code').forEach(block => {
        Prism.highlightElement(block);
      });
      addCopyButtonsToCodeBlocks(messageDiv);
      scrollToBottomIfNeeded(chatHistory);
    }).catch(err => console.error('MathJax 渲染错误:', err));
    if (index < fullMessage.length) {
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

// ★ 新增：删除会话（修复新建对话时被删会话重新出现的问题） 
export function deleteConversation(conversationId) {
  const index = conversations.findIndex(c => c.id === conversationId);
  if (index !== -1) {
    conversations.splice(index, 1);
    saveConversations();
    // 如果删除的会话是当前激活的会话，则自动切换到其他会话或新建会话
    if (currentConversationId === conversationId) {
      if (conversations.length > 0) {
        currentConversationId = conversations[0].id;
        localStorage.setItem('currentConversationId', currentConversationId);
        renderCurrentConversation();
      } else {
        createNewConversation();
      }
    }
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
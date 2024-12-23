/* 已移除 API_KEY 常量 */

let isSending = false;
let autoScroll = true;
let enableStreaming = true; // 是否启用流式输出

// 初始化
function initChat() {
    // 如果有需要可以在此处做初始化操作
}

// 从 localStorage 加载聊天记录
function loadChatHistory() {
    const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    history.forEach(msg => {
        // 注意：本示例仍保留了 chatHistory 中原本可能存储的 timestamp，
        // 但我们不会在界面上显示它，也不会使用它。
        if (msg.isStream) {
            addStreamMessageToChat(msg.author, msg.message, msg.className);
        } else {
            addMessageToChat(msg.author, msg.message, msg.className, false);
        }
    });
}

// 保存聊天记录到 localStorage
function saveChatHistory() {
    const messages = Array.from(document.querySelectorAll('.message')).map(msg => {
        const author = msg.querySelector('.author').innerText.replace(':', '');
        const message = msg.querySelector('.content').innerHTML;
        const className = msg.classList.contains('user-message') ? 'user-message' : 'bot-message';
        const isStream = msg.dataset.stream === 'true';
        return { author, message, className, isStream };
    });
    localStorage.setItem('chatHistory', JSON.stringify(messages));
}

initChat();
loadChatHistory();

// 页面关闭前保存聊天记录
window.addEventListener('beforeunload', saveChatHistory);

// 检查是否滚动到底部
function isScrolledToBottom(element) {
    return element.scrollHeight - element.clientHeight <= element.scrollTop + 1;
}

// 若开启自动滚动，则滚动到底部
function scrollToBottomIfNeeded(element) {
    if (autoScroll && isScrolledToBottom(element)) {
        element.scrollTop = element.scrollHeight;
    }
}

// 发送消息
async function sendMessage() {
    if (isSending) return; // 防止重复点击
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const message = messageInput.value.trim();
    if (!message) return;

    // 获取 API Key
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
        showToast('请在设置中配置 API Key。');
        return;
    }

    isSending = true;
    sendButton.disabled = true;
    sendButton.textContent = '发送中...';

    // 添加用户消息（去掉时间显示）
    addMessageToChat('User', message, 'user-message', false);
    messageInput.value = '';
    adjustTextareaHeight(messageInput);

    // 显示加载中（作为 bot 的占位符）
    const loadingMessage = addMessageToChat('Gemini AI', '生成回复中...', 'bot-message', true);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: message }] }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP 错误！状态: ${response.status}`);
        }

        const data = await response.json();
        const botResponse = data.candidates[0]?.content?.parts[0]?.text || '抱歉，我无法生成回复。';

        // 去掉加载信息
        removeLoadingMessage(loadingMessage);

        if (enableStreaming) {
            // 添加流式输出消息
            addStreamMessageToChat('Gemini AI', botResponse, 'bot-message');
        } else {
            // 直接添加完整消息
            addMessageToChat('Gemini AI', botResponse, 'bot-message', false);
        }
    } catch (error) {
        console.error("错误:", error);
        removeLoadingMessage(loadingMessage);
        addMessageToChat('Gemini AI', `错误: ${error.message}`, 'bot-message', false);
    } finally {
        sendButton.disabled = false;
        sendButton.textContent = '发送';
        isSending = false;
    }
}

// 添加消息（静态）
function addMessageToChat(author, message, className, isLoading = false) {
    const chatHistory = document.getElementById("chatHistory");
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.setAttribute('tabindex', '0'); // 让消息可聚焦

    // 处理消息内容
    let content = '';
    if (isLoading && className === 'bot-message') {
        content = '<div class="spinner" aria-label="加载中"></div>';
    } else if (className === 'user-message') {
        content = escapeHTML(message); // 用户消息只做简单转义
    } else {
        // bot消息支持 Markdown，直接传递未转义的内容，并使用 DOMPurify 清理
        content = DOMPurify.sanitize(marked.parse(message)); 
    }

    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="author">${escapeHTML(author)}:</div>
            <div class="content">${content}</div>
            <!-- 去掉 timestamp -->
            ${!isLoading ? `
            <div class="message-actions">
                <button class="copy-button" aria-label="复制消息">
                    <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24" fill="#555">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z"/>
                    </svg>
                </button>
                <button class="delete-button" aria-label="删除消息">
                    <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24" fill="#555">
                        <path d="M3 6h18v2H3V6zm3 3h12v12H6V9zm4 2v8h4v-8H10z"/>
                    </svg>
                </button>
            </div>
            ` : ''}
    `;
    chatHistory.appendChild(messageDiv);

    // 延迟添加 'show' 类以触发动画
    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 10);

    scrollToBottomIfNeeded(chatHistory);

    if (!isLoading) {
        // 绑定复制、删除事件
        const copyBtn = messageDiv.querySelector('.copy-button');
        const deleteBtn = messageDiv.querySelector('.delete-button');
        if (copyBtn) copyBtn.addEventListener('click', () => copyMessage(messageDiv));
        if (deleteBtn) deleteBtn.addEventListener('click', () => deleteMessage(messageDiv));

        // 渲染数学公式
        MathJax.typesetPromise([messageDiv.querySelector('.content')]).then(() => {
            // 渲染完成后，应用 Prism.js 语法高亮
            Prism.highlightAllUnder(messageDiv);
            // 添加复制按钮到所有代码块
            addCopyButtonsToCodeBlocks(messageDiv);
        }).catch(function (err) {
            console.error('MathJax 类型设置错误: ' + err.message);
        });
    }
    return messageDiv;
}

// 添加消息（流式输出）
function addStreamMessageToChat(author, fullMessage, className) {
    const chatHistory = document.getElementById("chatHistory");
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.setAttribute('tabindex', '0'); // 让消息可聚焦
    messageDiv.dataset.stream = 'true'; // 标记为流式消息

    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="author">${escapeHTML(author)}:</div>
            <div class="content"></div>
            <!-- 去掉 timestamp -->
            <div class="message-actions">
                <button class="copy-button" aria-label="复制消息">
                    <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24" fill="#555">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z"/>
                    </svg>
                </button>
                <button class="delete-button" aria-label="删除消息">
                    <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24" fill="#555">
                        <path d="M3 6h18v2H3V6zm3 3h12v12H6V9zm4 2v8h4v-8H10z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    chatHistory.appendChild(messageDiv);

    // 延迟添加 'show' 类以触发动画
    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 10);

    scrollToBottomIfNeeded(chatHistory);

    // 绑定复制、删除事件
    const copyBtn = messageDiv.querySelector('.copy-button');
    const deleteBtn = messageDiv.querySelector('.delete-button');
    if (copyBtn) copyBtn.addEventListener('click', () => copyMessage(messageDiv));
    if (deleteBtn) deleteBtn.addEventListener('click', () => deleteMessage(messageDiv));

    // 流式显示消息
    const contentDiv = messageDiv.querySelector('.content');
    let index = 0;
    const delay = 5; // 每个字符的延迟时间（毫秒）可自行调整

    function typeNextChar() {
        if (index < fullMessage.length) {
            const char = fullMessage.charAt(index);
            if (char === '\n') {
                contentDiv.innerHTML += '<br>';
            } else {
                contentDiv.innerHTML += escapeHTML(char);
            }
            index++;
            if (autoScroll) {
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }
            setTimeout(typeNextChar, delay);
        } else {
            messageDiv.dataset.stream = 'false'; // 流式结束
            // 完成后重新渲染 Markdown 和数学公式
            contentDiv.innerHTML = DOMPurify.sanitize(marked.parse(contentDiv.innerText));
            MathJax.typesetPromise([contentDiv]).then(() => {
                // 渲染完成后，应用 Prism.js 语法高亮
                Prism.highlightAllUnder(contentDiv);
                // 添加复制按钮到所有代码块
                addCopyButtonsToCodeBlocks(messageDiv);
            }).catch(function (err) {
                console.error('MathJax 类型设置错误: ' + err.message);
            });
        }
    }

    typeNextChar();
}

// 移除加载中的消息
function removeLoadingMessage(messageDiv) {
    if (messageDiv) {
        messageDiv.classList.remove('show');
        setTimeout(() => {
            messageDiv.remove();
        }, 300); // 等待动画完成后移除
    }
}

// 清除聊天记录
function clearChat() {
    const chatHistory = document.getElementById("chatHistory");
    chatHistory.innerHTML = '';
    localStorage.removeItem('chatHistory');
    showToast('聊天记录已清除。');
}

// 调整文本域高度
function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

// 复制消息
function copyMessage(messageDiv) {
    const messageContent = messageDiv.querySelector('.content').innerText; // 使用 innerText 以保留换行
    navigator.clipboard.writeText(messageContent).then(() => {
        showToast('消息已复制到剪贴板！');
    }).catch(err => {
        console.error('复制失败: ', err);
        showToast('复制消息失败。');
    });
}

// 删除消息
function deleteMessage(messageDiv) {
    messageDiv.classList.remove('show');
    setTimeout(() => {
        messageDiv.remove();
        saveChatHistory();
        showToast('消息已删除。');
    }, 300); // 等待动画完成后移除
}

// 显示 Toast 通知
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// HTML 转义，防止 XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 监听输入框高度变化
const messageInput = document.getElementById("messageInput");
messageInput.addEventListener("input", function() {
    adjustTextareaHeight(this);
});

// 回车发送消息
messageInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// 主题切换
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener('change', function() {
    if (this.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        document.getElementById('themeSelect').value = 'dark';
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        document.getElementById('themeSelect').value = 'light';
    }
});

// 从 localStorage 加载主题
function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.checked = false;
    }
    document.getElementById('themeSelect').value = theme;
}

// 从 localStorage 加载字体大小
function loadFontSize() {
    const fontSize = localStorage.getItem('fontSize') || '16px';
    document.documentElement.style.setProperty('--font-size', fontSize);
    document.getElementById('fontSizeSelect').value = fontSize;
}

// 从 localStorage 加载自动滚动配置
function loadAutoScroll() {
    const autoScrollSetting = localStorage.getItem('autoScroll') === 'true';
    autoScroll = autoScrollSetting;
    document.getElementById('autoScrollToggle').checked = autoScrollSetting;
}

// 从 localStorage 加载流式输出配置
function loadStreamingSetting() {
    const streamingSetting = localStorage.getItem('enableStreaming') !== 'false'; // 默认启用
    enableStreaming = streamingSetting;
    document.getElementById('streamingToggle').checked = streamingSetting;
}

// 从 localStorage 加载 API Key
function loadApiKey() {
    const apiKey = localStorage.getItem('apiKey') || '';
    document.getElementById('apiKeyInput').value = apiKey;
}

// 统一加载所有设置
function loadSettings() {
    loadTheme();
    loadFontSize();
    loadAutoScroll();
    loadStreamingSetting();
    loadApiKey();
}

loadSettings();

// 设置弹窗相关交互
const settingsModal = document.getElementById("settingsModal");
const openSettingsBtn = document.getElementById("openSettings");
const closeSettingsBtn = document.getElementById("closeSettings");
const saveSettingsBtn = document.getElementById("saveSettings");
const cancelSettingsBtn = document.getElementById("cancelSettings");
const clearCacheBtn = document.getElementById("clearCacheButton"); // 新增清理缓存按钮

// 打开设置弹窗
openSettingsBtn.onclick = function() {
    settingsModal.style.display = "flex";
    settingsModal.setAttribute('aria-hidden', 'false');
    // 设置焦点到模态框
    settingsModal.querySelector('.modal-content').focus();
}

// 关闭设置弹窗
closeSettingsBtn.onclick = function() {
    settingsModal.style.display = "none";
    settingsModal.setAttribute('aria-hidden', 'true');
}
cancelSettingsBtn.onclick = function() {
    settingsModal.style.display = "none";
    settingsModal.setAttribute('aria-hidden', 'true');
}

// 关闭模态框当点击窗口外部
window.onclick = function(event) {
    if (event.target == settingsModal) {
        settingsModal.style.display = "none";
        settingsModal.setAttribute('aria-hidden', 'true');
    }
}

// 键盘导航支持：按 Esc 键关闭模态框
window.addEventListener('keydown', function(event) {
    if (event.key === "Escape" && settingsModal.style.display === "flex") {
        settingsModal.style.display = "none";
        settingsModal.setAttribute('aria-hidden', 'true');
    }
});

// 保存设置
saveSettingsBtn.onclick = function() {
    const selectedTheme = document.getElementById('themeSelect').value;
    const selectedFontSize = document.getElementById('fontSizeSelect').value;
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const autoScrollSetting = document.getElementById('autoScrollToggle').checked;
    const streamingSetting = document.getElementById('streamingToggle').checked;

    // 主题
    if (selectedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.checked = false;
    }
    localStorage.setItem('theme', selectedTheme);

    // 字体大小
    document.documentElement.style.setProperty('--font-size', selectedFontSize);
    localStorage.setItem('fontSize', selectedFontSize);

    // API Key
    if (apiKey) {
        localStorage.setItem('apiKey', apiKey);
    } else {
        localStorage.removeItem('apiKey');
    }

    // 自动滚动
    autoScroll = autoScrollSetting;
    localStorage.setItem('autoScroll', autoScrollSetting);

    // 流式输出
    enableStreaming = streamingSetting;
    localStorage.setItem('enableStreaming', streamingSetting);

    settingsModal.style.display = "none";
    settingsModal.setAttribute('aria-hidden', 'true');
    showToast('设置已保存。');
}

// 清理缓存功能
clearCacheBtn.onclick = function() {
    if (confirm("确定要清理所有缓存吗？这将重置所有设置并清除聊天记录。")) {
        localStorage.clear();
        // 清除聊天记录
        const chatHistory = document.getElementById("chatHistory");
        chatHistory.innerHTML = '';
        // 重置设置到默认值
        document.body.classList.remove('dark-mode');
        themeToggle.checked = false;
        document.documentElement.style.setProperty('--font-size', '16px');
        autoScroll = true;
        enableStreaming = true;
        // 关闭设置弹窗
        settingsModal.style.display = "none";
        settingsModal.setAttribute('aria-hidden', 'true');
        showToast('缓存已清理。设置已重置。');
        // 可选：刷新页面以应用所有默认设置
        // location.reload();
    }
}

// 清除聊天记录按钮
document.getElementById('clearButton').addEventListener('click', clearChat);

// 发送按钮点击事件
document.getElementById('sendButton').addEventListener('click', sendMessage);

// 添加复制按钮到所有代码块
function addCopyButtonsToCodeBlocks(container) {
    const codeBlocks = container.querySelectorAll('pre > code');
    codeBlocks.forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        // 检查是否已经添加了复制按钮
        if (pre.querySelector('.code-copy-button')) return;

        const copyButton = document.createElement('button');
        copyButton.className = 'code-copy-button';
        copyButton.setAttribute('aria-label', '复制代码');
        copyButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z"/>
            </svg>
        `;

        copyButton.addEventListener('click', () => {
            const code = codeBlock.innerText;
            navigator.clipboard.writeText(code).then(() => {
                showToast('代码已复制到剪贴板！');
            }).catch(err => {
                console.error('复制失败: ', err);
                showToast('复制代码失败。');
            });
        });

        pre.appendChild(copyButton);
    });
}

// 事件委托：为未来添加的复制按钮绑定事件
document.getElementById('chatHistory').addEventListener('click', function(event) {
    if (event.target.closest('.code-copy-button')) {
        const copyBtn = event.target.closest('.code-copy-button');
        const codeBlock = copyBtn.closest('pre').querySelector('code');
        if (codeBlock) {
            const code = codeBlock.innerText;
            navigator.clipboard.writeText(code).then(() => {
                showToast('代码已复制到剪贴板！');
            }).catch(err => {
                console.error('复制失败: ', err);
                showToast('复制代码失败。');
            });
        }
    }
});

// 当 DOM 完全加载后，给已有的代码块添加复制按钮
document.addEventListener('DOMContentLoaded', () => {
    const chatHistory = document.getElementById("chatHistory");
    addCopyButtonsToCodeBlocks(chatHistory);
});
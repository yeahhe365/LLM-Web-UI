// settings.js: 管理设置

import { showToast } from './utils.js';
import { setAutoScroll, setEnableStreaming } from './chat.js';

// 载入设置
export function loadSettings() {
  loadTheme();
  loadFontSize();
  loadAutoScroll();
  loadStreamingSetting();
  loadApiKey();
  loadApiBaseUrl();
  loadModelId(); // 新增：载入模型 ID
}

// 初始化与设置弹窗相关的事件
export function initSettingsEvents() {
  const settingsModal = document.getElementById("settingsModal");
  const openSettingsBtn = document.getElementById("openSettings");
  const closeSettingsBtn = document.getElementById("closeSettings");
  const saveSettingsBtn = document.getElementById("saveSettings");
  const cancelSettingsBtn = document.getElementById("cancelSettings");
  const clearCacheBtn = document.getElementById("clearCacheButton");

  // 打开设置弹窗
  openSettingsBtn.onclick = () => {
    settingsModal.style.display = "flex";
    settingsModal.setAttribute('aria-hidden', 'false');
    settingsModal.querySelector('.modal-content').focus();
  };
  // 关闭设置弹窗
  closeSettingsBtn.onclick = () => closeModal();
  cancelSettingsBtn.onclick = () => closeModal();

  // 点击遮罩层或按 Esc 关闭
  window.addEventListener('click', (event) => {
    if (event.target === settingsModal) closeModal();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === "Escape" && settingsModal.style.display === "flex") {
      closeModal();
    }
  });

  function closeModal() {
    settingsModal.style.display = "none";
    settingsModal.setAttribute('aria-hidden', 'true');
  }

  // 保存设置
  saveSettingsBtn.onclick = () => saveAllSettings();

  // 清理缓存
  clearCacheBtn.onclick = () => {
    if (confirm("确定要清理所有缓存吗？这将重置所有设置并清除聊天记录。")) {
      localStorage.clear();
      document.body.classList.remove('dark-mode');
      document.getElementById('themeToggle').checked = false;
      updateThemeIcon(false); 
      document.documentElement.style.setProperty('--font-size', '16px');
      setAutoScroll(true);
      setEnableStreaming(true);

      // 清空聊天区
      const chatHistory = document.getElementById("chatHistory");
      if (chatHistory) chatHistory.innerHTML = '';

      // 关闭弹窗
      closeModal();
      showToast('缓存已清理，设置已重置。');
    }
  };

  // 主题切换
  const themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener('change', function() {
    if (this.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      document.getElementById('themeSelect').value = 'dark';
      updateThemeIcon(true);  
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      document.getElementById('themeSelect').value = 'light';
      updateThemeIcon(false);
    }
  });
}

// ========== 加载各项配置 ==========

function loadTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  const themeToggle = document.getElementById('themeToggle');
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.checked = true;
    updateThemeIcon(true);
  } else {
    document.body.classList.remove('dark-mode');
    themeToggle.checked = false;
    updateThemeIcon(false);
  }
  document.getElementById('themeSelect').value = theme;
}

function updateThemeIcon(isDark) {
  const iconElem = document.getElementById('themeToggleIcon');
  if (!iconElem) return;
  iconElem.textContent = isDark ? 'dark_mode' : 'light_mode';
}

function loadFontSize() {
  const fontSize = localStorage.getItem('fontSize') || '16px';
  document.documentElement.style.setProperty('--font-size', fontSize);
  document.getElementById('fontSizeSelect').value = fontSize;
}

function loadAutoScroll() {
  const autoScrollSetting = localStorage.getItem('autoScroll') === 'true';
  setAutoScroll(autoScrollSetting);
  document.getElementById('autoScrollToggle').checked = autoScrollSetting;
}

function loadStreamingSetting() {
  const streamingSetting = localStorage.getItem('enableStreaming') !== 'false';
  setEnableStreaming(streamingSetting);
  document.getElementById('streamingToggle').checked = streamingSetting;
}

function loadApiKey() {
  const apiKey = localStorage.getItem('apiKey') || '';
  document.getElementById('apiKeyInput').value = apiKey;
}

function loadApiBaseUrl() {
  const apiBaseUrl = localStorage.getItem('apiBaseUrl') || 'https://generativelanguage.googleapis.com';
  document.getElementById('apiUrlInput').value = apiBaseUrl;
}

// ★ 新增：载入模型 ID，默认值为 gemini-2.0-flash-exp
function loadModelId() {
  const modelId = localStorage.getItem('modelId') || 'gemini-2.0-flash-exp';
  document.getElementById('modelIdInput').value = modelId;
}

// ========== 保存配置 ==========
function saveAllSettings() {
  const selectedTheme = document.getElementById('themeSelect').value;
  const selectedFontSize = document.getElementById('fontSizeSelect').value;
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  const autoScrollSetting = document.getElementById('autoScrollToggle').checked;
  const streamingSetting = document.getElementById('streamingToggle').checked;
  const apiBaseUrl = document.getElementById('apiUrlInput').value.trim();
  // 新增：模型 ID
  const modelId = document.getElementById('modelIdInput').value.trim();

  // 主题
  if (selectedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('themeToggle').checked = true;
    localStorage.setItem('theme', 'dark');
    updateThemeIcon(true);
  } else {
    document.body.classList.remove('dark-mode');
    document.getElementById('themeToggle').checked = false;
    localStorage.setItem('theme', 'light');
    updateThemeIcon(false);
  }

  // 字体
  document.documentElement.style.setProperty('--font-size', selectedFontSize);
  localStorage.setItem('fontSize', selectedFontSize);

  // API Key
  if (apiKey) {
    localStorage.setItem('apiKey', apiKey);
  } else {
    localStorage.removeItem('apiKey');
  }

  // 自动滚动
  setAutoScroll(autoScrollSetting);
  localStorage.setItem('autoScroll', autoScrollSetting);

  // 流式输出
  setEnableStreaming(streamingSetting);
  localStorage.setItem('enableStreaming', streamingSetting);

  // API Base URL
  if (apiBaseUrl) {
    localStorage.setItem('apiBaseUrl', apiBaseUrl);
  } else {
    localStorage.removeItem('apiBaseUrl');
  }

  // ★ 模型 ID
  if (modelId) {
    localStorage.setItem('modelId', modelId);
  } else {
    // 用户如果留空，则移除，回到默认
    localStorage.removeItem('modelId');
  }

  // 关闭弹窗 & 提示
  const settingsModal = document.getElementById("settingsModal");
  settingsModal.style.display = "none";
  settingsModal.setAttribute('aria-hidden', 'true');
  showToast('设置已保存。');
}
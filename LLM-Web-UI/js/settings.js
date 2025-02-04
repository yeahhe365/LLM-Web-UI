// settings.js: 管理设置

import { showToast } from './utils.js';
import { setAutoScroll, setEnableStreaming } from './chat.js';

// 载入设置
export function loadSettings() {
  loadTheme();
  loadFontSize();
  loadAutoScroll();
  loadStreamingSetting();
  loadApiConfigs();       // ★ 载入多个 API 配置
  updateApiConfigSelect(); // ★ 更新头部 API 下拉框
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

      const chatHistory = document.getElementById("chatHistory");
      if (chatHistory) chatHistory.innerHTML = '';

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

  // ★ 为 “新增 API 配置” 按钮绑定事件
  const addApiConfigBtn = document.getElementById('addApiConfigButton');
  addApiConfigBtn.addEventListener('click', () => {
    const container = document.getElementById('apiConfigsContainer');
    const newEntry = createApiConfigEntry();
    container.appendChild(newEntry);
  });

  // ★ 新增：绑定“导出 API 配置”和“导入 API 配置”按钮
  const exportApiConfigBtn = document.getElementById('exportApiConfigButton');
  const importApiConfigBtn = document.getElementById('importApiConfigButton');
  const importApiConfigInput = document.getElementById('importApiConfigInput');
  if(exportApiConfigBtn) {
    exportApiConfigBtn.addEventListener('click', () => {
      try {
        let apiConfigs = JSON.parse(localStorage.getItem('apiConfigs')) || [];
        let jsonStr = JSON.stringify(apiConfigs, null, 2);
        const blob = new Blob([jsonStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "api-configs.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('API 配置已导出。');
      } catch (error) {
        console.error("导出 API 配置错误:", error);
        showToast('导出 API 配置失败。');
      }
    });
  }

  if(importApiConfigBtn && importApiConfigInput) {
    importApiConfigBtn.addEventListener('click', () => {
      importApiConfigInput.click();
    });

    importApiConfigInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedConfigs = JSON.parse(e.target.result);
          localStorage.setItem('apiConfigs', JSON.stringify(importedConfigs));
          if (importedConfigs.length > 0) {
            localStorage.setItem('activeApiConfigId', importedConfigs[0].id);
          }
          loadApiConfigs();
          updateApiConfigSelect();
          showToast('API 配置已导入。');
        } catch (error) {
          console.error("导入 API 配置错误:", error);
          showToast('导入 API 配置失败。请检查文件格式。');
        }
      };
      reader.readAsText(file);
      importApiConfigInput.value = "";
    });
  }
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

// ★ 新版：加载 API 配置（多个）
function loadApiConfigs() {
  const container = document.getElementById('apiConfigsContainer');
  container.innerHTML = '';
  let apiConfigs = [];
  try {
    apiConfigs = JSON.parse(localStorage.getItem('apiConfigs')) || [];
  } catch (e) {
    apiConfigs = [];
  }
  apiConfigs.forEach(config => {
    const entry = createApiConfigEntry(config);
    container.appendChild(entry);
  });
}

// ★ 辅助：创建一个 API 配置条目（若 config 为空则创建空白条目）
//   这里我们为每条配置增加上/下按钮来调整顺序
function createApiConfigEntry(config = {}) {
  const entry = document.createElement('div');
  entry.className = 'api-config-entry';
  entry.dataset.id = config.id || ('api-' + Date.now() + '-' + Math.floor(Math.random() * 10000));

  // 注意：下面是主要的 DOM 结构，增加了 “上移”/“下移” 两个按钮
  entry.innerHTML = `
    <div class="setting-item">
      <label>名称:</label>
      <input type="text" class="apiConfigName" placeholder="例如：默认模型" value="${config.name || ''}" />
    </div>
    <div class="setting-item">
      <label>API Key:</label>
      <input type="text" class="apiConfigKey" placeholder="输入你的 API Key" value="${config.apiKey || ''}" />
    </div>
    <div class="setting-item">
      <label>API Base URL:</label>
      <input type="text" class="apiConfigUrl" placeholder="https://api.openai.com" value="${config.apiBaseUrl || 'https://api.openai.com'}" />
    </div>
    <div class="setting-item">
      <label>模型 ID:</label>
      <input type="text" class="apiConfigModelId" placeholder="请输入模型ID" value="${config.modelId || ''}" />
    </div>
    <div class="setting-item">
      <label>API 格式:</label>
      <select class="apiConfigFormat">
        <option value="openai" ${(!config.apiFormat || config.apiFormat === 'openai') ? 'selected' : ''}>OpenAI</option>
        <option value="llmchat" ${config.apiFormat === 'llmchat' ? 'selected' : ''}>Gemini</option>
      </select>
    </div>

    <!-- 新增：上下移动 & 删除按钮区域 -->
    <div class="api-config-actions">
      <button class="move-up-api-config-btn" aria-label="上移此 API 配置">
        <span class="material-icons">arrow_upward</span>
      </button>
      <button class="move-down-api-config-btn" aria-label="下移此 API 配置">
        <span class="material-icons">arrow_downward</span>
      </button>
      <button class="delete-api-config-btn" aria-label="删除此 API 配置">
        <span class="material-icons">delete</span>
      </button>
    </div>
  `;

  // 监听删除
  const deleteBtn = entry.querySelector('.delete-api-config-btn');
  deleteBtn.addEventListener('click', () => {
    entry.remove();
  });

  // 监听上移
  const moveUpBtn = entry.querySelector('.move-up-api-config-btn');
  moveUpBtn.addEventListener('click', () => {
    const parent = entry.parentElement;
    const siblings = Array.from(parent.querySelectorAll('.api-config-entry'));
    const index = siblings.indexOf(entry);
    if (index > 0) {
      // 将当前 entry 插入到上一个节点之前
      parent.insertBefore(entry, siblings[index - 1]);
    }
  });

  // 监听下移
  const moveDownBtn = entry.querySelector('.move-down-api-config-btn');
  moveDownBtn.addEventListener('click', () => {
    const parent = entry.parentElement;
    const siblings = Array.from(parent.querySelectorAll('.api-config-entry'));
    const index = siblings.indexOf(entry);
    if (index < siblings.length - 1) {
      // 将当前 entry 插入到下一个节点的后面
      parent.insertBefore(siblings[index + 1], entry);
    }
  });

  return entry;
}

// ★ 更新页面头部 API 下拉框的内容
function updateApiConfigSelect() {
  const select = document.getElementById('apiConfigSelect');
  if (!select) return;
  let apiConfigs = [];
  try {
    apiConfigs = JSON.parse(localStorage.getItem('apiConfigs')) || [];
  } catch (e) {
    apiConfigs = [];
  }
  select.innerHTML = '';
  apiConfigs.forEach(config => {
    const option = document.createElement('option');
    option.value = config.id;
    option.textContent = config.name || config.id;
    option.title = config.name || config.id; // 鼠标悬浮时显示完整名称
    select.appendChild(option);
  });
  const activeId = localStorage.getItem('activeApiConfigId');
  if (activeId) {
    select.value = activeId;
  } else if (apiConfigs.length > 0) {
    localStorage.setItem('activeApiConfigId', apiConfigs[0].id);
    select.value = apiConfigs[0].id;
  }
}

// ========== 保存配置 ==========
function saveAllSettings() {
  const selectedTheme = document.getElementById('themeSelect').value;
  const selectedFontSize = document.getElementById('fontSizeSelect').value;
  const autoScrollSetting = document.getElementById('autoScrollToggle').checked;
  const streamingSetting = document.getElementById('streamingToggle').checked;

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
  document.documentElement.style.setProperty('--font-size', selectedFontSize);
  localStorage.setItem('fontSize', selectedFontSize);

  setAutoScroll(autoScrollSetting);
  localStorage.setItem('autoScroll', autoScrollSetting);

  setEnableStreaming(streamingSetting);
  localStorage.setItem('enableStreaming', streamingSetting);

  // 收集所有 API 配置条目
  const container = document.getElementById('apiConfigsContainer');
  const entries = container.querySelectorAll('.api-config-entry');
  const apiConfigs = [];
  entries.forEach(entry => {
    const id = entry.dataset.id;
    const name = entry.querySelector('.apiConfigName').value.trim();
    const apiKey = entry.querySelector('.apiConfigKey').value.trim();
    const apiBaseUrl = entry.querySelector('.apiConfigUrl').value.trim();
    const modelId = entry.querySelector('.apiConfigModelId').value.trim();
    const apiFormat = entry.querySelector('.apiConfigFormat').value;
    if (name || apiKey) {
      apiConfigs.push({ id, name, apiKey, apiBaseUrl, modelId, apiFormat });
    }
  });
  localStorage.setItem('apiConfigs', JSON.stringify(apiConfigs));
  if (!localStorage.getItem('activeApiConfigId') && apiConfigs.length > 0) {
    localStorage.setItem('activeApiConfigId', apiConfigs[0].id);
  }

  const settingsModal = document.getElementById("settingsModal");
  settingsModal.style.display = "none";
  settingsModal.setAttribute('aria-hidden', 'true');
  showToast('设置已保存。');

  updateApiConfigSelect();
}
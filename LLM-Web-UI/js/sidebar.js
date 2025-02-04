// sidebar.js: 管理左侧历史记录

import { switchConversation, deleteConversation } from './chat.js';

export function renderHistorySidebar() {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;

  // 读取所有对话
  let conversations = JSON.parse(localStorage.getItem('conversations')) || [];
  historyList.innerHTML = '';

  // 最新对话排在列表顶部
  const reversed = conversations.slice().reverse();

  reversed.forEach((conversation) => {
    const li = document.createElement('li');
    li.className = 'history-item';

    // 标题部分
    const titleSpan = document.createElement('span');
    titleSpan.className = 'history-title';
    titleSpan.textContent = conversation.title;
    // 点击标题可切换会话
    titleSpan.addEventListener('click', () => {
      switchConversation(conversation.id);
    });

    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-history-btn';
    deleteBtn.setAttribute('aria-label', '删除历史记录');
    deleteBtn.innerHTML = '<span class="material-icons">delete</span>';

    // 点击删除该历史记录（调用 chat.js 中的 deleteConversation 来确保全局会话数组被更新）
    deleteBtn.addEventListener('click', (event) => {
      // 避免触发父元素的点击事件（切换会话）
      event.stopPropagation();
      deleteConversation(conversation.id);
      renderHistorySidebar();
    });

    li.appendChild(titleSpan);
    li.appendChild(deleteBtn);

    historyList.appendChild(li);
  });
}

export function initSidebarEvents() {
  const toggleSidebarBtn = document.getElementById('toggleSidebar');
  if (!toggleSidebarBtn) return;

  toggleSidebarBtn.addEventListener('click', () => {
    const mainContainer = document.getElementById('mainContainer');
    mainContainer.classList.toggle('sidebar-collapsed');
  });
}
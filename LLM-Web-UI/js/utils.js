// utils.js: 工具方法

// 显示 Toast 通知
export function showToast(message) {
	const toast = document.getElementById('toast');
	if (!toast) return;
	toast.textContent = message;
	toast.classList.add('show');
	setTimeout(() => {
	  toast.classList.remove('show');
	}, 3000);
  }
  
  // 复制消息
  export function copyMessage(messageDiv) {
	const messageContent = messageDiv.querySelector('.content').innerText;
	navigator.clipboard.writeText(messageContent)
	  .then(() => showToast('消息已复制到剪贴板！'))
	  .catch(err => {
		console.error('复制失败: ', err);
		showToast('复制消息失败。');
	  });
  }
  
  // 删除消息
  export function deleteMessage(messageDiv) {
	messageDiv.classList.remove('show');
	setTimeout(() => {
	  messageDiv.remove();
	  // 保存聊天记录
	  // 这里不直接 import saveChatHistory 是为了避免循环依赖
	  // 建议由外部来调用 saveChatHistory()
	  // 或者直接在 chat.js 中处理
	  // 可以在外部手动再调用： saveChatHistory();
	  showToast('消息已删除。');
	}, 300);
  }
  
  // 给代码块添加复制按钮
  export function addCopyButtonsToCodeBlocks(container) {
	const codeBlocks = container.querySelectorAll('pre > code');
	codeBlocks.forEach(codeBlock => {
	  const pre = codeBlock.parentElement;
	  if (pre.querySelector('.code-copy-button')) return; // 避免重复
  
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
  
  // 简单的 HTML 转义
  export function escapeHTML(str) {
	const div = document.createElement('div');
	div.textContent = str;
	return div.innerHTML;
  }
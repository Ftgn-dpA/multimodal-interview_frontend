// 全局showToast工具函数，自动关闭Toast
export function showToast(setToast, message, type = 'info', duration = 2000) {
  setToast({ visible: true, message, type });
  setTimeout(() => {
    setToast(t => ({ ...t, visible: false }));
  }, duration);
} 
export default {
  alert(title, message, buttons = []) {
    const text = `${title}\n\n${message || ''}`;
    if (buttons.length < 2) { window.alert(text); buttons[0]?.onPress?.(); return; }
    const action = buttons.find(button => button.style !== 'cancel');
    const cancel = buttons.find(button => button.style === 'cancel');
    if (window.confirm(text)) action?.onPress?.(); else cancel?.onPress?.();
  },
};

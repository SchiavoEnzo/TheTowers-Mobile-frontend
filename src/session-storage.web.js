// O navegador mantém a sessão apenas na aba atual; o app nativo usa SecureStore.
export async function getItemAsync(key) { return sessionStorage.getItem(key); }
export async function setItemAsync(key, value) { sessionStorage.setItem(key, value); }
export async function deleteItemAsync(key) { sessionStorage.removeItem(key); }

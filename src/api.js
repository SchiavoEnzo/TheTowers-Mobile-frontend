export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export function createApi(baseUrl, token, fetcher = fetch) {
  return async (path, method = 'GET', body) => {
    if (!/^https?:\/\//.test(baseUrl || '')) throw new Error('Configure EXPO_PUBLIC_API_URL no arquivo .env.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetcher(`${baseUrl.replace(/\/+$/, '')}/${path}`, {
        method,
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (response.status === 204) return null;
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const fields = data?.fields?.map(({ path, message }) => `${path.join('.')}: ${message}`).join('\n');
        throw new ApiError(fields || data?.error || 'Não foi possível concluir a operação.', response.status);
      }
      if (data === null) throw new Error('Resposta inválida da API. Confira a URL configurada.');
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('A conexão demorou demais. Tente novamente.');
      if (error instanceof TypeError) throw new Error('Sem conexão com o servidor. Confira sua rede e a URL da API.');
      throw error;
    } finally { clearTimeout(timeout); }
  };
}

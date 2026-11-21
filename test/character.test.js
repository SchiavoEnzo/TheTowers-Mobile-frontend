import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { toPayload } from '../src/character.js';
import { createApi } from '../src/api.js';
const template = JSON.parse(await readFile(new URL('../src/agent-template.json', import.meta.url)));

test('edição preserva vínculos e extras, converte números e mantém zero', () => {
  const draft = structuredClone(template);
  draft.habilities.extras = { ritual: 'Segredo' };
  draft.habilities.money = ['a'.repeat(24)];
  draft.atributes['current-pv'] = '0';
  draft.atributes.dp = '1,5';
  const payload = toPayload(draft);
  assert.equal(payload.atributes['current-pv'], 0);
  assert.equal(payload.atributes.dp, 1.5);
  assert.deepEqual(payload.habilities.extras, draft.habilities.extras);
  assert.deepEqual(payload.habilities.money, draft.habilities.money);
  assert.equal(draft.atributes.dp, '1,5');
});
test('campos vazios e números inválidos não viram zero silenciosamente', () => {
  for (const value of ['', 'abc', 'Infinity']) {
    const draft = structuredClone(template); draft.atributes.pv = value;
    assert.throws(() => toPayload(draft), /numérico inválido/);
  }
  const draft = structuredClone(template); draft.caractheristics.name = ' ';
  assert.throws(() => toPayload(draft), /Preencha/);
});
test('cliente envia Bearer e JSON, trata 204 e propaga expiração', async () => {
  let options;
  const api = createApi('http://localhost:3002/api/', 'token', async (url, input) => {
    assert.equal(url, 'http://localhost:3002/api/agents'); options = input;
    return { status: 204 };
  });
  assert.equal(await api('agents', 'POST', template), null);
  assert.equal(options.headers.Authorization, 'Bearer token');
  assert.deepEqual(JSON.parse(options.body), template);
  const unauthorized = createApi('http://localhost/api', 'token', async () => ({ status: 401, ok: false, json: async () => ({ error: 'Sessão inválida' }) }));
  await assert.rejects(unauthorized('agents'), e => e.status === 401);
});

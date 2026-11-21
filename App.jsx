import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { createApi } from './src/api';
import { draftFrom, groups, identity, labels, resources, toPayload } from './src/character';
import template from './src/agent-template.json';

const SESSION_KEY = 'torres.mobile.session';
const URL = process.env.EXPO_PUBLIC_API_URL;
const emptyCharacter = draftFrom(template);
for (const key of ['name', 'player-name', 'age', 'formation']) emptyCharacter.caractheristics[key] = '';
emptyCharacter.class = ''; 
function Button({ title, onPress, disabled, secondary, danger }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, danger && s.danger, (disabled || pressed) && { opacity: 0.5 }]}><Text style={s.buttonText}>{title}</Text></Pressable>;
}
function Field({ label, value, onChangeText, numeric, multiline, ...rest }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} style={[s.input, multiline && s.multiline]} placeholderTextColor="#89838f" value={String(value ?? '')} onChangeText={onChangeText} keyboardType={numeric ? 'numbers-and-punctuation' : 'default'} multiline={multiline} {...rest} /></View>;
}
function ErrorNotice({ message }) { return message ? <Text accessibilityRole="alert" style={s.error}>{message}</Text> : null; }

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  async function submit() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const api = createApi(URL);
      const body = { email: email.trim(), password };
      if (register) {
        await api('auth/register', 'POST', body);
        setRegister(false);
      }
      const session = await api('auth/login', 'POST', body);
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
      onLogin(session);
    } catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <ScrollView contentContainerStyle={s.login} keyboardShouldPersistTaps="handled">
    <Text style={s.eyebrow}>AS TORRES / ARQUIVO MOBILE</Text><Text style={s.hero}>Toda história começa com um personagem.</Text>
    <Text style={s.muted}>Suas fichas, atributos e habilidades em um só lugar.</Text>
    <View style={s.card}><Text style={s.title}>{register ? 'Criar conta' : 'Entrar no arquivo'}</Text>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} />
      <Field label="Senha (mínimo de 10 caracteres)" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete={register ? 'new-password' : 'current-password'} editable={!busy} />
      <ErrorNotice message={error} /><Button title={busy ? 'Aguarde…' : register ? 'Cadastrar e entrar' : 'Entrar'} onPress={submit} disabled={busy || !email.trim() || password.length < 10} />
      <Button title={register ? 'Já tenho uma conta' : 'Criar uma conta'} secondary disabled={busy} onPress={() => { setRegister(!register); setError(''); }} />
    </View>
  </ScrollView>;
}

function Archive({ request, onOpen, onNew, onLogout }) {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const generation = useRef(0);
  const paging = useRef(false);
  async function load(append = false) {
    if (append && paging.current) return;
    paging.current = append;
    const id = ++generation.current;
    setBusy(true); setError('');
    try {
      const before = append && records.at(-1)?._id;
      const rows = await request(`agents?q=${encodeURIComponent(query)}${before ? `&before=${before}` : ''}`);
      if (id !== generation.current) return;
      setRecords(old => append ? [...old, ...rows.filter(row => !old.some(item => item._id === row._id))] : rows);
      setMore(rows.length === 100);
    } catch (e) { if (id === generation.current) setError(e.message); }
    finally { if (id === generation.current) { setBusy(false); paging.current = false; } }
  }
  useEffect(() => {
    // Invalida uma busca anterior antes de aguardar o debounce.
    generation.current++; setRecords([]); setMore(false);
    const timer = setTimeout(() => load(), 300);
    return () => { clearTimeout(timer); generation.current++; };
  }, [query, request]);
  return <View style={s.fill}>
    <View style={s.header}><View style={s.grow}><Text style={s.eyebrow}>AS TORRES</Text><Text style={s.title}>Meus personagens</Text></View><Button title="Sair" secondary onPress={onLogout} /></View>
    <View style={s.padded}><Button title="+ Novo personagem" onPress={onNew} /><Field label="Buscar por nome" value={query} onChangeText={setQuery} placeholder="Nome do personagem" maxLength={100} /><ErrorNotice message={error} />{error && <Button title="Tentar novamente" secondary onPress={() => load()} disabled={busy} />}</View>
    <FlatList data={records} keyExtractor={item => item._id} contentContainerStyle={s.list} refreshing={busy} onRefresh={() => load()} keyboardShouldPersistTaps="handled"
      ListEmptyComponent={<View style={s.card}><Text style={s.title}>{busy ? 'Carregando fichas…' : error ? 'Arquivo indisponível' : query ? 'Nenhum resultado' : 'Seu arquivo começa aqui'}</Text><Text style={s.muted}>{!busy && !error && (query ? 'Experimente buscar outro nome.' : 'Crie seu primeiro personagem para iniciar sua história.')}</Text></View>}
      renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${item.data.caractheristics.name}`} onPress={() => onOpen(item)} style={s.card}>
        <Text style={s.eyebrow}>{item.data.class || 'AGENTE'} · NÍVEL {item.data.atributes.level}</Text><Text style={s.name}>{item.data.caractheristics.name}</Text><Text style={s.muted}>{item.data.caractheristics.formation}</Text>
        <View style={s.row}>{['pv', 'dp', 'sanity'].map(key => <View style={s.metric} key={key}><Text style={s.label}>{resources[key]}</Text><Text style={s.value}>{item.data.atributes[`current-${key}`] ?? item.data.atributes[key]} / {item.data.atributes[key]}</Text></View>)}</View><Text style={s.link}>Abrir ficha →</Text>
      </Pressable>}
      ListFooterComponent={more ? <Button title={busy ? 'Carregando…' : 'Carregar mais'} secondary disabled={busy} onPress={() => load(true)} /> : null} />
  </View>;
}

function Character({ record, request, onClose }) {
  const [draft, setDraft] = useState(() => draftFrom(record?.data || emptyCharacter));
  const [editing, setEditing] = useState(!record);
  const [tab, setTab] = useState('identity');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const initial = useRef(JSON.stringify(record?.data || emptyCharacter));
  const dirty = JSON.stringify(draft) !== initial.current;
  function back() {
    if (lock.current) return;
    if (dirty) Alert.alert('Descartar alterações?', 'As alterações não salvas serão perdidas.', [{ text: 'Continuar editando', style: 'cancel' }, { text: 'Descartar', style: 'destructive', onPress: onClose }]);
    else onClose();
  }
  useEffect(() => { const subscription = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; }); return () => subscription.remove(); }, [dirty, onClose]);
  function change(path, value) {
    setDraft(current => {
      const next = draftFrom(current); let part = next;
      for (const key of path.slice(0, -1)) part = part[key];
      part[path.at(-1)] = value; return next;
    });
  }
  async function save() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const saved = await request(record ? `agents/${record._id}` : 'agents', record ? 'PUT' : 'POST', toPayload(draft));
      initial.current = JSON.stringify(saved.data); setDraft(draftFrom(saved.data));
      onClose();
    } catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); }
  }
  function remove() {
    Alert.alert('Excluir personagem?', `${draft.caractheristics.name} será excluído permanentemente.`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: async () => {
      if (lock.current) return;
      lock.current = true; setBusy(true); setError('');
      try { await request(`agents/${record._id}`, 'DELETE'); onClose(); }
      catch (e) { setError(e.message); }
      finally { lock.current = false; setBusy(false); }
    } }]);
  }
  function input(path, label, numeric = false, multiline = false) {
    const value = path.reduce((obj, key) => obj?.[key], draft);
    return <Field key={path.join('.')} label={label} value={value} numeric={numeric} multiline={multiline} editable={editing && !busy} onChangeText={value => change(path, value)} />;
  }
  return <View style={s.fill}>
    <View style={s.header}><Button title="← Voltar" secondary onPress={back} disabled={busy} /><Text style={[s.eyebrow, s.grow]}>{record ? 'FICHA DO PERSONAGEM' : 'NOVO PERSONAGEM'}</Text></View>
    <ScrollView contentContainerStyle={s.padded} keyboardShouldPersistTaps="handled">
      <Text style={s.name}>{draft.caractheristics.name || 'Novo personagem'}</Text><Text style={s.muted}>{editing ? 'Preencha os campos e salve sua ficha.' : 'Consulte sua ficha ou toque em Editar.'}</Text>
      <View style={s.tabs}>{[['identity', 'Identidade'], ['resources', 'Recursos'], ['skills', 'Habilidades']].map(([key, title]) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)} style={[s.tab, tab === key && s.activeTab]}><Text style={s.buttonText}>{title}</Text></Pressable>)}</View>
      {tab === 'identity' && <View style={s.card}>{Object.entries(identity).map(([key, label]) => input(['caractheristics', key], label, false, ['history', 'personality', 'wishes'].includes(key)))}{input(['class'], 'Classe')}{input(['rank'], 'Patente')}</View>}
      {tab === 'resources' && <View style={s.card}>{input(['atributes', 'level'], 'Nível', true)}{Object.entries(resources).map(([key, label]) => <View style={s.row} key={key}><View style={s.grow}>{input(['atributes', key], `${label} · máximo`, true)}</View><View style={s.grow}>{input(['atributes', `current-${key}`], `${label} · atual`, true)}</View></View>)}{['pary', 'dodge'].filter(key => draft.atributes[key] !== undefined).map(key => input(['atributes', key], key === 'pary' ? 'Bloqueio' : 'Esquiva', true))}</View>}
      {tab === 'skills' && Object.entries(groups).map(([group, title]) => <View style={s.card} key={group}><Text style={s.title}>{title}</Text>{Object.keys(draft.habilities[group]).map(key => input(['habilities', group, key], labels[key] || key, true))}</View>)}
      <ErrorNotice message={error} />
      {editing ? <Button title={busy ? 'Salvando…' : 'Salvar personagem'} onPress={save} disabled={busy} /> : <Button title="Editar personagem" onPress={() => setEditing(true)} />}
      {record && <Button title="Excluir personagem" danger secondary onPress={remove} disabled={busy} />}
    </ScrollView>
  </View>;
}

function Mobile() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState(null);
  const [startupError, setStartupError] = useState('');
  const clearSession = useCallback(async () => {
    try { await SecureStore.deleteItemAsync(SESSION_KEY); }
    finally { setSession(null); setScreen(null); }
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(SESSION_KEY);
        if (raw) {
          const stored = JSON.parse(raw);
          if (stored.token && new Date(stored.expires).getTime() > Date.now()) setSession(stored);
          else await clearSession();
        }
      } catch { setStartupError('Não foi possível restaurar a sessão. Entre novamente.'); }
      finally { setReady(true); }
    })();
  }, [clearSession]);
  const request = useCallback(async (...args) => {
    try { return await createApi(URL, session?.token)(...args); }
    catch (e) {
      if (e.status === 401) { await clearSession(); Alert.alert('Sessão expirada', 'Entre novamente para continuar.'); }
      throw e;
    }
  }, [session?.token, clearSession]);
  async function logout() {
    try { await request('auth/logout', 'POST'); }
    catch (e) { if (e.status !== 401) Alert.alert('Saída local', 'A sessão será removida deste aparelho. Sem conexão, a sessão no servidor expira em até 24 horas.'); }
    finally { await clearSession().catch(() => Alert.alert('Armazenamento indisponível', 'Não foi possível apagar a sessão salva.')); }
  }
  return <SafeAreaView style={s.safe}><StatusBar barStyle="light-content" /><KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    {!ready ? <ActivityIndicator style={s.fill} color="#bb8bfa" /> : !session ? <><ErrorNotice message={startupError} /><Login onLogin={value => { setStartupError(''); setSession(value); }} /></> : screen ? <Character key={screen.record?._id || 'new'} record={screen.record} request={request} onClose={() => setScreen(null)} /> : <Archive request={request} onOpen={record => setScreen({ record })} onNew={() => setScreen({ record: null })} onLogout={logout} />}
  </KeyboardAvoidingView></SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><Mobile /></SafeAreaProvider>; }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111213' }, fill: { flex: 1 }, grow: { flex: 1 },
  login: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 18 },
  hero: { color: '#f1edf5', fontSize: 34, fontWeight: '700', lineHeight: 40 },
  eyebrow: { color: '#bb8bfa', fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  title: { color: '#f1edf5', fontSize: 21, fontWeight: '600' }, name: { color: '#f1edf5', fontSize: 27, fontWeight: '700', marginVertical: 8 },
  muted: { color: '#aaa6af', fontSize: 14, lineHeight: 22 }, label: { color: '#c6c0cd', fontSize: 12, marginBottom: 6 },
  field: { marginVertical: 8 }, input: { color: '#f1edf5', backgroundColor: '#111213', borderColor: '#49414f', borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 48, fontSize: 16 }, multiline: { minHeight: 90, textAlignVertical: 'top' },
  button: { backgroundColor: '#7043a1', minHeight: 48, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginVertical: 5 }, secondary: { backgroundColor: '#242027', borderWidth: 1, borderColor: '#665274' }, danger: { borderColor: '#bb5c67', backgroundColor: '#48272d' }, buttonText: { color: '#f5effa', fontSize: 14, fontWeight: '600' },
  error: { color: '#ffb6bc', backgroundColor: '#3c2329', padding: 12, borderRadius: 8, marginVertical: 8 },
  card: { backgroundColor: '#1b1b1f', borderColor: '#37313e', borderWidth: 1, borderRadius: 12, padding: 18, marginVertical: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderBottomWidth: 1, borderBottomColor: '#37313e' }, padded: { padding: 20, paddingBottom: 32 }, list: { paddingHorizontal: 20, paddingBottom: 28 }, row: { flexDirection: 'row', gap: 12, marginTop: 8 }, metric: { flex: 1 }, value: { color: '#f1edf5', fontSize: 16 }, link: { color: '#bb8bfa', marginTop: 18 },
  tabs: { flexDirection: 'row', marginVertical: 16, gap: 6 }, tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#37313e' }, activeTab: { borderBottomColor: '#bb8bfa', backgroundColor: '#26212e' },
});

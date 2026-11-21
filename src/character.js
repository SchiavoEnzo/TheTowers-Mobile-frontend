export const identity = { name: 'Nome do personagem', 'player-name': 'Nome do jogador', age: 'Idade', formation: 'Formação', origin: 'Origem', personality: 'Personalidade', history: 'História', wishes: 'Desejos' };
export const resources = { pv: 'Vida', dp: 'Determinação', sanity: 'Sanidade', shield: 'Armadura', defense: 'Defesa', ammo: 'Munição' };
export const groups = { naturals: 'Habilidades naturais', main: 'Atributos principais', lasts: 'Perícias' };
export const labels = {
  inteligence: 'Inteligência', wisdom: 'Sabedoria', existance: 'Existência', intelect: 'Intelecto', strengh: 'Força', agility: 'Agilidade', charisma: 'Carisma', willing: 'Vontade', acrobacy: 'Acrobacia', art: 'Arte', currents: 'Atualidades', training: 'Adestramento', atlethics: 'Atletismo', science: 'Ciência', crime: 'Crime', diplomacy: 'Diplomacia', decieving: 'Enganação', fortitude: 'Fortitude', furtivity: 'Furtividade', initiative: 'Iniciativa', intimidating: 'Intimidação', intuition: 'Intuição', investigation: 'Investigação', fight: 'Luta', medicine: 'Medicina', ocultism: 'Ocultismo', misticism: 'Misticismo', perception: 'Percepção', piloting: 'Pilotagem', profession: 'Profissão', acuracy: 'Pontaria', reflex: 'Reflexos', religion: 'Religião', surviving: 'Sobrevivência', tatics: 'Tática', technology: 'Tecnologia', force: 'Poder',
};
export function draftFrom(data) { return JSON.parse(JSON.stringify(data)); }
export function toPayload(draft) {
  const data = draftFrom(draft);
  for (const key of ['name', 'player-name', 'age', 'formation']) {
    if (!data.caractheristics[key]?.trim()) throw new Error(`Preencha ${identity[key].toLowerCase()}.`);
  }
  for (const key of Object.keys(identity)) {
    if (typeof data.caractheristics[key] === 'string') data.caractheristics[key] = data.caractheristics[key].trim();
    if (!data.caractheristics[key] && !['name', 'player-name', 'age', 'formation'].includes(key)) delete data.caractheristics[key];
  }
  for (const key of ['class', 'rank']) {
    if (!data[key]?.trim()) delete data[key]; else data[key] = data[key].trim();
  }
  const numbers = [data.atributes, ...Object.keys(groups).map(key => data.habilities[key])];
  for (const values of numbers) for (const key of Object.keys(values)) {
    const raw = String(values[key]).trim().replace(',', '.');
    if (!raw || !Number.isFinite(Number(raw))) throw new Error(`Valor numérico inválido: ${labels[key] || resources[key] || key}.`);
    values[key] = Number(raw);
  }
  return data;
}

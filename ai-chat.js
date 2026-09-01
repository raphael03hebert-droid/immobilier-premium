(() => {
  'use strict';

  const app = document.getElementById('app-view');
  if (!app) return;
  const storageKey = 'gc-ai-chat-history';
  const defaultGreeting = 'Bonjour! Je suis votre assistant immobilier. Je peux vous aider à organiser vos priorités, préparer un suivi client, structurer une transaction ou rédiger un courriel. Que souhaitez-vous faire?';
  const state = { messages: [], busy: false, controller: null, lastError: '' };
  const contextEnabled = () => localStorage.getItem('gc-ai-crm-context') !== 'off';
  const crmContext = () => {
    const read = key => { try { return JSON.parse(localStorage.getItem(`gc-${key}`) || '[]'); } catch { return []; } };
    const clients = read('clients').slice(0, 40).map(item => ({id:item.id,name:item.name,stage:item.stage,type:item.type,owner:item.owner,budget:item.budget,nextActionDate:item.nextActionDate,lastInteraction:item.lastInteraction}));
    const properties = read('properties').slice(0, 40).map(item => ({id:item.id,address:item.address,status:item.status,price:item.price,area:item.area,type:item.type,visits:item.visits}));
    const transactions = read('transactions').slice(0, 40).map(item => ({id:item.id,clientId:item.clientId,propertyId:item.propertyId,status:item.status,price:item.price,commission:item.commission,date:item.date,dueDate:item.dueDate}));
    const visits = read('visits').slice(0, 40).map(item => ({id:item.id,clientId:item.clientId,propertyId:item.propertyId,date:item.date,time:item.time,status:item.status,result:item.result}));
    const tasks = read('tasks').slice(0, 40).map(item => ({id:item.id,title:item.title,date:item.date,time:item.time,status:item.status,priority:item.priority,clientId:item.clientId}));
    return {clients,properties,transactions,visits,tasks,source:'CRM local Geneviève Côté'};
  };
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const isAiPage = () => app.querySelector('.page-title')?.textContent.toLocaleLowerCase('fr-CA').includes('assistant ia');
  const read = () => { try { const value = JSON.parse(localStorage.getItem(storageKey) || '[]'); return Array.isArray(value) ? value.filter(item => item && (item.role === 'user' || item.role === 'assistant')).slice(-40) : []; } catch { return []; } };
  const save = () => localStorage.setItem(storageKey, JSON.stringify(state.messages.slice(-40)));
  const root = () => app.querySelector('[data-ai-root]');

  function shell() {
    const messages = state.messages.length ? state.messages : [{role:'assistant',content:defaultGreeting}];
    return `<section class="gc-ai-chat" data-ai-root><header class="gc-ai-header"><div><span class="gc-ai-orb">✦</span><div><p class="eyebrow">ASSISTANT IMMOBILIER</p><h2>Votre copilote IA</h2><span>Préparez, structurez et vérifiez vos prochaines actions.</span></div></div><div class="gc-ai-header-actions"><span class="gc-ai-live"><i></i>En ligne</span><button type="button" class="btn" data-ai="clear">Nouvelle conversation</button></div></header><div class="gc-ai-suggestions" aria-label="Suggestions"><button type="button" data-ai="suggestion">Prioriser mes actions</button><button type="button" data-ai="suggestion">Préparer un suivi client</button><button type="button" data-ai="suggestion">Structurer une transaction</button></div><label class="gc-ai-context-toggle"><input type="checkbox" data-ai="context-toggle" ${contextEnabled() ? 'checked' : ''}> Utiliser le contexte CRM local pour répondre avec des chiffres et des dates vérifiables</label><div class="gc-ai-messages" data-ai-messages>${messages.map(message => `<article class="gc-ai-message ${message.role === 'user' ? 'is-user' : 'is-assistant'}"><span class="gc-ai-avatar">${message.role === 'user' ? 'Vous' : '✦'}</span><div><small>${message.role === 'user' ? 'Vous' : 'Assistant IA'}</small><p>${esc(message.content)}</p></div></article>`).join('')}</div><div class="gc-ai-error" data-ai-error ${state.lastError ? '' : 'hidden'}>${esc(state.lastError)}</div><form class="gc-ai-chat-form"><textarea name="message" rows="2" maxlength="6000" placeholder="Posez votre question à l’assistant…" aria-label="Message à l’assistant" ${state.busy ? 'disabled' : ''}></textarea><div class="gc-ai-composer-footer"><span>Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne</span>${state.busy ? '<button type="button" class="btn" data-ai="stop">Arrêter</button>' : '<button type="submit" class="btn btn-primary">Envoyer <span>↗</span></button>'}</div></form><p class="gc-ai-disclaimer">L’assistant prépare des suggestions. Vérifiez toujours les informations sensibles avant de les utiliser.</p></section>`;
  }

  function render() {
    if (!isAiPage()) return;
    const card = app.querySelector('.card');
    const existing = root();
    if (existing) { existing.outerHTML = shell(); } else if (card) { card.outerHTML = shell(); }
    const messages = root()?.querySelector('[data-ai-messages]');
    if (messages) messages.scrollTop = messages.scrollHeight;
    root()?.querySelector('textarea')?.focus();
  }

  async function send(value) {
    const content = String(value || '').trim();
    if (!content || state.busy) return;
    state.messages.push({role:'user',content});
    state.busy = true; state.lastError = ''; save(); render();
    state.controller = new AbortController();
    try {
      const response = await fetch('/api/ai-chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({messages:state.messages.slice(-24),context:contextEnabled()?crmContext():null}), signal:state.controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply) throw new Error(data.error || 'La réponse de l’assistant est indisponible.');
      state.messages.push({role:'assistant',content:String(data.reply)}); save();
    } catch (error) {
      state.lastError = error.name === 'AbortError' ? 'Réponse arrêtée.' : (error.message || 'Une erreur est survenue.');
    } finally {
      state.busy = false; state.controller = null; render();
    }
  }

  document.addEventListener('click', event => {
    if (!isAiPage()) return;
    const action = event.target.closest('[data-ai]')?.dataset.ai;
    if (action === 'clear') { state.messages = []; state.lastError = ''; save(); render(); }
    if (action === 'stop' && state.controller) state.controller.abort();
    if (action === 'context-toggle') localStorage.setItem('gc-ai-crm-context', event.target.checked ? 'on' : 'off');
    if (action === 'suggestion') { const text = event.target.closest('[data-ai="suggestion"]').textContent.trim(); const input = root()?.querySelector('textarea'); if (input) { input.value = text; input.focus(); } }
  });
  document.addEventListener('submit', event => { if (event.target.matches('.gc-ai-chat-form')) { event.preventDefault(); const input = event.target.querySelector('textarea'); send(input?.value); if (input) input.value = ''; } });
  document.addEventListener('keydown', event => { if (event.target.matches('.gc-ai-chat-form textarea') && event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.target.form.requestSubmit(); } });
  new MutationObserver(() => { if (isAiPage() && !root()) render(); }).observe(app, {childList:true, subtree:true});
  state.messages = read();
  render();
})();

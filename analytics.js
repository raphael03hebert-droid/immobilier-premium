(() => {
  'use strict';
  const app = document.getElementById('app-view');
  if (!app) return;

  const defaults = {
    clients: [
      {id:1,name:'Sophie Tremblay',type:'Acheteuse',stage:'Acheteur actif',source:'Site web',owner:'Martin Leblanc',address:'1845, rue Beaubien E.'},
      {id:2,name:'Marc-André Roy',type:'Acheteur',stage:'Qualifié chaud',source:'Référence',owner:'Martin Leblanc',address:'88, avenue du Mont-Royal'},
      {id:3,name:'Claudine Bouchard',type:'Vendeuse',stage:'Vendeur actif',source:'Client existant',owner:'Geneviève Côté',address:'420, chemin du Bord-du-Lac'}
    ],
    properties: [
      {id:1,address:'1845, rue Beaubien E.',price:'729 000 $',status:'À vendre',area:'Rosemont–La Petite-Patrie',clientId:3,type:'Résidentiel',visits:12},
      {id:2,address:'88, avenue du Mont-Royal',price:'589 000 $',status:'Sous offre',area:'Le Plateau',clientId:2,type:'Résidentiel',visits:8},
      {id:3,address:'420, chemin du Bord-du-Lac',price:'1 249 000 $',status:'À vendre',area:'Beaconsfield',clientId:3,type:'Résidentiel',visits:5}
    ],
    visits: [
      {id:1,clientId:1,propertyId:1,date:'2026-09-04',time:'11:30',status:'À confirmer'},
      {id:2,clientId:2,propertyId:2,date:'2026-09-05',time:'14:00',status:'Confirmée'}
    ],
    transactions: [
      {id:1,clientId:2,propertyId:2,status:'Sous offre',price:'589 000 $',commission:'14 725 $',date:'2026-08-28'},
      {id:2,clientId:3,propertyId:3,status:'Vendu',price:'1 180 000 $',commission:'29 500 $',date:'2026-07-12'}
    ],
    tasks: [
      {id:1,title:'Relancer Marc-André Roy',date:'2026-09-01',priority:'Urgent',status:'À faire',clientId:2},
      {id:2,title:'Préparer le suivi vendeur',date:'2026-09-02',priority:'Haute',status:'À faire',clientId:3}
    ]
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const read = key => { try { const raw = localStorage.getItem(`gc-${key}`); return raw === null ? clone(defaults[key] || []) : (JSON.parse(raw) || []); } catch { return clone(defaults[key] || []); } };
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money = value => Number(String(value || '').replace(/[^0-9]/g, '')) || 0;
  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  const title = () => app.querySelector('.page-title')?.textContent.trim() || '';
  const is = name => title().toLocaleLowerCase('fr-CA').includes(name);
  const stored = key => localStorage.getItem(`gc-${key}`) !== null;
  const state = { period: localStorage.getItem('gc-analytics-period') || '30', broker: '', type: '', stage: '', source: '', area: '', txStatus: '' };
  const periodLabel = {7:'7 jours',30:'30 jours',90:'Trimestre',365:'Année',ytd:'YTD',all:'Tout'};
  const stageList = ['Nouveau lead','Qualifié chaud','Acheteur actif','Vendeur actif','Ancien client'];
  const probabilities = {'Nouveau lead':.1,'Qualifié chaud':.25,'Acheteur actif':.55,'Vendeur actif':.55,'Sous offre':.7,'Conditions':.8,'Offre soumise':.65};
  const clients = () => read('clients');
  const properties = () => read('properties');
  const visits = () => read('visits');
  const transactions = () => read('transactions');
  const tasks = () => read('tasks');
  const clientById = id => clients().find(item => String(item.id) === String(id));
  const propertyById = id => properties().find(item => String(item.id) === String(id));
  const daysAgo = value => { if (!value) return Infinity; const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? Infinity : Math.max(0, Math.round((today - date) / 86400000)); };
  const inPeriod = value => {
    if (state.period === 'all' || state.period === 'ytd') return state.period === 'all' || String(value || '').startsWith(String(today.getFullYear()));
    if (!value) return true;
    return daysAgo(value) <= Number(state.period);
  };
  const filteredClients = () => clients().filter(item => (!state.broker || item.owner === state.broker) && (!state.type || item.type === state.type) && (!state.stage || item.stage === state.stage) && (!state.source || item.source === state.source) && (!state.area || String(item.address || '').toLocaleLowerCase('fr-CA').includes(state.area.toLocaleLowerCase('fr-CA'))));
  const filteredProperties = () => { const ids = new Set(filteredClients().map(item => String(item.id))); return properties().filter(item => (!state.type || item.type === state.type) && (!state.area || String(item.area || '').toLocaleLowerCase('fr-CA').includes(state.area.toLocaleLowerCase('fr-CA'))) && (!state.stage || ids.has(String(item.clientId)))); };
  const filteredTransactions = () => { const ids = new Set(filteredProperties().map(item => String(item.id))); return transactions().filter(item => ids.has(String(item.propertyId)) && (!state.txStatus || item.status === state.txStatus) && inPeriod(item.date)); };
  const pct = (a, b) => b ? `${Math.round((a / b) * 1000) / 10}%` : '—';
  const formatMoney = value => `${Math.round(value).toLocaleString('fr-CA')} $`;
  const options = (values, selected, allLabel = 'Tous') => `<option value="">${allLabel}</option>${values.filter(Boolean).sort((a,b) => a.localeCompare(b,'fr')).map(value => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(value)}</option>`).join('')}`;

  function filteredData() {
    const cs = filteredClients();
    const ps = filteredProperties();
    const ts = filteredTransactions();
    const vs = visits().filter(item => ps.some(property => String(property.id) === String(item.propertyId)) && inPeriod(item.date));
    const tk = tasks().filter(item => cs.some(client => String(client.id) === String(item.clientId)) && inPeriod(item.date));
    return {cs, ps, ts, vs, tk};
  }

  function kpi(label, value, note, view, query = '') { return `<button type="button" class="gc-analytics-kpi" data-analytics-drill data-view="${view || ''}" data-query="${esc(query)}" title="${esc(note)}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></button>`; }
  function empty(label = 'Aucune donnée pour cette période') { return `<div class="gc-analytics-empty">${esc(label)}</div>`; }
  function chartCard(titleText, note, body, extra = '') { return `<section class="gc-analytics-card"><div class="gc-analytics-card-head"><div><h3>${esc(titleText)}</h3><p>${esc(note)}</p></div>${extra}</div>${body}</section>`; }

  function filtersHtml(data) {
    const brokers = [...new Set(clients().map(item => item.owner))];
    const types = [...new Set([...clients(), ...properties()].map(item => item.type))];
    const sources = [...new Set(clients().map(item => item.source))];
    const areas = [...new Set(properties().map(item => item.area))];
    const txStatuses = [...new Set(transactions().map(item => item.status))];
    return `<div class="gc-analytics-filters" aria-label="Filtres analytiques"><label>Période<select data-analytics-filter="period">${Object.entries(periodLabel).map(([value,label]) => `<option value="${value}" ${state.period === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label>Courtier<select data-analytics-filter="broker">${options(brokers,state.broker)}</select></label><label>Type de client<select data-analytics-filter="type">${options(types,state.type)}</select></label><label>Étape<select data-analytics-filter="stage">${options(stageList,state.stage)}</select></label><label>Source<select data-analytics-filter="source">${options(sources,state.source)}</select></label><label>Secteur<select data-analytics-filter="area">${options(areas,state.area)}</select></label><label>Statut transaction<select data-analytics-filter="txStatus">${options(txStatuses,state.txStatus)}</select></label><button type="button" class="btn" data-analytics="reset">Réinitialiser</button></div>`;
  }

  function contactDonut(data) {
    const counts = stageList.map(stage => data.cs.filter(item => item.stage === stage).length);
    const total = Math.max(1, counts.reduce((a,b) => a + b, 0));
    let cursor = 0;
    const colors = ['#7c9f98','#d1a15d','#5a7fa7','#1e4d5c','#9aa6a4'];
    const stops = counts.map((count,index) => { const start = cursor; cursor += (count / total) * 360; return `${colors[index]} ${start}deg ${cursor}deg`; }).join(',');
    return chartCard('Contacts suivis','Répartition par étape · clic pour ouvrir la liste',`<div class="gc-donut-layout"><button type="button" class="gc-donut" style="background:conic-gradient(${stops})" data-analytics-drill data-view="clients" aria-label="Voir les contacts filtrés"><span><strong>${data.cs.length}</strong><small>contacts</small></span></button><div class="gc-legend">${stageList.map((stage,index) => `<button type="button" data-analytics-drill data-view="clients" data-query="${esc(stage)}"><i style="background:${colors[index]}"></i><span>${esc(stage)}</span><b>${counts[index]}</b></button>`).join('')}</div></div>`);
  }

  function pipelineChart(data) {
    const rows = stageList.map(stage => ({stage,count:data.cs.filter(item => item.stage === stage).length,value:data.ts.filter(tx => clientById(tx.clientId)?.stage === stage).reduce((sum,tx) => sum + money(tx.price), 0)}));
    const max = Math.max(1, ...rows.map(row => row.count));
    return chartCard('Pipeline par étape','Contacts, valeur et taux de passage · drill-down activé',`<div class="gc-horizontal-chart">${rows.map((row,index) => `<button type="button" class="gc-chart-row" data-analytics-drill data-view="clients" data-query="${esc(row.stage)}"><span>${esc(row.stage)}</span><i><em style="width:${Math.max(5, (row.count / max) * 100)}%"></em></i><b>${row.count}</b><small>${formatMoney(row.value)}</small></button>`).join('')}</div>`);
  }

  function monthlyBars(data) {
    const months = Array.from({length:6}, (_,index) => { const d = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1); return {key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,label:d.toLocaleDateString('fr-CA',{month:'short'}),volume:0,commission:0}; });
    data.ts.filter(item => item.status === 'Vendu').forEach(item => { const month = months.find(entry => entry.key === String(item.date || '').slice(0,7)); if (month) { month.volume += money(item.price); month.commission += money(item.commissionGross || item.commission); } });
    const max = Math.max(1, ...months.map(item => item.volume));
    return chartCard('Ventes et commissions','Six derniers mois · montants calculés des transactions vendues',`<div class="gc-bars">${months.map(item => `<button type="button" class="gc-bar-group" data-analytics-drill data-view="transactions" title="${esc(formatMoney(item.volume))} vendus · ${esc(formatMoney(item.commission))} commission"><span class="gc-bar-pair"><i style="height:${Math.max(4,(item.volume/max)*100)}%"></i><em style="height:${Math.max(4,(item.commission/Math.max(1,max*.12))*100)}%"></em></span><b>${esc(item.label)}</b></button>`).join('')}</div><div class="gc-chart-legend"><span><i class="blue"></i>Volume vendu</span><span><i class="gold"></i>Commission brute</span></div>`);
  }

  function sourcesChart(data) {
    const sourceRows = [...new Set(data.cs.map(item => item.source).filter(Boolean))].map(source => { const list = data.cs.filter(item => item.source === source); const hot = list.filter(item => /chaud|actif/i.test(item.stage)).length; return {source,total:list.length,hot,converted:list.filter(item => item.stage === 'Ancien client').length}; });
    const max = Math.max(1, ...sourceRows.map(item => item.total));
    return chartCard('Sources de leads','Qualifiés, actifs et convertis par source',sourceRows.length ? `<div class="gc-source-chart">${sourceRows.map(row => `<button type="button" class="gc-source-row" data-analytics-drill data-view="clients" data-query="${esc(row.source)}"><span>${esc(row.source)}</span><i><em style="width:${(row.total/max)*100}%"></em><b style="width:${(row.hot/max)*100}%"></b><small style="width:${(row.converted/max)*100}%"></small></i><strong>${row.total}</strong><small>${pct(row.hot,row.total)} actif</small></button>`).join('')}</div>` : empty());
  }

  function risks(data) {
    const atRisk = data.cs.filter(item => !item.lastInteraction || daysAgo(item.lastInteraction) > 14).slice(0,4);
    const overdue = data.tk.filter(item => item.status !== 'Terminée' && item.date && item.date < isoToday).slice(0,4);
    const due = data.ts.filter(item => item.status !== 'Vendu').sort((a,b) => String(a.dueDate||'').localeCompare(String(b.dueDate||''))).slice(0,4);
    return `<div class="gc-risk-grid">${chartCard('Contacts à risque','Aucune interaction récente ou prochaine action manquante',atRisk.length ? `<div class="gc-risk-list">${atRisk.map(item => `<button type="button" data-analytics-drill data-view="clients" data-query="${esc(item.name)}"><strong>${esc(item.name)}</strong><span>${esc(item.stage || 'À suivre')} · à relancer</span><b>→</b></button>`).join('')}</div>` : empty())}${chartCard('Tâches en retard','Priorités opérationnelles',overdue.length ? `<div class="gc-risk-list">${overdue.map(item => `<button type="button" data-analytics-drill data-view="tasks" data-query="${esc(item.title)}"><strong>${esc(item.title)}</strong><span>${esc(item.date)} · ${esc(item.priority || 'Normale')}</span><b>→</b></button>`).join('')}</div>` : empty())}${chartCard('Commissions attendues','Transactions ouvertes et dates estimées',due.length ? `<div class="gc-risk-list">${due.map(item => `<button type="button" data-analytics-drill data-view="transactions"><strong>${esc(clientById(item.clientId)?.name || 'Transaction')}</strong><span>${esc(item.status)} · ${esc(item.dueDate || 'date à confirmer')}</span><b>${esc(item.commission || '—')}</b></button>`).join('')}</div>` : empty())}</div>`;
  }

  function dashboardHtml() {
    const data = filteredData();
    const sold = data.ts.filter(item => item.status === 'Vendu');
    const open = data.ts.filter(item => item.status !== 'Vendu');
    const gross = sold.reduce((sum,item) => sum + money(item.commissionGross || item.commission), 0);
    const net = sold.reduce((sum,item) => sum + (money(item.net) || Math.max(0, money(item.commissionGross || item.commission) - money(item.expenses))), 0);
    const receivable = open.reduce((sum,item) => sum + money(item.commissionGross || item.commission), 0);
    const pipeline = open.reduce((sum,item) => sum + money(item.price), 0);
    const weighted = open.reduce((sum,item) => sum + money(item.price) * (probabilities[item.status] || .25), 0);
    const openTasks = data.tk.filter(item => item.status !== 'Terminée');
    const overdue = openTasks.filter(item => item.date && item.date < isoToday).length;
    const completedVisits = data.vs.filter(item => item.status === 'Complétée').length;
    return `<div class="gc-analytics-suite"><div class="gc-analytics-topline"><div><span class="eyebrow">COMMAND CENTER · ANALYTIQUE</span><h2>Vos données, en un coup d’œil</h2><p>${stored('clients') ? 'Données CRM locales calculées en temps réel.' : 'Mode démonstration local · remplacez les fiches par vos données CRM.'}</p></div><button type="button" class="btn" data-analytics="reset">Réinitialiser les filtres</button></div>${filtersHtml(data)}<div class="gc-analytics-kpis">${kpi('Contacts',data.cs.length,'Total filtré','clients')}${kpi('Nouveaux leads',data.cs.filter(item => inPeriod(item.createdAt)).length,'Dans la période','clients')}${kpi('Leads chauds',data.cs.filter(item => /chaud/i.test(item.stage)).length,'À traiter en priorité','clients','Qualifié chaud')}${kpi('Propriétés actives',data.ps.filter(item => !['Vendu','Retirée'].includes(item.status)).length,'Inscrites actives','properties')}${kpi('Pipeline total',formatMoney(pipeline),'Valeur ouverte','transactions')}${kpi('Pipeline pondéré',formatMoney(weighted),'Probabilités configurables','transactions')}${kpi('Volume vendu',formatMoney(sold.reduce((sum,item) => sum + money(item.price), 0)),'Transactions vendues','sales')}${kpi('Commission à recevoir',formatMoney(receivable),'Dossiers ouverts','sales')}</div><div class="gc-analytics-grid">${contactDonut(data)}${pipelineChart(data)}${monthlyBars(data)}${sourcesChart(data)}</div><div class="gc-analytics-summary"><div><span>Taux de conversion</span><strong>${pct(sold.length,data.cs.length)}</strong><small>ventes / contacts filtrés</small></div><div><span>Commission brute</span><strong>${formatMoney(gross)}</strong><small>${sold.length} transaction(s) vendue(s)</small></div><div><span>Commission nette</span><strong>${formatMoney(net)}</strong><small>après dépenses connues</small></div><div><span>Opérations</span><strong>${openTasks.length}</strong><small>${overdue} en retard · ${completedVisits} visite(s) complétée(s)</small></div></div>${risks(data)}<p class="gc-analytics-footnote">Les indicateurs sont calculés à partir des fiches enregistrées dans ce navigateur. Les projections sont des estimations et ne constituent pas une certitude.</p></div>`;
  }

  function mountDashboard() {
    if (!is('aujourd')) return;
    const header = app.querySelector('.page-header');
    if (!header) return;
    if (!app.querySelector('.gc-analytics-suite')) header.insertAdjacentHTML('afterend', dashboardHtml());
  }

  function mountSalesInsights() {
    if (!is('ventes') || app.querySelector('.gc-sales-insights')) return;
    const card = document.createElement('section'); card.className = 'gc-sales-insights gc-analytics-card';
    const data = filteredData(); const sold = data.ts.filter(item => item.status === 'Vendu'); const avg = sold.length ? sold.reduce((sum,item) => sum + money(item.price), 0) / sold.length : 0;
    card.innerHTML = `<div class="gc-analytics-card-head"><div><h3>Analyse des ventes</h3><p>Prix moyen, médiane et répartition calculés à partir des transactions.</p></div><button type="button" class="btn" data-analytics-drill data-view="transactions">Voir les transactions</button></div><div class="gc-analytics-summary"><div><span>Prix moyen vendu</span><strong>${formatMoney(avg)}</strong><small>${sold.length} vente(s)</small></div><div><span>Prix médian</span><strong>${formatMoney(sold.length ? [...sold].sort((a,b) => money(a.price)-money(b.price))[Math.floor((sold.length-1)/2)] && money([...sold].sort((a,b) => money(a.price)-money(b.price))[Math.floor((sold.length-1)/2)].price) : 0)}</strong><small>distribution actuelle</small></div><div><span>Ratio vendu / demandé</span><strong>—</strong><small>prix demandé à renseigner</small></div></div>`;
    app.querySelector('.page-tools, .filter-bar')?.after(card);
  }

  function mount() { mountDashboard(); mountSalesInsights(); }
  document.addEventListener('change', event => { const key = event.target.closest('[data-analytics-filter]')?.dataset.analyticsFilter; if (!key) return; state[key] = event.target.value; if (key === 'period') localStorage.setItem('gc-analytics-period', state[key]); app.querySelector('.gc-analytics-suite, .gc-sales-insights')?.remove(); mount(); });
  document.addEventListener('click', event => {
    const reset = event.target.closest('[data-analytics="reset"]');
    if (reset) { Object.assign(state,{period:'30',broker:'',type:'',stage:'',source:'',area:'',txStatus:''}); localStorage.setItem('gc-analytics-period','30'); app.querySelector('.gc-analytics-suite, .gc-sales-insights')?.remove(); mount(); return; }
    const drill = event.target.closest('[data-analytics-drill]');
    if (!drill) return;
    const view = drill.dataset.view;
    if (!view) return;
    document.querySelector(`.nav-item[data-view="${view}"]`)?.click();
    const query = drill.dataset.query;
    if (query) setTimeout(() => { const input = document.querySelector('#client-filter, #property-filter'); if (input) { input.value = query; input.dispatchEvent(new Event('input', {bubbles:true})); } }, 150);
  });
  const observer = new MutationObserver(() => requestAnimationFrame(mount));
  observer.observe(app, {childList:true, subtree:true});
  setInterval(mount, 900);
  mount();
})();

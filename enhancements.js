(() => {
  'use strict';

  const app = document.getElementById('app-view');
  if (!app) return;

  const clone = value => JSON.parse(JSON.stringify(value));
  const defaults = {
    clients: [
      {id:1,name:'Sophie Tremblay',type:'Acheteuse',stage:'Acheteur actif',email:'sophie@example.com',phone:'514 555-0182',address:'1845, rue Beaubien E., Montréal, QC',budget:'750 000 $'},
      {id:2,name:'Marc-André Roy',type:'Acheteur',stage:'Qualifié chaud',email:'marc@example.com',phone:'514 555-0134',address:'650, avenue du Mont-Royal E., Montréal, QC',budget:'600 000 $'},
      {id:3,name:'Claudine Bouchard',type:'Vendeuse',stage:'Vendeur actif',email:'claudine@example.com',phone:'514 555-0198',address:'420, chemin du Bord-du-Lac, Beaconsfield, QC',budget:'1 250 000 $'}
    ],
    properties: [
      {id:1,address:'1845, rue Beaubien E.',price:'729 000 $',status:'À vendre',area:'Rosemont–La Petite-Patrie',clientId:3},
      {id:2,address:'88, avenue du Mont-Royal',price:'589 000 $',status:'Sous offre',area:'Le Plateau',clientId:2},
      {id:3,address:'420, chemin du Bord-du-Lac',price:'1 249 000 $',status:'À vendre',area:'Beaconsfield',clientId:3}
    ],
    visits: [
      {id:1,clientId:1,propertyId:1,date:'2026-09-04',time:'11:30',endTime:'12:30',status:'À confirmer'},
      {id:2,clientId:2,propertyId:2,date:'2026-09-05',time:'14:00',endTime:'15:00',status:'Confirmée'}
    ],
    tasks: [
      {id:1,title:'Relancer Marc-André Roy',description:'Lead chaud sans réponse depuis 18 h.',date:'2026-09-01',time:'09:00',priority:'Urgent',status:'À faire',clientId:2},
      {id:2,title:'Préparer le suivi vendeur',description:'3 visites sans offre au Plateau.',date:'2026-09-02',time:'10:00',priority:'Haute',status:'À faire',clientId:3}
    ],
    transactions: [
      {id:1,clientId:2,propertyId:2,status:'Sous offre',price:'589 000 $',commission:'14 725 $',date:'2026-08-28'},
      {id:2,clientId:3,propertyId:3,status:'Vendu',price:'1 180 000 $',commission:'29 500 $',date:'2026-07-12'}
    ],
    documents: [
      {id:1,clientId:3,name:'Mandat de vente.pdf',category:'Contrats',size:'1,2 Mo'},
      {id:2,clientId:3,name:'Certificat localisation.pdf',category:'Juridique',size:'840 Ko'},
      {id:3,clientId:1,name:'Pré-approbation.pdf',category:'Financement',size:'420 Ko'}
    ]
  };
  const read = key => {
    try {
      const stored = localStorage.getItem(`gc-${key}`);
      return stored === null ? clone(defaults[key] || []) : (JSON.parse(stored) || []);
    } catch { return clone(defaults[key] || []); }
  };
  const write = (key, value) => localStorage.setItem(`gc-${key}`, JSON.stringify(value));
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));
  const money = value => Number(String(value || '').replace(/[^0-9]/g, '')) || 0;
  const dateText = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('fr-CA') : '—';
  const title = () => app.querySelector('.page-title')?.textContent.trim() || '';
  const is = name => title().toLocaleLowerCase('fr-CA').includes(name);

  function feedback(message, type = 'success') {
    document.querySelector('.gc-feedback')?.remove();
    const node = document.createElement('div');
    node.className = `gc-feedback ${type}`;
    node.textContent = message;
    app.prepend(node);
    setTimeout(() => node.remove(), 4000);
  }

  function clickNav(view) {
    document.querySelector(`.nav-item[data-view="${view}"]`)?.click();
  }

  function enhanceBrand() {
    document.querySelectorAll('.eyebrow, .page-header, .sidebar, .mobile-brand').forEach(node => {
      if (node.childNodes.length) {
        node.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) child.textContent = child.textContent.replace(/MaisonNord/g, 'Geneviève Côté');
        });
      }
    });
  }

  function globalSearch() {
    const input = document.getElementById('global-search');
    if (!input || input.dataset.gcBound) return;
    input.dataset.gcBound = '1';
    const wrap = input.closest('.top-search');
    wrap?.classList.add('gc-search-wrap');
    const box = document.createElement('div');
    box.className = 'gc-search-results';
    wrap?.append(box);

    const build = () => {
      const query = input.value.trim().toLocaleLowerCase('fr-CA');
      if (!query) { box.innerHTML = ''; box.hidden = true; return; }
      const clients = read('clients').filter(item => JSON.stringify(item).toLocaleLowerCase('fr-CA').includes(query)).slice(0, 5);
      const properties = read('properties').filter(item => JSON.stringify(item).toLocaleLowerCase('fr-CA').includes(query)).slice(0, 5);
      const tasks = read('tasks').filter(item => JSON.stringify(item).toLocaleLowerCase('fr-CA').includes(query)).slice(0, 4);
      const rows = [
        ...clients.map(item => ({kind:'client', view:'clients', id:item.id, label:item.name, detail:`${item.type || 'Client'} · ${item.stage || 'Nouveau lead'}`})),
        ...properties.map(item => ({kind:'property', view:'properties', id:item.id, label:item.address, detail:`${item.price || 'Prix à définir'} · ${item.status || 'À vendre'}`})),
        ...tasks.map(item => ({kind:'task', view:'tasks', id:item.id, label:item.title, detail:`${dateText(item.date)} · ${item.priority || 'Normale'}`}))
      ];
      box.hidden = false;
      box.innerHTML = rows.length ? rows.map(row => `<button type="button" data-search-view="${row.view}" data-search-kind="${row.kind}" data-search-id="${row.id}"><strong>${esc(row.label)}</strong><small>${esc(row.detail)}</small></button>`).join('') : '<div class="gc-search-empty">Aucun résultat dans vos données locales.</div>';
    };
    input.addEventListener('input', build);
    input.addEventListener('focus', build);
    document.addEventListener('click', event => {
      const result = event.target.closest('[data-search-view]');
      if (result) {
        box.hidden = true;
        input.value = '';
        sessionStorage.setItem('gc-pending-search', JSON.stringify({kind:result.dataset.searchKind, id:result.dataset.searchId}));
        clickNav(result.dataset.searchView);
      } else if (!event.target.closest('.gc-search-wrap')) box.hidden = true;
    });
  }

  function completePendingSearch() {
    const raw = sessionStorage.getItem('gc-pending-search');
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      const action = pending.kind === 'client' ? 'client-detail' : pending.kind === 'property' ? 'property-detail' : 'edit-task';
      const button = app.querySelector(`[data-action="${action}"][data-id="${pending.id}"]`);
      if (button) { sessionStorage.removeItem('gc-pending-search'); button.click(); }
    } catch { sessionStorage.removeItem('gc-pending-search'); }
  }

  function dashboardControls() {
    if (!is('aujourd')) return;
    const header = app.querySelector('.page-header');
    if (!header || header.querySelector('.gc-period-control')) return;
    const control = document.createElement('div');
    control.className = 'gc-period-control';
    control.innerHTML = '<label for="gc-period">Période</label><select id="gc-period"><option value="jour">Aujourd’hui</option><option value="semaine">Cette semaine</option><option value="mois">Ce mois</option><option value="trimestre">Ce trimestre</option></select>';
    header.append(control);
    const saved = localStorage.getItem('gc-period') || 'jour';
    control.querySelector('select').value = saved;
    control.querySelector('select').addEventListener('change', event => {
      localStorage.setItem('gc-period', event.target.value);
      const labels = {jour:'Vue du jour',semaine:'Vue de la semaine',mois:'Vue du mois',trimestre:'Vue du trimestre'};
      document.querySelector('.page-title')?.insertAdjacentHTML('afterend', `<span class="gc-period-note">${labels[event.target.value]}</span>`);
      document.querySelectorAll('.gc-period-note').forEach((node, index) => { if (index) node.remove(); });
    });
  }

  function clientsTools() {
    if (!is('clients') || app.querySelector('.gc-client-tools')) return;
    const list = app.querySelector('#client-list');
    if (!list) return;
    const tools = document.createElement('div');
    tools.className = 'gc-collection-tools gc-client-tools';
    tools.innerHTML = '<label>Étape <select data-client-filter="stage"><option value="">Toutes</option><option>Nouveau lead</option><option>Qualifié chaud</option><option>Acheteur actif</option><option>Vendeur actif</option><option>Ancien client</option></select></label><label>Type <select data-client-filter="type"><option value="">Tous</option><option>Acheteur</option><option>Acheteuse</option><option>Vendeuse</option><option>Acheteur/Vendeur</option></select></label><label>Trier <select data-client-filter="sort"><option value="name">Nom</option><option value="stage">Étape</option><option value="recent">Plus récent</option></select></label>';
    list.parentElement.insertBefore(tools, list);
    const apply = () => {
      const clients = read('clients');
      const stage = tools.querySelector('[data-client-filter="stage"]').value;
      const type = tools.querySelector('[data-client-filter="type"]').value;
      const sort = tools.querySelector('[data-client-filter="sort"]').value;
      const byId = Object.fromEntries(clients.map(item => [String(item.id), item]));
      const cards = [...list.querySelectorAll('.client-card')];
      cards.sort((a,b) => {
        const aa = byId[a.dataset.id] || {}, bb = byId[b.dataset.id] || {};
        if (sort === 'stage') return String(aa.stage||'').localeCompare(String(bb.stage||''), 'fr');
        if (sort === 'recent') return Number(bb.id||0) - Number(aa.id||0);
        return String(aa.name||'').localeCompare(String(bb.name||''), 'fr');
      }).forEach(card => list.append(card));
      cards.forEach(card => {
        const item = byId[card.dataset.id] || {};
        card.hidden = Boolean((stage && item.stage !== stage) || (type && item.type !== type));
      });
    };
    tools.addEventListener('change', apply);
    apply();
  }

  function propertiesTools() {
    if (!is('propriétés') || app.querySelector('.gc-property-tools')) return;
    const input = app.querySelector('#property-filter');
    const list = app.querySelector('#property-list');
    if (!input || !list) return;
    const tools = document.createElement('div');
    tools.className = 'gc-collection-tools gc-property-tools';
    tools.innerHTML = '<label>Statut <select id="gc-property-status"><option value="">Tous</option><option>À vendre</option><option>Sous offre</option><option>Vendu</option><option>Retirée</option></select></label><label>Prix maximum <input id="gc-property-max" type="number" min="0" step="10000" placeholder="Aucun"></label><button type="button" class="btn" data-property-reset>Réinitialiser</button>';
    input.closest('.filter-bar')?.after(tools);
    const apply = () => {
      const query = input.value.toLocaleLowerCase('fr-CA');
      const status = tools.querySelector('#gc-property-status').value;
      const max = Number(tools.querySelector('#gc-property-max').value) || Infinity;
      read('properties');
      list.querySelectorAll('.property-card').forEach(card => {
        const text = card.textContent.toLocaleLowerCase('fr-CA');
        const itemStatus = [...card.querySelectorAll('.status')].map(node => node.textContent.trim())[0] || '';
        const price = money(card.querySelector('.property-meta b')?.textContent);
        card.hidden = Boolean((query && !text.includes(query)) || (status && itemStatus !== status) || price > max);
      });
    };
    input.addEventListener('input', apply);
    tools.addEventListener('input', apply);
    tools.addEventListener('change', apply);
    tools.querySelector('[data-property-reset]').addEventListener('click', () => { input.value=''; tools.querySelector('#gc-property-status').value=''; tools.querySelector('#gc-property-max').value=''; apply(); });
    apply();
  }

  function mapWorkbench() {
    if (!is('carte') || app.querySelector('.gc-map-list')) return;
    const note = app.querySelector('.map-note');
    if (!note) return;
    const properties = read('properties');
    const panel = document.createElement('div');
    panel.className = 'card gc-map-list';
    panel.innerHTML = `<div class="card-head"><div><div class="card-title">Propriétés sur la carte</div><div class="card-note">Sélectionnez une fiche pour la retrouver sur la carte.</div></div><span class="tag">${properties.length} fiches</span></div><div class="gc-map-items">${properties.map(item => `<button type="button" data-map-property="${item.id}"><span class="gc-map-pin">⌖</span><span><strong>${esc(item.address)}</strong><small>${esc(item.area || 'Grand Montréal')} · ${esc(item.price || 'Prix à définir')}</small></span><b>${esc(item.status || 'À vendre')}</b></button>`).join('') || '<div class="empty-note">Ajoutez une propriété pour l’afficher ici.</div>'}</div>`;
    note.after(panel);
    panel.addEventListener('click', event => {
      const item = event.target.closest('[data-map-property]');
      if (!item) return;
      const marker = document.querySelector(`.map-fallback-marker[data-id="${item.dataset.mapProperty}"]`);
      marker?.click();
      marker?.scrollIntoView({block:'center', behavior:'smooth'});
    });
  }

  function visitConflicts() {
    if (!is('visites') || app.querySelector('.gc-conflicts')) return;
    const visits = read('visits');
    const conflicts = [];
    visits.forEach((left, index) => visits.slice(index + 1).forEach(right => {
      if (left.date !== right.date) return;
      const leftStart = (left.time || '00:00').replace(':','');
      const rightStart = (right.time || '00:00').replace(':','');
      const leftEnd = (left.endTime || left.time || '00:00').replace(':','');
      const rightEnd = (right.endTime || right.time || '00:00').replace(':','');
      if ((leftStart < rightEnd && rightStart < leftEnd) || (leftStart === rightStart)) conflicts.push([left,right]);
    }));
    if (!conflicts.length) return;
    const node = document.createElement('div');
    node.className = 'gc-conflicts';
    node.innerHTML = `<strong>Conflit d’horaire détecté</strong><span>${conflicts.length} chevauchement(s) à vérifier avant confirmation.</span>`;
    app.querySelector('.card')?.before(node);
  }

  function calendarModes() {
    if (!is('agenda') || app.querySelector('.gc-agenda-mode')) return;
    const active = app.querySelector('.view-tabs .btn-primary')?.textContent.trim() || 'Mois';
    if (active === 'Mois') return;
    const visits = read('visits');
    const tasks = read('tasks').filter(item => item.status !== 'Terminée');
    const today = new Date();
    const todayIso = today.toISOString().slice(0,10);
    let rows = [];
    if (active === 'Jour') rows = visits.filter(item => item.date === todayIso).map(item => ({date:item.date,time:item.time,label:`Visite — ${item.clientId}`,action:'edit-visit',id:item.id}));
    else if (active === 'Semaine') {
      const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      const dates = Array.from({length:7}, (_,index) => { const day = new Date(monday); day.setDate(monday.getDate()+index); return day.toISOString().slice(0,10); });
      rows = visits.filter(item => dates.includes(item.date)).map(item => ({date:item.date,time:item.time,label:`Visite — ${item.clientId}`,action:'edit-visit',id:item.id})).concat(tasks.filter(item => dates.includes(item.date)).map(item => ({date:item.date,time:item.time,label:item.title,action:'edit-task',id:item.id})));
    } else rows = visits.map(item => ({date:item.date,time:item.time,label:`Visite — ${item.clientId}`,action:'edit-visit',id:item.id})).concat(tasks.map(item => ({date:item.date,time:item.time,label:item.title,action:'edit-task',id:item.id})));
    const grid = app.querySelector('.calendar-grid');
    if (!grid) return;
    const node = document.createElement('div');
    node.className = 'gc-agenda-mode card';
    node.innerHTML = rows.length ? rows.sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).map(row => `<button type="button" data-action="${row.action}" data-id="${row.id}"><span>${dateText(row.date)} · ${esc(row.time || 'Toute la journée')}</span><strong>${esc(row.label)}</strong></button>`).join('') : '<div class="empty-note">Aucun élément pour cette vue.</div>';
    grid.replaceWith(node);
  }

  function taskTools() {
    if (!is('tâches') || app.querySelector('.gc-task-tools')) return;
    const card = app.querySelector('.card');
    const tools = document.createElement('div');
    tools.className = 'gc-task-tools';
    tools.innerHTML = '<button type="button" class="btn btn-primary" data-task-filter="all">Toutes</button><button type="button" class="btn" data-task-filter="open">À faire</button><button type="button" class="btn" data-task-filter="done">Terminées</button>';
    card?.querySelector('.card-head')?.after(tools);
    app.querySelectorAll('.task-row').forEach(row => {
      const checkbox = row.querySelector('input[data-id]');
      if (checkbox && !row.querySelector('[data-action="snooze-task"]')) row.insertAdjacentHTML('beforeend', `<button type="button" class="action-link" data-action="snooze-task" data-id="${checkbox.dataset.id}">Reporter +1 j</button>`);
    });
    tools.addEventListener('click', event => {
      const button = event.target.closest('[data-task-filter]');
      if (!button) return;
      tools.querySelectorAll('button').forEach(node => node.classList.toggle('btn-primary', node === button));
      app.querySelectorAll('.task-row').forEach(row => {
        const done = row.querySelector('input')?.checked;
        row.hidden = button.dataset.taskFilter === 'open' ? done : button.dataset.taskFilter === 'done' ? !done : false;
      });
    });
  }

  function transactionFields() {
    document.querySelectorAll('form[data-kind="transaction"] select[name="status"] option').forEach(option => {
      if (option.textContent.trim() === 'Ferme') option.textContent = 'Fermé';
    });
    const form = document.querySelector('form[data-kind="transaction"]');
    if (!form || form.querySelector('[data-gc-transaction-extra]')) return;
    const actions = form.querySelector('.modal-actions');
    const extra = document.createElement('div');
    extra.dataset.gcTransactionExtra = '1';
    extra.className = 'gc-transaction-extra form-grid';
    extra.innerHTML = '<div class="form-field"><label>Partage courtier (%)</label><input name="split" type="number" min="0" max="100" step="0.5" placeholder="100"></div><div class="form-field"><label>Dépenses</label><input name="expenses" placeholder="0 $"></div><div class="form-field"><label>Co-courtage</label><input name="coBrokerage" placeholder="0 $"></div><div class="form-field"><label>Commission nette</label><input name="net" placeholder="Calculée à l’enregistrement"></div><div class="form-field"><label>Commission payée</label><select name="paid"><option value="Non">Non</option><option value="Oui">Oui</option></select></div>';
    actions?.before(extra);
  }

  function commissionSummary() {
    if (!(is('ventes') || is('transactions')) || app.querySelector('.gc-commission-summary')) return;
    const transactions = read('transactions');
    const gross = transactions.reduce((sum,item) => sum + money(item.commissionGross || item.commission), 0);
    const expenses = transactions.reduce((sum,item) => sum + money(item.expenses), 0);
    const net = transactions.reduce((sum,item) => sum + (money(item.net) || Math.max(0, money(item.commissionGross || item.commission) - money(item.expenses))), 0);
    const node = document.createElement('div');
    node.className = 'card gc-commission-summary';
    node.innerHTML = `<div class="card-head"><div><div class="card-title">Détail des commissions</div><div class="card-note">Calculé à partir des transactions enregistrées dans ce navigateur.</div></div></div><div class="gc-commission-grid"><div><small>Brut</small><strong>${gross.toLocaleString('fr-CA')} $</strong></div><div><small>Dépenses</small><strong>${expenses.toLocaleString('fr-CA')} $</strong></div><div><small>Net estimé</small><strong>${net.toLocaleString('fr-CA')} $</strong></div></div>`;
    app.querySelector('.page-tools, .filter-bar')?.after(node);
  }

  function documents() {
    if (!is('documents')) return;
    app.querySelectorAll('[data-action="preview-document"]').forEach((button, index) => {
      if (!button.dataset.docId) button.dataset.docId = String(read('documents')[index]?.id || '');
    });
  }

  function editableModules() {
    if (is('ventes')) {
      const sold = read('transactions').filter(item => item.status === 'Vendu');
      const header = app.querySelector('.data-table thead tr');
      if (header && !header.querySelector('[data-edit-column]')) header.insertAdjacentHTML('beforeend', '<th data-edit-column>Actions</th>');
      app.querySelectorAll('.data-table tbody tr').forEach((row, index) => {
        const item = sold[index];
        if (item && !row.querySelector('[data-action="edit-transaction"]')) row.insertAdjacentHTML('beforeend', `<td><button type="button" class="action-link" data-action="edit-transaction" data-id="${esc(item.id)}">Modifier</button></td>`);
      });
    }
    if (is('documents')) {
      app.querySelectorAll('[data-action="preview-document"]').forEach(button => {
        const id = button.dataset.docId;
        if (id && !button.parentElement?.querySelector('[data-action="edit-document"]')) button.insertAdjacentHTML('afterend', ` <button type="button" class="action-link" data-action="edit-document" data-id="${esc(id)}">Modifier</button>`);
      });
    }
  }

  function enhance() {
    enhanceBrand();
    globalSearch();
    dashboardControls();
    clientsTools();
    propertiesTools();
    mapWorkbench();
    visitConflicts();
    calendarModes();
    taskTools();
    transactionFields();
    commissionSummary();
    documents();
    editableModules();
    completePendingSearch();
  }

  document.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'snooze-task') {
      const tasks = read('tasks');
      const task = tasks.find(item => String(item.id) === String(event.target.closest('[data-action]')?.dataset.id));
      if (task) {
        const next = new Date(`${task.date || new Date().toISOString().slice(0,10)}T12:00:00`);
        next.setDate(next.getDate() + 1);
        task.date = next.toISOString().slice(0,10);
        write('tasks', tasks);
        window.render?.();
        setTimeout(() => feedback('Tâche reportée au lendemain.'), 0);
      }
    }
    if (action === 'filter-stage') {
      sessionStorage.setItem('gc-client-stage', event.target.closest('[data-stage]')?.dataset.stage || '');
      clickNav('clients');
    }
    if (action === 'export-sales') {
      const transactions = read('transactions');
      const clients = Object.fromEntries(read('clients').map(item => [item.id, item.name]));
      const properties = Object.fromEntries(read('properties').map(item => [item.id, item.address]));
      const csv = [['Client','Propriété','Prix','Commission','Date','Statut'], ...transactions.map(item => [clients[item.clientId]||'',properties[item.propertyId]||'',item.price||'',item.commission||'',item.date||'',item.status||''])].map(row => row.map(value => `"${String(value).replace(/"/g,'""')}"`).join(';')).join('\n');
      const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], {type:'text/csv;charset=utf-8'})); link.download = `rapport-ventes-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
      feedback('Le rapport CSV a été téléchargé.');
    }
    if (action === 'upload-document') openDocumentModal();
    if (action === 'preview-document') openDocumentPreview(event.target.closest('[data-doc-id]')?.dataset.docId);
    if (action === 'edit-document') openDocumentEditModal(event.target.closest('[data-action="edit-document"]')?.dataset.id);
  });

  document.addEventListener('submit', event => {
    const form = event.target;
    if (form.matches('form[data-kind="transaction"]')) {
      const raw = Object.fromEntries(new FormData(form).entries());
      setTimeout(() => {
        const transactions = read('transactions');
        const item = raw.id ? transactions.find(row => String(row.id) === String(raw.id)) : transactions[transactions.length - 1];
        if (!item) return;
        item.split = raw.split || '100'; item.expenses = raw.expenses || '0 $'; item.coBrokerage = raw.coBrokerage || '0 $'; item.paid = raw.paid || 'Non';
        if (!raw.net) item.net = `${Math.max(0, money(item.commission) * (Number(raw.split || 100) / 100) - money(raw.expenses)).toLocaleString('fr-CA')} $`;
        else item.net = raw.net;
        write('transactions', transactions);
        window.render?.();
      }, 0);
    }
    if (form.matches('.gc-document-form')) {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      const file = form.querySelector('input[type="file"]')?.files?.[0];
      const docs = read('documents');
      docs.push({id:Date.now(),name:file?.name || values.name || 'Document sans nom',category:values.category || 'Autre',clientId:Number(values.clientId)||null,size:file ? `${Math.max(1, Math.round(file.size/1024))} Ko` : 'Métadonnées locales'});
      write('documents', docs); form.closest('.gc-modal-backdrop')?.remove(); window.render?.(); setTimeout(() => feedback('Document ajouté au coffre local.'), 0);
    }
  });

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!form.matches('.gc-document-edit-form')) return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const docs = read('documents');
    const doc = docs.find(item => String(item.id) === String(values.id));
    if (!doc) return feedback('Document introuvable.', 'error');
    Object.assign(doc, {name: values.name, category: values.category, clientId: Number(values.clientId) || null, size: values.size || 'Métadonnées locales'});
    write('documents', docs);
    form.closest('.gc-modal-backdrop')?.remove();
    clickNav('documents');
    setTimeout(() => feedback('Document modifié avec succès.'), 0);
  });

  function openDocumentModal() {
    if (document.querySelector('.gc-modal-backdrop')) return;
    const clients = read('clients');
    const node = document.createElement('div'); node.className = 'gc-modal-backdrop';
    node.innerHTML = `<form class="gc-document-form gc-modal"><div class="modal-head"><h2>Ajouter un document</h2><button type="button" class="modal-close" data-gc-close>×</button></div><div class="form-grid"><div class="form-field full"><label>Fichier</label><input type="file" name="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"></div><div class="form-field"><label>Nom si aucun fichier</label><input name="name" placeholder="Mandat de vente.pdf"></div><div class="form-field"><label>Catégorie</label><select name="category"><option>Contrats</option><option>Financement</option><option>Juridique</option><option>Photos</option><option>Autre</option></select></div><div class="form-field full"><label>Client associé</label><select name="clientId"><option value="">Aucun</option>${clients.map(client => `<option value="${client.id}">${esc(client.name)}</option>`).join('')}</select></div></div><div class="gc-local-note">Le fichier est enregistré comme métadonnée dans ce prototype local. Le stockage sécurisé partagé sera branché avec le backend.</div><div class="modal-actions"><button type="button" class="btn" data-gc-close>Annuler</button><button class="btn btn-primary">Ajouter</button></div></form>`;
    document.body.append(node);
    node.addEventListener('click', event => { if (event.target === node || event.target.closest('[data-gc-close]')) node.remove(); });
  }

  function openDocumentPreview(id) {
    const doc = read('documents').find(item => String(item.id) === String(id));
    if (!doc) return feedback('Document introuvable.', 'error');
    const node = document.createElement('div'); node.className = 'gc-modal-backdrop';
    node.innerHTML = `<div class="gc-modal"><div class="modal-head"><h2>${esc(doc.name)}</h2><button type="button" class="modal-close" data-gc-close>×</button></div><div class="gc-document-preview"><span class="document-icon">▤</span><strong>${esc(doc.category)}</strong><span>${esc(doc.size || 'Taille inconnue')}</span><p>Cette fiche confirme le document associé. L’aperçu du fichier et le coffre chiffré nécessitent le stockage sécurisé du backend.</p></div><div class="modal-actions"><button type="button" class="btn btn-primary" data-gc-close>Fermer</button></div></div>`;
    document.body.append(node);
    node.addEventListener('click', event => { if (event.target === node || event.target.closest('[data-gc-close]')) node.remove(); });
  }

  function openDocumentEditModal(id) {
    const docs = read('documents');
    const doc = docs.find(item => String(item.id) === String(id));
    if (!doc || document.querySelector('.gc-modal-backdrop')) return;
    const clients = read('clients');
    const node = document.createElement('div'); node.className = 'gc-modal-backdrop';
    node.innerHTML = `<form class="gc-document-edit-form gc-modal"><div class="modal-head"><h2>Modifier le document</h2><button type="button" class="modal-close" data-gc-close>×</button></div><input type="hidden" name="id" value="${esc(doc.id)}"><div class="form-grid"><div class="form-field full"><label>Nom du document</label><input name="name" required value="${esc(doc.name)}"></div><div class="form-field"><label>Catégorie</label><select name="category">${['Contrats','Financement','Juridique','Photos','Autre'].map(value => `<option ${doc.category === value ? 'selected' : ''}>${value}</option>`).join('')}</select></div><div class="form-field"><label>Taille</label><input name="size" value="${esc(doc.size || '')}" placeholder="1,2 Mo"></div><div class="form-field full"><label>Client associé</label><select name="clientId"><option value="">Aucun</option>${clients.map(client => `<option value="${client.id}" ${String(doc.clientId) === String(client.id) ? 'selected' : ''}>${esc(client.name)}</option>`).join('')}</select></div></div><div class="modal-actions"><button type="button" class="btn" data-gc-close>Annuler</button><button class="btn btn-primary" type="submit">Enregistrer</button></div></form>`;
    document.body.append(node);
    node.addEventListener('click', event => { if (event.target === node || event.target.closest('[data-gc-close]')) node.remove(); });
  }

  const observer = new MutationObserver(() => requestAnimationFrame(enhance));
  observer.observe(app, {childList:true, subtree:true});
  setInterval(enhance, 700);
  enhance();
})();

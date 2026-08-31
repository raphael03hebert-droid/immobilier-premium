(() => {
  const escMail = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const emailAddress = message => message?.from?.emailAddress?.address || '';
  const emailName = message => message?.from?.emailAddress?.name || emailAddress(message) || 'Expéditeur inconnu';
  const setStatus = (root, text, error = false) => { const box = root?.querySelector('.email-draft-status'); if (box) { box.textContent = text; box.style.color = error ? 'var(--red)' : 'var(--teal)'; } };
  async function loadInbox(button) {
    const root = button.closest('.card') || document;
    const inbox = root.querySelector('.inbox');
    button.disabled = true; button.textContent = 'Chargement…';
    try {
      const messages = await window.M365.messages();
      inbox.innerHTML = `<div class="inbox-list">${messages.length ? messages.map((m, i) => `<button class="mail ${i === 0 ? 'active' : ''}" type="button" data-graph-message="${escMail(m.id)}" data-to="${escMail(emailAddress(m))}" data-subject="${escMail(m.subject || '')}"><b>${escMail(emailName(m))}</b><small>${escMail(m.subject || '(Sans objet)')}</small><small>${escMail(m.bodyPreview || '')}</small></button>`).join('') : '<div class="empty-note">Aucun courriel reçu.</div>'}</div><div class="mail-reading"><div class="empty-note">Sélectionnez un courriel pour préparer une réponse.</div></div>`;
      button.textContent = 'Actualiser Outlook';
    } catch (error) { inbox.innerHTML = `<div class="empty-note">Impossible de charger Outlook : ${escMail(error.message)}</div>`; button.disabled = false; button.textContent = 'Réessayer'; }
  }
  async function openMessage(button) {
    const root = button.closest('.card') || document;
    const reading = root.querySelector('.mail-reading');
    reading.innerHTML = '<div class="empty-note">Ouverture du courriel…</div>';
    try {
      const message = await window.M365.message(button.dataset.graphMessage);
      const body = message.body?.content || message.bodyPreview || '';
      reading.innerHTML = `<span class="tag">Courriel Outlook</span><h3>${escMail(message.subject || '(Sans objet)')}</h3><p><b>${escMail(emailName(message))}</b> · ${escMail(emailAddress(message))}</p><div class="mail-body">${escMail(body).replace(/\n/g, '<br>')}</div><div class="draft-box"><b>Réponse modifiable</b><textarea id="email-draft">Bonjour ${escMail(emailName(message))},\n\nMerci pour votre message.\n\nAu plaisir!</textarea><button class="btn btn-primary" type="button" data-action="create-email-draft" data-to="${escMail(emailAddress(message))}" data-subject="Re: ${escMail(message.subject || '')}">Enregistrer dans Brouillons Outlook</button><div class="email-draft-status"></div></div>`;
    } catch (error) { reading.innerHTML = `<div class="empty-note">Impossible d’ouvrir ce courriel : ${escMail(error.message)}</div>`; }
  }
  async function createDraft(button) {
    const root = button.closest('.card') || document;
    const body = root.querySelector('#email-draft')?.value || '';
    button.disabled = true; button.textContent = 'Enregistrement…';
    try { await window.M365.createDraft({to:button.dataset.to, subject:button.dataset.subject, body}); setStatus(root, 'Réponse enregistrée dans vos brouillons Outlook.'); button.textContent = 'Brouillon enregistré'; }
    catch (error) { setStatus(root, error.message || 'Impossible de créer le brouillon.', true); button.disabled = false; button.textContent = 'Enregistrer dans Brouillons Outlook'; }
  }
  function addSyncButton() { const inbox = document.querySelector('.inbox'); if (!inbox || inbox.previousElementSibling?.classList.contains('email-sync-head')) return; const head = document.createElement('div'); head.className = 'email-sync-head'; head.innerHTML = '<div><b>Microsoft Outlook</b><small>Boîte de réception et brouillons synchronisés.</small></div><button class="btn" type="button" data-action="load-email">Charger ma boîte</button>'; inbox.parentElement.insertBefore(head, inbox); }
  document.addEventListener('click', event => { const load = event.target.closest('[data-action="load-email"]'); if (load) { event.preventDefault(); loadInbox(load); return; } const message = event.target.closest('[data-graph-message]'); if (message) { event.preventDefault(); openMessage(message); return; } const draft = event.target.closest('[data-action="create-email-draft"]'); if (draft) { event.preventDefault(); createDraft(draft); } });
  new MutationObserver(addSyncButton).observe(document.body, { childList: true, subtree: true });
  addSyncButton();
})();

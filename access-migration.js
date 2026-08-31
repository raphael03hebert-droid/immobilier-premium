// Migration de l’ancienne validation par onglet vers la validation du site.
try { if (sessionStorage.getItem('crm-key-ok') === '1') localStorage.setItem('crm-key-ok', '1'); } catch {}

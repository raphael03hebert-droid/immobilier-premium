/* Gestionnaire de connexion séparé pour rester compatible avec les politiques CSP. */
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action="login-microsoft"]');
  if(!button)return;
  event.preventDefault();
  button.disabled=true;
  button.textContent='Ouverture de Microsoft…';
  try{await window.M365.login();}
  catch(error){button.disabled=false;button.textContent='Continuer avec Microsoft';const box=document.querySelector('.auth-error');if(box)box.textContent=error.message||'La connexion Microsoft n’a pas pu être ouverte.';}
});

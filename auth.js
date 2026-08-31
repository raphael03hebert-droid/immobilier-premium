/* Secours OAuth autonome si le CDN MSAL est bloqué par le navigateur. */
if(!window.M365){window.M365={clientId:'eeff2f4a-7f6b-44fb-a33e-8d9990ce16e1',account:null,isConnected(){return Boolean(localStorage.getItem('m365-access-token')||localStorage.getItem('m365-account'))},async login(){const redirect=encodeURIComponent(location.origin+location.pathname),scope=encodeURIComponent('openid profile email User.Read Mail.ReadWrite Mail.Send Calendars.ReadWrite');location.href=`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${this.clientId}&response_type=token&redirect_uri=${redirect}&response_mode=fragment&scope=${scope}&prompt=select_account`}}}
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action="login-microsoft"]');
  if(!button)return;
  event.preventDefault();
  button.disabled=true;
  button.textContent='Ouverture de Microsoft…';
  try{await window.M365.login();}
  catch(error){button.disabled=false;button.textContent='Continuer avec Microsoft';const box=document.querySelector('.auth-error');if(box)box.textContent=error.message||'La connexion Microsoft n’a pas pu être ouverte.';}
});

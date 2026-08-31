/* Microsoft Entra ID + Microsoft Graph. Aucun secret client dans le navigateur. */
window.M365={
  clientId:window.M365_CONFIG?.clientId||'eeff2f4a-7f6b-44fb-a33e-8d9990ce16e1',
  authority:window.M365_CONFIG?.authority||'https://login.microsoftonline.com/common',
  scopes:['User.Read','Mail.ReadWrite','Mail.Send','Calendars.ReadWrite'],instance:null,account:null,
  async init(){if(!window.msal)throw new Error('La bibliothèque Microsoft Entra n’est pas chargée.');if(this.instance)return this.instance;this.instance=new msal.PublicClientApplication({auth:{clientId:this.clientId,authority:this.authority,redirectUri:window.location.origin+window.location.pathname,navigateToLoginRequestUrl:false},cache:{cacheLocation:'localStorage',storeAuthStateInCookie:false}});await this.instance.initialize();const a=this.instance.getAllAccounts();this.account=this.instance.getActiveAccount()||a[0]||null;if(this.account)this.instance.setActiveAccount(this.account);return this.instance},
  isConnected(){return Boolean(this.account||localStorage.getItem('m365-account'))},
  async connect(){if(location.protocol==='file:')throw new Error('Publiez le site en HTTPS avant de connecter Microsoft 365.');const c=await this.init(),r=await c.loginPopup({scopes:this.scopes,prompt:'select_account'});this.account=r.account;c.setActiveAccount(this.account);localStorage.setItem('m365-account',JSON.stringify({name:this.account.name,username:this.account.username}));return this.account},
  async login(){return this.connect()},
  async token(){const c=await this.init();if(!this.account)throw new Error('Connectez d’abord votre compte Microsoft 365.');try{return(await c.acquireTokenSilent({account:this.account,scopes:this.scopes})).accessToken}catch{return(await c.acquireTokenPopup({account:this.account,scopes:this.scopes})).accessToken}},
  async graph(path,options={}){const token=await this.token();const r=await fetch('https://graph.microsoft.com/v1.0'+path,{...options,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...(options.headers||{})}});if(!r.ok)throw new Error(`Microsoft Graph a retourné ${r.status}.`);return r.status===204?true:r.json()},
  async profile(){return this.graph('/me?$select=displayName,mail,userPrincipalName')},
  async messages(){const d=await this.graph('/me/mailFolders/inbox/messages?$top=25&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,isRead,bodyPreview');return d.value||[]},
  async sendMessage({to,subject,body}){return this.graph('/me/sendMail',{method:'POST',body:JSON.stringify({message:{subject,body:{contentType:'Text',content:body},toRecipients:[{emailAddress:{address:to}}]},saveToSentItems:true})})},
  async disconnect(){if(this.instance)await this.instance.clearCache();this.account=null;localStorage.removeItem('m365-account');}
};

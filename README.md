# Geneviève Côté — plateforme immobilière premium

Prototype frontend démontrable basé sur le cahier des charges `Master_Prompt_Codex_Courtiers_Immobiliers.pdf`.

## Inclus dans cette première phase

- design system premium responsive, navigation latérale et barre de recherche
- Dashboard « Aujourd’hui » avec KPI, activité, pipeline et priorités IA
- CRM Clients avec tableau de suivi
- Propriétés avec KPI, fiches et carte interactive de démonstration
- Ventes & commissions avec KPI, progression d’objectif, graphique et transactions
- données fictives intégrées pour une démonstration immédiate
- connexion Microsoft 365 / Outlook prête avec MSAL et Microsoft Graph (`User.Read`, `Mail.ReadWrite`)

## Lancer localement

Ouvrir `index.html` dans un navigateur. Aucun build ni dépendance n’est nécessaire pour cette maquette de démonstration.

## Suite recommandée

La prochaine phase consiste à remplacer les données fictives par Next.js/TypeScript, Prisma/PostgreSQL, authentification multi-tenant, puis à brancher Gmail, Google Calendar et les workflows avec approbation humaine.

## Connexion Microsoft 365

Le bouton Microsoft 365 est présent dans **Courriels** et **Paramètres**. Pour activer le vrai OAuth, ajoutez l’URL HTTPS de production (et localhost en développement) comme URI de redirection dans l’application Microsoft Entra ID associée au client `eeff2f4a-7f6b-44fb-a33e-8d9990ce16e1`. Le navigateur ne peut pas faire un OAuth réel depuis une URL `file://`.

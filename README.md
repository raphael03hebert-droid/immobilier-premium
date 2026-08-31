# Geneviève Côté — plateforme immobilière premium

Prototype frontend démontrable basé sur le cahier des charges `Master_Prompt_Codex_Courtiers_Immobiliers.pdf` et le script maître CRM fourni.

## Inclus dans cette première phase

- design system premium responsive, navigation latérale et barre de recherche
- Dashboard « Aujourd’hui » avec KPI, activité, pipeline et priorités IA
- CRM Clients avec tableau de suivi
- Propriétés avec KPI, fiches et carte interactive de démonstration
- Ventes & commissions avec KPI, progression d’objectif, graphique et transactions
- données fictives intégrées pour une démonstration immédiate
- connexion Microsoft 365 / Outlook prête avec MSAL et Microsoft Graph (`User.Read`, `Mail.ReadWrite`)
- recherche globale groupée (clients, propriétés et tâches), filtres et tri des collections
- agenda avec vues mois/semaine/jour/agenda, détection de chevauchements et actions de suivi
- carte Leaflet réelle avec liste synchronisée, fiches propriétés et filtre par statut/prix
- report de tâches, détail des commissions (brut, dépenses, net, payé) et export CSV des ventes
- ajout et aperçu des métadonnées de documents avec avertissement clair sur le stockage local

## Lancer localement

Ouvrir `index.html` dans un navigateur. Aucun build ni dépendance n’est nécessaire pour cette maquette de démonstration.

## Suite recommandée

Les données métier actuelles restent locales à chaque navigateur afin de préserver la démonstration. Pour une production multi-utilisateur, la prochaine phase consiste à ajouter un backend (base de données, authentification multi-tenant, stockage documentaire sécurisé, journal d’audit et files de synchronisation), puis les connecteurs MLS, Google Places, Gmail et Google Calendar.

## Connexion Microsoft 365

Le bouton Microsoft 365 est présent dans **Courriels** et **Paramètres**. Pour activer le vrai OAuth, ajoutez l’URL HTTPS de production (et localhost en développement) comme URI de redirection dans l’application Microsoft Entra ID associée au client `eeff2f4a-7f6b-44fb-a33e-8d9990ce16e1`. Le navigateur ne peut pas faire un OAuth réel depuis une URL `file://`.

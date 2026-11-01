/* =====================================================================
 *  Programme de gestion scout (Google Apps Script)
 *  ---------------------------------------------------------------------
 *  Sections : Trésorier · Secrétaire · Cuisinier · Matériel & Intendance
 *             · Secouriste · Photographe · Animateur
 *  Organisation dans Drive :
 *    📁 Dossier du groupe
 *       📄 ▶ OUVRIR LE PROGRAMME   ← le fichier sur lequel on clique
 *       📁 Info                     ← toutes les données (créé automatiquement)
 *          📁 Tresorerie · Cuisine · Materiel · Secourisme · Secretariat · Photographe · Animation
 *  Le script peut être placé dans le dossier du groupe OU dans « Info ».
 * ===================================================================== */

/* #####################################################################
 * ⚙️  RÉGLAGES — C'EST ICI QU'ON CHANGE LE NOM ET LA COULEUR
 * #####################################################################
 *  Après une modification : Enregistrer 💾, puis
 *  Déployer › Gérer les déploiements › ✏️ › Version : Nouvelle version › Déployer
 * ##################################################################### */
const REGLAGES = {
  // Nom de l'application : onglet du navigateur, raccourcis (téléphone / bureau), menu
  NOM_APP: 'Estela',

  // Compte connecté : l'unité et son groupe (affichés dans le menu, l'accueil, les fiches)
  NOM: 'Maîtrise de Groupe',
  GROUPE: 'Groupe Scout Exemple',

  // Comment l'application s'adresse aux responsables : 'chef' ou 'cheftaine'
  CHEF: 'chef',

  // Couleur principale : menu de gauche, bandeau de l'accueil (avec les sapins),
  // barre du haut sur téléphone, boutons principaux, en-têtes des Sheets.
  // Format #RRGGBB — choisir une couleur ici : https://htmlcolorcodes.com
  //   Vert forêt (d'origine) '#1F4D33'   Bleu marine '#1E3A5F'   Bordeaux '#6B1E2E'
  //   Bleu lac   '#1D5C7A'              Brun bois   '#5A3A22'   Gris ardoise '#2F3E46'
  COULEUR_PRINCIPALE: '#DD6B0D',

  // Couleur des petits détails du menu et de l'accueil (trait du menu actif, étiquettes,
  // bouton « Toujours prêts »). Garder une couleur qui ressort sur la couleur principale.
  COULEUR_ACCENT: '#1B4F8A',

  // ---- Secrétaire › Présences ----
  NOM_ENSEMBLE: 'Maîtrise',                 // nom de toute l'unité (ex. Troupe, Meute, Clan)
  UNITE_NOM: 'maîtrise',                // nom d'un sous-groupe (au singulier, en minuscules)
  UNITE_PLURIEL: 'maîtrises',
  UNITES: ['Groupe', 'Meute', 'Troupe', 'Clan'],
  ROLES: { 'Groupe': ['CG', 'ACG', 'EA'], '*': ['CU', 'ACU'] },                    // responsables : un seul de chaque par sous-groupe
  // (Maîtrise) ROLES peut aussi être { 'Groupe': ['CG', 'ACG', 'EA'], '*': ['CU', 'ACU'] } : rôles selon le sous-groupe ;
  // seuls les rôles de ROLES_UNIQUES sont alors limités à un par sous-groupe.
  ROLES_UNIQUES: ['CG', 'CU'],
  NOM_RESPONSABLES: '',                 // nom du % de présence des responsables ('' = pas de %)
  // Réunions où seuls certains rôles sont attendus (choisies au moment de l'appel, ex. une réunion HP). [] = aucune.
  REUNIONS_RESTREINTES: [{ nom: 'Conseil des chefs', roles: ['CG', 'ACG', 'CU'] }],
  DISTINCTION: '',                        // ex. 'Sizaine Akela' : un sous-groupe distingué par trimestre ('' = aucune)
  REUNIONS_PAR_UNITE: false,              // true : chaque réunion / camp / journée est pour tout le groupe OU un seul sous-groupe

  // ---- Secrétaire › Progression ----
  // 'troupe' : Promesse, 2e classe, 1re classe, Raider, badges   ·   'clan' : Jalons + Promesse, Adhésion, 1ère veille, Départ
  // 'meute'  : Promesse, 1ère étoile, 2ème étoile (cases = pages du carnet), Brevets de Capacité
  // false : onglet masqué. Détails dans les blocs PROGRESSION / PROGRESSION_CLAN / PROGRESSION_MEUTE juste en dessous.
  PROGRESSION: false,

  // ---- Secrétaire › Ordre du jour (modèle « Modele - Ordre du jour ») ----
  ORDRE_DU_JOUR: false,

  // ---- Secrétaire › Compte rendu d'une réunion, d'un camp ou d'une journée (modèle « Modele - Compte rendu ») ----
  COMPTE_RENDU: true,

  // ---- Matériel › Local des bois (morines, bois naturel, palettes) ----
  LOCAL_DES_BOIS: false,

  // ---- Services d'unité (Clan) : qui a servi quelle unité, et quand ----
  SERVICES: false,
  SERVICES_UNITES: ['Meute', 'Troupe', 'Clan', 'Guides'],
  SERVICES_TYPES: ['Garde', 'Matériel', 'Étapiste', 'Autre'],

  // ---- Application de la Maîtrise de Groupe (comptes par section + suivi des unités). false pour une unité. ----
  MAITRISE: true,

  // Icône des raccourcis. Laisser vide : le programme utilise automatiquement le fichier
  // « Estela - icone.png » qu'il dépose dans Info. Sinon, coller l'adresse https d'une image PNG.
  ICONE_URL: ''
};
/* ##################################################################### */

/* #####################################################################
 * 🔐  MAÎTRISE DE GROUPE — utilisé seulement quand REGLAGES.MAITRISE vaut true
 * ##################################################################### */
const MAITRISE = {
  // Clé joker de DÉPART : tapée comme mot de passe (avec n'importe quel utilisateur), elle ouvre toutes les sections
  // (mais pas l'administration). Comme les comptes ci-dessous, elle se change ensuite dans l'application.
  CLE_JOKER: 'changez-moi-joker',

  // Comptes créés au PREMIER démarrage. Ensuite ils se changent dans l'application (Administration) :
  // modifier ces lignes n'a plus d'effet, sauf après avoir supprimé la propriété du script « COMPTES ».
  COMPTES: {
    admin:      { utilisateur: 'admin',      motDePasse: 'changez-moi' },
    tresorier:  { utilisateur: 'tresorier',  motDePasse: 'changez-moi' },
    secretaire: { utilisateur: 'secretaire', motDePasse: 'changez-moi' },
    cuisinier:  { utilisateur: 'cuisinier',  motDePasse: 'changez-moi' },
    materiel:   { utilisateur: 'materiel',   motDePasse: 'changez-moi' },
    secouriste: { utilisateur: 'secouriste', motDePasse: 'changez-moi' },
    photographe: { utilisateur: 'photographe', motDePasse: 'changez-moi' },
    animateur:  { utilisateur: 'animateur',  motDePasse: 'changez-moi' }
  },
  SESSION_HEURES: 12,            // durée d'une connexion

  // Ce qui s'ouvre SANS mot de passe tant que l'administrateur n'a rien changé (ensuite : Administration › Comptes).
  //  · TRAVAIL : le travail de la Maîtrise (usage courant) — tout sauf le Trésorier
  //  · SUIVI   : le suivi des unités — rien (chaque section demande son compte)
  TRAVAIL_SANS_MOT_DE_PASSE: ['secretaire', 'cuisinier', 'materiel', 'secouriste', 'photographe', 'animateur'],
  SUIVI_SANS_MOT_DE_PASSE: [],

  // Où trouver les unités dans Drive :  <DOSSIER_GROUPE> › <année> › <unité> › Utilities › Info
  DOSSIER_GROUPE: ['Groupe Scout Exemple'],   // dossier commun (les deux orthographes sont acceptées)
  ANNEE: '',                     // '' = automatique (l'année scoute en cours, sinon le dossier d'année le plus récent) ; ou '2026-2027'
  UNITES: [
    { cle: 'meute', nom: 'Meute Exemple', couleur: '#B8860B', chemin: ['{ANNEE}', 'Meute Exemple', 'Utilities'],
      profil: { NOM: 'Meute Exemple', NOM_ENSEMBLE: 'Meute', UNITE_NOM: 'sizaine', UNITE_PLURIEL: 'sizaines', UNITES: ['Blanche', 'Brune', 'Grise', 'Fauve', 'Noire'],
        ROLES: ['SI', 'SE'], NOM_RESPONSABLES: 'SI / SE', DISTINCTION: 'Sizaine Akela', REUNIONS_PAR_UNITE: false, PROGRESSION: 'meute', LOCAL_DES_BOIS: false,
        REUNIONS_RESTREINTES: [{ nom: 'SI / SE', roles: ['SI', 'SE'] }] } },
    { cle: 'troupe', nom: 'Troupe Exemple', couleur: '#1F6B45', chemin: ['{ANNEE}', 'Troupe Exemple', 'Utilities'],
      profil: { NOM: 'Troupe Exemple', NOM_ENSEMBLE: 'Troupe', UNITE_NOM: 'patrouille', UNITE_PLURIEL: 'patrouilles', UNITES: ['Lions', 'Loups', 'Lynx', 'Aigles', 'Requins'],
        ROLES: ['CP', 'SP'], NOM_RESPONSABLES: 'HP', DISTINCTION: '', REUNIONS_PAR_UNITE: false, PROGRESSION: 'troupe', LOCAL_DES_BOIS: true,
        REUNIONS_RESTREINTES: [{ nom: 'HP', roles: ['CP', 'SP'] }] } },
    { cle: 'clan', nom: 'Clan Exemple', couleur: '#A3272C', chemin: ['{ANNEE}', 'Clan Exemple', 'Utilities'],
      profil: { NOM: 'Clan Exemple', NOM_ENSEMBLE: 'Clan', UNITE_NOM: 'équipe', UNITE_PLURIEL: 'équipes', UNITES: ['Ouragan', 'Cime', 'Aurore'],
        ROLES: ['CE'], NOM_RESPONSABLES: '', DISTINCTION: '', REUNIONS_PAR_UNITE: true, PROGRESSION: 'clan', LOCAL_DES_BOIS: false,
        REUNIONS_RESTREINTES: [], SERVICES: true } }
  ]
};

let VERROU_ = 0;          // verrou du script déjà pris par l'exécution en cours
let SESSION_ = null;     // session vérifiée de l'appel en cours (posée par appel())
let ENTREE_ = false;     // le premier contrôle d'accès de l'appel a réussi : les appels internes sont de confiance
let SECTION_ = '';       // section par laquelle l'appel est entré (pour signer « Ajouté par »)
let CTX_ = null;         // lecture d'une unité : { info, reglages, manquants } — AUCUNE écriture dans ce mode

/** Réglages en vigueur : ceux de l'application, ou ceux de l'unité que la Maîtrise est en train de lire. */
function R_() { return CTX_ ? CTX_.reglages : REGLAGES; }

/* Structure de la progression (Secrétaire › Progression).
 * « noms » est facultatif : pour afficher le nom de chaque étape au lieu de « Étape 1, 2… ». */
const PROGRESSION = {
  PROMESSE: { nom: 'Promesse', couleur: '#2F6FB5', etapes: 15, noms: [] },
  DEUXIEME: { nom: '2e classe', couleur: '#D9A400', etapes: 25, noms: [] },
  PREMIERE: {
    nom: '1re classe', couleur: '#2E7D4F', etapesParPartie: 4, partiesAChoisir: 4,
    parties: ['Vie chrétienne', 'Prêt pour l’aventure', 'Habileté manuelle', 'Expression et connaissance', 'Ami de la nature', 'Santé']
  },
  RAIDER: { nom: 'Raider', couleur: '#7B3FA0' },
  BADGES: {
    nom: 'Badges', couleur: '#8B3A2E',
    categories: ['Vie chrétienne', 'Arts et expression', 'Connaissance et découverte', 'Sport', 'Vie dans la nature', 'Santé et sécurité', 'Monde numérique', 'Techniques']
  },
  // Points pour le classement des patrouilles (moyenne par membre)
  POINTS: { promesse: 10, deuxieme: 20, premiere: 30, raider: 40, badge: 5 }
};

/* Progression du Clan (Secrétaire › Progression quand PROGRESSION vaut 'clan').
 * Les étapes s'ouvrent dans l'ordre ; « couleurs » = bandes affichées sur chaque étape.
 * Les icônes des Jalons sont dans le fichier « Jalons » (1 à 4, dans cet ordre). */
const PROGRESSION_CLAN = {
  ETAPES: [
    { cle: 'PROMESSE', nom: 'Promesse', couleurs: ['#2F6FB5'] },
    { cle: 'ADHESION', nom: 'Adhésion', couleurs: ['#B9A0E6', '#FFFFFF'] },
    { cle: 'VEILLE', nom: '1ère veille', couleurs: ['#C8161D', '#FFFFFF'] },
    { cle: 'DEPART', nom: 'Départ', couleurs: ['#F2C230', '#2E7D4F', '#C8161D'] }
  ],
  JALONS: [
    { cle: '1', nom: 'Fleur de Lys', couleur: '#8E8E8E' },
    { cle: '2', nom: 'Barre de Pilote', couleur: '#C79A6B' },
    { cle: '3', nom: 'Témoin de Dieu', couleur: '#5A2B20' },
    { cle: '4', nom: 'Flèche d’Or', couleur: '#C2912E' }
  ]
};

/* Progression de la Meute (Secrétaire › Progression quand PROGRESSION vaut 'meute').
 * Chaque case est une PAGE du carnet : pour ajouter ou retirer une page, modifier la liste « pages ».
 * (« cle » ne doit pas être changée une fois que des cases ont été cochées.) */
const PROGRESSION_MEUTE = {
  ASPIRANT: 'Aspirant',          // statut affiché tant que la Promesse n'est pas terminée
  DANS_L_ORDRE: true,            // true : chaque partie s'ouvre quand la précédente est terminée (les brevets après la Promesse)
                                 // false : tout est ouvert dès le début
  PARTIES: [
    { cle: 'P', nom: 'Promesse', couleur: '#6FBF5E', points: 10,
      pages: [7, 17, 19, 21, 23, 28, 30, 31, 32, 33, 34, 35, 37, 40, 41, 42, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55] },
    { cle: 'E1', nom: '1ère étoile', couleur: '#5B57D1', points: 20,
      pages: [74, 76, 77, 79, 81, 82, 83, 85, 88, 89, 92, 93, 95, 98, 99, 100, 101, 102, 103, 104, 105] },
    { cle: 'E2', nom: '2ème étoile', couleur: '#5B57D1', points: 30,
      pages: [115, 117, 118, 119, 120, 121, 122, 124, 125, 126, 127, 128, 129, 130, 131] }
  ],
  // Les brevets s'ajoutent à la main dans l'application (Progression › Catalogue des brevets).
  // « categories » est facultatif : ex. ['Sport', 'Nature'] pour ranger les brevets par catégorie ([] = une seule liste).
  BREVETS: { nom: 'Brevets de Capacité', singulier: 'Brevet de Capacité', couleur: '#8B1A1A', points: 5, categories: [] }
};

function typeProgression_() {
  const p = R_().PROGRESSION;
  return p === true || p === 'troupe' ? 'troupe' : (p === 'clan' ? 'clan' : (p === 'meute' ? 'meute' : ''));
}

/** Catalogue des badges (Troupe) ou des brevets (Meute) : onglet, colonne du nom, mots affichés, catégories. */
function catalogue_() {
  const type = typeProgression_();
  if (type === 'troupe') return { feuille: 'Badges', colonne: 'Badge', mot: 'badge', Mot: 'Badge', ce: 'Ce badge', categories: PROGRESSION.BADGES.categories };
  if (type === 'meute') return { feuille: 'Brevets', colonne: 'Brevet', mot: 'brevet', Mot: PROGRESSION_MEUTE.BREVETS.singulier, ce: 'Ce brevet', categories: PROGRESSION_MEUTE.BREVETS.categories || [] };
  return null;
}

const CONFIG = {
  NOM_GROUPE: REGLAGES.NOM,
  DEVISE_SCOUTE: 'Toujours prêts !',

  // Laisser vide : le programme utilise le dossier Drive où se trouve ce script.
  // Sinon, collez ici l'ID du dossier (la partie après /folders/ dans l'adresse).
  DOSSIER_RACINE_ID: '',

  // Dossier qui contient toutes les données (à côté du fichier « OUVRIR LE PROGRAMME »)
  DOSSIER_INFO: 'Info',

  DOSSIERS: {
    SECRETARIAT: 'Secretariat',
    MODELES: 'Modeles',              // dans Secretariat : les modèles (fiche d'activité, compte rendu, ordre du jour)
    TRESORERIE: 'Tresorerie',
    CUISINE: 'Cuisine',
    MATERIEL: 'Materiel',
    SECOURISME: 'Secourisme',
    SERVICES: 'Services',
    PHOTOGRAPHE: 'Photographe',
    ANIMATION: 'Animation'
  },
  FICHIERS: {
    BILAN: 'Bilan Caisse',
    RECETTES: 'Recettes',
    INV_MATERIEL: 'Inventaire Materiel',
    INV_PHARMACIE: 'Inventaire Pharmacie',
    PRESENCES: 'Presences',
    PROGRESSION: 'Progression',
    SERVICES: 'Services d\'unité',
    CHECKLISTS: 'Checklists photo',
    ANIMATION: 'Animation',
    MODELE_ODJ: 'Modele - Ordre du jour',
    MODELE_CR: 'Modele - Compte rendu',
    MODELE_FICHE: 'Modele - Fiche Activite',
    RACCOURCI: '▶ OUVRIR ' + REGLAGES.NOM_APP.toUpperCase(),
    ICONE: REGLAGES.NOM_APP + ' - icone.png'
  },
  DEVISES: ['USD', 'LBP']
};

const TYPES_JOURNEE = ['Réunion', 'Camp', 'Journée', 'Autre'];      // Trésorier
const TYPES_ACTIVITE = ['Réunion', 'Camp', 'Journée'];              // Présences (Clan : type de chaque activité)

const INVENTAIRES = {
  materiel: {
    dossier: CONFIG.DOSSIERS.MATERIEL,
    fichier: CONFIG.FICHIERS.INV_MATERIEL,
    types: ['Matériel', 'Intendance'],
    expiration: false,
    listes: true                       // plusieurs listes indépendantes (ex. Local, Malle Lions, Camp d'été)
  },
  pharmacie: {
    dossier: CONFIG.DOSSIERS.SECOURISME,
    fichier: CONFIG.FICHIERS.INV_PHARMACIE,
    types: ['Pharmacie', 'Premiers secours', 'Médicament'],
    expiration: true,
    listes: false
  }
};
const LISTE_DEFAUT = 'Général';      // liste des articles enregistrés avant l'arrivée des listes

const COULEUR_ENTETE = /^#[0-9a-f]{6}$/i.test(REGLAGES.COULEUR_PRINCIPALE) ? REGLAGES.COULEUR_PRINCIPALE : '#1F4D33';

/* =====================================================================
 *  POINT D'ENTRÉE WEB
 * ===================================================================== */

function doGet() {
  try { assurerRaccourci_(); } catch (err) { console.warn('Raccourci : ' + err); }
  const t = HtmlService.createTemplateFromFile('Index');
  t.groupe = CONFIG.NOM_GROUPE;
  t.reglages = { app: REGLAGES.NOM_APP, nom: REGLAGES.NOM, groupe: REGLAGES.GROUPE, couleur: COULEUR_ENTETE,
    chef: texte_(REGLAGES.CHEF) || 'chef', progression: typeProgression_(), odj: !!REGLAGES.ORDRE_DU_JOUR,
    cr: !!REGLAGES.COMPTE_RENDU, bois: !!REGLAGES.LOCAL_DES_BOIS,
    services: !!REGLAGES.SERVICES && !REGLAGES.MAITRISE,
    maitrise: !!REGLAGES.MAITRISE,
    libres: (function () { if (!REGLAGES.MAITRISE) return []; try { return libres_(); } catch (e) { return []; } })(),
    suivi: REGLAGES.MAITRISE ? MAITRISE.UNITES.map(function (u) { return { cle: u.cle, nom: u.nom, couleur: u.couleur, type: u.profil.PROGRESSION || '', bois: !!u.profil.LOCAL_DES_BOIS, ensemble: u.profil.NOM_ENSEMBLE }; }) : [],
    unites: cfgPres_().unites, uniteNom: cfgPres_().uniteNom, ensemble: cfgPres_().ensemble,
    accent: /^#[0-9a-f]{6}$/i.test(REGLAGES.COULEUR_ACCENT || '') ? REGLAGES.COULEUR_ACCENT : '#F4C20D' };
  // Icônes des Jalons (fichier HTML « Jalons »). S'il manque, l'application s'ouvre quand même, sans les icônes.
  t.jalons = '{}';
  if (typeProgression_() === 'clan' || REGLAGES.MAITRISE) {
    try { const j = include('Jalons').trim(); JSON.parse(j); t.jalons = j.replace(/</g, '\\u003c'); }
    catch (err) { console.warn('Fichier « Jalons » manquant ou incomplet : ' + err); }
  }
  const page = t.evaluate()
    .setTitle(REGLAGES.NOM_APP)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  // Icône et nom des raccourcis (téléphone / bureau). Chaque étape est facultative.
  let icone = '';
  try { icone = iconeUrl_(); } catch (err) { console.warn('Icône : ' + err); }
  if (icone) { try { page.setFaviconUrl(icone); } catch (err) { console.warn('Favicon : ' + err); } }
  [['mobile-web-app-capable', 'yes'], ['apple-mobile-web-app-capable', 'yes'],
   ['apple-mobile-web-app-title', REGLAGES.NOM_APP], ['application-name', REGLAGES.NOM_APP]]
    .forEach(function (m) { try { page.addMetaTag(m[0], m[1]); } catch (err) { /* balise non autorisée */ } });
  return page;
}

/** Adresse publique de l'icône (déposée une fois dans Info, lien partagé en lecture). */
function iconeUrl_() {
  if (REGLAGES.ICONE_URL) return REGLAGES.ICONE_URL;
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('ICONE_ID');
  if (id && props.getProperty('ICONE_NOM') === CONFIG.FICHIERS.ICONE) return urlIcone_(id);
  const info = info_();
  let f = fichierParNom_(info, CONFIG.FICHIERS.ICONE, MimeType.PNG);
  if (!f) {
    const data = include('Icone').trim();
    f = info.createFile(Utilities.newBlob(Utilities.base64Decode(data.substring(data.indexOf(',') + 1)), MimeType.PNG, CONFIG.FICHIERS.ICONE));
  }
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) { console.warn('Partage icône : ' + err); }
  props.setProperty('ICONE_ID', f.getId());
  props.setProperty('ICONE_NOM', CONFIG.FICHIERS.ICONE);
  return urlIcone_(f.getId());
}
function urlIcone_(id) { return 'https://drive.google.com/uc?export=view&id=' + id + '&format=png'; }

function include(nom) {
  return HtmlService.createHtmlOutputFromFile(nom).getContent();
}

/** À exécuter une fois depuis l'éditeur : crée tous les dossiers et fichiers. */
function installer() {
  if (REGLAGES.MAITRISE) {
    // réservé au propriétaire, depuis l'éditeur : un visiteur de l'application ne peut pas le lancer
    const actif = Session.getActiveUser().getEmail(), effectif = Session.getEffectiveUser().getEmail();
    let proprio = '';
    try { proprio = DriveApp.getFileById(ScriptApp.getScriptId()).getOwner().getEmail(); } catch (e) { proprio = ''; }   // (pas de propriétaire dans un Drive partagé)
    if (!actif || actif !== effectif || (proprio && actif !== proprio)) throw new Error('Réservé au propriétaire du programme.');
    SESSION_ = { s: SECTIONS_MAITRISE.map(function (x) { return x[0]; }), a: false, e: 0, v: 0, n: 'installation', p: {} };
  }
  ENTREE_ = true;                         // exécuté depuis l'éditeur (ne renvoie aucune donnée)
  migrerVersInfo_(true);
  const r = accueilResume();
  try { console.log('Icône : ' + iconeUrl_()); } catch (e) { console.warn('Icône : ' + e); }
  console.log('Installation terminée dans le dossier : ' + racine_().getName());
  console.log(JSON.stringify(r, null, 2));
  const url = ScriptApp.getService().getUrl();
  if (url) { creerRaccourci_(url); console.log('Lien du programme : ' + url); }
  else console.log('Déployez maintenant le script (Déployer › Nouveau déploiement › Application Web).');
}

/* =====================================================================
 *  ACCUEIL
 * ===================================================================== */

function accueilResume() {
  acces_('*');
  const r = { utilisateur: qui_(), groupe: CONFIG.NOM_GROUPE, dossierUrl: '', erreurs: [] };
  try { r.dossierUrl = racine_().getUrl(); } catch (e) { r.erreurs.push(e.message); return r; }
  if (REGLAGES.MAITRISE) { r.sections = SESSION_ ? SESSION_.s : []; r.admin = !!(SESSION_ && SESSION_.a); }
  if (REGLAGES.MAITRISE && !r.admin) r.dossierUrl = '';     // le lien du dossier Drive n'est montré qu'à l'administrateur

  // (Maîtrise : seuls les chiffres des sections ouvertes par la session sont calculés et renvoyés)
  if (voit_('tresorier')) try {
    const d = tresorerieDonnees();
    r.tresorerie = {};
    CONFIG.DEVISES.forEach(function (dev) {
      let s = 0, n = 0;
      d.operations.forEach(function (o) {
        if (o.devise !== dev) return;
        n++; s += o.nature === 'Entrée' ? o.montant : -o.montant;
      });
      r.tresorerie[dev] = { solde: arrondi_(s), operations: n };
    });
  } catch (e) { r.erreurs.push('Trésorerie : ' + e.message); }

  if (voit_('secretaire')) try { r.fiches = secretariatInfos().fiches.length; }
  catch (e) { r.erreurs.push('Secrétariat : ' + e.message); }

  if (voit_('cuisinier')) try { r.recettes = cuisineRecettes().recettes.length; }
  catch (e) { r.erreurs.push('Cuisine : ' + e.message); }

  ['materiel', 'pharmacie'].forEach(function (cle) {
    if (!voit_(cle === 'pharmacie' ? 'secouriste' : 'materiel')) return;
    try {
      const d = inventaireDonnees(cle);
      const auj = aujourdhuiIso_();
      const dans30 = isoPlusJours_(30);
      r[cle] = {
        articles: d.articles.length,
        zero: d.articles.filter(function (a) { return a.quantite <= 0; }).length,
        expires: d.articles.filter(function (a) { return a.expiration && a.expiration < auj; }).length,
        bientot: d.articles.filter(function (a) { return a.expiration && a.expiration >= auj && a.expiration <= dans30; }).length
      };
    } catch (e) { r.erreurs.push(cle + ' : ' + e.message); }
  });
  if (voit_('photographe')) try {
    const ph = photoDonnees().checklists, enCours = ph.filter(function (c) { return c.statut !== PHOTO.TERMINEE; });
    r.photo = { enCours: enCours.length, terminees: ph.length - enCours.length, reste: enCours.reduce(function (s, c) { return s + c.reste; }, 0) };
  } catch (e) { r.erreurs.push('Photographe : ' + e.message); }
  if (voit_('animateur')) try {
    const an = animationDonnees();
    r.animation = { repertoire: an.repertoire.length, veillees: an.veillees.length };
  } catch (e) { r.erreurs.push('Animateur : ' + e.message); }
  if (R_().SERVICES) try {
    const sv = servicesDonnees();
    const an = anneeScouteDe_(aujourdhuiIso_());
    r.services = { total: sv.services.length, annee: sv.services.filter(function (x) { return anneeScouteDe_(x.date) === an; }).length };
  } catch (e) { r.erreurs.push('Services : ' + e.message); }
  return r;
}

/* =====================================================================
 *  TRÉSORIER — Bilan Caisse
 * ===================================================================== */

const T_ENTETES = ['ID', 'Date', 'Nature', 'Cause', 'Type de journée', 'Événement', 'Catégorie / Provenance',
  'Montant', 'Devise', 'Remarque', 'Ajouté par', 'Horodatage'];

function feuilleCaisse_() {
  const ss = classeur_(dossier_(info_(), CONFIG.DOSSIERS.TRESORERIE), CONFIG.FICHIERS.BILAN);
  const sh = feuille_(ss, 'Journal', T_ENTETES, {
    largeurs: [80, 95, 85, 240, 120, 160, 190, 110, 60, 220, 190, 135],
    formats: { 'Date': 'dd/mm/yyyy', 'Montant': '#,##0.00', 'Horodatage': 'dd/mm/yyyy hh:mm' },
    cacherId: true
  });
  assurerIds_(sh);
  return { ss: ss, sh: sh };
}

function lireOperations_(sh) {
  return lignes_(sh)
    .filter(function (o) { return String(o['Montant']).trim() !== '' && String(o['Cause'] || o['Date']).trim() !== ''; })
    .map(function (o) {
      return {
        id: String(o['ID'] || ''),
        date: dateIso_(o['Date']),
        nature: natureNorm_(o['Nature']),
        cause: texte_(o['Cause']),
        journee: journeeNorm_(o['Type de journée']),
        evenement: texte_(o['Événement']),
        categorie: texte_(o['Catégorie / Provenance']),
        montant: Math.abs(Number(o['Montant']) || 0),
        devise: texte_(o['Devise']).toUpperCase() || CONFIG.DEVISES[0],
        remarque: texte_(o['Remarque']),
        par: texte_(o['Ajouté par']),
        horodatage: dateHeure_(o['Horodatage'])
      };
    })
    .sort(function (a, b) { return (b.date + b.horodatage).localeCompare(a.date + a.horodatage); });
}

function reponseCaisse_(f, ops) {
  return { operations: ops || lireOperations_(f.sh), lien: f.ss.getUrl(), devises: CONFIG.DEVISES, journees: TYPES_JOURNEE };
}

function tresorerieDonnees() {
  acces_('tresorier');
  return reponseCaisse_(feuilleCaisse_());
}

/** Vérifie une opération saisie et la remet au propre (sans rien écrire). */
function opValider_(op) {
  op = op || {};
  const date = dateVal_(op.date);
  if (!date) throw new Error('Veuillez indiquer une date valide.');
  const nature = op.nature === 'Entrée' ? 'Entrée' : (op.nature === 'Dépense' ? 'Dépense' : null);
  if (!nature) throw new Error('Nature invalide (Entrée ou Dépense).');
  const cause = texte_(op.cause);
  if (!cause) throw new Error('Veuillez indiquer la cause.');
  if (TYPES_JOURNEE.indexOf(op.journee) < 0) throw new Error('Choisissez le type de journée (' + TYPES_JOURNEE.slice(0, -1).join(', ') + ' ou ' + TYPES_JOURNEE[TYPES_JOURNEE.length - 1] + ').');
  const categorie = texte_(op.categorie);
  if (!categorie) throw new Error(nature === 'Entrée' ? 'Indiquez la provenance de l\'argent.' : 'Indiquez sur quoi l\'argent a été dépensé.');
  const montant = Number(op.montant);
  if (!isFinite(montant) || montant <= 0) throw new Error('Le montant doit être un nombre positif.');
  const evenement = texte_(op.evenement).replace(/\s+/g, ' ');
  if (evenement.length > 60) throw new Error('Nom de l\'événement : 60 caractères au plus.');
  return {
    'Date': date, 'Nature': nature, 'Cause': cause, 'Type de journée': op.journee, 'Événement': evenement,
    'Catégorie / Provenance': categorie, 'Montant': arrondi_(montant),
    'Devise': CONFIG.DEVISES.indexOf(op.devise) >= 0 ? op.devise : CONFIG.DEVISES[0], 'Remarque': texte_(op.remarque)
  };
}
/** Un événement déjà utilisé garde son orthographe (« camp hp » rejoint « Camp HP »). */
function evenementExistant_(ops, nom) {
  if (!nom) return '';
  const k = norm_(nom);
  const ex = ops.filter(function (o) { return o.evenement && norm_(o.evenement) === k; })[0];
  return ex ? ex.evenement : nom;
}
function colorerOperation_(sh, ligne, nature) {
  const h = entetes_(sh);
  const couleur = nature === 'Entrée' ? '#1E7B45' : '#C8161D';
  sh.getRange(ligne, h.indexOf('Nature') + 1).setFontColor(couleur).setFontWeight('bold');
  sh.getRange(ligne, h.indexOf('Montant') + 1).setFontColor(couleur);
}

function tresorerieAjouter(op) {
  acces_('tresorier');
  const o = opValider_(op);
  return avecVerrou_(function () {
    const f = feuilleCaisse_();
    o['Événement'] = evenementExistant_(lireOperations_(f.sh), o['Événement']);
    o['ID'] = id_(); o['Ajouté par'] = qui_(); o['Horodatage'] = new Date();
    const ligne = ajouter_(f.sh, o);
    colorerOperation_(f.sh, ligne, o['Nature']);
    const ops = lireOperations_(f.sh);
    ecrireResume_(f.ss, ops);
    return reponseCaisse_(f, ops);
  });
}

/** Modifie une opération existante (tous les champs ; « Ajouté par » et l'horodatage d'origine sont gardés). */
function tresorerieModifier(id, op) {
  acces_('tresorier');
  const o = opValider_(op);
  return avecVerrou_(function () {
    const f = feuilleCaisse_();
    const ex = trouver_(f.sh, id);
    if (!ex) throw new Error('Opération introuvable (supprimée entre-temps ?).');
    o['Événement'] = evenementExistant_(lireOperations_(f.sh).filter(function (x) { return x.id !== String(id); }), o['Événement']);
    maj_(f.sh, ex._row, o);
    colorerOperation_(f.sh, ex._row, o['Nature']);
    const ops = lireOperations_(f.sh);
    ecrireResume_(f.ss, ops);
    return reponseCaisse_(f, ops);
  });
}

function tresorerieSupprimer(id) {
  acces_('tresorier');
  return avecVerrou_(function () {
    const f = feuilleCaisse_();
    const o = trouver_(f.sh, id);
    if (!o) throw new Error('Opération introuvable (déjà supprimée ?).');
    f.sh.deleteRow(o._row);
    const ops = lireOperations_(f.sh);
    ecrireResume_(f.ss, ops);
    return reponseCaisse_(f, ops);
  });
}

function ecrireResume_(ss, ops) {
  let sh = ss.getSheetByName('Résumé');
  if (!sh) sh = ss.insertSheet('Résumé');
  sh.clear();
  const L = 5, vide = ['', '', '', '', ''];
  const rows = [
    ['Bilan Caisse — ' + CONFIG.NOM_GROUPE, '', '', '', ''],
    ['Mis à jour le ' + Utilities.formatDate(new Date(), tz_(), 'dd/MM/yyyy à HH:mm') + ' (généré automatiquement par le programme)', '', '', '', ''],
    vide,
    ['Devise', 'Total entrées', 'Total dépenses', 'Solde', 'Opérations']
  ];
  const somme = function (liste, nature) {
    return arrondi_(liste.filter(function (o) { return o.nature === nature; })
      .reduce(function (s, o) { return s + o.montant; }, 0));
  };
  CONFIG.DEVISES.forEach(function (dev) {
    const l = ops.filter(function (o) { return o.devise === dev; });
    const e = somme(l, 'Entrée'), d = somme(l, 'Dépense');
    rows.push([dev, e, d, arrondi_(e - d), l.length]);
  });
  const ligneT2 = rows.length + 2;
  rows.push(vide);
  rows.push(['Par type de journée', 'Devise', 'Entrées', 'Dépenses', 'Solde']);
  TYPES_JOURNEE.forEach(function (t) {
    CONFIG.DEVISES.forEach(function (dev) {
      const l = ops.filter(function (o) { return o.devise === dev && o.journee === t; });
      const e = somme(l, 'Entrée'), d = somme(l, 'Dépense');
      rows.push([t, dev, e, d, arrondi_(e - d)]);
    });
  });
  // Par événement (ex. « Camp HP ») : toutes ses entrées et dépenses ensemble
  const evs = [];
  ops.forEach(function (o) { if (o.evenement && evs.indexOf(o.evenement) < 0) evs.push(o.evenement); });
  let ligneT3 = 0, nT3 = 0;
  if (evs.length) {
    rows.push(vide);
    ligneT3 = rows.length + 1;
    rows.push(['Par événement', 'Devise', 'Entrées', 'Dépenses', 'Solde']);
    evs.forEach(function (ev) {
      CONFIG.DEVISES.forEach(function (dev) {
        const l = ops.filter(function (o) { return o.devise === dev && o.evenement === ev; });
        if (!l.length) return;
        const e = somme(l, 'Entrée'), d = somme(l, 'Dépense');
        rows.push([ev, dev, e, d, arrondi_(e - d)]); nT3++;
      });
    });
  }
  sh.getRange(1, 1, rows.length, L).setValues(rows.map(function (r) { return r.map(cellule_); }));
  sh.getRange(1, 1).setFontSize(15).setFontWeight('bold').setFontColor(COULEUR_ENTETE);
  sh.getRange(2, 1).setFontStyle('italic').setFontColor('#7A6A58');
  [4, ligneT2].concat(ligneT3 ? [ligneT3] : []).forEach(function (r) {
    sh.getRange(r, 1, 1, L).setFontWeight('bold').setBackground(COULEUR_ENTETE).setFontColor('#FFFFFF');
  });
  sh.getRange(5, 2, CONFIG.DEVISES.length, 3).setNumberFormat('#,##0.00');
  sh.getRange(ligneT2 + 1, 3, TYPES_JOURNEE.length * CONFIG.DEVISES.length, 3).setNumberFormat('#,##0.00');
  if (nT3) sh.getRange(ligneT3 + 1, 3, nT3, 3).setNumberFormat('#,##0.00');
  sh.setColumnWidth(1, 190);
  sh.setColumnWidths(2, 4, 140);
}

/* =====================================================================
 *  TRÉSORIER › COMMANDES COOP — bons de commande à la Coop scoute
 *  Tout est dans un fichier à part : Info › Tresorerie › Coop › « Commandes Coop ».
 *  Seule la caisse est touchée, et seulement quand on le demande : l'achat (une dépense)
 *  puis chaque paiement d'un membre (une entrée), tous sous l'événement « Commande Coop n°… ».
 * ===================================================================== */
const COOP = {
  DOSSIER: 'Coop',
  FICHIER: 'Commandes Coop',
  CATEGORIE: 'Coop scoute',             // catégorie de la dépense dans la caisse
  JOURNEE: 'Autre',                     // type de journée des opérations de caisse
  MAX: { ARTICLE: 80, PRECISION: 60, INTITULE: 80, REMARQUE: 300, NOM: 80, PARTICIPANTS: 150, LIGNES: 40, QTE: 999, CATALOGUE: 300 }
};
const COOP_STATUT = { OUVERTE: 'En préparation', ACHETEE: 'Achetée', PAYEE: 'Payée' };
const COOP_LOGO = 'data:image/png;base64,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';

/** Le nom des sous-groupes : patrouille, sizaine, équipe… (la Maîtrise : « unité »). */
function coopGroupe_() {
  const c = cfgPres_();
  const nom = REGLAGES.MAITRISE ? 'unité' : c.uniteNom;
  return { nom: nom, titre: nom.charAt(0).toUpperCase() + nom.slice(1), unites: c.unites };
}
function feuillesCoop_() {
  const G = coopGroupe_();
  const dos = dossier_(dossier_(info_(), CONFIG.DOSSIERS.TRESORERIE), COOP.DOSSIER);
  const ss = classeur_(dos, COOP.FICHIER);
  const date = 'dd/mm/yyyy', mt = '#,##0.00';
  const cmd = feuille_(ss, 'Commandes', ['ID', 'N°', 'Date', 'Intitulé', 'Devise', 'Statut', 'Total', 'Achetée le', 'Dépense (ID)', 'Payée le', 'Remarque', 'Ajouté par', 'Horodatage'], {
    largeurs: [80, 50, 95, 220, 60, 110, 95, 95, 90, 95, 220, 190, 135], cacherId: true,
    formats: { 'Date': date, 'Achetée le': date, 'Payée le': date, 'Total': mt, 'Horodatage': 'dd/mm/yyyy hh:mm' }
  });
  const lig = feuille_(ss, 'Lignes', ['ID', 'Commande (ID)', 'N°', 'Membre', G.titre, 'Article', 'Précision', 'Quantité', 'Prix unitaire', 'Montant'], {
    largeurs: [80, 90, 50, 190, 110, 200, 130, 75, 95, 95], cacherId: true, formats: { 'Prix unitaire': mt, 'Montant': mt }
  });
  const pai = feuille_(ss, 'Paiements', ['ID', 'Commande (ID)', 'N°', 'Membre', G.titre, 'Montant', 'Payé', 'Payé le', 'Entrée (ID)'], {
    largeurs: [80, 90, 50, 190, 110, 95, 60, 95, 90], cacherId: true, formats: { 'Montant': mt, 'Payé le': date }
  });
  const cat = feuille_(ss, 'Catalogue', ['ID', 'Article', 'Catégorie', 'Prix', 'Devise', 'Disponible', 'Options'], {
    largeurs: [80, 220, 150, 90, 60, 90, 420], cacherId: true, formats: { 'Prix': mt }
  });
  [cmd, lig, pai, cat].forEach(assurerIds_);
  coopCatalogueDepart_(cat);
  return { ss: ss, dos: dos, cmd: cmd, lig: lig, pai: pai, cat: cat, G: G };
}
/* Le catalogue de départ (prix de la Coop, en dollars), écrit une seule fois à la création du fichier.
 * Ensuite tout se change dans l'application (Commandes Coop › Catalogue & prix) ou dans la feuille « Catalogue ».
 * Options : « Groupe: valeur, valeur | Autre groupe: … » ; « * » devant la valeur proposée d'office ;
 * « @progression » = les badges (Troupe) ou brevets (Meute) du catalogue de la Progression. */
function coopCatalogueDefaut_() {
  const type = typeProgression_(), ens = texte_(R_().NOM_ENSEMBLE);
  const couleurs = [['Meute', 'Meute (bleu clair)'], ['Troupe', 'Troupe (bleu)'], ['Clan', 'Clan (rouge)']]
    .map(function (c) { return (!REGLAGES.MAITRISE && norm_(c[0]) === norm_(ens) ? '*' : '') + c[1]; });
  const a = function (article, categorie, prix, options) { return { article: article, categorie: categorie, prix: prix, options: options || '' }; };
  const l = [a('Chemise scoute', 'Uniforme', 15, 'Taille: 8, 10, 12, 14, 16 (XS), S, M, L, XL, 2XL, 3XL, 4XL, 5XL | Couleur: ' + couleurs.join(', ')),
    a('Béret', 'Uniforme', 5), a('Ceinture (boucle incluse)', 'Uniforme', 15)];
  if (type === 'troupe' || type === 'meute') l.push(a('Cordelière', 'Uniforme', 1, 'Couleur: Blanc, Navy'));
  l.push(a('Badge promesse', 'Badges', 0.5));
  if (type === 'troupe') l.push(a('Badge', 'Badges', 0.5, 'Badge: @progression'), a('Badge 1re classe', 'Badges', 0.5), a('Badge 2e classe', 'Badges', 0.5), a('Bande blanche', 'Badges', 0.5));
  if (type === 'meute') l.push(a('Brevet de capacité', 'Badges', 0.5, 'Brevet: @progression'), a('Étoile', 'Badges', 0.5, 'Étoile: 1ère étoile, 2ème étoile'), a('Bande jaune', 'Badges', 0.5));
  l.push(a('Badge district Mont-Liban', 'Insignes', 0.75), a('Badge CICS', 'Insignes', 1), a('Croix métallique', 'Insignes', 3));
  if (type === 'troupe') l.push(a('Prêt', 'Insignes', 5));
  if (type === 'meute') l.push(a('De notre mieux', 'Insignes', 5));
  l.push(a('Sifflet', 'Accessoires', 2));
  return l;
}
function coopCatalogueDepart_(sh) {
  if (CTX_ || sh.getLastRow() > 1) return;
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('COOP_CATALOGUE_OK')) return;        // déjà fait une fois : un catalogue vidé exprès reste vide
  sousVerrou_(function () {
    if (sh.getLastRow() > 1 || props.getProperty('COOP_CATALOGUE_OK')) return;
    ajouterLignes_(sh, coopCatalogueDefaut_().map(function (x) {
      return entetes_(sh).map(function (k) {
        return { 'ID': id_(), 'Article': x.article, 'Catégorie': x.categorie, 'Prix': x.prix, 'Devise': CONFIG.DEVISES[0], 'Disponible': 'Oui', 'Options': x.options }[k];
      }).map(function (v) { return v === undefined ? '' : v; });
    }));
    props.setProperty('COOP_CATALOGUE_OK', '1');
  });
}
/** Les options d'un article : [{nom, valeurs, defaut, progression}] (les badges / brevets viennent de la Progression). */
function coopOptions_(txt, badges) {
  return texte_(txt).split('|').map(function (g) {
    const i = g.indexOf(':');
    if (i < 1) return null;
    const nom = texte_(g.slice(0, i)), brut = g.slice(i + 1).split(',').map(texte_).filter(String);
    const prog = brut.some(function (v) { return norm_(v) === '@progression'; });
    let defaut = '';
    const valeurs = prog ? badges.slice() : brut.map(function (v) { if (v.charAt(0) === '*') { v = texte_(v.slice(1)); if (!defaut) defaut = v; } return v; }).filter(String);
    return nom && (valeurs.length || prog) ? { nom: nom, valeurs: valeurs, defaut: defaut, progression: prog } : null;
  }).filter(Boolean);
}
/** Les badges (Troupe) ou brevets (Meute) du catalogue de la Progression — lus seulement, rien n'est créé. */
function coopBadges_() {
  const cat = catalogue_();
  if (!cat) return [];
  try {
    const f = fichierParNom_(secretariat_(), CONFIG.FICHIERS.PROGRESSION, MimeType.GOOGLE_SHEETS);
    if (!f) return [];
    const sh = SpreadsheetApp.openById(f.getId()).getSheetByName(cat.feuille);
    if (!sh || sh.getLastRow() < 2) return [];
    const vus = {};
    return lignes_(sh).map(function (o) { return texte_(o[cat.colonne]); })
      .filter(function (n) { const k = norm_(n); if (!n || vus[k]) return false; vus[k] = true; return true; })
      .sort(function (a, b) { return a.localeCompare(b, 'fr'); });
  } catch (e) { return []; }
}
function coopOui_(v) { return v === true || /^(oui|yes|x|vrai|true|1|ok|✓|✔)$/i.test(texte_(v)); }
function coopStatut_(v) {
  const k = norm_(v);
  return k === norm_(COOP_STATUT.PAYEE) ? COOP_STATUT.PAYEE : k === norm_(COOP_STATUT.ACHETEE) ? COOP_STATUT.ACHETEE : COOP_STATUT.OUVERTE;
}
function coopDevise_(v) { const d = texte_(v).toUpperCase(); return CONFIG.DEVISES.indexOf(d) >= 0 ? d : CONFIG.DEVISES[0]; }
function coopNombre_(v) { const n = Number(v); return isFinite(n) ? n : 0; }

function lireCatalogue_(f, badges) {
  let b = badges;
  return lignes_(f.cat).filter(function (o) { return texte_(o['Article']); }).map(function (o) {
    const dispo = texte_(o['Disponible']), options = texte_(o['Options']);
    if (b === undefined && /@progression/i.test(options)) b = coopBadges_();
    return { id: String(o['ID']), article: texte_(o['Article']), categorie: texte_(o['Catégorie']), prix: arrondi_(coopNombre_(o['Prix'])),
      devise: coopDevise_(o['Devise']), disponible: dispo === '' || coopOui_(dispo), options: options, groupes: coopOptions_(options, b || []) };
  });
}
/** Toutes les commandes, de la plus récente à la plus ancienne, avec leurs membres et leurs articles. */
function lireCoop_(f) {
  const G = f.G;
  const grp = function (o) { return texte_(o[G.titre] !== undefined ? o[G.titre] : o['Groupe']); };
  const lignes = lignes_(f.lig).filter(function (o) { return texte_(o['Commande (ID)']) && texte_(o['Membre']) && texte_(o['Article']); });
  const pais = lignes_(f.pai).filter(function (o) { return texte_(o['Commande (ID)']) && texte_(o['Membre']); });
  return lignes_(f.cmd).filter(function (o) { return texte_(o['ID']) && Number(o['N°']) > 0; }).map(function (o) {
    const id = String(o['ID']);
    const parts = pais.filter(function (p) { return String(p['Commande (ID)']) === id; }).map(function (p) {
      const nom = texte_(p['Membre']);
      const l = lignes.filter(function (x) { return String(x['Commande (ID)']) === id && norm_(x['Membre']) === norm_(nom); }).map(function (x) {
        return { article: texte_(x['Article']), precision: texte_(x['Précision']), quantite: coopNombre_(x['Quantité']),
          prix: arrondi_(coopNombre_(x['Prix unitaire'])), montant: arrondi_(coopNombre_(x['Montant'])) };
      });
      return { id: String(p['ID']), membre: nom, groupe: grp(p), montant: arrondi_(coopNombre_(p['Montant'])), paye: coopOui_(p['Payé']),
        payeLe: dateIso_(p['Payé le']), entreeId: texte_(p['Entrée (ID)']), lignes: l };
    });
    return {
      id: id, num: Number(o['N°']), date: dateIso_(o['Date']), intitule: texte_(o['Intitulé']), devise: coopDevise_(o['Devise']),
      statut: coopStatut_(o['Statut']), total: arrondi_(coopNombre_(o['Total'])), acheteeLe: dateIso_(o['Achetée le']),
      depenseId: texte_(o['Dépense (ID)']), payeeLe: dateIso_(o['Payée le']), remarque: texte_(o['Remarque']),
      par: texte_(o['Ajouté par']), horodatage: dateHeure_(o['Horodatage']), participants: parts
    };
  }).sort(function (a, b) { return b.num - a.num; });
}
function reponseCoop_(f, caisse) {
  const m = servicesMembres_();
  const catalogue = lireCatalogue_(f), commandes = lireCoop_(f);
  commandes.forEach(function (c) { c.articles = coopArticles_(c, catalogue).map(function (a) { delete a.rang; return a; }); });
  const r = {
    commandes: commandes, catalogue: catalogue, membres: m.membres.map(function (x) { return { nom: x.nom, unite: x.unite }; }),
    periode: m.periode, groupe: f.G, devises: CONFIG.DEVISES, statuts: COOP_STATUT, lien: f.ss.getUrl(), dossier: f.dos.getUrl()
  };
  if (caisse) r.caisse = caisse;
  return r;
}
function coopTrouver_(f, id) {
  const c = lireCoop_(f).filter(function (x) { return x.id === String(id || ''); })[0];
  if (!c) throw new Error('Commande introuvable (supprimée entre-temps ?).');
  return c;
}
/** « Commande Coop n°4 — 14/10/2026 » : l'événement qui regroupe l'achat et les paiements dans la caisse. */
function coopEvenement_(c) {
  const d = dateVal_(c.date);
  return 'Commande Coop n°' + c.num + (d ? ' — ' + Utilities.formatDate(d, tz_(), 'dd/MM/yyyy') : '');
}
/** Remplace les lignes d'une commande (colonne « Commande (ID) ») par `nouvelles` ; id null : toute la feuille. */
function coopRemplacer_(sh, id, nouvelles) {
  const h = entetes_(sh), ic = h.indexOf('Commande (ID)');
  const n = Math.max(0, sh.getLastRow() - 1);
  const anciennes = n ? sh.getRange(2, 1, n, h.length).getValues() : [];
  // id null : tout est remplacé (catalogue) ; sinon seules les lignes de cette commande
  const garder = id === null ? [] : anciennes.filter(function (r) {
    return !r.every(function (v) { return String(v).trim() === ''; }) && String(r[ic]).trim() !== String(id);
  });
  const lignes = garder.concat(nouvelles.map(function (o) {
    return h.map(function (k) { return o[k] === undefined || o[k] === null ? '' : o[k]; });
  })).map(function (r) { return r.map(cellule_); });
  while (lignes.length < anciennes.length) lignes.push(h.map(function () { return ''; }));
  if (lignes.length) sh.getRange(2, 1, lignes.length, h.length).setValues(lignes);
}
/** Écrit dans la caisse (ajouts puis suppressions) ; renvoie les ID créés et la caisse à jour. */
function coopCaisse_(ajouts, suppressions) {
  const f = feuilleCaisse_();
  (suppressions || []).filter(String).forEach(function (id) { const o = trouver_(f.sh, id); if (o) f.sh.deleteRow(o._row); });
  const ids = (ajouts || []).map(function (op) {
    const o = opValider_(op);
    o['Événement'] = evenementExistant_(lireOperations_(f.sh), o['Événement']);
    o['ID'] = id_(); o['Ajouté par'] = qui_(); o['Horodatage'] = new Date();
    colorerOperation_(f.sh, ajouter_(f.sh, o), o['Nature']);
    return o['ID'];
  });
  const ops = lireOperations_(f.sh);
  ecrireResume_(f.ss, ops);
  return { ids: ids, caisse: reponseCaisse_(f, ops) };
}
function coopDetail_(p) {
  return p.lignes.map(function (l) { return l.quantite + ' × ' + l.article + (l.precision ? ' (' + l.precision + ')' : ''); }).join(', ').slice(0, 300);
}

/** Vérifie une commande saisie (sans rien écrire). */
function coopValider_(cmd) {
  cmd = cmd || {};
  const M = COOP.MAX, G = coopGroupe_();
  const date = dateVal_(cmd.date);
  if (!date) throw new Error('Choisissez la date de la commande.');
  const intitule = texte_(cmd.intitule).replace(/\s+/g, ' ');
  if (intitule.length > M.INTITULE) throw new Error('Intitulé : ' + M.INTITULE + ' caractères au plus.');
  const devise = texte_(cmd.devise).toUpperCase();
  if (CONFIG.DEVISES.indexOf(devise) < 0) throw new Error('Devise inconnue.');
  if (!Array.isArray(cmd.participants) || !cmd.participants.length) throw new Error('Choisissez au moins un membre.');
  if (cmd.participants.length > M.PARTICIPANTS) throw new Error(M.PARTICIPANTS + ' membres au plus par commande.');
  const vus = {};
  const participants = cmd.participants.map(function (p) {
    p = p || {};
    const membre = texte_(p.membre).replace(/\s+/g, ' ');
    if (!membre) throw new Error('Un membre n\'a pas de nom.');
    if (membre.length > M.NOM) throw new Error('Nom trop long : « ' + membre.slice(0, 30) + '… ».');
    if (vus[norm_(membre)]) throw new Error('« ' + membre + ' » apparaît deux fois dans la commande.');
    vus[norm_(membre)] = true;
    const groupe = G.unites.indexOf(texte_(p.groupe)) >= 0 ? texte_(p.groupe) : '';
    if (!Array.isArray(p.lignes) || !p.lignes.length) throw new Error('Ajoutez au moins un article pour ' + membre + '.');
    if (p.lignes.length > M.LIGNES) throw new Error(M.LIGNES + ' articles au plus par membre.');
    const lignes = p.lignes.map(function (l) {
      l = l || {};
      const article = texte_(l.article).replace(/\s+/g, ' ');
      if (!article) throw new Error('Choisissez l\'article de chaque ligne (' + membre + ').');
      if (article.length > M.ARTICLE) throw new Error('Nom d\'article trop long : « ' + article.slice(0, 30) + '… ».');
      const precision = texte_(l.precision).replace(/\s+/g, ' ');
      if (precision.length > M.PRECISION) throw new Error('Précision : ' + M.PRECISION + ' caractères au plus.');
      const q = Number(l.quantite);
      if (!(q >= 1 && q <= M.QTE && Math.floor(q) === q)) throw new Error('Quantité invalide pour « ' + article + ' » (' + membre + ') : un nombre entier de 1 à ' + M.QTE + '.');
      const prix = Number(l.prix);
      if (!isFinite(prix) || prix <= 0 || prix > 1e10) throw new Error('Prix invalide pour « ' + article + ' » (' + membre + ').');
      return { article: article, precision: precision, quantite: q, prix: arrondi_(prix), montant: arrondi_(q * arrondi_(prix)) };
    });
    const montant = arrondi_(lignes.reduce(function (s, l) { return s + l.montant; }, 0));
    return { membre: membre, groupe: groupe, lignes: lignes, montant: montant };
  });
  const total = arrondi_(participants.reduce(function (s, p) { return s + p.montant; }, 0));
  return { date: date, intitule: intitule, devise: devise, remarque: texte_(cmd.remarque).slice(0, M.REMARQUE), participants: participants, total: total };
}

function coopDonnees() {
  acces_('tresorier');
  return reponseCoop_(feuillesCoop_());
}

/** Nouvelle commande (sans id) ou modification d'une commande pas encore achetée. */
function coopEnregistrer(cmd) {
  acces_('tresorier');
  const v = coopValider_(cmd);
  return avecVerrou_(function () {
    const f = feuillesCoop_();
    let id = texte_(cmd && cmd.id), num;
    if (id) {
      const ex = coopTrouver_(f, id);
      if (ex.statut !== COOP_STATUT.OUVERTE) throw new Error('La commande n°' + ex.num + ' est déjà achetée : elle ne se modifie plus (annulez d\'abord l\'achat s\'il n\'y a encore aucun paiement).');
      num = ex.num;
      maj_(f.cmd, trouver_(f.cmd, id)._row, { 'Date': v.date, 'Intitulé': v.intitule, 'Devise': v.devise, 'Total': v.total, 'Remarque': v.remarque });
    } else {
      id = id_();
      num = lireCoop_(f).reduce(function (m, c) { return Math.max(m, c.num); }, 0) + 1;
      ajouter_(f.cmd, { 'ID': id, 'N°': num, 'Date': v.date, 'Intitulé': v.intitule, 'Devise': v.devise, 'Statut': COOP_STATUT.OUVERTE, 'Total': v.total,
        'Remarque': v.remarque, 'Ajouté par': qui_(), 'Horodatage': new Date() });
    }
    const G = f.G, lignes = [], pais = [];
    v.participants.forEach(function (p) {
      p.lignes.forEach(function (l) {
        const o = { 'ID': id_(), 'Commande (ID)': id, 'N°': num, 'Membre': p.membre, 'Article': l.article, 'Précision': l.precision, 'Quantité': l.quantite, 'Prix unitaire': l.prix, 'Montant': l.montant };
        o[G.titre] = p.groupe; lignes.push(o);
      });
      const o = { 'ID': id_(), 'Commande (ID)': id, 'N°': num, 'Membre': p.membre, 'Montant': p.montant, 'Payé': '', 'Payé le': '', 'Entrée (ID)': '' };
      o[G.titre] = p.groupe; pais.push(o);
    });
    coopRemplacer_(f.lig, id, lignes);
    coopRemplacer_(f.pai, id, pais);
    // un article « Autre » (absent du catalogue) y est ajouté avec son prix, pour les prochaines commandes
    const connus = {};
    lireCatalogue_(f, []).forEach(function (a) { connus[norm_(a.article) + '|' + a.devise] = true; });
    const ajoutes = [];
    v.participants.forEach(function (p) { p.lignes.forEach(function (l) {
      const k = norm_(l.article) + '|' + v.devise;
      if (connus[k]) return;
      connus[k] = true; ajoutes.push(l.article);
      ajouter_(f.cat, { 'ID': id_(), 'Article': l.article, 'Catégorie': 'Autre', 'Prix': l.prix, 'Devise': v.devise, 'Disponible': 'Oui', 'Options': '' });
    }); });
    const r = reponseCoop_(f);
    r.enregistree = id;
    r.ajoutes = ajoutes;
    return r;
  });
}

/** La commande a été achetée à la Coop : la dépense entre dans la caisse. */
function coopAcheter(id, date) {
  acces_('tresorier');
  const jour = texte_(date) || aujourdhuiIso_();
  if (!dateVal_(jour)) throw new Error('Date d\'achat invalide.');
  return avecVerrou_(function () {
    const f = feuillesCoop_();
    const c = coopTrouver_(f, id);
    if (c.statut !== COOP_STATUT.OUVERTE) throw new Error('La commande n°' + c.num + ' est déjà marquée comme achetée.');
    if (!c.participants.length || !(c.total > 0)) throw new Error('La commande n°' + c.num + ' est vide.');
    const nb = c.participants.reduce(function (s, p) { return s + p.lignes.reduce(function (t, l) { return t + l.quantite; }, 0); }, 0);
    const k = coopCaisse_([{ date: jour, nature: 'Dépense', cause: 'Commande Coop n°' + c.num + (c.intitule ? ' — ' + c.intitule : ''), journee: COOP.JOURNEE,
      evenement: coopEvenement_(c), categorie: COOP.CATEGORIE, montant: c.total, devise: c.devise,
      remarque: nb + ' article' + (nb > 1 ? 's' : '') + ' pour ' + c.participants.length + ' membre' + (c.participants.length > 1 ? 's' : '') + ' — en attente des paiements' }], []);
    try { maj_(f.cmd, trouver_(f.cmd, c.id)._row, { 'Statut': COOP_STATUT.ACHETEE, 'Achetée le': dateVal_(jour), 'Dépense (ID)': k.ids[0] }); }
    catch (e) { coopCaisse_([], k.ids); throw e; }
    return reponseCoop_(f, k.caisse);
  });
}

/** Annule l'achat (erreur de clic) tant que personne n'a payé : la dépense est retirée de la caisse. */
function coopAnnulerAchat(id) {
  acces_('tresorier');
  return avecVerrou_(function () {
    const f = feuillesCoop_();
    const c = coopTrouver_(f, id);
    if (c.statut === COOP_STATUT.OUVERTE) throw new Error('La commande n°' + c.num + ' n\'est pas encore achetée.');
    if (c.participants.some(function (p) { return p.paye; })) throw new Error('Des membres ont déjà payé : décochez d\'abord leurs paiements.');
    const k = coopCaisse_([], [c.depenseId]);
    maj_(f.cmd, trouver_(f.cmd, c.id)._row, { 'Statut': COOP_STATUT.OUVERTE, 'Achetée le': '', 'Dépense (ID)': '', 'Payée le': '' });
    return reponseCoop_(f, k.caisse);
  });
}

/** Un membre a payé (ou on décoche) : l'entrée est ajoutée (ou retirée) dans la caisse. */
function coopPayer(id, partId, paye, date) {
  acces_('tresorier');
  const jour = texte_(date) || aujourdhuiIso_();
  if (!dateVal_(jour)) throw new Error('Date de paiement invalide.');
  return avecVerrou_(function () {
    const f = feuillesCoop_();
    const c = coopTrouver_(f, id);
    if (c.statut === COOP_STATUT.OUVERTE) throw new Error('Marquez d\'abord la commande n°' + c.num + ' comme achetée.');
    const p = c.participants.filter(function (x) { return x.id === String(partId || ''); })[0];
    if (!p) throw new Error('Ce membre n\'est plus dans la commande : actualisez la page.');
    const rowP = trouver_(f.pai, p.id)._row, rowC = trouver_(f.cmd, c.id)._row;
    if (paye) {
      if (p.paye) return reponseCoop_(f);
      const k = coopCaisse_([{ date: jour, nature: 'Entrée', cause: 'Commande Coop n°' + c.num + ' — ' + p.membre, journee: COOP.JOURNEE,
        evenement: coopEvenement_(c), categorie: p.membre + (p.groupe ? ' (' + p.groupe + ')' : ''), montant: p.montant, devise: c.devise, remarque: coopDetail_(p) }], []);
      try {
        maj_(f.pai, rowP, { 'Payé': 'Oui', 'Payé le': dateVal_(jour), 'Entrée (ID)': k.ids[0] });
        const tous = c.participants.every(function (x) { return x.id === p.id || x.paye; });
        if (tous) maj_(f.cmd, rowC, { 'Statut': COOP_STATUT.PAYEE, 'Payée le': dateVal_(jour) });
      } catch (e) { coopCaisse_([], k.ids); throw e; }
      const r = reponseCoop_(f, k.caisse);
      r.soldee = c.participants.every(function (x) { return x.id === p.id || x.paye; });
      return r;
    }
    if (!p.paye) return reponseCoop_(f);
    const k = coopCaisse_([], [p.entreeId]);
    maj_(f.pai, rowP, { 'Payé': '', 'Payé le': '', 'Entrée (ID)': '' });
    if (c.statut === COOP_STATUT.PAYEE) maj_(f.cmd, rowC, { 'Statut': COOP_STATUT.ACHETEE, 'Payée le': '' });
    return reponseCoop_(f, k.caisse);
  });
}

/** Supprime une commande pas encore achetée. */
function coopSupprimer(id) {
  acces_('tresorier');
  return avecVerrou_(function () {
    const f = feuillesCoop_();
    const c = coopTrouver_(f, id);
    if (c.statut !== COOP_STATUT.OUVERTE) throw new Error('La commande n°' + c.num + ' est déjà achetée : elle reste dans l\'historique (annulez d\'abord l\'achat s\'il n\'y a encore aucun paiement).');
    f.cmd.deleteRow(trouver_(f.cmd, c.id)._row);
    coopRemplacer_(f.lig, c.id, []);
    coopRemplacer_(f.pai, c.id, []);
    return reponseCoop_(f);
  });
}

/** Le catalogue (articles et prix) : remplacé en entier. Les commandes déjà faites gardent leurs prix. */
function coopCatalogueEnregistrer(liste) {
  acces_('tresorier');
  if (!Array.isArray(liste)) throw new Error('Catalogue invalide.');
  if (liste.length > COOP.MAX.CATALOGUE) throw new Error(COOP.MAX.CATALOGUE + ' articles au plus.');
  const vus = {};
  const items = liste.filter(function (a) { return a && texte_(a.article); }).map(function (a) {
    const article = texte_(a.article).replace(/\s+/g, ' ');
    if (article.length > COOP.MAX.ARTICLE) throw new Error('Nom d\'article trop long : « ' + article.slice(0, 30) + '… ».');
    const devise = texte_(a.devise).toUpperCase();
    if (CONFIG.DEVISES.indexOf(devise) < 0) throw new Error('Devise inconnue pour « ' + article + ' ».');
    const k = norm_(article) + '|' + devise;
    if (vus[k]) throw new Error('« ' + article + ' » (' + devise + ') apparaît deux fois.');
    vus[k] = true;
    const prix = Number(a.prix);
    if (!isFinite(prix) || prix <= 0 || prix > 1e10) throw new Error('Prix invalide pour « ' + article + ' ».');
    const options = texte_(a.options).replace(/\s+/g, ' ');
    if (options.length > 600) throw new Error('Options de « ' + article + ' » : 600 caractères au plus.');
    if (options && !coopOptions_(options, ['x']).length) throw new Error('Options de « ' + article + ' » : écrivez par exemple « Taille: S, M, L | Couleur: Bleu, Rouge ».');
    return { 'ID': texte_(a.id) || id_(), 'Article': article, 'Catégorie': texte_(a.categorie).replace(/\s+/g, ' ').slice(0, 60), 'Prix': arrondi_(prix), 'Devise': devise,
      'Disponible': a.disponible === false ? 'Non' : 'Oui', 'Options': options };
  });
  return avecVerrou_(function () {
    const f = feuillesCoop_();
    coopRemplacer_(f.cat, null, items);
    return reponseCoop_(f);
  });
}

/** Le total de chaque article à acheter, détaillé par taille / couleur / badge (dans l'ordre du catalogue). */
function coopArticles_(c, catalogue) {
  const m = {}, ordre = [];
  c.participants.forEach(function (p) { p.lignes.forEach(function (l) {
    const ka = norm_(l.article);
    if (!m[ka]) { m[ka] = { article: l.article, index: {}, variantes: [], quantite: 0, montant: 0 }; ordre.push(ka); }
    const a = m[ka], kv = norm_(l.precision) + '|' + l.prix;
    if (!a.index[kv]) { a.index[kv] = { precision: l.precision, prix: l.prix, quantite: 0, montant: 0 }; a.variantes.push(a.index[kv]); }
    a.index[kv].quantite += l.quantite; a.index[kv].montant = arrondi_(a.index[kv].montant + l.montant);
    a.quantite += l.quantite; a.montant = arrondi_(a.montant + l.montant);
  }); });
  const cat = (catalogue || []).filter(function (x) { return x.devise === c.devise; });
  const item = function (n) { for (let i = 0; i < cat.length; i++) if (norm_(cat[i].article) === norm_(n)) return { i: i, a: cat[i] }; return { i: 9999, a: null }; };
  const cle = function (a, prec) {
    if (!a || !a.groupes.length) return texte_(prec);
    return String(prec || '').split(' · ').map(function (v, i) { const g = a.groupes[i], j = g ? g.valeurs.indexOf(v) : -1; return j < 0 ? 'zz' + v : ('00' + j).slice(-3); }).join('|');
  };
  return ordre.map(function (k) { const x = m[k], it = item(x.article);
    x.variantes.sort(function (u, v) { return cle(it.a, u.precision).localeCompare(cle(it.a, v.precision), 'fr', { numeric: true }) || u.prix - v.prix; });
    return { article: x.article, variantes: x.variantes, quantite: x.quantite, montant: x.montant, rang: it.i };
  }).sort(function (a, b) { return a.rang - b.rang || a.article.localeCompare(b.article, 'fr'); });
}

/* ---- Le bon de commande en PDF (Info › Tresorerie › Coop) ---- */
function coopMontant_(v, dev) {
  const n = Math.abs(Number(v) || 0), neg = Number(v) < 0 ? '− ' : '';
  const grouper = function (s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  if (dev === 'LBP') return neg + grouper(String(Math.round(n))) + ' L.L.';
  const p = n.toFixed(2).split('.');
  return neg + '$ ' + grouper(p[0]) + ',' + p[1];
}
function coopHtml_(c, G, catalogue) {
  const e = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]; }); };
  const m = function (v) { return coopMontant_(v, c.devise); };
  const jj = function (iso) { const d = dateVal_(iso); return d ? Utilities.formatDate(d, tz_(), 'dd/MM/yyyy') : ''; };
  const paye = c.participants.filter(function (p) { return p.paye; }).reduce(function (s, p) { return s + p.montant; }, 0);
  const reste = arrondi_(c.total - paye);
  const statut = c.statut === COOP_STATUT.PAYEE ? 'Payée et livrée' : c.statut === COOP_STATUT.ACHETEE ? 'Achetée — en attente des paiements' : 'En préparation';
  const couleurStatut = c.statut === COOP_STATUT.PAYEE ? '#1E7B45' : c.statut === COOP_STATUT.ACHETEE ? '#B7791F' : '#1E5AA0';
  const ordre = G.unites.slice();
  c.participants.forEach(function (p) { if (ordre.indexOf(p.groupe) < 0) ordre.push(p.groupe); });
  const groupes = ordre.map(function (g) {
    const l = c.participants.filter(function (p) { return p.groupe === g; }).sort(function (a, b) { return a.membre.localeCompare(b.membre, 'fr'); });
    return { nom: g || 'Autres', l: l, total: l.reduce(function (s, p) { return s + p.montant; }, 0), paye: l.filter(function (p) { return p.paye; }).reduce(function (s, p) { return s + p.montant; }, 0) };
  }).filter(function (x) { return x.l.length; });
  const nbArt = c.participants.reduce(function (s, p) { return s + p.lignes.reduce(function (t, l) { return t + l.quantite; }, 0); }, 0);
  const achete = c.statut !== COOP_STATUT.OUVERTE;
  let logo = '';
  try { logo = include('Logo').trim(); } catch (err) { logo = ''; }
  const css =
    '@page{size:A4;margin:14mm 13mm}' +
    'body{font-family:Arial,Helvetica,sans-serif;color:#1f2933;font-size:10pt;margin:0}' +
    'table{border-collapse:collapse;width:100%}' +
    '.ent td{vertical-align:middle}' +
    '.doc-t{font-size:19pt;font-weight:bold;color:#1E5AA0;letter-spacing:2px}' +
    '.doc-n{font-size:13pt;font-weight:bold;margin-top:4px}' +
    '.doc-s{font-size:9.5pt;color:#52606d;margin-top:3px}' +
    '.bande td{height:5px;padding:0}' +
    '.infos td{padding:8px 10px;border:1px solid #e4e7eb;background:#f8f9fb;font-size:9pt;color:#52606d;width:25%}' +
    '.infos b{display:block;font-size:11pt;color:#1f2933;margin-top:2px}' +
    'h2{font-size:11.5pt;color:#1E5AA0;margin:18px 0 6px;text-transform:uppercase;letter-spacing:1px}' +
    '.g th{background:#1E5AA0;color:#fff;font-size:9pt;text-align:left;padding:6px 8px}' +
    '.g td{padding:5px 8px;border-bottom:1px solid #e4e7eb;font-size:9.5pt}' +
    '.n,.g th.n{text-align:right;white-space:nowrap}' +
    '.c,.g th.c{text-align:center}' +
    '.tot td{font-weight:bold;background:#eef3fa;border-top:2px solid #1E5AA0}' +
    '.grp td{background:#f1f4f8;font-weight:bold;color:#1E5AA0;padding:7px 8px;border-top:8px solid #fff}' +
    '.mem td{font-weight:bold;padding-top:8px;border-bottom:1px solid #cbd2d9}' +
    '.it td{color:#3e4c59;font-size:9pt;padding:3px 8px 3px 22px;border-bottom:1px dotted #e4e7eb}' +
    '.ok{color:#1E7B45;font-weight:bold}.du{color:#C8161D;font-weight:bold}' +
    '.final td{padding:7px 10px;font-size:10.5pt}' +
    '.final .big td{font-size:13pt;font-weight:bold;background:#1E5AA0;color:#fff}' +
    '.pied{margin-top:22px;font-size:8pt;color:#7b8794;text-align:center;border-top:1px solid #e4e7eb;padding-top:8px}';
  let h = '<html><head><meta charset="utf-8"><style>' + css + '</style></head><body>';
  h += '<table class="ent"><tr><td style="width:46%"><img src="' + COOP_LOGO + '" style="width:190px"></td>' +
    '<td style="text-align:right"><div class="doc-t">BON DE COMMANDE</div><div class="doc-n">Commande Coop n°' + c.num + '</div>' +
    '<div class="doc-s">du ' + jj(c.date) + (c.intitule ? ' — ' + e(c.intitule) : '') + '</div>' +
    '<div class="doc-s"><b>' + e(REGLAGES.NOM) + '</b> · ' + e(REGLAGES.GROUPE) + '</div></td>' +
    (logo ? '<td style="width:62px;text-align:right"><img src="' + logo + '" style="width:56px"></td>' : '') + '</tr></table>';
  h += '<table class="bande" style="margin:10px 0 12px"><tr><td style="background:#1E5AA0"></td><td style="background:#E53530"></td><td style="background:#1E7339"></td><td style="background:#F4B13E"></td></tr></table>';
  h += '<table class="infos"><tr><td>Statut<b style="color:' + couleurStatut + '">' + statut + '</b></td><td>Membres<b>' + c.participants.length + '</b></td>' +
    '<td>Articles<b>' + nbArt + '</b></td><td>' + (achete ? 'Achetée le' : 'Devise') + '<b>' + (achete ? jj(c.acheteeLe) : (c.devise === 'LBP' ? 'Livres libanaises' : 'Dollars')) + '</b></td></tr></table>';
  h += '<h2>Montant par ' + e(G.nom) + '</h2><table class="g"><tr><th>' + e(G.titre) + '</th><th class="c">Membres</th><th class="n">À payer</th>' + (achete ? '<th class="n">Payé</th><th class="n">Reste</th>' : '') + '</tr>';
  groupes.forEach(function (x) {
    h += '<tr><td>' + e(x.nom) + '</td><td class="c">' + x.l.length + '</td><td class="n">' + m(x.total) + '</td>' +
      (achete ? '<td class="n">' + m(x.paye) + '</td><td class="n">' + (x.total - x.paye > 0.004 ? '<span class="du">' + m(x.total - x.paye) + '</span>' : '<span class="ok">Réglé</span>') + '</td>' : '') + '</tr>';
  });
  h += '<tr class="tot"><td>Total</td><td class="c">' + c.participants.length + '</td><td class="n">' + m(c.total) + '</td>' + (achete ? '<td class="n">' + m(paye) + '</td><td class="n">' + m(reste) + '</td>' : '') + '</tr></table>';
  // ce qu'il faut acheter à la Coop : le total de chaque article, par taille / couleur / badge
  const arts = coopArticles_(c, catalogue);
  h += '<h2>Articles à acheter</h2><table class="g"><tr><th style="width:34%">Article</th><th style="width:28%">Détail (taille, couleur…)</th><th class="c">Qté</th><th class="n">Prix unitaire</th><th class="n">Montant</th></tr>';
  arts.forEach(function (a) {
    const seul = a.variantes.length === 1 && !a.variantes[0].precision;
    if (seul) { h += '<tr class="mem"><td colspan="2">' + e(a.article) + '</td><td class="c">' + a.quantite + '</td><td class="n">' + m(a.variantes[0].prix) + '</td><td class="n">' + m(a.montant) + '</td></tr>'; return; }
    h += '<tr class="mem"><td colspan="2">' + e(a.article) + '</td><td class="c">' + a.quantite + '</td><td></td><td class="n">' + m(a.montant) + '</td></tr>';
    a.variantes.forEach(function (v) {
      h += '<tr class="it"><td></td><td>' + (v.precision ? e(v.precision) : '—') + '</td><td class="c">' + v.quantite + '</td><td class="n">' + m(v.prix) + '</td><td class="n">' + m(v.montant) + '</td></tr>';
    });
  });
  h += '<tr class="tot"><td colspan="2">Total — ' + arts.length + ' article' + (arts.length > 1 ? 's' : '') + ' différent' + (arts.length > 1 ? 's' : '') + '</td><td class="c">' + nbArt + '</td><td></td><td class="n">' + m(c.total) + '</td></tr></table>';
  h += '<h2>Détail par membre</h2><table class="g"><tr><th>Membre / article</th><th>Précision</th><th class="c">Qté</th><th class="n">Prix unitaire</th><th class="n">Montant</th></tr>';
  groupes.forEach(function (x) {
    h += '<tr class="grp"><td colspan="4">' + e(G.titre) + ' ' + e(x.nom) + ' — ' + x.l.length + ' membre' + (x.l.length > 1 ? 's' : '') + '</td><td class="n">' + m(x.total) + '</td></tr>';
    x.l.forEach(function (p) {
      h += '<tr class="mem"><td colspan="3">' + e(p.membre) + '</td><td class="n">' + (!achete ? '' : p.paye ? '<span class="ok">Payé' + (p.payeLe ? ' le ' + jj(p.payeLe) : '') + '</span>' : '<span class="du">À payer</span>') + '</td><td class="n">' + m(p.montant) + '</td></tr>';
      p.lignes.forEach(function (l) {
        h += '<tr class="it"><td>' + e(l.article) + '</td><td>' + e(l.precision) + '</td><td class="c">' + l.quantite + '</td><td class="n">' + m(l.prix) + '</td><td class="n">' + m(l.montant) + '</td></tr>';
      });
    });
  });
  h += '</table>';
  h += '<table class="final" style="margin-top:16px;width:55%;margin-left:45%">' +
    (achete ? '<tr><td>Payé par les membres</td><td class="n ok">' + m(paye) + '</td></tr><tr><td>Reste à percevoir</td><td class="n ' + (reste > 0.004 ? 'du' : 'ok') + '">' + m(reste) + '</td></tr>' : '') +
    '<tr class="big"><td>Total de la commande</td><td class="n">' + m(c.total) + '</td></tr></table>';
  if (c.remarque) h += '<p style="margin-top:14px;font-size:9pt;color:#52606d"><b>Remarque :</b> ' + e(c.remarque) + '</p>';
  h += '<div class="pied">Commande Coop n°' + c.num + ' · ' + e(REGLAGES.NOM) + ' — ' + e(REGLAGES.GROUPE) + ' · généré le ' + Utilities.formatDate(new Date(), tz_(), 'dd/MM/yyyy à HH:mm') + ' par ' + e(REGLAGES.NOM_APP) + '</div>';
  return h + '</body></html>';
}
/** Crée (ou remplace) le PDF du bon de commande ; renvoie son lien et son contenu (pour le télécharger). */
function coopPdf(id) {
  acces_('tresorier');
  return avecVerrou_(function () {
    const f = feuillesCoop_();
    const c = coopTrouver_(f, id);
    const nom = 'Commande Coop n°' + c.num + ' — ' + Utilities.formatDate(dateVal_(c.date) || new Date(), tz_(), 'dd-MM-yyyy');
    const pdf = Utilities.newBlob(coopHtml_(c, f.G, lireCatalogue_(f, [])), MimeType.HTML, nom + '.html').getAs(MimeType.PDF).setName(nom + '.pdf');
    const it = f.dos.getFilesByName(nom + '.pdf');
    while (it.hasNext()) { const x = it.next(); try { x.setTrashed(true); } catch (e) { /* déjà parti */ } }
    const fichier = f.dos.createFile(pdf);
    return { url: fichier.getUrl(), nom: nom + '.pdf', data: Utilities.base64Encode(pdf.getBytes()) };
  });
}

/* =====================================================================
 *  TRÉSORIER › COTISATION ANNUELLE (Troupe, Meute, Clan — la Maîtrise la suit en lecture seule)
 *  Un fichier à part : Info › Tresorerie › « Cotisations ». Chaque paiement est une entrée de la caisse,
 *  sous l'événement « Cotisation annuelle 2026-2027 ».
 * ===================================================================== */
const COTISATION = {
  MONTANT: 25,                 // montant par personne, proposé chaque année (modifiable dans l'application)
  DEVISE: 'USD',
  FICHIER: 'Cotisations',
  JOURNEE: 'Autre',            // type de journée des entrées dans la caisse
  CATEGORIE: 'Cotisation annuelle'
};
function cotisationActive_() {
  if (REGLAGES.MAITRISE && !CTX_) throw new Error('La cotisation annuelle se gère dans l\'application de chaque unité.');
}
function feuillesCotisation_() {
  const titre = cfgPres_().uniteTitre;
  const ss = classeur_(dossier_(info_(), CONFIG.DOSSIERS.TRESORERIE), COTISATION.FICHIER);
  const date = 'dd/mm/yyyy', mt = '#,##0.00';
  const mon = feuille_(ss, 'Montants', ['Année', 'Montant', 'Devise', 'Modifié par', 'Modifié le'], {
    largeurs: [100, 100, 70, 200, 140], formats: { 'Montant': mt, 'Modifié le': 'dd/mm/yyyy hh:mm' } });
  const exc = feuille_(ss, 'Exceptions', ['Année', 'Membre', titre, 'Montant dû', 'Raison', 'Modifié par', 'Modifié le'], {
    largeurs: [100, 200, 110, 100, 260, 200, 140], formats: { 'Montant dû': mt, 'Modifié le': 'dd/mm/yyyy hh:mm' } });
  const pai = feuille_(ss, 'Paiements', ['ID', 'Année', 'Membre', titre, 'Montant', 'Devise', 'Date', 'Entrée (ID)', 'Remarque', 'Ajouté par', 'Horodatage'], {
    largeurs: [80, 100, 200, 110, 95, 60, 95, 90, 220, 190, 135], cacherId: true, formats: { 'Montant': mt, 'Date': date, 'Horodatage': 'dd/mm/yyyy hh:mm' } });
  assurerIds_(pai);
  return { ss: ss, mon: mon, exc: exc, pai: pai, titre: titre };
}
function cotAnnee_(annee) {
  const a = texte_(annee);
  if (!a) return anneeScoute_();
  if (!/^\d{4}-\d{4}$/.test(a) || Number(a.slice(5)) !== Number(a.slice(0, 4)) + 1) throw new Error('Année scoute invalide (ex : 2026-2027).');
  return a;
}
/** Les membres de l'année scoute (tous les trimestres de la liste « Présences »), avec leur dernier sous-groupe. */
function cotMembresAnnee_(annee) {
  try {
    if (!fichierParNom_(secretariat_(), CONFIG.FICHIERS.PRESENCES, MimeType.GOOGLE_SHEETS)) return { membres: [], annees: [] };
    const f = feuillesPresences_();
    const tous = lignes_(f.mem).filter(function (o) { return texte_(o['Nom']) && /^\d{4}-\d{4}$/.test(texte_(o['Année'])); });
    const annees = {}, par = {};
    tous.forEach(function (o) {
      const a = texte_(o['Année']); annees[a] = true;
      if (a !== annee) return;
      const k = norm_(o['Nom']), t = Number(o['Trimestre']) || 0;
      if (!par[k] || t >= par[k].t) par[k] = { nom: texte_(o['Nom']), groupe: texte_(o[f.c.uniteTitre]), t: t };
    });
    return { membres: Object.keys(par).map(function (k) { return { nom: par[k].nom, groupe: par[k].groupe }; }), annees: Object.keys(annees) };
  } catch (e) { return { membres: [], annees: [] }; }
}
function cotEtat_(f, annee) {
  const lesM = lignes_(f.mon), lesE = lignes_(f.exc), lesP = lignes_(f.pai);
  const reg = lesM.filter(function (o) { return texte_(o['Année']) === annee; })[0];
  const montant = reg && Number(reg['Montant']) > 0 ? arrondi_(Number(reg['Montant'])) : COTISATION.MONTANT;
  const devise = reg && CONFIG.DEVISES.indexOf(texte_(reg['Devise']).toUpperCase()) >= 0 ? texte_(reg['Devise']).toUpperCase()
    : (CONFIG.DEVISES.indexOf(COTISATION.DEVISE) >= 0 ? COTISATION.DEVISE : CONFIG.DEVISES[0]);
  const exc = lesE.filter(function (o) { return texte_(o['Année']) === annee && texte_(o['Membre']) && texte_(o['Montant dû']) !== ''; });
  const pai = lesP.filter(function (o) { return texte_(o['Année']) === annee && texte_(o['Membre']) && Number(o['Montant']) > 0; });
  return { reg: reg || null, montant: montant, devise: devise, exc: exc, pai: pai, toutes: lesM.concat(lesE, lesP) };
}
/** Tout ce que l'écran « Cotisation annuelle » affiche pour une année. */
function cotReponse_(f, annee, caisse) {
  const e = cotEtat_(f, annee), L = cotMembresAnnee_(annee), titre = f.titre;
  const membres = {}, ordre = [];
  const ajouter = function (nom, groupe, ancien) {
    const k = norm_(nom);
    if (!membres[k]) { membres[k] = { nom: nom, groupe: groupe || '', ancien: !!ancien, exception: null, paiements: [] }; ordre.push(k); }
    return membres[k];
  };
  L.membres.forEach(function (m) { ajouter(m.nom, m.groupe, false); });
  e.exc.forEach(function (o) {
    const m = ajouter(texte_(o['Membre']), texte_(o[titre]), true);
    m.exception = { montant: arrondi_(Math.max(0, Number(o['Montant dû']) || 0)), raison: texte_(o['Raison']) };
  });
  e.pai.forEach(function (o) {
    const m = ajouter(texte_(o['Membre']), texte_(o[titre]), true);
    m.paiements.push({ id: String(o['ID']), montant: arrondi_(Number(o['Montant'])), date: dateIso_(o['Date']), remarque: texte_(o['Remarque']), par: texte_(o['Ajouté par']) });
  });
  const liste = ordre.map(function (k) {
    const m = membres[k];
    m.paiements.sort(function (a, b) { return a.date.localeCompare(b.date); });
    m.du = m.exception ? m.exception.montant : e.montant;
    m.paye = arrondi_(m.paiements.reduce(function (s, p) { return s + p.montant; }, 0));
    m.reste = arrondi_(Math.max(0, m.du - m.paye));
    m.statut = m.du === 0 && !m.paye ? 'dispense' : m.paye >= m.du - 0.004 ? 'ajour' : m.paye > 0 ? 'partiel' : 'rien';
    return m;
  }).sort(function (a, b) { return a.nom.localeCompare(b.nom, 'fr'); });
  const somme = function (cle) { return arrondi_(liste.reduce(function (s, m) { return s + m[cle]; }, 0)); };
  const annees = {}; annees[anneeScoute_()] = true; annees[annee] = true;
  L.annees.forEach(function (a) { annees[a] = true; });
  e.toutes.forEach(function (o) { const a = texte_(o['Année']); if (/^\d{4}-\d{4}$/.test(a)) annees[a] = true; });
  const r = {
    annee: annee, montant: e.montant, devise: e.devise, montantModifie: !!e.reg, membres: liste,
    totaux: { attendu: somme('du'), paye: somme('paye'), reste: somme('reste'), n: liste.length,
      ajour: liste.filter(function (m) { return m.statut === 'ajour'; }).length, partiel: liste.filter(function (m) { return m.statut === 'partiel'; }).length,
      rien: liste.filter(function (m) { return m.statut === 'rien'; }).length, dispense: liste.filter(function (m) { return m.statut === 'dispense'; }).length,
      exceptions: liste.filter(function (m) { return m.exception; }).length },
    annees: Object.keys(annees).sort().reverse(), groupe: { titre: titre, nom: cfgPres_().uniteNom, unites: cfgPres_().unites },
    devises: CONFIG.DEVISES, evenement: 'Cotisation annuelle ' + annee, lien: f.ss.getUrl ? f.ss.getUrl() : ''
  };
  if (caisse) r.caisse = caisse;
  return r;
}
function cotMembre_(f, annee, nom) {
  const r = cotReponse_(f, annee);
  const m = r.membres.filter(function (x) { return norm_(x.nom) === norm_(nom); })[0];
  if (!m) throw new Error('« ' + texte_(nom) + ' » n\'est pas dans la liste des membres de ' + annee + ' (Secrétaire › Présences).');
  return { r: r, m: m };
}

function cotisationDonnees(annee) {
  acces_('tresorier');
  cotisationActive_();
  const a = cotAnnee_(annee);
  return cotReponse_(feuillesCotisation_(), a);
}

/** Le montant par personne de l'année (et sa devise, tant que personne n'a payé). */
function cotisationMontant(annee, montant, devise) {
  acces_('tresorier');
  cotisationActive_();
  const a = cotAnnee_(annee), m = Number(montant), dev = texte_(devise).toUpperCase();
  if (!isFinite(m) || m <= 0 || m > 1e10) throw new Error('Le montant doit être un nombre positif.');
  if (CONFIG.DEVISES.indexOf(dev) < 0) throw new Error('Devise inconnue.');
  return avecVerrou_(function () {
    const f = feuillesCotisation_(), e = cotEtat_(f, a);
    if (dev !== e.devise && e.pai.length) throw new Error('Des membres ont déjà payé en ' + e.devise + ' : la devise ne peut plus changer cette année.');
    const o = { 'Année': a, 'Montant': arrondi_(m), 'Devise': dev, 'Modifié par': qui_(), 'Modifié le': new Date() };
    const ex = lignes_(f.mon).filter(function (x) { return texte_(x['Année']) === a; })[0];
    if (ex) maj_(f.mon, ex._row, o); else ajouter_(f.mon, o);
    return cotReponse_(f, a);
  });
}

/** Exception : un montant dû différent pour un membre (0 = dispensé) ; montant vide = l'exception est retirée. */
function cotisationException(annee, membre, montant, raison) {
  acces_('tresorier');
  cotisationActive_();
  const a = cotAnnee_(annee);
  const retirer = montant === null || montant === undefined || texte_(montant) === '';
  const m = retirer ? 0 : Number(montant);
  if (!retirer && (!isFinite(m) || m < 0 || m > 1e10)) throw new Error('Montant dû invalide (0 = dispensé).');
  const why = texte_(raison).replace(/\s+/g, ' ');
  if (why.length > 200) throw new Error('Raison : 200 caractères au plus.');
  return avecVerrou_(function () {
    const f = feuillesCotisation_();
    const x = cotMembre_(f, a, membre).m;
    const ex = lignes_(f.exc).filter(function (o) { return texte_(o['Année']) === a && norm_(o['Membre']) === norm_(x.nom); });
    if (retirer) { ex.map(function (o) { return o._row; }).sort(function (p, q) { return q - p; }).forEach(function (r) { f.exc.deleteRow(r); }); return cotReponse_(f, a); }
    const o = { 'Année': a, 'Membre': x.nom, 'Montant dû': arrondi_(m), 'Raison': why, 'Modifié par': qui_(), 'Modifié le': new Date() };
    o[f.titre] = x.groupe;
    if (ex.length) maj_(f.exc, ex[0]._row, o); else ajouter_(f.exc, o);
    return cotReponse_(f, a);
  });
}

/** Un paiement (complet ou partiel) : une entrée dans la caisse, sous « Cotisation annuelle <année> ». */
function cotisationPayer(annee, membre, montant, date, remarque) {
  acces_('tresorier');
  cotisationActive_();
  const a = cotAnnee_(annee), jour = texte_(date) || aujourdhuiIso_(), v = arrondi_(Number(montant));
  if (!dateVal_(jour)) throw new Error('Date de paiement invalide.');
  if (!isFinite(v) || v <= 0) throw new Error('Le montant payé doit être un nombre positif.');
  const rq = texte_(remarque).slice(0, 200);
  return avecVerrou_(function () {
    const f = feuillesCotisation_();
    const t = cotMembre_(f, a, membre), x = t.m, dev = t.r.devise;
    if (x.reste <= 0.004) throw new Error(x.nom + ' a déjà payé toute sa cotisation ' + a + '.');
    if (v > x.reste + 0.004) throw new Error(x.nom + ' ne doit plus que ' + coopMontant_(x.reste, dev) + ' (sur ' + coopMontant_(x.du, dev) + ').');
    const reste = arrondi_(x.reste - v);
    const k = coopCaisse_([{ date: jour, nature: 'Entrée', cause: 'Cotisation annuelle ' + a + ' — ' + x.nom, journee: COTISATION.JOURNEE,
      evenement: 'Cotisation annuelle ' + a, categorie: COTISATION.CATEGORIE, montant: v, devise: dev,
      remarque: (reste > 0.004 ? 'Paiement partiel — reste ' + coopMontant_(reste, dev) : (x.paye > 0 ? 'Fin de la cotisation' : 'Cotisation complète')) + (rq ? ' · ' + rq : '') }], []);
    try {
      const o = { 'ID': id_(), 'Année': a, 'Membre': x.nom, 'Montant': v, 'Devise': dev, 'Date': dateVal_(jour), 'Entrée (ID)': k.ids[0], 'Remarque': rq, 'Ajouté par': qui_(), 'Horodatage': new Date() };
      o[f.titre] = x.groupe;
      ajouter_(f.pai, o);
    } catch (e) { coopCaisse_([], k.ids); throw e; }
    const r = cotReponse_(f, a, k.caisse);
    r.soldee = reste <= 0.004;
    return r;
  });
}

/** Retire un paiement (erreur de saisie) : son entrée est retirée de la caisse. */
function cotisationSupprimerPaiement(id) {
  acces_('tresorier');
  cotisationActive_();
  return avecVerrou_(function () {
    const f = feuillesCotisation_();
    const o = trouver_(f.pai, id);
    if (!o) throw new Error('Paiement introuvable (déjà retiré ?).');
    const a = texte_(o['Année']);
    const k = coopCaisse_([], [texte_(o['Entrée (ID)'])]);
    f.pai.deleteRow(o._row);
    return cotReponse_(f, a, k.caisse);
  });
}

/* =====================================================================
 *  SECRÉTAIRE — Fiches d'activité
 * ===================================================================== */

function secretariatInfos() {
  acces_('secretaire');
  const dossier = secretariat_();
  const modele = modele_(dossier);
  const fiches = [];
  const it = dossier.getFilesByType(MimeType.GOOGLE_DOCS);
  while (it.hasNext()) {
    const f = it.next();
    if (f.isTrashed()) continue;
    const nf = norm_(f.getName());
    if (nf.indexOf('fiche activite') === 0 || nf.indexOf('ordre du jour') === 0 || nf.indexOf('compte rendu') === 0) {
      fiches.push({ nom: f.getName(), url: f.getUrl(), t: f.getDateCreated().getTime() });
    }
  }
  fiches.sort(function (a, b) { return b.t - a.t; });
  let materiels = [];
  try {
    materiels = inventaireDonnees('materiel').articles.map(function (a) {
      return { article: a.article, quantite: a.quantite, unite: a.unite, liste: a.liste };
    });
  } catch (e) { /* inventaire facultatif */ }
  return {
    modeleUrl: modele.getUrl(),
    modeleOdjUrl: (function () { if (!REGLAGES.ORDRE_DU_JOUR) return ''; const m = trouverModele_(dossier, CONFIG.FICHIERS.MODELE_ODJ); return m ? m.getUrl() : ''; })(),
    modeleCrUrl: (function () { if (!REGLAGES.COMPTE_RENDU) return ''; const m = trouverModele_(dossier, CONFIG.FICHIERS.MODELE_CR); return m ? m.getUrl() : ''; })(),
    modelesUrl: dossierModeles_(dossier).getUrl(),
    dossierUrl: dossier.getUrl(),
    fiches: fiches.map(function (f) {
      return { nom: f.nom, url: f.url, date: Utilities.formatDate(new Date(f.t), tz_(), 'dd/MM/yyyy HH:mm') };
    }),
    materiels: materiels
  };
}

function secretariatGenerer(f) {
  acces_('secretaire');
  f = f || {};
  const nom = texte_(f.nom);
  if (!nom) throw new Error('Indiquez le nom de l\'activité.');
  const d = dateVal_(f.date);
  if (!d) throw new Error('Indiquez la date de l\'activité.');
  if (!texte_(f.buts)) throw new Error('Indiquez au moins un but.');
  if (!texte_(f.explication)) throw new Error('Ajoutez l\'explication détaillée.');
  const photos = photosValider_(f.photos);

  const puces = function (txt) {
    return String(txt || '').split(/\r?\n/).map(function (s) { return s.trim(); })
      .filter(String).map(function (s) { return '•  ' + s.replace(/^[-•*]\s*/, ''); }).join('\n');
  };
  const materiels = (f.materiels || [])
    .filter(function (m) { return texte_(m.article); })
    .map(function (m) {
      const q = texte_(m.quantite);
      return '•  ' + texte_(m.article) + (q ? '  ×  ' + q : '');
    }).join('\n');

  const valeurs = {
    GROUPE: REGLAGES.NOM + ' · ' + REGLAGES.GROUPE,
    NOM_ACTIVITE: nom,
    DATE: dateFr_(d),
    BUTS: puces(f.buts),
    EXPLICATION: String(f.explication).trim(),
    ROTATION: f.rotation ? 'Oui' : 'Non',
    ROTATION_DETAILS: f.rotation ? (texte_(f.rotationDetails) || 'Rotation prévue (détails à compléter).') : 'Pas de rotation pour cette activité.',
    MATERIELS: materiels || 'Aucun matériel nécessaire.',
    REDIGE_PAR: qui_() || '—',
    DATE_CREATION: Utilities.formatDate(new Date(), tz_(), 'dd/MM/yyyy à HH:mm')
  };

  const dossier = secretariat_();
  const modele = modele_(dossier);
  const nomFichier = 'Fiche Activité — ' + nom + ' — ' + Utilities.formatDate(d, tz_(), 'dd-MM-yyyy');
  const copie = modele.makeCopy(nomFichier, dossier);
  const doc = DocumentApp.openById(copie.getId());
  // Photos : à la place de {{PHOTOS}} ; sinon (ancien modèle) juste après la partie « Matériels »
  const body = doc.getBody();
  const balise = body.findText(MOTIF_PHOTOS);
  const tm = balise ? null : body.findText('\\{\\{\\s*MATERIELS\\s*\\}\\}');
  const ancre = balise ? paragrapheDe_(balise.getElement()) : (tm ? paragrapheDe_(tm.getElement()) : null);
  [body, doc.getHeader(), doc.getFooter()].forEach(function (section) {
    if (!section) return;
    Object.keys(valeurs).forEach(function (cle) { remplacer_(section, cle, valeurs[cle]); });
  });
  let ancreFinale = ancre;
  if (!balise && photos.length) {
    // la liste des matériels peut occuper plusieurs paragraphes : on se place après sa dernière ligne
    const der = String(valeurs.MATERIELS).split('\n').pop().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let r = der ? body.findText(der) : null, garde = 0, dernier = null;
    while (r && garde++ < 30) { dernier = r; const suite = body.findText(der, r); if (!suite || suite.getElement() === r.getElement()) break; r = suite; }
    if (dernier) ancreFinale = paragrapheDe_(dernier.getElement()) || ancre;
  }
  insererPhotos_(body, photos, ancreFinale, !!balise);
  doc.saveAndClose();

  let pdfUrl = '';
  if (f.pdf) {
    const pdf = dossier.createFile(copie.getAs(MimeType.PDF)).setName(nomFichier + '.pdf');
    pdfUrl = pdf.getUrl();
  }
  return { nom: nomFichier, url: copie.getUrl(), pdfUrl: pdfUrl, photos: photos.length, infos: secretariatInfos() };
}

/* ---- Photos des fiches d'activité (réduites dans le navigateur avant l'envoi) ---- */
const PHOTOS = { MAX: 12, OCTETS_MAX: 6000000, TOTAL_MAX: 24000000, TYPES: ['image/jpeg', 'image/png'], HAUTEUR_MAX: 380 };
const MOTIF_PHOTOS = '\\{\\{\\s*PHOTOS\\s*\\}\\}';

/** [{data: base64, type, legende}] → [{blob, legende}] ; tout est vérifié avant de créer le document. */
function photosValider_(liste) {
  if (liste == null || liste === '') return [];
  if (!Array.isArray(liste)) throw new Error('Photos invalides.');
  if (liste.length > PHOTOS.MAX) throw new Error(PHOTOS.MAX + ' photos au plus par fiche.');
  let total = 0;
  return liste.map(function (ph, i) {
    const data = ph && typeof ph.data === 'string' ? ph.data.replace(/^data:[^,]*,/, '') : '';
    const type = ph && PHOTOS.TYPES.indexOf(ph.type) >= 0 ? ph.type : '';
    if (!data || !type || !/^[A-Za-z0-9+\/=\s]+$/.test(data)) throw new Error('La photo ' + (i + 1) + ' est illisible (JPEG ou PNG seulement).');
    if (data.length > PHOTOS.OCTETS_MAX) throw new Error('La photo ' + (i + 1) + ' est trop lourde.');
    total += data.length;
    if (total > PHOTOS.TOTAL_MAX) throw new Error('Les photos sont trop lourdes ensemble : enlevez-en quelques-unes.');
    let octets;
    try { octets = Utilities.base64Decode(data.replace(/\s+/g, '')); } catch (e) { throw new Error('La photo ' + (i + 1) + ' est illisible.'); }
    const legende = texte_(ph.legende).slice(0, 150);
    return { blob: Utilities.newBlob(octets, type, 'photo-' + (i + 1) + (type === 'image/png' ? '.png' : '.jpg')), legende: legende };
  });
}

/**
 * Place les photos dans la fiche, centrées, une par ligne, à la largeur de la page (hauteur limitée).
 * avecBalise : l'ancre est le paragraphe {{PHOTOS}} (remplacé) ; sinon un titre « Photos » est ajouté après l'ancre (ou à la fin).
 */
function insererPhotos_(body, photos, ancre, avecBalise) {
  const C = DocumentApp.HorizontalAlignment.CENTER;
  // la balise est-elle seule sur sa ligne ? (sinon on n'efface que la balise, pas le reste du texte)
  const seule = !!(ancre && avecBalise) && !texte_(ancre.getText().replace(new RegExp(MOTIF_PHOTOS, 'g'), ''));
  if (ancre && avecBalise && !seule) ancre.replaceText(MOTIF_PHOTOS, '');
  if (!photos.length) {
    if (seule) {
      // pas de photo : la balise et le titre « Photos » juste au-dessus disparaissent
      const parent = conteneur_(ancre), i = parent.getChildIndex(ancre);
      const avant = i > 0 ? parent.getChild(i - 1) : null;
      viderOuRetirer_(ancre);
      if (avant && avant.getType() === DocumentApp.ElementType.PARAGRAPH && norm_(avant.asParagraph().getText()) === 'photos') viderOuRetirer_(avant.asParagraph());
    }
    return;
  }
  let largeur = 468;
  try { largeur = Math.max(200, body.getPageWidth() - body.getMarginLeft() - body.getMarginRight()); } catch (e) { /* valeur par défaut */ }
  let parent, i;
  if (ancre && avecBalise) {
    parent = conteneur_(ancre); i = parent.getChildIndex(ancre) + 1;
    if (seule) ancre.setText('');
  } else {
    parent = ancre ? conteneur_(ancre) : body;
    i = ancre ? parent.getChildIndex(ancre) + 1 : parent.getNumChildren();
    const titre = i < parent.getNumChildren() ? parent.insertParagraph(i, 'Photos') : parent.appendParagraph('Photos');
    titre.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    i++;
  }
  const ajouter = function (texte) { const p = i < parent.getNumChildren() ? parent.insertParagraph(i, texte) : parent.appendParagraph(texte); i++; return p; };
  photos.forEach(function (ph) {
    const p = ajouter('');
    p.setAlignment(C);
    const img = p.appendInlineImage(ph.blob);
    const w = Number(img.getWidth()) || largeur, h = Number(img.getHeight()) || largeur * 0.75;
    const k = Math.min(1, largeur / w, PHOTOS.HAUTEUR_MAX / h);
    img.setWidth(Math.max(1, Math.round(w * k))).setHeight(Math.max(1, Math.round(h * k)));
    if (ph.legende) {
      const l = ajouter(ph.legende);
      l.setAlignment(C);
      l.editAsText().setItalic(true).setFontSize(10).setForegroundColor('#6B5B4B');
    }
  });
  if (seule) viderOuRetirer_(ancre);
}
/** Retire un paragraphe ; s'il ne peut pas l'être (dernier de la section), il est seulement vidé. */
function viderOuRetirer_(p) {
  try { p.removeFromParent(); } catch (e) { try { p.setText(''); } catch (e2) { /* rien */ } }
}

function remplacer_(section, cle, valeur) {
  const motif = '\\{\\{\\s*' + cle + '\\s*\\}\\}';
  const v = String(valeur == null || valeur === '' ? '—' : valeur).replace(/\r\n?/g, '\n');
  let r = section.findText(motif), garde = 0;
  while (r && garde++ < 50) {
    const t = r.getElement().asText();
    const debut = r.getStartOffset();
    t.deleteText(debut, r.getEndOffsetInclusive());
    t.insertText(debut, v);
    r = section.findText(motif);
  }
}

/** Le dossier « Secretariat › Modeles », où vivent les modèles. */
function dossierModeles_(secretariat) { return dossier_(secretariat, CONFIG.DOSSIERS.MODELES); }
/** Un modèle (Google Docs) : dans « Modeles » ; un modèle resté dans « Secretariat » (version précédente) y est rangé. Null s'il n'existe pas. */
function trouverModele_(secretariat, nom) {
  const mod = dossierModeles_(secretariat);
  let f = fichierParNom_(mod, nom, MimeType.GOOGLE_DOCS);
  if (f) return f;
  f = fichierParNom_(secretariat, nom, MimeType.GOOGLE_DOCS);
  if (f) { try { f.moveTo(mod); } catch (e) { console.warn('Modèle « ' + nom + ' » non déplacé : ' + e); } }
  return f;
}
function modele_(dossier) {
  return trouverModele_(dossier, CONFIG.FICHIERS.MODELE_FICHE) || creerModele_(dossierModeles_(dossier));
}

function creerModele_(dossier) {
  const doc = DocumentApp.create(CONFIG.FICHIERS.MODELE_FICHE);
  const fichier = DriveApp.getFileById(doc.getId());
  fichier.moveTo(dossier);
  const C = DocumentApp.HorizontalAlignment.CENTER;
  const vert = COULEUR_ENTETE, rouge = '#C8161D', bois = '#7A5230';
  const b = doc.getBody();
  b.setMarginTop(36).setMarginBottom(36).setMarginLeft(54).setMarginRight(54);

  const p0 = b.getParagraphs()[0];
  try { p0.appendInlineImage(logoBlob_()).setWidth(70).setHeight(73); } catch (e) { /* sans logo */ }
  p0.setAlignment(C);

  b.appendParagraph('{{GROUPE}}').setAlignment(C)
    .editAsText().setFontSize(11).setBold(true).setForegroundColor(bois);
  b.appendParagraph('FICHE D\'ACTIVITÉ').setHeading(DocumentApp.ParagraphHeading.TITLE).setAlignment(C)
    .editAsText().setForegroundColor(vert).setBold(true).setFontSize(26);

  const tab = b.appendTable([
    ['Nom de l\'activité', '{{NOM_ACTIVITE}}'],
    ['Date', '{{DATE}}'],
    ['Rotation', '{{ROTATION}}']
  ]);
  tab.setBorderColor('#D9C3A0');
  for (let i = 0; i < tab.getNumRows(); i++) {
    const c0 = tab.getCell(i, 0);
    c0.setBackgroundColor('#F3EBDD').setWidth(150);
    c0.editAsText().setBold(true).setForegroundColor(bois);
    tab.getCell(i, 1).editAsText().setFontSize(12);
  }
  tab.getCell(0, 1).editAsText().setBold(true);

  [['Buts', 'BUTS'], ['Explication détaillée', 'EXPLICATION'], ['Rotation', 'ROTATION_DETAILS'], ['Matériels', 'MATERIELS'], ['Photos', 'PHOTOS']]
    .forEach(function (s, i) {
      b.appendParagraph(s[0]).setHeading(DocumentApp.ParagraphHeading.HEADING2)
        .editAsText().setForegroundColor(i % 2 ? rouge : vert).setBold(true);
      b.appendParagraph('{{' + s[1] + '}}').setLineSpacing(1.2);
    });

  b.appendHorizontalRule();
  b.appendParagraph('Rédigé par {{REDIGE_PAR}} — généré le {{DATE_CREATION}}').setAlignment(C)
    .editAsText().setFontSize(9).setItalic(true).setForegroundColor('#8A7A68');
  doc.saveAndClose();
  return fichier;
}

/* =====================================================================
 *  SECRÉTAIRE — Ordre du jour (réunion du Clan ou d'une équipe)
 *  Modèle Google Docs « Modele - Ordre du jour » (créé automatiquement).
 *  Balises : {{DATE}} · {{LIGNE_EQUIPE}} · {{ETAPES}}
 * ===================================================================== */

/** Mesures relevées sur le document d'origine (en points, page Lettre 612 × 792). */
const ODJ = {
  MARGE: 17,                         // marges gauche / droite (le bâton touche la marge droite, comme sur l'original)
  HAUT: 4.7,                         // haut de page → haut de l'image de droite
  LOGO: { l: 78, h: 81, gauche: 32, haut: 4.5 },
  BATON: { l: 43, h: 95 },           // (tailles d'image en nombres entiers)
  COLONNES: [121.2, 335.6, 121.2],   // tableau d'en-tête, exactement la largeur entre les marges (texte centré sur la page)
  TITRES_HAUT: 32,                   // espace au-dessus de « GROUPE SCOUT EXEMPLE »
  PRIERE_ESPACE: [2, 13],            // lignes de la prière précédées d'un léger espace
  BLEU: '#365F91',
  NUM: 73.2,                         // retrait du numéro de la liste (depuis la marge) → 90,2 pt du bord de la page
  TEXTE: 91.2,                       // retrait du texte de la liste → 108,2 pt du bord de la page
  FIN: 26.2,                         // retrait à droite de la liste (le texte s'arrête où il s'arrêtait sur l'original)
  PRIERE: ['Seigneur Jésus,', 'Qui Vous offrez à nous comme la Route vivante,', 'Tout irradiée de la lumière d’en-Haut,',
    'Daignez-Vous joindre à nous', 'Sur le chemin de la vie,', 'Comme Vous le fîtes jadis,', 'Pour les Routiers', 'd’Emmaüs',
    'Donnez-nous part à Votre Esprit,', 'Afin que', 'Nous découvrions la voie de Votre plus grand Service', 'Et que,',
    'Nourris de l’Hostie,', 'Ce vrai pain des Routiers, nous cheminions allègrement,', 'Malgré fatigue et contradiction',
    'Sur le chemin qui mène droitement à la maison du Père', 'Ainsi soit-il']
};

function imageODJ_(cle) {
  let data;
  try { data = JSON.parse(include('ImagesODJ'))[cle]; } catch (err) { data = ''; }
  if (!data) throw new Error('Le fichier « ImagesODJ » manque dans le programme (ou a été collé incomplet). Ajoutez-le dans l’éditeur Apps Script (＋ › HTML › nom exact : ImagesODJ), puis publiez une nouvelle version.');
  return Utilities.newBlob(Utilities.base64Decode(data.substring(data.indexOf(',') + 1)), 'image/png', cle + '.png');
}

function modeleODJ_(dossier) {
  return trouverModele_(dossier, CONFIG.FICHIERS.MODELE_ODJ) || creerModeleODJ_(dossierModeles_(dossier));
}

function creerModeleODJ_(dossier) {
  const doc = DocumentApp.create(CONFIG.FICHIERS.MODELE_ODJ + ' (création en cours)');
  const fichier = DriveApp.getFileById(doc.getId());
  try {
    fichier.moveTo(dossier);
    const A = DocumentApp.HorizontalAlignment;
    const b = doc.getBody();
    b.setPageWidth(612).setPageHeight(792);
    b.setMarginTop(ODJ.HAUT).setMarginBottom(36).setMarginLeft(ODJ.MARGE).setMarginRight(ODJ.MARGE);

    const style = function (p, police, taille, couleur, gras, souligne) {
      const t = p.editAsText();
      t.setFontFamily(police).setFontSize(taille).setForegroundColor(couleur).setBold(!!gras).setUnderline(!!souligne);
      return p;
    };
    const para = function (p, alignement, interligne, avant, apres) {
      return p.setAlignment(alignement).setLineSpacing(interligne).setSpacingBefore(avant).setSpacingAfter(apres);
    };

    // ---- En-tête : logo à gauche · titres centrés · bâton à droite (tableau sans bordure) ----
    let t, titre = null;
    try {
      t = b.insertTable(0, [['', '', '']]);
      for (let i = b.getNumChildren() - 1; i >= 0 && !titre; i--) {
        if (b.getChild(i).getType() === DocumentApp.ElementType.PARAGRAPH) titre = b.getChild(i).asParagraph();
      }
    } catch (e) {
      // (secours) tableau après le premier paragraphe, réduit au minimum
      const p0 = b.getChild(0).asParagraph();
      p0.setLineSpacing(1).setSpacingBefore(0).setSpacingAfter(0);
      p0.setText(' '); p0.editAsText().setFontSize(1);
      t = b.appendTable([['', '', '']]);
    }
    if (!titre) titre = b.appendParagraph('');
    t.setBorderWidth(0);
    ODJ.COLONNES.forEach(function (l, i) { t.setColumnWidth(i, l); });
    const c0 = t.getCell(0, 0), c1 = t.getCell(0, 1), c2 = t.getCell(0, 2);
    [c0, c1, c2].forEach(function (c) { c.setPaddingTop(0).setPaddingBottom(0).setPaddingLeft(0).setPaddingRight(0); });

    // Positions verticales par l'espacement des paragraphes (et non la marge haute des cellules, commune à toute la ligne)
    c0.setPaddingLeft(ODJ.LOGO.gauche);
    const pLogo = para(c0.getChild(0).asParagraph(), A.LEFT, 1, ODJ.LOGO.haut, 0);
    pLogo.appendInlineImage(imageODJ_('logo')).setWidth(ODJ.LOGO.l).setHeight(ODJ.LOGO.h);

    const pBaton = para(c2.getChild(0).asParagraph(), A.RIGHT, 1, 0, 0);
    pBaton.appendInlineImage(imageODJ_('baton')).setWidth(ODJ.BATON.l).setHeight(ODJ.BATON.h);

    const l1 = c1.getChild(0).asParagraph();
    l1.setText('GROUPE SCOUT EXEMPLE');
    style(para(l1, A.CENTER, 1.15, ODJ.TITRES_HAUT, 0), 'Cambria', 13, ODJ.BLEU);
    style(para(c1.appendParagraph('CLAN EXEMPLE'), A.CENTER, 1.15, 0, 0), 'Cambria', 13, ODJ.BLEU);
    style(para(c1.appendParagraph('{{LIGNE_EQUIPE}}'), A.CENTER, 1.15, 0, 0), 'Cambria', 13, ODJ.BLEU);

    // ---- Prière Route ----
    titre.setText('Prière Route');
    style(para(titre, A.CENTER, 1, 20, 14), 'Cambria', 16, ODJ.BLEU, true, true);
    ODJ.PRIERE.forEach(function (ligne, i) {
      // (deux lignes sont légèrement plus espacées dans le document d'origine)
      style(para(b.appendParagraph(ligne), A.CENTER, 1, ODJ.PRIERE_ESPACE.indexOf(i) >= 0 ? 2.2 : 0, 0), 'Times New Roman', 12, '#000000');
    });

    // ---- Ordre de la réunion ----
    style(para(b.appendParagraph('Ordre de la réunion'), A.CENTER, 1.15, 24, 0), 'Cambria', 13, ODJ.BLEU);
    style(para(b.appendParagraph('DATE : {{DATE}}'), A.CENTER, 1.15, 0, 33), 'Cambria', 13, ODJ.BLEU);

    const li = b.appendListItem('{{ETAPES}}');
    li.setGlyphType(DocumentApp.GlyphType.NUMBER);
    li.setAlignment(A.LEFT).setLineSpacing(1.15).setSpacingBefore(0).setSpacingAfter(0);
    li.setIndentFirstLine(ODJ.NUM).setIndentStart(ODJ.TEXTE).setIndentEnd(ODJ.FIN);
    style(li, 'Times New Roman', 12, '#000000');

    doc.saveAndClose();
    fichier.setName(CONFIG.FICHIERS.MODELE_ODJ);
    return fichier;
  } catch (e) {
    try { fichier.setTrashed(true); } catch (e2) { /* rien */ }
    throw new Error('Création du modèle « Ordre du jour » impossible : ' + e.message);
  }
}

/**
 * Remplace une balise par un texte court (une seule ligne) en gardant exactement la mise en forme de la balise,
 * même quand la balise occupe toute la ligne : le texte est inséré À L'INTÉRIEUR de la balise, puis la balise est retirée.
 */
function remplacerGardeStyle_(section, cle, valeur) {
  const motif = '\\{\\{\\s*' + cle + '\\s*\\}\\}';
  const v = String(valeur).replace(/[\r\n]+/g, ' ');
  if (!v) return;
  let r = section.findText(motif), garde = 0;
  while (r && garde++ < 20) {
    const t = r.getElement().asText();
    const debut = r.getStartOffset(), fin = r.getEndOffsetInclusive();
    t.insertText(debut + 1, v);                              // juste après la première accolade « { »
    t.deleteText(debut + 1 + v.length, fin + v.length);      // le reste de la balise
    t.deleteText(debut, debut);                              // la première accolade
    r = section.findText(motif);
  }
}

/** Remonte d'un élément de texte jusqu'à son paragraphe (ou élément de liste). */
function paragrapheDe_(el) {
  const T = DocumentApp.ElementType;
  let e = el;
  for (let i = 0; i < 6 && e; i++) {
    const type = e.getType();
    if (type === T.PARAGRAPH) return e.asParagraph();
    if (type === T.LIST_ITEM) return e.asListItem();
    e = e.getParent();
  }
  return null;
}
/** Le conteneur d'un paragraphe, avec son vrai type (corps du document ou cellule de tableau). */
function conteneur_(p) {
  const e = p.getParent(), T = DocumentApp.ElementType, t = e.getType();
  return t === T.BODY_SECTION ? e.asBody() : t === T.TABLE_CELL ? e.asTableCell() : t === T.HEADER_SECTION ? e.asHeaderSection() : t === T.FOOTER_SECTION ? e.asFooterSection() : e;
}

/** Remplace la ligne {{ETAPES}} par la liste numérotée (avec sous-points à puces). */
function ecrireEtapesODJ_(corps, etapes) {
  const r = corps.findText('\\{\\{\\s*ETAPES\\s*\\}\\}');
  if (!r) throw new Error('La balise {{ETAPES}} est introuvable dans le modèle « ' + CONFIG.FICHIERS.MODELE_ODJ + ' ».');
  const balise = paragrapheDe_(r.getElement());
  if (!balise || balise.getText().replace(/\{\{\s*ETAPES\s*\}\}/, '').trim() !== '') {
    throw new Error('Dans le modèle « ' + CONFIG.FICHIERS.MODELE_ODJ + ' », la balise {{ETAPES}} doit être seule sur sa ligne.');
  }
  const parent = balise.getParent();
  let pos = parent.getChildIndex(balise);

  // Reprend la mise en forme de la ligne du modèle (pour que le modèle reste personnalisable)
  const lire = function (f, defaut) { try { const v = f(); return v === null || v === undefined ? defaut : v; } catch (e) { return defaut; } };
  const texte = balise.editAsText();
  const police = lire(function () { return texte.getFontFamily(0); }, 'Times New Roman');
  const taille = lire(function () { return texte.getFontSize(0); }, 12);
  const couleur = lire(function () { return texte.getForegroundColor(0); }, '#000000');
  const num = lire(function () { return balise.getIndentFirstLine(); }, ODJ.NUM);
  const txt = lire(function () { return balise.getIndentStart(); }, ODJ.TEXTE);
  const interligne = lire(function () { return balise.getLineSpacing(); }, 1.15);
  const fin = lire(function () { return balise.getIndentEnd(); }, ODJ.FIN);

  // 1re passe : liste, niveau et type de puce.  2e passe : retraits et police (appliqués en dernier, ils sont conservés).
  const structurer = function (li, niveau) {
    li.setNestingLevel(niveau);
    li.setGlyphType(niveau === 0 ? DocumentApp.GlyphType.NUMBER : DocumentApp.GlyphType.BULLET);
  };
  const mettreEnForme = function (li, niveau) {
    li.setAlignment(DocumentApp.HorizontalAlignment.LEFT).setLineSpacing(interligne).setSpacingBefore(0).setSpacingAfter(0);
    li.setIndentFirstLine(num + niveau * 36).setIndentStart(txt + niveau * 36).setIndentEnd(fin);
    const t = li.editAsText();
    t.setFontFamily(police).setFontSize(taille).setBold(false).setUnderline(false);
    if (couleur) t.setForegroundColor(couleur);
  };
  // Les lignes sont insérées APRÈS la balise (Docs interdit de supprimer le dernier paragraphe d'un document).
  const lignes = [];
  etapes.forEach(function (e) {
    lignes.push({ texte: e.texte, niveau: 0 });
    e.puces.forEach(function (p) { lignes.push({ texte: p, niveau: 1 }); });
  });
  const estListe = balise.getType() === DocumentApp.ElementType.LIST_ITEM;
  let premier = null;
  const faits = [];
  if (estListe) {            // la ligne du modèle devient la 1re étape : même liste, même numérotation
    premier = balise.asListItem();
    premier.setText(lignes[0].texte);
    structurer(premier, 0);
    faits.push({ li: premier, niveau: 0 });
  }
  lignes.slice(estListe ? 1 : 0).forEach(function (l) {
    pos++;
    const li = pos < parent.getNumChildren() ? parent.insertListItem(pos, l.texte) : parent.appendListItem(l.texte);
    if (premier) li.setListId(premier); else premier = li;
    structurer(li, l.niveau);
    faits.push({ li: li, niveau: l.niveau });
  });
  faits.forEach(function (x) { mettreEnForme(x.li, x.niveau); });
  if (!estListe) balise.removeFromParent();
}

function secretariatOrdreDuJour(f) {
  acces_('secretaire');
  if (!REGLAGES.ORDRE_DU_JOUR) throw new Error('L\'ordre du jour n\'est pas activé (RÉGLAGES › ORDRE_DU_JOUR).');
  f = f || {};
  const d = dateVal_(f.date);
  if (!d) throw new Error('Indiquez la date de la réunion.');
  const c = cfgPres_();
  const equipe = texte_(f.equipe);
  if (equipe && c.unites.indexOf(equipe) < 0) throw new Error(c.uniteTitre + ' inconnue : ' + equipe);
  const etapes = (f.etapes || []).map(function (e) {
    return { texte: texte_(e && e.texte), puces: ((e && e.puces) || []).map(texte_).filter(String) };
  }).filter(function (e) { return e.texte; });
  if (!etapes.length) throw new Error('Ajoutez au moins une étape.');

  // Date comme sur le document d'origine : jour-mois-année sans zéro (ex. 2-6-2026)
  const dateTxt = Number(Utilities.formatDate(d, tz_(), 'd')) + '-' + Number(Utilities.formatDate(d, tz_(), 'M')) + '-' + Utilities.formatDate(d, tz_(), 'yyyy');
  const dossier = secretariat_();
  const modele = modeleODJ_(dossier);
  const nomFichier = 'Ordre Du Jour Reunion ' + dateTxt + (equipe ? ' - Equipe ' + equipe : '');
  const copie = modele.makeCopy(nomFichier, dossier);
  try {
    const doc = DocumentApp.openById(copie.getId());
    const corps = doc.getBody();
    [corps, doc.getHeader(), doc.getFooter()].forEach(function (section) {
      if (!section) return;
      remplacerGardeStyle_(section, 'DATE', dateTxt);
      // Réunion d'équipe : « EQUIPE NOM » sous « CLAN EXEMPLE ». Réunion du Clan : la ligne est retirée.
      const motif = '\\{\\{\\s*LIGNE_EQUIPE\\s*\\}\\}';
      if (equipe) remplacerGardeStyle_(section, 'LIGNE_EQUIPE', 'EQUIPE ' + equipe.toUpperCase());
      else {
        let r = section.findText(motif), garde = 0;
        while (r && garde++ < 10) {
          const p = paragrapheDe_(r.getElement());
          let retire = false;
          if (p && p.getText().replace(/\{\{\s*LIGNE_EQUIPE\s*\}\}/, '').trim() === '') {
            try { p.removeFromParent(); retire = true; } catch (e) { /* dernier paragraphe d'une cellule : on vide le texte */ }
          }
          if (!retire) { const t = r.getElement().asText(); t.deleteText(r.getStartOffset(), r.getEndOffsetInclusive()); }
          r = section.findText(motif);
        }
      }
    });
    ecrireEtapesODJ_(corps, etapes);
    doc.saveAndClose();
  } catch (e) {
    try { copie.setTrashed(true); } catch (e2) { /* rien */ }
    throw e;
  }
  let pdfUrl = '';
  if (f.pdf) pdfUrl = dossier.createFile(copie.getAs(MimeType.PDF)).setName(nomFichier + '.pdf').getUrl();
  return { nom: nomFichier, url: copie.getUrl(), pdfUrl: pdfUrl, infos: secretariatInfos() };
}

/* =====================================================================
 *  SECRÉTAIRE — Compte rendu (réunion, camp ou journée)
 *  Modèle Google Docs « Modele - Compte rendu ».
 *  Le programme remplit la colonne de droite du tableau en reconnaissant le libellé
 *  de la colonne de gauche (Unité, But (s), Objectif (s), Date, …), complète le titre
 *  et écrit les remarques sous « Remarques: ». Aucune balise n'est nécessaire :
 *  vous pouvez donc déposer VOTRE document comme modèle (voir le guide).
 * ===================================================================== */

/** Mesures relevées sur le document d'origine (en points, page Lettre 612 × 792, marges de 72). */
const CR = {
  MARGE: 72, HAUT: 24, BAS: 72,
  ENTETE: [90, 313.7, 64.3],          // logo gauche · titre · logo droit (le titre garde exactement sa place d'origine)
  LOGO_GAUCHE: { l: 46, h: 48 }, LOGO_DROIT: { l: 56, h: 56 },
  TITRE_HAUT: 48,                     // le titre commence à 72 pt du haut de la page
  AVANT_TABLEAU: 15.7, AVANT_REMARQUES: 45.1,
  TABLEAU: [234, 234], BORDURE: 0.75, FOND: '#D9E2F3',
  POLICE: 'Times New Roman', TAILLE: 14, TAILLE_REMARQUES: 12,
  VALEURS: { taille: 12 },            // texte écrit dans la colonne de droite
  TITRE: 'Compte-Rendu',
  TITRE_MODELE: 'Compte-Rendu d’une réunion/camp',
  TYPES: { 'Réunion': 'd’une réunion', 'Camp': 'd’un camp', 'Journée': 'd’une journée' },
  // champ du formulaire · libellé dans le tableau · autres écritures acceptées du libellé
  LIGNES: [
    ['unite', 'Unité', []], ['buts', 'But (s)', ['but']], ['objectifs', 'Objectif (s)', ['objectif']],
    ['date', 'Date', ['dates']], ['heure', 'Heure', ['heures', 'horaire', 'horaires']], ['emplacement', 'Emplacement', ['lieu']],
    ['presence', 'Présence', ['presences']], ['odj', 'Ordre du jour', []], ['evaluation', 'Évaluation', []],
    ['annonces', 'Annonces au Conseil', ['annonces', 'annoncesauxconseils']]
  ]
};

/** « But (s) » → « buts », « Ordre du jour » → « ordredujour » (pour reconnaître les lignes du tableau). */
function cleCR_(texte) {
  return norm_(texte).replace(/\(\s*s\s*\)/g, 's').replace(/[^a-z]/g, '');
}

function modeleCR_(dossier) {
  const f = trouverModele_(dossier, CONFIG.FICHIERS.MODELE_CR);
  if (f) return f;
  // Un fichier Word ou PDF du même nom ne peut pas être rempli : on le dit clairement.
  const n = norm_(CONFIG.FICHIERS.MODELE_CR);
  [dossierModeles_(dossier), dossier].forEach(function (d) {
    const it = d.getFiles();
    while (it.hasNext()) {
      const x = it.next();
      if (!x.isTrashed() && norm_(x.getName().replace(/\.(docx|doc|odt|pdf|rtf)$/i, '')) === n) {
        throw new Error('Le fichier « ' + x.getName() + ' » n\'est pas un document Google Docs. Ouvrez-le dans Drive, faites ' +
          'Fichier › Enregistrer au format Google Docs, nommez la copie « ' + CONFIG.FICHIERS.MODELE_CR + ' », puis supprimez l\'original.');
      }
    }
  });
  return creerModeleCR_(dossierModeles_(dossier));
}

function imageCR_(cle) {
  return Utilities.newBlob(Utilities.base64Decode(CR_IMAGES[cle]), 'image/png', cle + '.png');
}

/** Crée le modèle : même mise en page que le document « Compte-Rendu Format » d'origine. */
function creerModeleCR_(dossier) {
  const doc = DocumentApp.create(CONFIG.FICHIERS.MODELE_CR + ' (création en cours)');
  const fichier = DriveApp.getFileById(doc.getId());
  try {
    fichier.moveTo(dossier);
    const A = DocumentApp.HorizontalAlignment, T = DocumentApp.ElementType;
    const b = doc.getBody();
    b.setPageWidth(612).setPageHeight(792);
    b.setMarginTop(CR.HAUT).setMarginBottom(CR.BAS).setMarginLeft(CR.MARGE).setMarginRight(CR.MARGE);
    const para = function (p, alignement, avant) {
      return p.setAlignment(alignement).setLineSpacing(1).setSpacingBefore(avant || 0).setSpacingAfter(0);
    };
    const style = function (p, taille, souligne) {
      p.editAsText().setFontFamily(CR.POLICE).setFontSize(taille).setForegroundColor('#000000').setBold(false).setItalic(false).setUnderline(!!souligne);
      return p;
    };

    // ---- En-tête : logo des Scouts du Liban · titre souligné · logo du groupe (tableau sans bordure) ----
    let t, suite = null;
    try {
      t = b.insertTable(0, [['', CR.TITRE_MODELE, '']]);
      for (let i = b.getNumChildren() - 1; i >= 0 && !suite; i--) {
        if (b.getChild(i).getType() === T.PARAGRAPH) suite = b.getChild(i).asParagraph();
      }
    } catch (e) {
      // (secours) tableau après le premier paragraphe, réduit au minimum
      const p0 = b.getChild(0).asParagraph();
      p0.setLineSpacing(1).setSpacingBefore(0).setSpacingAfter(0);
      p0.setText(' '); p0.editAsText().setFontSize(1);
      t = b.appendTable([['', CR.TITRE_MODELE, '']]);
    }
    if (!suite) {   // (secours) le paragraphe qui suit le tableau, s'il existe déjà
      const fin = b.getChild(b.getNumChildren() - 1);
      suite = fin.getType() === T.PARAGRAPH && b.getChildIndex(fin) > b.getChildIndex(t) ? fin.asParagraph() : b.appendParagraph('');
    }
    t.setBorderWidth(0);
    CR.ENTETE.forEach(function (l, i) { t.setColumnWidth(i, l); });
    const c0 = t.getCell(0, 0), c1 = t.getCell(0, 1), c2 = t.getCell(0, 2);
    [c0, c1, c2].forEach(function (c) { c.setPaddingTop(0).setPaddingBottom(0).setPaddingLeft(0).setPaddingRight(0); });
    para(c0.getChild(0).asParagraph(), A.LEFT).appendInlineImage(imageCR_('gauche')).setWidth(CR.LOGO_GAUCHE.l).setHeight(CR.LOGO_GAUCHE.h);
    para(c2.getChild(0).asParagraph(), A.RIGHT).appendInlineImage(imageCR_('droite')).setWidth(CR.LOGO_DROIT.l).setHeight(CR.LOGO_DROIT.h);
    style(para(c1.getChild(0).asParagraph(), A.CENTER, CR.TITRE_HAUT), CR.TAILLE, true);

    // ---- Espace, puis le tableau : libellés sur fond bleu clair à gauche, réponses à droite ----
    suite.setText('\u00A0');   // espace insécable : la ligne garde la hauteur d'une ligne de texte
    style(para(suite, A.LEFT, CR.AVANT_TABLEAU), CR.TAILLE, false);
    const tab = b.appendTable(CR.LIGNES.map(function (l) { return [l[1], '']; }));
    tab.setBorderWidth(CR.BORDURE).setBorderColor('#000000');
    CR.TABLEAU.forEach(function (l, i) { tab.setColumnWidth(i, l); });
    for (let r = 0; r < tab.getNumRows(); r++) {
      const g = tab.getCell(r, 0), d = tab.getCell(r, 1);
      [g, d].forEach(function (c) { c.setPaddingTop(0).setPaddingBottom(0).setPaddingLeft(5.4).setPaddingRight(5.4); });
      g.setBackgroundColor(CR.FOND);
      style(para(g.getChild(0).asParagraph(), A.CENTER), CR.TAILLE, false);
      para(d.getChild(0).asParagraph(), A.LEFT);
    }

    // ---- Remarques ----
    const dernier = b.getChild(b.getNumChildren() - 1);
    const rem = dernier.getType() === T.PARAGRAPH && dernier.asParagraph().getText() === '' ? dernier.asParagraph() : b.appendParagraph('');
    rem.setText('Remarques:');
    style(para(rem, A.LEFT, CR.AVANT_REMARQUES), CR.TAILLE_REMARQUES, true);

    doc.saveAndClose();
    fichier.setName(CONFIG.FICHIERS.MODELE_CR);
    return fichier;
  } catch (e) {
    try { fichier.setTrashed(true); } catch (e2) { /* rien */ }
    throw new Error('Création du modèle « Compte rendu » impossible : ' + e.message);
  }
}

/** Écrit une réponse (une ou plusieurs lignes) dans une cellule du tableau. */
function ecrireCelluleCR_(cellule, valeur, police) {
  const lignes = String(valeur).replace(/\r\n?/g, '\n').split('\n').map(function (s) { return s.replace(/\s+$/, ''); }).filter(function (s) { return s.trim() !== ''; });
  if (!lignes.length) return;
  const T = DocumentApp.ElementType;
  let i0 = -1;
  for (let i = 0; i < cellule.getNumChildren() && i0 < 0; i++) if (cellule.getChild(i).getType() === T.PARAGRAPH) i0 = i;
  const premier = i0 < 0 ? cellule.appendParagraph('') : cellule.getChild(i0).asParagraph();
  if (i0 < 0) i0 = cellule.getChildIndex(premier);
  const mettre = function (p) {
    p.setAlignment(DocumentApp.HorizontalAlignment.LEFT).setLineSpacing(1).setSpacingBefore(0).setSpacingAfter(0);
    p.editAsText().setFontFamily(police).setFontSize(CR.VALEURS.taille).setForegroundColor('#000000').setBold(false).setItalic(false).setUnderline(false);
  };
  premier.setText(lignes[0]);
  mettre(premier);
  for (let k = 1; k < lignes.length; k++) {
    const pos = i0 + k;
    mettre(pos < cellule.getNumChildren() ? cellule.insertParagraph(pos, lignes[k]) : cellule.appendParagraph(lignes[k]));
  }
}

/** Complète le titre : « Compte-Rendu d’une réunion », « d’un camp » ou « d’une journée ». */
function titreCR_(sections, type) {
  const suite = CR.TYPES[type];
  for (let s = 0; s < sections.length; s++) {
    if (sections[s] && sections[s].findText('\\{\\{\\s*TYPE\\s*\\}\\}')) { remplacerGardeStyle_(sections[s], 'TYPE', suite); return; }
  }
  for (let s = 0; s < sections.length; s++) {
    const r = sections[s] && sections[s].findText('[Cc][Oo][Mm][Pp][Tt][Ee][\\s\\-\u2011\u2013]?[Rr][Ee][Nn][Dd][Uu]');
    if (!r) continue;
    const t = r.getElement().asText();
    const fin = r.getEndOffsetInclusive(), texte = t.getText(), ajout = ' ' + suite;
    if (fin + 1 >= texte.length) { t.appendText(ajout); return; }
    // Ancienne suite du titre (« d’une réunion/camp ») : jusqu'à la fin de la ligne, sans toucher à ce qui suit une tabulation ou un retour à la ligne
    const ancienne = /^[^\t\r\n]*/.exec(texte.slice(fin + 1))[0];
    t.insertText(fin + 1, ajout);                          // même mise en forme que « Compte-Rendu »
    if (ancienne.length) t.deleteText(fin + 1 + ajout.length, fin + ajout.length + ancienne.length);
    return;
  }
  throw new Error('Le titre « ' + CR.TITRE + ' … » est introuvable dans le modèle « ' + CONFIG.FICHIERS.MODELE_CR + ' ».');
}

function secretariatCompteRendu(f) {
  acces_('secretaire');
  if (!REGLAGES.COMPTE_RENDU) throw new Error('Le compte rendu n\'est pas activé (RÉGLAGES › COMPTE_RENDU).');
  f = f || {};
  const type = texte_(f.type);
  if (!CR.TYPES[type]) throw new Error('Choisissez : ' + Object.keys(CR.TYPES).join(', ') + '.');
  const d = dateVal_(f.date);
  if (!d) throw new Error('Indiquez la date.');
  const fin = texte_(f.dateFin) ? dateVal_(f.dateFin) : null;
  if (texte_(f.dateFin) && !fin) throw new Error('Date de fin invalide.');
  if (fin && fin.getTime() < d.getTime()) throw new Error('La date de fin est avant la date de début.');
  const maj = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  const plusieursJours = fin && fin.getTime() > d.getTime();
  const valeurs = {
    unite: texte_(f.unite), buts: String(f.buts || ''), objectifs: String(f.objectifs || ''),
    date: plusieursJours ? 'Du ' + dateFr_(d) + ' au ' + dateFr_(fin) : maj(dateFr_(d)),
    heure: texte_(f.heure), emplacement: texte_(f.emplacement), presence: String(f.presence || ''),
    odj: String(f.odj || ''), evaluation: String(f.evaluation || ''), annonces: String(f.annonces || '')
  };
  const remarques = String(f.remarques || '').replace(/\r\n?/g, '\n').split('\n').map(function (s) { return s.replace(/\s+$/, ''); }).filter(function (s) { return s.trim() !== ''; });

  const dossier = secretariat_();
  const modele = modeleCR_(dossier);
  const nomFichier = 'Compte-Rendu — ' + type + ' — ' + Utilities.formatDate(d, tz_(), 'dd-MM-yyyy');
  const copie = modele.makeCopy(nomFichier, dossier);
  try {
    const doc = DocumentApp.openById(copie.getId());
    const corps = doc.getBody();
    titreCR_([corps, doc.getHeader()], type);

    // Tableau : la réponse va dans la cellule à droite du libellé reconnu
    const cles = Object.create(null);
    CR.LIGNES.forEach(function (l) { [l[1]].concat(l[2]).forEach(function (x) { cles[cleCR_(x)] = l[0]; }); });
    const ecrit = {};
    const tableaux = corps.getTables();
    for (let i = 0; i < tableaux.length; i++) {
      for (let r = 0; r < tableaux[i].getNumRows(); r++) {
        const ligne = tableaux[i].getRow(r);
        if (ligne.getNumCells() < 2) continue;
        const champ = cles[cleCR_(ligne.getCell(0).getText())];
        if (!champ || ecrit[champ]) continue;
        ecrit[champ] = true;
        let police = null;
        try { police = ligne.getCell(0).editAsText().getFontFamily(0); } catch (e) { police = null; }
        ecrireCelluleCR_(ligne.getCell(1), valeurs[champ], police || CR.POLICE);
      }
    }
    const oublies = CR.LIGNES.filter(function (l) { return !ecrit[l[0]] && String(valeurs[l[0]]).trim() !== ''; }).map(function (l) { return '« ' + l[1] + ' »'; });
    if (oublies.length) {
      throw new Error('Le modèle « ' + CONFIG.FICHIERS.MODELE_CR + ' » n\'a pas de ligne ' + oublies.join(', ') +
        ' dans son tableau. Remettez cette ligne (libellé à gauche, case vide à droite), ou supprimez le modèle pour qu\'il soit recréé.');
    }

    // Remarques : sous le paragraphe « Remarques: »
    if (remarques.length) {
      const T = DocumentApp.ElementType;
      let ancre = null;
      const paras = corps.getParagraphs();
      for (let i = 0; i < paras.length && !ancre; i++) {
        if (paras[i].getParent().getType() === T.BODY_SECTION && cleCR_(paras[i].getText()).indexOf('remarque') === 0) ancre = paras[i];
      }
      const A = DocumentApp.HorizontalAlignment;
      if (!ancre) {
        ancre = corps.appendParagraph('Remarques:');
        ancre.setAlignment(A.LEFT).setLineSpacing(1).setSpacingBefore(18).setSpacingAfter(0);
        ancre.editAsText().setFontFamily(CR.POLICE).setFontSize(CR.TAILLE_REMARQUES).setForegroundColor('#000000').setBold(false).setItalic(false).setUnderline(true);
      }
      let pos = corps.getChildIndex(ancre);
      remarques.forEach(function (texte, k) {
        pos++;
        const p = pos < corps.getNumChildren() ? corps.insertParagraph(pos, texte) : corps.appendParagraph(texte);
        p.setAlignment(A.LEFT).setLineSpacing(1.15).setSpacingBefore(k === 0 ? 6 : 0).setSpacingAfter(0);
        p.editAsText().setFontFamily(CR.POLICE).setFontSize(CR.TAILLE_REMARQUES).setForegroundColor('#000000').setBold(false).setItalic(false).setUnderline(false);
      });
    }
    doc.saveAndClose();
  } catch (e) {
    try { copie.setTrashed(true); } catch (e2) { /* rien */ }
    throw e;
  }
  let pdfUrl = '';
  if (f.pdf) pdfUrl = dossier.createFile(copie.getAs(MimeType.PDF)).setName(nomFichier + '.pdf').getUrl();
  return { nom: nomFichier, url: copie.getUrl(), pdfUrl: pdfUrl, infos: secretariatInfos() };
}

/* =====================================================================
 *  SECRÉTAIRE — Présences (par année scoute et par trimestre)
 *  Tout est piloté par les RÉGLAGES (UNITES, UNITE_NOM, ROLES, …).
 * ===================================================================== */

function cfgPres_() {
  const u = texte_(R_().UNITE_NOM) || 'patrouille';
  const brut = R_().ROLES || [];
  const parGroupe = !Array.isArray(brut) && typeof brut === 'object';
  const rolesPar = {};
  let roles = [];
  if (parGroupe) {
    Object.keys(brut).forEach(function (g) {
      rolesPar[g] = (Array.isArray(brut[g]) ? brut[g] : []).map(function (r) { return texte_(r).toUpperCase(); }).filter(String);
      rolesPar[g].forEach(function (r) { if (roles.indexOf(r) < 0) roles.push(r); });
    });
  } else roles = brut.map(function (r) { return texte_(r).toUpperCase(); }).filter(String);
  const unites = (R_().UNITES || R_().PATROUILLES || []).map(String);
  const restreintes = (Array.isArray(R_().REUNIONS_RESTREINTES) ? R_().REUNIONS_RESTREINTES : []).filter(function (x) {
    return x && texte_(x.nom) && Array.isArray(x.roles) && x.roles.length && unites.indexOf(texte_(x.nom)) < 0;
  }).map(function (x) { return { nom: texte_(x.nom), roles: x.roles.map(function (r) { return texte_(r).toUpperCase(); }) }; });
  return {
    unites: unites,
    uniteNom: u,
    unitePluriel: texte_(R_().UNITE_PLURIEL) || u + 's',
    uniteTitre: u.charAt(0).toUpperCase() + u.slice(1),
    roles: roles,                                                    // tous les rôles, dans l'ordre d'affichage
    rolesPar: parGroupe ? rolesPar : null,                           // (Maîtrise) rôles permis selon le sous-groupe
    uniques: parGroupe ? (R_().ROLES_UNIQUES || []).map(function (r) { return texte_(r).toUpperCase(); }) : roles.slice(),
    responsables: texte_(R_().NOM_RESPONSABLES),
    distinction: texte_(R_().DISTINCTION),
    parUnite: !!R_().REUNIONS_PAR_UNITE,
    restreintes: R_().REUNIONS_PAR_UNITE ? [] : restreintes,         // réunions où seuls certains rôles sont attendus
    ensemble: texte_(R_().NOM_ENSEMBLE) || 'Troupe',
    types: TYPES_ACTIVITE
  };
}
/** Rôles permis pour un membre de ce sous-groupe. */
function rolesDe_(c, unite) {
  if (!c.rolesPar) return c.roles;
  return Object.prototype.hasOwnProperty.call(c.rolesPar, unite) ? c.rolesPar[unite] : (c.rolesPar['*'] || []);
}
/** La réunion restreinte de ce nom (ex. « HP »), ou null. */
function restreinte_(c, pour) {
  const k = norm_(pour);
  return k ? (c.restreintes.filter(function (x) { return norm_(x.nom) === k; })[0] || null) : null;
}

function feuillesPresences_() {
  const c = cfgPres_();
  const ss = classeur_(secretariat_(), CONFIG.FICHIERS.PRESENCES);
  const mem = feuille_(ss, 'Membres', ['ID', 'Année', 'Trimestre', 'Nom', c.uniteTitre, 'Rôle'],
    { largeurs: [90, 100, 80, 220, 130, 90], cacherId: true });
  const reu = feuille_(ss, 'Reunions',
    ['ID', 'Année', 'Trimestre', 'Date', 'Type', 'Pour', 'Intitulé', 'Présents (ID)', 'Présents', 'Absents', 'Taux'], {
      largeurs: [90, 100, 80, 100, 90, 110, 200, 120, 420, 320, 70],
      formats: { 'Date': 'dd/mm/yyyy', 'Taux': '0%' }, cacherId: true
    });
  const tri = c.distinction ? feuille_(ss, 'Trimestres', ['Année', 'Trimestre', c.distinction], { largeurs: [100, 80, 160] }) : null;
  assurerIds_(mem); assurerIds_(reu);
  return { ss: ss, mem: mem, reu: reu, tri: tri, c: c };
}

function periode_(annee, trimestre) {
  const a = texte_(annee);
  if (!/^\d{4}-\d{4}$/.test(a)) throw new Error('Année scoute invalide (ex : 2026-2027).');
  const t = Number(trimestre);
  if ([1, 2, 3].indexOf(t) < 0) throw new Error('Trimestre invalide (1, 2 ou 3).');
  return { a: a, t: t };
}

function dansPeriode_(o, p) { return texte_(o['Année']) === p.a && Number(o['Trimestre']) === p.t; }

function lireMembres_(f, p) {
  return lignes_(f.mem).filter(function (o) { return dansPeriode_(o, p) && texte_(o['Nom']); }).map(function (o) {
    const r = texte_(o['Rôle']).toUpperCase(), unite = texte_(o[f.c.uniteTitre]);
    return { id: String(o['ID']), nom: texte_(o['Nom']), unite: unite, role: rolesDe_(f.c, unite).indexOf(r) >= 0 ? r : 'Membre' };
  });
}

function lireReunions_(f, p) {
  return lignes_(f.reu).filter(function (o) { return dansPeriode_(o, p) && dateIso_(o['Date']); }).map(function (o) {
    const brut = texte_(o['Pour']), rr = restreinte_(f.c, brut);
    const pour = rr ? rr.nom : brut;            // (« hp » tapé à la main dans le fichier reste la réunion HP)
    return {
      id: String(o['ID']), date: dateIso_(o['Date']), intitule: texte_(o['Intitulé']),
      type: f.c.types.indexOf(texte_(o['Type'])) >= 0 ? texte_(o['Type']) : 'Réunion',
      pour: pour && pour !== f.c.ensemble ? pour : '',
      presents: texte_(o['Présents (ID)']).split(',').map(function (x) { return x.trim(); }).filter(String)
    };
  }).sort(function (a, b) { return (a.date + a.pour).localeCompare(b.date + b.pour); });
}

function lireDistinction_(f, p) {
  if (!f.tri) return '';
  const o = lignes_(f.tri).filter(function (x) { return dansPeriode_(x, p); })[0];
  return o ? texte_(o[f.c.distinction]) : '';
}

/** Membres attendus à une réunion : toute l'unité, une seule équipe / patrouille, ou seulement certains rôles (réunion HP…). */
function attendus_(r, membres, c) {
  const rr = c ? restreinte_(c, r.pour) : null;
  if (rr) return membres.filter(function (m) { return rr.roles.indexOf(m.role) >= 0; });
  return r.pour ? membres.filter(function (m) { return m.unite === r.pour; }) : membres;
}

/** Remplace toutes les lignes d'une période par `nouvelles` (objets indexés par en-tête). */
function remplacerPeriode_(sh, p, nouvelles) {
  const h = entetes_(sh);
  const n = Math.max(0, sh.getLastRow() - 1);
  const anciennes = n ? sh.getRange(2, 1, n, h.length).getValues() : [];
  const ia = h.indexOf('Année'), it = h.indexOf('Trimestre');
  const garder = anciennes.filter(function (r) {
    const vide = r.every(function (v) { return String(v).trim() === ''; });
    return !vide && !(texte_(r[ia]) === p.a && Number(r[it]) === p.t);
  });
  const lignes = garder.concat(nouvelles.map(function (o) {
    return h.map(function (k) { return o[k] === undefined || o[k] === null ? '' : o[k]; });
  })).map(function (r) { return r.map(cellule_); });
  while (lignes.length < anciennes.length) lignes.push(h.map(function () { return ''; }));
  if (lignes.length) sh.getRange(2, 1, lignes.length, h.length).setValues(lignes);
}

function ecrireReunions_(f, p, reunions, membres) {
  const trier = function (l) { return l.sort(function (x, y) { return x.unite.localeCompare(y.unite) || x.nom.localeCompare(y.nom); }); };
  const nom = function (m) { return m.nom + (m.role !== 'Membre' ? ' (' + m.role + ')' : ''); };
  remplacerPeriode_(f.reu, p, reunions.map(function (r) {
    const att = attendus_(r, membres, f.c);
    const ok = {}; att.forEach(function (m) { ok[m.id] = true; });
    const pres = r.presents.filter(function (id) { return ok[id]; });
    const setP = {}; pres.forEach(function (id) { setP[id] = true; });
    // on garde la présence de tous les membres encore là (même s'ils ne sont plus attendus : un rôle peut revenir) ;
    // les colonnes lisibles et le taux, eux, suivent les membres attendus aujourd'hui
    const existe = {}; membres.forEach(function (m) { existe[m.id] = true; });
    const garde = r.presents.filter(function (id) { return existe[id]; });
    return {
      'ID': r.id, 'Année': p.a, 'Trimestre': p.t, 'Date': dateVal_(r.date), 'Type': r.type || 'Réunion',
      'Pour': r.pour || f.c.ensemble, 'Intitulé': r.intitule,
      'Présents (ID)': garde.join(','),
      'Présents': trier(att.filter(function (m) { return setP[m.id]; })).map(nom).join(', '),
      'Absents': trier(att.filter(function (m) { return !setP[m.id]; })).map(nom).join(', '),
      'Taux': att.length ? Math.round(pres.length / att.length * 1000) / 1000 : ''
    };
  }));
}

function presencesDonnees(annee, trimestre) {
  acces_('secretaire');
  const p = periode_(annee, trimestre);
  const f = feuillesPresences_();
  const tousM = lignes_(f.mem);
  const periodes = {};
  tousM.forEach(function (o) { if (texte_(o['Nom'])) { const k = texte_(o['Année']) + '|' + Number(o['Trimestre']); periodes[k] = (periodes[k] || 0) + 1; } });
  const annees = {};
  tousM.concat(lignes_(f.reu)).forEach(function (o) { const a = texte_(o['Année']); if (/^\d{4}-\d{4}$/.test(a)) annees[a] = true; });
  return {
    annee: p.a, trimestre: p.t, config: f.c,
    membres: lireMembres_(f, p),
    reunions: lireReunions_(f, p),
    distinction: lireDistinction_(f, p),
    periodes: Object.keys(periodes).map(function (k) { return { annee: k.split('|')[0], trimestre: Number(k.split('|')[1]), membres: periodes[k] }; }),
    annees: Object.keys(annees).sort(),
    lien: f.ss.getUrl()
  };
}

function presencesEnregistrerMembres(annee, trimestre, liste) {
  acces_('secretaire');
  const p = periode_(annee, trimestre), c = cfgPres_();
  const vus = {}, roles = {};
  const membres = (liste || []).filter(function (m) { return m && texte_(m.nom); }).map(function (m) {
    const nom = texte_(m.nom), k = norm_(nom);
    if (vus[k]) throw new Error('« ' + nom + ' » apparaît deux fois.');
    vus[k] = true;
    if (c.unites.indexOf(m.unite) < 0) throw new Error(c.uniteTitre + ' inconnue pour « ' + nom + ' ».');
    const role = rolesDe_(c, m.unite).indexOf(m.role) >= 0 ? m.role : 'Membre';
    if (role !== 'Membre' && c.uniques.indexOf(role) >= 0) {
      const cle = m.unite + '|' + role;
      if (roles[cle]) throw new Error(c.uniteTitre + ' ' + m.unite + ' : deux ' + role + ' (' + roles[cle] + ' et ' + nom + ').');
      roles[cle] = nom;
    }
    return { id: texte_(m.id), nom: nom, unite: m.unite, role: role };
  });
  return avecVerrou_(function () {
    const f = feuillesPresences_();
    const existants = {};
    lireMembres_(f, p).forEach(function (m) { existants[m.id] = m.nom; });
    const renommes = [];
    membres.forEach(function (m) {
      if (!m.id || !existants[m.id]) m.id = id_();
      else if (norm_(existants[m.id]) !== norm_(m.nom)) renommes.push({ ancien: existants[m.id], nouveau: m.nom });
    });
    try { renommerProgression_(renommes); } catch (e) { console.warn('Progression : ' + e); }
    remplacerPeriode_(f.mem, p, membres.map(function (m) {
      const o = { 'ID': m.id, 'Année': p.a, 'Trimestre': p.t, 'Nom': m.nom, 'Rôle': m.role };
      o[c.uniteTitre] = m.unite;
      return o;
    }));
    ecrireReunions_(f, p, lireReunions_(f, p), membres);
    return presencesDonnees(p.a, p.t);
  });
}

function presencesCopierMembres(annee, trimestre, deAnnee, deTrimestre) {
  acces_('secretaire');
  const p = periode_(annee, trimestre), src = periode_(deAnnee, deTrimestre);
  const f = feuillesPresences_();
  if (lireMembres_(f, p).length) throw new Error('Ce trimestre a déjà des membres.');
  const copie = lireMembres_(f, src).filter(function (m) { return f.c.unites.indexOf(m.unite) >= 0; })
    .map(function (m) { return { nom: m.nom, unite: m.unite, role: m.role }; });
  if (!copie.length) throw new Error('Aucun membre à copier.');
  return presencesEnregistrerMembres(p.a, p.t, copie);
}

function presencesEnregistrerReunion(annee, trimestre, r) {
  acces_('secretaire');
  const p = periode_(annee, trimestre), c = cfgPres_();
  r = r || {};
  if (!dateVal_(r.date)) throw new Error('Choisissez la date.');
  const rr = restreinte_(c, texte_(r.pour));
  if (texte_(r.pour) && !rr && !c.parUnite) throw new Error('Réunion inconnue : « ' + texte_(r.pour) + ' ».');
  const type = !rr && c.parUnite && c.types.indexOf(r.type) >= 0 ? r.type : 'Réunion';
  const pour = rr ? rr.nom : (c.parUnite && texte_(r.pour) ? texte_(r.pour) : '');
  if (pour && !rr && c.unites.indexOf(pour) < 0) throw new Error(c.uniteTitre + ' inconnue : ' + pour);
  return avecVerrou_(function () {
    const f = feuillesPresences_();
    const membres = lireMembres_(f, p);
    if (!membres.length) throw new Error('Ajoutez d\'abord les membres de ce trimestre (onglet « Membres »).');
    if (rr && !membres.some(function (m) { return rr.roles.indexOf(m.role) >= 0; })) throw new Error('Aucun ' + rr.roles.join(' / ') + ' désigné ce trimestre : choisissez-les dans « Membres ».');
    if (pour && !rr && !membres.some(function (m) { return m.unite === pour; })) throw new Error('Aucun membre dans ' + pour + ' ce trimestre.');
    const reunions = lireReunions_(f, p);
    let cible = r.id ? reunions.filter(function (x) { return x.id === r.id; })[0] : null;
    if (!cible) { cible = { id: id_() }; reunions.push(cible); }
    cible.date = r.date; cible.intitule = texte_(r.intitule); cible.type = type; cible.pour = pour;
    const att = {}; attendus_(cible, membres, f.c).forEach(function (m) { att[m.id] = true; });
    cible.presents = (r.presents || []).map(String).filter(function (id, i, arr) { return att[id] && arr.indexOf(id) === i; });
    ecrireReunions_(f, p, reunions.sort(function (a, b) { return (a.date + a.pour).localeCompare(b.date + b.pour); }), membres);
    const d = presencesDonnees(p.a, p.t);
    d.enregistree = cible.id;
    return d;
  });
}

function presencesSupprimerReunion(annee, trimestre, id) {
  acces_('secretaire');
  const p = periode_(annee, trimestre);
  return avecVerrou_(function () {
    const f = feuillesPresences_();
    const reunions = lireReunions_(f, p);
    const reste = reunions.filter(function (x) { return x.id !== id; });
    if (reste.length === reunions.length) throw new Error('Réunion introuvable.');
    ecrireReunions_(f, p, reste, lireMembres_(f, p));
    return presencesDonnees(p.a, p.t);
  });
}

/** Distinction du trimestre (ex. « Sizaine Akela ») : une seule unité, ou aucune. */
function presencesDefinirDistinction(annee, trimestre, unite) {
  acces_('secretaire');
  const p = periode_(annee, trimestre), c = cfgPres_();
  if (!c.distinction) throw new Error('Aucune distinction configurée.');
  unite = texte_(unite);
  if (unite && c.unites.indexOf(unite) < 0) throw new Error(c.uniteTitre + ' inconnue : ' + unite);
  return avecVerrou_(function () {
    const f = feuillesPresences_();
    const o = { 'Année': p.a, 'Trimestre': p.t };
    o[c.distinction] = unite;
    remplacerPeriode_(f.tri, p, unite ? [o] : []);
    return presencesDonnees(p.a, p.t);
  });
}

/* =====================================================================
 *  SECRÉTAIRE — Progression (Troupe : Promesse, 2e classe, 1re classe, Raider, Badges
 *                            Meute  : Promesse, 1ère étoile, 2ème étoile, Brevets de Capacité
 *                            Clan   : Jalons, Promesse, Adhésion, 1ère veille, Départ)
 *  Chaque case cochée est une ligne datée dans « Progression › Suivi ».
 *  Le suivi est lié au NOM du membre (il suit la personne d'un trimestre à l'autre).
 * ===================================================================== */

function feuillesProgression_() {
  const ss = classeur_(secretariat_(), CONFIG.FICHIERS.PROGRESSION);
  const suivi = feuille_(ss, 'Suivi', ['Membre', 'Clé', 'Élément', 'Date', 'Par'], {
    largeurs: [200, 110, 360, 100, 190], formats: { 'Date': 'dd/mm/yyyy' }
  });
  let badges = null;
  const cat = catalogue_();
  if (cat) {
    badges = cat.categories.length
      ? feuille_(ss, cat.feuille, ['ID', 'Catégorie', cat.colonne], { largeurs: [90, 220, 280], cacherId: true })
      : feuille_(ss, cat.feuille, ['ID', cat.colonne], { largeurs: [90, 320], cacherId: true });
    assurerIds_(badges);
  }
  return { ss: ss, suivi: suivi, badges: badges };
}

/** Membres du dernier trimestre qui a au moins une réunion (sinon le dernier trimestre avec des membres). */
function periodeProgression_(f) {
  const cle = function (o) { return texte_(o['Année']) + '|' + Number(o['Trimestre']); };
  const avecReu = {}, avecMem = {};
  lignes_(f.reu).forEach(function (o) { if (dateIso_(o['Date'])) avecReu[cle(o)] = true; });
  lignes_(f.mem).forEach(function (o) { if (texte_(o['Nom'])) avecMem[cle(o)] = true; });
  const trie = function (l) { return l.sort(function (a, b) { return a.localeCompare(b); }); };
  const k = trie(Object.keys(avecReu).filter(function (x) { return avecMem[x]; })).pop() || trie(Object.keys(avecMem)).pop();
  if (!k) return null;
  const p = { a: k.split('|')[0], t: Number(k.split('|')[1]) };
  return { annee: p.a, trimestre: p.t, avecReunion: !!avecReu[k], membres: lireMembres_(f, p) };
}

function lireBadges_(pf) {
  if (!pf.badges) return [];
  const cat = catalogue_(), cats = cat.categories;
  return lignes_(pf.badges).filter(function (o) { return texte_(o[cat.colonne]); }).map(function (o) {
    // (sans catégories, ou catégorie inconnue : le brevet reste visible, dans la liste générale)
    const c = cats.length ? texte_(o['Catégorie']) : '';
    return { id: String(o['ID']), categorie: c, nom: texte_(o[cat.colonne]) };
  }).sort(function (a, b) { return (cats.indexOf(a.categorie) - cats.indexOf(b.categorie)) || a.nom.localeCompare(b.nom, 'fr'); });
}

function progressionDonnees() {
  acces_('secretaire');
  const type = typeProgression_();
  if (!type) throw new Error('La progression n\'est pas activée (RÉGLAGES › PROGRESSION).');
  const f = feuillesPresences_();
  const per = periodeProgression_(f);
  const pf = feuillesProgression_();
  const suivi = Object.create(null);
  lignes_(pf.suivi).forEach(function (o) {
    const k = norm_(o['Membre']), c = texte_(o['Clé']);
    if (!k || !c) return;
    (suivi[k] = suivi[k] || {})[c] = dateIso_(o['Date']) || aujourdhuiIso_();
  });
  return {
    config: Object.assign({ type: type }, type === 'clan' ? PROGRESSION_CLAN : (type === 'meute' ? PROGRESSION_MEUTE : PROGRESSION)), unites: cfgPres_().unites, uniteNom: cfgPres_().uniteNom, unitePluriel: cfgPres_().unitePluriel,
    periode: per ? { annee: per.annee, trimestre: per.trimestre, avecReunion: per.avecReunion } : null,
    membres: per ? per.membres.map(function (m) { return Object.assign({ suivi: suivi[norm_(m.nom)] || {} }, m); }) : [],
    badges: lireBadges_(pf),
    lien: pf.ss.getUrl()
  };
}

function libelleProgression_(cle, badges) {
  if (typeProgression_() === 'clan') {
    const def = (/^E:/.test(cle) ? PROGRESSION_CLAN.ETAPES : PROGRESSION_CLAN.JALONS).filter(function (x) { return x.cle === cle.slice(2); })[0];
    return (/^E:/.test(cle) ? 'Étape — ' : 'Jalon — ') + (def ? def.nom : '?');
  }
  if (typeProgression_() === 'meute') {
    const mb = /^B:(.+)$/.exec(cle);
    if (mb) {
      const b = badges.filter(function (x) { return x.id === mb[1]; })[0];
      return PROGRESSION_MEUTE.BREVETS.singulier + ' — ' + (b ? (b.categorie ? b.categorie + ' — ' : '') + b.nom : '?');
    }
    const pg = pageMeute_(cle);
    return pg ? pg.partie.nom + ' — page ' + pg.page : cle;
  }
  const P = PROGRESSION;
  const nomEtape = function (def, n) { return (def.noms && def.noms[n - 1]) || ('Étape ' + n); };
  let m;
  if ((m = /^P:(\d+)$/.exec(cle))) return P.PROMESSE.nom + ' — ' + nomEtape(P.PROMESSE, Number(m[1]));
  if ((m = /^C2:(\d+)$/.exec(cle))) return P.DEUXIEME.nom + ' — ' + nomEtape(P.DEUXIEME, Number(m[1]));
  if ((m = /^C1C:(\d+)$/.exec(cle))) return P.PREMIERE.nom + ' — partie choisie : ' + (P.PREMIERE.parties[Number(m[1])] || '?');
  if ((m = /^C1:(\d+):(\d+)$/.exec(cle))) return P.PREMIERE.nom + ' — ' + (P.PREMIERE.parties[Number(m[1])] || '?') + ' — Étape ' + m[2];
  if (cle === 'RAIDER') return P.RAIDER.nom;
  if ((m = /^B:(.+)$/.exec(cle))) {
    const b = badges.filter(function (x) { return x.id === m[1]; })[0];
    return 'Badge — ' + (b ? b.categorie + ' — ' + b.nom : '?');
  }
  return cle;
}

/** Clé « P:7 », « E1:74 »… → { partie, page } si la page existe dans la partie, sinon null. */
function pageMeute_(cle) {
  const m = /^([A-Za-z0-9]+):(\d+)$/.exec(cle);
  if (!m) return null;
  const partie = PROGRESSION_MEUTE.PARTIES.filter(function (x) { return x.cle === m[1]; })[0];
  if (!partie || partie.pages.map(Number).indexOf(Number(m[2])) < 0 || String(Number(m[2])) !== m[2]) return null;
  return { partie: partie, page: Number(m[2]) };
}

function cleValide_(cle) {
  if (typeProgression_() === 'meute') return /^B:[A-Za-z0-9]+$/.test(cle) || !!pageMeute_(cle);
  if (typeProgression_() === 'clan') {
    const existe = function (l) { return l.some(function (x) { return x.cle === cle.slice(2); }); };
    return (/^E:/.test(cle) && existe(PROGRESSION_CLAN.ETAPES)) || (/^J:/.test(cle) && existe(PROGRESSION_CLAN.JALONS));
  }
  const P = PROGRESSION;
  let m;
  if ((m = /^P:(\d+)$/.exec(cle))) return Number(m[1]) >= 1 && Number(m[1]) <= P.PROMESSE.etapes;
  if ((m = /^C2:(\d+)$/.exec(cle))) return Number(m[1]) >= 1 && Number(m[1]) <= P.DEUXIEME.etapes;
  if ((m = /^C1C:(\d+)$/.exec(cle))) return Number(m[1]) < P.PREMIERE.parties.length;
  if ((m = /^C1:(\d+):(\d+)$/.exec(cle))) return Number(m[1]) < P.PREMIERE.parties.length && Number(m[2]) >= 1 && Number(m[2]) <= P.PREMIERE.etapesParPartie;
  return cle === 'RAIDER' || /^B:[A-Za-z0-9]+$/.test(cle);
}

/** changements : [{nom, cle, coche, date}] — enregistrés en une fois. */
function progressionEnregistrer(changements) {
  acces_('secretaire');
  changements = (changements || []).filter(function (c) { return c && texte_(c.nom) && cleValide_(texte_(c.cle)); });
  if (!changements.length) return { ok: true, n: 0 };
  return avecVerrou_(function () {
    const pf = feuillesProgression_();
    const badges = lireBadges_(pf);
    const h = entetes_(pf.suivi);
    const col = function (k) { return h.indexOf(k); };
    const n = Math.max(0, pf.suivi.getLastRow() - 1);
    const anciennes = n ? pf.suivi.getRange(2, 1, n, h.length).getValues() : [];
    const lignes = anciennes.filter(function (r) { return String(r[col('Membre')]).trim() !== ''; });
    const index = function () { const ix = {}; lignes.forEach(function (r, i) { ix[norm_(r[col('Membre')]) + '§' + texte_(r[col('Clé')])] = i; }); return ix; };
    const par = qui_();
    changements.forEach(function (c) {
      const cle = texte_(c.cle), k = norm_(c.nom) + '§' + cle, ix = index();
      if (c.coche) {
        const row = h.map(function () { return ''; });
        row[col('Membre')] = texte_(c.nom); row[col('Clé')] = cle; row[col('Élément')] = libelleProgression_(cle, badges);
        row[col('Date')] = dateVal_(c.date) || dateVal_(aujourdhuiIso_()); row[col('Par')] = par;
        if (ix[k] === undefined) lignes.push(row); else lignes[ix[k]] = row;
      } else if (ix[k] !== undefined) {
        lignes.splice(ix[k], 1);
      }
    });
    lignes.sort(function (a, b) { return String(a[col('Membre')]).localeCompare(String(b[col('Membre')])) || String(a[col('Clé')]).localeCompare(String(b[col('Clé')])); });
    const sortie = lignes.map(function (r) { return r.map(cellule_); });
    while (sortie.length < anciennes.length) sortie.push(h.map(function () { return ''; }));
    if (sortie.length) pf.suivi.getRange(2, 1, sortie.length, h.length).setValues(sortie);
    return { ok: true, n: changements.length };
  });
}

function progressionBadgeEnregistrer(b) {
  acces_('secretaire');
  const C = catalogue_();
  if (!C) throw new Error('Les badges ne sont pas utilisés dans cette version.');
  b = b || {};
  const nom = texte_(b.nom), cat = C.categories.length ? texte_(b.categorie) : '';
  if (!nom) throw new Error('Donnez un nom au ' + C.mot + '.');
  if (C.categories.length && C.categories.indexOf(cat) < 0) throw new Error('Catégorie inconnue.');
  return avecVerrou_(function () {
    const pf = feuillesProgression_();
    const ex = lireBadges_(pf);
    if (ex.some(function (x) { return x.id !== b.id && x.categorie === cat && norm_(x.nom) === norm_(nom); })) throw new Error(C.ce + ' existe déjà' + (cat ? ' dans « ' + cat + ' »' : '') + '.');
    const o = b.id ? trouver_(pf.badges, b.id) : null;
    const ligne = {}; ligne[C.colonne] = nom;
    if (C.categories.length) ligne['Catégorie'] = cat;
    if (o) maj_(pf.badges, o._row, ligne);
    else { ligne['ID'] = id_(); ajouter_(pf.badges, ligne); }
    return { badges: lireBadges_(pf) };
  });
}

function progressionBadgeSupprimer(id) {
  acces_('secretaire');
  const C = catalogue_();
  if (!C) throw new Error('Les badges ne sont pas utilisés dans cette version.');
  return avecVerrou_(function () {
    const pf = feuillesProgression_();
    const o = trouver_(pf.badges, id);
    if (!o) throw new Error(C.Mot + ' introuvable.');
    pf.badges.deleteRow(o._row);
    // retire aussi les cases cochées de ce badge
    const h = entetes_(pf.suivi), n = Math.max(0, pf.suivi.getLastRow() - 1);
    if (n) {
      const vals = pf.suivi.getRange(2, 1, n, h.length).getValues();
      const reste = vals.filter(function (r) { return texte_(r[h.indexOf('Clé')]) !== 'B:' + id && String(r[0]).trim() !== ''; }).map(function (r) { return r.map(cellule_); });
      while (reste.length < vals.length) reste.push(h.map(function () { return ''; }));
      pf.suivi.getRange(2, 1, reste.length, h.length).setValues(reste);
    }
    return { badges: lireBadges_(pf) };
  });
}

/** Quand un membre est renommé dans « Membres », son suivi le suit. */
function renommerProgression_(paires) {
  if (!typeProgression_() || !paires.length) return;
  const pf = feuillesProgression_();
  const h = entetes_(pf.suivi), c = h.indexOf('Membre'), n = Math.max(0, pf.suivi.getLastRow() - 1);
  if (!n || c < 0) return;
  const r = pf.suivi.getRange(2, c + 1, n, 1), vals = r.getValues();
  let change = false;
  paires.forEach(function (p) {
    vals.forEach(function (v) { if (norm_(v[0]) === norm_(p.ancien)) { v[0] = p.nouveau; change = true; } });
  });
  if (change) r.setValues(vals);
}

/* =====================================================================
 *  CUISINIER — Recettes
 * ===================================================================== */

const R_ENTETES = ['ID', 'Nom', 'Catégorie', 'Mode de cuisson', 'Personnes', 'Temps (min)',
  'Ingrédients', 'Étapes', 'Astuces', 'Ajoutée par', 'Date', 'Données'];

function feuilleRecettes_() {
  const ss = classeur_(dossier_(info_(), CONFIG.DOSSIERS.CUISINE), CONFIG.FICHIERS.RECETTES);
  const sh = feuille_(ss, 'Recettes', R_ENTETES, {
    largeurs: [80, 200, 130, 120, 90, 90, 280, 380, 220, 180, 100, 80],
    formats: { 'Date': 'dd/mm/yyyy' },
    cacherId: true
  });
  assurerIds_(sh);
  return { ss: ss, sh: sh };
}

function lireRecettes_(sh) {
  return lignes_(sh).filter(function (o) { return texte_(o['Nom']); }).map(function (o) {
    let ingr = [];
    try { ingr = JSON.parse(o['Données'] || '[]'); } catch (e) { ingr = []; }
    ingr = Array.isArray(ingr) ? ingr.filter(function (x) { return x && typeof x === 'object'; }) : [];
    if (!ingr.length && texte_(o['Ingrédients'])) {
      ingr = String(o['Ingrédients']).split(/\r?\n/).filter(function (s) { return s.trim(); })
        .map(function (s) { return { q: '', u: '', n: s.trim() }; });
    }
    return {
      id: String(o['ID']),
      nom: texte_(o['Nom']),
      categorie: texte_(o['Catégorie']) || 'Autre',
      cuisson: texte_(o['Mode de cuisson']),
      personnes: Math.max(1, Number(o['Personnes']) || 1),
      temps: Number(o['Temps (min)']) || 0,
      ingredients: ingr,
      etapes: String(o['Étapes'] || '').split(/\r?\n/).map(function (s) { return s.replace(/^\s*\d+[.)]\s*/, '').trim(); }).filter(String),
      astuces: texte_(o['Astuces']),
      par: texte_(o['Ajoutée par']),
      date: dateIso_(o['Date'])
    };
  }).sort(function (a, b) { return a.nom.localeCompare(b.nom, 'fr'); });
}

function cuisineRecettes() {
  acces_('cuisinier');
  const f = feuilleRecettes_();
  return { recettes: lireRecettes_(f.sh), lien: f.ss.getUrl() };
}

function cuisineEnregistrer(r) {
  acces_('cuisinier');
  r = r || {};
  const nom = texte_(r.nom);
  if (!nom) throw new Error('Donnez un nom à la recette.');
  const pers = Math.round(Number(r.personnes));
  if (!isFinite(pers) || pers < 1) throw new Error('Indiquez pour combien de personnes est la recette.');
  const ingr = (r.ingredients || []).filter(function (i) { return texte_(i.n); }).map(function (i) {
    const q = String(i.q == null ? '' : i.q).replace(',', '.').trim();
    return { q: q === '' || isNaN(Number(q)) ? texte_(i.q) : Number(q), u: texte_(i.u), n: texte_(i.n) };
  });
  if (!ingr.length) throw new Error('Ajoutez au moins un ingrédient.');
  const etapes = String(r.etapes || '').split(/\r?\n/).map(function (s) { return s.replace(/^\s*\d+[.)]\s*/, '').trim(); }).filter(String);

  const valeurs = {
    'Nom': nom,
    'Catégorie': texte_(r.categorie) || 'Autre',
    'Mode de cuisson': texte_(r.cuisson),
    'Personnes': pers,
    'Temps (min)': Number(r.temps) > 0 ? Math.round(Number(r.temps)) : '',
    'Ingrédients': ingr.map(function (i) { return [i.q, i.u, i.n].filter(function (x) { return x !== ''; }).join(' '); }).join('\n'),
    'Étapes': etapes.map(function (s, k) { return (k + 1) + '. ' + s; }).join('\n'),
    'Astuces': texte_(r.astuces),
    'Données': JSON.stringify(ingr)
  };

  return avecVerrou_(function () {
    const f = feuilleRecettes_();
    let id = texte_(r.id);
    const ex = id ? trouver_(f.sh, id) : null;
    if (ex) {
      maj_(f.sh, ex._row, valeurs);
    } else {
      id = id_();
      valeurs['ID'] = id;
      valeurs['Ajoutée par'] = qui_();
      valeurs['Date'] = new Date();
      ajouter_(f.sh, valeurs);
    }
    return { recettes: lireRecettes_(f.sh), lien: f.ss.getUrl(), id: id };
  });
}

function cuisineSupprimer(id) {
  acces_('cuisinier');
  return avecVerrou_(function () {
    const f = feuilleRecettes_();
    const o = trouver_(f.sh, id);
    if (!o) throw new Error('Recette introuvable.');
    f.sh.deleteRow(o._row);
    return { recettes: lireRecettes_(f.sh), lien: f.ss.getUrl() };
  });
}

/* =====================================================================
 *  MATÉRIEL / INTENDANCE  &  SECOURISTE — Inventaires
 * ===================================================================== */

function invConf_(cle) {
  if (typeof cle !== 'string' || !Object.prototype.hasOwnProperty.call(INVENTAIRES, cle)) throw new Error('Inventaire inconnu.');
  return INVENTAIRES[cle];
}
/** Section qui a le droit de toucher à cet inventaire (la clé doit être un texte exact : « materiel » ou « pharmacie »). */
function sectionInv_(cle) {
  if (typeof cle !== 'string' || !Object.prototype.hasOwnProperty.call(INVENTAIRES, cle)) { acces_('*'); throw new Error('Inventaire inconnu.'); }
  return cle === 'pharmacie' ? 'secouriste' : 'materiel';
}

function invFeuilles_(cle) {
  const c = invConf_(cle);
  const ss = classeur_(dossier_(info_(), c.dossier), c.fichier);
  const ent = ['ID'].concat(c.listes ? ['Liste'] : []).concat(['Article', 'Type', 'Quantité', 'Unité'])
    .concat(c.expiration ? ['Expiration'] : [])
    .concat(['Remarque', 'Dernière variation', 'Mis à jour le', 'Par']);
  const formats = { 'Mis à jour le': 'dd/mm/yyyy hh:mm', 'Dernière variation': '+0;-0;0' };
  if (c.expiration) formats['Expiration'] = 'dd/mm/yyyy';
  const inv = feuille_(ss, 'Inventaire', ent, {
    largeurs: [80].concat(c.listes ? [150] : []).concat([220, 130, 90, 90]).concat(c.expiration ? [110] : []).concat([220, 130, 140, 180]),
    formats: formats, cacherId: true
  });
  // (les lignes de l'historique s'écrivent dans cet ordre : « Liste » toujours en dernier)
  const hist = feuille_(ss, 'Historique', ['Date', 'Article', 'Type', 'Avant', 'Après', 'Variation', 'Motif', 'Par'].concat(c.listes ? ['Liste'] : []), {
    largeurs: [140, 220, 130, 70, 70, 90, 260, 180].concat(c.listes ? [150] : []),
    formats: { 'Date': 'dd/mm/yyyy hh:mm', 'Variation': '+0;-0;0' }
  });
  assurerIds_(inv);
  return { c: c, ss: ss, inv: inv, hist: hist };
}

function invLire_(c, sh) {
  return lignes_(sh).filter(function (o) { return texte_(o['Article']); }).map(function (o) {
    const v = o['Dernière variation'];
    return {
      id: String(o['ID']),
      liste: c.listes ? (texte_(o['Liste']) || LISTE_DEFAUT) : '',
      article: texte_(o['Article']),
      type: c.types.indexOf(texte_(o['Type'])) >= 0 ? texte_(o['Type']) : (texte_(o['Type']) || c.types[0]),
      quantite: Number(o['Quantité']) || 0,
      unite: texte_(o['Unité']),
      expiration: c.expiration ? dateIso_(o['Expiration']) : '',
      remarque: texte_(o['Remarque']),
      variation: (v === '' || v == null || isNaN(Number(v))) ? null : Number(v),
      maj: dateHeure_(o['Mis à jour le']),
      par: texte_(o['Par']),
      _row: o._row
    };
  }).sort(function (a, b) { return a.article.localeCompare(b.article, 'fr'); });
}
/** Noms des listes, « Général » d'abord. */
function invListes_(articles) {
  const l = [];
  articles.forEach(function (a) { if (a.liste && l.indexOf(a.liste) < 0) l.push(a.liste); });
  return l.sort(function (a, b) { return (a === LISTE_DEFAUT ? -1 : b === LISTE_DEFAUT ? 1 : a.localeCompare(b, 'fr')); });
}
/** Nom de liste saisi : espaces nettoyés ; une liste existante garde son orthographe. */
function nomListe_(nom, existantes) {
  let n = texte_(nom).replace(/\s+/g, ' ') || LISTE_DEFAUT;
  if (norm_(n) === norm_(LISTE_DEFAUT)) n = LISTE_DEFAUT;
  if (n.length > 40) throw new Error('Nom de la liste : 40 caractères au plus.');
  const ex = (existantes || []).filter(function (x) { return norm_(x) === norm_(n); })[0];
  return ex || n;
}

/** Ajoute des lignes à l'historique en plaçant chaque valeur sous son en-tête (même si des colonnes ont été ajoutées ou déplacées). */
function histAjouter_(f, lignes) {
  if (!lignes.length) return;
  const h = entetes_(f.hist), noms = ['Date', 'Article', 'Type', 'Avant', 'Après', 'Variation', 'Motif', 'Par', 'Liste'];
  ajouterLignes_(f.hist, lignes.map(function (l) {
    return h.map(function (k) { const i = noms.indexOf(k); return i >= 0 && l[i] !== undefined ? l[i] : ''; });
  }));
}

function invReponse_(f) {
  const articles = invLire_(f.c, f.inv).map(function (a) { delete a._row; return a; });
  const hist = lignes_(f.hist).slice(-80).reverse().map(function (o) {
    return {
      date: dateHeure_(o['Date']), article: texte_(o['Article']), type: texte_(o['Type']),
      avant: o['Avant'] === '' ? null : Number(o['Avant']), apres: Number(o['Après']) || 0,
      variation: Number(o['Variation']) || 0, motif: texte_(o['Motif']), par: texte_(o['Par']),
      liste: f.c.listes ? (texte_(o['Liste']) || LISTE_DEFAUT) : ''
    };
  });
  return { articles: articles, historique: hist, lien: f.ss.getUrl(), types: f.c.types, expiration: f.c.expiration,
    listes: f.c.listes ? invListes_(articles) : [], parListes: !!f.c.listes };
}

function inventaireDonnees(cle) {
  acces_(sectionInv_(cle));
  return invReponse_(invFeuilles_(cle));
}

/**
 * Met à jour une liste d'articles.
 * Chaque élément : {article, type, quantite (quantité TOTALE actuelle), unite, expiration, remarque}
 * Retourne un rapport des écarts (nouveau / plus / moins / egal).
 */
function inventaireMettreAJour(cle, liste, motif, nomListe) {
  acces_(sectionInv_(cle));
  const c = invConf_(cle);
  if (c.listes) nomListe_(nomListe);                 // (vérifie la longueur avant toute écriture)
  liste = (Array.isArray(liste) ? liste : []).filter(function (l) { return l && texte_(l.article); });
  if (!liste.length) throw new Error('La liste est vide.');

  // Validation complète avant toute écriture
  const vus = {};
  liste.forEach(function (l) {
    const k = norm_(l.article);
    if (vus[k]) throw new Error('« ' + texte_(l.article) + ' » apparaît deux fois dans la liste.');
    vus[k] = true;
    const q = Number(l.quantite);
    if (String(l.quantite).trim() === '' || !isFinite(q) || q < 0) throw new Error('Quantité invalide pour « ' + texte_(l.article) + ' ».');
    if (l.type && c.types.indexOf(l.type) < 0) throw new Error('Type invalide pour « ' + texte_(l.article) + ' ».');
    if (c.expiration && l.expiration && !dateVal_(l.expiration)) throw new Error('Date d\'expiration invalide pour « ' + texte_(l.article) + ' ».');
  });

  return avecVerrou_(function () {
    const f = invFeuilles_(cle);
    const h = entetes_(f.inv);
    const col = function (n) { return h.indexOf(n); };
    const nLignes = Math.max(0, f.inv.getLastRow() - 1);
    const data = nLignes ? f.inv.getRange(2, 1, nLignes, h.length).getValues() : [];
    // une liste = un inventaire à part : le même article peut exister dans plusieurs listes
    const listeDe = function (r) { return c.listes ? (texte_(r[col('Liste')]) || LISTE_DEFAUT) : ''; };
    const nomL = c.listes ? nomListe_(nomListe, invListes_(data.filter(function (r) { return texte_(r[col('Article')]); }).map(function (r) { return { liste: listeDe(r) }; }))) : '';
    const cleDe = function (l, a) { return (c.listes ? norm_(l) + '|' : '') + norm_(a); };
    const index = {};
    data.forEach(function (r, i) { if (texte_(r[col('Article')])) index[cleDe(listeDe(r), r[col('Article')])] = i; });
    const fin = c.listes ? [nomL] : [];

    const maintenant = new Date(), par = qui_(), m = texte_(motif) || 'Mise à jour de la liste';
    const nouveaux = [], historique = [], rapport = [];
    const modifiees = {};

    liste.forEach(function (l) {
      const nom = texte_(l.article);
      const q = Number(l.quantite);
      const i = index[cleDe(nomL, nom)];
      if (i === undefined) {
        const type = l.type || c.types[0];
        const row = h.map(function () { return ''; });
        row[col('ID')] = id_(); row[col('Article')] = nom; row[col('Type')] = type;
        if (c.listes) row[col('Liste')] = nomL;
        row[col('Quantité')] = q; row[col('Unité')] = texte_(l.unite);
        if (c.expiration) row[col('Expiration')] = dateVal_(l.expiration) || '';
        row[col('Remarque')] = texte_(l.remarque); row[col('Dernière variation')] = q;
        row[col('Mis à jour le')] = maintenant; row[col('Par')] = par;
        nouveaux.push(row.map(cellule_));
        historique.push([maintenant, nom, type, '', q, q, m + ' (nouvel article)', par].concat(fin));
        rapport.push({ article: nom, type: type, avant: null, apres: q, variation: q, statut: 'nouveau', unite: texte_(l.unite) });
      } else {
        const r = data[i];
        const avant = Number(r[col('Quantité')]) || 0;
        const v = arrondi_(q - avant);
        let change = v !== 0;
        if (l.type && l.type !== r[col('Type')]) { r[col('Type')] = l.type; change = true; }
        if (texte_(l.unite) && texte_(l.unite) !== texte_(r[col('Unité')])) { r[col('Unité')] = texte_(l.unite); change = true; }
        if (c.expiration && l.expiration && dateIso_(r[col('Expiration')]) !== l.expiration) { r[col('Expiration')] = dateVal_(l.expiration); change = true; }
        if (l.remarque !== undefined && texte_(l.remarque) !== texte_(r[col('Remarque')])) { r[col('Remarque')] = cellule_(texte_(l.remarque)); change = true; }
        r[col('Quantité')] = q;
        if (v !== 0) {
          r[col('Dernière variation')] = v;
          historique.push([maintenant, texte_(r[col('Article')]), texte_(r[col('Type')]), avant, q, v, m, par].concat(fin));
        }
        if (change) { r[col('Mis à jour le')] = maintenant; r[col('Par')] = par; modifiees[i] = true; }
        rapport.push({
          article: texte_(r[col('Article')]), type: texte_(r[col('Type')]), avant: avant, apres: q, variation: v,
          statut: v > 0 ? 'plus' : (v < 0 ? 'moins' : 'egal'), unite: texte_(r[col('Unité')])
        });
      }
    });

    if (Object.keys(modifiees).length) {
      f.inv.getRange(2, 1, data.length, h.length).setValues(data.map(function (r) { return r.map(cellule_); }));
    }
    if (nouveaux.length) f.inv.getRange(f.inv.getLastRow() + 1, 1, nouveaux.length, h.length).setValues(nouveaux);
    histAjouter_(f, historique);
    colorerVariations_(f.inv);
    if (historique.length) colorerVariations_(f.hist, 'Variation');

    const rep = invReponse_(f);
    rep.rapport = rapport;
    rep.liste = nomL;
    return rep;
  });
}

/** Ajoute (delta > 0) ou retire (delta < 0) une quantité d'un article. */
function inventaireMouvement(cle, id, delta, motif) {
  acces_(sectionInv_(cle));
  delta = Number(delta);
  if (!isFinite(delta) || delta === 0) throw new Error('Indiquez une quantité.');
  return avecVerrou_(function () {
    const f = invFeuilles_(cle);
    const o = trouver_(f.inv, id);
    if (!o) throw new Error('Article introuvable.');
    const avant = Number(o['Quantité']) || 0;
    const apres = arrondi_(avant + delta);
    if (apres < 0) throw new Error('Stock insuffisant : il ne reste que ' + avant + ' « ' + o['Article'] + ' ».');
    const par = qui_(), maintenant = new Date();
    maj_(f.inv, o._row, { 'Quantité': apres, 'Dernière variation': delta, 'Mis à jour le': maintenant, 'Par': par });
    histAjouter_(f, [[maintenant, texte_(o['Article']), texte_(o['Type']), avant, apres, delta,
      texte_(motif) || (delta < 0 ? 'Utilisé / retiré' : 'Ajouté'), par].concat(f.c.listes ? [texte_(o['Liste']) || LISTE_DEFAUT] : [])]);
    colorerVariations_(f.inv);
    colorerVariations_(f.hist, 'Variation');
    return invReponse_(f);
  });
}

function inventaireSupprimer(cle, id) {
  acces_(sectionInv_(cle));
  return avecVerrou_(function () {
    const f = invFeuilles_(cle);
    const o = trouver_(f.inv, id);
    if (!o) throw new Error('Article introuvable.');
    const avant = Number(o['Quantité']) || 0;
    f.inv.deleteRow(o._row);
    histAjouter_(f, [[new Date(), texte_(o['Article']), texte_(o['Type']), avant, 0, -avant, 'Article supprimé de l\'inventaire', qui_()].concat(f.c.listes ? [texte_(o['Liste']) || LISTE_DEFAUT] : [])]);
    colorerVariations_(f.hist, 'Variation');
    return invReponse_(f);
  });
}

/** Renomme une liste (inventaire et historique). */
function inventaireRenommerListe(cle, ancien, nouveau) {
  acces_(sectionInv_(cle));
  const c = invConf_(cle);
  if (!c.listes) throw new Error('Cet inventaire n\'a pas de listes.');
  const a = texte_(ancien);
  let n = texte_(nouveau).replace(/\s+/g, ' ');
  if (norm_(n) === norm_(LISTE_DEFAUT)) n = LISTE_DEFAUT;
  if (!a) throw new Error('Liste inconnue.');
  if (!n) throw new Error('Indiquez le nouveau nom.');
  if (n.length > 40) throw new Error('Nom de la liste : 40 caractères au plus.');
  return avecVerrou_(function () {
    const f = invFeuilles_(cle);
    const listes = invListes_(invLire_(c, f.inv));
    if (!listes.some(function (x) { return x === a; })) throw new Error('La liste « ' + a + ' » n\'existe plus.');
    if (norm_(n) !== norm_(a) && listes.some(function (x) { return norm_(x) === norm_(n); })) throw new Error('Une liste « ' + n + ' » existe déjà.');
    [f.inv, f.hist].forEach(function (sh) {
      const h = entetes_(sh), i = h.indexOf('Liste'), nb = sh.getLastRow() - 1;
      if (i < 0 || nb < 1) return;
      const r = sh.getRange(2, i + 1, nb, 1), v = r.getValues();
      let change = false;
      v.forEach(function (x) { if ((texte_(x[0]) || LISTE_DEFAUT) === a) { x[0] = n; change = true; } });      // (vide = liste « Général »)
      if (change) r.setValues(v.map(function (x) { return [cellule_(x[0])]; }));
    });
    const rep = invReponse_(f);
    rep.liste = n;
    return rep;
  });
}

function colorerVariations_(sh, nomCol) {
  const h = entetes_(sh);
  const c = h.indexOf(nomCol || 'Dernière variation');
  const n = sh.getLastRow() - 1;
  if (c < 0 || n < 1) return;
  const r = sh.getRange(2, c + 1, n, 1);
  const couleurs = r.getValues().map(function (v) {
    const x = Number(v[0]);
    return [v[0] === '' || isNaN(x) || x === 0 ? '#6B5B4B' : (x < 0 ? '#C8161D' : '#1E7B45')];
  });
  r.setFontColors(couleurs).setFontWeight('bold');
}

/* =====================================================================
 *  MATÉRIEL — Local des bois (morines, bois naturel, palettes)
 *  Onglet « Local des bois » du fichier « Inventaire Materiel ».
 *  Morine / bois naturel : une ligne par longueur.  Palette : une ligne par état.
 * ===================================================================== */

const BOIS = {
  FEUILLE: 'Local des bois',
  TYPES_BOIS: ['Morine', 'Bois naturel'],   // se comptent par longueur (en mètres)
  PALETTE: 'Palette',                        // pas de dimensions : se compte par état
  ETATS: ['Bon', 'Correct', 'Mauvais'],
  LONGUEUR_MAX: 30                           // mètres (garde-fou contre les fautes de frappe)
};

function boisActif_() {
  if (!R_().LOCAL_DES_BOIS) throw new Error('Le local des bois n\'est pas activé (RÉGLAGES › LOCAL_DES_BOIS).');
}

function boisFeuille_() {
  const ss = classeur_(dossier_(info_(), CONFIG.DOSSIERS.MATERIEL), CONFIG.FICHIERS.INV_MATERIEL);
  const sh = feuille_(ss, BOIS.FEUILLE, ['ID', 'Type', 'Longueur (m)', 'État', 'Quantité', 'Remarque', 'Mis à jour le', 'Par'], {
    largeurs: [80, 130, 110, 110, 90, 260, 140, 190],
    formats: { 'Mis à jour le': 'dd/mm/yyyy hh:mm' }, cacherId: true
  });
  boisIds_(sh);
  return { ss: ss, sh: sh };
}

/**
 * Donne un identifiant aux lignes tapées à la main, et un nouvel identifiant aux lignes copiées-collées
 * (même identifiant qu'une ligne au-dessus). N'écrit que les cellules concernées.
 */
function boisIds_(sh) {
  if (CTX_) return;                      // lecture d'une unité : aucune écriture
  const h = entetes_(sh), c = h.indexOf('ID'), dernier = sh.getLastRow();
  if (c < 0 || dernier < 2) return;
  const vus = {};
  sh.getRange(2, 1, dernier - 1, h.length).getValues().forEach(function (r, i) {
    const id = String(r[c]).trim();
    const pleine = r.some(function (v, j) { return j !== c && String(v).trim() !== ''; });
    if (!pleine) return;
    if (id === '' || vus[id]) sh.getRange(i + 2, c + 1).setValue(id_());
    else vus[id] = true;
  });
}

/** Reconnaît le type et l'état même s'ils ont été tapés à la main dans le fichier (majuscules, accents). */
function boisType_(v) {
  const n = norm_(v);
  return BOIS.TYPES_BOIS.concat([BOIS.PALETTE]).filter(function (t) { return norm_(t) === n; })[0] || '';
}
function boisEtat_(v) {
  const n = norm_(v);
  return BOIS.ETATS.filter(function (e) { return norm_(e) === n; })[0] || '';
}
function boisLongueur_(v) {
  const x = Number(String(v == null ? '' : v).replace(',', '.').trim());
  return isFinite(x) && x > 0 ? arrondi_(x) : 0;
}
function boisCle_(l) { return l.type === BOIS.PALETTE ? 'P|' + l.etat : l.type + '|' + l.longueur; }
function boisLibelle_(l) {
  return l.type === BOIS.PALETTE ? 'Palette — état ' + l.etat.toLowerCase() : l.type + ' ' + String(l.longueur).replace('.', ',') + ' m';
}

function boisLire_(sh) {
  const ordre = BOIS.TYPES_BOIS.concat([BOIS.PALETTE]);
  return lignes_(sh).map(function (o) {
    const type = boisType_(o['Type']);
    if (!type) return null;
    const palette = type === BOIS.PALETTE;
    const l = {
      id: String(o['ID']), type: type,
      longueur: palette ? 0 : boisLongueur_(o['Longueur (m)']),
      etat: palette ? (boisEtat_(o['État']) || BOIS.ETATS[0]) : '',
      quantite: Math.max(0, Math.round(Number(o['Quantité']) || 0)),
      remarque: texte_(o['Remarque']), maj: dateHeure_(o['Mis à jour le']), par: texte_(o['Par']), _row: o._row
    };
    return (palette || l.longueur > 0) ? l : null;
  }).filter(Boolean).sort(function (a, b) {
    return (ordre.indexOf(a.type) - ordre.indexOf(b.type)) || (a.longueur - b.longueur) || (BOIS.ETATS.indexOf(a.etat) - BOIS.ETATS.indexOf(b.etat));
  });
}

function boisReponse_(f) {
  return {
    lignes: boisLire_(f.sh).map(function (l) { delete l._row; return l; }),
    typesBois: BOIS.TYPES_BOIS, palette: BOIS.PALETTE, etats: BOIS.ETATS, lien: f.ss.getUrl() ? f.ss.getUrl() + '#gid=' + f.sh.getSheetId() : ''
  };
}

function boisDonnees() {
  acces_('materiel');
  boisActif_();
  return boisReponse_(boisFeuille_());
}

/** Vérifie une saisie {type, longueur | etat, quantite, remarque} et la met en forme. */
function boisValider_(b, quantiteMin) {
  b = b || {};
  const type = boisType_(b.type);
  if (!type) throw new Error('Choisissez le type : ' + BOIS.TYPES_BOIS.join(', ') + ' ou ' + BOIS.PALETTE + '.');
  const palette = type === BOIS.PALETTE;
  const longueur = palette ? 0 : boisLongueur_(b.longueur);
  if (!palette && !longueur) throw new Error('Indiquez la longueur en mètres (ex. 3 ou 2,5).');
  if (longueur > BOIS.LONGUEUR_MAX) throw new Error('Longueur trop grande : ' + BOIS.LONGUEUR_MAX + ' m au maximum.');
  const etat = palette ? boisEtat_(b.etat) : '';
  if (palette && !etat) throw new Error('Indiquez l\'état de la palette : ' + BOIS.ETATS.join(', ') + '.');
  const q = Number(b.quantite);
  if (String(b.quantite == null ? '' : b.quantite).trim() === '' || !isFinite(q) || Math.floor(q) !== q || q < quantiteMin || q > 100000) {
    throw new Error(quantiteMin > 0 ? 'Indiquez une quantité (nombre entier, au moins ' + quantiteMin + ').' : 'Quantité invalide (nombre entier, 0 ou plus).');
  }
  return { type: type, longueur: longueur, etat: etat, quantite: q, remarque: texte_(b.remarque) };
}

/** Ajoute du bois. La même longueur (ou le même état de palette) s'additionne à la ligne existante. */
function boisAjouter(b) {
  acces_('materiel');
  boisActif_();
  const n = boisValider_(b, 1);
  return avecVerrou_(function () {
    const f = boisFeuille_();
    const ex = boisLire_(f.sh).filter(function (l) { return boisCle_(l) === boisCle_(n); })[0];
    const maintenant = new Date(), par = qui_();
    if (ex) {
      const m = { 'Quantité': ex.quantite + n.quantite, 'Mis à jour le': maintenant, 'Par': par };
      if (n.remarque) m['Remarque'] = n.remarque;
      maj_(f.sh, ex._row, m);
    } else {
      ajouter_(f.sh, { 'ID': id_(), 'Type': n.type, 'Longueur (m)': n.longueur || '', 'État': n.etat, 'Quantité': n.quantite,
        'Remarque': n.remarque, 'Mis à jour le': maintenant, 'Par': par });
    }
    const rep = boisReponse_(f);
    rep.message = boisLibelle_(n) + ' : ' + (ex ? ex.quantite + ' → ' + (ex.quantite + n.quantite) : n.quantite + ' ajouté' + (n.quantite > 1 ? 's' : ''));
    return rep;
  });
}

/** Ajoute (delta > 0) ou retire (delta < 0) des pièces sur une ligne. */
function boisMouvement(id, delta) {
  acces_('materiel');
  boisActif_();
  delta = Number(delta);
  if (!isFinite(delta) || delta === 0 || Math.floor(delta) !== delta) throw new Error('Indiquez un nombre entier.');
  return avecVerrou_(function () {
    const f = boisFeuille_();
    const l = boisLire_(f.sh).filter(function (x) { return x.id === String(id); })[0];
    if (!l) throw new Error('Ligne introuvable : actualisez la page.');
    const apres = l.quantite + delta;
    if (apres < 0) throw new Error('Il n\'en reste que ' + l.quantite + ' (' + boisLibelle_(l) + ').');
    maj_(f.sh, l._row, { 'Quantité': apres, 'Mis à jour le': new Date(), 'Par': qui_() });
    return boisReponse_(f);
  });
}

/** Corrige une ligne : longueur (ou état), quantité exacte, remarque. Le type ne change pas. */
function boisModifier(id, b) {
  acces_('materiel');
  boisActif_();
  return avecVerrou_(function () {
    const f = boisFeuille_();
    const toutes = boisLire_(f.sh);
    const l = toutes.filter(function (x) { return x.id === String(id); })[0];
    if (!l) throw new Error('Ligne introuvable : actualisez la page.');
    const n = boisValider_(Object.assign({}, b || {}, { type: l.type }), 0);
    const double = toutes.filter(function (x) { return x.id !== l.id && boisCle_(x) === boisCle_(n); })[0];
    if (double) throw new Error('Une ligne « ' + boisLibelle_(n) + ' » existe déjà (' + double.quantite + '). Modifiez plutôt sa quantité.');
    maj_(f.sh, l._row, { 'Longueur (m)': n.longueur || '', 'État': n.etat, 'Quantité': n.quantite, 'Remarque': n.remarque === '' ? null : n.remarque,
      'Mis à jour le': new Date(), 'Par': qui_() });
    return boisReponse_(f);
  });
}

function boisSupprimer(id) {
  acces_('materiel');
  boisActif_();
  return avecVerrou_(function () {
    const f = boisFeuille_();
    const o = trouver_(f.sh, id);
    if (!o) throw new Error('Ligne introuvable : actualisez la page.');
    f.sh.deleteRow(o._row);
    return boisReponse_(f);
  });
}

/* =====================================================================
 *  SERVICES D'UNITÉ (Clan) — qui a servi quelle unité, et quand
 *  Fichier « Info › Services › Services d'unité », onglet « Services » : une ligne par service,
 *  les participants séparés par « ; ».
 * ===================================================================== */

const S_ENTETES = ['ID', 'Date', 'Unité servie', 'Type de service', 'Service', 'Pour', 'Participants', 'Nombre', 'Remarque', 'Ajouté par', 'Horodatage'];
const SERVICES_MAX = { SERVICE: 120, NOM: 80, PARTICIPANTS: 80, REMARQUE: 500 };

function servicesActif_() {
  if (!R_().SERVICES) throw new Error('Les services d\'unité ne sont pas activés dans cette application.');
}
function servicesUnites_() {
  return (Array.isArray(R_().SERVICES_UNITES) && R_().SERVICES_UNITES.length ? R_().SERVICES_UNITES : ['Meute', 'Troupe', 'Clan', 'Guides']).map(String);
}
function servicesTypes_() {
  return (Array.isArray(R_().SERVICES_TYPES) && R_().SERVICES_TYPES.length ? R_().SERVICES_TYPES : ['Garde', 'Matériel', 'Étapiste', 'Autre']).map(String);
}
function feuilleServices_() {
  const ss = classeur_(dossier_(info_(), CONFIG.DOSSIERS.SERVICES), CONFIG.FICHIERS.SERVICES);
  const sh = feuille_(ss, 'Services', S_ENTETES, {
    largeurs: [80, 95, 110, 120, 260, 110, 380, 75, 220, 190, 135],
    formats: { 'Date': 'dd/mm/yyyy', 'Horodatage': 'dd/mm/yyyy hh:mm' }, cacherId: true
  });
  assurerIds_(sh);
  return { ss: ss, sh: sh };
}
function lireServices_(sh) {
  return lignes_(sh).filter(function (o) { return dateIso_(o['Date']) && (texte_(o['Service']) || texte_(o['Type de service'])); }).map(function (o) {
    return {
      id: String(o['ID']), date: dateIso_(o['Date']), unite: texte_(o['Unité servie']), service: texte_(o['Service']),
      type: texte_(o['Type de service']) || 'Autre', pour: texte_(o['Pour']),
      participants: texte_(o['Participants']).split(';').map(function (x) { return x.trim(); }).filter(String),
      remarque: texte_(o['Remarque']), par: texte_(o['Ajouté par']), horodatage: dateHeure_(o['Horodatage'])
    };
  }).sort(function (a, b) { return (b.date + b.horodatage).localeCompare(a.date + a.horodatage); });
}
/** L'année scoute (septembre → août) d'une date AAAA-MM-JJ. */
function anneeScouteDe_(iso) {
  const m = /^(\d{4})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  const a = Number(m[1]);
  return Number(m[2]) >= 9 ? a + '-' + (a + 1) : (a - 1) + '-' + a;
}
/** Les membres du Clan (liste « Présences » la plus récente), avec leur équipe. */
function servicesMembres_() {
  try {
    if (!fichierParNom_(secretariat_(), CONFIG.FICHIERS.PRESENCES, MimeType.GOOGLE_SHEETS)) return { membres: [], periode: null };   // rien à créer en lisant
    const f = feuillesPresences_();
    const tous = lignes_(f.mem).filter(function (o) { return texte_(o['Nom']) && /^\d{4}-\d{4}$/.test(texte_(o['Année'])); });
    if (!tous.length) return { membres: [], periode: null };
    const cle = function (o) { return texte_(o['Année']) + '|' + Number(o['Trimestre']); };
    const derniere = tous.map(cle).sort().pop();
    const p = { a: derniere.split('|')[0], t: Number(derniere.split('|')[1]) };
    return { membres: lireMembres_(f, p).map(function (m) { return { nom: m.nom, unite: m.unite, role: m.role }; }), periode: { annee: p.a, trimestre: p.t } };
  } catch (e) { return { membres: [], periode: null }; }
}
function reponseServices_(f) {
  const m = servicesMembres_();
  return {
    services: lireServices_(f.sh), membres: m.membres, periode: m.periode, unites: servicesUnites_(), types: servicesTypes_(), ensemble: cfgPres_().ensemble,
    equipes: cfgPres_().unites, equipeNom: cfgPres_().uniteNom, lien: f.ss.getUrl()
  };
}

function servicesDonnees() {
  acces_('services');
  servicesActif_();
  return reponseServices_(feuilleServices_());
}

/** Ajoute (sans id) ou modifie (avec id) un service. */
function servicesEnregistrer(sv) {
  acces_('services');
  servicesActif_();
  sv = sv || {};
  const date = dateVal_(sv.date);
  if (!date) throw new Error('Choisissez la date du service.');
  const unite = texte_(sv.unite);
  if (servicesUnites_().indexOf(unite) < 0) throw new Error('Choisissez l\'unité servie (' + servicesUnites_().join(', ') + ').');
  const type = texte_(sv.type);
  if (servicesTypes_().indexOf(type) < 0) throw new Error('Choisissez le type de service (' + servicesTypes_().join(', ') + ').');
  const service = texte_(sv.service).replace(/\s+/g, ' ');
  if (!service && type === servicesTypes_()[servicesTypes_().length - 1]) throw new Error('Précisez le service rendu (ex : animation d\'un grand jeu).');
  // qui a servi : quelques membres (''), tout le Clan, ou une équipe — comme pour les présences
  const cp = cfgPres_();
  let pour = texte_(sv.pour);
  if (pour && pour !== cp.ensemble && cp.unites.indexOf(pour) < 0) throw new Error('Choisissez : quelques membres, tout le ' + cp.ensemble + ' ou une ' + cp.uniteNom + '.');
  if (service.length > SERVICES_MAX.SERVICE) throw new Error('Service : ' + SERVICES_MAX.SERVICE + ' caractères au plus.');
  if (!Array.isArray(sv.participants)) throw new Error('Choisissez au moins un participant.');
  const vus = {}, participants = [];
  sv.participants.forEach(function (n) {
    const nom = texte_(n).replace(/\s+/g, ' ').replace(/;/g, ',');
    if (!nom) return;
    if (nom.length > SERVICES_MAX.NOM) throw new Error('Nom trop long : « ' + nom.slice(0, 30) + '… ».');
    const k = norm_(nom);
    if (vus[k]) return;
    vus[k] = true; participants.push(nom);
  });
  if (!participants.length) throw new Error('Choisissez au moins un participant.');
  if (participants.length > SERVICES_MAX.PARTICIPANTS) throw new Error(SERVICES_MAX.PARTICIPANTS + ' participants au plus.');
  const remarque = texte_(sv.remarque).slice(0, SERVICES_MAX.REMARQUE);
  return avecVerrou_(function () {
    const f = feuilleServices_();
    const o = { 'Date': date, 'Unité servie': unite, 'Type de service': type, 'Service': service, 'Pour': pour, 'Participants': participants.join('; '), 'Nombre': participants.length, 'Remarque': remarque };
    let id = texte_(sv.id);
    if (id) {
      const ex = trouver_(f.sh, id);
      if (!ex) throw new Error('Service introuvable (supprimé entre-temps ?).');
      maj_(f.sh, ex._row, o);
    } else {
      id = id_();
      o['ID'] = id; o['Ajouté par'] = qui_(); o['Horodatage'] = new Date();
      ajouter_(f.sh, o);
    }
    const r = reponseServices_(f);
    r.enregistre = id;
    return r;
  });
}

function servicesSupprimer(id) {
  acces_('services');
  servicesActif_();
  return avecVerrou_(function () {
    const f = feuilleServices_();
    const o = trouver_(f.sh, id);
    if (!o) throw new Error('Service introuvable (déjà supprimé ?).');
    f.sh.deleteRow(o._row);
    return reponseServices_(f);
  });
}

/* =====================================================================
 *  MAÎTRISE DE GROUPE — comptes, connexion et verrouillage des sections
 *  (uniquement quand REGLAGES.MAITRISE vaut true)
 *  · Chaque section a un utilisateur et un mot de passe ; « admin » ouvre aussi le panneau d'administration.
 *  · La clé joker ouvre toutes les sections (pas l'administration).
 *  · Les mots de passe ne sont jamais enregistrés en clair : seule leur empreinte est gardée dans les
 *    propriétés du script. Pour tout remettre à zéro : ⚙️ Paramètres du projet › Propriétés du script,
 *    supprimer « COMPTES ».
 * ===================================================================== */

const SECTIONS_MAITRISE = [
  ['tresorier', 'Trésorier'], ['secretaire', 'Secrétaire'], ['cuisinier', 'Cuisinier'],
  ['materiel', 'Matériel & Intendance'], ['secouriste', 'Secouriste'], ['photographe', 'Photographe'], ['animateur', 'Animateur']
];

function maitriseSeulement_() {
  if (!REGLAGES.MAITRISE) throw new Error('Cette fonction n\'existe que dans l\'application de la Maîtrise.');
}

/**
 * Contrôle d'accès placé en tête de chaque fonction appelée par l'interface. Sans effet pour une unité.
 * Portées : 'tresorier' … = le travail de la Maîtrise dans cette section ; 'suivi:tresorier' … = le suivi des unités ;
 * 'admin' ; '*' = n'importe quelle session (même sans connexion, avec ce qui est ouvert sans mot de passe).
 * Le compte d'une section ouvre ses deux portées ; l'administrateur règle ce qui est ouvert sans mot de passe (SESSION_.l).
 */
function acces_(section) {
  if (!REGLAGES.MAITRISE || ENTREE_) return;
  if (!SESSION_) throw new Error('Connexion requise.');
  section = String(section);
  const suivi = section.indexOf('suivi:') === 0, k = suivi ? section.slice(6) : section;
  if (section === 'admin') {
    if (!SESSION_.a) throw new Error('Réservé à l\'administrateur.');
  } else if (section !== '*' && !ouvre_(SESSION_, section)) {
    const nom = SECTIONS_MAITRISE.filter(function (x) { return x[0] === k; })[0];
    throw new Error('Accès refusé : connectez-vous à la section « ' + (nom ? nom[1] : k) + ' »' + (suivi ? ' (suivi des unités)' : '') + '.');
  }
  ENTREE_ = true; SECTION_ = k;
}
/** Cette session ouvre-t-elle cette portée ? */
function ouvre_(s, portee) {
  const k = portee.indexOf('suivi:') === 0 ? portee.slice(6) : portee;
  if (!SECTIONS_MAITRISE.some(function (x) { return x[0] === k; })) return false;
  return s.s.indexOf(k) >= 0 || (s.l || []).indexOf(portee) >= 0;
}

/** La session en cours voit-elle le travail de cette section ? (toujours vrai pour une unité) */
function voit_(section) {
  return !REGLAGES.MAITRISE || !!(SESSION_ && ouvre_(SESSION_, section));
}

function hex_(octets) {
  return octets.map(function (b) { return ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2); }).join('');
}
function empreinte_(sel, motDePasse) {
  return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, sel + '|' + String(motDePasse), Utilities.Charset.UTF_8));
}
function nouveauCompte_(utilisateur, motDePasse, parDefaut) {
  const sel = Utilities.getUuid();
  return { u: texte_(utilisateur), s: sel, h: empreinte_(sel, motDePasse), d: !!parDefaut, m: parDefaut ? '' : dateHeure_(new Date()) };
}

/** Les comptes : l'administrateur, la clé joker, puis un compte par section. */
function clesComptes_() {
  return ['admin', 'joker'].concat(SECTIONS_MAITRISE.map(function (x) { return x[0]; }));
}
/** Utilisateur et mot de passe de départ d'un compte (bloc MAITRISE). */
function departCompte_(k) {
  const d = Object.prototype.hasOwnProperty.call(MAITRISE.COMPTES || {}, k) ? MAITRISE.COMPTES[k] : null;
  return { utilisateur: texte_(d && d.utilisateur) || k, motDePasse: String((d && d.motDePasse) || '123456') };
}
/**
 * Comptes enregistrés (propriété du script « COMPTES ») :
 * { v: version, c: { admin: {u, s, h, d, m}, joker: {…}, tresorier: {…, l: true si sans mot de passe}, … } }.
 * Créés au premier démarrage. Une erreur de lecture ne remet JAMAIS les mots de passe à zéro : elle remonte telle quelle.
 */
function lireComptes_(props) {
  const texte = props.getProperty('COMPTES');
  if (texte === null || texte === undefined || texte === '') return null;       // premier démarrage, ou remise à zéro voulue
  let brut = null;
  try { brut = JSON.parse(texte); } catch (e) { brut = null; }
  if (!brut || typeof brut !== 'object' || Array.isArray(brut) || !brut.c || typeof brut.c !== 'object' || Array.isArray(brut.c) || typeof brut.v !== 'number' || !isFinite(brut.v)) {
    throw new Error('Les comptes enregistrés sont illisibles. Dans l\'éditeur Apps Script : Paramètres du projet › Propriétés du script, supprimez « COMPTES » pour repartir des comptes de départ.');
  }
  return brut;
}
function comptesComplets_(brut) {
  return clesComptes_().every(function (k) {
    const c = Object.prototype.hasOwnProperty.call(brut.c, k) ? brut.c[k] : null;
    return !!(c && typeof c === 'object' && c.u && c.h && c.s);
  });
}
function comptes_() {
  const props = PropertiesService.getScriptProperties();
  let brut = lireComptes_(props);
  if (brut && comptesComplets_(brut)) return brut;
  // premier démarrage (ou compte manquant) : création sous verrou, après relecture, pour que deux visites en même temps ne se marchent pas dessus
  return sousVerrou_(function () {
    brut = lireComptes_(props);
    if (brut && comptesComplets_(brut)) return brut;
    if (!brut) {
      brut = { v: Date.now(), c: {} };
      props.deleteProperty('SECRET_SESSIONS');      // nouveau secret : toutes les connexions d'avant sont refusées
    }
    const departs = clesComptes_().filter(function (k) { return k !== 'joker'; }).map(function (k) { return departCompte_(k).motDePasse; });
    clesComptes_().forEach(function (k) {
      const c = Object.prototype.hasOwnProperty.call(brut.c, k) ? brut.c[k] : null;
      if (c && typeof c === 'object' && c.u && c.h && c.s) return;
      if (k === 'joker') {
        // sans clé dans les réglages (ou clé identique à un mot de passe de départ) : clé tirée au hasard, donc inutilisable,
        // jusqu'à ce que l'administrateur en choisisse une
        const cle = texte_(MAITRISE.CLE_JOKER) === String(MAITRISE.CLE_JOKER || '') ? String(MAITRISE.CLE_JOKER || '') : '';
        const valable = cle.length >= JOKER_MIN && departs.indexOf(cle) < 0;
        brut.c[k] = nouveauCompte_('joker', valable ? cle : Utilities.getUuid() + Utilities.getUuid(), valable);
      } else {
        const def = departCompte_(k);
        brut.c[k] = nouveauCompte_(def.utilisateur, def.motDePasse, true);
      }
    });
    props.setProperty('COMPTES', JSON.stringify(brut));
    return brut;
  });
}

/** Sections ouvertes sans mot de passe (choisies par l'administrateur), dans l'ordre du menu. */
/** Ce qui s'ouvre sans mot de passe : 'secretaire' (travail de la Maîtrise), 'suivi:secretaire' (suivi des unités)… */
function libres_(comptes) {
  const c = comptes || comptes_(), out = [];
  SECTIONS_MAITRISE.forEach(function (x) {
    const k = x[0];
    if (libreTravail_(c, k)) out.push(k);
    if (libreSuivi_(c, k)) out.push('suivi:' + k);
  });
  return out;
}
/** (« l » : réglage d'une version précédente, qui ouvrait les deux.) Tant que l'administrateur n'a rien choisi, le bloc MAITRISE décide. */
function libreTravail_(c, k) {
  const x = c.c[k] || {};
  if (x.lp === true || x.lp === false) return x.lp;
  if (x.l === true) return true;
  return (MAITRISE.TRAVAIL_SANS_MOT_DE_PASSE || []).indexOf(k) >= 0;
}
function libreSuivi_(c, k) {
  const x = c.c[k] || {};
  if (x.ls === true || x.ls === false) return x.ls;
  if (x.l === true) return true;
  return (MAITRISE.SUIVI_SANS_MOT_DE_PASSE || []).indexOf(k) >= 0;
}
const ACCES_LIBRE = 'Accès libre';

function secret_() {
  const props = PropertiesService.getScriptProperties();
  let s = props.getProperty('SECRET_SESSIONS');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('SECRET_SESSIONS', s); }
  return s;
}
function signer_(texte) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(texte, secret_())).replace(/=+$/, '');
}
function jeton_(session) {
  const corps = Utilities.base64EncodeWebSafe(JSON.stringify(session), Utilities.Charset.UTF_8).replace(/=+$/, '');
  return corps + '.' + signer_(corps);
}
/** Vérifie un jeton : signature, date d'expiration et version des comptes. Retourne la session ou null. */
function sessionDe_(jeton) {
  const j = String(jeton || ''), i = j.indexOf('.');
  if (i < 1) return null;
  const corps = j.slice(0, i), sig = j.slice(i + 1);
  const comptes = comptes_();               // avant la signature : une remise à zéro des comptes change aussi le secret
  const attendu = signer_(corps);
  if (sig.length !== attendu.length) return null;
  let diff = 0;
  for (let k = 0; k < sig.length; k++) diff |= sig.charCodeAt(k) ^ attendu.charCodeAt(k);
  if (diff !== 0) return null;
  let s = null;
  try { s = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(corps + '==='.slice((corps.length + 3) % 4))).getDataAsString('UTF-8')); } catch (e) { return null; }
  if (!s || !Array.isArray(s.s) || !(Number(s.e) > Date.now())) return null;
  if (s.v !== comptes.v) return null;       // un mot de passe a changé depuis : il faut se reconnecter
  const par = {};
  if (s.p && typeof s.p === 'object') s.s.forEach(function (k) { if (s.p[k]) par[k] = texte_(s.p[k]); });
  return { s: s.s.map(String), a: !!s.a, e: Number(s.e), v: s.v, n: texte_(s.n), p: par };
}
function etatSession_(s, comptes) {
  return { jeton: jeton_(s), sections: s.s, admin: s.a, expire: s.e, nom: s.n, libres: libres_(comptes) };
}

/**
 * Limite les essais de mots de passe, par fenêtre de 10 minutes :
 * 10 essais ratés pour un même nom d'utilisateur bloquent ce nom ; 150 en tout bloquent toutes les connexions.
 * Chaque essai est compté AVANT la vérification (sous verrou : des essais lancés en même temps ne passent pas à travers),
 * puis rendu si le mot de passe est bon. Les personnes déjà connectées ne sont pas gênées.
 */
const ESSAIS = { PAR_COMPTE: 10, EN_TOUT: 150, SECONDES: 600 };
function cleEssais_(u) {
  return u === null ? 'ECHECS_TOUS' : 'ECHECS_' + empreinte_('essais', u).slice(0, 32);
}
function essaisLire_(cache, cle) {
  const brut = cache.get(cle);                    // une panne du cache remonte : on ne laisse pas passer sans compter
  let o = null;
  try { o = JSON.parse(brut || 'null'); } catch (e) { o = null; }
  const t = Date.now();
  if (!o || typeof o !== 'object' || !(Number(o.n) > 0) || !(t - Number(o.d) > -60000 && t - Number(o.d) < ESSAIS.SECONDES * 1000)) return { n: 0, d: t };
  return { n: Number(o.n), d: Number(o.d) };
}
function essaisEcrire_(cache, cle, o) {
  // la fenêtre garde son point de départ : elle ne se rallonge pas à chaque essai
  cache.put(cle, JSON.stringify(o), Math.min(ESSAIS.SECONDES, Math.max(1, Math.ceil(ESSAIS.SECONDES - (Date.now() - o.d) / 1000))));
}
/** Compte un essai pour ce nom d'utilisateur. Retourne '' s'il peut avoir lieu, sinon le message de refus (rien n'est alors compté). */
function essaisCompter_(u) {
  const verrou = LockService.getScriptLock();
  if (VERROU_ === 0 && !verrou.tryLock(8000)) return 'Le programme est occupé : réessayez dans un instant.';
  try {
    const cache = CacheService.getScriptCache();
    const tous = essaisLire_(cache, cleEssais_(null)), compte = essaisLire_(cache, cleEssais_(u));
    if (tous.n >= ESSAIS.EN_TOUT) return 'Trop d\'essais : réessayez dans quelques minutes.';
    if (compte.n >= ESSAIS.PAR_COMPTE) return 'Trop d\'essais pour ce compte : réessayez dans 10 minutes.';
    tous.n++; compte.n++;
    essaisEcrire_(cache, cleEssais_(null), tous); essaisEcrire_(cache, cleEssais_(u), compte);
    return '';
  } finally { if (VERROU_ === 0) verrou.releaseLock(); }
}
/** Le mot de passe était bon : l'essai compté d'avance est rendu (les essais ratés d'avant restent comptés). */
function essaisRendre_(u) {
  const verrou = LockService.getScriptLock();
  let pris = false;
  try { pris = VERROU_ === 0 && verrou.tryLock(8000); } catch (e) { pris = false; }
  try {
    const cache = CacheService.getScriptCache();
    [cleEssais_(null), cleEssais_(u)].forEach(function (cle) {
      const o = essaisLire_(cache, cle);
      if (o.n <= 1) cache.remove(cle); else { o.n--; essaisEcrire_(cache, cle, o); }
    });
  } catch (e) { /* le compteur s'effacera tout seul */ } finally { if (pris) verrou.releaseLock(); }
}

/**
 * Connexion. Ouvre : toutes les sections avec la clé joker ; tout (et l'administration) avec le compte admin ;
 * sinon la ou les sections dont l'utilisateur et le mot de passe correspondent.
 * `jetonActuel` (facultatif) : les sections déjà ouvertes restent ouvertes.
 */
function connexion(utilisateur, motDePasse, jetonActuel) {
  maitriseSeulement_();
  const u = norm_(String(utilisateur == null ? '' : utilisateur).slice(0, 100)), p = String(motDePasse == null ? '' : motDePasse);
  const comptes = comptes_();
  const refus = essaisCompter_(u);
  if (refus) throw new Error(refus);
  const toutes = SECTIONS_MAITRISE.map(function (x) { return x[0]; });
  const mdp = function (c) { return !!c && p !== '' && p.length <= 200 && empreinte_(c.s, p) === c.h; };
  const bon = function (c) { return !!c && u !== '' && norm_(c.u) === u && mdp(c); };
  let sections = [], admin = false, nom = '';
  if (bon(comptes.c.admin)) { sections = toutes.slice(); admin = true; nom = comptes.c.admin.u; }                // le compte administrateur d'abord
  else if (mdp(comptes.c.joker)) { sections = toutes.slice(); nom = 'Clé joker'; }                                // la clé joker, avec n'importe quel utilisateur
  else { sections = toutes.filter(function (k) { return bon(comptes.c[k]); }); if (sections.length) nom = comptes.c[sections[0]].u; }
  if (!sections.length) {
    Utilities.sleep(800);
    throw new Error('Utilisateur ou mot de passe incorrect.');
  }
  essaisRendre_(u);
  // qui a ouvert chaque section (les lignes enregistrées sont signées avec ce compte)
  const par = {};
  sections.forEach(function (k) { par[k] = nom; });
  const avant = sessionDe_(jetonActuel);
  if (avant) {
    avant.s.forEach(function (k) { if (sections.indexOf(k) < 0 && toutes.indexOf(k) >= 0) { sections.push(k); par[k] = avant.p[k] || avant.n; } });
    if (avant.a && !admin) { admin = true; nom = avant.n; }       // l'administrateur déjà connecté le reste, sous son nom
  }
  sections = toutes.filter(function (k) { return sections.indexOf(k) >= 0; });
  // ouvrir une section de plus ne rallonge pas la connexion : elle finit toujours 12 h après la première
  let fin = Date.now() + Math.max(1, Number(MAITRISE.SESSION_HEURES) || 12) * 3600000;
  if (avant) fin = Math.min(fin, avant.e);
  return etatSession_({ s: sections, a: admin, e: fin, v: comptes.v, n: nom, p: par }, comptes);
}

/** Au rechargement de la page : la session enregistrée dans le navigateur est-elle encore valable ? */
function sessionEtat(jeton) {
  maitriseSeulement_();
  const s = sessionDe_(jeton);
  return s ? { jeton: String(jeton), sections: s.s, admin: s.a, expire: s.e, nom: s.n, libres: libres_() } : null;
}

/** Les sections que l'administrateur a ouvertes sans mot de passe (rien de secret : juste leurs noms). */
function accesLibres() {
  maitriseSeulement_();
  return libres_();
}

/** Toutes les fonctions que l'interface de la Maîtrise peut appeler passent par ici, avec le jeton de session. */
function appel(jeton, nom, args) {
  maitriseSeulement_();
  let s = sessionDe_(jeton);
  const libres = libres_();
  // sans connexion : seules les sections ouvertes sans mot de passe répondent ; un jeton périmé doit d'abord être oublié
  if (!s && (texte_(jeton) || !libres.length)) throw new Error('SESSION_EXPIREE');
  // ce qui est ouvert sans mot de passe reste à part (s.l) : il n'entre jamais dans un jeton.
  // Une personne connectée qui écrit dans une section libre signe de son nom ; un visiteur sans connexion signe « Accès libre ».
  if (!s) s = { s: [], a: false, e: 0, v: 0, n: ACCES_LIBRE, p: {} };
  s.l = libres;
  const fonctions = {
    accueilResume: accueilResume,
    tresorerieDonnees: tresorerieDonnees, tresorerieAjouter: tresorerieAjouter, tresorerieModifier: tresorerieModifier, tresorerieSupprimer: tresorerieSupprimer,
    coopDonnees: coopDonnees, coopEnregistrer: coopEnregistrer, coopAcheter: coopAcheter, coopAnnulerAchat: coopAnnulerAchat, coopPayer: coopPayer,
    coopSupprimer: coopSupprimer, coopCatalogueEnregistrer: coopCatalogueEnregistrer, coopPdf: coopPdf,
    secretariatInfos: secretariatInfos, secretariatGenerer: secretariatGenerer, secretariatOrdreDuJour: secretariatOrdreDuJour, secretariatCompteRendu: secretariatCompteRendu,
    presencesDonnees: presencesDonnees, presencesEnregistrerMembres: presencesEnregistrerMembres, presencesCopierMembres: presencesCopierMembres,
    presencesEnregistrerReunion: presencesEnregistrerReunion, presencesSupprimerReunion: presencesSupprimerReunion, presencesDefinirDistinction: presencesDefinirDistinction,
    progressionDonnees: progressionDonnees, progressionEnregistrer: progressionEnregistrer, progressionBadgeEnregistrer: progressionBadgeEnregistrer, progressionBadgeSupprimer: progressionBadgeSupprimer,
    cuisineRecettes: cuisineRecettes, cuisineEnregistrer: cuisineEnregistrer, cuisineSupprimer: cuisineSupprimer,
    inventaireDonnees: inventaireDonnees, inventaireMettreAJour: inventaireMettreAJour, inventaireMouvement: inventaireMouvement, inventaireSupprimer: inventaireSupprimer, inventaireRenommerListe: inventaireRenommerListe,
    boisDonnees: boisDonnees, boisAjouter: boisAjouter, boisMouvement: boisMouvement, boisModifier: boisModifier, boisSupprimer: boisSupprimer,
    photoDonnees: photoDonnees, photoEnregistrer: photoEnregistrer, photoCocher: photoCocher, photoSupprimer: photoSupprimer, couvertureRessources: couvertureRessources,
    animationDonnees: animationDonnees, animationEnregistrer: animationEnregistrer, animationSupprimer: animationSupprimer,
    veilleeEnregistrer: veilleeEnregistrer, veilleeSupprimer: veilleeSupprimer, veilleePdf: veilleePdf, uniteChecklist: uniteChecklist,
    emplacementsDonnees: emplacementsDonnees, emplacementsLier: emplacementsLier, emplacementEnregistrer: emplacementEnregistrer, emplacementSupprimer: emplacementSupprimer,
    emplacementCampAjouter: emplacementCampAjouter, emplacementCampSupprimer: emplacementCampSupprimer,
    uniteDonnees: uniteDonnees, adminDonnees: adminDonnees, adminEnregistrerCompte: adminEnregistrerCompte, adminDefinirLibre: adminDefinirLibre, adminDefinirDossier: adminDefinirDossier
  };
  if (!Object.prototype.hasOwnProperty.call(fonctions, String(nom))) throw new Error('Fonction inconnue.');
  SESSION_ = s; ENTREE_ = false;
  return fonctions[String(nom)].apply(null, Array.isArray(args) ? args : []);
}

/* ---------------------------------------------------------------------
 *  Administration : comptes et dossiers des unités
 * --------------------------------------------------------------------- */

function adminDonnees() {
  maitriseSeulement_();
  acces_('admin');
  const c = comptes_();
  const ligne = function (cle, libelle) { return { cle: cle, libelle: libelle, utilisateur: cle === 'joker' ? '' : c.c[cle].u, parDefaut: !!c.c[cle].d, modifie: c.c[cle].m || '', joker: cle === 'joker',
    libreTravail: cle !== 'admin' && cle !== 'joker' && libreTravail_(c, cle), libreSuivi: cle !== 'admin' && cle !== 'joker' && libreSuivi_(c, cle) }; };
  return {
    comptes: [ligne('admin', 'Administrateur')].concat(SECTIONS_MAITRISE.map(function (x) { return ligne(x[0], x[1]); })).concat([ligne('joker', 'Clé joker')]),
    motDePasseMin: MDP_MIN, jokerMin: JOKER_MIN,
    unites: MAITRISE.UNITES.map(function (u) { const r = infoUnite_(u, true); return { cle: u.cle, nom: u.nom, trouve: !!r.info, chemin: r.chemin, url: r.url, message: r.message, force: r.force }; }),
    annee: anneeDossier_(dossierGroupe_()) || '',
    sessionHeures: Math.max(1, Number(MAITRISE.SESSION_HEURES) || 12)
  };
}

const MDP_MIN = 6;       // longueur minimale d'un mot de passe
const JOKER_MIN = 8;     // la clé joker s'utilise avec n'importe quel nom d'utilisateur : elle doit être plus longue

/**
 * Change l'utilisateur et / ou le mot de passe d'un compte (mot de passe vide = inchangé), ou la clé joker (cle = 'joker').
 * Tout le monde devra se reconnecter, sauf l'administrateur qui fait le changement.
 */
function adminEnregistrerCompte(cle, utilisateur, motDePasse) {
  maitriseSeulement_();
  acces_('admin');
  cle = texte_(cle);
  if (clesComptes_().indexOf(cle) < 0) throw new Error('Compte inconnu.');
  const joker = cle === 'joker';
  const u = joker ? 'joker' : texte_(utilisateur), p = String(motDePasse == null ? '' : motDePasse);
  const session = avecVerrou_(function () {
    const c = comptes_();
    const autres = clesComptes_().filter(function (k) { return k !== cle; });
    const memeMdp = function (k) { return empreinte_(c.c[k].s, p) === c.c[k].h; };
    if (!joker && !/^[A-Za-z0-9._@-]{3,30}$/.test(u)) throw new Error('Nom d\'utilisateur : 3 à 30 caractères, lettres sans accent, chiffres, point, tiret ou _.');
    if (joker && p === '') throw new Error('Tapez la nouvelle clé joker.');
    const min = joker ? JOKER_MIN : MDP_MIN;
    if (p !== '' && (p.length < min || p.length > 60)) throw new Error((joker ? 'Clé joker' : 'Mot de passe') + ' : ' + min + ' à 60 caractères.');
    if (p !== '' && p !== p.trim()) throw new Error('Le mot de passe ne doit pas commencer ou finir par un espace.');
    if (joker) {
      if (memeMdp('joker')) throw new Error('C\'est déjà la clé joker.');
      if (autres.some(memeMdp)) throw new Error('Cette clé est déjà le mot de passe d\'un compte : choisissez-en une autre.');
    } else {
      if (p !== '' && memeMdp('joker')) throw new Error('Ce mot de passe est la clé joker : choisissez-en un autre.');
      const autreAdmin = cle === 'admin' ? SECTIONS_MAITRISE.map(function (x) { return x[0]; }) : ['admin'];
      if (autreAdmin.some(function (k) { return norm_(c.c[k].u) === norm_(u); })) throw new Error('Le compte administrateur doit avoir un nom d\'utilisateur différent de ceux des sections.');
      if (p === '' && norm_(u) === norm_(c.c[cle].u)) throw new Error('Rien à modifier : changez le nom d\'utilisateur ou tapez un nouveau mot de passe.');
    }
    if (p === '') { c.c[cle].u = u; c.c[cle].m = dateHeure_(new Date()); }
    else {
      const depart = joker ? String(MAITRISE.CLE_JOKER || '') : departCompte_(cle).motDePasse;
      const avant = c.c[cle];
      c.c[cle] = nouveauCompte_(u, p, false);
      ['l', 'lp', 'ls'].forEach(function (k) { if (avant[k] === true || avant[k] === false) c.c[cle][k] = avant[k]; });   // ce qui s'ouvre sans mot de passe ne change pas
      c.c[cle].d = p === depart;            // remis au mot de passe de départ : l'avertissement reste affiché
      c.c[cle].m = dateHeure_(new Date());
    }
    c.v = Math.max(Date.now(), (Number(c.v) || 0) + 1);
    // l'administrateur reste connecté avec un nouveau jeton (préparé AVANT d'enregistrer) ; les autres sessions ne sont plus valables
    const toutes = SECTIONS_MAITRISE.map(function (x) { return x[0]; }), nomAdmin = c.c.admin.u, par = {};
    toutes.forEach(function (k) { par[k] = nomAdmin; });
    const s = { s: toutes, a: true, e: SESSION_.e, v: c.v, n: nomAdmin, p: par };
    const etat = etatSession_(s, c);
    PropertiesService.getScriptProperties().setProperty('COMPTES', JSON.stringify(c));
    SESSION_ = s;
    return etat;
  });
  // le changement est enregistré : une panne de Drive pendant la relecture ne doit pas le faire passer pour un échec
  let donnees = null;
  try { donnees = adminDonnees(); } catch (e) { donnees = null; }
  return { session: session, donnees: donnees };
}

/**
 * Ouvre une section sans mot de passe (libre = true) ou la referme (false). Le compte de la section est gardé :
 * il resservira quand elle sera refermée. Impossible pour l'administration.
 */
function adminDefinirLibre(cle, portee, libre) {
  maitriseSeulement_();
  acces_('admin');
  cle = texte_(cle);
  if (!SECTIONS_MAITRISE.some(function (x) { return x[0] === cle; })) throw new Error('Seule une section peut être ouverte sans mot de passe.');
  if (portee !== 'travail' && portee !== 'suivi') throw new Error('Choix invalide.');
  if (libre !== true && libre !== false) throw new Error('Choix invalide.');
  const libres = avecVerrou_(function () {
    const c = comptes_();
    const x = c.c[cle];
    // on fige les deux réglages (l'ancien « l » disparaît) avant de changer celui demandé
    x.lp = libreTravail_(c, cle); x.ls = libreSuivi_(c, cle); delete x.l;
    x[portee === 'travail' ? 'lp' : 'ls'] = libre;
    PropertiesService.getScriptProperties().setProperty('COMPTES', JSON.stringify(c));
    return libres_(c);
  });
  // le choix est enregistré : une panne de Drive pendant la relecture ne doit pas le faire passer pour un échec
  let donnees = null;
  try { donnees = adminDonnees(); } catch (e) { donnees = null; }
  return { libres: libres, donnees: donnees };
}

/** Force le dossier d'une unité (lien ou identifiant Drive du dossier « Utilities » ou « Info » de l'unité ; vide = automatique). */
function adminDefinirDossier(cle, lien) {
  maitriseSeulement_();
  acces_('admin');
  const u = MAITRISE.UNITES.filter(function (x) { return x.cle === texte_(cle); })[0];
  if (!u) throw new Error('Unité inconnue.');
  const brut = texte_(lien);
  let id = '';
  if (brut) {
    const m = /\/folders\/([A-Za-z0-9_-]{10,})/.exec(brut) || /[?&]id=([A-Za-z0-9_-]{10,})/.exec(brut) || /^([A-Za-z0-9_-]{10,})$/.exec(brut);
    if (!m) throw new Error('Collez le lien du dossier Drive (il contient « /folders/… »).');
    id = m[1];
    try { DriveApp.getFolderById(id).getName(); } catch (e) { throw new Error('Ce dossier est introuvable ou inaccessible avec le compte qui exécute l\'application.'); }
  }
  return avecVerrou_(function () {
    const props = PropertiesService.getScriptProperties();
    let o = {};
    try { o = JSON.parse(props.getProperty('DOSSIERS_UNITES') || '{}') || {}; } catch (e) { o = {}; }
    if (id) o[u.cle] = id; else delete o[u.cle];
    props.setProperty('DOSSIERS_UNITES', JSON.stringify(o));
    try { CacheService.getScriptCache().remove('INFO_UNITE_' + u.cle); } catch (e) { /* rien */ }
    return adminDonnees();
  });
}

/* ---------------------------------------------------------------------
 *  Lecture des unités (Meute, Troupe, Clan) — strictement en lecture seule
 * --------------------------------------------------------------------- */

/** Objets « vides » rendus en lecture d'unité quand un dossier, un fichier ou un onglet n'existe pas encore. */
const VIDE_ = {
  iter: { hasNext: function () { return false; }, next: function () { return null; } },
  dossier: function (nom) {
    return { absent: true, getName: function () { return nom; }, getUrl: function () { return ''; }, getId: function () { return ''; },
      getFolders: function () { return VIDE_.iter; }, getFiles: function () { return VIDE_.iter; }, getFilesByType: function () { return VIDE_.iter; } };
  },
  classeur: { absent: true, getSheetByName: function () { return null; }, getSheets: function () { return []; }, getUrl: function () { return ''; }, getId: function () { return ''; } },
  feuille: { absent: true, getLastRow: function () { return 0; }, getLastColumn: function () { return 0; }, getSheetId: function () { return 0; }, getName: function () { return ''; } }
};

function sousDossier_(parent, nom) {
  const n = norm_(nom);
  const it = parent.getFolders();
  while (it.hasNext()) { const f = it.next(); if (!f.isTrashed() && norm_(f.getName()) === n) return f; }
  return null;
}

/** Dossier du groupe (« Groupe Scout Exemple ») : on remonte depuis le dossier du programme. */
function dossierGroupe_() {
  const noms = [].concat(MAITRISE.DOSSIER_GROUPE).map(norm_);
  let d = null;
  try { d = racine_(); } catch (e) { d = null; }
  for (let i = 0; i < 8 && d; i++) {
    if (noms.indexOf(norm_(d.getName())) >= 0) return d;
    const p = d.getParents();
    d = p.hasNext() ? p.next() : null;
  }
  const liste = [].concat(MAITRISE.DOSSIER_GROUPE);
  for (let i = 0; i < liste.length; i++) {
    const it = DriveApp.getFoldersByName(liste[i]);
    while (it.hasNext()) { const f = it.next(); if (!f.isTrashed()) return f; }
  }
  return null;
}

function anneeScoute_() {
  const y = Number(Utilities.formatDate(new Date(), tz_(), 'yyyy')), m = Number(Utilities.formatDate(new Date(), tz_(), 'M'));
  return m >= 9 ? y + '-' + (y + 1) : (y - 1) + '-' + y;
}
/** Nom du dossier de l'année : MAITRISE.ANNEE, sinon l'année scoute en cours si son dossier existe, sinon la plus récente. */
function anneeDossier_(groupe) {
  if (texte_(MAITRISE.ANNEE)) return texte_(MAITRISE.ANNEE);
  if (!groupe) return '';
  const annees = [];
  const it = groupe.getFolders();
  while (it.hasNext()) { const f = it.next(); if (!f.isTrashed() && /^\d{4}\s*[-–]\s*\d{4}$/.test(f.getName().trim())) annees.push(f.getName().trim()); }
  if (!annees.length) return '';
  const courante = anneeScoute_();
  const cle = function (a) { return a.replace(/\s/g, '').replace('–', '-'); };
  return annees.filter(function (a) { return cle(a) === courante; })[0] || annees.sort(function (a, b) { return cle(a).localeCompare(cle(b)); }).pop();
}

/** Dossier de données d'un dossier d'unité : son sous-dossier « Info », ou lui-même s'il contient directement les données. */
function infoDans_(dossier) {
  if (norm_(dossier.getName()) === norm_(CONFIG.DOSSIER_INFO)) return dossier;
  const info = sousDossier_(dossier, CONFIG.DOSSIER_INFO);
  if (info) return info;
  const connus = Object.keys(CONFIG.DOSSIERS).map(function (k) { return norm_(CONFIG.DOSSIERS[k]); });
  const it = dossier.getFolders();
  while (it.hasNext()) { const f = it.next(); if (!f.isTrashed() && connus.indexOf(norm_(f.getName())) >= 0) return dossier; }
  return null;
}

/**
 * Trouve le dossier « Info » d'une unité. Retourne { info, chemin, url, message, force }.
 * Ordre : dossier forcé dans l'administration, puis mémoire (30 min), puis le chemin Drive de MAITRISE.UNITES.
 */
function infoUnite_(u, sansMemoire) {
  const r = { info: null, chemin: '', url: '', message: '', force: false };
  let forces = {};
  try { forces = JSON.parse(PropertiesService.getScriptProperties().getProperty('DOSSIERS_UNITES') || '{}') || {}; } catch (e) { forces = {}; }
  if (forces[u.cle]) {
    r.force = true;
    try {
      const d = DriveApp.getFolderById(forces[u.cle]);
      r.chemin = 'Dossier choisi dans l\'administration : ' + d.getName(); r.url = d.getUrl();
      r.info = infoDans_(d);
      if (!r.info) r.message = 'Ce dossier ne contient pas encore de dossier « ' + CONFIG.DOSSIER_INFO + ' ».';
    } catch (e) { r.message = 'Le dossier choisi dans l\'administration est introuvable ou inaccessible.'; }
    return r;
  }
  const cache = CacheService.getScriptCache();
  if (!sansMemoire) {
    const id = cache.get('INFO_UNITE_' + u.cle);
    if (id) { try { const d = DriveApp.getFolderById(id); if (!d.isTrashed()) { r.info = d; r.url = d.getUrl(); return r; } } catch (e) { /* on recherche de nouveau */ } }
  }
  const groupe = dossierGroupe_();
  const racineNom = [].concat(MAITRISE.DOSSIER_GROUPE)[0];
  if (!groupe) { r.chemin = racineNom; r.message = 'Le dossier « ' + racineNom + ' » est introuvable au-dessus du dossier du programme.'; return r; }
  const annee = anneeDossier_(groupe);
  let d = groupe;
  const fait = [groupe.getName()];
  const etapes = u.chemin.map(function (x) { return x === '{ANNEE}' ? annee : x; });
  for (let i = 0; i < etapes.length; i++) {
    const suivant = etapes[i] ? sousDossier_(d, etapes[i]) : null;
    if (!suivant) {
      r.chemin = fait.join(' › '); r.url = d.getUrl();
      r.message = etapes[i] ? 'Le dossier « ' + etapes[i] + ' » est introuvable dans « ' + d.getName() + ' ».' : 'Aucun dossier d\'année (ex. 2026-2027) dans « ' + d.getName() + ' ».';
      return r;
    }
    d = suivant; fait.push(d.getName());
  }
  r.chemin = fait.join(' › '); r.url = d.getUrl();
  r.info = infoDans_(d);
  if (!r.info) r.message = 'Le dossier « ' + CONFIG.DOSSIER_INFO + ' » n\'existe pas encore dans « ' + d.getName() + ' » : l\'unité n\'a pas encore ouvert son application.';
  else { try { cache.put('INFO_UNITE_' + u.cle, r.info.getId(), 1800); } catch (e) { /* rien */ } }
  return r;
}

/**
 * Données d'une unité pour une section, en lecture seule.
 * quoi : caisse · presences (annee, trimestre facultatifs) · progression · recettes · materiel · bois · pharmacie · photo · animation
 * Retourne { unite, annee?, donnees } ou { unite, introuvable: true, message }.
 */
function uniteDonnees(cle, quoi, p1, p2) {
  maitriseSeulement_();
  if (!SESSION_ && !ENTREE_) throw new Error('Connexion requise.');
  const sections = { caisse: 'tresorier', cotisation: 'tresorier', sante: 'secouriste', presences: 'secretaire', progression: 'secretaire', recettes: 'cuisinier', materiel: 'materiel', bois: 'materiel', pharmacie: 'secouriste', photo: 'photographe', animation: 'animateur' };
  quoi = texte_(quoi);
  if (typeof quoi !== 'string' || !Object.prototype.hasOwnProperty.call(sections, quoi)) throw new Error('Demande inconnue.');
  acces_('suivi:' + sections[quoi]);
  const u = MAITRISE.UNITES.filter(function (x) { return x.cle === texte_(cle); })[0];
  if (!u) throw new Error('Unité inconnue.');
  const base = { unite: { cle: u.cle, nom: u.nom }, quoi: quoi };
  const r = infoUnite_(u, false);
  if (!r.info) return Object.assign(base, { introuvable: true, message: r.message || 'Dossier de l\'unité introuvable.' });
  if (quoi === 'bois' && !u.profil.LOCAL_DES_BOIS) return Object.assign(base, { introuvable: true, message: 'Cette unité n\'a pas de local des bois.' });
  if (quoi === 'progression' && !u.profil.PROGRESSION) return Object.assign(base, { introuvable: true, message: 'Cette unité n\'a pas de progression.' });
  CTX_ = { info: r.info, reglages: Object.assign({}, REGLAGES, u.profil), manquants: [] };
  try {
    let d;
    if (quoi === 'caisse') d = tresorerieDonnees();
    else if (quoi === 'cotisation') d = cotisationDonnees(p1);
    else if (quoi === 'sante') d = santeDonnees();            // lecture seule : la feuille Google Forms de l'unité
    else if (quoi === 'recettes') d = cuisineRecettes();
    else if (quoi === 'materiel') d = inventaireDonnees('materiel');
    else if (quoi === 'pharmacie') d = inventaireDonnees('pharmacie');
    else if (quoi === 'bois') d = boisDonnees();
    else if (quoi === 'photo') d = photoDonnees();            // modifiable depuis le suivi : voir uniteChecklist()
    else if (quoi === 'animation') d = animationDonnees();
    else if (quoi === 'progression') d = progressionDonnees();
    else {
      let a = texte_(p1), t = Number(p2);
      if (!a || [1, 2, 3].indexOf(t) < 0) {      // par défaut : le dernier trimestre qui a une réunion
        const per = periodeProgression_(feuillesPresences_());
        a = per ? per.annee : anneeScoute_(); t = per ? per.trimestre : 1;
      }
      d = presencesDonnees(a, t);
    }
    return Object.assign(base, { donnees: d, manquants: CTX_.manquants });
  } finally { CTX_ = null; }
}

/* =====================================================================
 *  RACCOURCI « OUVRIR LE PROGRAMME » (Google Doc avec lien)
 * ===================================================================== */

function assurerRaccourci_() {
  const url = ScriptApp.getService().getUrl();
  if (!url || /\/dev$/.test(url)) return;
  const props = PropertiesService.getScriptProperties();
  const cle = url + '|' + CONFIG.FICHIERS.RACCOURCI;
  if (props.getProperty('RACCOURCI_URL') === cle) return;
  creerRaccourci_(url);
  props.setProperty('RACCOURCI_URL', cle);
}

function creerRaccourci_(url) {
  const dossier = racine_();
  let ex = fichierParNom_(dossier, CONFIG.FICHIERS.RACCOURCI, MimeType.GOOGLE_DOCS);
  if (!ex) { // ancien lanceur (autre nom de groupe) : on le renomme au lieu d'en créer un deuxième
    const it = dossier.getFilesByType(MimeType.GOOGLE_DOCS);
    while (it.hasNext()) { const f = it.next(); if (!f.isTrashed() && norm_(f.getName()).indexOf(norm_('▶ OUVRIR')) === 0) { ex = f.setName(CONFIG.FICHIERS.RACCOURCI); break; } }
  }
  let doc;
  if (ex) doc = DocumentApp.openById(ex.getId());
  else {
    doc = DocumentApp.create(CONFIG.FICHIERS.RACCOURCI);
    DriveApp.getFileById(doc.getId()).moveTo(dossier);
  }
  const C = DocumentApp.HorizontalAlignment.CENTER;
  const b = doc.getBody();
  b.clear();
  const p0 = b.getParagraphs()[0];
  try { p0.appendInlineImage(iconeBlob_()).setWidth(110).setHeight(110); } catch (e) { /* sans icône */ }
  p0.setAlignment(C);
  b.appendParagraph(REGLAGES.NOM_APP).setHeading(DocumentApp.ParagraphHeading.TITLE).setAlignment(C)
    .editAsText().setForegroundColor(COULEUR_ENTETE).setBold(true);
  b.appendParagraph(REGLAGES.NOM + ' · ' + REGLAGES.GROUPE).setAlignment(C)
    .editAsText().setFontSize(13).setForegroundColor('#7A5230');
  b.appendParagraph('');
  const lien = b.appendParagraph('▶  CLIQUEZ ICI POUR OUVRIR ' + REGLAGES.NOM_APP.toUpperCase()).setAlignment(C);
  lien.editAsText().setLinkUrl(url).setFontSize(22).setBold(true).setForegroundColor('#C8161D');
  b.appendParagraph('');
  b.appendParagraph('Trésorier · Secrétaire · Cuisinier · Matériel & Intendance · Secouriste · Photographe · Animateur').setAlignment(C)
    .editAsText().setFontSize(11).setForegroundColor('#1F4D33');
  b.appendParagraph('Lien direct : ' + url).setAlignment(C)
    .editAsText().setFontSize(8).setForegroundColor('#8A7A68');
  doc.saveAndClose();
}

function iconeBlob_() {
  const data = include('Icone').trim();
  return Utilities.newBlob(Utilities.base64Decode(data.substring(data.indexOf(',') + 1)), 'image/png', 'icone.png');
}

function logoBlob_() {
  const data = include('Logo').trim();
  return Utilities.newBlob(Utilities.base64Decode(data.substring(data.indexOf(',') + 1)), 'image/png', 'logo.png');
}

/* =====================================================================
 *  OUTILS DRIVE / SHEETS
 * ===================================================================== */

let RACINE_ = null, INFO_ = null;

/** Dossier du groupe : contient « OUVRIR LE PROGRAMME » et le dossier Info. */
function racine_() {
  if (RACINE_) return RACINE_;
  if (CONFIG.DOSSIER_RACINE_ID) return (RACINE_ = DriveApp.getFolderById(CONFIG.DOSSIER_RACINE_ID));
  const parents = DriveApp.getFileById(ScriptApp.getScriptId()).getParents();
  if (!parents.hasNext()) throw new Error('Impossible de trouver le dossier du programme. Renseignez CONFIG.DOSSIER_RACINE_ID dans Code.gs.');
  let d = parents.next();
  // Si le script est rangé dans « Info », le dossier du groupe est le dossier au-dessus.
  if (norm_(d.getName()) === norm_(CONFIG.DOSSIER_INFO)) {
    const gp = d.getParents();
    if (gp.hasNext()) d = gp.next();
  }
  return (RACINE_ = d);
}

/** Dossier « Info » : toutes les données du programme. */
function info_() {
  if (CTX_) return CTX_.info;            // lecture d'une unité
  if (INFO_) return INFO_;
  INFO_ = dossier_(racine_(), CONFIG.DOSSIER_INFO);
  migrerVersInfo_(false);
  return INFO_;
}

/** Dossier « Info/Secretariat » : modèle + fiches d'activité générées. */
function secretariat_() { return dossier_(info_(), CONFIG.DOSSIERS.SECRETARIAT); }

/**
 * Ancienne organisation (données directement dans le dossier du groupe) :
 * déplace automatiquement les dossiers / fichiers dans « Info ». Une seule fois.
 */
function migrerVersInfo_(forcer) {
  const props = PropertiesService.getScriptProperties();
  if (!forcer && props.getProperty('MIGRATION_INFO_OK')) return;
  const racine = racine_(), info = INFO_ || dossier_(racine, CONFIG.DOSSIER_INFO);
  const aDeplacer = [CONFIG.DOSSIERS.TRESORERIE, CONFIG.DOSSIERS.CUISINE, CONFIG.DOSSIERS.MATERIEL,
    CONFIG.DOSSIERS.SECOURISME, CONFIG.DOSSIERS.SECRETARIAT].map(norm_);
  const dejaDansInfo = {};
  const itI = info.getFolders();
  while (itI.hasNext()) { const f = itI.next(); if (!f.isTrashed()) dejaDansInfo[norm_(f.getName())] = true; }
  const itR = racine.getFolders();
  const dossiers = [];
  while (itR.hasNext()) dossiers.push(itR.next());
  dossiers.forEach(function (f) {
    const n = norm_(f.getName());
    if (!f.isTrashed() && aDeplacer.indexOf(n) >= 0 && !dejaDansInfo[n]) f.moveTo(info);
  });
  // Modèle et fiches d'activité laissés dans le dossier du groupe
  let secr = null;
  const itF = racine.getFiles();
  const fichiers = [];
  while (itF.hasNext()) fichiers.push(itF.next());
  fichiers.forEach(function (f) {
    if (f.isTrashed()) return;
    const n = norm_(f.getName());
    if (n === norm_(CONFIG.FICHIERS.MODELE_FICHE) || n.indexOf('fiche activite') === 0) {
      secr = secr || dossier_(info, CONFIG.DOSSIERS.SECRETARIAT);
      f.moveTo(secr);
    }
  });
  props.setProperty('MIGRATION_INFO_OK', '1');
}

function dossier_(parent, nom) {
  const n = norm_(nom);
  const it = parent.getFolders();
  while (it.hasNext()) {
    const f = it.next();
    if (!f.isTrashed() && norm_(f.getName()) === n) return f;
  }
  if (CTX_) { CTX_.manquants.push(nom); return VIDE_.dossier(nom); }   // lecture d'une unité : on ne crée rien
  return parent.createFolder(nom);
}

function fichierParNom_(dossier, nom, mime) {
  const n = norm_(nom);
  const it = dossier.getFilesByType(mime);
  while (it.hasNext()) {
    const f = it.next();
    if (!f.isTrashed() && norm_(f.getName()) === n) return f;
  }
  return null;
}

function classeur_(dossier, nom) {
  const n = norm_(nom);
  let conflit = null;
  const it = dossier.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (f.isTrashed()) continue;
    if (norm_(f.getName().replace(/\.(xlsx|xlsm|xls|ods|csv)$/i, '')) !== n) continue;
    if (f.getMimeType() === MimeType.GOOGLE_SHEETS) return SpreadsheetApp.openById(f.getId());
    conflit = f;
  }
  if (conflit) {
    throw new Error('Le fichier « ' + conflit.getName() + ' » (dossier « ' + dossier.getName() + ' ») est un fichier Excel. ' +
      'Ouvrez-le dans Drive, faites Fichier › Enregistrer au format Google Sheets, puis renommez ou supprimez l\'original Excel.');
  }
  if (CTX_) { CTX_.manquants.push(nom); return VIDE_.classeur; }        // lecture d'une unité : on ne crée rien
  const ss = SpreadsheetApp.create(nom);
  DriveApp.getFileById(ss.getId()).moveTo(dossier);
  return ss;
}

function feuille_(ss, nom, entetes, opts) {
  opts = opts || {};
  let sh = ss.getSheetByName(nom);
  if (CTX_) return sh && sh.getLastRow() > 0 ? sh : VIDE_.feuille;       // lecture d'une unité : ni création ni en-tête ajouté
  if (!sh) {
    const toutes = ss.getSheets();
    const vierge = toutes.length === 1 && toutes[0].getLastRow() === 0 &&
      /^(sheet|feuille|feuil|hoja|tabelle)\s*1$/i.test(toutes[0].getName());
    sh = vierge ? toutes[0].setName(nom) : ss.insertSheet(nom);
  }
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, entetes.length).setValues([entetes])
      .setFontWeight('bold').setFontColor('#FFFFFF').setBackground(COULEUR_ENTETE).setVerticalAlignment('middle');
    sh.setFrozenRows(1);
    sh.setRowHeight(1, 30);
    (opts.largeurs || []).forEach(function (w, i) { if (w) sh.setColumnWidth(i + 1, w); });
    Object.keys(opts.formats || {}).forEach(function (nomCol) {
      const i = entetes.indexOf(nomCol);
      if (i >= 0 && sh.getMaxRows() > 1) sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1).setNumberFormat(opts.formats[nomCol]);
    });
    if (opts.cacherId && entetes[0] === 'ID') sh.hideColumns(1);
  } else {
    const h = entetes_(sh);
    const manquants = entetes.filter(function (x) { return h.indexOf(x) < 0; });
    if (manquants.length) {
      sh.getRange(1, h.length + 1, 1, manquants.length).setValues([manquants])
        .setFontWeight('bold').setFontColor('#FFFFFF').setBackground(COULEUR_ENTETE);
    }
  }
  return sh;
}

function entetes_(sh) {
  const n = sh.getLastColumn();
  if (!n) return [];
  return sh.getRange(1, 1, 1, n).getValues()[0].map(function (x) { return String(x).trim(); });
}

function lignes_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  const h = entetes_(sh);
  return sh.getRange(2, 1, last - 1, h.length).getValues().map(function (r, i) {
    const o = { _row: i + 2 };
    h.forEach(function (k, j) { if (k) o[k] = r[j]; });
    return o;
  }).filter(function (o) {
    return h.some(function (k) { return k && k !== 'ID' && String(o[k]).trim() !== ''; });
  });
}

function assurerIds_(sh) {
  if (CTX_) return;                      // lecture d'une unité : aucune écriture
  const h = entetes_(sh);
  const c = h.indexOf('ID');
  const last = sh.getLastRow();
  if (c < 0 || last < 2) return;
  const all = sh.getRange(2, 1, last - 1, h.length).getValues();
  let change = false;
  const ids = all.map(function (r) {
    const plein = r.some(function (v, j) { return j !== c && String(v).trim() !== ''; });
    if (plein && String(r[c]).trim() === '') { change = true; return [id_()]; }
    return [r[c]];
  });
  if (change) sh.getRange(2, c + 1, ids.length, 1).setValues(ids);
}

function ajouter_(sh, obj) {
  const h = entetes_(sh);
  const row = h.map(function (k) { return obj[k] === undefined || obj[k] === null ? '' : cellule_(obj[k]); });
  const ligne = sh.getLastRow() + 1;
  sh.getRange(ligne, 1, 1, h.length).setValues([row]);
  return ligne;
}

function ajouterLignes_(sh, rows) {
  if (!rows.length) return;
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length)
    .setValues(rows.map(function (r) { return r.map(cellule_); }));
}

function maj_(sh, ligne, obj) {
  const h = entetes_(sh);
  const range = sh.getRange(ligne, 1, 1, h.length);
  const cur = range.getValues()[0];
  h.forEach(function (k, j) { if (obj[k] !== undefined) cur[j] = obj[k] === null ? '' : obj[k]; });
  range.setValues([cur.map(cellule_)]);
}

function trouver_(sh, id) {
  if (!id) return null;
  return lignes_(sh).filter(function (o) { return String(o['ID']) === String(id); })[0] || null;
}

function avecVerrou_(fn) {
  if (CTX_) throw new Error('Lecture seule : les données d\'une unité ne se modifient pas depuis la Maîtrise.');
  return sousVerrou_(fn);
}
/** Un seul enregistrement à la fois. Un appel imbriqué garde simplement le verrou déjà pris. */
function sousVerrou_(fn) {
  if (VERROU_ > 0) return fn();
  const verrou = LockService.getScriptLock();
  if (!verrou.tryLock(25000)) throw new Error('Quelqu\'un d\'autre enregistre en ce moment. Réessayez dans quelques secondes.');
  VERROU_++;
  try { return fn(); } finally { VERROU_--; verrou.releaseLock(); }
}

/* =====================================================================
 *  OUTILS TEXTE / DATES
 * ===================================================================== */

function tz_() { return Session.getScriptTimeZone() || 'Asia/Beirut'; }
function id_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 10); }
function qui_() {
  if (REGLAGES.MAITRISE && SESSION_) return ((SESSION_.p && SESSION_.p[SECTION_]) || SESSION_.n) + ' · ' + REGLAGES.NOM;   // Maîtrise : le compte qui a ouvert la section
  try { return Session.getActiveUser().getEmail() || ''; } catch (e) { return ''; }
}
function texte_(v) { return v == null ? '' : String(v).trim(); }
function arrondi_(x) { return Math.round(Number(x) * 100) / 100; }
function pad_(n) { return ('0' + n).slice(-2); }

function norm_(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[—–-]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Empêche qu'un texte commençant par = + - @ soit interprété comme formule. */
function cellule_(v) {
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return '\'' + v;
  return v;
}

function natureNorm_(v) {
  const n = norm_(v);
  return (n.indexOf('entr') === 0 || n.indexOf('recet') === 0 || n.indexOf('revenu') === 0) ? 'Entrée' : 'Dépense';
}

function journeeNorm_(v) {
  const n = norm_(v);
  for (let i = 0; i < TYPES_JOURNEE.length; i++) if (norm_(TYPES_JOURNEE[i]) === n) return TYPES_JOURNEE[i];
  return texte_(v) || 'Réunion';
}

function dateVal_(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  return isNaN(d) ? null : d;
}

function dateIso_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  const s = texte_(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = /^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/.exec(s);
  if (m) return m[3] + '-' + pad_(m[2]) + '-' + pad_(m[1]);
  return '';
}

function dateHeure_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd HH:mm');
  return texte_(v);
}

function aujourdhuiIso_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'); }
function isoPlusJours_(n) { return Utilities.formatDate(new Date(Date.now() + n * 86400000), tz_(), 'yyyy-MM-dd'); }

function dateFr_(d) {
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
    'septembre', 'octobre', 'novembre', 'décembre'];
  const j = Number(Utilities.formatDate(d, tz_(), 'u')) % 7; // 1 = lundi … 7 = dimanche
  return jours[j] + ' ' + Number(Utilities.formatDate(d, tz_(), 'd')) + ' ' +
    mois[Number(Utilities.formatDate(d, tz_(), 'M')) - 1] + ' ' + Utilities.formatDate(d, tz_(), 'yyyy');
}

/* =====================================================================
 *  Images du modèle « Compte rendu » (logo des Scouts du Liban à gauche, logo du groupe à droite).
 *  Deux longues lignes de texte codé : ne pas les modifier.
 * ===================================================================== */
const CR_IMAGES = {
  gauche: 'iVBORw0KGgoAAAANSUhEUgAAAI4AAACTCAIAAADX17YaAAAACXBIWXMAAAsSAAALEgHS3X78AAAShUlEQVR42u1deVxTR9c+4WaBsCsEkEWIUC3LJ4hCX1FxwaUEQbRVQAsVlfq6Vqu+bV9F5EOrfm1xaa0EXEAUVBappm64oAIqVrDggiLgwhKEgCyRkO37IxhiIJCELcg8P/64nDkzd2aeO2fOmTs3gxMKhaCSKCab9st9LZmFatpaKtghaoAwQICoQlQhIKoQVQiIKgREFaIKAVGFgKhCVCEgqhCUAl51q0YkyKXG5YGcK85yFqiqwKnsyrqcqJwTzL50UR5NKrsMGUAERBUCogpRhYCoQkBUIaoQBlUIrARIJPOCLIKpsaTsteuMlvyHiCqVAZFIrSsBgCvP73iGfi4W+zvOPnrnEgCUDh890Jv4MaxW6Pw7kDxz8vcXf4vMPNShzphh9tnLjyGqVMPyhTp1qXNv5WkHI2tEVb+hqpFlvnuanMrDdIxLNpwf7HOV/PuWe3DZtJhV9ukeL9F1xPR1K13n4zEMw6lhapiUJl/A5wsEgOuxjhO2tJToWcmjaVX/EofHBrtbQR1iygnPlRLmlheef5bJFfCIavhpI1xdzOwAAFPD2vOHPMC+Rl7F06mHgptamtonhV3ZL/kvI+igxwhXRFU/YHFK2Im8NPn1abHLxdfjzJ0sdE1OzN+OqOpdXHyW7X1sRXdKmEZ12TZtORpVvQuTndNYbJbS2V3MR99cdhQZwL4LoTQIGmY6lLl2s8I9lsMgwMCjqr3LJ4JAIAhKCbvy7GYzn9PC54mERAxPxAge1u5/eP9Hm6SJViv6La5afib8yP1UhbKQCRp3/51oY2CB4qq+wP7shA3ndyuXl819Z7/PBwCMtSnZ38QP0zFEBrBXsPPG0a3pe3ukqMqGKqufZ7SXjzVzzAw5gqjqGYeiVzHO1FY1mz8w3gJXNFT3DU+bJi3dQ9uIDGArGo4ny6+svXBeA6fJ8v+m93atNAlk1pZMoVAoZ/WEXP7HT9WbZWvk1NTfvAkADLZPkOm/Ao4+J9zD2lVfQ1uDoN55aW+bGx9UFG66tC+37B+x8GvnLzZPXmquawQANeG/vN35K3LWlQGVXSZl98hE8q6Z60PGzWuvfP5pVlLBhdzywsLqYp6Ah+EwJ1NbV1N7X7sZEy0dOxvl8cmsbbv4Zb21o72nnHXVpcr09qUKc/2RkTRHk1GMwD8MNPVEcm7p67pfDxpEbsNh2LOaVw57fYQgbxNGm9ie+2o/RWsIALDCf204Es9nMqV0tAIXUg62RQJVId81xiciqjqDydkEjWmTWoOh9FuVc/xBIAAAy8onajraB3OS156NULpwcz3TovXnZKUO2zm1hl0LAPdWnLZ+zKygzUdUKeqtk6i1xSx2vclO976ZHjjhud1v16BbrTBhnNaYMn7KoWVZL+71GU+scBXyMgYAVTgNDauaohY+t29CKwDYOHFpxPSVTYz0up2/IKrknlQe3SZYms87vu5c4fU+uF3+mjOfGAwHgBIDGyGbPdhDYHlj0i99jWJ/a+SwtRQfTO5WrgCQUXJHUrjAwXOGjRsAvH5bXlJbXlJbDgBW+sM+s3BcPMZbpPPuVk7xjPFotUJeEB3/xyzrPADoR7ixW+R6tM11TXTVtQqYz36a+d16t0VtcdjWsXwh32aoVcHaFGELl/u0GADUqI44HW1MVxsA+PWN/IrKN6v/23DoqIobGNWiajizENPWAgCrn2eV1zPln/9FF55xK9a7LXrl6snNfyCKoPlCPgAUrE0p1qcChwMAgMNZMgtxmmQhl8tvaHxpZj9QHCtVWa7FqatT2WWnSjK1wlxIoU4K8VT+uX8x2bRs8pz9Xj9uTT9gevU0YYSNYfQ+kcIB7y28ciZwOJipGZVdRm16/UcBY3zUV94J32bXl1LZZVR2mX7EZlBr7Qr1ye6UEzEiuegPLSx9AL3/fqe2fpnRT5Pk1B9pOMLW0PJS0e1rS46MNrEpJpsCDkdtek0KdWrcmkPA8HXNDUY7JgHAxcUxE/VtMD0dAFiQuOnMo8vScc8Qi5vLYg3fr4YAwL2yR3uzjp/K/4v5ww31h8XlkzwHaQjc+XNquH1iPadRViqGw6o33yJ/uDLb1PJOk6gBAAXMIuffv2yfK3Xhb77HVynaovurkuwoI2Sl9v0Le9XdW/Goqvjq87u5lYUAMHvkRBczB1kv10mhTsN0jOS3mfKAtTlbk9jZUj3aW9EGWwrVlkKVU7mneCJihIff/mmha4w8wP7HZKrrxa8PAsD14r933TxS1VjlOMx+hcuXzqafImddhdCw9S4RI7znzHky1XkAVX7Af2Gvvc1FIfs2cFs64Klq4XPl1HQwsR3QLR3YVKU9uia/8kD/lHZgUzU/cb38ygWVjxFVCIiqnoZ/4iZE1cBASrsFQERVH0GTqPAnU+MO+A/QxvbYGiAn75GcmiTHnnSaf7i0/9dbhxWrqoyP6RSCUCBo+eeJXMHc6E9xOJwKUdW/4An4PvHr0otuyqP8clO6kdbQAdfGAb+wJPrxbvI8H8axA5Ly0wWXF53q2Im4WZr7hb3H4DWA/UuVlBAzpJjlXMYoBuHXordfOyCVyg77G1MbeJP0x+kB8t9UvbAcXUw23TJ5KSc8V4fUdnjsw7V/DkSe4KNfWS/RNCN7znqTdPMjaMvHH1ex/7pQTDbtrwOhEVWDEYgqRBUCogpRhYCoQkBUDTao7sJSf0VClsxCNW0tNKoQEFWIKgREFQKiClGFgKhCQFQhqhAQVQiIKkQVQh/jI9ldi0YVAqIKAVGFqEJAVCEgqhBVCIgqBEQVogoBUYWAqEJUISCqEBBViKpehIZPDKJKLqrsl5/qxyqGxf/N5QnwNHqPl9z+tap32AUVJOl+UbWRf2wbVQWlLIpfbIeqT17V9SdVi5wBYIKdzN8+z8gvBwA8jV5W06RQyQSvaDyNfv7eS7Hkr5yXXL5ARRiqa+TgaXQ8je6yNoWZENRGlePKJFYDJ/NRpWoO/+u7vWUlTfv+HHF2NAAMDzyuUJlxG6YCwOdjLSSFvG5TtTEm+2petw59ibvyFE+jGyxoHTm3I+eA5K/B8BghxgFxbrbGMABxeP3kueOtDl18olCugCnWAVOspYQ8ngCI3apMZGp+ZGp+9ckgPS2SEtlFpt5Yn1xw8MsPShDKwJmsEvE15hkl7FcQvegPimv64EaYZ9Tbxubul+O0MonH4ytXgan/+bPDpI7dit2nH8yLuNTNJ11kZzPyK7o/aOaMtzpx7VnnOt8fvauMsYq+LSXp/lRF9KLf/20eyTuGrJTj2szjK+ABGuqpA8DVvHKJqVvhHp/ubA4A7g4m3adqhZfd1QddWP+fT+cpWuyeM/mRZ/6R8i27OVuPCD4hEILT6mQA0CAp/Gtjm/3H3HlchafRO3DlhEJhh0MV84zSm3dYPJzXRWX1rw3UmXuok9TfzxYoYaUxzyj3jWmYZ5Th/KMiieeWv2b8yOhmVUsq67uTPeF6EeYZhXlG+Wy7IG0ASd4djNO0rTMb3rWe4TB/EnVfWn7/Og5NzbxOLO3ag5mg4PkEImWRY8lq5IiENBeLK3mvu1lVSyPt7mT3cx/BY4TgcHDuzoukW8UfGMAlM0e1z0BzGS6+drMzAVUF0Ss6PHAc91xI6paZNwsUsNLPyt6K3S0AYDdzAWCSvaq0lHsuhKKn4fdTehtVEzakbfYf03k2Ows95e63P62gV9vztKxOIBSGxuXYLEn0/d+LsxVZa/jErLVRl3fQFrhbszl8ABgxTEe5moQey5H8VyAUCt4P8cZmrnJllh//6gO3IrfozfV/yjvPM0RbHQCyHil28hqBRl9HzxII2ozSqzeNeBr961+uKVppyUIkEXOhNZAqqay/EEHrxEh2CB4jhMcIMdDROJlRZKCrDgAaRDwAJGcWK1ROJYu9IzH3efnb1gHBExC9oole0QCwIzFXb94R5ahiNXAk/8Vp+8awOXweI0RSWlDKclyZZGmkVXQ4QDIu62PgcKBLJtY1tQDAKDO9gqj5HapVsNg6ZIKmOkHpSjqOGHpv37x+bGnnz1PrqEr/abY4BhL/Oa5MAgAxTwBQGhug6D1azi6TegK2BDjzGCFmBvIeOSAUgognPIaTxRMAmAwha6oTAGCVtzLnMcd86y7mCQCYCYFKeNj5f7SdnKqmhuMxQkQ/gm9B0Wo6s6T7PIHoox33jWmZ7YybVC8j9Dtav68SCoUZ+RXbjv/tMcbsh/mOaj1xMAJCr1DVZ6iqe0fR00D9rsxCXV/ejDwnpoUr8HAyuxDhibpepUfVOw5Pe+5hNAsODAOIoDTQjiVEFQKiClE16F1hGv3Wwx7bApScWZKcWQIAwZEZPbVShdf2PfSuhd/jXtnoFUkPX7DE//aS18fm8BrYXCP9ngnULAwV+yHo+0XVLmtTOmzagh2Xe7zVvRJXGfrF1jZwOGeXYWq9u+oRl/501YFbKuj990aVujCA+aWsw5cKFS20toETGuCsKE9Vde8OXyqsZ7cgayxGeU2TuP9ljqrsx8yJG9IAwNZCP2RvhvhJaeHxyT6Hunx8Lvz9KnShc8d2JjC+vIYtmb3wdZ3dN617rSXvBe9fSUjeBU+jD9VRZyYEiucA8QWPEfLm7TuTgGNyPt0bY7IjU/PbT1rnIzynO5lJSqoSg4ZoS2/qG2Nt0MnM52xjeGePr1QNpzmaXtxOk1QTXxsPIb8+tggAxq5JyXte/dkoo9tPmOI+4TFCZFI1cUPalZ1e7g7DxIXu/zN/tbcD2ecQkYCxO13YJ5Pwdwurxq5Oubd/rqS8ur7Z2D9Oh0yQ7EG+QGj3zSlfN6vTP05vtZ8LYvE0epc2hMcICdl34/DFJ5KaJgHHKLrq5Se6fpEh6qZru7wn2htDL7+mEtUwPbds1maGZNPEF3WNHIMFsXHpTwM9PhFJhuiQJJ9X00XHOjaAn32bAgBingDAZSRlXVS26Nrb1bLzmtWnBKuTsLziajyN/uWOtrPIjf3jyOp41unFH/DqEwMAYp4A4M3JIACIv/pMuX5Z+nnXR0QT3g9WEU99Aw8nU1Hvq3tHSyWJdtEGR14XD9Y/t84Sp+qQiVyeoGOq7j2rhg/fN94trBIl+U22Trr13MgvrvNqNaYs4TFCNNXxqZklpNnRAMCsZQNAfXKwlCZfILSgdOB6yfNe/35RtZRkgr3xjsT7IxYndJ5RCNCQEiwr1UiP3H1iXEZSOpTvXzGBxxeKJ3Xq4gRRD3dSlGgzgUwDaKJPfhW/qL08fuPUsIXOo5adxNPobnYmGbtnd3KPt8nBJ64VBf589X5RdZPs3SDjP+2xR/v6Lu8HxTXOq5PxNLqX6/AzoTNlaSqxn1IKyn0zMur99hunlUn5pazgmSPpa9zlscAdjyp7yyEVtWxZeayH6fIYIdd3e2c+rOBwu9h5Itq/H3X+8UR7E5FRbq+TmFHUXuhIVfLs8tHUoTxGSETQuHN3XvBl9+bz8nqZY06+Jez8ElZnA1dGIVve723KL2XxGCEinpR31vN+/wIAhgd19g2M6IOn6recLuatphYA2OznBAAkoprBgtiWD/dkZ0XOkcpS+LoOAG787NNl7b1cLWQlfT/fCQBk7HQCdSI2clmirLxZj3tg2SLn6ZsOY/bbj5n0tZOUD4FFu1MBoKi8HgBWeNm+iFs4PPA4nkafYGc8180KAL72GKmjSTxxvYhEwB6/rA2LvwcApu32tFTWsjMfMc2GauYVV4cey6mp55gbapobagFAU+pSmyUJIl9/prO5u4NJwBQbl08oRLwanka/EEHzcDLdl1awnp7lZG1AJuEB4PYe38++TQ07dm/mWPP19Oycp1WS9wpbODbixH08jb7Zf4yD1dB5blYnM57j8Wr3i97sOpWHx9QI+I6fxcbUJSTvaDyNrq9NOrBq4r9GGYn6EQDwGG71gcxPzfWr3zb770rvcoBJdR0AMMI/l9J5/LL29hPmsr03AMB3vFXwjFEAoKdFxNPo24PGrfFxkLTG7Sfg4op6TXU8znDB0fa33xn8WfCMkQDwV87LkL0ZdU0tBEytNmkxAGjNOdTM5etqEg+vm+Lzr+Gd+MEAYKyv8Tr+q/YKkan5vyQ/qGviNKa2Ov0borP3nGkNcbIjfcd9YtgWNmxMy37EBIDhFK3nRwIofrH62qTCaD+xwtg1KU9e1YoIEL1o1tcipW2dNd7WqAvnQiikLk6oZLFFs8713d4iUyFabAOAPcvdVs22o/jFFkb76beLqx4U10z/8VwHsXxiEMUvdjR16OUdXgt3XT15owgAtDUIc8ZbHVk/+cMSWNN/PCve76dOxBpTl0z9/lxBaU1VYpBYjeIXSyJg/w+9aT9gD8KyXQAAAABJRU5ErkJggg==',
  droite: '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'
};

/* =====================================================================
 *  SECOURISTE › FICHES DE SANTÉ (Troupe, Meute, Clan — pas la Maîtrise)
 *  Lues EN DIRECT dans la feuille des réponses Google Forms de l'unité, rangée à côté du dossier « Info » :
 *  « Forms troupe 2026-2027 (Responses) », « Forms meute … », « Forms clan … ».
 *  Rien n'est jamais écrit dans cette feuille : elle reste celle de Google Forms.
 * ===================================================================== */
const FICHES_SANTE = {
  PREFIXE: '',          // '' = « Forms » + le nom de l'unité (Forms troupe, Forms meute, Forms clan)
  FICHIER_ID: ''        // pour imposer une feuille précise : l'ID dans son adresse (…/spreadsheets/d/<ID>/edit)
};
function santePrefixe_() { return texte_(FICHES_SANTE.PREFIXE) || ('Forms ' + texte_(R_().NOM_ENSEMBLE).toLowerCase()); }
/** La feuille des réponses : dans le dossier de l'unité (à côté de « Info »), celle dont le nom commence par le préfixe ;
 *  celle de l'année scoute en cours d'abord, sinon la plus récente. Si elle n'y est pas : recherche dans tout le Drive. */
function santeFichier_() {
  if (texte_(FICHES_SANTE.FICHIER_ID)) {
    try { return DriveApp.getFileById(texte_(FICHES_SANTE.FICHIER_ID)); }
    catch (e) { throw new Error('La feuille des fiches de santé (FICHES_SANTE.FICHIER_ID) est introuvable, ou elle n\'est pas partagée avec vous.'); }
  }
  const pre = norm_(santePrefixe_());
  const garde = function (it, l) {
    while (it.hasNext()) {
      const f = it.next();
      if (f.isTrashed && f.isTrashed()) continue;
      const n = norm_(f.getName());
      if (n === pre || n.indexOf(pre + ' ') === 0 || n.indexOf(pre + '(') === 0) l.push(f);
    }
    return l;
  };
  let l = [];
  try { const dos = santeDossier_(); if (dos) l = garde(dos.getFilesByType(MimeType.GOOGLE_SHEETS), []); } catch (e) { l = []; }     // 1. à côté du dossier « Info »
  if (!l.length) {                                                                                    // 2. ailleurs dans le Drive
    const mot = santePrefixe_().split(/\s+/)[0].replace(/["'\\]/g, '');
    l = garde(DriveApp.searchFiles('title contains "' + mot + '" and mimeType = "' + MimeType.GOOGLE_SHEETS + '" and trashed = false'), []);
  }
  if (!l.length) return null;
  const an = anneeScoute_();
  l.sort(function (a, b) {
    const ya = a.getName().indexOf(an) >= 0 ? 1 : 0, yb = b.getName().indexOf(an) >= 0 ? 1 : 0;
    return (yb - ya) || (b.getLastUpdated().getTime() - a.getLastUpdated().getTime());
  });
  return l[0];
}
/** Le dossier de l'unité (celui qui contient « Info ») ; pour le suivi de la Maîtrise, celui de l'unité suivie. */
function santeDossier_() {
  if (CTX_) { const p = CTX_.info && CTX_.info.getParents ? CTX_.info.getParents() : null; return p && p.hasNext() ? p.next() : null; }
  return racine_();
}
/** Une question du formulaire, sans les « : » de la fin. */
function santeTitre_(h) { return texte_(h).replace(/\s*[:：]\s*$/, '').replace(/\s+/g, ' '); }

function santeDonnees() {
  acces_('secouriste');
  if (REGLAGES.MAITRISE && !CTX_) throw new Error('Les fiches de santé se consultent dans l\'application de chaque unité.');
  const c = cfgPres_();
  const base = { recherche: santePrefixe_(), groupeTitre: c.uniteTitre, unites: c.unites,
    membres: servicesMembres_().membres.map(function (m) { return { nom: m.nom, unite: m.unite }; }) };
  const f = santeFichier_();
  if (!f) return Object.assign(base, { introuvable: true });
  let ss;
  try { ss = SpreadsheetApp.openById(f.getId()); }
  catch (e) { throw new Error('La feuille « ' + f.getName() + ' » ne peut pas être ouverte avec votre compte : demandez qu\'elle soit partagée avec vous.'); }
  const feuilles = ss.getSheets();
  const sh = feuilles.filter(function (s) { return /respons|r[ée]ponse|form/i.test(s.getName()); })[0] || feuilles[0];
  const fichier = { nom: f.getName(), url: ss.getUrl(), feuille: sh.getName(), maj: Utilities.formatDate(f.getLastUpdated(), tz_(), 'yyyy-MM-dd HH:mm') };
  if (sh.getLastRow() < 1 || sh.getLastColumn() < 1) return Object.assign(base, { fichier: fichier, colonnes: [], fiches: [], reponses: 0 });
  const rng = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn());
  const brut = rng.getValues(), aff = rng.getDisplayValues();
  // les colonnes : la date de la réponse, le nom, le prénom, le sous-groupe
  const titres = aff[0].map(santeTitre_), cles = titres.map(function (t) { return norm_(t); });
  const cherche = function (re) { for (let i = 0; i < cles.length; i++) if (re.test(cles[i])) return i; return -1; };
  const iTs = cherche(/^(timestamp|horodateur|horodatage|date et heure|marque temporelle)/);
  let iNom = cherche(/^(nom|nom de famille|family name|last name)$/), iPre = cherche(/^(prenom|first name)$/);
  if (iNom < 0) iNom = cherche(/^nom( et prenom| complet)?\b/);
  const iGrp = cherche(/^(patrouille|sizaine|equipe|unite|groupe)$/);
  const parCle = {}, ordre = [];
  let reponses = 0;
  for (let r = 1; r < aff.length; r++) {
    const ligne = aff[r];
    if (!ligne.some(function (v) { return texte_(v) !== ''; })) continue;
    reponses++;
    const nom = iNom >= 0 ? texte_(ligne[iNom]) : '', pre = iPre >= 0 ? texte_(ligne[iPre]) : '';
    const complet = (nom + ' ' + pre).trim() || ('Réponse ' + r);       // dans l'ordre du formulaire (Nom, puis Prénom)
    const k = norm_(complet).split(' ').filter(String).sort().join(' ');
    const ts = iTs >= 0 && brut[r][iTs] instanceof Date ? brut[r][iTs].getTime() : r;
    const fiche = {
      nom: nom, prenom: pre, complet: complet, groupe: iGrp >= 0 ? texte_(ligne[iGrp]) : '',
      maj: iTs >= 0 && brut[r][iTs] instanceof Date ? Utilities.formatDate(brut[r][iTs], tz_(), 'yyyy-MM-dd HH:mm') : '',
      valeurs: ligne.map(function (v) { return texte_(v); }), ts: ts, nb: 1
    };
    if (!parCle[k]) { parCle[k] = fiche; ordre.push(k); }
    else {                                   // la même personne a répondu plusieurs fois : la réponse la plus récente compte
      fiche.nb = parCle[k].nb + 1;
      if (ts >= parCle[k].ts) parCle[k] = fiche; else parCle[k].nb = fiche.nb;
    }
  }
  const unitesN = c.unites.map(norm_);
  const fiches = ordre.map(function (k) { const x = parCle[k]; delete x.ts;
    const i = unitesN.indexOf(norm_(x.groupe)); if (i >= 0) x.groupe = c.unites[i];     // « loups » rejoint « Loups »
    return x; })
    .sort(function (a, b) {
      const ga = unitesN.indexOf(norm_(a.groupe)), gb = unitesN.indexOf(norm_(b.groupe));
      return ((ga < 0 ? 99 : ga) - (gb < 0 ? 99 : gb)) || a.complet.localeCompare(b.complet, 'fr');
    });
  return Object.assign(base, { fichier: fichier, colonnes: titres, iNom: iNom, iPre: iPre, iGrp: iGrp, iTs: iTs, fiches: fiches, reponses: reponses });
}

/* =====================================================================
 *  PHOTOGRAPHE › CHECKLISTS DE PRISES DE VUE
 *  Fichier « Info › Photographe › Checklists photo » :
 *    · onglet « Checklists » : une ligne par activité (nom, date, remarque, statut) ;
 *    · onglet « Prises »     : une ligne par photo ou vidéo à prendre. « État » : vide, « Fait » ou « Pas fait ».
 *  Quand chaque prise est cochée (faite ou pas faite), la checklist passe dans l'historique.
 *  La Maîtrise peut modifier les checklists d'une unité depuis le suivi (seule exception à la lecture seule).
 * ===================================================================== */
const PHOTO = {
  TYPES: ['Photo', 'Vidéo'],
  FAIT: 'Fait', PAS_FAIT: 'Pas fait',
  EN_COURS: 'En cours', TERMINEE: 'Terminée',
  MAX: { ACTIVITE: 120, PRISE: 160, REMARQUE: 500, PRISES: 200 }
};
const PH_ENTETES = ['ID', 'Activité', 'Date', 'Remarque', 'Statut', 'Terminée le', 'Ajouté par', 'Horodatage', 'Modifié par', 'Modifié le'];
const PR_ENTETES = ['ID', 'Checklist (ID)', 'Ordre', 'Type', 'Prise', 'État', 'Coché par', 'Coché le'];

function feuillesPhoto_() {
  const ss = classeur_(dossier_(info_(), CONFIG.DOSSIERS.PHOTOGRAPHE), CONFIG.FICHIERS.CHECKLISTS);
  const ch = feuille_(ss, 'Checklists', PH_ENTETES, {
    largeurs: [80, 260, 95, 260, 95, 135, 190, 135, 190, 135],
    formats: { 'Date': 'dd/mm/yyyy', 'Terminée le': 'dd/mm/yyyy hh:mm', 'Horodatage': 'dd/mm/yyyy hh:mm', 'Modifié le': 'dd/mm/yyyy hh:mm' }, cacherId: true
  });
  const pr = feuille_(ss, 'Prises', PR_ENTETES, {
    largeurs: [80, 100, 60, 70, 340, 85, 190, 135], formats: { 'Coché le': 'dd/mm/yyyy hh:mm' }, cacherId: true
  });
  assurerIds_(ch); assurerIds_(pr);
  return { ss: ss, ch: ch, pr: pr };
}
function etatPhoto_(v) {
  const n = norm_(v);
  if (n === norm_(PHOTO.FAIT) || n === 'oui' || n === 'x') return PHOTO.FAIT;
  if (n === norm_(PHOTO.PAS_FAIT) || n === 'non') return PHOTO.PAS_FAIT;
  return '';
}
function typePhoto_(v) { return norm_(v).indexOf('vid') === 0 ? 'Vidéo' : 'Photo'; }

function lirePhoto_(f) {
  const prises = {};
  lignes_(f.pr).forEach(function (o) {
    const c = texte_(o['Checklist (ID)']);
    if (!c || !texte_(o['Prise'])) return;
    (prises[c] = prises[c] || []).push({
      id: String(o['ID']), ordre: Number(o['Ordre']) || 0, type: typePhoto_(o['Type']), texte: texte_(o['Prise']),
      etat: etatPhoto_(o['État']), par: texte_(o['Coché par']), le: dateHeure_(o['Coché le']), _row: o._row
    });
  });
  return lignes_(f.ch).filter(function (o) { return texte_(o['Activité']); }).map(function (o) {
    const id = String(o['ID']);
    const l = (prises[id] || []).sort(function (a, b) { return a.ordre - b.ordre || a._row - b._row; });
    l.forEach(function (p) { delete p._row; });
    const faites = l.filter(function (p) { return p.etat === PHOTO.FAIT; }).length;
    const pasFaites = l.filter(function (p) { return p.etat === PHOTO.PAS_FAIT; }).length;
    const reste = l.length - faites - pasFaites;
    return {
      id: id, activite: texte_(o['Activité']), date: dateIso_(o['Date']), remarque: texte_(o['Remarque']),
      statut: l.length && !reste ? PHOTO.TERMINEE : PHOTO.EN_COURS, termineeLe: dateHeure_(o['Terminée le']),
      par: texte_(o['Ajouté par']), horodatage: dateHeure_(o['Horodatage']), modifiePar: texte_(o['Modifié par']), modifieLe: dateHeure_(o['Modifié le']),
      prises: l, faites: faites, pasFaites: pasFaites, reste: reste, _row: o._row
    };
  }).sort(function (a, b) { return (b.date + b.horodatage).localeCompare(a.date + a.horodatage); });
}
function reponsePhoto_(f) {
  const l = lirePhoto_(f);
  l.forEach(function (c) { delete c._row; });
  // les prises déjà utilisées (pour les proposer dans une nouvelle checklist), les plus fréquentes d'abord
  const vus = {};
  l.forEach(function (c) { c.prises.forEach(function (p) { const k = p.type + '|' + norm_(p.texte); vus[k] = vus[k] || { type: p.type, texte: p.texte, n: 0 }; vus[k].n++; }); });
  const suggestions = Object.keys(vus).map(function (k) { return vus[k]; }).sort(function (a, b) { return b.n - a.n || a.texte.localeCompare(b.texte, 'fr'); }).slice(0, 300);
  return { checklists: l, suggestions: suggestions, types: PHOTO.TYPES, lien: f.ss.getUrl() };
}

function photoDonnees() {
  acces_('photographe');
  return reponsePhoto_(feuillesPhoto_());
}

/** Le statut enregistré dans la feuille suit les cases : « Terminée » (avec la date) quand tout est coché, sinon « En cours ». */
function photoStatut_(f, id) {
  const c = lirePhoto_(f).filter(function (x) { return x.id === String(id); })[0];
  if (!c) return null;
  const ligne = trouver_(f.ch, id);
  if (!ligne) return c;
  const avant = texte_(ligne['Statut']);
  if (c.statut === PHOTO.TERMINEE && avant !== PHOTO.TERMINEE) maj_(f.ch, ligne._row, { 'Statut': PHOTO.TERMINEE, 'Terminée le': new Date() });
  else if (c.statut !== PHOTO.TERMINEE && avant !== PHOTO.EN_COURS) maj_(f.ch, ligne._row, { 'Statut': PHOTO.EN_COURS, 'Terminée le': '' });
  return c;
}

/**
 * Crée (sans id) ou modifie (avec id) une checklist : { id?, activite, date, remarque, prises: [{ id?, type, texte }] }.
 * Les prises gardées gardent leur case ; les nouvelles arrivent décochées ; celles qui ont disparu sont retirées.
 */
function photoEnregistrer(c) {
  acces_('photographe');
  c = c || {};
  const activite = texte_(c.activite).replace(/\s+/g, ' ');
  if (!activite) throw new Error('Indiquez le nom de l\'activité.');
  if (activite.length > PHOTO.MAX.ACTIVITE) throw new Error('Nom de l\'activité : ' + PHOTO.MAX.ACTIVITE + ' caractères au plus.');
  const date = dateVal_(c.date);
  if (!date) throw new Error('Choisissez la date de l\'activité.');
  const remarque = texte_(c.remarque).slice(0, PHOTO.MAX.REMARQUE);
  const brutes = Array.isArray(c.prises) ? c.prises : [];
  const prises = [], vus = {};
  brutes.forEach(function (p) {
    const t = texte_(p && p.texte).replace(/\s+/g, ' ');
    if (!t) return;
    if (t.length > PHOTO.MAX.PRISE) throw new Error('« ' + t.slice(0, 40) + '… » : ' + PHOTO.MAX.PRISE + ' caractères au plus par prise.');
    const type = typePhoto_(p.type), k = type + '|' + norm_(t);
    if (vus[k]) return;                       // la même prise deux fois : une seule ligne
    vus[k] = true;
    prises.push({ id: texte_(p.id), type: type, texte: t });
  });
  if (!prises.length) throw new Error('Ajoutez au moins une photo ou une vidéo à prendre.');
  if (prises.length > PHOTO.MAX.PRISES) throw new Error(PHOTO.MAX.PRISES + ' prises au plus par checklist.');
  return avecVerrou_(function () {
    const f = feuillesPhoto_();
    let id = texte_(c.id);
    const qui = qui_(), maintenant = new Date();
    if (id) {
      const ligne = trouver_(f.ch, id);
      if (!ligne) throw new Error('Cette checklist n\'existe plus (supprimée entre-temps ?).');
      maj_(f.ch, ligne._row, { 'Activité': activite, 'Date': date, 'Remarque': remarque, 'Modifié par': qui, 'Modifié le': maintenant });
    } else {
      id = id_();
      ajouter_(f.ch, { 'ID': id, 'Activité': activite, 'Date': date, 'Remarque': remarque, 'Statut': PHOTO.EN_COURS, 'Ajouté par': qui, 'Horodatage': maintenant });
    }
    // les cases déjà cochées sont gardées (prise reconnue par son id, sinon par son texte)
    const avant = {}, avantTexte = {};
    lignes_(f.pr).forEach(function (o) {
      if (texte_(o['Checklist (ID)']) !== id) return;
      avant[String(o['ID'])] = o;
      avantTexte[typePhoto_(o['Type']) + '|' + norm_(o['Prise'])] = o;
    });
    const nouvelles = prises.map(function (p, i) {
      const ex = (p.id && avant[p.id]) || avantTexte[p.type + '|' + norm_(p.texte)] || null;
      return {
        'ID': ex ? String(ex['ID']) : id_(), 'Checklist (ID)': id, 'Ordre': i + 1, 'Type': p.type, 'Prise': p.texte,
        'État': ex ? etatPhoto_(ex['État']) : '', 'Coché par': ex ? ex['Coché par'] : '', 'Coché le': ex ? ex['Coché le'] : ''
      };
    });
    remplacerLignes_(f.pr, 'Checklist (ID)', id, nouvelles);
    photoStatut_(f, id);
    const r = reponsePhoto_(f);
    r.enregistre = id;
    return r;
  });
}

/** Coche une prise : etat = 'Fait', 'Pas fait' ou '' (décocher). */
function photoCocher(checklistId, priseId, etat) {
  acces_('photographe');
  const e = etat === PHOTO.FAIT || etat === PHOTO.PAS_FAIT ? etat : '';
  if (etat && !e) throw new Error('État inconnu.');
  return avecVerrou_(function () {
    const f = feuillesPhoto_();
    if (!trouver_(f.ch, checklistId)) throw new Error('Cette checklist n\'existe plus (supprimée entre-temps ?).');
    const p = trouver_(f.pr, priseId);
    if (!p || texte_(p['Checklist (ID)']) !== String(checklistId)) throw new Error('Cette prise n\'existe plus : actualisez la page.');
    maj_(f.pr, p._row, { 'État': e, 'Coché par': e ? qui_() : '', 'Coché le': e ? new Date() : '' });
    const c = photoStatut_(f, checklistId);
    const r = reponsePhoto_(f);
    r.terminee = !!(c && c.statut === PHOTO.TERMINEE);
    return r;
  });
}

function photoSupprimer(id) {
  acces_('photographe');
  return avecVerrou_(function () {
    const f = feuillesPhoto_();
    const ligne = trouver_(f.ch, id);
    if (!ligne) throw new Error('Cette checklist n\'existe plus (déjà supprimée ?).');
    remplacerLignes_(f.pr, 'Checklist (ID)', String(id), []);
    f.ch.deleteRow(ligne._row);
    return reponsePhoto_(f);
  });
}

/**
 * Remplace, dans un onglet, toutes les lignes dont la colonne « colonne » vaut id par « nouvelles » (objets par en-tête).
 * Les autres lignes restent telles quelles, dans le même ordre ; aucune ligne n'est supprimée de la feuille (les lignes libérées sont vidées).
 */
function remplacerLignes_(sh, colonne, id, nouvelles) {
  const h = entetes_(sh), ic = h.indexOf(colonne);
  if (ic < 0) throw new Error('Colonne « ' + colonne + ' » introuvable dans l\'onglet « ' + sh.getName() + ' ».');
  const n = Math.max(0, sh.getLastRow() - 1);
  const anciennes = n ? sh.getRange(2, 1, n, h.length).getValues() : [];
  const garder = anciennes.filter(function (r) {
    return !r.every(function (v) { return String(v).trim() === ''; }) && String(r[ic]).trim() !== String(id);
  });
  const lignes = garder.concat(nouvelles.map(function (o) {
    return h.map(function (k) { return o[k] === undefined || o[k] === null ? '' : o[k]; });
  })).map(function (r) { return r.map(cellule_); });
  while (lignes.length < anciennes.length) lignes.push(h.map(function () { return ''; }));
  if (lignes.length) sh.getRange(2, 1, lignes.length, h.length).setValues(lignes);
}

/* ---------------------------------------------------------------------
 *  PHOTOGRAPHE › COUVERTURES INSTAGRAM
 *  Tout se fait dans le navigateur (la photo n'est envoyée nulle part). Le serveur donne seulement les modèles
 *  (logo, trait, bande, tailles et positions des textes) et les polices Para et Lora : fichier HTML « Couverture ».
 * --------------------------------------------------------------------- */
function couvertureRessources() {
  acces_('photographe');
  let t = '';
  try { t = include('Couverture').trim(); } catch (e) { t = ''; }
  if (!t || t.charAt(0) !== '{') throw new Error('Le fichier « Couverture » manque dans le projet Apps Script (il contient les modèles et les polices) : ajoutez-le, puis publiez une nouvelle version.');
  return t;
}

/* ---------------------------------------------------------------------
 *  Suivi des unités (Maîtrise) : les checklists d'une unité se MODIFIENT depuis le suivi.
 *  Toutes les autres données des unités restent en lecture seule.
 * --------------------------------------------------------------------- */
function uniteChecklist(cle, action, a1, a2, a3) {
  maitriseSeulement_();
  if (!SESSION_ && !ENTREE_) throw new Error('Connexion requise.');
  acces_('suivi:photographe');
  const u = MAITRISE.UNITES.filter(function (x) { return x.cle === texte_(cle); })[0];
  if (!u) throw new Error('Unité inconnue.');
  const r = infoUnite_(u, false);
  if (!r.info) throw new Error(r.message || 'Dossier de l\'unité introuvable.');
  const avant = INFO_;
  INFO_ = r.info;                          // les fonctions du photographe travaillent dans le dossier « Info » de l'unité
  try {
    let d;
    if (action === 'enregistrer') d = photoEnregistrer(a1);
    else if (action === 'cocher') d = photoCocher(a1, a2, a3);
    else if (action === 'supprimer') d = photoSupprimer(a1);
    else throw new Error('Action inconnue.');
    return { unite: { cle: u.cle, nom: u.nom }, quoi: 'photo', donnees: d, manquants: [] };
  } catch (e) {
    if (/denied|permission|autoris|not have|n'avez pas|refus/i.test(String(e && e.message))) {
      throw new Error('Le compte de la Maîtrise ne peut pas modifier les fichiers de « ' + u.nom + ' » : le dossier « Info › ' + CONFIG.DOSSIERS.PHOTOGRAPHE + ' » de l\'unité doit lui être partagé en modification.');
    }
    throw e;
  } finally { INFO_ = avant; }
}

/* =====================================================================
 *  ANIMATEUR — répertoire (sketchs, chants, bans, cantiques) et courbes de veillée
 *  Fichier « Info › Animation › Animation » :
 *    · onglet « Répertoire » : une ligne par sketch, chant, ban ou cantique ;
 *    · onglet « Veillées »   : une ligne par veillée ;
 *    · onglet « Courbes »    : les moments de chaque veillée, dans l'ordre, avec leur intensité (1 à 5).
 *  Les PDF des courbes sont rangés dans « Info › Animation › Veillées ».
 * ===================================================================== */
const ANIMATION = {
  CATEGORIES: ['Sketch', 'Chant', 'Ban', 'Cantique'],
  MOMENTS: ['Sketch', 'Chant', 'Ban', 'Cantique', 'Jeu', 'Prière', 'Autre'],
  NIVEAUX: ['Très calme', 'Calme', 'Animé', 'Très animé', 'Sommet'],
  DOSSIER_PDF: 'Veillées',
  MAX: { NOM: 120, DESCRIPTION: 3000, PAROLES: 20000, LIEN: 500, MOMENTS: 60, NOTE: 300, REMARQUE: 1000 }
};
const RE_ENTETES = ['ID', 'Catégorie', 'Nom', 'Description', 'Paroles', 'Membres', 'Durée (min)', 'Lien', 'Ajouté par', 'Horodatage', 'Modifié par', 'Modifié le'];
const VE_ENTETES = ['ID', 'Veillée', 'Date', 'Heure de début', 'Lieu', 'Thème', 'Remarque', 'Ajouté par', 'Horodatage', 'Modifié par', 'Modifié le'];
const CO_ENTETES = ['Veillée (ID)', 'Ordre', 'Type', 'Moment', 'Répertoire (ID)', 'Durée (min)', 'Intensité', 'Responsable', 'Note'];

function feuillesAnimation_() {
  const ss = classeur_(dossier_(info_(), CONFIG.DOSSIERS.ANIMATION), CONFIG.FICHIERS.ANIMATION);
  const re = feuille_(ss, 'Répertoire', RE_ENTETES, {
    largeurs: [80, 90, 220, 300, 360, 75, 85, 240, 190, 135, 190, 135],
    formats: { 'Horodatage': 'dd/mm/yyyy hh:mm', 'Modifié le': 'dd/mm/yyyy hh:mm' }, cacherId: true
  });
  const ve = feuille_(ss, 'Veillées', VE_ENTETES, {
    largeurs: [80, 240, 95, 110, 180, 200, 260, 190, 135, 190, 135],
    formats: { 'Date': 'dd/mm/yyyy', 'Heure de début': '@', 'Horodatage': 'dd/mm/yyyy hh:mm', 'Modifié le': 'dd/mm/yyyy hh:mm' }, cacherId: true
  });
  const co = feuille_(ss, 'Courbes', CO_ENTETES, { largeurs: [100, 60, 80, 240, 100, 85, 75, 150, 260] });
  assurerIds_(re); assurerIds_(ve);
  return { ss: ss, re: re, ve: ve, co: co };
}
function categorieAnim_(v) {
  const n = norm_(v);
  for (let i = 0; i < ANIMATION.MOMENTS.length; i++) if (norm_(ANIMATION.MOMENTS[i]) === n) return ANIMATION.MOMENTS[i];
  if (n === 'sketchs' || n === 'sketches' || n === 'sketche') return 'Sketch';
  if (n === 'chants') return 'Chant';
  if (n === 'bans') return 'Ban';
  if (n === 'cantiques' || n === 'tretil' || n === 'tretils' || n === 'chant spirituel' || n === 'chants spirituels') return 'Cantique';
  return '';
}
function nombreOuVide_(v, max) {
  if (v === '' || v == null) return '';
  const n = Number(String(v).replace(',', '.'));
  if (!isFinite(n) || n < 0) return '';
  return Math.min(max, Math.round(n * 10) / 10);
}
function lienValide_(v) {
  const s = texte_(v);
  if (!s) return '';
  if (s.length > ANIMATION.MAX.LIEN) throw new Error('Lien : ' + ANIMATION.MAX.LIEN + ' caractères au plus.');
  const u = /^https?:\/\//i.test(s) ? s : 'https://' + s;
  if (!/^https?:\/\/[^\s/$.?#][^\s]*\.[^\s]{2,}/i.test(u)) throw new Error('Le lien ne semble pas valable (ex : https://youtu.be/…).');
  return u;
}
function heureValide_(v) {
  const m = /^(\d{1,2})\s*[:hH.]\s*(\d{2})?$/.exec(texte_(v));
  if (!m) return '';
  const h = Number(m[1]), mi = Number(m[2] || 0);
  return h < 24 && mi < 60 ? pad_(h) + ':' + pad_(mi) : '';
}

function lireAnimation_(f) {
  const repertoire = lignes_(f.re).filter(function (o) { return texte_(o['Nom']) && categorieAnim_(o['Catégorie']); }).map(function (o) {
    return {
      id: String(o['ID']), categorie: categorieAnim_(o['Catégorie']), nom: texte_(o['Nom']), description: texte_(o['Description']), paroles: String(o['Paroles'] == null ? '' : o['Paroles']).replace(/\r\n?/g, '\n').trim(),
      membres: nombreOuVide_(o['Membres'], 999), duree: nombreOuVide_(o['Durée (min)'], 600), lien: texte_(o['Lien']),
      par: texte_(o['Ajouté par']), horodatage: dateHeure_(o['Horodatage']), modifiePar: texte_(o['Modifié par']), modifieLe: dateHeure_(o['Modifié le'])
    };
  }).sort(function (a, b) { return a.nom.localeCompare(b.nom, 'fr'); });
  const moments = {};
  lignes_(f.co).forEach(function (o) {
    const v = texte_(o['Veillée (ID)']);
    if (!v || !texte_(o['Moment'])) return;
    const niv = Math.round(Number(o['Intensité']));
    (moments[v] = moments[v] || []).push({
      ordre: Number(o['Ordre']) || 0, type: categorieAnim_(o['Type']) || 'Autre', nom: texte_(o['Moment']), ref: texte_(o['Répertoire (ID)']),
      duree: nombreOuVide_(o['Durée (min)'], 600), niveau: niv >= 1 && niv <= 5 ? niv : 3, responsable: texte_(o['Responsable']), note: texte_(o['Note']), _row: o._row
    });
  });
  const veillees = lignes_(f.ve).filter(function (o) { return texte_(o['Veillée']); }).map(function (o) {
    const id = String(o['ID']);
    const l = (moments[id] || []).sort(function (a, b) { return a.ordre - b.ordre || a._row - b._row; });
    l.forEach(function (m) { delete m._row; delete m.ordre; });
    return {
      id: id, nom: texte_(o['Veillée']), date: dateIso_(o['Date']), heure: heureValide_(o['Heure de début'] instanceof Date ? Utilities.formatDate(o['Heure de début'], tz_(), 'HH:mm') : o['Heure de début']),
      lieu: texte_(o['Lieu']), theme: texte_(o['Thème']), remarque: texte_(o['Remarque']), moments: l,
      duree: l.reduce(function (s, m) { return s + (Number(m.duree) || 0); }, 0),
      par: texte_(o['Ajouté par']), horodatage: dateHeure_(o['Horodatage']), modifiePar: texte_(o['Modifié par']), modifieLe: dateHeure_(o['Modifié le'])
    };
  }).sort(function (a, b) { return (b.date + b.horodatage).localeCompare(a.date + a.horodatage); });
  return { repertoire: repertoire, veillees: veillees };
}
function reponseAnimation_(f) {
  const d = lireAnimation_(f);
  return { repertoire: d.repertoire, veillees: d.veillees, categories: ANIMATION.CATEGORIES, moments: ANIMATION.MOMENTS, niveaux: ANIMATION.NIVEAUX, lien: f.ss.getUrl() };
}

function animationDonnees() {
  acces_('animateur');
  return reponseAnimation_(feuillesAnimation_());
}

/** Ajoute (sans id) ou modifie (avec id) un élément du répertoire. */
function animationEnregistrer(x) {
  acces_('animateur');
  x = x || {};
  const cat = categorieAnim_(x.categorie);
  if (ANIMATION.CATEGORIES.indexOf(cat) < 0) throw new Error('Choisissez : ' + ANIMATION.CATEGORIES.join(', ') + '.');
  const nom = texte_(x.nom).replace(/\s+/g, ' ');
  if (!nom) throw new Error('Indiquez le nom.');
  if (nom.length > ANIMATION.MAX.NOM) throw new Error('Nom : ' + ANIMATION.MAX.NOM + ' caractères au plus.');
  const description = cat === 'Sketch' ? texte_(x.description) : '';
  if (description.length > ANIMATION.MAX.DESCRIPTION) throw new Error('Description : ' + ANIMATION.MAX.DESCRIPTION + ' caractères au plus.');
  const paroles = cat === 'Sketch' ? '' : String(x.paroles == null ? '' : x.paroles).replace(/\r\n?/g, '\n').trim();
  if (paroles.length > ANIMATION.MAX.PAROLES) throw new Error('Paroles : ' + ANIMATION.MAX.PAROLES + ' caractères au plus.');
  const membres = cat === 'Sketch' ? nombreOuVide_(x.membres, 999) : '';
  const duree = cat === 'Sketch' ? nombreOuVide_(x.duree, 600) : '';
  const lien = cat === 'Ban' ? '' : lienValide_(x.lien);
  return avecVerrou_(function () {
    const f = feuillesAnimation_();
    const d = lireAnimation_(f);
    let id = texte_(x.id);
    const doublon = d.repertoire.filter(function (r) { return r.categorie === cat && norm_(r.nom) === norm_(nom) && r.id !== id; })[0];
    if (doublon) throw new Error('« ' + doublon.nom + ' » est déjà dans les ' + cat.toLowerCase() + 's.');
    const o = { 'Catégorie': cat, 'Nom': nom, 'Description': description, 'Paroles': paroles, 'Membres': membres, 'Durée (min)': duree, 'Lien': lien };
    if (id) {
      const ligne = trouver_(f.re, id);
      if (!ligne) throw new Error('Cet élément n\'existe plus (supprimé entre-temps ?).');
      o['Modifié par'] = qui_(); o['Modifié le'] = new Date();
      maj_(f.re, ligne._row, o);
    } else {
      id = id_();
      o['ID'] = id; o['Ajouté par'] = qui_(); o['Horodatage'] = new Date();
      ajouter_(f.re, o);
    }
    const r = reponseAnimation_(f);
    r.enregistre = id;
    return r;
  });
}

/** Retire un élément du répertoire (les veillées qui l'utilisent gardent son nom). */
function animationSupprimer(id) {
  acces_('animateur');
  return avecVerrou_(function () {
    const f = feuillesAnimation_();
    const ligne = trouver_(f.re, id);
    if (!ligne) throw new Error('Cet élément n\'existe plus (déjà supprimé ?).');
    f.re.deleteRow(ligne._row);
    return reponseAnimation_(f);
  });
}

/**
 * Crée (sans id) ou modifie (avec id) une veillée et sa courbe :
 * { id?, nom, date, heure, lieu, theme, remarque, moments: [{ type, nom, ref, duree, niveau, responsable, note }] }.
 */
function veilleeEnregistrer(v) {
  acces_('animateur');
  v = v || {};
  const nom = texte_(v.nom).replace(/\s+/g, ' ');
  if (!nom) throw new Error('Indiquez le nom de la veillée.');
  if (nom.length > ANIMATION.MAX.NOM) throw new Error('Nom de la veillée : ' + ANIMATION.MAX.NOM + ' caractères au plus.');
  const date = v.date ? dateVal_(v.date) : null;
  if (v.date && !date) throw new Error('Date invalide.');
  const heure = v.heure ? heureValide_(v.heure) : '';
  if (v.heure && !heure) throw new Error('Heure de début invalide (ex : 20:30).');
  const lieu = texte_(v.lieu).slice(0, ANIMATION.MAX.NOM), theme = texte_(v.theme).slice(0, ANIMATION.MAX.NOM);
  const remarque = texte_(v.remarque).slice(0, ANIMATION.MAX.REMARQUE);
  const brut = Array.isArray(v.moments) ? v.moments : [];
  const moments = brut.map(function (m) {
    m = m || {};
    const n = texte_(m.nom).replace(/\s+/g, ' ');
    if (!n) return null;
    const niv = Math.round(Number(m.niveau));
    return {
      type: categorieAnim_(m.type) || 'Autre', nom: n.slice(0, ANIMATION.MAX.NOM), ref: texte_(m.ref).slice(0, 40),
      duree: nombreOuVide_(m.duree, 600), niveau: niv >= 1 && niv <= 5 ? niv : 3,
      responsable: texte_(m.responsable).slice(0, ANIMATION.MAX.NOM), note: texte_(m.note).slice(0, ANIMATION.MAX.NOTE)
    };
  }).filter(Boolean);
  if (!moments.length) throw new Error('Ajoutez au moins un moment à la courbe (un chant, un sketch, un ban…).');
  if (moments.length > ANIMATION.MAX.MOMENTS) throw new Error(ANIMATION.MAX.MOMENTS + ' moments au plus par veillée.');
  return avecVerrou_(function () {
    const f = feuillesAnimation_();
    let id = texte_(v.id);
    const o = { 'Veillée': nom, 'Date': date || '', 'Heure de début': heure, 'Lieu': lieu, 'Thème': theme, 'Remarque': remarque };
    if (id) {
      const ligne = trouver_(f.ve, id);
      if (!ligne) throw new Error('Cette veillée n\'existe plus (supprimée entre-temps ?).');
      o['Modifié par'] = qui_(); o['Modifié le'] = new Date();
      maj_(f.ve, ligne._row, o);
    } else {
      id = id_();
      o['ID'] = id; o['Ajouté par'] = qui_(); o['Horodatage'] = new Date();
      ajouter_(f.ve, o);
    }
    remplacerLignes_(f.co, 'Veillée (ID)', id, moments.map(function (m, i) {
      return { 'Veillée (ID)': id, 'Ordre': i + 1, 'Type': m.type, 'Moment': m.nom, 'Répertoire (ID)': m.ref, 'Durée (min)': m.duree, 'Intensité': m.niveau, 'Responsable': m.responsable, 'Note': m.note };
    }));
    const r = reponseAnimation_(f);
    r.enregistre = id;
    return r;
  });
}

function veilleeSupprimer(id) {
  acces_('animateur');
  return avecVerrou_(function () {
    const f = feuillesAnimation_();
    const ligne = trouver_(f.ve, id);
    if (!ligne) throw new Error('Cette veillée n\'existe plus (déjà supprimée ?).');
    remplacerLignes_(f.co, 'Veillée (ID)', String(id), []);
    f.ve.deleteRow(ligne._row);
    return reponseAnimation_(f);
  });
}

/** PDF de la courbe d'une veillée. « image » : le dessin de la courbe fait par l'application (PNG). */
function veilleePdf(id, image) {
  acces_('animateur');
  const img = String(image || '');
  if (!/^data:image\/png;base64,[A-Za-z0-9+\/=]+$/.test(img) || img.length > 4000000) throw new Error('Le dessin de la courbe n\'a pas pu être préparé : réessayez.');
  return avecVerrou_(function () {
    const f = feuillesAnimation_();
    const d = lireAnimation_(f);
    const v = d.veillees.filter(function (x) { return x.id === String(id); })[0];
    if (!v) throw new Error('Cette veillée n\'existe plus (supprimée entre-temps ?).');
    const dos = dossier_(dossier_(info_(), CONFIG.DOSSIERS.ANIMATION), ANIMATION.DOSSIER_PDF);
    const nom = 'Courbe de veillée — ' + v.nom.replace(/[\\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() + (v.date ? ' — ' + Utilities.formatDate(dateVal_(v.date), tz_(), 'dd-MM-yyyy') : '');
    const pdf = Utilities.newBlob(veilleeHtml_(v, d.repertoire, img), MimeType.HTML, nom + '.html').getAs(MimeType.PDF).setName(nom + '.pdf');
    const it = dos.getFilesByName(nom + '.pdf');
    while (it.hasNext()) { const x = it.next(); try { x.setTrashed(true); } catch (e) { /* déjà parti */ } }
    const fichier = dos.createFile(pdf);
    return { url: fichier.getUrl(), nom: nom + '.pdf', data: Utilities.base64Encode(pdf.getBytes()) };
  });
}
function veilleeHtml_(v, repertoire, image) {
  const e = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]; }); };
  const br = function (s) { return e(s).replace(/\n/g, '<br>'); };
  const C = { Sketch: '#C2410C', Chant: '#1D4ED8', Ban: '#B91C1C', Cantique: '#6D28D9', Jeu: '#15803D', 'Prière': '#A16207', Autre: '#475569' };
  const coul = COULEUR_ENTETE;
  const dureeTxt = function (m) { m = Math.round(Number(m) || 0); return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60 ? pad_(m % 60) : '') : m + ' min'; };
  const heurePlus = function (h, min) { if (!h) return ''; const p = h.split(':'), t = Number(p[0]) * 60 + Number(p[1]) + Math.round(min); return pad_(Math.floor(t / 60) % 24) + ':' + pad_(t % 60); };
  let logo = '';
  try { logo = include('Logo').trim(); } catch (err) { logo = ''; }
  const parType = {};
  v.moments.forEach(function (m) { parType[m.type] = (parType[m.type] || 0) + 1; });
  const css =
    '@page{size:A4;margin:13mm 12mm}' +
    'body{font-family:Arial,Helvetica,sans-serif;color:#1f2933;font-size:10pt;margin:0}' +
    'table{border-collapse:collapse;width:100%}' +
    '.t{font-size:19pt;font-weight:bold;color:' + coul + ';letter-spacing:1.5px}' +
    '.n{font-size:14pt;font-weight:bold;margin-top:3px}' +
    '.s{font-size:9.5pt;color:#52606d;margin-top:3px}' +
    '.infos td{padding:7px 10px;border:1px solid #e4e7eb;background:#f8f9fb;font-size:8.5pt;color:#52606d;width:25%}' +
    '.infos b{display:block;font-size:11pt;color:#1f2933;margin-top:2px}' +
    'h2{font-size:11pt;color:' + coul + ';margin:16px 0 6px;text-transform:uppercase;letter-spacing:1px}' +
    '.g th{background:' + coul + ';color:#fff;font-size:8.5pt;text-align:left;padding:6px 7px}' +
    '.g td{padding:6px 7px;border-bottom:1px solid #e4e7eb;font-size:9.5pt;vertical-align:top}' +
    '.c{text-align:center}.r{text-align:right;white-space:nowrap}' +
    '.type{font-weight:bold;font-size:8.5pt}' +
    '.note{color:#52606d;font-size:8.5pt}' +
    '.par{page-break-inside:avoid;margin-bottom:12px;border-left:3px solid #e4e7eb;padding-left:10px}' +
    '.par b{font-size:10.5pt}.par div{font-size:9.5pt;line-height:1.45;margin-top:4px}' +
    '.pied{margin-top:20px;font-size:8pt;color:#7b8794;text-align:center;border-top:1px solid #e4e7eb;padding-top:8px}';
  let h = '<html><head><meta charset="utf-8"><style>' + css + '</style></head><body>';
  h += '<table><tr><td><div class="t">COURBE DE VEILLÉE</div><div class="n">' + e(v.nom) + '</div>' +
    '<div class="s">' + (v.date ? e(dateFr_(dateVal_(v.date)).replace(/^./, function (x) { return x.toUpperCase(); })) : '') + (v.heure ? ' · à ' + e(v.heure.replace(':', 'h')) : '') + (v.lieu ? ' · ' + e(v.lieu) : '') + '</div>' +
    '<div class="s"><b>' + e(REGLAGES.NOM) + '</b> · ' + e(REGLAGES.GROUPE) + '</div></td>' +
    (logo ? '<td style="width:70px;text-align:right"><img src="' + logo + '" style="width:62px"></td>' : '') + '</tr></table>';
  h += '<table style="margin:10px 0 12px"><tr><td style="height:4px;background:' + coul + '"></td></tr></table>';
  h += '<table class="infos"><tr><td>Moments<b>' + v.moments.length + '</b></td><td>Durée prévue<b>' + (v.duree ? dureeTxt(v.duree) : '—') + '</b></td>' +
    '<td>' + (v.heure && v.duree ? 'Fin prévue' : 'Thème') + '<b>' + (v.heure && v.duree ? e(heurePlus(v.heure, v.duree).replace(':', 'h')) : e(v.theme || '—')) + '</b></td>' +
    '<td>Contenu<b style="font-size:9pt">' + Object.keys(parType).map(function (k) { return parType[k] + ' ' + e(k.toLowerCase()) + (parType[k] > 1 && !/s$/.test(k) ? 's' : ''); }).join(', ') + '</b></td></tr></table>';
  if (v.theme && v.heure && v.duree) h += '<div class="s" style="margin-top:6px">Thème : <b>' + e(v.theme) + '</b></div>';
  h += '<h2>La courbe</h2><img src="' + image + '" style="width:100%">';
  h += '<h2>Déroulé</h2><table class="g"><tr><th class="c" style="width:22px">#</th>' + (v.heure ? '<th style="width:44px">Heure</th>' : '') + '<th style="width:62px">Type</th><th>Moment</th><th class="r" style="width:52px">Durée</th><th style="width:82px">Intensité</th><th style="width:100px">Responsable</th></tr>';
  let t = 0;
  v.moments.forEach(function (m, i) {
    h += '<tr><td class="c"><b>' + (i + 1) + '</b></td>' + (v.heure ? '<td>' + e(heurePlus(v.heure, t).replace(':', 'h')) + '</td>' : '') +
      '<td class="type" style="color:' + (C[m.type] || C.Autre) + '">' + e(m.type) + '</td><td><b>' + e(m.nom) + '</b>' + (m.note ? '<div class="note">' + e(m.note) + '</div>' : '') + '</td>' +
      '<td class="r">' + (m.duree ? dureeTxt(m.duree) : '—') + '</td><td>' + m.niveau + ' · ' + e(ANIMATION.NIVEAUX[m.niveau - 1]) + '</td><td>' + e(m.responsable) + '</td></tr>';
    t += Number(m.duree) || 0;
  });
  h += '</table>';
  if (v.remarque) h += '<p style="margin-top:12px;font-size:9pt;color:#52606d"><b>Remarque :</b> ' + br(v.remarque) + '</p>';
  // les paroles des chants, bans et cantiques du répertoire, dans l'ordre de la veillée
  const parId = {};
  repertoire.forEach(function (r) { parId[r.id] = r; });
  const vus = {}, annexes = [];
  v.moments.forEach(function (m) { const r = m.ref && parId[m.ref]; if (r && r.paroles && !vus[r.id]) { vus[r.id] = true; annexes.push(r); } });
  if (annexes.length) {
    h += '<h2 style="page-break-before:always">Paroles</h2>';
    annexes.forEach(function (r) { h += '<div class="par"><b style="color:' + (C[r.categorie] || C.Autre) + '">' + e(r.categorie) + ' · </b><b>' + e(r.nom) + '</b><div>' + br(r.paroles) + '</div></div>'; });
  }
  h += '<div class="pied">' + e(v.nom) + ' · ' + e(REGLAGES.NOM) + ' — ' + e(REGLAGES.GROUPE) + ' · généré le ' + Utilities.formatDate(new Date(), tz_(), 'dd/MM/yyyy à HH:mm') + ' par ' + e(REGLAGES.NOM_APP) + '</div>';
  return h + '</body></html>';
}

/* =====================================================================
 *  SECRÉTAIRE › LISTE D'EMPLACEMENTS  (commune à toutes les unités du groupe)
 *  Un seul fichier « Estela - Liste d'emplacements », rangé dans le dossier de la Troupe
 *  (à côté de son dossier « Info »), que la Meute, le Clan et la Maîtrise peuvent ouvrir. Chaque application (Meute, Troupe, Clan, Maîtrise) lit et écrit
 *  dans ce même fichier : une modification faite par une unité est vue par toutes les autres.
 *    · onglet « Emplacements » : un emplacement par ligne ;
 *    · onglet « Camps »        : les camps déjà faits sur place (unité, camp, date) → étoile + couleur ;
 *    · onglet « Supprimés »    : copie de chaque emplacement supprimé (pour pouvoir le retrouver).
 *  À la première ouverture, le fichier est créé et rempli avec les deux listes reçues
 *  (« LISTE_EMPLACEMENTS » et « Liste d'emplacements 2025-2026 »), doublons fusionnés.
 *  Téléphones : seuls les numéros libanais valides (8 chiffres, avec ou sans +961) sont gardés.
 * ===================================================================== */
const EMPL = {
  FICHIER: 'Estela - Liste d\'emplacements',
  UNITE_HOTE: 'troupe',          // la liste est rangée dans le dossier de cette unité (clé de MAITRISE.UNITES)
  PROP: 'EMPLACEMENTS_ID',
  TYPES: ['Église', 'Couvent', 'École', 'Université', 'Club', 'Local scout', 'Forêt / terrain', 'Municipalité', 'Centre / maison', 'Autre'],
  REGIONS: [
    ['Beyrouth', ['Beyrouth']],
    ['Mont-Liban', ['Metn', 'Keserwan', 'Jbeil', 'Baabda', 'Aley', 'Chouf']],
    ['Liban-Nord', ['Batroun', 'Koura', 'Zgharta', 'Bcharré', 'Tripoli', 'Minieh-Denniyeh']],
    ['Akkar', ['Akkar']],
    ['Bekaa', ['Zahlé', 'Bekaa Ouest', 'Rachaya']],
    ['Baalbek-Hermel', ['Baalbek', 'Hermel']],
    ['Liban-Sud', ['Saïda', 'Jezzine', 'Tyr']],
    ['Nabatieh', ['Nabatieh', 'Marjayoun', 'Hasbaya', 'Bint Jbeil']]
  ],
  PRIX_PAR: ['personne', 'nuit', 'jour'],
  DEVISES: ['$', 'LL'],
  // préfixes libanais : fixes 01 et 04 à 09, mobiles 03 70 71 76 78 79 81
  PREFIXES: ['01', '03', '04', '05', '06', '07', '08', '09', '70', '71', '76', '78', '79', '81'],
  AUTRE_COULEUR: '#6B7280',
  MAX: { NOM: 140, TEXTE: 160, LONG: 2000, TELS: 6, CAMP: 120 }
};
const EM_ENTETES = ['ID', 'Type', 'Nom', 'Localité', 'Caza', 'Région', 'District scout', 'Contact', 'Téléphones', 'Capacité', 'Capacité min', 'Capacité max',
  'Prix', 'Prix par', 'Devise', 'Frais notés', 'Toilettes', 'Remarques', 'Description', 'Marqué en rouge (ancienne liste)', 'Sources',
  'Ajouté par', 'Ajouté le', 'Modifié par', 'Modifié le', 'Version'];
const EC_ENTETES = ['ID', 'Emplacement (ID)', 'Unité', 'Camp', 'Date', 'Remarque', 'Ajouté par', 'Ajouté le'];
const ES_ENTETES = EM_ENTETES.concat(['Camps', 'Supprimé par', 'Supprimé le']);

/** Unités proposées pour un camp (avec leur couleur) : celles du groupe + la Maîtrise. */
function emplUnites_() {
  const l = (MAITRISE.UNITES || []).map(function (u) { return { nom: u.nom, couleur: u.couleur }; });
  if (!l.some(function (u) { return norm_(u.nom) === norm_('Maîtrise de Groupe'); })) l.push({ nom: 'Maîtrise de Groupe', couleur: '#DD6B0D' });
  if (!l.some(function (u) { return norm_(u.nom) === norm_(REGLAGES.NOM); })) l.push({ nom: REGLAGES.NOM, couleur: COULEUR_ENTETE });
  return l;
}
function emplQui_() { return REGLAGES.MAITRISE ? qui_() : REGLAGES.NOM; }   // une unité signe du nom de l'unité (pas d'adresse e-mail visible)

/* ---------- le fichier commun ---------- */
function emplOuvrir_(id) {
  try {
    const f = DriveApp.getFileById(id);
    if (f.isTrashed() || f.getMimeType() !== MimeType.GOOGLE_SHEETS) return null;
    return SpreadsheetApp.openById(id);
  } catch (e) { return null; }
}
function emplCherche_(dossier) {
  const it = dossier ? dossier.getFilesByName(EMPL.FICHIER) : DriveApp.getFilesByName(EMPL.FICHIER);
  const l = [];
  while (it.hasNext()) { const f = it.next(); if (!f.isTrashed() && f.getMimeType() === MimeType.GOOGLE_SHEETS) l.push(f); }
  // plusieurs copies : la plus ancienne (celle que les autres unités utilisent déjà)
  l.sort(function (a, b) { return (a.getDateCreated ? a.getDateCreated().getTime() : 0) - (b.getDateCreated ? b.getDateCreated().getTime() : 0); });
  return l.length ? SpreadsheetApp.openById(l[0].getId()) : null;
}
/**
 * Dossier où vit la liste : celui de la Troupe (à côté de son dossier « Info »), que toutes les unités peuvent ouvrir.
 * Connu par l'application de la Troupe et par la Maîtrise ; les autres unités trouvent le fichier par son nom.
 */
function emplMaison_() {
  const hote = (MAITRISE.UNITES || []).filter(function (u) { return u.cle === EMPL.UNITE_HOTE; })[0];
  if (!hote) return null;
  try {
    if (!REGLAGES.MAITRISE) return norm_(REGLAGES.NOM) === norm_(hote.nom) ? racine_() : null;
    const info = infoUnite_(hote).info;
    if (!info) return null;
    if (norm_(info.getName()) !== norm_(CONFIG.DOSSIER_INFO)) return info;
    const p = info.getParents();
    return p.hasNext() ? p.next() : info;
  } catch (e) { return null; }
}
function emplDans_(ss, dossier) {
  try {
    const it = DriveApp.getFileById(ss.getId()).getParents();
    while (it.hasNext()) if (it.next().getId() === dossier.getId()) return true;
  } catch (e) { /* rien */ }
  return false;
}
/** Le classeur commun : celui du dossier de la Troupe ; sinon le fichier déjà connu ou visible par ce compte ; créé (et rempli) par la Troupe ou la Maîtrise. */
function emplClasseur_() {
  if (CTX_) throw new Error('Lecture seule.');
  const props = PropertiesService.getScriptProperties();
  const maison = emplMaison_();
  let ss = maison ? emplCherche_(maison) : null;
  if (!ss) { const id = props.getProperty(EMPL.PROP); if (id) ss = emplOuvrir_(id); }
  if (!ss) { try { ss = emplCherche_(null); } catch (e) { ss = null; } }
  if (ss && maison && !emplDans_(ss, maison)) {
    // la liste existe ailleurs (ex. dossier du groupe) : on la range chez la Troupe, sans en créer une deuxième
    try { DriveApp.getFileById(ss.getId()).moveTo(maison); } catch (e) { /* pas le droit de la déplacer : on l'utilise où elle est */ }
  }
  if (!ss) {
    if (!maison) throw new Error('La liste commune n\'est pas encore créée, ou ce compte ne la voit pas. Ouvrez d\'abord Secrétaire › Liste d\'emplacements dans l\'application de la Troupe (elle crée le fichier « ' + EMPL.FICHIER + ' » dans le dossier de la Troupe), puis revenez ici et appuyez sur « Réessayer ».');
    try {
      ss = SpreadsheetApp.create(EMPL.FICHIER);
      DriveApp.getFileById(ss.getId()).moveTo(maison);
    } catch (e) {
      if (ss) { try { DriveApp.getFileById(ss.getId()).setTrashed(true); } catch (e2) { /* rien */ } }   // pas de copie orpheline
      throw new Error('Impossible de créer « ' + EMPL.FICHIER + ' » dans le dossier « ' + maison.getName() + ' » : ce compte n\'a pas le droit de le modifier.');
    }
    emplRemplir_(ss);
  }
  props.setProperty(EMPL.PROP, ss.getId());
  return ss;
}
function feuillesEmpl_() {
  const ss = emplClasseur_();
  const em = feuille_(ss, 'Emplacements', EM_ENTETES, {
    largeurs: [80, 120, 260, 150, 100, 110, 110, 190, 200, 160, 70, 70, 70, 80, 60, 220, 80, 280, 280, 90, 120, 160, 130, 160, 130, 60],
    formats: { 'Ajouté le': 'dd/mm/yyyy hh:mm', 'Modifié le': 'dd/mm/yyyy hh:mm', 'Téléphones': '@' }, cacherId: true
  });
  const ca = feuille_(ss, 'Camps', EC_ENTETES, { largeurs: [80, 100, 160, 220, 95, 260, 160, 130], formats: { 'Date': 'dd/mm/yyyy', 'Ajouté le': 'dd/mm/yyyy hh:mm' }, cacherId: true });
  return { ss: ss, em: em, ca: ca };
}
/** Première ouverture : les deux listes reçues, déjà fusionnées (fichier « Emplacements.html » du projet). */
function emplRemplir_(ss) {
  const sh = feuille_(ss, 'Emplacements', EM_ENTETES, { formats: { 'Téléphones': '@' }, cacherId: true });
  feuille_(ss, 'Camps', EC_ENTETES, { cacherId: true });
  if (sh.getLastRow() > 1) return;
  let graine = [];
  try { graine = JSON.parse(include('Emplacements')); } catch (e) { graine = []; }
  if (!graine.length) return;
  const maintenant = new Date(), h = EM_ENTETES;
  const rows = graine.map(function (g) {
    const o = {
      'ID': id_(), 'Type': g.t, 'Nom': g.n, 'Localité': g.l, 'Caza': g.c, 'Région': g.r, 'District scout': g.d, 'Contact': g.p,
      'Téléphones': (g.tel || []).map(emplTelAffiche_).join(', '), 'Capacité': g.cap, 'Capacité min': g.cmin == null ? '' : g.cmin, 'Capacité max': g.cmax == null ? '' : g.cmax,
      'Frais notés': g.f, 'Toilettes': g.wc ? 'Oui' : '', 'Remarques': g.rq, 'Marqué en rouge (ancienne liste)': g.rouge ? 'Oui' : '', 'Sources': g.s,
      'Ajouté par': 'Listes reçues', 'Ajouté le': maintenant, 'Version': 1
    };
    return h.map(function (k) { return o[k] === undefined || o[k] === null ? '' : cellule_(o[k]); });
  });
  sh.getRange(2, 1, rows.length, h.length).setValues(rows);
}

/* ---------- téléphones ---------- */
function emplNumero_(d) {
  d = String(d || '').replace(/\D/g, '');
  if (d.indexOf('00961') === 0) d = d.slice(5);
  else if (d.indexOf('961') === 0 && d.length >= 10) d = d.slice(3);
  if (d.length === 7 && '1345689'.indexOf(d.charAt(0)) >= 0) d = '0' + d;     // ancien format sans le 0 (3 123456)
  return d.length === 8 && EMPL.PREFIXES.indexOf(d.slice(0, 2)) >= 0 ? d : '';
}
function emplTelAffiche_(d) { return d.slice(0, 2) + ' ' + d.slice(2, 5) + ' ' + d.slice(5); }
/** Les numéros valides d'un morceau de texte (« 03-123456 », « +961 71 123 456 », « 01 201 345 / 01 219 407 », « 09 952 861-2 »). */
function emplDecoupe_(m) {
  const ch = String(m || '').match(/\d+/g) || [], out = [];
  let i = 0;
  while (i < ch.length) {
    if (ch[i] === '961' || ch[i] === '00961') { i++; continue; }
    let trouve = null;
    for (let j = Math.min(ch.length, i + 4); j > i && !trouve; j--) {
      const d = ch.slice(i, j).join('');
      if (d.length > 13 || (j - i > 1 && ch[i].length > 2)) continue;     // un numéro commence par un petit groupe (03, 71…) ou est d'un seul bloc
      const v = emplNumero_(d);
      if (v && (d.length >= 8 || j === ch.length || ch[j].length >= 2)) trouve = { v: v, j: j };
    }
    if (!trouve) { i++; continue; }
    if (out.indexOf(trouve.v) < 0) out.push(trouve.v);
    i = trouve.j;
    while (i < ch.length && ch[i].length <= 2 && (i + 1 === ch.length || ch[i + 1].length <= 2)) i++;   // « 861-2 » : suffixe ignoré
  }
  return out;
}
/** Découpe un texte libre (ou une liste) en numéros : { ok: ['03123456'], refuses: ['12 34'] }. */
function emplTels_(v) {
  const morceaux = (Array.isArray(v) ? v : String(v || '').split(/[,;\n]|\s\/\s|\/(?=\s*\+)/)).map(texte_).filter(String);
  const ok = [], refuses = [];
  morceaux.forEach(function (m) {
    const l = emplDecoupe_(m);
    l.forEach(function (n) { if (ok.indexOf(n) < 0) ok.push(n); });
    if (!l.length && /\d/.test(m)) refuses.push(m);
  });
  return { ok: ok, refuses: refuses };
}

/* ---------- lecture ---------- */
function emplNombre_(v) { const n = Number(v); return v === '' || v == null || isNaN(n) ? null : n; }
function emplType_(v) { const n = norm_(v); for (let i = 0; i < EMPL.TYPES.length; i++) if (norm_(EMPL.TYPES[i]) === n) return EMPL.TYPES[i]; return texte_(v) || 'Autre'; }
function emplRegionDe_(caza) {
  const n = norm_(caza);
  for (let i = 0; i < EMPL.REGIONS.length; i++) if (EMPL.REGIONS[i][1].some(function (c) { return norm_(c) === n; })) return EMPL.REGIONS[i][0];
  return '';
}
function lireEmpl_(f) {
  const camps = {};
  lignes_(f.ca).forEach(function (o) {
    const e = texte_(o['Emplacement (ID)']);
    if (!e || !texte_(o['Unité'])) return;
    (camps[e] = camps[e] || []).push({ id: String(o['ID']), unite: texte_(o['Unité']), camp: texte_(o['Camp']), date: dateIso_(o['Date']), remarque: texte_(o['Remarque']), par: texte_(o['Ajouté par']), le: dateHeure_(o['Ajouté le']) });
  });
  return lignes_(f.em).filter(function (o) { return texte_(o['Nom']); }).map(function (o) {
    const id = String(o['ID']);
    const c = (camps[id] || []).sort(function (a, b) { return (b.date + b.le).localeCompare(a.date + a.le); });
    return {
      id: id, type: emplType_(o['Type']), nom: texte_(o['Nom']), lieu: texte_(o['Localité']), caza: texte_(o['Caza']), region: texte_(o['Région']) || emplRegionDe_(o['Caza']),
      district: texte_(o['District scout']), contact: texte_(o['Contact']), tels: emplTels_(String(o['Téléphones'] || '')).ok,
      capacite: texte_(o['Capacité']), capMin: emplNombre_(o['Capacité min']), capMax: emplNombre_(o['Capacité max']),
      prix: emplNombre_(o['Prix']), prixPar: texte_(o['Prix par']), devise: texte_(o['Devise']) || '$', frais: texte_(o['Frais notés']),
      toilettes: /^(oui|x|yes|true|1)$/i.test(texte_(o['Toilettes'])), remarques: texte_(o['Remarques']), description: texte_(o['Description']),
      rouge: /^oui$/i.test(texte_(o['Marqué en rouge (ancienne liste)'])), sources: texte_(o['Sources']),
      par: texte_(o['Ajouté par']), le: dateHeure_(o['Ajouté le']), modifiePar: texte_(o['Modifié par']), modifieLe: dateHeure_(o['Modifié le']),
      version: Number(o['Version']) || 0, camps: c, _row: o._row
    };
  });
}
function reponseEmpl_(f, extra) {
  const l = lireEmpl_(f);
  l.forEach(function (e) { delete e._row; });
  return Object.assign({
    liste: l, types: EMPL.TYPES, regions: EMPL.REGIONS, unites: emplUnites_(), autreCouleur: EMPL.AUTRE_COULEUR, prixPar: EMPL.PRIX_PAR, devises: EMPL.DEVISES,
    moi: REGLAGES.NOM, lien: f.ss.getUrl(), lu: Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm')
  }, extra || {});
}

function emplacementsDonnees() {
  acces_('secretaire');
  try { return reponseEmpl_(feuillesEmpl_()); }
  catch (e) {
    // le fichier est introuvable ou inaccessible : l'interface propose de coller son lien
    return { erreur: String(e && e.message || e), aLier: true, nomFichier: EMPL.FICHIER };
  }
}

/** Choisir le fichier commun à la main (lien ou ID collé), si l'application ne le trouve pas toute seule. */
function emplacementsLier(lien) {
  acces_('secretaire');
  const m = /[-\w]{25,}/.exec(texte_(lien));
  if (!m) throw new Error('Collez le lien du fichier « ' + EMPL.FICHIER + ' » (Google Sheets).');
  const ss = emplOuvrir_(m[0]);
  if (!ss) throw new Error('Ce fichier est introuvable ou n\'est pas partagé avec ce compte.');
  if (!ss.getSheetByName('Emplacements')) throw new Error('Ce fichier n\'a pas d\'onglet « Emplacements » : ce n\'est pas la liste d\'emplacements.');
  PropertiesService.getScriptProperties().setProperty(EMPL.PROP, ss.getId());
  return reponseEmpl_(feuillesEmpl_());
}

/* ---------- écriture ---------- */
function emplVerifier_(e) {
  e = e || {};
  const nom = texte_(e.nom).replace(/\s+/g, ' ');
  if (!nom) throw new Error('Indiquez le nom de l\'emplacement.');
  if (nom.length > EMPL.MAX.NOM) throw new Error('Nom : ' + EMPL.MAX.NOM + ' caractères au plus.');
  const lieu = texte_(e.lieu).replace(/\s+/g, ' ').slice(0, EMPL.MAX.TEXTE);
  if (!lieu) throw new Error('Indiquez la localité (le village ou la ville).');
  const caza = texte_(e.caza);
  const region = emplRegionDe_(caza) || (EMPL.REGIONS.some(function (r) { return r[0] === texte_(e.region); }) ? texte_(e.region) : '');
  const tels = emplTels_(e.tels);
  if (tels.ok.length > EMPL.MAX.TELS) throw new Error(EMPL.MAX.TELS + ' numéros au plus.');
  let capMax = emplNombre_(e.capMax), capMin = emplNombre_(e.capMin);
  if (e.illimite) { capMax = 9999; capMin = capMin == null ? 0 : capMin; }
  [capMin, capMax].forEach(function (n) { if (n != null && (n < 0 || n > 9999 || Math.floor(n) !== n)) throw new Error('Capacité : un nombre entier de personnes.'); });
  if (capMin != null && capMax != null && capMin > capMax) throw new Error('Capacité : le minimum dépasse le maximum.');
  let prix = emplNombre_(e.prix);
  if (e.gratuit) prix = 0;
  if (prix != null && (prix < 0 || prix > 1e9)) throw new Error('Prix invalide.');
  const prixPar = prix ? (EMPL.PRIX_PAR.indexOf(texte_(e.prixPar)) >= 0 ? texte_(e.prixPar) : '') : '';
  if (prix && !prixPar) throw new Error('Choisissez si le prix est par personne, par nuit ou par jour.');
  const devise = EMPL.DEVISES.indexOf(texte_(e.devise)) >= 0 ? texte_(e.devise) : '$';
  return {
    v: {
      'Type': emplType_(e.type), 'Nom': nom, 'Localité': lieu, 'Caza': caza.slice(0, 40), 'Région': region, 'District scout': texte_(e.district).slice(0, 40),
      'Contact': texte_(e.contact).slice(0, EMPL.MAX.TEXTE), 'Téléphones': tels.ok.map(emplTelAffiche_).join(', '),
      'Capacité': texte_(e.capacite).slice(0, EMPL.MAX.TEXTE), 'Capacité min': capMin == null ? '' : capMin, 'Capacité max': capMax == null ? '' : capMax,
      'Prix': prix == null ? '' : prix, 'Prix par': prixPar, 'Devise': prix ? devise : '', 'Toilettes': e.toilettes ? 'Oui' : '',
      'Remarques': texte_(e.remarques).slice(0, EMPL.MAX.LONG), 'Description': texte_(e.description).slice(0, EMPL.MAX.LONG)
    },
    retires: tels.refuses
  };
}
function emplLigneParId_(sh, id) {
  // recherche directe dans la colonne ID (les autres unités ont pu ajouter / supprimer des lignes entre-temps)
  const h = entetes_(sh), c = h.indexOf('ID'), last = sh.getLastRow();
  if (c < 0 || last < 2 || !id) return null;
  const ids = sh.getRange(2, c + 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) {
    const r = sh.getRange(i + 2, 1, 1, h.length).getValues()[0], o = { _row: i + 2 };
    h.forEach(function (k, j) { if (k) o[k] = r[j]; });
    return o;
  }
  return null;
}
function emplAjouterLigne_(sh, obj) {
  // appendRow : ajout atomique, même si une autre unité ajoute une ligne au même moment
  const h = entetes_(sh);
  sh.appendRow(h.map(function (k) { return obj[k] === undefined || obj[k] === null ? '' : cellule_(obj[k]); }));
}

/** Ajoute (sans id) ou modifie (avec id + version lue) un emplacement. */
function emplacementEnregistrer(e) {
  acces_('secretaire');
  e = e || {};
  const x = emplVerifier_(e);
  return avecVerrou_(function () {
    const f = feuillesEmpl_();
    const qui = emplQui_(), maintenant = new Date();
    let id = texte_(e.id);
    if (id) {
      const ligne = emplLigneParId_(f.em, id);
      if (!ligne) throw new Error('Cet emplacement n\'existe plus : une autre unité l\'a supprimé. Actualisez la liste.');
      const version = Number(ligne['Version']) || 0;
      if (e.version != null && Number(e.version) !== version) {
        throw new Error('Cet emplacement vient d\'être modifié par ' + (texte_(ligne['Modifié par']) || 'une autre unité') + '. Actualisez la liste puis refaites votre modification.');
      }
      maj_(f.em, ligne._row, Object.assign({}, x.v, { 'Modifié par': qui, 'Modifié le': maintenant, 'Version': version + 1 }));
    } else {
      id = id_();
      emplAjouterLigne_(f.em, Object.assign({ 'ID': id }, x.v, { 'Sources': 'Ajouté dans Estela', 'Ajouté par': qui, 'Ajouté le': maintenant, 'Version': 1 }));
    }
    return reponseEmpl_(f, { enregistre: id, retires: x.retires });
  });
}

function emplacementSupprimer(id) {
  acces_('secretaire');
  return avecVerrou_(function () {
    const f = feuillesEmpl_();
    const ligne = emplLigneParId_(f.em, texte_(id));
    if (!ligne) throw new Error('Cet emplacement a déjà été supprimé.');
    // une copie dans « Supprimés », avec ses camps, pour pouvoir le retrouver
    const sup = feuille_(f.ss, 'Supprimés', ES_ENTETES, { formats: { 'Supprimé le': 'dd/mm/yyyy hh:mm', 'Téléphones': '@' }, cacherId: true });
    const camps = lignes_(f.ca).filter(function (o) { return texte_(o['Emplacement (ID)']) === String(id); });
    const copie = {};
    EM_ENTETES.forEach(function (k) { copie[k] = ligne[k]; });
    copie['Camps'] = camps.map(function (c) { return texte_(c['Unité']) + ' · ' + texte_(c['Camp']) + ' · ' + dateIso_(c['Date']); }).join(' | ');
    copie['Supprimé par'] = emplQui_(); copie['Supprimé le'] = new Date();
    emplAjouterLigne_(sup, copie);
    f.em.deleteRow(ligne._row);
    camps.map(function (c) { return c._row; }).sort(function (a, b) { return b - a; }).forEach(function (r) { f.ca.deleteRow(r); });
    return reponseEmpl_(f);
  });
}

/** Un camp fait sur place : { emplacement, unite, camp, date, remarque } → étoile, et couleur de la dernière unité. */
function emplacementCampAjouter(c) {
  acces_('secretaire');
  c = c || {};
  const unite = texte_(c.unite).replace(/\s+/g, ' ').slice(0, 60);
  if (!unite) throw new Error('Choisissez l\'unité qui a campé ici.');
  const camp = texte_(c.camp).replace(/\s+/g, ' ');
  if (!camp) throw new Error('Indiquez le camp (ex : Camp d\'été 2025).');
  if (camp.length > EMPL.MAX.CAMP) throw new Error('Camp : ' + EMPL.MAX.CAMP + ' caractères au plus.');
  const date = dateVal_(c.date);
  if (!date) throw new Error('Indiquez la date du camp.');
  return avecVerrou_(function () {
    const f = feuillesEmpl_();
    if (!emplLigneParId_(f.em, texte_(c.emplacement))) throw new Error('Cet emplacement n\'existe plus : une autre unité l\'a supprimé.');
    emplAjouterLigne_(f.ca, { 'ID': id_(), 'Emplacement (ID)': texte_(c.emplacement), 'Unité': unite, 'Camp': camp, 'Date': date,
      'Remarque': texte_(c.remarque).slice(0, 500), 'Ajouté par': emplQui_(), 'Ajouté le': new Date() });
    return reponseEmpl_(f, { enregistre: texte_(c.emplacement) });
  });
}
function emplacementCampSupprimer(id) {
  acces_('secretaire');
  return avecVerrou_(function () {
    const f = feuillesEmpl_();
    const ligne = emplLigneParId_(f.ca, texte_(id));
    if (!ligne) throw new Error('Ce camp a déjà été retiré.');
    f.ca.deleteRow(ligne._row);
    return reponseEmpl_(f, { enregistre: texte_(ligne['Emplacement (ID)']) });
  });
}

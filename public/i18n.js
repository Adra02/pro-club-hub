// ============================================
// I18N.JS - TRADUZIONI COMPLETE CON "PREFERITI"
// ============================================

const translations = {
  it: {
    loading: 'Caricamento...',
    nav: {
      home: 'Home',
      players: 'Giocatori',
      teams: 'Squadre',
      favorites: 'Preferiti',  // ✅ AGGIUNTO
      requests: 'Richieste',
      profile: 'Profilo',
      admin: 'Admin',
      logout: 'Esci'
    },
    favorites: {  // ✅ NUOVA SEZIONE
      title: 'I Miei Preferiti',
      players: 'Giocatori Preferiti',
      teams: 'Squadre Preferite',
      noPlayers: 'Nessun giocatore nei preferiti',
      noTeams: 'Nessuna squadra nei preferiti'
    },
    home: {
      title: 'Benvenuto su Pro Club Hub',
      subtitle: 'La community definitiva per i giocatori di Pro Club',
      feature1: {
        title: 'Trova Giocatori',
        desc: 'Cerca giocatori per ruolo, livello e piattaforma'
      },
      feature2: {
        title: 'Crea Squadre',
        desc: 'Forma la tua squadra e competi insieme'
      },
      feature3: {
        title: 'Lascia Feedback',
        desc: 'Valuta i giocatori e costruisci la tua reputazione'
      }
    },
    auth: {
      login: 'Accedi',
      register: 'Registrati',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      usernameLabel: 'Username',
      roleLabel: 'Ruolo Principale',
      platformLabel: 'Piattaforma',
      nationalityLabel: 'Nazionalità',
      levelLabel: 'Livello',
      selectRole: 'Seleziona ruolo',
      selectPlatform: 'Seleziona piattaforma',
      noAccount: 'Non hai un account?',
      haveAccount: 'Hai già un account?',
      registerLink: 'Registrati',
      loginLink: 'Accedi',
      forgotPassword: 'Password dimenticata?',
      recoverPassword: 'Recupera Password',
      recoverPasswordDesc: 'Inserisci la tua email e ti invieremo un link per reimpostare la password.',
      sendLink: 'Invia Link',
      backToLogin: 'Torna al login'
    },
    common: {
      level: 'Livello',
      feedback: 'feedback',
      search: 'Cerca',
      save: 'Salva Modifiche'
    },
    players: {
      title: 'Cerca Giocatori',
      searchPlaceholder: '🔍 Cerca per nome...',
      allRoles: 'Tutti i ruoli',
      allPlatforms: 'Tutte le piattaforme',
      nationality: 'Nazionalità',
      minLevel: 'Livello minimo:',
      maxLevel: 'Livello massimo:'
    },
    teams: {
      title: 'Squadre',
      create: 'Crea Squadra',
      createTitle: 'Crea Squadra',
      searchPlaceholder: '🔍 Cerca squadra...',
      allPlatforms: 'Tutte le piattaforme',
      nationality: 'Nazionalità',
      nameLabel: 'Nome Squadra',
      descriptionLabel: 'Descrizione',
      platformLabel: 'Piattaforma',
      nationalityLabel: 'Nazionalità',
      instagramLabel: 'Instagram (username)',
      tiktokLabel: 'TikTok (username)',
      liveLinkLabel: 'Link Live (Twitch/YouTube)',
      lookingForPlayersCheckbox: 'Cerchiamo giocatori',
      selectPlatform: 'Seleziona piattaforma'
    },
    requests: {
      title: 'Richieste',
      received: 'Ricevute',
      sent: 'Inviate'
    },
    profile: {
      edit: 'Modifica Profilo',
      editTitle: 'Modifica Profilo',
      email: 'Email',
      platform: 'Piattaforma',
      nationality: 'Nazionalità',
      primaryRole: 'Ruolo Principale',
      secondaryRoles: 'Ruoli Secondari',
      secondaryRolesLabel: 'Ruoli Secondari (max 2)',
      bio: 'Bio',
      bioLabel: 'Bio',
      lookingForTeam: 'Cerca Squadra',
      lookingForTeamCheckbox: 'Cerco squadra',
      social: 'Social',
      instagramLabel: 'Instagram (username)',
      tiktokLabel: 'TikTok (username)',
      resetPassword: 'Cambia Password (via Email)',
      feedbackReceived: 'Feedback Ricevuti'
    },
    feedback: {
      title: 'Lascia Feedback',
      ratingLabel: 'Valutazione',
      tagsLabel: 'Tag (opzionale)',
      commentLabel: 'Commento (opzionale)',
      submit: 'Invia Feedback',
      tags: {
        serious: 'Serio',
        communicative: 'Comunicativo',
        fun: 'Divertente',
        toxic: 'Tossico',
        teamPlayer: 'Giocatore di squadra',
        leader: 'Leader',
        reliable: 'Affidabile',
        punctual: 'Puntuale',
        technical: 'Tecnico',
        tactical: 'Tattico'
      }
    },
    admin: {
      title: 'Pannello Amministrativo',
      stats: {
        users: 'Utenti Totali',
        teams: 'Squadre Totali',
        inactive: 'Utenti Inattivi',
        requests: 'Richieste Pendenti'
      },
      actions: {
        title: 'Azioni Amministrative',
        deleteTeams: 'Elimina Tutte le Squadre',
        resetProfiles: 'Reset Profili Giocatori'
      },
      newsletter: {
        title: 'Invia Newsletter',
        subject: 'Oggetto',
        message: 'Messaggio',
        send: 'Invia a Tutti gli Utenti'
      },
      users: {
        title: 'Gestione Utenti'
      }
    }
  },
  en: {
    loading: 'Loading...',
    nav: {
      home: 'Home',
      players: 'Players',
      teams: 'Teams',
      favorites: 'Favorites',  // ✅ AGGIUNTO
      requests: 'Requests',
      profile: 'Profile',
      admin: 'Admin',
      logout: 'Logout'
    },
    favorites: {  // ✅ NUOVA SEZIONE
      title: 'My Favorites',
      players: 'Favorite Players',
      teams: 'Favorite Teams',
      noPlayers: 'No players in favorites',
      noTeams: 'No teams in favorites'
    },
    home: {
      title: 'Welcome to Pro Club Hub',
      subtitle: 'The ultimate community for Pro Club players',
      feature1: {
        title: 'Find Players',
        desc: 'Search players by role, level and platform'
      },
      feature2: {
        title: 'Create Teams',
        desc: 'Build your team and compete together'
      },
      feature3: {
        title: 'Leave Feedback',
        desc: 'Rate players and build your reputation'
      }
    },
    auth: {
      login: 'Login',
      register: 'Register',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      usernameLabel: 'Username',
      roleLabel: 'Primary Role',
      platformLabel: 'Platform',
      nationalityLabel: 'Nationality',
      levelLabel: 'Level',
      selectRole: 'Select role',
      selectPlatform: 'Select platform',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      registerLink: 'Register',
      loginLink: 'Login',
      forgotPassword: 'Forgot password?',
      recoverPassword: 'Recover Password',
      recoverPasswordDesc: "Enter your email and we'll send you a link to reset your password.",
      sendLink: 'Send Link',
      backToLogin: 'Back to login'
    },
    common: {
      level: 'Level',
      feedback: 'feedback',
      search: 'Search',
      save: 'Save Changes'
    },
    players: {
      title: 'Search Players',
      searchPlaceholder: '🔍 Search by name...',
      allRoles: 'All roles',
      allPlatforms: 'All platforms',
      nationality: 'Nationality',
      minLevel: 'Min level:',
      maxLevel: 'Max level:'
    },
    teams: {
      title: 'Teams',
      create: 'Create Team',
      createTitle: 'Create Team',
      searchPlaceholder: '🔍 Search team...',
      allPlatforms: 'All platforms',
      nationality: 'Nationality',
      nameLabel: 'Team Name',
      descriptionLabel: 'Description',
      platformLabel: 'Platform',
      nationalityLabel: 'Nationality',
      instagramLabel: 'Instagram (username)',
      tiktokLabel: 'TikTok (username)',
      liveLinkLabel: 'Live Link (Twitch/YouTube)',
      lookingForPlayersCheckbox: 'Looking for players',
      selectPlatform: 'Select platform'
    },
    requests: {
      title: 'Requests',
      received: 'Received',
      sent: 'Sent'
    },
    profile: {
      edit: 'Edit Profile',
      editTitle: 'Edit Profile',
      email: 'Email',
      platform: 'Platform',
      nationality: 'Nationality',
      primaryRole: 'Primary Role',
      secondaryRoles: 'Secondary Roles',
      secondaryRolesLabel: 'Secondary Roles (max 2)',
      bio: 'Bio',
      bioLabel: 'Bio',
      lookingForTeam: 'Looking for Team',
      lookingForTeamCheckbox: 'Looking for team',
      social: 'Social',
      instagramLabel: 'Instagram (username)',
      tiktokLabel: 'TikTok (username)',
      resetPassword: 'Change Password (via Email)',
      feedbackReceived: 'Feedback Received'
    },
    feedback: {
      title: 'Leave Feedback',
      ratingLabel: 'Rating',
      tagsLabel: 'Tags (optional)',
      commentLabel: 'Comment (optional)',
      submit: 'Submit Feedback',
      tags: {
        serious: 'Serious',
        communicative: 'Communicative',
        fun: 'Fun',
        toxic: 'Toxic',
        teamPlayer: 'Team Player',
        leader: 'Leader',
        reliable: 'Reliable',
        punctual: 'Punctual',
        technical: 'Technical',
        tactical: 'Tactical'
      }
    },
    admin: {
      title: 'Admin Panel',
      stats: {
        users: 'Total Users',
        teams: 'Total Teams',
        inactive: 'Inactive Users',
        requests: 'Pending Requests'
      },
      actions: {
        title: 'Admin Actions',
        deleteTeams: 'Delete All Teams',
        resetProfiles: 'Reset Player Profiles'
      },
      newsletter: {
        title: 'Send Newsletter',
        subject: 'Subject',
        message: 'Message',
        send: 'Send to All Users'
      },
      users: {
        title: 'User Management'
      }
    }
  },
  es: {
    loading: 'Cargando...',
    nav: {
      home: 'Inicio',
      players: 'Jugadores',
      teams: 'Equipos',
      favorites: 'Favoritos',  // ✅ AGGIUNTO
      requests: 'Solicitudes',
      profile: 'Perfil',
      admin: 'Admin',
      logout: 'Salir'
    },
    favorites: {  // ✅ NUOVA SEZIONE
      title: 'Mis Favoritos',
      players: 'Jugadores Favoritos',
      teams: 'Equipos Favoritos',
      noPlayers: 'No hay jugadores en favoritos',
      noTeams: 'No hay equipos en favoritos'
    },
    home: {
      title: 'Bienvenido a Pro Club Hub',
      subtitle: 'La comunidad definitiva para jugadores de Pro Club',
      feature1: {
        title: 'Encuentra Jugadores',
        desc: 'Busca jugadores por rol, nivel y plataforma'
      },
      feature2: {
        title: 'Crea Equipos',
        desc: 'Forma tu equipo y compite juntos'
      },
      feature3: {
        title: 'Deja Comentarios',
        desc: 'Valora jugadores y construye tu reputación'
      }
    },
    auth: {
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      emailLabel: 'Email',
      passwordLabel: 'Contraseña',
      usernameLabel: 'Usuario',
      roleLabel: 'Rol Principal',
      platformLabel: 'Plataforma',
      nationalityLabel: 'Nacionalidad',
      levelLabel: 'Nivel',
      selectRole: 'Selecciona rol',
      selectPlatform: 'Selecciona plataforma',
      noAccount: '¿No tienes cuenta?',
      haveAccount: '¿Ya tienes cuenta?',
      registerLink: 'Regístrate',
      loginLink: 'Iniciar sesión',
      forgotPassword: '¿Olvidaste tu contraseña?',
      recoverPassword: 'Recuperar Contraseña',
      recoverPasswordDesc: 'Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.',
      sendLink: 'Enviar Enlace',
      backToLogin: 'Volver al inicio de sesión'
    },
    common: {
      level: 'Nivel',
      feedback: 'comentarios',
      search: 'Buscar',
      save: 'Guardar Cambios'
    },
    players: {
      title: 'Buscar Jugadores',
      searchPlaceholder: '🔍 Buscar por nombre...',
      allRoles: 'Todos los roles',
      allPlatforms: 'Todas las plataformas',
      nationality: 'Nacionalidad',
      minLevel: 'Nivel mínimo:',
      maxLevel: 'Nivel máximo:'
    },
    teams: {
      title: 'Equipos',
      create: 'Crear Equipo',
      createTitle: 'Crear Equipo',
      searchPlaceholder: '🔍 Buscar equipo...',
      allPlatforms: 'Todas las plataformas',
      nationality: 'Nacionalidad',
      nameLabel: 'Nombre del Equipo',
      descriptionLabel: 'Descripción',
      platformLabel: 'Plataforma',
      nationalityLabel: 'Nacionalidad',
      instagramLabel: 'Instagram (usuario)',
      tiktokLabel: 'TikTok (usuario)',
      liveLinkLabel: 'Enlace en Vivo (Twitch/YouTube)',
      lookingForPlayersCheckbox: 'Buscamos jugadores',
      selectPlatform: 'Selecciona plataforma'
    },
    requests: {
      title: 'Solicitudes',
      received: 'Recibidas',
      sent: 'Enviadas'
    },
    profile: {
      edit: 'Editar Perfil',
      editTitle: 'Editar Perfil',
      email: 'Email',
      platform: 'Plataforma',
      nationality: 'Nacionalidad',
      primaryRole: 'Rol Principal',
      secondaryRoles: 'Roles Secundarios',
      secondaryRolesLabel: 'Roles Secundarios (máx 2)',
      bio: 'Biografía',
      bioLabel: 'Biografía',
      lookingForTeam: 'Busco Equipo',
      lookingForTeamCheckbox: 'Busco equipo',
      social: 'Redes',
      instagramLabel: 'Instagram (usuario)',
      tiktokLabel: 'TikTok (usuario)',
      resetPassword: 'Cambiar Contraseña (vía Email)',
      feedbackReceived: 'Comentarios Recibidos'
    },
    feedback: {
      title: 'Dejar Comentario',
      ratingLabel: 'Valoración',
      tagsLabel: 'Etiquetas (opcional)',
      commentLabel: 'Comentario (opcional)',
      submit: 'Enviar Comentario',
      tags: {
        serious: 'Serio',
        communicative: 'Comunicativo',
        fun: 'Divertido',
        toxic: 'Tóxico',
        teamPlayer: 'Jugador de Equipo',
        leader: 'Líder',
        reliable: 'Confiable',
        punctual: 'Puntual',
        technical: 'Técnico',
        tactical: 'Táctico'
      }
    },
    admin: {
      title: 'Panel de Administración',
      stats: {
        users: 'Usuarios Totales',
        teams: 'Equipos Totales',
        inactive: 'Usuarios Inactivos',
        requests: 'Solicitudes Pendientes'
      },
      actions: {
        title: 'Acciones Administrativas',
        deleteTeams: 'Eliminar Todos los Equipos',
        resetProfiles: 'Resetear Perfiles de Jugadores'
      },
      newsletter: {
        title: 'Enviar Newsletter',
        subject: 'Asunto',
        message: 'Mensaj',
        send: 'Enviar a Todos los Usuarios'
      },
      users: {
        title: 'Gestión de Usuarios'
      }
    }
  },
  fr: {
    loading: 'Chargement...',
    nav: {
      home: 'Accueil',
      players: 'Joueurs',
      teams: 'Équipes',
      favorites: 'Favoris',  // ✅ AGGIUNTO
      requests: 'Demandes',
      profile: 'Profil',
      admin: 'Admin',
      logout: 'Déconnexion'
    },
    favorites: {  // ✅ NUOVA SEZIONE
      title: 'Mes Favoris',
      players: 'Joueurs Favoris',
      teams: 'Équipes Favorites',
      noPlayers: 'Aucun joueur dans les favoris',
      noTeams: 'Aucune équipe dans les favoris'
    },
    home: {
      title: 'Bienvenue sur Pro Club Hub',
      subtitle: 'La communauté ultime pour les joueurs de Pro Club',
      feature1: {
        title: 'Trouver des Joueurs',
        desc: 'Rechercher des joueurs par rôle, niveau et plateforme'
      },
      feature2: {
        title: 'Créer des Équipes',
        desc: 'Former votre équipe et concourir ensemble'
      },
      feature3: {
        title: 'Laisser des Avis',
        desc: 'Évaluer les joueurs et construire votre réputation'
      }
    },
    auth: {
      login: 'Connexion',
      register: 'Inscription',
      emailLabel: 'Email',
      passwordLabel: 'Mot de passe',
      usernameLabel: 'Nom d\'utilisateur',
      roleLabel: 'Rôle Principal',
      platformLabel: 'Plateforme',
      nationalityLabel: 'Nationalité',
      levelLabel: 'Niveau',
      selectRole: 'Sélectionner un rôle',
      selectPlatform: 'Sélectionner une plateforme',
      noAccount: 'Pas de compte?',
      haveAccount: 'Vous avez déjà un compte?',
      registerLink: 'S\'inscrire',
      loginLink: 'Se connecter',
      forgotPassword: 'Mot de passe oublié?',
      recoverPassword: 'Récupérer le Mot de Passe',
      recoverPasswordDesc: 'Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.',
      sendLink: 'Envoyer le Lien',
      backToLogin: 'Retour à la connexion'
    },
    common: {
      level: 'Niveau',
      feedback: 'avis',
      search: 'Rechercher',
      save: 'Enregistrer les Modifications'
    },
    players: {
      title: 'Rechercher des Joueurs',
      searchPlaceholder: '🔍 Rechercher par nom...',
      allRoles: 'Tous les rôles',
      allPlatforms: 'Toutes les plateformes',
      nationality: 'Nationalité',
      minLevel: 'Niveau minimum:',
      maxLevel: 'Niveau maximum:'
    },
    teams: {
      title: 'Équipes',
      create: 'Créer une Équipe',
      createTitle: 'Créer une Équipe',
      searchPlaceholder: '🔍 Rechercher une équipe...',
      allPlatforms: 'Toutes les plateformes',
      nationality: 'Nationalité',
      nameLabel: 'Nom de l\'Équipe',
      descriptionLabel: 'Description',
      platformLabel: 'Plateforme',
      nationalityLabel: 'Nationalité',
      instagramLabel: 'Instagram (nom d\'utilisateur)',
      tiktokLabel: 'TikTok (nom d\'utilisateur)',
      liveLinkLabel: 'Lien en Direct (Twitch/YouTube)',
      lookingForPlayersCheckbox: 'Recherche de joueurs',
      selectPlatform: 'Sélectionner une plateforme'
    },
    requests: {
      title: 'Demandes',
      received: 'Reçues',
      sent: 'Envoyées'
    },
    profile: {
      edit: 'Modifier le Profil',
      editTitle: 'Modifier le Profil',
      email: 'Email',
      platform: 'Plateforme',
      nationality: 'Nationalité',
      primaryRole: 'Rôle Principal',
      secondaryRoles: 'Rôles Secondaires',
      secondaryRolesLabel: 'Rôles Secondaires (max 2)',
      bio: 'Bio',
      bioLabel: 'Bio',
      lookingForTeam: 'Recherche une Équipe',
      lookingForTeamCheckbox: 'Recherche une équipe',
      social: 'Réseaux',
      instagramLabel: 'Instagram (nom d\'utilisateur)',
      tiktokLabel: 'TikTok (nom d\'utilisateur)',
      resetPassword: 'Changer le Mot de Passe (via Email)',
      feedbackReceived: 'Avis Reçus'
    },
    feedback: {
      title: 'Laisser un Avis',
      ratingLabel: 'Évaluation',
      tagsLabel: 'Tags (optionnel)',
      commentLabel: 'Commentaire (optionnel)',
      submit: 'Envoyer l\'Avis',
      tags: {
        serious: 'Sérieux',
        communicative: 'Communicatif',
        fun: 'Amusant',
        toxic: 'Toxique',
        teamPlayer: 'Joueur d\'Équipe',
        leader: 'Leader',
        reliable: 'Fiable',
        punctual: 'Ponctuel',
        technical: 'Technique',
        tactical: 'Tactique'
      }
    },
    admin: {
      title: 'Panneau d\'Administration',
      stats: {
        users: 'Utilisateurs Totaux',
        teams: 'Équipes Totales',
        inactive: 'Utilisateurs Inactifs',
        requests: 'Demandes en Attente'
      },
      actions: {
        title: 'Actions Administratives',
        deleteTeams: 'Supprimer Toutes les Équipes',
        resetProfiles: 'Réinitialiser les Profils des Joueurs'
      },
      newsletter: {
        title: 'Envoyer une Newsletter',
        subject: 'Sujet',
        message: 'Message',
        send: 'Envoyer à Tous les Utilisateurs'
      },
      users: {
        title: 'Gestion des Utilisateurs'
      }
    }
  },
  pt: {
    loading: 'Carregando...',
    nav: {
      home: 'Início',
      players: 'Jogadores',
      teams: 'Equipes',
      favorites: 'Favoritos',  // ✅ AGGIUNTO
      requests: 'Solicitações',
      profile: 'Perfil',
      admin: 'Admin',
      logout: 'Sair'
    },
    favorites: {  // ✅ NUOVA SEZIONE
      title: 'Meus Favoritos',
      players: 'Jogadores Favoritos',
      teams: 'Equipes Favoritas',
      noPlayers: 'Nenhum jogador nos favoritos',
      noTeams: 'Nenhuma equipe nos favoritos'
    },
    home: {
      title: 'Bem-vindo ao Pro Club Hub',
      subtitle: 'A comunidade definitiva para jogadores de Pro Club',
      feature1: {
        title: 'Encontrar Jogadores',
        desc: 'Procurar jogadores por função, nível e plataforma'
      },
      feature2: {
        title: 'Criar Equipes',
        desc: 'Formar sua equipe e competir juntos'
      },
      feature3: {
        title: 'Deixar Feedback',
        desc: 'Avaliar jogadores e construir sua reputação'
      }
    },
    auth: {
      login: 'Entrar',
      register: 'Registrar',
      emailLabel: 'Email',
      passwordLabel: 'Senha',
      usernameLabel: 'Nome de usuário',
      roleLabel: 'Função Principal',
      platformLabel: 'Plataforma',
      nationalityLabel: 'Nacionalidade',
      levelLabel: 'Nível',
      selectRole: 'Selecionar função',
      selectPlatform: 'Selecionar plataforma',
      noAccount: 'Não tem uma conta?',
      haveAccount: 'Já tem uma conta?',
      registerLink: 'Registrar',
      loginLink: 'Entrar',
      forgotPassword: 'Esqueceu a senha?',
      recoverPassword: 'Recuperar Senha',
      recoverPasswordDesc: 'Digite seu email e enviaremos um link para redefinir sua senha.',
      sendLink: 'Enviar Link',
      backToLogin: 'Voltar ao login'
    },
    common: {
      level: 'Nível',
      feedback: 'feedback',
      search: 'Pesquisar',
      save: 'Salvar Alterações'
    },
    players: {
      title: 'Procurar Jogadores',
      searchPlaceholder: '🔍 Pesquisar por nome...',
      allRoles: 'Todas as funções',
      allPlatforms: 'Todas as plataformas',
      nationality: 'Nacionalidade',
      minLevel: 'Nível mínimo:',
      maxLevel: 'Nível máximo:'
    },
    teams: {
      title: 'Equipes',
      create: 'Criar Equipe',
      createTitle: 'Criar Equipe',
      searchPlaceholder: '🔍 Pesquisar equipe...',
      allPlatforms: 'Todas as plataformas',
      nationality: 'Nacionalidade',
      nameLabel: 'Nome da Equipe',
      descriptionLabel: 'Descrição',
      platformLabel: 'Plataforma',
      nationalityLabel: 'Nacionalidade',
      instagramLabel: 'Instagram (nome de usuário)',
      tiktokLabel: 'TikTok (nome de usuário)',
      liveLinkLabel: 'Link ao Vivo (Twitch/YouTube)',
      lookingForPlayersCheckbox: 'Procurando jogadores',
      selectPlatform: 'Selecionar plataforma'
    },
    requests: {
      title: 'Solicitações',
      received: 'Recebidas',
      sent: 'Enviadas'
    },
    profile: {
      edit: 'Editar Perfil',
      editTitle: 'Editar Perfil',
      email: 'Email',
      platform: 'Plataforma',
      nationality: 'Nacionalidade',
      primaryRole: 'Função Principal',
      secondaryRoles: 'Funções Secundárias',
      secondaryRolesLabel: 'Funções Secundárias (máx 2)',
      bio: 'Bio',
      bioLabel: 'Bio',
      lookingForTeam: 'Procurando Equipe',
      lookingForTeamCheckbox: 'Procurando equipe',
      social: 'Redes',
      instagramLabel: 'Instagram (nome de usuário)',
      tiktokLabel: 'TikTok (nome de usuário)',
      resetPassword: 'Alterar Senha (via Email)',
      feedbackReceived: 'Feedback Recebido'
    },
    feedback: {
      title: 'Deixar Feedback',
      ratingLabel: 'Avaliação',
      tagsLabel: 'Tags (opcional)',
      commentLabel: 'Comentário (opcional)',
      submit: 'Enviar Feedback',
      tags: {
        serious: 'Sério',
        communicative: 'Comunicativo',
        fun: 'Divertido',
        toxic: 'Tóxico',
        teamPlayer: 'Jogador de Equipe',
        leader: 'Líder',
        reliable: 'Confiável',
        punctual: 'Pontual',
        technical: 'Técnico',
        tactical: 'Tático'
      }
    },
    admin: {
      title: 'Painel Administrativo',
      stats: {
        users: 'Usuários Totais',
        teams: 'Equipes Totais',
        inactive: 'Usuários Inativos',
        requests: 'Solicitações Pendentes'
      },
      actions: {
        title: 'Ações Administrativas',
        deleteTeams: 'Excluir Todas as Equipes',
        resetProfiles: 'Resetar Perfis de Jogadores'
      },
      newsletter: {
        title: 'Enviar Newsletter',
        subject: 'Assunto',
        message: 'Mensagem',
        send: 'Enviar para Todos os Usuários'
      },
      users: {
        title: 'Gerenciamento de Usuários'
      }
    }
  },
  de: {  // ✅ AGGIUNTO TEDESCO
    loading: 'Laden...',
    nav: {
      home: 'Startseite',
      players: 'Spieler',
      teams: 'Teams',
      favorites: 'Favoriten',  // ✅ AGGIUNTO
      requests: 'Anfragen',
      profile: 'Profil',
      admin: 'Admin',
      logout: 'Abmelden'
    },
    favorites: {  // ✅ NUOVA SEZIONE
      title: 'Meine Favoriten',
      players: 'Lieblingsspieler',
      teams: 'Lieblingsteams',
      noPlayers: 'Keine Spieler in den Favoriten',
      noTeams: 'Keine Teams in den Favoriten'
    },
    home: {
      title: 'Willkommen bei Pro Club Hub',
      subtitle: 'Die ultimative Community für Pro Club Spieler',
      feature1: {
        title: 'Spieler Finden',
        desc: 'Suche Spieler nach Rolle, Level und Plattform'
      },
      feature2: {
        title: 'Teams Erstellen',
        desc: 'Bilde dein Team und trete gemeinsam an'
      },
      feature3: {
        title: 'Feedback Geben',
        desc: 'Bewerte Spieler und baue deinen Ruf auf'
      }
    },
    auth: {
      login: 'Anmelden',
      register: 'Registrieren',
      emailLabel: 'E-Mail',
      passwordLabel: 'Passwort',
      usernameLabel: 'Benutzername',
      roleLabel: 'Hauptrolle',
      platformLabel: 'Plattform',
      nationalityLabel: 'Nationalität',
      levelLabel: 'Level',
      selectRole: 'Rolle auswählen',
      selectPlatform: 'Plattform auswählen',
      noAccount: 'Noch kein Konto?',
      haveAccount: 'Bereits ein Konto?',
      registerLink: 'Registrieren',
      loginLink: 'Anmelden',
      forgotPassword: 'Passwort vergessen?',
      recoverPassword: 'Passwort Wiederherstellen',
      recoverPasswordDesc: 'Gib deine E-Mail ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.',
      sendLink: 'Link Senden',
      backToLogin: 'Zurück zum Login'
    },
    common: {
      level: 'Level',
      feedback: 'Feedback',
      search: 'Suchen',
      save: 'Änderungen Speichern'
    },
    players: {
      title: 'Spieler Suchen',
      searchPlaceholder: '🔍 Nach Namen suchen...',
      allRoles: 'Alle Rollen',
      allPlatforms: 'Alle Plattformen',
      nationality: 'Nationalität',
      minLevel: 'Mindestlevel:',
      maxLevel: 'Maximallevel:'
    },
    teams: {
      title: 'Teams',
      create: 'Team Erstellen',
      createTitle: 'Team Erstellen',
      searchPlaceholder: '🔍 Team suchen...',
      allPlatforms: 'Alle Plattformen',
      nationality: 'Nationalität',
      nameLabel: 'Teamname',
      descriptionLabel: 'Beschreibung',
      platformLabel: 'Plattform',
      nationalityLabel: 'Nationalität',
      instagramLabel: 'Instagram (Benutzername)',
      tiktokLabel: 'TikTok (Benutzername)',
      liveLinkLabel: 'Live-Link (Twitch/YouTube)',
      lookingForPlayersCheckbox: 'Suche Spieler',
      selectPlatform: 'Plattform auswählen'
    },
    requests: {
      title: 'Anfragen',
      received: 'Empfangen',
      sent: 'Gesendet'
    },
    profile: {
      edit: 'Profil Bearbeiten',
      editTitle: 'Profil Bearbeiten',
      email: 'E-Mail',
      platform: 'Plattform',
      nationality: 'Nationalität',
      primaryRole: 'Hauptrolle',
      secondaryRoles: 'Nebenrollen',
      secondaryRolesLabel: 'Nebenrollen (max 2)',
      bio: 'Bio',
      bioLabel: 'Bio',
      lookingForTeam: 'Suche Team',
      lookingForTeamCheckbox: 'Suche Team',
      social: 'Soziale Netzwerke',
      instagramLabel: 'Instagram (Benutzername)',
      tiktokLabel: 'TikTok (Benutzername)',
      resetPassword: 'Passwort Ändern (via E-Mail)',
      feedbackReceived: 'Erhaltenes Feedback'
    },
    feedback: {
      title: 'Feedback Geben',
      ratingLabel: 'Bewertung',
      tagsLabel: 'Tags (optional)',
      commentLabel: 'Kommentar (optional)',
      submit: 'Feedback Senden',
      tags: {
        serious: 'Ernsthaft',
        communicative: 'Kommunikativ',
        fun: 'Lustig',
        toxic: 'Toxisch',
        teamPlayer: 'Teamspieler',
        leader: 'Anführer',
        reliable: 'Zuverlässig',
        punctual: 'Pünktlich',
        technical: 'Technisch',
        tactical: 'Taktisch'
      }
    },
    admin: {
      title: 'Admin-Panel',
      stats: {
        users: 'Gesamte Benutzer',
        teams: 'Gesamte Teams',
        inactive: 'Inaktive Benutzer',
        requests: 'Ausstehende Anfragen'
      },
      actions: {
        title: 'Admin-Aktionen',
        deleteTeams: 'Alle Teams Löschen',
        resetProfiles: 'Spielerprofile Zurücksetzen'
      },
      newsletter: {
        title: 'Newsletter Senden',
        subject: 'Betreff',
        message: 'Nachricht',
        send: 'An Alle Benutzer Senden'
      },
      users: {
        title: 'Benutzerverwaltung'
      }
    }
  }
};

let currentLang = localStorage.getItem('language') || 'it';

function translate(key) {
  const keys = key.split('.');
  let value = translations[currentLang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}

function updatePageLanguage() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = translate(key);
  });
  
  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = translate(key);
  });
  
  // Update HTML lang attribute
  document.documentElement.lang = currentLang;
}

function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    updatePageLanguage();
  }
}

// Export for use in app.js
window.translate = translate;
window.setLanguage = setLanguage;
window.updatePageLanguage = updatePageLanguage;
window.currentLang = () => currentLang;

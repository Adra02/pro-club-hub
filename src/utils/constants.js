export const ROLES = [
  'GK', 'CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'ST'
];

export const PLATFORMS = [
  'PlayStation 5',
  'Xbox Series X/S',
  'PC'
];

export const NATIONALITIES = [
  'Italia', 'Spagna', 'Francia', 'Germania', 'Portogallo', 'Brasile', 'Argentina',
  'Inghilterra', 'Olanda', 'Belgio', 'Croazia', 'Serbia', 'Polonia', 'Svizzera',
  'Danimarca', 'Svezia', 'Norvegia', 'Finlandia', 'Russia', 'Ucraina', 'Turchia',
  'Grecia', 'Marocco', 'Algeria', 'Tunisia', 'Egitto', 'Senegal', 'Nigeria',
  'Ghana', 'Costa d\'Avorio', 'Camerun', 'Stati Uniti', 'Canada', 'Messico',
  'Colombia', 'Perù', 'Cile', 'Uruguay', 'Paraguay', 'Ecuador', 'Venezuela',
  'Giappone', 'Corea del Sud', 'Cina', 'Australia', 'Nuova Zelanda'
];

export const FEEDBACK_TAGS = [
  'Abile tecnicamente',
  'Ottimo passatore',
  'Preciso nei tiri',
  'Fortissimo in difesa',
  'Visione di gioco',
  'Leadership',
  'Comunicativo',
  'Affidabile',
  'Puntuale',
  'Fair Play',
  'Competitivo',
  'Stratega',
  'Rapido',
  'Resistente',
  'Creativo',
  'Determinato'
];

export const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

export const REQUEST_TYPES = {
  PLAYER_TO_TEAM: 'player_to_team',
  TEAM_TO_PLAYER: 'team_to_player'
};

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
    RECOVER: '/auth/recover',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: '/users',
  TEAMS: '/teams',
  REQUESTS: '/requests',
  FEEDBACKS: '/feedbacks',
  FAVORITES: '/favorites',
  ADMIN: {
    STATS: '/admin/stats',
    USERS: '/admin/users',
    TEAMS: '/admin/teams',
    NEWSLETTER: '/admin/newsletter',
  },
};

export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  LANGUAGE: 'language',
  THEME: 'theme',
};

export const NAVIGATION_ROUTES = {
  AUTH: {
    WELCOME: 'Welcome',
    LOGIN: 'Login',
    REGISTER: 'Register',
    FORGOT_PASSWORD: 'ForgotPassword',
  },
  MAIN: {
    HOME: 'Home',
    TEAMS: 'Teams',
    FAVORITES: 'Favorites',
    REQUESTS: 'Requests',
    PROFILE: 'Profile',
  },
  DETAILS: {
    PLAYER_DETAIL: 'PlayerDetail',
    TEAM_DETAIL: 'TeamDetail',
  },
  FORMS: {
    CREATE_TEAM: 'CreateTeam',
    EDIT_PROFILE: 'EditProfile',
  },
  ADMIN: {
    ADMIN_PANEL: 'AdminPanel',
  },
};
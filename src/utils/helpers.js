import { Platform } from 'react-native';

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substr(0, 2);
};

export const calculateAverageRating = (feedbacks) => {
  if (!feedbacks || feedbacks.length === 0) return 0;
  const sum = feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0);
  return Math.round((sum / feedbacks.length) * 10) / 10;
};

export const sortPlayers = (players, sortBy) => {
  const sorted = [...players];
  switch (sortBy) {
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'level':
      return sorted.sort((a, b) => b.level - a.level);
    case 'name':
      return sorted.sort((a, b) => a.username.localeCompare(b.username));
    default:
      return sorted;
  }
};

export const filterPlayers = (players, filters) => {
  return players.filter(player => {
    if (filters.platform && player.platform !== filters.platform) return false;
    if (filters.role && player.primaryRole !== filters.role) return false;
    if (filters.nationality && player.nationality !== filters.nationality) return false;
    if (filters.lookingForTeam !== undefined && player.lookingForTeam !== filters.lookingForTeam) return false;
    if (filters.minLevel && player.level < filters.minLevel) return false;
    if (filters.maxLevel && player.level > filters.maxLevel) return false;
    return true;
  });
};

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
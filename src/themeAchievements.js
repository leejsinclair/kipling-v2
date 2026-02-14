export function checkThemeAchievements(themeSwitchCount, triedThemes) {
  const achievements = [];
  
  // First time theme switch
  if (themeSwitchCount === 1) {
    achievements.push({
      id: 'theme-switcher',
      name: 'Theme Switcher',
      description: 'Changed your theme for the first time',
      xpBonus: 5
    });
  }
  
  // Try all themes
  if (triedThemes.length === 4) {
    achievements.push({
      id: 'theme-explorer',
      name: 'Theme Explorer',
      description: 'Tried all four themes',
      xpBonus: 10
    });
  }
  
  // Switch themes 10 times
  if (themeSwitchCount === 10) {
    achievements.push({
      id: 'chameleon',
      name: 'Chameleon',
      description: 'Switched themes 10 times',
      xpBonus: 15
    });
  }
  
  return achievements;
}

// Check for dark theme sessions
export function checkDarkThemeSession(darkModeSessionCount) {
  const achievements = [];
  
  // Used dark theme for 5 sessions
  if (darkModeSessionCount === 5) {
    achievements.push({
      id: 'night-owl',
      name: 'Night Owl',
      description: 'Used dark theme for 5 sessions',
      xpBonus: 10
    });
  }
  
  return achievements;
}

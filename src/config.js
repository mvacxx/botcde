const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const defaultFeatures = {
  autoRole: true,
  music: true
};

const settingsPath = path.join(__dirname, 'storage', 'settings.json');

function ensureSettingsFile() {
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify(defaultFeatures, null, 2));
  }
}

function getFeatureSettings() {
  ensureSettingsFile();
  return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

function setFeatureSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  autoRoleId: process.env.AUTO_ROLE_ID,
  prefix: process.env.PREFIX || '-',
  panelPort: Number(process.env.PANEL_PORT || 3000),
  panelUsername: process.env.PANEL_USERNAME || 'admin',
  panelPassword: process.env.PANEL_PASSWORD || 'admin',
  getFeatureSettings,
  setFeatureSettings,
  ensureSettingsFile
};

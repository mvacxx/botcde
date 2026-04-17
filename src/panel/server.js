const express = require('express');
const path = require('path');
const {
  panelPort,
  panelUsername,
  panelPassword,
  getFeatureSettings,
  setFeatureSettings
} = require('../config');

let panelStarted = false;

function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Painel do Bot"');
    return res.status(401).send('Autenticação necessária');
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = credentials.split(':');

  if (username === panelUsername && password === panelPassword) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Painel do Bot"');
  return res.status(401).send('Credenciais inválidas');
}

function startPanel(client) {
  if (panelStarted) return;

  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(basicAuth);

  app.get('/', (req, res) => {
    const featureFlags = getFeatureSettings();
    res.render('dashboard', {
      featureFlags,
      botName: client.user?.tag || 'Bot desconectado',
      guilds: client.guilds.cache.map((g) => `${g.name} (${g.memberCount} membros)`).join(', ') || 'Sem servidores'
    });
  });

  app.post('/features', (req, res) => {
    const settings = {
      autoRole: req.body.autoRole === 'on',
      music: req.body.music === 'on'
    };

    setFeatureSettings(settings);
    res.redirect('/');
  });

  app.listen(panelPort, () => {
    console.log(`🖥️ Painel disponível em http://localhost:${panelPort}`);
  });

  panelStarted = true;
}

module.exports = { startPanel };

const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques depuis le dossier public
app.use(express.static(path.join(__dirname, 'public')));

// Routes API
try {
    app.use('/api/notifications', require('./api/notifications'));
    console.log('✅ Notifications route loaded');
} catch (e) {
    console.log("❌ Notifications route error:", e.message);
}

try {
    app.use('/api/messages', require('./api/messages'));
    console.log('✅ Messages route loaded');
} catch (e) {
    console.log("❌ Messages route error:", e.message);
}

// Route de test
app.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is working',
        timestamp: new Date(),
        files: {
            notifications: fs.existsSync('./api/notifications.js'),
            messages: fs.existsSync('./api/messages.js'),
            public: fs.existsSync('./public'),
            currentDir: __dirname
        }
    });
});

// Route pour vérifier l'accès aux fichiers
app.get('/check-files', (req, res) => {
    const files = ['notifications.html', 'messages.html', 'index.html'];
    const results = {};
    files.forEach(file => {
        results[file] = fs.existsSync(path.join(__dirname, 'public', file));
    });
    res.json(results);
});

// Routes directes pour les pages
app.get('/notifications.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'notifications.html'));
});

app.get('/messages.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'messages.html'));
});

// Route par défaut
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 ServiceN Platform - Version Stable`);
    console.log(`Port: ${PORT}`);
    console.log(`Current directory: ${__dirname}`);
    console.log(`Public directory: ${path.join(__dirname, 'public')}`);
});

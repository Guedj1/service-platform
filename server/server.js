const express = require('express');
const app = express();
const path = require('path');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques depuis MULTIPLES dossiers
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'client'))); // Important !

// Routes API
app.use('/api/notifications', require('./api/notifications'));
app.use('/api/messages', require('./api/messages'));

// Route de test
app.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is working',
        timestamp: new Date(),
        paths: {
            public: path.join(__dirname, 'public'),
            client: path.join(__dirname, 'client'),
            currentDir: __dirname
        }
    });
});

// Routes pour les pages principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.get('/notifications.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'notifications.html'));
});

app.get('/messages.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'messages.html'));
});

// Routes client (important !)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dashboard.html'));
});

// Route de vérification des fichiers
app.get('/check-files', (req, res) => {
    const files = [
        { path: 'public/notifications.html', exists: require('fs').existsSync(path.join(__dirname, 'public/notifications.html')) },
        { path: 'public/messages.html', exists: require('fs').existsSync(path.join(__dirname, 'public/messages.html')) },
        { path: 'client/index.html', exists: require('fs').existsSync(path.join(__dirname, 'client/index.html')) }
    ];
    res.json(files);
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'client', '404.html'));
});

// Démarrer le serveur
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 ServiceN Platform - Version Stable`);
    console.log(`Port: ${PORT}`);
    console.log(`Public dir: ${path.join(__dirname, 'public')}`);
    console.log(`Client dir: ${path.join(__dirname, 'client')}`);
});

const express = require('express');
const app = express();
const path = require('path');

// 1. Fichiers statiques
app.use(express.static('public'));
app.use(express.static('client'));

// 2. APIs
const notificationsRouter = express.Router();
notificationsRouter.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Notifications API WORKING' });
});
app.use('/api/notifications', notificationsRouter);

const messagesRouter = express.Router();
messagesRouter.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Messages API WORKING' });
});
app.use('/api/messages', messagesRouter);

// 3. Pages
app.get('/', (req, res) => {
    res.send('ServiceN Platform - ACCUEIL');
});

app.get('/notifications.html', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Notifications</title></head>
        <body>
            <h1>NOTIFICATIONS PAGE - WORKING</h1>
            <p><a href="/">Home</a></p>
            <script>
                fetch('/api/notifications')
                    .then(r => r.json())
                    .then(data => console.log(data));
            </script>
        </body>
        </html>
    `);
});

app.get('/messages.html', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Messages</title></head>
        <body>
            <h1>MESSAGES PAGE - WORKING</h1>
            <p><a href="/">Home</a></p>
        </body>
        </html>
    `);
});

// 4. Port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Route de diagnostic complète
app.get('/diagnostic', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    
    const files = {
        'server.js': fs.existsSync('server.js'),
        'server/server.js': fs.existsSync('server/server.js'),
        'api/notifications.js': fs.existsSync('api/notifications.js'),
        'api/messages.js': fs.existsSync('api/messages.js'),
        'public/notifications.html': fs.existsSync('public/notifications.html'),
        'public/messages.html': fs.existsSync('public/messages.html'),
        'package.json': fs.existsSync('package.json')
    };
    
    res.json({
        status: 'diagnostic',
        timestamp: new Date(),
        files: files,
        env: {
            PORT: process.env.PORT,
            NODE_ENV: process.env.NODE_ENV
        },
        urls: {
            notifications: 'https://servicesn-platform.onrender.com/notifications.html',
            messages: 'https://servicesn-platform.onrender.com/messages.html',
            api_notifications: 'https://servicesn-platform.onrender.com/api/notifications',
            api_messages: 'https://servicesn-platform.onrender.com/api/messages'
        }
    });
});

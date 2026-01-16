// VERSION GARANTIE SANS ERREUR DE SYNTAXE
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware essentiel
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route 1: Accueil
app.get('/', (req, res) => {
    const html = '<!DOCTYPE html><html><head><title>ServiceN</title></head><body><h1>ServiceN Platform</h1><a href="/create-service">Créer un service</a></body></html>';
    res.send(html);
});

// Route 2: Formulaire création (PAGE COMPLÈTE)
app.get('/create-service', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Créer un service - ServiceN</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            .form-container {
                background: white;
                width: 100%;
                max-width: 600px;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 {
                color: #333;
                margin-bottom: 30px;
                text-align: center;
                font-size: 2em;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 8px;
                font-weight: bold;
                color: #555;
            }
            input, textarea, select {
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
            }
            textarea {
                min-height: 120px;
                resize: vertical;
            }
            button {
                background: #4CAF50;
                color: white;
                padding: 16px;
                border: none;
                border-radius: 8px;
                font-size: 18px;
                font-weight: bold;
                width: 100%;
                cursor: pointer;
                transition: 0.3s;
            }
            button:hover {
                background: #45a049;
            }
        </style>
    </head>
    <body>
        <div class="form-container">
            <h1>📝 Créer un nouveau service</h1>
            <form id="serviceForm">
                <div class="form-group">
                    <label for="title">Titre du service *</label>
                    <input type="text" id="title" name="title" placeholder="Ex: Développement web" required>
                </div>
                
                <div class="form-group">
                    <label for="description">Description *</label>
                    <textarea id="description" name="description" placeholder="Décrivez votre service..." required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="price">Prix (FCFA) *</label>
                    <input type="number" id="price" name="price" placeholder="Ex: 50000" required>
                </div>
                
                <div class="form-group">
                    <label for="category">Catégorie</label>
                    <select id="category" name="category">
                        <option value="informatique">Informatique</option>
                        <option value="design">Design</option>
                        <option value="marketing">Marketing</option>
                        <option value="consulting">Consulting</option>
                    </select>
                </div>
                
                <button type="submit">Publier le service</button>
            </form>
            
            <div style="text-align: center; margin-top: 20px;">
                <a href="/" style="color: #667eea; text-decoration: none;">← Retour à l'accueil</a>
            </div>
        </div>
        
        <script>
            document.getElementById('serviceForm').addEventListener('submit', function(e) {
                e.preventDefault();
                alert('Service créé avec succès! (Cette fonctionnalité sera bientôt connectée à votre backend)');
                this.reset();
            });
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

// Route 3: API pour créer service
app.post('/api/services/create', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Service créé avec succès!',
        serviceId: 'SVC_' + Date.now(),
        data: req.body
    });
});

// Route 4: Login
app.get('/login', (req, res) => {
    const html = '<h1>Connexion</h1><form><input placeholder="Email"><input type="password" placeholder="Mot de passe"><button>Se connecter</button></form>';
    res.send(html);
});

// Route 5: Dashboard
app.get('/dashboard', (req, res) => {
    const html = '<h1>Tableau de bord</h1><p>Bienvenue sur ServiceN Platform</p><a href="/create-service">Créer un service</a>';
    res.send(html);
});

// Route 404
app.get('*', (req, res) => {
    res.status(404).send('<h1>404 - Page non trouvée</h1><a href="/">Retour</a>');
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log('=========================================');
    console.log('🚀 SERVICE N PLATFORM - PRÊT À L\'EMPLOI');
    console.log('=========================================');
    console.log('✅ Serveur démarré sur le port ' + PORT);
    console.log('🔗 URL: http://localhost:' + PORT);
    console.log('🔗 Render: https://servicesn-platform.onrender.com');
    console.log('🔗 Dashboard local: http://192.168.1.128:3333');
    console.log('=========================================');
});

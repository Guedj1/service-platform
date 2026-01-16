const fs = require('fs');
const filePath = './server/server.js';
let content = fs.readFileSync(filePath, 'utf8');

// Trouve la route /create-service
const createServiceRegex = /app\.get\('\/create-service'.*?\n.*?\n.*?\}/s;

const newCreateServiceRoute = `app.get('/create-service', (req, res) => {
    // Vérifie si l'utilisateur est connecté
    if (!req.session.userId) {
        // Retourne une page HTML au lieu de rediriger
        return res.send(\`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Créer un service - ServiceN</title>
                <style>
                    body { font-family: Arial; padding: 40px; text-align: center; }
                    .container { max-width: 600px; margin: 0 auto; }
                    .form-container { background: #f5f5f5; padding: 30px; border-radius: 10px; }
                    input, textarea { width: 100%; padding: 10px; margin: 10px 0; }
                    button { background: #4CAF50; color: white; padding: 15px 30px; border: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>📝 Créer un nouveau service</h1>
                    <p>Vous devez être connecté pour créer un service.</p>
                    <a href="/login">Se connecter</a> | 
                    <a href="/register">S'inscrire</a>
                    <hr>
                    <h3>Formulaire de création (prévisualisation)</h3>
                    <div class="form-container">
                        <form id="previewForm">
                            <input type="text" placeholder="Titre du service" disabled>
                            <textarea placeholder="Description" rows="4" disabled></textarea>
                            <input type="number" placeholder="Prix" disabled>
                            <button type="button" disabled>Créer le service (connectez-vous)</button>
                        </form>
                    </div>
                </div>
            </body>
            </html>
        \`);
    }
    
    // Si connecté, montre le vrai formulaire
    res.send(\`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Créer un service - ServiceN</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial; padding: 20px; background: #f0f2f5; }
                .form-card { 
                    background: white; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 30px; 
                    border-radius: 10px; 
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 { color: #333; text-align: center; }
                .form-group { margin-bottom: 20px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input, textarea, select { 
                    width: 100%; 
                    padding: 10px; 
                    border: 1px solid #ddd; 
                    border-radius: 5px; 
                    font-size: 16px;
                }
                button { 
                    background: #4CAF50; 
                    color: white; 
                    padding: 15px 30px; 
                    border: none; 
                    border-radius: 5px; 
                    width: 100%; 
                    font-size: 18px;
                    cursor: pointer;
                }
                button:hover { background: #45a049; }
            </style>
        </head>
        <body>
            <div class="form-card">
                <h1>🚀 Créer un nouveau service</h1>
                <form action="/api/services" method="POST">
                    <div class="form-group">
                        <label for="title">Titre du service *</label>
                        <input type="text" id="title" name="title" required>
                    </div>
                    <div class="form-group">
                        <label for="description">Description *</label>
                        <textarea id="description" name="description" rows="4" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="price">Prix (FCFA)</label>
                        <input type="number" id="price" name="price" min="0" step="100">
                    </div>
                    <div class="form-group">
                        <label for="category">Catégorie</label>
                        <select id="category" name="category">
                            <option value="informatique">Informatique</option>
                            <option value="consulting">Consulting</option>
                            <option value="formation">Formation</option>
                            <option value="design">Design</option>
                        </select>
                    </div>
                    <button type="submit">Publier le service</button>
                </form>
                <p style="text-align: center; margin-top: 20px;">
                    <a href="/dashboard">← Retour au tableau de bord</a>
                </p>
            </div>
        </body>
        </html>
    \`);
});`;

if (createServiceRegex.test(content)) {
    content = content.replace(createServiceRegex, newCreateServiceRoute);
    fs.writeFileSync(filePath, content);
    console.log('✅ Route /create-service mise à jour avec formulaire HTML');
} else {
    console.log('❌ Route /create-service non trouvée');
}

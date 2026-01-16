const fs = require('fs');
const path = './server/server.js';

let content = fs.readFileSync(path, 'utf8');

// Cherche où ajouter la route (avant les routes API)
const insertPoint = content.indexOf('// Routes API') || content.indexOf('app.use(\'/api\'');

if (insertPoint !== -1) {
    const routeCode = `

// ========== PAGE D'ACCUEIL RENDER ==========
app.get('/', (req, res) => {
    res.send(\`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ServiceN Platform</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                .container {
                    background: rgba(255, 255, 255, 0.95);
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                    max-width: 800px;
                }
                h1 { color: #333; margin-bottom: 20px; }
                .btn {
                    display: inline-block;
                    padding: 15px 30px;
                    margin: 10px;
                    background: #667eea;
                    color: white;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: bold;
                }
                .btn:hover { background: #764ba2; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 ServiceN Platform</h1>
                <p>Plateforme de services professionnels</p>
                
                <div style="margin: 30px 0;">
                    <a href="/create-service?v=4" class="btn">
                        📝 Créer un service
                    </a>
                    <a href="/login" class="btn">
                        🔐 Se connecter
                    </a>
                    <a href="/dashboard" class="btn">
                        📊 Tableau de bord
                    </a>
                </div>
                
                <div style="margin-top: 30px; color: #666;">
                    <p>Version: 4.0 | Port: 3003</p>
                    <p>Dashboard local: <a href="http://192.168.1.128:3333">192.168.1.128:3333</a></p>
                </div>
            </div>
        </body>
        </html>
    \`);
});
// ============================================

`;

    const newContent = content.slice(0, insertPoint) + routeCode + content.slice(insertPoint);
    fs.writeFileSync(path, newContent);
    console.log('✅ Route racine ajoutée avec succès!');
} else {
    console.log('❌ Point d\'insertion non trouvé, ajout à la fin...');
    // Ajoute à la fin avant app.listen
    if (content.includes('app.listen')) {
        const parts = content.split('app.listen');
        const newContent = parts[0] + routeCode + 'app.listen' + parts[1];
        fs.writeFileSync(path, newContent);
        console.log('✅ Route ajoutée avant app.listen');
    }
}

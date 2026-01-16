// Script pour corriger server.js
const fs = require('fs');
const path = './server/server.js';

let content = fs.readFileSync(path, 'utf8');

// 1. Supprimer l'ajout problématique du modèle Message (lignes autour de 70)
content = content.replace(/\/\/ ========== MODÈLE MESSAGE ==========.*?const generateConversationId =.*?;/s, '');

// 2. Ajouter proprement après le modèle Service
const messageModel = `

// ========== MODÈLE MESSAGE ==========
const messageSchema = new mongoose.Schema({
    expediteurId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    destinataireId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sujet: { type: String, default: "" },
    contenu: { type: String, required: true },
    lu: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    conversationId: { type: String, required: true }
});

const Message = mongoose.model("Message", messageSchema);

// Fonction pour générer un conversationId
const generateConversationId = (userId1, userId2) => {
    return [userId1.toString(), userId2.toString()].sort().join("_");
};
`;

// Insérer après le modèle Service
const serviceModelIndex = content.indexOf('const Service = mongoose.model');
if (serviceModelIndex !== -1) {
    // Trouver la fin de la déclaration Service
    let endIndex = content.indexOf('\n', serviceModelIndex);
    while (endIndex < content.length && !content.substring(endIndex, endIndex + 2).match(/\n[ \t]*\n/)) {
        endIndex = content.indexOf('\n', endIndex + 1);
    }
    
    content = content.substring(0, endIndex) + messageModel + content.substring(endIndex);
}

// 3. Ajouter la route messagerie avant les API routes
const messagerieRoute = `

// ========== MESSAGERIE ==========
const messagerieRoutes = require("./routes/messagerie");
app.use("/messagerie", messagerieRoutes);
`;

// Insérer avant API routes
const apiRoutesIndex = content.indexOf('// ========== API ROUTES ==========');
if (apiRoutesIndex !== -1) {
    content = content.substring(0, apiRoutesIndex) + messagerieRoute + content.substring(apiRoutesIndex);
}

// 4. Ajouter le lien messagerie dans la navbar
const navbarWithMessaging = '<a href="/dashboard" class="nav-link">\
    <i class="fas fa-chart-line"></i> Dashboard\
</a>\
<a href="/messagerie" class="nav-link">\
    <i class="fas fa-envelope"></i> Messagerie\
</a>\
<a href="/create-service" class="nav-link">';

content = content.replace(/<a href="\/dashboard" class="nav-link">[\s\S]*?<a href="\/create-service" class="nav-link">/, navbarWithMessaging);

fs.writeFileSync(path, content);
console.log('✅ Messagerie corrigée dans server.js');

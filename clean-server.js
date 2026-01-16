const fs = require('fs');
const path = './server/server.js';

let content = fs.readFileSync(path, 'utf8');

// 1. Supprimer TOUTES les déclarations de messageSchema existantes
// Chercher et supprimer les blocs problématiques
const patterns = [
    /\/\/ ========== MODÈLE MESSAGE ==========[\s\S]*?const generateConversationId = [\s\S]*?;/g,
    /const messageSchema = new mongoose\.Schema[\s\S]*?\);/g,
    /const Message = mongoose\.model\("Message", messageSchema\);/g
];

patterns.forEach(pattern => {
    content = content.replace(pattern, '');
});

// 2. Ajouter UNE SEULE déclaration propre après le modèle Service
const cleanMessageModel = `

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

// Trouver où insérer (après le modèle Service)
const serviceModelMatch = content.match(/const Service = mongoose\.model[^;]+;/);
if (serviceModelMatch) {
    const insertIndex = content.indexOf(serviceModelMatch[0]) + serviceModelMatch[0].length;
    content = content.substring(0, insertIndex) + cleanMessageModel + content.substring(insertIndex);
}

// 3. Vérifier qu'il n'y a pas d'autres doublons
const messageSchemaCount = (content.match(/const messageSchema/g) || []).length;
const MessageCount = (content.match(/const Message =/g) || []).length;

console.log(`Vérification: messageSchema trouvé ${messageSchemaCount} fois, Message ${MessageCount} fois`);

if (messageSchemaCount > 1 || MessageCount > 1) {
    console.log('⚠️  Doublons détectés, suppression supplémentaire...');
    // Garder seulement la première occurrence
    const firstMessageSchema = content.indexOf('const messageSchema = new mongoose.Schema');
    if (firstMessageSchema !== -1) {
        const secondMessageSchema = content.indexOf('const messageSchema = new mongoose.Schema', firstMessageSchema + 1);
        if (secondMessageSchema !== -1) {
            // Supprimer tout entre les deux déclarations
            content = content.substring(0, secondMessageSchema) + 
                     content.substring(content.indexOf('\n\n', secondMessageSchema));
        }
    }
}

// 4. Écrire le fichier corrigé
fs.writeFileSync(path, content);
console.log('✅ Fichier nettoyé et corrigé');

// ========== MODÈLE MESSAGE ==========
const messageSchema = new mongoose.Schema({
    expediteurId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    destinataireId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sujet: { type: String, default: '' },
    contenu: { type: String, required: true },
    lu: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    conversationId: { type: String, required: true } // ID unique pour regrouper les messages
});

const Message = mongoose.model('Message', messageSchema);

// Fonction pour générer un conversationId
const generateConversationId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
};

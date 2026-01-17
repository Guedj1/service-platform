const express = require('express');
const router = express.Router();

// GET toutes les notifications
router.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Notifications API is working',
        data: [
            {
                id: 1,
                title: 'Bienvenue sur ServiceN',
                message: 'Votre compte a été créé avec succès',
                date: new Date().toISOString(),
                read: false
            },
            {
                id: 2,
                title: 'Nouveau message',
                message: 'Vous avez reçu un nouveau message',
                date: new Date().toISOString(),
                read: true
            }
        ]
    });
});

// GET notification par ID
router.get('/:id', (req, res) => {
    res.json({
        status: 'success',
        message: `Notification ${req.params.id}`,
        data: {
            id: req.params.id,
            title: 'Notification test',
            message: 'Ceci est une notification de test',
            date: new Date().toISOString()
        }
    });
});

module.exports = router;

const express = require('express');
const router = express.Router();

// Route pour les notifications
router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Notifications API is working',
        data: []
    });
});

module.exports = router;

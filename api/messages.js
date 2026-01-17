const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    res.json({ status: 'SUCCESS', data: [], message: 'Messages API' });
});
module.exports = router;

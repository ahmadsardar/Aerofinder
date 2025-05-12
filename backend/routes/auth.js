const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Middleware to verify Firebase ID token
const authenticateUser = async (req, res, next) => {
    try {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get user profile
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const userRecord = await admin.auth().getUser(req.user.uid);
        res.json({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user profile' });
    }
});

// Update user profile
router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const { displayName, photoURL } = req.body;
        await admin.auth().updateUser(req.user.uid, {
            displayName,
            photoURL
        });
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating profile' });
    }
});

module.exports = router; 
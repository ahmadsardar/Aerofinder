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

// Get user's bookmarked flights
router.get('/', authenticateUser, async (req, res) => {
    try {
        const db = admin.firestore();
        const bookmarksSnapshot = await db
            .collection('users')
            .doc(req.user.uid)
            .collection('bookmarks')
            .orderBy('timestamp', 'desc')
            .get();

        const bookmarks = [];
        bookmarksSnapshot.forEach(doc => {
            bookmarks.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json(bookmarks);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching bookmarks' });
    }
});

// Add a flight to bookmarks
router.post('/', authenticateUser, async (req, res) => {
    try {
        const { flightId, flightData } = req.body;
        const db = admin.firestore();

        const bookmarkRef = await db
            .collection('users')
            .doc(req.user.uid)
            .collection('bookmarks')
            .add({
                flightId,
                ...flightData,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        res.json({
            id: bookmarkRef.id,
            message: 'Flight bookmarked successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error bookmarking flight' });
    }
});

// Remove a flight from bookmarks
router.delete('/:bookmarkId', authenticateUser, async (req, res) => {
    try {
        const { bookmarkId } = req.params;
        const db = admin.firestore();

        await db
            .collection('users')
            .doc(req.user.uid)
            .collection('bookmarks')
            .doc(bookmarkId)
            .delete();

        res.json({ message: 'Bookmark removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error removing bookmark' });
    }
});

module.exports = router; 
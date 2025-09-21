const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database');
const router = express.Router();

// Get friends list
router.get('/', authenticateToken, async (req, res) => {
  console.log('👥 Friends endpoint called for user:', req.user.id);
  try {
    const db = getDatabase();
    const userId = req.user.id;

    // Get all friend relationships for this user
    // Part 1: Where current user sent the request (user_id = current user)
    const sentRequests = await db.all(`
      SELECT 
        f.id, f.user_id, f.friend_id, f.status, f.created_at,
        u.id as friend_user_id, u.username, u.first_name, u.last_name, 
        u.avatar_color, u.avatar_icon, u.xp, u.level
      FROM friends f
      JOIN users u ON (u.id = f.friend_id)
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [userId]);

    // Part 2: Where current user received the request (friend_id = current user)
    const receivedRequests = await db.all(`
      SELECT 
        f.id, f.user_id, f.friend_id, f.status, f.created_at,
        u.id as friend_user_id, u.username, u.first_name, u.last_name, 
        u.avatar_color, u.avatar_icon, u.xp, u.level
      FROM friends f
      JOIN users u ON (u.id = f.user_id)
      WHERE f.friend_id = ?
      ORDER BY f.created_at DESC
    `, [userId]);

    // Combine all requests
    const friends = [...sentRequests, ...receivedRequests];

    console.log('📋 Sent requests:', sentRequests);
    console.log('📋 Received requests:', receivedRequests);

    console.log('📋 Raw friends data:', friends);

    // Separate into different categories
    const acceptedFriends = friends.filter(f => f.status === 'accepted');
    const pendingSentRequests = sentRequests.filter(f => f.status === 'pending');
    const pendingReceivedRequests = receivedRequests.filter(f => f.status === 'pending');

    console.log('📊 Friends breakdown:', { 
      friends: acceptedFriends.length, 
      sent: pendingSentRequests.length, 
      received: pendingReceivedRequests.length 
    });

    res.json({
      friends: acceptedFriends,
      sentRequests: pendingSentRequests,
      receivedRequests: pendingReceivedRequests
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send friend request
router.post('/request', authenticateToken, async (req, res) => {
  console.log('📤 Friend request from:', req.user.id, 'to:', req.body.userId);
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const { userId: friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend user ID is required' });
    }

    if (userId === friendId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friend exists
    const friend = await db.get('SELECT id FROM users WHERE id = ?', [friendId]);
    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if relationship already exists
    const existingRequest = await db.get(`
      SELECT id, status FROM friends 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);

    if (existingRequest) {
      console.log('🔄 Existing relationship found:', existingRequest);
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' });
      } else if (existingRequest.status === 'pending') {
        return res.status(400).json({ error: 'Friend request already sent' });
      }
    }

    // Create friend request
    const result = await db.run(`
      INSERT INTO friends (user_id, friend_id, status) 
      VALUES (?, ?, 'pending')
    `, [userId, friendId]);

    console.log('✅ Friend request created:', result);
    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept friend request
router.post('/accept', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const { userId: friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend user ID is required' });
    }

    // Find pending request where current user is the recipient
    const request = await db.get(`
      SELECT id FROM friends 
      WHERE user_id = ? AND friend_id = ? AND status = 'pending'
    `, [friendId, userId]);

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Update status to accepted
    await db.run(`
      UPDATE friends SET status = 'accepted' WHERE id = ?
    `, [request.id]);

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject friend request
router.post('/reject', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const { userId: friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend user ID is required' });
    }

    // Find pending request where current user is the recipient
    const request = await db.get(`
      SELECT id FROM friends 
      WHERE user_id = ? AND friend_id = ? AND status = 'pending'
    `, [friendId, userId]);

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Delete the request (reject)
    await db.run(`DELETE FROM friends WHERE id = ?`, [request.id]);

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove friend
router.delete('/remove', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const { userId: friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend user ID is required' });
    }

    // Find accepted friendship
    const friendship = await db.get(`
      SELECT id FROM friends 
      WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) 
      AND status = 'accepted'
    `, [userId, friendId, friendId, userId]);

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    // Delete the friendship
    await db.run(`DELETE FROM friends WHERE id = ?`, [friendship.id]);

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

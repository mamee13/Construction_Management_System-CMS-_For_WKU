// // // server/routes/chatRoutes.js
// // const express = require('express');
// // const chatController = require('../controllers/chatController');
// // const authMiddleware = require('../middlewares/authMiddleware'); // Your protect middleware

// // const router = express.Router();

// // // Protect all chat routes
// // router.use(authMiddleware);

// // // GET /api/v1/chats - Fetch chat rooms for the logged-in user
// // router.get('/', chatController.getMyChatRooms);

// // // GET /api/v1/chats/:roomId/messages - Fetch messages for a specific room
// // router.get('/:roomId/messages', chatController.getMessagesForRoom);

// // module.exports = router;

// // server/routes/chatRoutes.js
// const express = require('express');
// const chatController = require('../controllers/chatController');
// const authMiddleware = require('../middlewares/authMiddleware'); // Your protect middleware

// const router = express.Router();

// // Protect all chat routes
// router.use(authMiddleware);

// // --- Existing Routes ---
// // GET /api/v1/chats - Fetch chat rooms for the logged-in user
// router.get('/', chatController.getMyChatRooms);

// // GET /api/v1/chats/:roomId/messages - Fetch messages for a specific room
// router.get('/:roomId/messages', chatController.getMessagesForRoom);

// // --- NEW Routes for Message Manipulation ---
// // PATCH /api/v1/chats/messages/:messageId - Edit a message
// router.patch('/messages/:messageId', chatController.editMessage);

// // DELETE /api/v1/chats/messages/:messageId - Delete a message
// router.delete('/messages/:messageId', chatController.deleteMessage);


// module.exports = router;

// server/routes/chatRoutes.js
const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware'); // Your protect middleware

const router = express.Router();

// Protect all chat routes
router.use(authMiddleware);

// --- Existing Routes ---
// GET /api/v1/chats - Fetch chat rooms for the logged-in user
router.get('/', chatController.getMyChatRooms);

// GET /api/v1/chats/:roomId/messages - Fetch messages for a specific room
router.get('/:roomId/messages', chatController.getMessagesForRoom);

// --- NEW Route for Sending Messages ---
// POST /api/v1/chats/:roomId/messages - Send a new message to a room
router.post('/:roomId/messages', chatController.sendMessage);

// --- Routes for Message Manipulation ---
// PATCH /api/v1/chats/messages/:messageId - Edit a message
router.patch('/messages/:messageId', chatController.editMessage);

// DELETE /api/v1/chats/messages/:messageId - Delete a message
router.delete('/messages/:messageId', chatController.deleteMessage);

module.exports = router;
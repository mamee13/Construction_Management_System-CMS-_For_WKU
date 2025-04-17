// // Import the configured Axios instance
// //import api from './api'; // Adjust the path to your api.js file if needed
// import api from "./index"
// /**
//  * Fetches the list of chat rooms the current user is a member of.
//  * Corresponds to GET /api/v1/chats
//  * @returns {Promise<object>} A promise that resolves to the API response data.
//  */
// export const getMyChatRooms = async () => {
//   try {
//     console.log('Fetching user chat rooms...');
//     // The interceptor in api.js will automatically add the Authorization header
//     const response = await api.get('/chats');
//     console.log('Chat rooms fetched:', response.data);
//     // Assuming the backend sends { status: 'success', data: { chatRooms: [...] } }
//     // Return the actual chat rooms array or the whole data object based on your preference
//     return response.data.data; // Or response.data if you want the whole object
//   } catch (error) {
//     // The interceptor in api.js handles common error logging and 401 redirect
//     console.error('Error fetching chat rooms:', error);
//     // Re-throw the error so component-level error handling can catch it if needed
//     throw error;
//   }
// };

// /**
//  * Fetches messages for a specific chat room, with optional pagination.
//  * Corresponds to GET /api/v1/chats/:roomId/messages
//  * @param {string} roomId - The ID of the chat room.
//  * @param {object} [queryParams] - Optional query parameters for pagination (e.g., { page: 1, limit: 50 }).
//  * @returns {Promise<object>} A promise that resolves to the API response data.
//  */
// export const getMessagesForRoom = async (roomId, queryParams = {}) => {
//   if (!roomId) {
//     console.error('roomId is required for getMessagesForRoom');
//     throw new Error('roomId is required');
//   }
//   try {
//     console.log(`Workspaceing messages for room ${roomId} with params:`, queryParams);
//     // Pass queryParams to Axios's `params` config option
//     const response = await api.get(`/chats/${roomId}/messages`, {
//       params: queryParams,
//     });
//     console.log(`Messages fetched for room ${roomId}:`, response.data);
//     // Assuming the backend sends { status: 'success', data: { messages: [...] }, ...paginationInfo }
//     // Return the whole data object to include messages and pagination info
//     return response.data;
//   } catch (error) {
//     console.error(`Error fetching messages for room ${roomId}:`, error);
//     throw error;
//   }
// };
// src/services/chatService.js

// Import the configured Axios instance
import api from './index'; // Adjust the path to your api.js file if needed

/**
 * Fetches the list of chat rooms the current user is a member of.
 * Corresponds to GET /api/v1/chats
 * @returns {Promise<object>} A promise that resolves to the API response data containing chatRooms.
 */
export const getMyChatRooms = async () => {
  try {
    console.log('Fetching user chat rooms...');
    const response = await api.get('/chats');
    console.log('Chat rooms fetched:', response.data);
    // Assuming backend sends { status: 'success', data: { chatRooms: [...] } }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    throw error; // Re-throw for component-level handling
  }
};

/**
 * Fetches messages for a specific chat room, with optional pagination.
 * Corresponds to GET /api/v1/chats/:roomId/messages
 * @param {string} roomId - The ID of the chat room.
 * @param {object} [queryParams] - Optional query parameters for pagination (e.g., { page: 1, limit: 50 }).
 * @returns {Promise<object>} A promise that resolves to the API response data containing messages and pagination info.
 */
export const getMessagesForRoom = async (roomId, queryParams = {}) => {
  if (!roomId) {
    console.error('roomId is required for getMessagesForRoom');
    throw new Error('roomId is required');
  }
  try {
    console.log(`Workspaceing messages for room ${roomId} with params:`, queryParams);
    const response = await api.get(`/chats/${roomId}/messages`, {
      params: queryParams,
    });
    console.log(`Messages fetched for room ${roomId}:`, response.data);
    // Assuming backend sends { status: 'success', data: { messages: [...] }, ...paginationInfo }
    return response.data;
  } catch (error) {
    console.error(`Error fetching messages for room ${roomId}:`, error);
    throw error;
  }
};

/**
 * Edits an existing chat message.
 * Corresponds to PATCH /api/v1/chats/messages/:messageId
 * @param {string} messageId - The ID of the message to edit.
 * @param {string} newContent - The updated content for the message.
 * @returns {Promise<object>} A promise that resolves to the API response data containing the updated message.
 */
export const editChatMessage = async (messageId, newContent) => {
  if (!messageId || newContent === undefined || newContent === null) {
     const errorMsg = 'messageId and newContent are required for editChatMessage';
     console.error(errorMsg);
    throw new Error(errorMsg);
  }
  try {
    console.log(`Editing message ${messageId}...`);
    // The request interceptor ensures 'Content-Type': 'application/json'
    const response = await api.patch(`/chats/messages/${messageId}`, {
      content: newContent, // Send the new content in the request body
    });
    console.log(`Message ${messageId} edited:`, response.data);
     // Assuming backend sends { status: 'success', data: { message: {...} } }
    return response.data.data;
  } catch (error) {
    console.error(`Error editing message ${messageId}:`, error);
    throw error;
  }
};

/**
 * Deletes a specific chat message.
 * Corresponds to DELETE /api/v1/chats/messages/:messageId
 * @param {string} messageId - The ID of the message to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is successful (backend returns 204).
 */
export const deleteChatMessage = async (messageId) => {
  if (!messageId) {
     const errorMsg = 'messageId is required for deleteChatMessage';
     console.error(errorMsg);
    throw new Error(errorMsg);
  }
  try {
    console.log(`Deleting message ${messageId}...`);
    // Axios DELETE request. Expecting 204 No Content on success from backend.
    await api.delete(`/chats/messages/${messageId}`);
    console.log(`Message ${messageId} deleted successfully.`);
    // No data is returned on successful 204 response
  } catch (error) {
    console.error(`Error deleting message ${messageId}:`, error);
    // Handle potential 404 if message already deleted vs other errors
    if (error.response?.status === 404) {
        console.warn(`Attempted to delete message ${messageId} which was not found (possibly already deleted).`);
        // You might want to handle this gracefully in the component
    }
    throw error; // Re-throw other errors
  }

  
};

/**
 * Sends a new chat message to a specific room.
 * Corresponds to POST /api/v1/chats/:roomId/messages
 * @param {string} roomId - The ID of the chat room.
 * @param {string} content - The text content of the message.
 * @returns {Promise<object>} A promise that resolves to the API response data containing the newly created message.
 */
export const sendMessage = async (roomId, content) => {
    if (!roomId || !content || content.trim().length === 0) {
       const errorMsg = 'roomId and non-empty content are required for sendMessage';
       console.error(errorMsg);
      throw new Error(errorMsg);
    }
    try {
      console.log(`Sending message to room ${roomId}...`);
      const response = await api.post(`/chats/${roomId}/messages`, {
        content: content.trim(), // Send trimmed content in the request body
      });
      console.log(`Message sent to room ${roomId}:`, response.data);
      // Assuming backend sends { status: 'success', data: { message: {...} } } on 201 Created
      return response.data.data; // Contains { message: newlyCreatedMessage }
    } catch (error) {
      console.error(`Error sending message to room ${roomId}:`, error);
      // Provide more specific feedback if possible
      if (error.response?.status === 403) {
          throw new Error("You don't have permission to send messages in this room.");
      } else if (error.response?.status === 400) {
          throw new Error(error.response.data.message || "Invalid message content.");
      }
      throw error; // Re-throw other errors
    }
  };
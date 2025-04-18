// // // // import React, { useState, useEffect } from 'react';
// // // // import * as chatAPI from '../../APi/chatService' // Adjust path to your chat API file
// // // // //import { ArrowPathIcon } from '@heroicons/react/20/solid'; // For loading indicator
// // // // import {ArrowPathIcon} from "@heroicons/react/24/outline"; // Adjust import based on your icon library
// // // // // Basic component to display a single message
// // // // const MessageItem = ({ message }) => {
// // // //   // Assume message object has properties like 'sender', 'content', 'createdAt'
// // // //   // You might need to fetch sender details if only senderId is present
// // // //   const senderName = message.sender?.firstName || message.sender?.username || 'Unknown User';
// // // //   const messageTime = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// // // //   return (
// // // //     <div className="py-2 px-3 mb-2 bg-gray-100 rounded-md shadow-sm">
// // // //       <div className="flex justify-between items-center mb-1">
// // // //         <span className="text-sm font-semibold text-indigo-700">{senderName}</span>
// // // //         <span className="text-xs text-gray-500">{messageTime}</span>
// // // //       </div>
// // // //       <p className="text-sm text-gray-800">{message.content}</p>
// // // //     </div>
// // // //   );
// // // // };

// // // // const ChatPage = () => {
// // // //   const [chatRooms, setChatRooms] = useState([]);
// // // //   const [selectedRoomId, setSelectedRoomId] = useState(null);
// // // //   const [messages, setMessages] = useState([]);
// // // //   const [isLoadingRooms, setIsLoadingRooms] = useState(false);
// // // //   const [isLoadingMessages, setIsLoadingMessages] = useState(false);
// // // //   const [errorRooms, setErrorRooms] = useState(null);
// // // //   const [errorMessages, setErrorMessages] = useState(null);
// // // //   // Add state for pagination if needed
// // // //   // const [paginationInfo, setPaginationInfo] = useState({});

// // // //   // Fetch chat rooms on component mount
// // // //   useEffect(() => {
// // // //     const fetchRooms = async () => {
// // // //       setIsLoadingRooms(true);
// // // //       setErrorRooms(null);
// // // //       try {
// // // //         const data = await chatAPI.getMyChatRooms(); // Expects { chatRooms: [...] }
// // // //         setChatRooms(data.chatRooms || []);
// // // //       } catch (err) {
// // // //         console.error('Failed to fetch chat rooms:', err);
// // // //         setErrorRooms('Could not load your chat rooms.');
// // // //         setChatRooms([]); // Clear rooms on error
// // // //       } finally {
// // // //         setIsLoadingRooms(false);
// // // //       }
// // // //     };
// // // //     fetchRooms();
// // // //   }, []);

// // // //   // Fetch messages when a room is selected
// // // //   useEffect(() => {
// // // //     if (!selectedRoomId) {
// // // //       setMessages([]); // Clear messages if no room is selected
// // // //       setErrorMessages(null);
// // // //       return;
// // // //     }

// // // //     const fetchMessages = async () => {
// // // //       setIsLoadingMessages(true);
// // // //       setErrorMessages(null);
// // // //       try {
// // // //         // TODO: Implement pagination parameter if needed, e.g., { page: 1, limit: 50 }
// // // //         const data = await chatAPI.getMessagesForRoom(selectedRoomId);
// // // //         setMessages(data.messages || []);
// // // //         // Store pagination info if backend provides it:
// // // //         // setPaginationInfo({ total: data.total, page: data.page, limit: data.limit });
// // // //       } catch (err) {
// // // //         console.error(`Failed to fetch messages for room ${selectedRoomId}:`, err);
// // // //         setErrorMessages('Could not load messages for this room.');
// // // //         setMessages([]); // Clear messages on error
// // // //       } finally {
// // // //         setIsLoadingMessages(false);
// // // //       }
// // // //     };

// // // //     fetchMessages();
// // // //     // Consider adding a cleanup function if you implement polling or WebSockets
// // // //   }, [selectedRoomId]); // Dependency: re-run when selectedRoomId changes

// // // //   const handleSelectRoom = (roomId) => {
// // // //     if (roomId !== selectedRoomId) {
// // // //       setSelectedRoomId(roomId);
// // // //     }
// // // //   };

// // // //   return (
// // // //     <div className="flex flex-col md:flex-row h-[calc(100vh-theme(space.24))]"> {/* Adjust height based on your header/footer */}

// // // //       {/* Chat Rooms List (Sidebar) */}
// // // //       <div className="w-full md:w-1/4 lg:w-1/5 border-r border-gray-200 bg-white flex flex-col overflow-y-auto p-4">
// // // //         <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Chats</h2>
// // // //         {isLoadingRooms && <div className="text-center p-4"><ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-indigo-600" /></div>}
// // // //         {errorRooms && <div className="text-red-600 bg-red-100 p-3 rounded-md">{errorRooms}</div>}
// // // //         {!isLoadingRooms && !errorRooms && (
// // // //           <ul className="space-y-1">
// // // //             {chatRooms.length === 0 && <li className="text-gray-500 text-sm">No chat rooms found.</li>}
// // // //             {chatRooms.map((room) => (
// // // //               <li key={room._id}> {/* Use room.id or room._id based on your API */}
// // // //                 <button
// // // //                   onClick={() => handleSelectRoom(room._id)}
// // // //                   className={`w-full text-left px-3 py-2 rounded-md text-sm ${
// // // //                     selectedRoomId === room._id
// // // //                       ? 'bg-indigo-100 text-indigo-800 font-semibold'
// // // //                       : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
// // // //                   }`}
// // // //                 >
// // // //                   {/* Display room name - adjust based on your data (e.g., other participants, project name) */}
// // // //                   {room.name || `Chat ${room._id.slice(-5)}`} {/* Example display name */}
// // // //                 </button>
// // // //               </li>
// // // //             ))}
// // // //           </ul>
// // // //         )}
// // // //       </div>

// // // //       {/* Messages Area */}
// // // //       <div className="flex-1 flex flex-col bg-gray-50 p-4">
// // // //         {!selectedRoomId ? (
// // // //           <div className="flex-1 flex items-center justify-center text-gray-500">
// // // //             Select a chat room to view messages.
// // // //           </div>
// // // //         ) : (
// // // //           <>
// // // //             {/* Messages Display */}
// // // //             <div className="flex-1 overflow-y-auto mb-4 pr-2"> {/* Added pr-2 for scrollbar space */}
// // // //               <h3 className="text-md font-semibold mb-3 text-gray-700 sticky top-0 bg-gray-50 py-2 border-b">
// // // //                 {/* Find selected room name again for header */}
// // // //                 {chatRooms.find(r => r._id === selectedRoomId)?.name || `Chat ${selectedRoomId.slice(-5)}`}
// // // //               </h3>
// // // //               {isLoadingMessages && <div className="text-center p-4"><ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-indigo-600" /></div>}
// // // //               {errorMessages && <div className="text-red-600 bg-red-100 p-3 rounded-md my-4">{errorMessages}</div>}
// // // //               {!isLoadingMessages && !errorMessages && (
// // // //                 <div className="space-y-2">
// // // //                   {messages.length === 0 && <p className="text-center text-gray-500 py-4">No messages yet in this chat.</p>}
// // // //                   {messages.map((msg) => (
// // // //                     <MessageItem key={msg._id} message={msg} /> // Use msg.id or msg._id
// // // //                   ))}
// // // //                   {/* TODO: Add button to load more messages if pagination exists */}
// // // //                 </div>
// // // //               )}
// // // //             </div>

// // // //             {/* Message Input Area (Future Enhancement) */}
// // // //             <div className="mt-auto border-t pt-4">
// // // //               {/*
// // // //                 Placeholder for message input component.
// // // //                 Needs a form, input field, send button,
// // // //                 and a sendMessage function in chatAPI connected to your backend.
// // // //                 Also requires WebSocket integration for real-time sending/receiving.
// // // //               */}
// // // //               <textarea
// // // //                 className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
// // // //                 rows="2"
// // // //                 placeholder="Type your message here... (Sending not implemented)"
// // // //                 disabled // Remove disabled when implementing sending
// // // //               ></textarea>
// // // //               <button
// // // //                 className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
// // // //                 disabled // Remove disabled when implementing sending
// // // //               >
// // // //                 Send
// // // //               </button>
// // // //             </div>
// // // //           </>
// // // //         )}
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default ChatPage;

// // // import React, { useState, useEffect, useRef, useCallback } from 'react';
// // // // Import API functions
// // // //import * as chatAPI from '../../api/chat'; // Adjust path to your chat API file
// // // //import authAPI from '../../api/auth';     // Adjust path to your auth API file
// // // import authAPI from '@/api/auth';
// // // import * as chatAPI from "../../APi/chatService"; // Adjust path to your chat API file
// // // // Import Icons
// // // import {
// // //     ArrowPathIcon,          // Loading spinner
// // //     PaperAirplaneIcon,      // Send button (future)
// // //     PencilIcon,             // Edit button
// // //     TrashIcon,              // Delete button
// // //     CheckIcon,              // Save edit button
// // //     XMarkIcon,              // Cancel edit / Close button
// // //     ExclamationTriangleIcon // Error icon (optional)
// // // } from '@heroicons/react/20/solid';

// // // // --- MessageItem Component ---
// // // // Renders a single message and handles its edit/delete interactions
// // // const MessageItem = ({ message, currentUserId, onEdit, onDelete }) => {
// // //   const [isEditing, setIsEditing] = useState(false);
// // //   const [editText, setEditText] = useState(message.content);
// // //   const [isSavingEdit, setIsSavingEdit] = useState(false);
// // //   const [isDeleting, setIsDeleting] = useState(false);
// // //   const [editError, setEditError] = useState(null);

// // //   // Determine if the message belongs to the currently logged-in user
// // //   const isMyMessage = message.sender?._id === currentUserId;

// // //   // --- Event Handlers ---
// // //   const handleEditClick = () => {
// // //     setIsEditing(true);
// // //     setEditText(message.content); // Pre-fill editor
// // //     setEditError(null);           // Clear previous errors
// // //   };

// // //   const handleCancelEdit = () => {
// // //     setIsEditing(false);
// // //     setEditText(message.content); // Reset text
// // //     setEditError(null);
// // //   };

// // //   const handleSaveEdit = async () => {
// // //     // Don't save if content is unchanged or empty
// // //     if (editText.trim() === message.content || !editText.trim()) {
// // //       setIsEditing(false);
// // //       setEditError(null);
// // //       return;
// // //     }
// // //     setEditError(null);
// // //     setIsSavingEdit(true);
// // //     try {
// // //       // Call the parent handler passed via props
// // //       await onEdit(message._id, editText.trim());
// // //       setIsEditing(false); // Close editor on success
// // //     } catch (error) {
// // //       console.error("MessageItem: Failed to save edit", error);
// // //       setEditError("Failed to save changes. Please try again.");
// // //       // Keep editor open on failure
// // //     } finally {
// // //       setIsSavingEdit(false);
// // //     }
// // //   };

// // //   const handleDeleteClick = async () => {
// // //     // Simple confirmation
// // //     if (window.confirm('Are you sure you want to delete this message? This cannot be undone.')) {
// // //       setIsDeleting(true); // Provide visual feedback
// // //       try {
// // //         // Call the parent handler passed via props
// // //         await onDelete(message._id);
// // //         // No state change needed here, parent will remove the component
// // //       } catch (error) {
// // //         console.error("MessageItem: Failed to delete", error);
// // //         alert("Failed to delete message. Please try again."); // Simple error feedback
// // //         setIsDeleting(false); // Reset feedback on failure
// // //       }
// // //     }
// // //   };

// // //   // --- Render Logic ---
// // //   const senderName = message.sender?.firstName || message.sender?.username || 'User';
// // //   const messageTime = message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
// // //   // Apply style when delete is in progress
// // //   const isDeletedStyle = isDeleting ? 'opacity-50 pointer-events-none' : '';

// // //   return (
// // //     <div className={`py-2 px-3 mb-2 rounded-md shadow-sm group relative ${isMyMessage ? 'bg-indigo-50 ml-auto' : 'bg-gray-100 mr-auto'} max-w-[80%] ${isDeletedStyle} transition-opacity duration-300`}>
// // //       {/* Sender and Time Info */}
// // //       <div className="flex justify-between items-center mb-1">
// // //         <span className={`text-sm font-semibold ${isMyMessage ? 'text-indigo-700' : 'text-gray-700'}`}>
// // //           {isMyMessage ? 'You' : senderName}
// // //         </span>
// // //         <span className="text-xs text-gray-500">{messageTime}</span>
// // //       </div>

// // //       {/* Message Content or Edit Form */}
// // //       {isEditing ? (
// // //         <div className="mt-1">
// // //           <textarea
// // //             value={editText}
// // //             onChange={(e) => setEditText(e.target.value)}
// // //             className="w-full p-1 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
// // //             rows="2"
// // //             disabled={isSavingEdit}
// // //             aria-label="Edit message content"
// // //           />
// // //           {editError && <p className="text-xs text-red-600 mt-1 flex items-center"><ExclamationTriangleIcon className="h-3 w-3 mr-1"/>{editError}</p>}
// // //           <div className="flex items-center justify-end space-x-2 mt-1">
// // //             <button
// // //               onClick={handleCancelEdit}
// // //               disabled={isSavingEdit}
// // //               className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
// // //               title="Cancel Edit"
// // //             >
// // //               <XMarkIcon className="h-4 w-4" aria-hidden="true" />
// // //               <span className="sr-only">Cancel Edit</span>
// // //             </button>
// // //             <button
// // //               onClick={handleSaveEdit}
// // //               disabled={isSavingEdit || !editText.trim()}
// // //               className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
// // //               title="Save Changes"
// // //             >
// // //               {isSavingEdit ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true"/> : <CheckIcon className="h-4 w-4" aria-hidden="true" />}
// // //               <span className="sr-only">{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
// // //             </button>
// // //           </div>
// // //         </div>
// // //       ) : (
// // //         <p className="text-sm text-gray-800 break-words">{message.content}</p>
// // //       )}

// // //       {/* Edit/Delete Controls (Show for own messages on hover, when not editing/deleting) */}
// // //       {isMyMessage && !isEditing && !isDeleting && (
// // //         <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
// // //           <button
// // //             onClick={handleEditClick}
// // //             className="p-1 text-gray-500 hover:text-indigo-600 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
// // //             title="Edit Message"
// // //           >
// // //             <PencilIcon className="h-3 w-3" aria-hidden="true" />
// // //             <span className="sr-only">Edit Message</span>
// // //           </button>
// // //           <button
// // //             onClick={handleDeleteClick}
// // //             className="p-1 text-gray-500 hover:text-red-600 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
// // //             title="Delete Message"
// // //           >
// // //             <TrashIcon className="h-3 w-3" aria-hidden="true" />
// // //             <span className="sr-only">Delete Message</span>
// // //           </button>
// // //         </div>
// // //       )}
// // //        {/* Deleting indicator (optional, could replace TrashIcon) */}
// // //        {isMyMessage && isDeleting && (
// // //             <div className="absolute top-1 right-1 flex space-x-1 opacity-100">
// // //                 <ArrowPathIcon className="h-3 w-3 animate-spin text-red-600" aria-hidden="true" />
// // //             </div>
// // //         )}
// // //     </div>
// // //   );
// // // };


// // // // --- ChatPage Component ---
// // // // Main page component for chat functionality
// // // const ChatPage = () => {
// // //   // State variables
// // //   const [chatRooms, setChatRooms] = useState([]);
// // //   const [selectedRoomId, setSelectedRoomId] = useState(null);
// // //   const [messages, setMessages] = useState([]);
// // //   const [isLoadingRooms, setIsLoadingRooms] = useState(false);
// // //   const [isLoadingMessages, setIsLoadingMessages] = useState(false);
// // //   const [errorRooms, setErrorRooms] = useState(null);
// // //   const [errorMessages, setErrorMessages] = useState(null);
// // //   const [paginationInfo, setPaginationInfo] = useState({ page: 1, limit: 50, totalMessages: 0 });
// // //   const [currentUser, setCurrentUser] = useState(null);

// // //   // Ref for scrolling message area (implement scrolling logic later)
// // //   const messagesEndRef = useRef(null);
// // //   const messagesContainerRef = useRef(null);

// // //   // --- Effects ---

// // //   // Get current user info on mount
// // //   useEffect(() => {
// // //     setCurrentUser(authAPI.getCurrentUser());
// // //   }, []);

// // //   // Fetch user's chat rooms on mount
// // //   useEffect(() => {
// // //     const fetchRooms = async () => {
// // //       setIsLoadingRooms(true);
// // //       setErrorRooms(null);
// // //       console.log('ChatPage: Fetching rooms...');
// // //       try {
// // //         // getMyChatRooms returns { chatRooms: [...] } inside the data object
// // //         const responseData = await chatAPI.getMyChatRooms();
// // //         const rooms = responseData?.chatRooms;
// // //         if (Array.isArray(rooms)) {
// // //           console.log('ChatPage: Setting chat rooms state:', rooms);
// // //           setChatRooms(rooms);
// // //         } else {
// // //           console.warn('ChatPage: Fetched room data is not an array or is missing:', responseData);
// // //           setChatRooms([]);
// // //           setErrorRooms('Received invalid data for rooms.');
// // //         }
// // //       } catch (err) {
// // //         console.error('ChatPage: Error caught fetching rooms:', err);
// // //         setErrorRooms('Could not load your chat rooms. Please try again later.');
// // //         setChatRooms([]);
// // //       } finally {
// // //         console.log('ChatPage: fetchRooms finally block running.');
// // //         setIsLoadingRooms(false);
// // //       }
// // //     };
// // //     fetchRooms();
// // //   }, []);

// // //   // Fetch messages logic (memoized with useCallback)
// // //   const fetchMessages = useCallback(async (roomId, page = 1, limit = 50, append = false) => {
// // //     if (!roomId) return;

// // //     console.log(`ChatPage: Fetching messages for room ${roomId}, page ${page}, limit ${limit}, append: ${append}`);
// // //     setIsLoadingMessages(true); // Set loading true for both initial and 'load more'
// // //     if (!append) setErrorMessages(null); // Clear errors only on initial load

// // //     try {
// // //       const queryParams = { page, limit };
// // //       // getMessagesForRoom returns { status, totalMessages, page, limit, data: { messages: [...] } }
// // //       const responseData = await chatAPI.getMessagesForRoom(roomId, queryParams);
// // //       console.log(`ChatPage: Raw API response for messages (Room ${roomId}):`, responseData);

// // //       const fetchedMessages = responseData.data?.messages;
// // //       const total = responseData.totalMessages;
// // //       const currentPage = responseData.page;
// // //       const currentLimit = responseData.limit;

// // //       if (Array.isArray(fetchedMessages)) {
// // //         console.log(`ChatPage: Setting messages state (Room ${roomId}, Append: ${append}):`, fetchedMessages);
// // //         // Prepend older messages when loading more (since backend reverses for oldest first)
// // //         setMessages(prev => append ? [...fetchedMessages, ...prev] : fetchedMessages);
// // //         setPaginationInfo({ page: currentPage, limit: currentLimit, totalMessages: total });
// // //       } else {
// // //         console.warn(`ChatPage: Fetched message data is not an array or missing (Room ${roomId}):`, responseData);
// // //         if (!append) setMessages([]);
// // //         setErrorMessages('Received invalid data format for messages.');
// // //       }
// // //     } catch (err) {
// // //       console.error(`ChatPage: Error caught fetching messages (Room ${roomId}):`, err);
// // //       setErrorMessages('Could not load messages. Please try again later.');
// // //       if (!append) setMessages([]); // Clear messages on initial load error
// // //     } finally {
// // //       console.log(`ChatPage: fetchMessages finally block running (Room ${roomId}, Append: ${append}).`);
// // //       setIsLoadingMessages(false);
// // //     }
// // //   }, []); // No dependencies needed for useCallback here if it doesn't rely on other state/props directly

// // //   // Effect to load messages when a room is selected
// // //   useEffect(() => {
// // //     if (selectedRoomId) {
// // //       setMessages([]); // Clear previous room's messages immediately
// // //       setPaginationInfo({ page: 1, limit: 50, totalMessages: 0 }); // Reset pagination
// // //       fetchMessages(selectedRoomId, 1, 50); // Fetch first page
// // //     } else {
// // //       setMessages([]);
// // //       setPaginationInfo({ page: 1, limit: 50, totalMessages: 0 });
// // //       setErrorMessages(null); // Clear errors when no room selected
// // //     }
// // //     // We want this to run ONLY when selectedRoomId changes
// // //     // eslint-disable-next-line react-hooks/exhaustive-deps
// // //   }, [selectedRoomId]);

// // //   // --- Action Handlers ---

// // //   const handleSelectRoom = (roomId) => {
// // //     if (roomId !== selectedRoomId) {
// // //         console.log(`ChatPage: Selecting room ${roomId}`);
// // //         setSelectedRoomId(roomId);
// // //         // Fetching is handled by the useEffect watching selectedRoomId
// // //     }
// // //   };

// // //   const handleEditMessage = async (messageId, newContent) => {
// // //     console.log(`ChatPage: Handling edit for message ${messageId}`);
// // //     try {
// // //       // editChatMessage returns { message: updatedMsg } inside the data object
// // //       const updatedMessageData = await chatAPI.editChatMessage(messageId, newContent);
// // //       const updatedMessage = updatedMessageData?.message;

// // //       if (!updatedMessage) {
// // //         console.error("ChatPage: Invalid response structure after edit", updatedMessageData);
// // //         throw new Error("Update successful, but couldn't process response.");
// // //       }

// // //       setMessages(prevMessages =>
// // //         prevMessages.map(msg =>
// // //           msg._id === messageId
// // //           // Merge existing message with updated fields from server response
// // //           ? { ...msg, ...updatedMessage, content: newContent } // Ensure content is explicitly set
// // //           : msg
// // //         )
// // //       );
// // //       console.log(`ChatPage: Message ${messageId} updated locally.`);
// // //     } catch (error) {
// // //       console.error(`ChatPage: Failed to handle edit for message ${messageId}`, error);
// // //       // Re-throw so the MessageItem can catch it and display feedback
// // //       throw error;
// // //     }
// // //   };

// // //   const handleDeleteMessage = async (messageId) => {
// // //     console.log(`ChatPage: Handling delete for message ${messageId}`);
// // //     try {
// // //       await chatAPI.deleteChatMessage(messageId);
// // //       // Remove the message from local state upon successful deletion
// // //       setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
// // //       console.log(`ChatPage: Message ${messageId} removed locally.`);
// // //     } catch (error) {
// // //       console.error(`ChatPage: Failed to handle delete for message ${messageId}`, error);
// // //       // Re-throw so the MessageItem can catch it and display feedback
// // //       throw error;
// // //     }
// // //   };

// // //   const handleLoadMoreMessages = () => {
// // //     if (!selectedRoomId || isLoadingMessages) return;

// // //     const nextPage = paginationInfo.page + 1;
// // //     // Check if more messages likely exist
// // //     if (messages.length < paginationInfo.totalMessages) {
// // //       console.log(`ChatPage: Loading more messages, page ${nextPage}`);
// // //       fetchMessages(selectedRoomId, nextPage, paginationInfo.limit, true); // append = true
// // //     } else {
// // //       console.log("ChatPage: No more messages to load.");
// // //       // Optionally disable the button or show a message
// // //     }
// // //   };

// // //   // Function to get the display name for a chat room
// // //   const getRoomDisplayName = (room) => {
// // //       if (!room) return '';
// // //       return room.projectId?.projectName || room.name || `Chat ${room._id.slice(-5)}`;
// // //   }

// // //   // --- JSX ---
// // //   return (
// // //     <div className="flex flex-col md:flex-row h-[calc(100vh-theme(space.24))] bg-gray-100"> {/* Adjust height based on layout */}

// // //       {/* Chat Rooms List (Sidebar) */}
// // //       <div className="w-full md:w-1/4 lg:w-1/5 border-r border-gray-200 bg-white flex flex-col">
// // //         <div className="p-4 border-b">
// // //           <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
// // //         </div>
// // //         <div className="flex-1 overflow-y-auto p-4 space-y-1">
// // //           {isLoadingRooms && (
// // //             <div className="text-center p-4">
// // //               <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
// // //               <p className="text-sm text-gray-500 mt-1">Loading chats...</p>
// // //             </div>
// // //           )}
// // //           {errorRooms && !isLoadingRooms && (
// // //             <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{errorRooms}</div>
// // //           )}
// // //           {!isLoadingRooms && !errorRooms && chatRooms.length === 0 && (
// // //             <li className="text-gray-500 text-sm list-none px-3 py-2">No chat rooms found.</li>
// // //           )}
// // //           {!isLoadingRooms && !errorRooms && chatRooms.length > 0 && (
// // //             <ul className="space-y-1">
// // //               {chatRooms.map((room) => (
// // //                 <li key={room._id}>
// // //                   <button
// // //                     onClick={() => handleSelectRoom(room._id)}
// // //                     className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
// // //                       selectedRoomId === room._id
// // //                         ? 'bg-indigo-100 text-indigo-800 font-semibold'
// // //                         : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
// // //                     }`}
// // //                   >
// // //                     {getRoomDisplayName(room)}
// // //                   </button>
// // //                 </li>
// // //               ))}
// // //             </ul>
// // //           )}
// // //         </div>
// // //       </div>

// // //       {/* Messages Area */}
// // //       <div className="flex-1 flex flex-col bg-gray-50">
// // //         {!selectedRoomId ? (
// // //           // Placeholder when no room is selected
// // //           <div className="flex-1 flex items-center justify-center text-gray-500 p-4 text-center">
// // //             <p>Select a chat from the list to start messaging.</p>
// // //           </div>
// // //         ) : (
// // //           // Main chat interface when a room is selected
// // //           <>
// // //             {/* Message Area Header */}
// // //             <div className="p-4 border-b bg-white shadow-sm sticky top-0 z-10">
// // //               <h3 className="text-md font-semibold text-gray-700 truncate">
// // //                 {getRoomDisplayName(chatRooms.find(r => r._id === selectedRoomId))}
// // //               </h3>
// // //               {/* Optional: Add more info like participants or project link here */}
// // //             </div>

// // //             {/* Messages Display Area */}
// // //             <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
// // //               {/* Button to load older messages */}
// // //               {paginationInfo.totalMessages > messages.length && !isLoadingMessages && (
// // //                 <div className="text-center my-2">
// // //                   <button
// // //                     onClick={handleLoadMoreMessages}
// // //                     className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50 font-medium"
// // //                     disabled={isLoadingMessages}
// // //                   >
// // //                     Load Older Messages ({paginationInfo.totalMessages - messages.length} remaining)
// // //                   </button>
// // //                 </div>
// // //               )}
// // //               {/* Loading indicator when fetching more messages */}
// // //               {isLoadingMessages && messages.length > 0 && (
// // //                  <div className="text-center p-2">
// // //                     <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto text-indigo-600" />
// // //                  </div>
// // //               )}
// // //                {/* Initial Loading Spinner for messages */}
// // //               {isLoadingMessages && messages.length === 0 && (
// // //                 <div className="text-center p-4 flex flex-col items-center justify-center h-full">
// // //                   <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
// // //                    <p className="text-sm text-gray-500 mt-2">Loading messages...</p>
// // //                 </div>
// // //               )}
// // //               {/* Error Message Display */}
// // //               {errorMessages && !isLoadingMessages && (
// // //                 <div className="text-red-700 bg-red-100 p-3 rounded-md my-4 text-sm flex items-center justify-center">
// // //                     <ExclamationTriangleIcon className="h-5 w-5 mr-2"/> {errorMessages}
// // //                 </div>
// // //               )}

// // //               {/* List of Messages */}
// // //               {!errorMessages && messages.length === 0 && !isLoadingMessages && (
// // //                 <p className="text-center text-gray-500 py-4">No messages yet in this chat. Start the conversation!</p>
// // //               )}
// // //               {messages.map((msg) => (
// // //                 <MessageItem
// // //                   key={msg._id}
// // //                   message={msg}
// // //                   currentUserId={currentUser?._id} // Pass current user ID
// // //                   onEdit={handleEditMessage}       // Pass edit handler
// // //                   onDelete={handleDeleteMessage}     // Pass delete handler
// // //                 />
// // //               ))}
// // //               {/* Empty div to help with scrolling to bottom */}
// // //               <div ref={messagesEndRef} />
// // //             </div>

// // //             {/* Message Input Area (Functionality not implemented) */}
// // //             <div className="border-t p-4 bg-white mt-auto">
// // //               <div className="flex items-start space-x-3">
// // //                 <textarea
// // //                   className="flex-1 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
// // //                   rows="2"
// // //                   placeholder="Type your message here... (Sending not implemented)"
// // //                   aria-label="Message input"
// // //                   // value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown}
// // //                   disabled // Remove when implementing send
// // //                 ></textarea>
// // //                 <button
// // //                   // onClick={handleSendMessage}
// // //                   className="px-4 py-2 h-[44px] bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
// // //                   disabled // Remove when implementing send
// // //                   title="Send Message (Not Implemented)"
// // //                 >
// // //                   <PaperAirplaneIcon className="h-5 w-5" aria-hidden="true" />
// // //                    <span className="sr-only">Send Message</span>
// // //                 </button>
// // //               </div>
// // //                <p className="text-xs text-gray-500 mt-1">Sending, real-time updates, and file attachments are not yet implemented.</p>
// // //             </div>
// // //           </>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default ChatPage;

// // // import React, { useState, useEffect, useRef, useCallback } from 'react';

// // // // --- API Imports ---
// // // // Adjust paths as needed for your project structure
// // // import * as chatAPI from "../../APi/chatService"; // Contains getMyChatRooms, getMessagesForRoom, sendMessage, editChatMessage, deleteChatMessage
// // // //import authAPI from '../../api/auth'; 
// // // import authAPI from '@/api/auth'; // Contains getCurrentUser

// // //     // Contains getCurrentUser

// // // // --- Icon Imports ---
// // // import {
// // //     ArrowPathIcon,          // Loading spinner
// // //     PaperAirplaneIcon,      // Send button
// // //     PencilIcon,             // Edit button
// // //     TrashIcon,              // Delete button
// // //     CheckIcon,              // Save edit button
// // //     XMarkIcon,              // Cancel edit / Close button
// // //     ExclamationTriangleIcon // Error icon
// // // } from '@heroicons/react/20/solid';

// // // // =============================================================================
// // // // === MessageItem Component ===================================================
// // // // =============================================================================
// // // // Renders a single message and handles its edit/delete interactions
// // // const MessageItem = ({ message, currentUserId, onEdit, onDelete }) => {
// // //   const [isEditing, setIsEditing] = useState(false);
// // //   const [editText, setEditText] = useState(message.content);
// // //   const [isSavingEdit, setIsSavingEdit] = useState(false);
// // //   const [isDeleting, setIsDeleting] = useState(false);
// // //   const [editError, setEditError] = useState(null);

// // //   // Determine if the message belongs to the currently logged-in user
// // //   const isMyMessage = message.sender?._id === currentUserId;

// // //   // --- Event Handlers ---
// // //   const handleEditClick = () => {
// // //     setIsEditing(true);
// // //     setEditText(message.content); // Pre-fill editor
// // //     setEditError(null);           // Clear previous errors
// // //   };

// // //   const handleCancelEdit = () => {
// // //     setIsEditing(false);
// // //     setEditText(message.content); // Reset text
// // //     setEditError(null);
// // //   };

// // //   const handleSaveEdit = async () => {
// // //     // Don't save if content is unchanged or empty
// // //     if (editText.trim() === message.content || !editText.trim()) {
// // //       setIsEditing(false);
// // //       setEditError(null);
// // //       return;
// // //     }
// // //     setEditError(null);
// // //     setIsSavingEdit(true);
// // //     try {
// // //       // Call the parent handler passed via props
// // //       await onEdit(message._id, editText.trim());
// // //       setIsEditing(false); // Close editor on success
// // //     } catch (error) {
// // //       console.error("MessageItem: Failed to save edit", error);
// // //       setEditError(error.message || "Failed to save changes. Please try again.");
// // //       // Keep editor open on failure
// // //     } finally {
// // //       setIsSavingEdit(false);
// // //     }
// // //   };

// // //   const handleDeleteClick = async () => {
// // //     // Simple confirmation
// // //     if (window.confirm('Are you sure you want to delete this message? This cannot be undone.')) {
// // //       setIsDeleting(true); // Provide visual feedback
// // //       try {
// // //         // Call the parent handler passed via props
// // //         await onDelete(message._id);
// // //         // No state change needed here, parent will remove the component
// // //       } catch (error) {
// // //         console.error("MessageItem: Failed to delete", error);
// // //         alert(error.message || "Failed to delete message. Please try again."); // Simple error feedback
// // //         setIsDeleting(false); // Reset feedback on failure
// // //       }
// // //       // No finally needed as component might unmount on success
// // //     }
// // //   };

// // //   // --- Render Logic ---
// // //   const senderName = message.sender?.firstName || message.sender?.username || 'User';
// // //   const messageTime = message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
// // //   // Apply style when delete is in progress
// // //   const isDeletedStyle = isDeleting ? 'opacity-50 pointer-events-none' : '';

// // //   return (
// // //     <div className={`py-2 px-3 mb-2 rounded-md shadow-sm group relative ${isMyMessage ? 'bg-indigo-50 ml-auto' : 'bg-gray-100 mr-auto'} max-w-[80%] ${isDeletedStyle} transition-opacity duration-300`}>
// // //       {/* Sender and Time Info */}
// // //       <div className="flex justify-between items-center mb-1">
// // //         <span className={`text-sm font-semibold ${isMyMessage ? 'text-indigo-700' : 'text-gray-700'}`}>
// // //           {isMyMessage ? 'You' : senderName}
// // //         </span>
// // //         <span className="text-xs text-gray-500">{messageTime}{message.editedAt && ' (edited)'}</span>
// // //       </div>

// // //       {/* Message Content or Edit Form */}
// // //       {isEditing ? (
// // //         <div className="mt-1">
// // //           <textarea
// // //             value={editText}
// // //             onChange={(e) => setEditText(e.target.value)}
// // //             className="w-full p-1 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
// // //             rows="2"
// // //             disabled={isSavingEdit}
// // //             aria-label="Edit message content"
// // //           />
// // //           {editError && <p className="text-xs text-red-600 mt-1 flex items-center"><ExclamationTriangleIcon className="h-3 w-3 mr-1"/>{editError}</p>}
// // //           <div className="flex items-center justify-end space-x-2 mt-1">
// // //             <button
// // //               onClick={handleCancelEdit}
// // //               disabled={isSavingEdit}
// // //               className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
// // //               title="Cancel Edit"
// // //             >
// // //               <XMarkIcon className="h-4 w-4" aria-hidden="true" />
// // //               <span className="sr-only">Cancel Edit</span>
// // //             </button>
// // //             <button
// // //               onClick={handleSaveEdit}
// // //               disabled={isSavingEdit || !editText.trim()}
// // //               className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
// // //               title="Save Changes"
// // //             >
// // //               {isSavingEdit ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true"/> : <CheckIcon className="h-4 w-4" aria-hidden="true" />}
// // //               <span className="sr-only">{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
// // //             </button>
// // //           </div>
// // //         </div>
// // //       ) : (
// // //         <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">{message.content}</p> // Use whitespace-pre-wrap to respect newlines
// // //       )}

// // //       {/* Edit/Delete Controls (Show for own messages on hover, when not editing/deleting) */}
// // //       {isMyMessage && !isEditing && !isDeleting && (
// // //         <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
// // //           <button
// // //             onClick={handleEditClick}
// // //             className="p-1 text-gray-500 hover:text-indigo-600 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
// // //             title="Edit Message"
// // //           >
// // //             <PencilIcon className="h-3 w-3" aria-hidden="true" />
// // //             <span className="sr-only">Edit Message</span>
// // //           </button>
// // //           <button
// // //             onClick={handleDeleteClick}
// // //             className="p-1 text-gray-500 hover:text-red-600 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
// // //             title="Delete Message"
// // //           >
// // //             <TrashIcon className="h-3 w-3" aria-hidden="true" />
// // //             <span className="sr-only">Delete Message</span>
// // //           </button>
// // //         </div>
// // //       )}
// // //        {/* Deleting indicator (optional visual feedback) */}
// // //        {isMyMessage && isDeleting && (
// // //             <div className="absolute top-1 right-1 flex space-x-1 opacity-100">
// // //                 <ArrowPathIcon className="h-3 w-3 animate-spin text-red-600" aria-hidden="true" />
// // //             </div>
// // //         )}
// // //     </div>
// // //   );
// // // };


// // // // =============================================================================
// // // // === ChatPage Component ======================================================
// // // // =============================================================================
// // // // Main page component for chat functionality
// // // const ChatPage = () => {
// // //   // --- State Variables ---
// // //   const [chatRooms, setChatRooms] = useState([]); // List of user's chat rooms
// // //   const [selectedRoomId, setSelectedRoomId] = useState(null); // ID of the currently active room
// // //   const [messages, setMessages] = useState([]); // Messages for the selected room
// // //   const [paginationInfo, setPaginationInfo] = useState({ page: 1, limit: 50, totalMessages: 0 }); // Pagination state for messages
// // //   const [currentUser, setCurrentUser] = useState(null); // Logged-in user object

// // //   // Loading States
// // //   const [isLoadingRooms, setIsLoadingRooms] = useState(false);
// // //   const [isLoadingMessages, setIsLoadingMessages] = useState(false);
// // //   const [isSending, setIsSending] = useState(false); // For send button

// // //   // Error States
// // //   const [errorRooms, setErrorRooms] = useState(null);
// // //   const [errorMessages, setErrorMessages] = useState(null);
// // //   const [sendError, setSendError] = useState(null); // Error specific to sending

// // //   // Input State
// // //   const [newMessage, setNewMessage] = useState(''); // Content of the message input field

// // //   // --- Refs ---
// // //   const messagesEndRef = useRef(null); // Ref to the end of the message list for scrolling
// // //   const messagesContainerRef = useRef(null); // Ref to the message container itself


// // //   // --- Effects ---

// // //   // Get current user info on component mount
// // //   useEffect(() => {
// // //     setCurrentUser(authAPI.getCurrentUser());
// // //   }, []);

// // //   // Fetch user's chat rooms on component mount
// // //   useEffect(() => {
// // //     const fetchRooms = async () => {
// // //       setIsLoadingRooms(true);
// // //       setErrorRooms(null);
// // //       console.log('ChatPage: Fetching rooms...');
// // //       try {
// // //         // getMyChatRooms should return { chatRooms: [...] } inside the data object based on API file
// // //         const responseData = await chatAPI.getMyChatRooms();
// // //         const rooms = responseData?.chatRooms; // Optional chaining for safety
// // //         if (Array.isArray(rooms)) {
// // //           console.log('ChatPage: Setting chat rooms state:', rooms);
// // //           setChatRooms(rooms);
// // //         } else {
// // //           console.warn('ChatPage: Fetched room data is not an array or is missing:', responseData);
// // //           setChatRooms([]);
// // //           setErrorRooms('Received invalid data for rooms.');
// // //         }
// // //       } catch (err) {
// // //         console.error('ChatPage: Error caught fetching rooms:', err);
// // //         setErrorRooms(err.message || 'Could not load your chat rooms. Please try again later.');
// // //         setChatRooms([]);
// // //       } finally {
// // //         console.log('ChatPage: fetchRooms finally block running.');
// // //         setIsLoadingRooms(false);
// // //       }
// // //     };
// // //     fetchRooms();
// // //   }, []); // Empty dependency array means run only once on mount

// // //   // Fetch messages logic (memoized with useCallback)
// // //   // Fetches messages for a given room, page, and limit. Can append or replace messages.
// // //   const fetchMessages = useCallback(async (roomId, page = 1, limit = 50, append = false) => {
// // //     if (!roomId) return;

// // //     console.log(`ChatPage: Fetching messages for room ${roomId}, page ${page}, limit ${limit}, append: ${append}`);
// // //     setIsLoadingMessages(true); // Set loading true for both initial and 'load more'
// // //     if (!append) setErrorMessages(null); // Clear fetch errors only on initial load/room change

// // //     try {
// // //       const queryParams = { page, limit };
// // //       // getMessagesForRoom returns { status, totalMessages, page, limit, data: { messages: [...] } } based on controller
// // //       const responseData = await chatAPI.getMessagesForRoom(roomId, queryParams);
// // //       console.log(`ChatPage: Raw API response for messages (Room ${roomId}):`, responseData);

// // //       const fetchedMessages = responseData.data?.messages; // Accessing data.messages
// // //       const total = responseData.totalMessages;
// // //       const currentPage = responseData.page;
// // //       const currentLimit = responseData.limit;

// // //       if (Array.isArray(fetchedMessages)) {
// // //         console.log(`ChatPage: Setting messages state (Room ${roomId}, Append: ${append}):`, fetchedMessages);
// // //         // Prepend older messages when loading more (append=true) because backend sends oldest first in array
// // //         setMessages(prev => append ? [...fetchedMessages, ...prev] : fetchedMessages);
// // //         setPaginationInfo({ page: currentPage, limit: currentLimit, totalMessages: total });

// // //         // If appending, try to maintain scroll position (basic implementation)
// // //         // More advanced scroll restoration might be needed for perfect UX
// // //         if (append && messagesContainerRef.current) {
// // //           // Store previous scroll height before new messages are rendered
// // //           const prevScrollHeight = messagesContainerRef.current.scrollHeight;
// // //           // Use requestAnimationFrame to wait for DOM update after state change
// // //           requestAnimationFrame(() => {
// // //               if (messagesContainerRef.current) {
// // //                   messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - prevScrollHeight;
// // //               }
// // //           });
// // //         }

// // //       } else {
// // //         console.warn(`ChatPage: Fetched message data is not an array or missing (Room ${roomId}):`, responseData);
// // //         if (!append) setMessages([]);
// // //         setErrorMessages('Received invalid data format for messages.');
// // //       }
// // //     } catch (err) {
// // //       console.error(`ChatPage: Error caught fetching messages (Room ${roomId}):`, err);
// // //       setErrorMessages(err.message || 'Could not load messages. Please try again later.');
// // //       if (!append) setMessages([]); // Clear messages on initial load error
// // //     } finally {
// // //       console.log(`ChatPage: fetchMessages finally block running (Room ${roomId}, Append: ${append}).`);
// // //       setIsLoadingMessages(false);
// // //     }
// // //   }, []); // No dependencies needed for useCallback here as it doesn't use state/props directly

// // //   // Effect to load messages when a room is selected
// // //   useEffect(() => {
// // //     if (selectedRoomId) {
// // //       console.log(`ChatPage: Room selected: ${selectedRoomId}. Fetching initial messages.`);
// // //       setMessages([]); // Clear previous room's messages immediately
// // //       setPaginationInfo({ page: 1, limit: 50, totalMessages: 0 }); // Reset pagination
// // //       setErrorMessages(null); // Clear fetch errors
// // //       setSendError(null); // Clear send error from previous room
// // //       setNewMessage(''); // Clear input field
// // //       fetchMessages(selectedRoomId, 1, 50); // Fetch first page
// // //     } else {
// // //       // Clear state when no room is selected
// // //       setMessages([]);
// // //       setPaginationInfo({ page: 1, limit: 50, totalMessages: 0 });
// // //       setErrorMessages(null);
// // //       setSendError(null);
// // //       setNewMessage('');
// // //     }
// // //     // Dependency array ensures this runs only when selectedRoomId changes
// // //     // We explicitly list fetchMessages here, though its definition is stable due to useCallback
// // //     // eslint-disable-next-line react-hooks/exhaustive-deps
// // //   }, [selectedRoomId, fetchMessages]);

// // //   // Effect to scroll to the bottom when new messages are added (but not when loading older ones)
// // //   useEffect(() => {
// // //       // Check if we're NOT loading older messages (isLoadingMessages would be false AFTER fetch completes)
// // //       // And check if the pagination page is 1 (initial load) or messages increased without page change (new message sent/received)
// // //       // This logic might need refinement based on exact real-time update strategy
// // //       if (!isLoadingMessages && messages.length > 0) {
// // //           // Simple scroll to bottom. May need adjustment if loading older messages affects it.
// // //            scrollToBottom();
// // //       }
// // //   }, [messages, isLoadingMessages]); // Runs when messages array changes or loading state finishes

// // //   // --- Action Handlers ---

// // //   // Selects a chat room
// // //   const handleSelectRoom = (roomId) => {
// // //     if (roomId !== selectedRoomId) {
// // //         console.log(`ChatPage: Selecting room ${roomId}`);
// // //         setSelectedRoomId(roomId);
// // //         // Fetching messages is handled by the useEffect watching selectedRoomId
// // //     }
// // //   };

// // //   // Handles editing a message via the API and updates local state
// // //   const handleEditMessage = async (messageId, newContent) => {
// // //     console.log(`ChatPage: Handling edit for message ${messageId}`);
// // //     try {
// // //       // editChatMessage returns { message: updatedMsg } inside the data object based on API file
// // //       const updatedMessageData = await chatAPI.editChatMessage(messageId, newContent);
// // //       const updatedMessage = updatedMessageData?.message; // Extract the message object

// // //       if (!updatedMessage) {
// // //         console.error("ChatPage: Invalid response structure after edit", updatedMessageData);
// // //         throw new Error("Update successful, but couldn't process response.");
// // //       }

// // //       // Update the specific message in the messages array
// // //       setMessages(prevMessages =>
// // //         prevMessages.map(msg =>
// // //           msg._id === messageId
// // //           // Merge existing message with updated fields from server response
// // //           // Ensure content and editedAt timestamp are explicitly updated
// // //           ? { ...msg, ...updatedMessage, content: newContent, editedAt: updatedMessage.editedAt || new Date() }
// // //           : msg
// // //         )
// // //       );
// // //       console.log(`ChatPage: Message ${messageId} updated locally.`);
// // //     } catch (error) {
// // //       console.error(`ChatPage: Failed to handle edit for message ${messageId}`, error);
// // //       // Re-throw so the MessageItem can catch it and display specific feedback
// // //       throw error;
// // //     }
// // //   };

// // //   // Handles deleting a message via the API and updates local state
// // //   const handleDeleteMessage = async (messageId) => {
// // //     console.log(`ChatPage: Handling delete for message ${messageId}`);
// // //     try {
// // //       await chatAPI.deleteChatMessage(messageId);
// // //       // Remove the message from local state upon successful deletion
// // //       setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
// // //       console.log(`ChatPage: Message ${messageId} removed locally.`);
// // //     } catch (error) {
// // //       console.error(`ChatPage: Failed to handle delete for message ${messageId}`, error);
// // //       // Re-throw so the MessageItem can catch it and display specific feedback
// // //       throw error;
// // //     }
// // //   };

// // //   // Loads the next page of older messages
// // //   const handleLoadMoreMessages = () => {
// // //     if (!selectedRoomId || isLoadingMessages) return; // Prevent multiple calls

// // //     const nextPage = paginationInfo.page + 1;
// // //     // Check if more messages likely exist based on total count vs current count
// // //     if (messages.length < paginationInfo.totalMessages) {
// // //       console.log(`ChatPage: Loading more messages, page ${nextPage}`);
// // //       fetchMessages(selectedRoomId, nextPage, paginationInfo.limit, true); // append = true
// // //     } else {
// // //       console.log("ChatPage: No more messages to load.");
// // //       // Optionally disable the button visually or show a message
// // //     }
// // //   };

// // //   // Handles sending a new message
// // //   const handleSendMessage = async () => {
// // //     const trimmedMessage = newMessage.trim();
// // //     if (!trimmedMessage || !selectedRoomId || isSending) {
// // //       return; // Do nothing if message is empty, no room selected, or already sending
// // //     }

// // //     console.log(`ChatPage: Attempting to send message to room ${selectedRoomId}`);
// // //     setIsSending(true);
// // //     setSendError(null); // Clear previous send errors

// // //     try {
// // //       // Call the API function to send the message
// // //       // sendMessage returns { message: newlyCreatedMessage } inside data object based on API file
// // //       const responseData = await chatAPI.sendMessage(selectedRoomId, trimmedMessage);
// // //       const savedMessage = responseData?.message; // Extract message from { message: ... }

// // //       if (!savedMessage) {
// // //         console.error("ChatPage: Send successful but message data missing in response", responseData);
// // //         throw new Error("Message sent, but couldn't update the list.");
// // //       }

// // //       console.log("ChatPage: Message sent successfully, updating UI:", savedMessage);
// // //       // --- Update UI (Add the new message received from the server) ---
// // //       setMessages(prevMessages => [...prevMessages, savedMessage]);

// // //       // Clear the input field
// // //       setNewMessage('');

// // //       // Scroll to bottom is handled by useEffect watching `messages`

// // //     } catch (error) {
// // //       console.error('ChatPage: Failed to send message:', error);
// // //       setSendError(error.message || 'Could not send message. Please try again.');
// // //       // Keep the message in the input field on error
// // //     } finally {
// // //       setIsSending(false); // Reset sending state regardless of success/failure
// // //     }
// // //   };

// // //   // Handles key presses in the textarea (specifically Enter for sending)
// // //   const handleKeyDown = (event) => {
// // //     // Send on Enter press, unless Shift key is also held (for newline)
// // //     if (event.key === 'Enter' && !event.shiftKey) {
// // //       event.preventDefault(); // Prevent default behavior (adding a newline)
// // //       handleSendMessage();    // Trigger the send action
// // //     }
// // //   };

// // //   // --- Helper Functions ---

// // //   // Scrolls the message container to the bottom smoothly
// // //   const scrollToBottom = () => {
// // //     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
// // //     // Alternative: Direct scroll manipulation if scrollIntoView is jumpy
// // //     // if (messagesContainerRef.current) {
// // //     //    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
// // //     // }
// // //   };

// // //   // Gets a display name for a chat room (using project name or default)
// // //   const getRoomDisplayName = (room) => {
// // //       if (!room) return 'Chat'; // Default if room data is missing
// // //       // Prioritize project name if available, otherwise use room name, or fallback
// // //       return room.projectId?.projectName || room.name || `Chat ${room._id?.slice(-5) || '...'}`;
// // //   }


// // //   // --- JSX Rendering ---
// // //   return (
// // //     // Main container for the chat page
// // //     // Adjust height based on your surrounding layout (header/footer height)
// // //     // Example: 'h-full' if parent has fixed height, or calculated height
// // //     <div className="flex flex-col md:flex-row h-[calc(100vh-theme(space.24))] bg-gray-100 overflow-hidden">

// // //       {/* Chat Rooms List (Sidebar) */}
// // //       <div className="w-full md:w-1/4 lg:w-1/5 border-r border-gray-200 bg-white flex flex-col">
// // //         {/* Sidebar Header */}
// // //         <div className="p-4 border-b">
// // //           <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
// // //         </div>
// // //         {/* Scrollable list of chat rooms */}
// // //         <div className="flex-1 overflow-y-auto p-4 space-y-1">
// // //           {isLoadingRooms && (
// // //             <div className="text-center p-4">
// // //               <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
// // //               <p className="text-sm text-gray-500 mt-1">Loading chats...</p>
// // //             </div>
// // //           )}
// // //           {errorRooms && !isLoadingRooms && (
// // //             <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{errorRooms}</div>
// // //           )}
// // //           {!isLoadingRooms && !errorRooms && chatRooms.length === 0 && (
// // //             <li className="text-gray-500 text-sm list-none px-3 py-2">No chat rooms found.</li>
// // //           )}
// // //           {!isLoadingRooms && !errorRooms && chatRooms.length > 0 && (
// // //             <ul className="space-y-1">
// // //               {chatRooms.map((room) => (
// // //                 <li key={room._id}>
// // //                   <button
// // //                     onClick={() => handleSelectRoom(room._id)}
// // //                     // Dynamic styling for the selected room
// // //                     className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 truncate ${
// // //                       selectedRoomId === room._id
// // //                         ? 'bg-indigo-100 text-indigo-800 font-semibold'
// // //                         : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
// // //                     }`}
// // //                   >
// // //                     {getRoomDisplayName(room)}
// // //                   </button>
// // //                 </li>
// // //               ))}
// // //             </ul>
// // //           )}
// // //         </div>
// // //       </div> {/* End Sidebar */}

// // //       {/* Messages Area (Main Content) */}
// // //       <div className="flex-1 flex flex-col bg-gray-50">
// // //         {!selectedRoomId ? (
// // //           // Placeholder shown when no chat room is selected
// // //           <div className="flex-1 flex items-center justify-center text-gray-500 p-4 text-center">
// // //             <p>Select a chat from the list to start messaging.</p>
// // //           </div>
// // //         ) : (
// // //           // Main chat interface displayed when a room is selected
// // //           <>
// // //             {/* Message Area Header (Displays selected room name) */}
// // //             <div className="p-4 border-b bg-white shadow-sm sticky top-0 z-10">
// // //               <h3 className="text-md font-semibold text-gray-700 truncate">
// // //                 {getRoomDisplayName(chatRooms.find(r => r._id === selectedRoomId))}
// // //               </h3>
// // //               {/* Optional: Add more info like participants count or project link here */}
// // //             </div>

// // //             {/* Scrollable Messages Display Area */}
// // //             <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
// // //               {/* Button to load older messages */}
// // //               {paginationInfo.totalMessages > messages.length && !isLoadingMessages && (
// // //                 <div className="text-center my-2">
// // //                   <button
// // //                     onClick={handleLoadMoreMessages}
// // //                     className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
// // //                     disabled={isLoadingMessages}
// // //                   >
// // //                     Load Older Messages ({paginationInfo.totalMessages - messages.length} remaining)
// // //                   </button>
// // //                 </div>
// // //               )}
// // //               {/* Loading indicator when fetching more messages (appears above older messages) */}
// // //               {isLoadingMessages && paginationInfo.page > 1 && ( // Show only when loading more, not initial
// // //                  <div className="text-center p-2">
// // //                     <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto text-indigo-600" />
// // //                  </div>
// // //               )}
// // //                {/* Initial Loading Spinner for messages (when messages array is empty) */}
// // //               {isLoadingMessages && messages.length === 0 && (
// // //                 <div className="text-center p-4 flex flex-col items-center justify-center h-full">
// // //                   <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
// // //                    <p className="text-sm text-gray-500 mt-2">Loading messages...</p>
// // //                 </div>
// // //               )}
// // //               {/* Error Message Display for fetching messages */}
// // //               {errorMessages && !isLoadingMessages && (
// // //                 <div className="text-red-700 bg-red-100 p-3 rounded-md my-4 text-sm flex items-center justify-center">
// // //                     <ExclamationTriangleIcon className="h-5 w-5 mr-2"/> {errorMessages}
// // //                 </div>
// // //               )}

// // //               {/* List of Messages - Render using MessageItem component */}
// // //               {!errorMessages && messages.length === 0 && !isLoadingMessages && (
// // //                 <p className="text-center text-gray-500 py-4">No messages yet in this chat. Be the first to send one!</p>
// // //               )}
// // //               {messages.map((msg) => (
// // //                 <MessageItem
// // //                   key={msg._id} // Use message ID as the key
// // //                   message={msg}
// // //                   currentUserId={currentUser?._id} // Pass current user ID for comparisons
// // //                   onEdit={handleEditMessage}       // Pass edit handler function
// // //                   onDelete={handleDeleteMessage}     // Pass delete handler function
// // //                 />
// // //               ))}
// // //               {/* Empty div used as a target for scrolling to the bottom */}
// // //               <div ref={messagesEndRef} />
// // //             </div> {/* End Messages Display Area */}

// // //             {/* Message Input Area */}
// // //             <div className="border-t p-4 bg-white mt-auto">
// // //               <div className="flex items-start space-x-3">
// // //                 {/* Textarea for typing new messages */}
// // //                 <textarea
// // //                   className="flex-1 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
// // //                   rows="2" // Start with 2 rows, might auto-expand with libraries
// // //                   placeholder={!selectedRoomId ? "Select a room to send messages" : "Type your message..."}
// // //                   aria-label="Message input"
// // //                   value={newMessage}
// // //                   onChange={(e) => setNewMessage(e.target.value)} // Update state on change
// // //                   onKeyDown={handleKeyDown} // Handle Enter key press for sending
// // //                   disabled={isSending || !selectedRoomId} // Disable while sending or if no room selected
// // //                 ></textarea>

// // //                 {/* Send Button */}
// // //                 <button
// // //                   onClick={handleSendMessage} // Trigger send action
// // //                   className="px-4 py-2 h-[44px] bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
// // //                   // Disable button if input is empty/whitespace OR sending in progress OR no room is selected
// // //                   disabled={!newMessage.trim() || isSending || !selectedRoomId}
// // //                   title={!selectedRoomId ? "Select a room first" : "Send Message"}
// // //                 >
// // //                   {isSending ? (
// // //                       // Show spinner when sending
// // //                       <ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden="true" />
// // //                   ) : (
// // //                       // Show airplane icon otherwise
// // //                       <PaperAirplaneIcon className="h-5 w-5" aria-hidden="true" />
// // //                   )}
// // //                   <span className="sr-only">{isSending ? 'Sending...' : 'Send Message'}</span>
// // //                 </button>
// // //               </div>
// // //               {/* Display Send Error message if any */}
// // //               {sendError && (
// // //                   <p className="text-xs text-red-600 mt-1 flex items-center">
// // //                       <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true"/>
// // //                       {sendError}
// // //                   </p>
// // //               )}
// // //             </div> {/* End Message Input Area */}
// // //           </>
// // //         )}
// // //       </div> {/* End Messages Area */}
// // //     </div> // End Main container
// // //   );
// // // };

// // // export default ChatPage;

// // import React, { useState, useEffect, useRef, useCallback } from 'react';
// // import { io } from 'socket.io-client'; // Import socket.io client
// // import * as chatAPI from '../../APi/chatService'; // Your existing API functions

// // import authAPI from '../../APi/auth'; // To get current user info
// // import { ArrowPathIcon, PaperAirplaneIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/20/solid';

// // // --- Socket.IO Setup ---
// // // Define your backend URL (use environment variables ideally)
// // const SOCKET_URL = import.meta.env.REACT_APP_SOCKET_URL || 'http://localhost:5000'; // Adjust if different

// // // --- Helper: Get current user ID ---
// // const getCurrentUserId = () => {
// //   const user = authAPI.getCurrentUser();
// //   return user?._id; // Adjust if your user object stores ID differently
// // };

// // // --- Enhanced MessageItem Component ---
// // const MessageItem = React.memo(({ message, currentUserId, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit, editingContent, setEditingContent }) => {
// //   const isOwnMessage = message.sender?._id === currentUserId;
// //   const senderName = message.sender?.firstName || 'User'; // Simplified
// //   const messageTime = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// //   const editedTime = message.editedAt ? new Date(message.editedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

// //   const handleSave = () => {
// //       onSaveEdit(message._id, editingContent);
// //   }

// //   const handleKeyDown = (e) => {
// //     if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter (not Shift+Enter)
// //       e.preventDefault();
// //       handleSave();
// //     } else if (e.key === 'Escape') { // Cancel on Escape
// //       onCancelEdit();
// //     }
// //   }

// //   return (
// //     <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
// //       <div className={`py-2 px-3 rounded-lg shadow-sm max-w-xs lg:max-w-md ${isOwnMessage ? 'bg-indigo-100' : 'bg-white'}`}>
// //         {!isOwnMessage && (
// //           <div className="text-xs font-semibold text-indigo-700 mb-1">{senderName}</div>
// //         )}
// //         {isEditing ? (
// //             <div className="flex items-center space-x-1">
// //                 <textarea
// //                     value={editingContent}
// //                     onChange={(e) => setEditingContent(e.target.value)}
// //                     onKeyDown={handleKeyDown}
// //                     className="text-sm text-gray-800 border border-indigo-300 rounded p-1 w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
// //                     rows={Math.min(editingContent.split('\n').length, 4)} // Auto-grow slightly
// //                     autoFocus
// //                  />
// //                  <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-800"><CheckIcon className="h-4 w-4"/></button>
// //                  <button onClick={onCancelEdit} className="p-1 text-red-600 hover:text-red-800"><XMarkIcon className="h-4 w-4"/></button>
// //             </div>
// //         ) : (
// //             <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
// //         )}
// //         <div className="text-xs text-gray-500 mt-1 flex items-center justify-end space-x-2">
// //            {editedTime && <span className="italic text-gray-400">(edited {editedTime})</span>}
// //            <span>{messageTime}</span>
// //            {isOwnMessage && !isEditing && (
// //              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
// //                 <button onClick={() => onEdit(message._id, message.content)} className="text-gray-400 hover:text-indigo-600">
// //                     <PencilIcon className="h-3 w-3" />
// //                 </button>
// //                 <button onClick={() => onDelete(message._id)} className="text-gray-400 hover:text-red-600">
// //                     <TrashIcon className="h-3 w-3" />
// //                 </button>
// //              </div>
// //            )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // });

// // // --- ChatPage Component ---
// // const ChatPage = () => {
// //   const [chatRooms, setChatRooms] = useState([]);
// //   const [selectedRoomId, setSelectedRoomId] = useState(null);
// //   const [messages, setMessages] = useState([]);
// //   const [isLoadingRooms, setIsLoadingRooms] = useState(false);
// //   const [isLoadingMessages, setIsLoadingMessages] = useState(false);
// //   const [errorRooms, setErrorRooms] = useState(null);
// //   const [errorMessages, setErrorMessages] = useState(null);
// //   const [newMessageContent, setNewMessageContent] = useState('');
// //   const [isSending, setIsSending] = useState(false); // Indicate sending via socket
// //   const [socket, setSocket] = useState(null);
// //   const [isConnected, setIsConnected] = useState(false);
// //   const [editingMessageId, setEditingMessageId] = useState(null);
// //   const [editingContent, setEditingContent] = useState('');

// //   const messagesEndRef = useRef(null); // To scroll to bottom
// //   const currentUserId = getCurrentUserId();

// //   // Scroll to bottom function
// //   const scrollToBottom = () => {
// //     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
// //   };

// //   // Fetch initial chat rooms
// //   useEffect(() => {
// //     const fetchRooms = async () => {
// //       setIsLoadingRooms(true);
// //       setErrorRooms(null);
// //       try {
// //         const data = await chatAPI.getMyChatRooms();
// //         setChatRooms(data.chatRooms || []);
// //       } catch (err) {
// //         console.error('Failed to fetch chat rooms:', err);
// //         setErrorRooms('Could not load your chat rooms.');
// //         setChatRooms([]);
// //       } finally {
// //         setIsLoadingRooms(false);
// //       }
// //     };
// //     fetchRooms();
// //   }, []);

// //   // Fetch initial messages for selected room
// //   useEffect(() => {
// //     if (!selectedRoomId) {
// //       setMessages([]);
// //       setErrorMessages(null);
// //       return;
// //     }

// //     const fetchMessages = async () => {
// //       setIsLoadingMessages(true);
// //       setErrorMessages(null);
// //       setMessages([]); // Clear previous messages
// //       try {
// //         const data = await chatAPI.getMessagesForRoom(selectedRoomId, { limit: 100 }); // Load more initially?
// //         setMessages(data.messages || []);
// //         scrollToBottom(); // Scroll after initial load
// //       } catch (err) {
// //         console.error(`Failed to fetch messages for room ${selectedRoomId}:`, err);
// //         setErrorMessages('Could not load messages for this room.');
// //         setMessages([]);
// //       } finally {
// //         setIsLoadingMessages(false);
// //       }
// //     };

// //     fetchMessages();
// //   }, [selectedRoomId]);

// //   // --- Socket Connection and Event Listeners ---
// //   useEffect(() => {
// //     const token = localStorage.getItem('wku_cms_token');
// //     if (!token) {
// //       console.error("No auth token found for socket connection.");
// //       // Handle redirect to login or error state
// //       return;
// //     }

// //     // Establish connection
// //     const newSocket = io(SOCKET_URL, {
// //       auth: { token }, // Send token for authentication
// //       // Optional: query: { userId: currentUserId } // If backend uses query fallback
// //     });
// //     setSocket(newSocket);

// //     // --- Socket Event Handlers ---
// //     newSocket.on('connect', () => {
// //       console.log('Socket connected:', newSocket.id);
// //       setIsConnected(true);
// //       // If a room is already selected when connection establishes, join it
// //       if (selectedRoomId) {
// //         newSocket.emit('joinRoom', selectedRoomId);
// //       }
// //     });

// //     newSocket.on('disconnect', (reason) => {
// //       console.log('Socket disconnected:', reason);
// //       setIsConnected(false);
// //       // Optionally implement reconnection logic or UI feedback
// //     });

// //     newSocket.on('connect_error', (error) => {
// //       console.error('Socket connection error:', error.message);
// //       setIsConnected(false);
// //       setErrorMessages(`Connection Error: ${error.message}`); // Show connection error
// //     });

// //     // Handle incoming new messages
// //     newSocket.on('newMessage', (message) => {
// //         // console.log('Received newMessage:', message);
// //         // Only add if it belongs to the currently selected room
// //         if (message.chatRoomId === selectedRoomId) {
// //             setMessages((prevMessages) => [...prevMessages, message]);
// //             scrollToBottom();
// //         }
// //         // Add notification logic here if needed (e.g., if room not selected)
// //     });

// //     // Handle message updates (edits)
// //     newSocket.on('messageUpdated', (updatePayload) => {
// //         // console.log('Received messageUpdated:', updatePayload);
// //         if (updatePayload.chatRoomId === selectedRoomId) {
// //             setMessages((prevMessages) =>
// //                 prevMessages.map((msg) =>
// //                     msg._id === updatePayload._id
// //                     ? { ...msg, content: updatePayload.content, editedAt: updatePayload.editedAt }
// //                     : msg
// //                 )
// //             );
// //              // If we were editing this message, exit editing mode
// //             if (editingMessageId === updatePayload._id) {
// //                 setEditingMessageId(null);
// //                 setEditingContent('');
// //             }
// //         }
// //     });

// //     // Handle message deletions
// //     newSocket.on('messageDeleted', (deletePayload) => {
// //         // console.log('Received messageDeleted:', deletePayload);
// //         if (deletePayload.chatRoomId === selectedRoomId) {
// //             setMessages((prevMessages) =>
// //                 prevMessages.filter((msg) => msg._id !== deletePayload.messageId)
// //             );
// //             // If we were editing the deleted message, cancel editing
// //             if (editingMessageId === deletePayload.messageId) {
// //                 setEditingMessageId(null);
// //                 setEditingContent('');
// //             }
// //         }
// //     });

// //      // Handle specific chat errors from backend emits
// //      newSocket.on('chatError', (errorData) => {
// //         console.error('Received chatError:', errorData.message);
// //         // Display this error more prominently to the user (e.g., toast notification)
// //         setErrorMessages(`Chat Error: ${errorData.message}`); // Or use a dedicated error state
// //         // Reset sending state if it was a sending error
// //         setIsSending(false);
// //         // If editing failed, maybe revert?
// //          if (editingMessageId) {
// //              // You might want to revert the local state or just notify
// //          }
// //      });

// //     // --- Cleanup on unmount ---
// //     return () => {
// //       console.log('Disconnecting socket...');
// //       newSocket.disconnect();
// //       setIsConnected(false);
// //       setSocket(null);
// //     };
// //   }, [selectedRoomId, editingMessageId]); // Re-run if selectedRoomId changes to join room on connect

// //   // --- Room Selection Handler ---
// //   const handleSelectRoom = useCallback((roomId) => {
// //     if (roomId === selectedRoomId) return; // No change

// //     // Leave previous room if connected and a room was selected
// //     if (socket && isConnected && selectedRoomId) {
// //       console.log(`Leaving room: ${selectedRoomId}`);
// //       socket.emit('leaveRoom', selectedRoomId);
// //     }

// //     setSelectedRoomId(roomId);
// //     setMessages([]); // Clear messages immediately
// //     setErrorMessages(null); // Clear errors
// //     setEditingMessageId(null); // Cancel any ongoing edit
// //     setEditingContent('');

// //     // Join the new room if connected
// //     if (socket && isConnected && roomId) {
// //       console.log(`Joining room: ${roomId}`);
// //       socket.emit('joinRoom', roomId);
// //     }
// //   }, [socket, isConnected, selectedRoomId]);


// //   // --- Send Message Handler ---
// //   const handleSendMessage = (e) => {
// //     e.preventDefault();
// //     if (!socket || !isConnected || !selectedRoomId || !newMessageContent.trim() || isSending) {
// //       return;
// //     }

// //     setIsSending(true);
// //     setErrorMessages(null); // Clear previous errors

// //     const payload = {
// //       roomId: selectedRoomId,
// //       content: newMessageContent.trim(),
// //     };
// //     console.log('Emitting chatMessage:', payload);
// //     socket.emit('chatMessage', payload);

// //     // Clear input immediately for better UX
// //     setNewMessageContent('');
// //     setIsSending(false); // Reset sending indicator - rely on listener for actual add

// //     // Note: We DON'T add the message to state here.
// //     // We wait for the 'newMessage' event from the server.
// //   };

// //   // --- Edit/Delete Handlers ---
// //   const handleEditClick = (messageId, currentContent) => {
// //       setEditingMessageId(messageId);
// //       setEditingContent(currentContent);
// //   };

// //   const handleCancelEdit = () => {
// //       setEditingMessageId(null);
// //       setEditingContent('');
// //   };

// //   const handleSaveEdit = (messageId, newContent) => {
// //       if (!socket || !isConnected || !newContent.trim() || !messageId) return;
// //       setErrorMessages(null);

// //       const payload = {
// //           messageId: messageId,
// //           newContent: newContent.trim(),
// //       };
// //       console.log('Emitting editMessage:', payload);
// //       socket.emit('editMessage', payload);
// //       // UI update will happen via 'messageUpdated' listener
// //       // Optimistic UI update could be done here, but relying on socket is safer
// //       // setEditingMessageId(null); // Do this in the listener instead
// //       // setEditingContent('');
// //   };

// //   const handleDeleteClick = (messageId) => {
// //       if (!socket || !isConnected || !messageId) return;
// //       setErrorMessages(null);

// //       // Optional: Add a confirmation dialog here
// //       // if (!window.confirm("Are you sure you want to delete this message?")) {
// //       //     return;
// //       // }

// //       const payload = {
// //           messageId: messageId,
// //       };
// //       console.log('Emitting deleteMessage:', payload);
// //       socket.emit('deleteMessage', payload);
// //       // UI update will happen via 'messageDeleted' listener
// //   };

// //   // --- Render ---
// //   return (
// //     <div className="flex flex-col md:flex-row h-[calc(100vh-theme(space.24))] bg-gray-50"> {/* Adjust height based on your layout */}

// //       {/* Chat Rooms List (Sidebar) */}
// //       <div className="w-full md:w-1/4 lg:w-1/5 border-r border-gray-200 bg-white flex flex-col">
// //         <div className="p-4 border-b">
// //             <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
// //              {!isConnected && <span className="text-xs text-red-500">(Disconnected)</span>}
// //              {/* Add a reconnect button maybe? */}
// //         </div>
// //         <div className="flex-1 overflow-y-auto p-4">
// //             {isLoadingRooms && <div className="text-center p-4"><ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-indigo-600" /></div>}
// //             {errorRooms && <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{errorRooms}</div>}
// //             {!isLoadingRooms && !errorRooms && (
// //             <ul className="space-y-1">
// //                 {chatRooms.length === 0 && <li className="text-gray-500 text-sm px-2 py-1">No chat rooms found.</li>}
// //                 {chatRooms.map((room) => (
// //                 <li key={room._id}>
// //                     <button
// //                     onClick={() => handleSelectRoom(room._id)}
// //                     className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
// //                         selectedRoomId === room._id
// //                         ? 'bg-indigo-100 text-indigo-800 font-semibold'
// //                         : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
// //                     }`}
// //                     >
// //                     {room.projectId?.projectName || room.name || `Chat ${room._id.slice(-5)}`}
// //                     {/* TODO: Add unread count indicator */}
// //                     </button>
// //                 </li>
// //                 ))}
// //             </ul>
// //             )}
// //         </div>
// //       </div>

// //       {/* Messages Area */}
// //       <div className="flex-1 flex flex-col">
// //         {!selectedRoomId ? (
// //           <div className="flex-1 flex items-center justify-center text-gray-500">
// //             Select a chat room to start messaging.
// //           </div>
// //         ) : (
// //           <>
// //             {/* Room Header */}
// //             <div className="p-4 border-b bg-white shadow-sm">
// //                  <h3 className="text-md font-semibold text-gray-800">
// //                     {chatRooms.find(r => r._id === selectedRoomId)?.projectId?.projectName || chatRooms.find(r => r._id === selectedRoomId)?.name || `Chat`}
// //                  </h3>
// //                  {/* Add participant info or other details here */}
// //             </div>

// //             {/* Messages Display */}
// //             <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar"> {/* Added custom-scrollbar class if needed */}
// //               {isLoadingMessages && <div className="text-center p-4"><ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-indigo-600" /></div>}
// //               {errorMessages && <div className="text-red-600 bg-red-100 p-3 rounded-md my-4 text-sm">{errorMessages}</div>}
// //               {!isLoadingMessages && messages.length === 0 && !errorMessages && (
// //                 <p className="text-center text-gray-500 py-4">No messages yet. Start the conversation!</p>
// //               )}
// //               {!isLoadingMessages && messages.map((msg) => (
// //                  <div key={msg._id} className="group relative"> {/* Group for hover effect */}
// //                     <MessageItem
// //                         message={msg}
// //                         currentUserId={currentUserId}
// //                         onEdit={handleEditClick}
// //                         onDelete={handleDeleteClick}
// //                         isEditing={editingMessageId === msg._id}
// //                         onSaveEdit={handleSaveEdit}
// //                         onCancelEdit={handleCancelEdit}
// //                         editingContent={editingMessageId === msg._id ? editingContent : ''}
// //                         setEditingContent={setEditingContent}
// //                     />
// //                  </div>
// //               ))}
// //               <div ref={messagesEndRef} /> {/* Element to scroll to */}
// //             </div>

// //             {/* Message Input Area */}
// //             <div className="border-t p-4 bg-white">
// //               <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
// //                 <textarea
// //                   value={newMessageContent}
// //                   onChange={(e) => setNewMessageContent(e.target.value)}
// //                   onKeyDown={(e) => {
// //                       if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter (not Shift+Enter)
// //                         e.preventDefault();
// //                         handleSendMessage(e);
// //                       }
// //                   }}
// //                   className="flex-1 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none custom-scrollbar"
// //                   rows="1" // Start with 1 row, grows automatically with content
// //                   placeholder={isConnected ? "Type your message..." : "Connecting..."}
// //                   disabled={!isConnected || isSending || editingMessageId !== null} // Disable while sending, disconnected, or editing another msg
// //                   style={{ minHeight: '40px', maxHeight: '120px' }} // Control min/max height
// //                 />
// //                 <button
// //                   type="submit"
// //                   className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
// //                   disabled={!isConnected || isSending || !newMessageContent.trim() || editingMessageId !== null}
// //                 >
// //                   {isSending ? (
// //                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
// //                   ) : (
// //                      <PaperAirplaneIcon className="h-5 w-5" />
// //                   )}
// //                 </button>
// //               </form>
// //             </div>
// //           </>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default ChatPage;
// // /*eslint-disable */
// // import React, { useState, useEffect, useRef, useCallback } from 'react';
// // import { io } from 'socket.io-client';
// // import * as chatAPI from '../../APi/chatService';
// // import authAPI from '../../Api/auth';
// // import { ArrowPathIcon, PaperAirplaneIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/20/solid';

// // const SOCKET_URL = import.meta.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// // const getCurrentUserId = () => {
// //   const user = authAPI.getCurrentUser();
// //   return user?._id;
// // };

// // // MessageItem component remains the same as before...
// // const MessageItem = React.memo(({ message, currentUserId, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit, editingContent, setEditingContent }) => {
// //     // ... (Keep the existing MessageItem code from the previous answer) ...
// //     const isOwnMessage = message.sender?._id === currentUserId;
// //     const senderName = message.sender?.firstName || 'User'; // Simplified
// //     const messageTime = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// //     const editedTime = message.editedAt ? new Date(message.editedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

// //     const handleSave = () => {
// //         onSaveEdit(message._id, editingContent);
// //     }

// //     const handleKeyDown = (e) => {
// //         if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter (not Shift+Enter)
// //         e.preventDefault();
// //         handleSave();
// //         } else if (e.key === 'Escape') { // Cancel on Escape
// //         onCancelEdit();
// //         }
// //     }

// //     return (
// //         <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
// //         <div className={`py-2 px-3 rounded-lg shadow-sm max-w-xs lg:max-w-md ${isOwnMessage ? 'bg-indigo-100' : 'bg-white'}`}>
// //             {!isOwnMessage && (
// //             <div className="text-xs font-semibold text-indigo-700 mb-1">{senderName}</div>
// //             )}
// //             {isEditing ? (
// //                 <div className="flex items-center space-x-1">
// //                     <textarea
// //                         value={editingContent}
// //                         onChange={(e) => setEditingContent(e.target.value)}
// //                         onKeyDown={handleKeyDown}
// //                         className="text-sm text-gray-800 border border-indigo-300 rounded p-1 w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
// //                         rows={Math.min(editingContent.split('\n').length, 4)} // Auto-grow slightly
// //                         autoFocus
// //                     />
// //                     <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-800"><CheckIcon className="h-4 w-4"/></button>
// //                     <button onClick={onCancelEdit} className="p-1 text-red-600 hover:text-red-800"><XMarkIcon className="h-4 w-4"/></button>
// //                 </div>
// //             ) : (
// //                 <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
// //             )}
// //             <div className="text-xs text-gray-500 mt-1 flex items-center justify-end space-x-2">
// //             {editedTime && <span className="italic text-gray-400">(edited {editedTime})</span>}
// //             <span>{messageTime}</span>
// //             {isOwnMessage && !isEditing && (
// //                 <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
// //                     <button onClick={() => onEdit(message._id, message.content)} className="text-gray-400 hover:text-indigo-600">
// //                         <PencilIcon className="h-3 w-3" />
// //                     </button>
// //                     <button onClick={() => onDelete(message._id)} className="text-gray-400 hover:text-red-600">
// //                         <TrashIcon className="h-3 w-3" />
// //                     </button>
// //                 </div>
// //             )}
// //             </div>
// //         </div>
// //         </div>
// //     );
// // });


// // const ChatPage = () => {
// //   const [chatRooms, setChatRooms] = useState([]);
// //   const [selectedRoomId, setSelectedRoomId] = useState(null);
// //   // State for currently *displayed* messages
// //   const [messages, setMessages] = useState([]);
// //   // --- NEW: State for caching messages by roomId ---
// //   const [messagesCache, setMessagesCache] = useState({}); // { roomId: [messages...], ... }
// //   const [isLoadingRooms, setIsLoadingRooms] = useState(false);
// //   // Separate loading state for initial fetch vs background refresh
// //   const [isLoadingMessages, setIsLoadingMessages] = useState(false);
// //   const [isRefreshingMessages, setIsRefreshingMessages] = useState(false); // For background fetch
// //   const [errorRooms, setErrorRooms] = useState(null);
// //   const [errorMessages, setErrorMessages] = useState(null);
// //   const [newMessageContent, setNewMessageContent] = useState('');
// //   const [isSending, setIsSending] = useState(false);
// //   const [socket, setSocket] = useState(null);
// //   const [isConnected, setIsConnected] = useState(false);
// //   const [editingMessageId, setEditingMessageId] = useState(null);
// //   const [editingContent, setEditingContent] = useState('');

// //   const messagesEndRef = useRef(null);
// //   const currentUserId = getCurrentUserId();
// //   const currentSelectedRoomIdRef = useRef(selectedRoomId); // Ref to access current room in socket handlers

// //   // Keep the ref updated
// //   useEffect(() => {
// //     currentSelectedRoomIdRef.current = selectedRoomId;
// //   }, [selectedRoomId]);


// //   const scrollToBottom = (behavior = "smooth") => {
// //       // Delay slightly to allow DOM update after setting messages
// //      setTimeout(() => {
// //          messagesEndRef.current?.scrollIntoView({ behavior });
// //      }, 50);
// //   };

// //   // Fetch initial chat rooms (no changes needed here)
// //   useEffect(() => {
// //     const fetchRooms = async () => {
// //       setIsLoadingRooms(true);
// //       setErrorRooms(null);
// //       try {
// //         const data = await chatAPI.getMyChatRooms();
// //         setChatRooms(data.chatRooms || []);
// //       } catch (err) {
// //         console.error('Failed to fetch chat rooms:', err);
// //         setErrorRooms('Could not load your chat rooms.');
// //         setChatRooms([]);
// //       } finally {
// //         setIsLoadingRooms(false);
// //       }
// //     };
// //     fetchRooms();
// //   }, []);

// //   // --- MODIFIED: Fetch/Refresh messages for selected room ---
// //   useEffect(() => {
// //     if (!selectedRoomId) {
// //       // Don't clear messages here, handleSelectRoom does it if needed
// //       return;
// //     }

// //     const fetchAndCacheMessages = async () => {
// //         // Indicate loading only if cache is empty for this room
// //         const isInitialLoad = !messagesCache[selectedRoomId];
// //         if (isInitialLoad) {
// //             setIsLoadingMessages(true);
// //         } else {
// //             setIsRefreshingMessages(true); // Indicate background refresh
// //         }
// //         setErrorMessages(null);

// //         try {
// //             console.log(`Fetching messages for room ${selectedRoomId} (Initial: ${isInitialLoad})`);
// //             // TODO: Implement pagination/load more logic here if needed
// //             const data = await chatAPI.getMessagesForRoom(selectedRoomId, { limit: 100 }); // Fetch latest batch
// //             const fetchedMessages = data.messages || [];

// //             // Update cache for this room
// //             setMessagesCache(prevCache => ({
// //                 ...prevCache,
// //                 [selectedRoomId]: fetchedMessages
// //             }));

// //             // Update displayed messages ONLY if the user is still viewing this room
// //             if (currentSelectedRoomIdRef.current === selectedRoomId) {
// //                 setMessages(fetchedMessages);
// //                  // Scroll only on initial load or if already scrolled near bottom?
// //                  // For simplicity, scroll on initial load
// //                 if (isInitialLoad) {
// //                     scrollToBottom("auto"); // Use auto for instant scroll on load
// //                 }
// //             }
// //             console.log(`Messages updated for room ${selectedRoomId} in cache and display.`);

// //         } catch (err) {
// //             console.error(`Failed to fetch messages for room ${selectedRoomId}:`, err);
// //             if (currentSelectedRoomIdRef.current === selectedRoomId) {
// //                 setErrorMessages('Could not load messages for this room.');
// //                 // Optional: Clear displayed messages on error? Or keep stale cache?
// //                 // setMessages([]);
// //             }
// //         } finally {
// //             // Update loading states only if the user is still viewing this room
// //              if (currentSelectedRoomIdRef.current === selectedRoomId) {
// //                 if (isInitialLoad) setIsLoadingMessages(false);
// //                 setIsRefreshingMessages(false);
// //              }
// //         }
// //     };

// //     fetchAndCacheMessages();

// //   }, [selectedRoomId]); // Trigger fetch when selectedRoomId changes

// //   // --- MODIFIED: Socket Connection and Event Listeners ---
// //   useEffect(() => {
// //     const token = localStorage.getItem('wku_cms_token');
// //     if (!token) {
// //       console.error("No auth token found for socket connection using key 'wku_cms_token'.");
// //       setErrorMessages("Authentication required.");
// //       return;
// //     }

// //     console.log("Attempting socket connection with token...");
// //     const newSocket = io(SOCKET_URL, { auth: { token } });
// //     setSocket(newSocket);

// //     newSocket.on('connect', () => {
// //       console.log('Socket connected:', newSocket.id);
// //       setIsConnected(true);
// //       setErrorMessages(null); // Clear connection errors
// //       // Re-join room if selected when connection re-establishes
// //       if (currentSelectedRoomIdRef.current) {
// //            console.log(`Re-joining room ${currentSelectedRoomIdRef.current} on connect`);
// //            newSocket.emit('joinRoom', currentSelectedRoomIdRef.current);
// //       }
// //     });

// //     newSocket.on('disconnect', (reason) => {
// //       console.log('Socket disconnected:', reason);
// //       setIsConnected(false);
// //       setErrorMessages("Disconnected from chat."); // Show feedback
// //     });

// //     newSocket.on('connect_error', (error) => {
// //       console.error('Socket connection error:', error.message);
// //       setIsConnected(false);
// //       setErrorMessages(`Connection Error: ${error.message}`);
// //     });

// //     // Handle incoming new messages
// //     newSocket.on('newMessage', (message) => {
// //       console.log('Received newMessage via socket:', message);
// //       const chatRoomId = message.chatRoomId;

// //       // Update cache for the specific room
// //       setMessagesCache(prevCache => {
// //         const currentRoomMessages = prevCache[chatRoomId] || [];
// //         // Avoid duplicates if message somehow already exists
// //         if (currentRoomMessages.some(m => m._id === message._id)) {
// //             return prevCache;
// //         }
// //         return {
// //           ...prevCache,
// //           [chatRoomId]: [...currentRoomMessages, message]
// //         };
// //       });

// //       // Update displayed messages ONLY if user is currently viewing this room
// //       if (chatRoomId === currentSelectedRoomIdRef.current) {
// //         setMessages(prevMessages => {
// //             // Avoid duplicates here too
// //              if (prevMessages.some(m => m._id === message._id)) {
// //                 return prevMessages;
// //             }
// //             return [...prevMessages, message];
// //         });
// //         scrollToBottom();
// //       }
// //       // TODO: Add unread notification logic if chatRoomId !== currentSelectedRoomIdRef.current
// //     });

// //     // Handle message updates (edits)
// //     newSocket.on('messageUpdated', (updatePayload) => {
// //       console.log('Received messageUpdated via socket:', updatePayload);
// //       const { chatRoomId, _id: messageId } = updatePayload;

// //       // Update cache
// //        setMessagesCache(prevCache => {
// //          const currentRoomMessages = prevCache[chatRoomId] || [];
// //          return {
// //             ...prevCache,
// //             [chatRoomId]: currentRoomMessages.map(msg =>
// //                 msg._id === messageId
// //                 ? { ...msg, content: updatePayload.content, editedAt: updatePayload.editedAt }
// //                 : msg
// //             )
// //          };
// //        });

// //       // Update displayed messages if user is currently viewing this room
// //       if (chatRoomId === currentSelectedRoomIdRef.current) {
// //         setMessages(prevMessages =>
// //           prevMessages.map(msg =>
// //             msg._id === messageId
// //               ? { ...msg, content: updatePayload.content, editedAt: updatePayload.editedAt }
// //               : msg
// //           )
// //         );
// //         // If this was the message being edited locally, exit editing mode
// //         if (editingMessageId === messageId) {
// //           setEditingMessageId(null);
// //           setEditingContent('');
// //         }
// //       }
// //     });

// //     // Handle message deletions
// //     newSocket.on('messageDeleted', (deletePayload) => {
// //       console.log('Received messageDeleted via socket:', deletePayload);
// //        const { chatRoomId, messageId } = deletePayload;

// //        // Update cache
// //         setMessagesCache(prevCache => {
// //             const currentRoomMessages = prevCache[chatRoomId] || [];
// //             return {
// //                 ...prevCache,
// //                 [chatRoomId]: currentRoomMessages.filter(msg => msg._id !== messageId)
// //             };
// //         });

// //       // Update displayed messages if user is currently viewing this room
// //       if (chatRoomId === currentSelectedRoomIdRef.current) {
// //         setMessages(prevMessages =>
// //           prevMessages.filter(msg => msg._id !== messageId)
// //         );
// //          // If this was the message being edited locally, exit editing mode
// //         if (editingMessageId === messageId) {
// //             setEditingMessageId(null);
// //             setEditingContent('');
// //         }
// //       }
// //     });

// //     newSocket.on('chatError', (errorData) => {
// //       console.error('Received chatError:', errorData.message);
// //        // Show error more permanently if needed
// //       if (currentSelectedRoomIdRef.current) { // Show only if in a room context?
// //           setErrorMessages(`Chat Error: ${errorData.message}`);
// //       }
// //        setIsSending(false); // Reset sending state if applicable
// //     });

// //     return () => {
// //       console.log('Disconnecting socket...');
// //       newSocket.disconnect();
// //       setIsConnected(false);
// //       setSocket(null);
// //     };
// //      // SOCKET_URL might not change, but good practice if it could
// //   }, [SOCKET_URL]); // Removed selectedRoomId/editingMessageId from here, handled via ref

// //   // --- MODIFIED: Room Selection Handler ---
// //   const handleSelectRoom = useCallback((roomId) => {
// //     if (roomId === currentSelectedRoomIdRef.current) return; // No change

// //     const previousRoomId = currentSelectedRoomIdRef.current;

// //     // Leave previous room socket subscription
// //     if (socket && isConnected && previousRoomId) {
// //       console.log(`Leaving room: ${previousRoomId}`);
// //       socket.emit('leaveRoom', previousRoomId);
// //     }

// //     // Update the selected room ID state
// //     setSelectedRoomId(roomId);
// //     // Update Ref immediately
// //     currentSelectedRoomIdRef.current = roomId;

// //     // --- Load messages from cache immediately ---
// //     if (messagesCache[roomId]) {
// //         console.log(`Loading messages for ${roomId} from cache.`);
// //         setMessages(messagesCache[roomId]);
// //         setIsLoadingMessages(false); // Not loading initially if cache hit
// //         scrollToBottom("auto"); // Scroll immediately on cache hit
// //     } else {
// //         console.log(`No cache hit for ${roomId}. Will fetch.`);
// //         setMessages([]); // Clear display if no cache exists
// //         setIsLoadingMessages(true); // Show loading spinner
// //     }

// //     // Clear errors and reset editing state for the new room
// //     setErrorMessages(null);
// //     setEditingMessageId(null);
// //     setEditingContent('');

// //     // Join the new room socket subscription
// //     if (socket && isConnected && roomId) {
// //       console.log(`Joining room: ${roomId}`);
// //       socket.emit('joinRoom', roomId);
// //     }

// //      // The useEffect depending on selectedRoomId will trigger the background fetch/refresh
// //   }, [socket, isConnected, messagesCache]); // Depend on cache so check logic is up-to-date

// //   // --- Send Message Handler (No changes needed here) ---
// //   const handleSendMessage = (e) => {
// //      e.preventDefault();
// //      const currentRoomId = currentSelectedRoomIdRef.current; // Use ref here too
// //      if (!socket || !isConnected || !currentRoomId || !newMessageContent.trim() || isSending || editingMessageId) {
// //        return;
// //      }
// //      setIsSending(true);
// //      setErrorMessages(null);
// //      const payload = { roomId: currentRoomId, content: newMessageContent.trim() };
// //      console.log('Emitting chatMessage:', payload);
// //      socket.emit('chatMessage', payload);
// //      setNewMessageContent('');
// //      setIsSending(false);
// //      // Rely on 'newMessage' listener to update cache and UI
// //   };

// //   // --- Edit/Delete Handlers (No changes needed here, rely on listeners) ---
// //    const handleEditClick = (messageId, currentContent) => {
// //        setEditingMessageId(messageId);
// //        setEditingContent(currentContent);
// //    };
// //    const handleCancelEdit = () => {
// //        setEditingMessageId(null);
// //        setEditingContent('');
// //    };
// //    const handleSaveEdit = (messageId, newContent) => {
// //        if (!socket || !isConnected || !newContent.trim() || !messageId) return;
// //        setErrorMessages(null);
// //        const payload = { messageId: messageId, newContent: newContent.trim() };
// //        console.log('Emitting editMessage:', payload);
// //        socket.emit('editMessage', payload);
// //        // Rely on 'messageUpdated' listener
// //    };
// //    const handleDeleteClick = (messageId) => {
// //        if (!socket || !isConnected || !messageId) return;
// //        setErrorMessages(null);
// //        // Add confirmation?
// //        const payload = { messageId: messageId };
// //        console.log('Emitting deleteMessage:', payload);
// //        socket.emit('deleteMessage', payload);
// //        // Rely on 'messageDeleted' listener
// //    };


// //   // --- Render ---
// //   return (
// //     // Container div remains the same
// //     <div className="flex flex-col md:flex-row h-[calc(100vh-theme(space.24))] bg-gray-50">

// //       {/* Chat Rooms List (Sidebar) - Add disconnected status */}
// //       <div className="w-full md:w-1/4 lg:w-1/5 border-r border-gray-200 bg-white flex flex-col">
// //            <div className="p-4 border-b flex justify-between items-center">
// //                <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
// //                {!isConnected && <span className="text-xs text-red-500 font-medium">(Offline)</span>}
// //                {/* You could add a manual reconnect button here */}
// //            </div>
// //            <div className="flex-1 overflow-y-auto p-4">
// //              {/* Room list rendering logic remains the same */}
// //              {isLoadingRooms && <div className="text-center p-4"><ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-indigo-600" /></div>}
// //              {errorRooms && <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{errorRooms}</div>}
// //              {!isLoadingRooms && !errorRooms && (
// //              <ul className="space-y-1">
// //                  {chatRooms.length === 0 && <li className="text-gray-500 text-sm px-2 py-1">No chat rooms found.</li>}
// //                  {chatRooms.map((room) => (
// //                  <li key={room._id}>
// //                      <button
// //                      onClick={() => handleSelectRoom(room._id)}
// //                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
// //                          selectedRoomId === room._id // Use state for styling active room
// //                          ? 'bg-indigo-100 text-indigo-800 font-semibold'
// //                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
// //                      }`}
// //                      >
// //                      {room.projectId?.projectName || room.name || `Chat ${room._id.slice(-5)}`}
// //                      </button>
// //                  </li>
// //                  ))}
// //              </ul>
// //              )}
// //            </div>
// //        </div>


// //       {/* Messages Area */}
// //       <div className="flex-1 flex flex-col">
// //         {!selectedRoomId ? (
// //             // Placeholder when no room is selected
// //             <div className="flex-1 flex items-center justify-center text-gray-500">
// //               Select a chat room to start messaging.
// //             </div>
// //         ) : (
// //           <>
// //             {/* Room Header - Add refresh indicator */}
// //              <div className="p-4 border-b bg-white shadow-sm flex justify-between items-center">
// //                  <h3 className="text-md font-semibold text-gray-800">
// //                      {/* Room name logic remains */}
// //                      {chatRooms.find(r => r._id === selectedRoomId)?.projectId?.projectName || chatRooms.find(r => r._id === selectedRoomId)?.name || `Chat`}
// //                  </h3>
// //                  {isRefreshingMessages && <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" title="Refreshing..."/>}
// //              </div>

// //             {/* Messages Display - Use 'messages' state */}
// //              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
// //                {/* Loading state ONLY shown on initial load (no cache) */}
// //                {isLoadingMessages && <div className="text-center p-4"><ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-indigo-600" /></div>}
// //                {/* Error display remains */}
// //                {errorMessages && <div className="text-red-600 bg-red-100 p-3 rounded-md my-4 text-sm">{errorMessages}</div>}
// //                {/* Message rendering uses 'messages' state */}
// //                {!isLoadingMessages && messages.length === 0 && !errorMessages && (
// //                  <p className="text-center text-gray-500 py-4">No messages yet. Start the conversation!</p>
// //                )}
// //                {!isLoadingMessages && messages.map((msg) => (
// //                   <div key={msg._id} className="group relative">
// //                      <MessageItem
// //                          message={msg}
// //                          currentUserId={currentUserId}
// //                          onEdit={handleEditClick}
// //                          onDelete={handleDeleteClick}
// //                          isEditing={editingMessageId === msg._id}
// //                          onSaveEdit={handleSaveEdit}
// //                          onCancelEdit={handleCancelEdit}
// //                          editingContent={editingMessageId === msg._id ? editingContent : ''}
// //                          setEditingContent={setEditingContent}
// //                      />
// //                   </div>
// //                ))}
// //                <div ref={messagesEndRef} />
// //              </div>

// //             {/* Message Input Area (No changes needed here) */}
// //             <div className="border-t p-4 bg-white">
// //                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
// //                  <textarea
// //                    value={newMessageContent}
// //                    onChange={(e) => setNewMessageContent(e.target.value)}
// //                    onKeyDown={(e) => {
// //                        if (e.key === 'Enter' && !e.shiftKey) {
// //                          e.preventDefault();
// //                          handleSendMessage(e);
// //                        }
// //                    }}
// //                    className="flex-1 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none custom-scrollbar"
// //                    rows="1"
// //                    placeholder={isConnected ? "Type your message..." : "Connecting..."}
// //                    disabled={!isConnected || isSending || editingMessageId !== null}
// //                    style={{ minHeight: '40px', maxHeight: '120px' }}
// //                  />
// //                  <button
// //                    type="submit"
// //                    className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
// //                    disabled={!isConnected || isSending || !newMessageContent.trim() || editingMessageId !== null}
// //                  >
// //                    {isSending ? (
// //                       <ArrowPathIcon className="h-5 w-5 animate-spin" />
// //                    ) : (
// //                       <PaperAirplaneIcon className="h-5 w-5" />
// //                    )}
// //                  </button>
// //                </form>
// //              </div>
// //           </>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default ChatPage;

// // /*eslint-disable */
// // import React, { useState, useEffect, useRef, useCallback } from 'react';
// // import { io } from 'socket.io-client';
// // import * as chatAPI from '../../Api/chatService'; // Verify path
// // import authAPI from '../../Api/auth';           // Verify path
// // import { ArrowPathIcon, PaperAirplaneIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon, ClockIcon } from '@heroicons/react/20/solid'; // Added ClockIcon

// // const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'; // Use VITE_ prefix

// // const getCurrentUserId = () => {
// //   const user = authAPI.getCurrentUser();
// //   return user?._id;
// // };
// // const getCurrentUser = () => { // Helper to get full user object if needed
// //     return authAPI.getCurrentUser();
// // }

// // // --- MODIFIED: MessageItem handles 'pending' status ---
// // const MessageItem = React.memo(({ message, currentUserId, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit, editingContent, setEditingContent }) => {
// //     const isOwnMessage = message.sender?._id === currentUserId;
// //     const isPending = message.status === 'pending'; // Check for pending status
// //     const senderName = message.sender?.firstName || 'User';
// //     // Use client time for pending, server time otherwise
// //     const messageTime = new Date(isPending ? message.clientTimestamp : message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// //     const editedTime = message.editedAt ? new Date(message.editedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

// //     const handleSave = () => onSaveEdit(message._id, editingContent);
// //     const handleKeyDown = (e) => {
// //         if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
// //         else if (e.key === 'Escape') { onCancelEdit(); }
// //     }

// //     return (
// //         // Add opacity for pending messages
// //         <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 group relative ${isPending ? 'opacity-70' : ''}`}>
// //             <div className={`py-2 px-3 rounded-lg shadow-sm max-w-xs lg:max-w-md ${isOwnMessage ? 'bg-indigo-100' : 'bg-white'}`}>
// //                 {!isOwnMessage && <div className="text-xs font-semibold text-indigo-700 mb-1">{senderName}</div>}
// //                 {isEditing ? (
// //                     <div className="flex items-center space-x-1">
// //                         <textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} onKeyDown={handleKeyDown} className="text-sm text-gray-800 border border-indigo-300 rounded p-1 w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none" rows={Math.min(editingContent.split('\n').length, 4)} autoFocus />
// //                         <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-800"><CheckIcon className="h-4 w-4"/></button>
// //                         <button onClick={onCancelEdit} className="p-1 text-red-600 hover:text-red-800"><XMarkIcon className="h-4 w-4"/></button>
// //                     </div>
// //                 ) : (<p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>)}
// //                 <div className="text-xs text-gray-500 mt-1 flex items-center justify-end space-x-2">
// //                      {/* Show clock icon if pending */}
// //                     {isPending && isOwnMessage && <ClockIcon className="h-3 w-3 text-gray-400" title="Sending..." />}
// //                     {editedTime && <span className="italic text-gray-400 text-[10px]">(edited)</span>}
// //                     <span>{messageTime}</span>
// //                      {/* Disable edit/delete for pending messages */}
// //                     {isOwnMessage && !isEditing && !isPending && (
// //                         <div className="absolute bottom-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
// //                             <button onClick={() => onEdit(message._id, message.content)} className="p-0.5 rounded bg-white/50 hover:bg-white text-gray-500 hover:text-indigo-600"><PencilIcon className="h-3 w-3" /></button>
// //                             <button onClick={() => onDelete(message._id)} className="p-0.5 rounded bg-white/50 hover:bg-white text-gray-500 hover:text-red-600"><TrashIcon className="h-3 w-3" /></button>
// //                         </div>
// //                     )}
// //                 </div>
// //             </div>
// //         </div>
// //     );
// // });


// // const ChatPage = () => {
// //   const [chatRooms, setChatRooms] = useState([]);
// //   const [selectedRoomId, setSelectedRoomId] = useState(null);
// //   const [messages, setMessages] = useState([]);
// //   const [messagesCache, setMessagesCache] = useState({});
// //   const [isLoadingRooms, setIsLoadingRooms] = useState(false);
// //   const [isLoadingMessages, setIsLoadingMessages] = useState(false);
// //   const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);
// //   const [errorRooms, setErrorRooms] = useState(null);
// //   const [errorMessages, setErrorMessages] = useState(null);
// //   const [newMessageContent, setNewMessageContent] = useState('');
// //   const [isSending, setIsSending] = useState(false); // Keep this for button state, but UI update is immediate
// //   const [socket, setSocket] = useState(null);
// //   const [isConnected, setIsConnected] = useState(false);
// //   const [editingMessageId, setEditingMessageId] = useState(null);
// //   const [editingContent, setEditingContent] = useState('');

// //   const messagesEndRef = useRef(null);
// //   const currentUserId = getCurrentUserId();
// //   const currentUser = getCurrentUser(); // Get full user object for optimistic message
// //   const currentSelectedRoomIdRef = useRef(selectedRoomId);
// //   // --- NEW: Ref to store mapping of temp IDs to sent content ---
// //   const pendingMessagesRef = useRef({}); // { tempId: { content: "...", timestamp: ... }, ... }

// //   useEffect(() => { currentSelectedRoomIdRef.current = selectedRoomId; }, [selectedRoomId]);

// //   const scrollToBottom = (behavior = "smooth") => { setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior }); }, 50); };

// //   // Fetch initial chat rooms (no change)
// //   useEffect(() => { /* ... fetchRooms logic ... */
// //     const fetchRooms = async () => {
// //         setIsLoadingRooms(true); setErrorRooms(null);
// //         try {
// //             const data = await chatAPI.getMyChatRooms();
// //             setChatRooms(data.chatRooms || []);
// //         } catch (err) {
// //             console.error('Failed to fetch chat rooms:', err); setErrorRooms('Could not load rooms.'); setChatRooms([]);
// //         } finally { setIsLoadingRooms(false); }
// //     };
// //     fetchRooms();
// //   }, []);

// //   // Fetch/Refresh messages for selected room (acts as reconciliation)
// //   useEffect(() => { /* ... fetchAndCacheMessages logic ... */
// //     if (!selectedRoomId) return;
// //     const fetchAndCacheMessages = async () => {
// //         const isInitialLoad = !(messagesCache[selectedRoomId] && messagesCache[selectedRoomId].length > 0);
// //         if (isInitialLoad) { setIsLoadingMessages(true); } else { setIsRefreshingMessages(true); }
// //         setErrorMessages(null);
// //         try {
// //             const data = await chatAPI.getMessagesForRoom(selectedRoomId, { limit: 100 });
// //             // Ensure data structure is correct - adjust path if needed
// //             const fetchedMessages = data?.data?.messages || data?.messages || [];

// //             setMessagesCache(prevCache => ({ ...prevCache, [selectedRoomId]: fetchedMessages }));

// //             if (currentSelectedRoomIdRef.current === selectedRoomId) {
// //                 setMessages(fetchedMessages); // Overwrite displayed messages with DB source of truth
// //                 if (isInitialLoad) scrollToBottom("auto");
// //             }
// //         } catch (err) {
// //             console.error(`Fetch messages error for ${selectedRoomId}:`, err);
// //             if (currentSelectedRoomIdRef.current === selectedRoomId) setErrorMessages('Could not load messages.');
// //         } finally {
// //             if (currentSelectedRoomIdRef.current === selectedRoomId) {
// //                 if (isInitialLoad) setIsLoadingMessages(false);
// //                 setIsRefreshingMessages(false);
// //             }
// //         }
// //     };
// //     fetchAndCacheMessages();
// //   }, [selectedRoomId]);


// //   // Socket Connection and Event Listeners
// //   useEffect(() => { /* ... socket connection logic ... */
// //     const token = localStorage.getItem('wku_cms_token');
// //     if (!token) { /* handle no token */ return; }

// //     const newSocket = io(SOCKET_URL, { auth: { token } });
// //     setSocket(newSocket);

// //     newSocket.on('connect', () => { setIsConnected(true); setErrorMessages(null); if (currentSelectedRoomIdRef.current) newSocket.emit('joinRoom', currentSelectedRoomIdRef.current); });
// //     newSocket.on('disconnect', () => { setIsConnected(false); setErrorMessages("Disconnected"); });
// //     newSocket.on('connect_error', () => { setIsConnected(false); setErrorMessages("Connection Failed"); });

// //     // --- MODIFIED: newMessage listener for confirmation ---
// //     newSocket.on('newMessage', (confirmedMessage) => {
// //       const chatRoomId = confirmedMessage?.chatRoomId;
// //       if (!chatRoomId) return;

// //        console.log(`SOCKET: Received 'newMessage'`, confirmedMessage); // DEBUG

// //       // Check if it's the echo of a message sent by the current user
// //       if (confirmedMessage.sender?._id === currentUserId) {
// //         // Find the corresponding pending message and replace it
// //         const tempIdToConfirm = Object.keys(pendingMessagesRef.current).find(
// //             tempId => pendingMessagesRef.current[tempId]?.content === confirmedMessage.content // Simple content match for now
// //             // TODO: Make matching more robust if needed (e.g., match timestamp within a few seconds)
// //         );

// //         if (tempIdToConfirm) {
// //             console.log(`SOCKET: Confirming own message with tempId ${tempIdToConfirm}`); // DEBUG
// //              // Update Cache
// //             setMessagesCache(prevCache => {
// //                 const roomCache = prevCache[chatRoomId] || [];
// //                 return {
// //                     ...prevCache,
// //                     [chatRoomId]: roomCache.map(msg => msg._id === tempIdToConfirm ? { ...confirmedMessage, status: 'sent' } : msg) // Replace temp with confirmed
// //                 };
// //             });
// //              // Update Display
// //             if (chatRoomId === currentSelectedRoomIdRef.current) {
// //                 setMessages(prev => prev.map(msg => msg._id === tempIdToConfirm ? { ...confirmedMessage, status: 'sent' } : msg));
// //             }
// //             // Clean up pending ref
// //             delete pendingMessagesRef.current[tempIdToConfirm];

// //         } else {
// //              console.warn("SOCKET: Received own message echo, but couldn't find matching pending message.", confirmedMessage); // DEBUG
// //               // Fallback: Add if not found (though ideally fetch would handle this)
// //               setMessagesCache(prevCache => { /* Add message if not present */
// //                 const roomCache = prevCache[chatRoomId] || [];
// //                 if (roomCache.some(m => m._id === confirmedMessage._id)) return prevCache;
// //                 return { ...prevCache, [chatRoomId]: [...roomCache, confirmedMessage] };
// //               });
// //               if (chatRoomId === currentSelectedRoomIdRef.current) {
// //                   setMessages(prev => prev.some(m => m._id === confirmedMessage._id) ? prev : [...prev, confirmedMessage]);
// //               }
// //         }
// //       } else {
// //         // Message from another user
// //         console.log("SOCKET: Received message from other user."); // DEBUG
// //         setMessagesCache(prevCache => { /* Add message if not present */
// //             const roomCache = prevCache[chatRoomId] || [];
// //             if (roomCache.some(m => m._id === confirmedMessage._id)) return prevCache;
// //             return { ...prevCache, [chatRoomId]: [...roomCache, confirmedMessage] };
// //         });
// //         if (chatRoomId === currentSelectedRoomIdRef.current) {
// //             setMessages(prev => prev.some(m => m._id === confirmedMessage._id) ? prev : [...prev, confirmedMessage]);
// //             scrollToBottom();
// //         }
// //       }
// //     });

// //     // messageUpdated listener (no change needed for optimistic sending)
// //     newSocket.on('messageUpdated', (updatePayload) => { /* ... as before ... */
// //         const { chatRoomId, _id: messageId } = updatePayload || {};
// //         if (!chatRoomId || !messageId) return;
// //         setMessagesCache(prevCache => { const roomCache = prevCache[chatRoomId] || []; return { ...prevCache, [chatRoomId]: roomCache.map(msg => msg._id === messageId ? { ...msg, content: updatePayload.content, editedAt: updatePayload.editedAt } : msg) }; });
// //         if (chatRoomId === currentSelectedRoomIdRef.current) { setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, content: updatePayload.content, editedAt: updatePayload.editedAt } : msg)); if (editingMessageId === messageId) { setEditingMessageId(null); setEditingContent(''); } }
// //     });

// //     // messageDeleted listener (no change needed for optimistic sending)
// //     newSocket.on('messageDeleted', (deletePayload) => { /* ... as before ... */
// //         const { chatRoomId, messageId } = deletePayload || {};
// //         if (!chatRoomId || !messageId) return;
// //         setMessagesCache(prevCache => { const roomCache = prevCache[chatRoomId] || []; return { ...prevCache, [chatRoomId]: roomCache.filter(msg => msg._id !== messageId) }; });
// //         if (chatRoomId === currentSelectedRoomIdRef.current) { setMessages(prev => prev.filter(msg => msg._id !== messageId)); if (editingMessageId === messageId) { setEditingMessageId(null); setEditingContent(''); } }
// //     });

// //     newSocket.on('chatError', (errorData) => { /* ... as before ... */
// //         console.error('SOCKET: Received chatError:', errorData?.message); if (currentSelectedRoomIdRef.current) setErrorMessages(`Chat Error: ${errorData?.message}`); setIsSending(false);
// //     });

// //     return () => { newSocket.disconnect(); setSocket(null); setIsConnected(false); };
// //   }, [SOCKET_URL]); // Keep dependencies minimal for socket setup

// //   // Room Selection Handler (no change needed)
// //   const handleSelectRoom = useCallback((roomId) => { /* ... as before ... */
// //     const currentRoom = currentSelectedRoomIdRef.current;
// //     if (roomId === currentRoom) return;
// //     if (socket && isConnected && currentRoom) socket.emit('leaveRoom', currentRoom);
// //     setSelectedRoomId(roomId);
// //     currentSelectedRoomIdRef.current = roomId;
// //     if (messagesCache[roomId] && messagesCache[roomId].length > 0) { setMessages(messagesCache[roomId]); setIsLoadingMessages(false); scrollToBottom("auto"); }
// //     else { setMessages([]); setIsLoadingMessages(true); }
// //     setErrorMessages(null); setEditingMessageId(null); setEditingContent('');
// //     if (socket && isConnected && roomId) socket.emit('joinRoom', roomId);
// //   }, [socket, isConnected, messagesCache]);


// //   // --- MODIFIED: Send Message Handler for Optimistic UI ---
// //   const handleSendMessage = (e) => {
// //      e?.preventDefault();
// //      const currentRoomId = currentSelectedRoomIdRef.current;
// //      if (!socket || !isConnected || !currentRoomId || !newMessageContent.trim() || editingMessageId) { // Removed isSending check here
// //        return;
// //      }

// //      setIsSending(true); // Still set sending for button state
// //      setErrorMessages(null);

// //      // 1. Generate temporary ID and optimistic message object
// //      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
// //      const clientTimestamp = new Date().toISOString();
// //      const optimisticMessage = {
// //          _id: tempId, // Use temporary ID
// //          chatRoomId: currentRoomId,
// //          sender: { // Include basic sender info
// //              _id: currentUser._id,
// //              firstName: currentUser.firstName,
// //              // Add other fields if your MessageItem uses them
// //          },
// //          content: newMessageContent.trim(),
// //          createdAt: clientTimestamp, // Use client time initially
// //          clientTimestamp: clientTimestamp, // Store client time separately if needed
// //          status: 'pending' // Mark as pending
// //      };

// //       // Add to pending messages ref for later confirmation matching
// //       pendingMessagesRef.current[tempId] = {
// //           content: optimisticMessage.content,
// //           timestamp: clientTimestamp
// //       };

// //      // 2. Update UI immediately (cache and display)
// //      setMessagesCache(prevCache => {
// //          const roomCache = prevCache[currentRoomId] || [];
// //          return { ...prevCache, [currentRoomId]: [...roomCache, optimisticMessage] };
// //      });
// //      setMessages(prev => [...prev, optimisticMessage]);
// //      scrollToBottom(); // Scroll after adding optimistic message

// //      // 3. Emit to socket
// //      const payload = { roomId: currentRoomId, content: newMessageContent.trim() };
// //      console.log('SOCKET: Emitting chatMessage:', payload);
// //      socket.emit('chatMessage', payload);

// //      // 4. Clear input and reset button state
// //      setNewMessageContent('');
// //      setIsSending(false); // Reset button state after emitting
// //   };

// //   // Edit/Delete Handlers (no change)
// //   const handleEditClick = (messageId, currentContent) => { /* ... */ setEditingMessageId(messageId); setEditingContent(currentContent); };
// //   const handleCancelEdit = () => { /* ... */ setEditingMessageId(null); setEditingContent(''); };
// //   const handleSaveEdit = (messageId, newContent) => { /* ... emit editMessage ... */
// //       if (!socket || !isConnected || !newContent.trim() || !messageId) return;
// //       setErrorMessages(null);
// //       const payload = { messageId, newContent: newContent.trim() };
// //       socket.emit('editMessage', payload);
// //   };
// //   const handleDeleteClick = (messageId) => { /* ... emit deleteMessage ... */
// //       if (!socket || !isConnected || !messageId) return;
// //       setErrorMessages(null);
// //       const payload = { messageId };
// //       socket.emit('deleteMessage', payload);
// //   };

// //   // --- Render ---
// //   return (
// //     <div className="flex flex-col md:flex-row h-[calc(100vh-theme(space.24))] bg-gray-50">

// //       {/* Sidebar (no change needed) */}
// //       <div className="w-full md:w-1/4 lg:w-1/5 border-r border-gray-200 bg-white flex flex-col">
// //           {/* ... room list render ... */}
// //           <div className="p-4 border-b flex justify-between items-center">
// //                <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
// //                {!isConnected && <span className="text-xs text-red-500 font-medium animate-pulse">(Offline)</span>}
// //            </div>
// //            <div className="flex-1 overflow-y-auto p-4">
// //              {isLoadingRooms && <div className="text-center p-4"><ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-indigo-600" /></div>}
// //              {errorRooms && <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{errorRooms}</div>}
// //              {!isLoadingRooms && !errorRooms && (
// //                 <ul className="space-y-1">
// //                     {chatRooms.length === 0 && <li className="text-gray-500 text-sm px-2 py-1">No chat rooms.</li>}
// //                     {chatRooms.map((room) => (
// //                     <li key={room._id}>
// //                         <button onClick={() => handleSelectRoom(room._id)}
// //                                 className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 truncate ${selectedRoomId === room._id ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
// //                            {room.projectId?.projectName || room.name || `Chat ${room._id.slice(-5)}`}
// //                         </button>
// //                     </li>
// //                     ))}
// //                 </ul>
// //              )}
// //            </div>
// //       </div>

// //       {/* Main Chat Area (no structural change needed) */}
// //       <div className="flex-1 flex flex-col bg-gray-100">
// //           {!selectedRoomId ? ( /* Placeholder */ <div className="flex-1 flex items-center justify-center text-gray-500">Select a chat to view messages.</div>)
// //           : (
// //             <>
// //                 {/* Header (no change needed) */}
// //                 <div className="p-4 border-b bg-white shadow-sm flex justify-between items-center sticky top-0 z-10">
// //                     {/* ... header content ... */}
// //                      <h3 className="text-md font-semibold text-gray-800 truncate">
// //                         {chatRooms.find(r => r._id === selectedRoomId)?.projectId?.projectName || chatRooms.find(r => r._id === selectedRoomId)?.name || `Chat`}
// //                     </h3>
// //                     {isRefreshingMessages && !isLoadingMessages && <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" title="Refreshing..."/>}
// //                 </div>

// //                 {/* Messages Display */}
// //                 <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
// //                    {/* ... loading/error/empty states ... */}
// //                     {isLoadingMessages && <div className="text-center p-10"><ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-indigo-600" /></div>}
// //                    {errorMessages && <div className="text-red-700 bg-red-100 p-3 rounded-md my-4 text-sm font-medium text-center">{errorMessages}</div>}
// //                    {!isLoadingMessages && messages.length === 0 && !errorMessages && (
// //                      <p className="text-center text-gray-500 py-10">No messages yet. Be the first!</p>
// //                    )}
// //                    {/* Render messages from state */}
// //                    {!isLoadingMessages && messages.map((msg) => (
// //                        <MessageItem key={msg._id} message={msg} /* other props */ currentUserId={currentUserId} onEdit={handleEditClick} onDelete={handleDeleteClick} isEditing={editingMessageId === msg._id} onSaveEdit={handleSaveEdit} onCancelEdit={handleCancelEdit} editingContent={editingMessageId === msg._id ? editingContent : ''} setEditingContent={setEditingContent}/>
// //                    ))}
// //                    <div ref={messagesEndRef} />
// //                 </div>

// //                 {/* Input Area (no change needed) */}
// //                  <div className="border-t p-4 bg-white mt-auto">
// //                     {/* ... edit indicator ... */}
// //                      {editingMessageId && ( <div className="text-xs text-indigo-600 mb-1 flex justify-between items-center"><span>Editing message...</span><button onClick={handleCancelEdit} className="text-red-500 hover:text-red-700 text-xs font-semibold">Cancel</button></div>)}
// //                    <form onSubmit={editingMessageId ? () => handleSaveEdit(editingMessageId, editingContent) : handleSendMessage} className="flex items-center space-x-3">
// //                       {/* ... textarea ... */}
// //                        <textarea value={editingMessageId ? editingContent : newMessageContent}
// //                                onChange={(e) => editingMessageId ? setEditingContent(e.target.value) : setNewMessageContent(e.target.value)}
// //                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (editingMessageId) handleSaveEdit(editingMessageId, editingContent); else handleSendMessage(e); } else if (e.key === 'Escape' && editingMessageId) { handleCancelEdit(); } }}
// //                                className="flex-1 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none custom-scrollbar"
// //                                rows="1"
// //                                placeholder={isConnected ? (editingMessageId ? "Edit message..." : "Type your message...") : "Connecting..."}
// //                                disabled={!isConnected || isSending}
// //                                style={{ minHeight: '40px', maxHeight: '120px' }} />
// //                       {/* ... submit button ... */}
// //                        <button type="submit"
// //                              className={`p-2 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${editingMessageId ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
// //                              disabled={!isConnected || isSending || (editingMessageId ? !editingContent.trim() : !newMessageContent.trim())}>
// //                        {isSending ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : (editingMessageId ? <CheckIcon className="h-5 w-5"/> : <PaperAirplaneIcon className="h-5 w-5" />)}
// //                      </button>
// //                    </form>
// //                 </div>
// //             </>
// //           )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default ChatPage;

// /*eslint-disable */
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { io } from 'socket.io-client';
// import * as chatAPI from '../../Api/chatService'; // Verify path
// import authAPI from '../../Api/auth';           // Verify path
// import {
//   ArrowPathIcon,
//   PaperAirplaneIcon,
//   PencilIcon,
//   TrashIcon,
//   XMarkIcon,
//   CheckIcon,
//   ClockIcon
// } from '@heroicons/react/20/solid';

// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'; // Use VITE_ prefix

// const getCurrentUserId = () => {
//   const user = authAPI.getCurrentUser();
//   return user?._id;
// };

// const getCurrentUser = () => {
//   return authAPI.getCurrentUser();
// };

// // --- MessageItem Component ---
// const MessageItem = React.memo(({ message, currentUserId, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit, editingContent, setEditingContent }) => {
//   const isOwnMessage = message.sender?._id === currentUserId;
//   const isPending = message.status === 'pending';
//   const senderName = message.sender?.firstName || 'User';
//   // Use client time for pending messages, server time otherwise.
//   const messageTime = new Date(isPending ? message.clientTimestamp : message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   const editedTime = message.editedAt
//     ? new Date(message.editedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//     : null;

//   const handleSave = () => onSaveEdit(message._id, editingContent);
//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSave();
//     } else if (e.key === 'Escape') {
//       onCancelEdit();
//     }
//   };

//   return (
//     <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 group relative ${isPending ? 'opacity-70' : ''}`}>
//       <div className={`py-2 px-3 rounded-lg shadow-sm max-w-xs lg:max-w-md ${isOwnMessage ? 'bg-indigo-100' : 'bg-white'}`}>
//         {!isOwnMessage && <div className="text-xs font-semibold text-indigo-700 mb-1">{senderName}</div>}
//         {isEditing ? (
//           <div className="flex items-center space-x-1">
//             <textarea
//               value={editingContent}
//               onChange={(e) => setEditingContent(e.target.value)}
//               onKeyDown={handleKeyDown}
//               className="text-sm text-gray-800 border border-indigo-300 rounded p-1 w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
//               rows={Math.min(editingContent.split('\n').length, 4)}
//               autoFocus
//             />
//             <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-800">
//               <CheckIcon className="h-4 w-4" />
//             </button>
//             <button onClick={onCancelEdit} className="p-1 text-red-600 hover:text-red-800">
//               <XMarkIcon className="h-4 w-4" />
//             </button>
//           </div>
//         ) : (
//           <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
//         )}
//         <div className="text-xs text-gray-500 mt-1 flex items-center justify-end space-x-2">
//           {isPending && isOwnMessage && <ClockIcon className="h-3 w-3 text-gray-400" title="Sending..." />}
//           {editedTime && <span className="italic text-gray-400 text-[10px]">(edited)</span>}
//           <span>{messageTime}</span>
//           {isOwnMessage && !isEditing && !isPending && (
//             <div className="absolute bottom-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
//               <button onClick={() => onEdit(message._id, message.content)} className="p-0.5 rounded bg-white/50 hover:bg-white text-gray-500 hover:text-indigo-600">
//                 <PencilIcon className="h-3 w-3" />
//               </button>
//               <button onClick={() => onDelete(message._id)} className="p-0.5 rounded bg-white/50 hover:bg-white text-gray-500 hover:text-red-600">
//                 <TrashIcon className="h-3 w-3" />
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// });

// // --- ChatPage Component ---
// const ChatPage = () => {
//   const [chatRooms, setChatRooms] = useState([]);
//   const [selectedRoomId, setSelectedRoomId] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [messagesCache, setMessagesCache] = useState({});
//   const [isLoadingRooms, setIsLoadingRooms] = useState(false);
//   const [isLoadingMessages, setIsLoadingMessages] = useState(false);
//   const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);
//   const [errorRooms, setErrorRooms] = useState(null);
//   const [errorMessages, setErrorMessages] = useState(null);
//   const [newMessageContent, setNewMessageContent] = useState('');
//   const [isSending, setIsSending] = useState(false);
//   const [socket, setSocket] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [editingMessageId, setEditingMessageId] = useState(null);
//   const [editingContent, setEditingContent] = useState('');

//   const messagesEndRef = useRef(null);
//   const currentUserId = getCurrentUserId();
//   const currentUser = getCurrentUser();
//   const currentSelectedRoomIdRef = useRef(selectedRoomId);
//   // --- Ref for temporary pending messages ---
//   const pendingMessagesRef = useRef({}); // { tempId: { content, timestamp } }

//   useEffect(() => {
//     currentSelectedRoomIdRef.current = selectedRoomId;
//   }, [selectedRoomId]);

//   const scrollToBottom = (behavior = 'smooth') => {
//     setTimeout(() => {
//       messagesEndRef.current?.scrollIntoView({ behavior });
//     }, 50);
//   };

//   // --- Fetch Chat Rooms ---
//   useEffect(() => {
//     const fetchRooms = async () => {
//       setIsLoadingRooms(true);
//       setErrorRooms(null);
//       try {
//         const data = await chatAPI.getMyChatRooms();
//         // Make sure each room has an unreadCount (either from API or a default value)
//         const rooms = (data.chatRooms || []).map(room => ({
//           unreadCount: 0, // Default value; update this according to your API or client calculations.
//           ...room
//         }));
//         setChatRooms(rooms);
//       } catch (err) {
//         console.error('Failed to fetch chat rooms:', err);
//         setErrorRooms('Could not load rooms.');
//         setChatRooms([]);
//       } finally {
//         setIsLoadingRooms(false);
//       }
//     };
//     fetchRooms();
//   }, []);

//   // --- Fetch/Refresh Messages for Selected Room ---
//   useEffect(() => {
//     if (!selectedRoomId) return;
//     const fetchAndCacheMessages = async () => {
//       const isInitialLoad = !(messagesCache[selectedRoomId] && messagesCache[selectedRoomId].length > 0);
//       isInitialLoad ? setIsLoadingMessages(true) : setIsRefreshingMessages(true);
//       setErrorMessages(null);
//       try {
//         const data = await chatAPI.getMessagesForRoom(selectedRoomId, { limit: 100 });
//         const fetchedMessages = data?.data?.messages || data?.messages || [];
//         setMessagesCache(prevCache => ({ ...prevCache, [selectedRoomId]: fetchedMessages }));
//         if (currentSelectedRoomIdRef.current === selectedRoomId) {
//           setMessages(fetchedMessages);
//           if (isInitialLoad) scrollToBottom('auto');
//         }
//       } catch (err) {
//         console.error(`Fetch messages error for ${selectedRoomId}:`, err);
//         if (currentSelectedRoomIdRef.current === selectedRoomId) setErrorMessages('Could not load messages.');
//       } finally {
//         if (currentSelectedRoomIdRef.current === selectedRoomId) {
//           if (isInitialLoad) setIsLoadingMessages(false);
//           setIsRefreshingMessages(false);
//         }
//       }
//     };
//     fetchAndCacheMessages();
//   }, [selectedRoomId, messagesCache]);

//   // --- Socket Connection and Listeners ---
//   useEffect(() => {
//     const token = localStorage.getItem('wku_cms_token');
//     if (!token) return;

//     const newSocket = io(SOCKET_URL, { auth: { token } });
//     setSocket(newSocket);

//     newSocket.on('connect', () => {
//       setIsConnected(true);
//       setErrorMessages(null);
//       if (currentSelectedRoomIdRef.current)
//         newSocket.emit('joinRoom', currentSelectedRoomIdRef.current);
//     });
//     newSocket.on('disconnect', () => {
//       setIsConnected(false);
//       setErrorMessages('Disconnected');
//     });
//     newSocket.on('connect_error', () => {
//       setIsConnected(false);
//       setErrorMessages('Connection Failed');
//     });

//     // --- New Message Confirmation ---
//     newSocket.on('newMessage', (confirmedMessage) => {
//       const chatRoomId = confirmedMessage?.chatRoomId;
//       if (!chatRoomId) return;

//       console.log(`SOCKET: Received 'newMessage'`, confirmedMessage);

//       if (confirmedMessage.sender?._id === currentUserId) {
//         // Match own pending message by comparing content.
//         const tempIdToConfirm = Object.keys(pendingMessagesRef.current).find(
//           tempId =>
//             pendingMessagesRef.current[tempId]?.content === confirmedMessage.content
//         );

//         if (tempIdToConfirm) {
//           console.log(`SOCKET: Confirming own message with tempId ${tempIdToConfirm}`);
//           setMessagesCache(prevCache => {
//             const roomCache = prevCache[chatRoomId] || [];
//             return {
//               ...prevCache,
//               [chatRoomId]: roomCache.map(msg =>
//                 msg._id === tempIdToConfirm ? { ...confirmedMessage, status: 'sent' } : msg
//               )
//             };
//           });
//           if (chatRoomId === currentSelectedRoomIdRef.current) {
//             setMessages(prev =>
//               prev.map(msg =>
//                 msg._id === tempIdToConfirm ? { ...confirmedMessage, status: 'sent' } : msg
//               )
//             );
//           }
//           delete pendingMessagesRef.current[tempIdToConfirm];
//         } else {
//           console.warn("SOCKET: Received own message echo, but couldn't find matching pending message.", confirmedMessage);
//           setMessagesCache(prevCache => {
//             const roomCache = prevCache[chatRoomId] || [];
//             if (roomCache.some(m => m._id === confirmedMessage._id)) return prevCache;
//             return { ...prevCache, [chatRoomId]: [...roomCache, confirmedMessage] };
//           });
//           if (chatRoomId === currentSelectedRoomIdRef.current) {
//             setMessages(prev =>
//               prev.some(m => m._id === confirmedMessage._id) ? prev : [...prev, confirmedMessage]
//             );
//           }
//         }
//       } else {
//         console.log("SOCKET: Received message from other user.");
//         setMessagesCache(prevCache => {
//           const roomCache = prevCache[chatRoomId] || [];
//           if (roomCache.some(m => m._id === confirmedMessage._id)) return prevCache;
//           return { ...prevCache, [chatRoomId]: [...roomCache, confirmedMessage] };
//         });
//         if (chatRoomId === currentSelectedRoomIdRef.current) {
//           setMessages(prev =>
//             prev.some(m => m._id === confirmedMessage._id) ? prev : [...prev, confirmedMessage]
//           );
//           scrollToBottom();
//         }
//       }
//     });

//     // --- Message Update Listener ---
//     newSocket.on('messageUpdated', (updatePayload) => {
//       const { chatRoomId, _id: messageId } = updatePayload || {};
//       if (!chatRoomId || !messageId) return;
//       setMessagesCache(prevCache => {
//         const roomCache = prevCache[chatRoomId] || [];
//         return {
//           ...prevCache,
//           [chatRoomId]: roomCache.map(msg =>
//             msg._id === messageId
//               ? { ...msg, content: updatePayload.content, editedAt: updatePayload.editedAt }
//               : msg
//           )
//         };
//       });
//       if (chatRoomId === currentSelectedRoomIdRef.current) {
//         setMessages(prev =>
//           prev.map(msg =>
//             msg._id === messageId
//               ? { ...msg, content: updatePayload.content, editedAt: updatePayload.editedAt }
//               : msg
//           )
//         );
//         if (editingMessageId === messageId) {
//           setEditingMessageId(null);
//           setEditingContent('');
//         }
//       }
//     });

//     // --- Message Delete Listener ---
//     newSocket.on('messageDeleted', (deletePayload) => {
//       const { chatRoomId, messageId } = deletePayload || {};
//       if (!chatRoomId || !messageId) return;
//       setMessagesCache(prevCache => {
//         const roomCache = prevCache[chatRoomId] || [];
//         return { ...prevCache, [chatRoomId]: roomCache.filter(msg => msg._id !== messageId) };
//       });
//       if (chatRoomId === currentSelectedRoomIdRef.current) {
//         setMessages(prev => prev.filter(msg => msg._id !== messageId));
//         if (editingMessageId === messageId) {
//           setEditingMessageId(null);
//           setEditingContent('');
//         }
//       }
//     });

//     newSocket.on('chatError', (errorData) => {
//       console.error('SOCKET: Received chatError:', errorData?.message);
//       if (currentSelectedRoomIdRef.current)
//         setErrorMessages(`Chat Error: ${errorData?.message}`);
//       setIsSending(false);
//     });

//     return () => {
//       newSocket.disconnect();
//       setSocket(null);
//       setIsConnected(false);
//     };
//   }, [SOCKET_URL, currentUserId, editingMessageId]);

//   // --- Room Selection Handler ---
//   const handleSelectRoom = useCallback(
//     (roomId) => {
//       const currentRoom = currentSelectedRoomIdRef.current;
//       if (roomId === currentRoom) return;
//       if (socket && isConnected && currentRoom) socket.emit('leaveRoom', currentRoom);
//       setSelectedRoomId(roomId);
//       currentSelectedRoomIdRef.current = roomId;
//       if (messagesCache[roomId] && messagesCache[roomId].length > 0) {
//         setMessages(messagesCache[roomId]);
//         setIsLoadingMessages(false);
//         scrollToBottom('auto');
//       } else {
//         setMessages([]);
//         setIsLoadingMessages(true);
//       }
//       setErrorMessages(null);
//       setEditingMessageId(null);
//       setEditingContent('');
//       if (socket && isConnected && roomId) socket.emit('joinRoom', roomId);
//     },
//     [socket, isConnected, messagesCache]
//   );

//   // --- Send Message Handler with Optimistic UI ---
//   const handleSendMessage = (e) => {
//     e?.preventDefault();
//     const currentRoomId = currentSelectedRoomIdRef.current;
//     if (!socket || !isConnected || !currentRoomId || !newMessageContent.trim() || editingMessageId) return;

//     setIsSending(true);
//     setErrorMessages(null);

//     // Create a temporary ID and optimistic message
//     const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
//     const clientTimestamp = new Date().toISOString();
//     const optimisticMessage = {
//       _id: tempId, // Temporary ID
//       chatRoomId: currentRoomId,
//       sender: {
//         _id: currentUser._id,
//         firstName: currentUser.firstName,
//       },
//       content: newMessageContent.trim(),
//       createdAt: clientTimestamp,
//       clientTimestamp,
//       status: 'pending'
//     };

//     // Store pending message for confirmation matching
//     pendingMessagesRef.current[tempId] = {
//       content: optimisticMessage.content,
//       timestamp: clientTimestamp
//     };

//     // Update UI immediately (cache and display)
//     setMessagesCache(prevCache => {
//       const roomCache = prevCache[currentRoomId] || [];
//       return { ...prevCache, [currentRoomId]: [...roomCache, optimisticMessage] };
//     });
//     setMessages(prev => [...prev, optimisticMessage]);
//     scrollToBottom();

//     // Emit message via socket
//     const payload = { roomId: currentRoomId, content: newMessageContent.trim() };
//     console.log('SOCKET: Emitting chatMessage:', payload);
//     socket.emit('chatMessage', payload);

//     // Clear input and reset sending state
//     setNewMessageContent('');
//     setIsSending(false);
//   };

//   // --- Edit/Delete Handlers ---
//   const handleEditClick = (messageId, currentContent) => {
//     setEditingMessageId(messageId);
//     setEditingContent(currentContent);
//   };
//   const handleCancelEdit = () => {
//     setEditingMessageId(null);
//     setEditingContent('');
//   };
//   const handleSaveEdit = (messageId, newContent) => {
//     if (!socket || !isConnected || !newContent.trim() || !messageId) return;
//     setErrorMessages(null);
//     const payload = { messageId, newContent: newContent.trim() };
//     socket.emit('editMessage', payload);
//   };
//   const handleDeleteClick = (messageId) => {
//     if (!socket || !isConnected || !messageId) return;
//     setErrorMessages(null);
//     const payload = { messageId };
//     socket.emit('deleteMessage', payload);
//   };

//   // --- Render ---
//   return (
//     <div className="flex flex-col md:flex-row h-[calc(100vh-theme(space.24))] bg-gray-50">
//       {/* Sidebar (Chat Rooms List) */}
//       <div className="w-full md:w-1/4 lg:w-1/5 border-r border-gray-200 bg-white flex flex-col">
//         <div className="p-4 border-b flex justify-between items-center">
//           <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
//           {!isConnected && (
//             <span className="text-xs text-red-500 font-medium animate-pulse">
//               (Offline)
//             </span>
//           )}
//         </div>
//         <div className="flex-1 overflow-y-auto p-4">
//           {isLoadingRooms && (
//             <div className="text-center p-4">
//               <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
//             </div>
//           )}
//           {errorRooms && (
//             <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">
//               {errorRooms}
//             </div>
//           )}
//           {!isLoadingRooms && !errorRooms && (
//             <ul className="space-y-1">
//               {chatRooms.length === 0 && (
//                 <li className="text-gray-500 text-sm px-2 py-1">No chat rooms.</li>
//               )}
//               {chatRooms.map((room) => (
//                 <li key={room._id}>
//                   <button
//                     onClick={() => handleSelectRoom(room._id)}
//                     className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 truncate flex items-center justify-between ${
//                       selectedRoomId === room._id
//                         ? 'bg-indigo-100 text-indigo-800 font-semibold'
//                         : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
//                     }`}
//                   >
//                     <span>
//                       {room.projectId?.projectName || room.name || `Chat ${room._id.slice(-5)}`}
//                     </span>
//                     {/* Unread message indicator */}
//                     {room.unreadCount > 0 && (
//                       <span
//                         className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500"
//                         title={`${room.unreadCount} new message${room.unreadCount > 1 ? 's' : ''}`}
//                       ></span>
//                     )}
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </div>

//       {/* Main Chat Area */}
//       <div className="flex-1 flex flex-col bg-gray-100">
//         {!selectedRoomId ? (
//           <div className="flex-1 flex items-center justify-center text-gray-500">
//             Select a chat to view messages.
//           </div>
//         ) : (
//           <>
//             {/* Chat Header */}
//             <div className="p-4 border-b bg-white shadow-sm flex justify-between items-center sticky top-0 z-10">
//               <h3 className="text-md font-semibold text-gray-800 truncate">
//                 {chatRooms.find(r => r._id === selectedRoomId)?.projectId?.projectName ||
//                   chatRooms.find(r => r._id === selectedRoomId)?.name ||
//                   `Chat`}
//               </h3>
//               {isRefreshingMessages && !isLoadingMessages && (
//                 <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" title="Refreshing..." />
//               )}
//             </div>

//             {/* Messages Display */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
//               {isLoadingMessages && (
//                 <div className="text-center p-10">
//                   <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
//                 </div>
//               )}
//               {errorMessages && (
//                 <div className="text-red-700 bg-red-100 p-3 rounded-md my-4 text-sm font-medium text-center">
//                   {errorMessages}
//                 </div>
//               )}
//               {!isLoadingMessages && messages.length === 0 && !errorMessages && (
//                 <p className="text-center text-gray-500 py-10">
//                   No messages yet. Be the first!
//                 </p>
//               )}
//               {messages.map((msg) => (
//                 <MessageItem
//                   key={msg._id}
//                   message={msg}
//                   currentUserId={currentUserId}
//                   onEdit={handleEditClick}
//                   onDelete={handleDeleteClick}
//                   isEditing={editingMessageId === msg._id}
//                   onSaveEdit={handleSaveEdit}
//                   onCancelEdit={handleCancelEdit}
//                   editingContent={editingMessageId === msg._id ? editingContent : ''}
//                   setEditingContent={setEditingContent}
//                 />
//               ))}
//               <div ref={messagesEndRef} />
//             </div>

//             {/* Input Area */}
//             <div className="border-t p-4 bg-white mt-auto">
//               {editingMessageId && (
//                 <div className="text-xs text-indigo-600 mb-1 flex justify-between items-center">
//                   <span>Editing message...</span>
//                   <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-700 text-xs font-semibold">
//                     Cancel
//                   </button>
//                 </div>
//               )}
//               <form
//                 onSubmit={
//                   editingMessageId
//                     ? () => handleSaveEdit(editingMessageId, editingContent)
//                     : handleSendMessage
//                 }
//                 className="flex items-center space-x-3"
//               >
//                 <textarea
//                   value={editingMessageId ? editingContent : newMessageContent}
//                   onChange={(e) =>
//                     editingMessageId
//                       ? setEditingContent(e.target.value)
//                       : setNewMessageContent(e.target.value)
//                   }
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter' && !e.shiftKey) {
//                       e.preventDefault();
//                       if (editingMessageId)
//                         handleSaveEdit(editingMessageId, editingContent);
//                       else
//                         handleSendMessage(e);
//                     } else if (e.key === 'Escape' && editingMessageId) {
//                       handleCancelEdit();
//                     }
//                   }}
//                   className="flex-1 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none custom-scrollbar"
//                   rows="1"
//                   placeholder={isConnected ? (editingMessageId ? 'Edit message...' : 'Type your message...') : 'Connecting...'}
//                   disabled={!isConnected || isSending}
//                   style={{ minHeight: '40px', maxHeight: '120px' }}
//                 />
//                 <button
//                   type="submit"
//                   className={`p-2 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
//                     editingMessageId ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
//                   }`}
//                   disabled={
//                     !isConnected ||
//                     isSending ||
//                     (editingMessageId ? !editingContent.trim() : !newMessageContent.trim())
//                   }
//                 >
//                   {isSending ? (
//                     <ArrowPathIcon className="h-5 w-5 animate-spin" />
//                   ) : editingMessageId ? (
//                     <CheckIcon className="h-5 w-5" />
//                   ) : (
//                     <PaperAirplaneIcon className="h-5 w-5" />
//                   )}
//                 </button>
//               </form>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChatPage;
/*eslint-disable */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import * as chatAPI from '../../Api/chatService'; // Verify path
import authAPI from '../../Api/auth';           // Verify path
import {
  ArrowPathIcon,
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  ChatBubbleLeftEllipsisIcon, // Example icon for chats
} from '@heroicons/react/20/solid';
import { format, isToday, isYesterday, parseISO } from 'date-fns'; // Using date-fns for easier date manipulation

// --- Helper Functions ---

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const getCurrentUserId = () => {
  const user = authAPI.getCurrentUser();
  return user?._id;
};

const getCurrentUser = () => {
  return authAPI.getCurrentUser();
};

// Helper to check if two date strings represent the same day
const isSameDay = (dateStr1, dateStr2) => {
  if (!dateStr1 || !dateStr2) return false;
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Helper to format the date separator
const formatDateSeparator = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMMM d, yyyy'); // e.g., April 12, 2025
};

// --- MessageItem Component ---
// (Mostly styling changes, added date display logic is handled in ChatPage)
const MessageItem = React.memo(({ message, currentUserId, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit, editingContent, setEditingContent }) => {
  const isOwnMessage = message.sender?._id === currentUserId;
  const isPending = message.status === 'pending';
  const senderName = message.sender?.firstName || 'User';
  const messageTime = new Date(isPending ? message.clientTimestamp : message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const editedTime = message.editedAt
    ? new Date(message.editedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const handleSave = () => onSaveEdit(message._id, editingContent);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  // Calculate rows needed for textarea based on content, capped at a reasonable max
  const calculateRows = (text) => Math.min(Math.max(1, text.split('\n').length), 5);

  return (
    <div className={`flex items-end ${isOwnMessage ? 'justify-end' : 'justify-start'} group relative ${isPending ? 'opacity-60' : ''}`}>
       {/* Placeholder for Avatar - uncomment and replace src if you have avatars */}
       {/* {!isOwnMessage && <img src="avatar_url" alt="Avatar" className="h-6 w-6 rounded-full mr-2 mb-1" />} */}
      <div
        className={`relative py-2 px-3 rounded-lg shadow-md max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl break-words ${
          isOwnMessage
            ? 'bg-indigo-500 text-white rounded-br-none' // Own message style
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none' // Other's message style
        }`}
      >
        {/* Sender Name (for group chats or if needed) */}
        {!isOwnMessage && message.sender && (
          <div className="text-xs font-semibold text-indigo-600 mb-1">{senderName}</div>
        )}

        {/* Message Content or Editing View */}
        {isEditing ? (
          <div className="flex items-end space-x-1">
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm text-gray-800 bg-white border border-indigo-300 rounded p-1 w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none overflow-y-auto custom-scrollbar"
              rows={calculateRows(editingContent)} // Dynamic rows
              autoFocus
              style={{ minHeight: '40px', maxHeight: '150px' }} // Min/Max height constraints
            />
            <div className="flex flex-col space-y-1">
               <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-800 focus:outline-none" title="Save Edit">
                 <CheckIcon className="h-4 w-4" />
               </button>
               <button onClick={onCancelEdit} className="p-1 text-red-600 hover:text-red-800 focus:outline-none" title="Cancel Edit">
                 <XMarkIcon className="h-4 w-4" />
               </button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        )}

        {/* Timestamp and Edit/Delete Controls */}
        <div className={`text-xs mt-1 flex items-center space-x-1 ${isOwnMessage ? 'justify-end text-indigo-100' : 'justify-end text-gray-400'}`}>
           {isPending && isOwnMessage && <ClockIcon className="h-3 w-3 text-indigo-200" title="Sending..." />}
           {editedTime && <span className="italic text-[10px]">(edited)</span>}
           <span>{messageTime}</span>
        </div>

        {/* Edit/Delete Buttons for Own Messages (Appear on Hover) */}
        {isOwnMessage && !isEditing && !isPending && (
          <div className={`absolute -left-8 bottom-0 flex space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
            <button
              onClick={() => onEdit(message._id, message.content)}
              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              title="Edit"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(message._id)}
              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-red-600 focus:outline-none focus:ring-1 focus:ring-red-500"
              title="Delete"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
       {/* Placeholder for Avatar - uncomment and replace src if you have avatars */}
       {/* {isOwnMessage && <img src="my_avatar_url" alt="My Avatar" className="h-6 w-6 rounded-full ml-2 mb-1" />} */}
    </div>
  );
});
MessageItem.displayName = 'MessageItem'; // Add display name for React DevTools

// --- ChatPage Component ---
const ChatPage = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]); // Messages for the currently selected room
  const [messagesCache, setMessagesCache] = useState({}); // Cache messages per room: { roomId: [messages] }
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isRefreshingMessages, setIsRefreshingMessages] = useState(false); // For background refresh indication
  const [errorRooms, setErrorRooms] = useState(null);
  const [errorMessages, setErrorMessages] = useState(null);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  const messagesEndRef = useRef(null);
  const currentUserId = getCurrentUserId();
  const currentUser = getCurrentUser();
  const currentSelectedRoomIdRef = useRef(selectedRoomId); // Ref to track current room inside listeners
  const pendingMessagesRef = useRef({}); // { tempId: { content, timestamp } }

  // Keep the ref updated
  useEffect(() => {
    currentSelectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  // Scroll to bottom helper
  const scrollToBottom = (behavior = 'smooth') => {
    // Use timeout to ensure DOM has updated
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 100); // Increased timeout slightly
  };

  // --- Fetch Chat Rooms ---
  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoadingRooms(true);
      setErrorRooms(null);
      try {
        const data = await chatAPI.getMyChatRooms();
        // Initialize unreadCount for each room (ideally this comes from API)
        const rooms = (data.chatRooms || []).map(room => ({
          ...room,
          unreadCount: room.unreadCount || 0, // Use API value or default to 0
        }));
        setChatRooms(rooms);
      } catch (err) {
        console.error('Failed to fetch chat rooms:', err);
        setErrorRooms('Could not load your chats.');
        setChatRooms([]);
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  // --- Fetch/Refresh Messages for Selected Room ---
  const fetchAndCacheMessages = useCallback(async (roomId, isInitialLoad = true) => {
     if (!roomId) return;

     isInitialLoad ? setIsLoadingMessages(true) : setIsRefreshingMessages(true);
     setErrorMessages(null);

     try {
       const data = await chatAPI.getMessagesForRoom(roomId, { limit: 100 }); // Adjust limit as needed
       const fetchedMessages = data?.data?.messages || data?.messages || [];
       const sortedMessages = fetchedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

       setMessagesCache(prevCache => ({ ...prevCache, [roomId]: sortedMessages }));

       // Only update displayed messages if the currently selected room is the one we fetched for
       if (currentSelectedRoomIdRef.current === roomId) {
         setMessages(sortedMessages);
         if (isInitialLoad) {
            scrollToBottom('auto'); // Instant scroll on initial load
         }
       }
     } catch (err) {
       console.error(`Workspace messages error for ${roomId}:`, err);
       if (currentSelectedRoomIdRef.current === roomId) {
          setErrorMessages('Could not load messages.');
       }
     } finally {
       if (currentSelectedRoomIdRef.current === roomId) {
         if (isInitialLoad) setIsLoadingMessages(false);
         setIsRefreshingMessages(false);
       }
     }
   }, []); // Removed messagesCache dependency to prevent loops, rely on direct calls

   // Effect to fetch messages when room changes or on initial load
   useEffect(() => {
     if (selectedRoomId) {
       const isCached = messagesCache[selectedRoomId] && messagesCache[selectedRoomId].length > 0;
       if (isCached) {
         // Load from cache immediately
         setMessages(messagesCache[selectedRoomId]);
         setIsLoadingMessages(false);
         scrollToBottom('auto');
         // Optionally, trigger a background refresh
         // fetchAndCacheMessages(selectedRoomId, false);
       } else {
         // Fetch initially
         fetchAndCacheMessages(selectedRoomId, true);
       }
     } else {
       setMessages([]); // Clear messages if no room selected
     }
   }, [selectedRoomId, fetchAndCacheMessages]); // Trigger only when selectedRoomId changes


  // --- Socket Connection and Listeners ---
  useEffect(() => {
    const token = localStorage.getItem('wku_cms_token'); // Ensure your token key is correct
    if (!token || !currentUserId) return;

    console.log('Attempting to connect to socket...');
    const newSocket = io(SOCKET_URL, {
       auth: { token },
       reconnectionAttempts: 5, // Try to reconnect
       reconnectionDelay: 3000, // Wait 3 seconds between attempts
     });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('SOCKET: Connected', newSocket.id);
      setIsConnected(true);
      setErrorMessages(null); // Clear connection errors
      // Re-join the currently selected room if any
      if (currentSelectedRoomIdRef.current) {
         console.log(`SOCKET: Emitting joinRoom for ${currentSelectedRoomIdRef.current}`);
         newSocket.emit('joinRoom', currentSelectedRoomIdRef.current);
         // Optionally trigger a message refresh on reconnect
         // fetchAndCacheMessages(currentSelectedRoomIdRef.current, false);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('SOCKET: Disconnected', reason);
      setIsConnected(false);
      // Only show error if not intentional disconnect
      if (reason !== 'io client disconnect') {
         setErrorMessages('Connection lost. Reconnecting...');
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('SOCKET: Connection Error:', err.message);
      setIsConnected(false);
      setErrorMessages('Cannot connect to chat server.');
       // Handle specific auth errors if needed
       // if (err.message === 'Authentication error') { ... }
    });

    // --- New Message Listener ---
    newSocket.on('newMessage', (confirmedMessage) => {
        const chatRoomId = confirmedMessage?.chatRoomId;
        if (!chatRoomId) {
            console.warn("SOCKET: Received newMessage without chatRoomId", confirmedMessage);
            return;
        }

        console.log(`SOCKET: Received 'newMessage' for room ${chatRoomId}`, confirmedMessage);

        let messageAddedToDisplay = false;

        // Update Cache
        setMessagesCache(prevCache => {
            const roomCache = prevCache[chatRoomId] || [];
            // Avoid duplicates in cache
            if (roomCache.some(m => m._id === confirmedMessage._id)) {
                return prevCache; // Already exists
            }
            const newCache = [...roomCache, confirmedMessage].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            return { ...prevCache, [chatRoomId]: newCache };
        });


        if (confirmedMessage.sender?._id === currentUserId) {
            // Own message confirmation: Replace pending message
            const tempIdToConfirm = Object.keys(pendingMessagesRef.current).find(
                tempId => pendingMessagesRef.current[tempId]?.content === confirmedMessage.content &&
                         pendingMessagesRef.current[tempId]?.roomId === chatRoomId // Ensure it's for the right room
            );

            if (tempIdToConfirm) {
                console.log(`SOCKET: Confirming own message with tempId ${tempIdToConfirm}`);
                // Update messages state only if it's the current room
                if (chatRoomId === currentSelectedRoomIdRef.current) {
                    setMessages(prev =>
                        prev.map(msg =>
                            msg._id === tempIdToConfirm ? { ...confirmedMessage, status: 'sent' } : msg
                        ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // Ensure order after update
                    );
                    messageAddedToDisplay = true;
                }
                 // Clean up pending ref
                delete pendingMessagesRef.current[tempIdToConfirm];

            } else {
                 // Own message arrived but no matching pending found (e.g., sent from another tab)
                 console.warn("SOCKET: Received own message echo, but couldn't find matching pending message.", confirmedMessage);
                 if (chatRoomId === currentSelectedRoomIdRef.current) {
                      setMessages(prev => {
                           if (prev.some(m => m._id === confirmedMessage._id)) return prev; // Avoid duplicates
                           return [...prev, confirmedMessage].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                      });
                    messageAddedToDisplay = true;
                 }
            }
        } else {
            // Message from another user
            console.log("SOCKET: Received message from other user.");
            if (chatRoomId === currentSelectedRoomIdRef.current) {
                // Add to current room's messages if not already present
                 setMessages(prev => {
                     if (prev.some(m => m._id === confirmedMessage._id)) return prev; // Avoid duplicates
                     return [...prev, confirmedMessage].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                 });
                messageAddedToDisplay = true;
                scrollToBottom(); // Scroll only for incoming messages in the current room
            } else {
                // Message for a different room: Increment unread count
                console.log(`SOCKET: Incrementing unread count for room ${chatRoomId}`);
                setChatRooms(prevRooms =>
                    prevRooms.map(room =>
                        room._id === chatRoomId
                            ? { ...room, unreadCount: (room.unreadCount || 0) + 1 }
                            : room
                    )
                );
            }
        }

         // Clear sending state if the confirmed message matches the last pending one?
         // This part is tricky if multiple messages are sent quickly.
         // Relying on isSending state reset in handleSendMessage is generally safer.
    });

    // --- Message Update Listener ---
    newSocket.on('messageUpdated', (updatePayload) => {
      const { chatRoomId, _id: messageId } = updatePayload || {};
      if (!chatRoomId || !messageId) return;
      console.log(`SOCKET: Received 'messageUpdated' for ${messageId} in room ${chatRoomId}`);

      const updateFn = (msg) =>
        msg._id === messageId
          ? { ...msg, content: updatePayload.content, editedAt: updatePayload.editedAt }
          : msg;

      setMessagesCache(prevCache => ({
        ...prevCache,
        [chatRoomId]: (prevCache[chatRoomId] || []).map(updateFn)
      }));

      if (chatRoomId === currentSelectedRoomIdRef.current) {
        setMessages(prev => prev.map(updateFn));
        // If the message being edited was the one updated, exit edit mode
        if (editingMessageId === messageId) {
          setEditingMessageId(null);
          setEditingContent('');
        }
      }
    });

    // --- Message Delete Listener ---
    newSocket.on('messageDeleted', (deletePayload) => {
      const { chatRoomId, messageId } = deletePayload || {};
      if (!chatRoomId || !messageId) return;
      console.log(`SOCKET: Received 'messageDeleted' for ${messageId} in room ${chatRoomId}`);

      const filterFn = msg => msg._id !== messageId;

      setMessagesCache(prevCache => ({
        ...prevCache,
        [chatRoomId]: (prevCache[chatRoomId] || []).filter(filterFn)
      }));

      if (chatRoomId === currentSelectedRoomIdRef.current) {
        setMessages(prev => prev.filter(filterFn));
         // If the message being edited was deleted, exit edit mode
         if (editingMessageId === messageId) {
            setEditingMessageId(null);
            setEditingContent('');
         }
      }
    });

    // --- Chat Error Listener ---
    newSocket.on('chatError', (errorData) => {
      console.error('SOCKET: Received chatError:', errorData);
      // Display error related to the current room or globally
       if (errorData?.roomId && errorData.roomId === currentSelectedRoomIdRef.current) {
           setErrorMessages(`Chat Error: ${errorData?.message || 'Unknown error'}`);
       } else if (!errorData?.roomId) {
           // General error not specific to a room action
           setErrorMessages(`Chat Error: ${errorData?.message || 'Unknown error'}`);
       }
       // Potentially revert optimistic UI or clear sending state based on error type
       setIsSending(false);
       // If error indicates a specific message failed, remove the pending message
       // const failedTempId = findTempIdRelatedToError(errorData);
       // if (failedTempId) { ... remove from UI ... }
    });

    // Cleanup on component unmount
    return () => {
      console.log('SOCKET: Disconnecting...');
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
    // Rerun effect if user changes (e.g., logout/login)
  }, [SOCKET_URL, currentUserId]); // Removed fetchAndCacheMessages, editingMessageId from deps

  // --- Room Selection Handler ---
  const handleSelectRoom = useCallback((roomId) => {
    const currentRoom = currentSelectedRoomIdRef.current;
    if (roomId === currentRoom) return; // Already selected

    console.log(`Selecting room: ${roomId}`);

    // Leave previous room on socket
    if (socket && isConnected && currentRoom) {
       console.log(`SOCKET: Emitting leaveRoom for ${currentRoom}`);
       socket.emit('leaveRoom', currentRoom);
     }

    setSelectedRoomId(roomId);
    currentSelectedRoomIdRef.current = roomId; // Update ref immediately

    // Reset error/editing state for the new room
    setErrorMessages(null);
    setEditingMessageId(null);
    setEditingContent('');
    setNewMessageContent(''); // Clear input field when switching rooms

    // Load messages from cache or trigger fetch (handled by useEffect [selectedRoomId])

    // Join new room on socket
    if (socket && isConnected && roomId) {
       console.log(`SOCKET: Emitting joinRoom for ${roomId}`);
       socket.emit('joinRoom', roomId);
    }

    // Reset unread count for the selected room
    setChatRooms(prevRooms =>
      prevRooms.map(room =>
        room._id === roomId ? { ...room, unreadCount: 0 } : room
      )
    );
    // Optional: Emit 'markAsRead' to backend
    // if (socket && isConnected) socket.emit('markRoomAsRead', { roomId });

  }, [socket, isConnected]); // Dependencies: socket and connection status


  // --- Send Message Handler with Optimistic UI ---
  const handleSendMessage = (e) => {
    e?.preventDefault(); // Prevent default form submission if called from form
    const contentToSent = newMessageContent.trim();
    const currentRoomId = currentSelectedRoomIdRef.current;

    if (!socket || !isConnected || !currentRoomId || !contentToSent || editingMessageId || isSending) {
         console.warn("Send message prevented:", { isConnected, currentRoomId, contentToSent, editingMessageId, isSending });
         return;
    }

    setIsSending(true);
    setErrorMessages(null);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const clientTimestamp = new Date().toISOString();
    const optimisticMessage = {
      _id: tempId,
      chatRoomId: currentRoomId,
      sender: { // Use basic current user info
        _id: currentUser?._id,
        firstName: currentUser?.firstName || 'You',
      },
      content: contentToSent,
      createdAt: clientTimestamp, // Use client time initially
      clientTimestamp, // Store original client timestamp
      status: 'pending', // Custom status for UI indication
    };

    // Store pending message details for matching confirmation
    pendingMessagesRef.current[tempId] = {
        content: optimisticMessage.content,
        timestamp: clientTimestamp,
        roomId: currentRoomId // Store room ID for better matching
    };


    // --- Optimistic UI Update ---
    // 1. Update Cache
     setMessagesCache(prevCache => {
       const roomCache = prevCache[currentRoomId] || [];
       return { ...prevCache, [currentRoomId]: [...roomCache, optimisticMessage] };
     });
    // 2. Update displayed messages
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom(); // Scroll after adding the optimistic message

    // --- Emit Message via Socket ---
    const payload = { roomId: currentRoomId, content: contentToSent };
    console.log('SOCKET: Emitting chatMessage:', payload);
    socket.emit('chatMessage', payload, (ack) => {
        // Optional: Handle acknowledgment from server if implemented
        if (ack?.error) {
            console.error("SOCKET: Message send failed (ack):", ack.error);
            setErrorMessages(`Failed to send: ${ack.error}`);
            // Revert optimistic UI
             setMessages(prev => prev.filter(msg => msg._id !== tempId));
             setMessagesCache(prevCache => ({
               ...prevCache,
               [currentRoomId]: (prevCache[currentRoomId] || []).filter(msg => msg._id !== tempId)
             }));
             delete pendingMessagesRef.current[tempId];
            setIsSending(false);
        } else {
            console.log("SOCKET: Message sent successfully (ack received - if server sends one).");
            // Note: We usually wait for the 'newMessage' event to confirm and replace the temp message.
            // The isSending state might be reset too early here if ack is fast but broadcast is slow.
            // It's often better to reset isSending *after* the 'newMessage' confirmation for this message.
            // However, for simplicity and immediate feedback, we reset it here or after emit.
        }
    });

    // Clear input and reset sending state *immediately* for responsiveness
    setNewMessageContent('');
    setIsSending(false); // Reset sending state after emitting

    // --- Timeout for Pending state (Optional Fallback) ---
    // If no confirmation received after X seconds, mark as failed or offer retry
    setTimeout(() => {
        if (pendingMessagesRef.current[tempId]) {
            console.warn(`Message ${tempId} still pending after timeout.`);
            // Optionally update UI to show failed state
             setMessages(prev => prev.map(msg =>
                msg._id === tempId ? { ...msg, status: 'failed' } : msg
            ));
             setErrorMessages("Message sending timed out.");
             // Maybe remove it or offer retry
             // delete pendingMessagesRef.current[tempId];
        }
    }, 15000); // 15 second timeout
  };


  // --- Edit/Delete Handlers ---
  const handleEditClick = (messageId, currentContent) => {
    setEditingMessageId(messageId);
    setEditingContent(currentContent);
    setNewMessageContent(''); // Clear the main input when starting edit
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSaveEdit = (messageId, newContent) => {
    const contentToSave = newContent.trim();
    if (!socket || !isConnected || !contentToSave || !messageId) return;

    // Optional: Optimistic UI for edit (update immediately)
    const originalContent = messages.find(m => m._id === messageId)?.content; // Store original in case of failure
    setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, content: contentToSave, status: 'editing' } : msg // Add a temporary editing status
    ));
     setMessagesCache(prevCache => {
        const roomId = messages.find(m => m._id === messageId)?.chatRoomId;
        if (!roomId) return prevCache;
        return {
            ...prevCache,
            [roomId]: (prevCache[roomId] || []).map(msg =>
                msg._id === messageId ? { ...msg, content: contentToSave, status: 'editing' } : msg
            )
        };
     });

    setEditingMessageId(null); // Exit editing mode visually
    setEditingContent('');
    setErrorMessages(null);

    const payload = { messageId, newContent: contentToSave };
    console.log("SOCKET: Emitting editMessage", payload);
    socket.emit('editMessage', payload, (ack) => {
        // Optional Ack handling
        if (ack?.error) {
            console.error("SOCKET: Edit failed (ack):", ack.error);
            setErrorMessages(`Edit failed: ${ack.error}`);
            // Revert optimistic UI
             setMessages(prev => prev.map(msg =>
                msg._id === messageId ? { ...msg, content: originalContent, status: undefined } : msg // Revert content, remove status
             ));
            setMessagesCache(prevCache => {
                const roomId = messages.find(m => m._id === messageId)?.chatRoomId;
                 if (!roomId) return prevCache;
                 return {
                   ...prevCache,
                   [roomId]: (prevCache[roomId] || []).map(msg =>
                       msg._id === messageId ? { ...msg, content: originalContent, status: undefined } : msg
                   )
                 };
             });
        } else {
            console.log("SOCKET: Edit successful (ack). Waiting for 'messageUpdated' broadcast.");
            // Confirmation comes via 'messageUpdated' event
             setMessages(prev => prev.map(msg =>
                msg._id === messageId ? { ...msg, status: undefined } : msg // remove editing status
             ));
             setMessagesCache(prevCache => {
                 const roomId = messages.find(m => m._id === messageId)?.chatRoomId;
                  if (!roomId) return prevCache;
                  return {
                    ...prevCache,
                    [roomId]: (prevCache[roomId] || []).map(msg =>
                        msg._id === messageId ? { ...msg, status: undefined } : msg
                    )
                  };
              });
        }
    });
  };


  const handleDeleteClick = (messageId) => {
    if (!socket || !isConnected || !messageId) return;

     // Find the room ID before potentially deleting the message from state
     const messageToDelete = messages.find(msg => msg._id === messageId);
     const chatRoomId = messageToDelete?.chatRoomId;
     if (!chatRoomId) {
         console.error("Cannot delete message: Room ID not found.");
         return;
     }

    // Optional: Optimistic UI for delete
    const originalMessages = [...messages]; // Store for potential revert
     const originalCacheRoom = [...(messagesCache[chatRoomId] || [])];

     setMessages(prev => prev.filter(msg => msg._id !== messageId));
     setMessagesCache(prevCache => ({
       ...prevCache,
       [chatRoomId]: (prevCache[chatRoomId] || []).filter(msg => msg._id !== messageId)
     }));

    setErrorMessages(null);
    const payload = { messageId };
    console.log("SOCKET: Emitting deleteMessage", payload);
    socket.emit('deleteMessage', payload, (ack) => {
        // Optional Ack handling
        if (ack?.error) {
            console.error("SOCKET: Delete failed (ack):", ack.error);
            setErrorMessages(`Delete failed: ${ack.error}`);
            // Revert optimistic UI
            setMessages(originalMessages);
            setMessagesCache(prevCache => ({
               ...prevCache,
               [chatRoomId]: originalCacheRoom
            }));
        } else {
            console.log("SOCKET: Delete successful (ack). Waiting for 'messageDeleted' broadcast.");
            // Confirmation comes via 'messageDeleted' event
        }
    });
  };

  // --- Dynamic Textarea Row Calculation ---
  const calculateInputRows = (text) => Math.min(Math.max(1, text.split('\n').length), 4); // Cap at 4 rows


  // --- Render ---
  return (
    // Adjust overall height calculation if you have headers/footers outside this component
    <div className="flex h-[calc(100vh-var(--header-height,6rem))] bg-gray-100"> {/* Use CSS variable for header height */}

      {/* Sidebar (Chat Rooms List) */}
      <div className="w-full md:w-72 lg:w-80 border-r border-gray-200 bg-white flex flex-col shadow-sm">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
             <ChatBubbleLeftEllipsisIcon className="h-6 w-6 mr-2 text-indigo-600" />
             Chats
          </h2>
          {/* Connection Status Indicator */}
          <span
             className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'
             }`}
             title={isConnected ? 'Connected' : 'Offline'}
          >
            {isConnected ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar"> {/* Added padding */}
          {isLoadingRooms && (
            <div className="text-center p-4">
              <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
              <p className="text-sm text-gray-500 mt-1">Loading chats...</p>
            </div>
          )}
          {errorRooms && (
            <div className="m-2 text-red-700 bg-red-100 p-3 rounded-md text-sm">
              <p className="font-medium">Error:</p>
              {errorRooms}
            </div>
          )}
          {!isLoadingRooms && !errorRooms && (
            <ul className="space-y-1">
              {chatRooms.length === 0 && (
                <li className="text-gray-500 text-sm text-center p-4">No active chats found.</li>
              )}
              {chatRooms.map((room) => (
                <li key={room._id}>
                  <button
                    onClick={() => handleSelectRoom(room._id)}
                    className={`w-full text-left px-3 py-2.5 rounded-md transition-colors duration-150 flex items-center justify-between group ${
                      selectedRoomId === room._id
                        ? 'bg-indigo-100' // Selected style
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900' // Default/Hover
                    }`}
                  >
                    {/* Room Name */}
                    <span className={`flex-1 truncate text-sm ${selectedRoomId === room._id ? 'font-semibold text-indigo-800' : 'font-medium'}`}>
                       {room.projectId?.projectName || room.name || `Chat ${room._id.slice(-5)}`}
                    </span>

                    {/* Unread Message Indicator */}
                    {room.unreadCount > 0 && (
                      <span
                        className="ml-2 flex-shrink-0 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold"
                        title={`${room.unreadCount} new message${room.unreadCount > 1 ? 's' : ''}`}
                      >
                        {room.unreadCount > 9 ? '9+' : room.unreadCount} {/* Show count or 9+ */}
                      </span>
                    )}
                     {/* Subtle indicator for selected even without unread */}
                     {selectedRoomId === room._id && room.unreadCount === 0 && (
                        <span className="ml-2 h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0"></span>
                     )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
        {!selectedRoomId ? (
          // Placeholder when no chat is selected
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 p-8">
            <ChatBubbleLeftEllipsisIcon className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Select a chat</h3>
            <p className="text-sm">Choose a conversation from the left panel to start chatting.</p>
          </div>
        ) : (
          // Chat view when a room is selected
          <>
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b border-gray-200 bg-white shadow-sm flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 truncate">
                {/* Find room details more safely */}
                {chatRooms.find(r => r._id === selectedRoomId)?.projectId?.projectName ||
                 chatRooms.find(r => r._id === selectedRoomId)?.name ||
                 'Chat'}
              </h3>
              {/* Refreshing Indicator */}
              {isRefreshingMessages && !isLoadingMessages && (
                <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" title="Refreshing..." />
              )}
               {/* Add other header elements here (e.g., participants, search) */}
            </div>

            {/* Messages Display Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar"> {/* Reduced space-y slightly */}
              {isLoadingMessages && (
                <div className="text-center p-10">
                  <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                  <p className="text-sm text-gray-500 mt-2">Loading messages...</p>
                </div>
              )}
               {/* Display Errors within the message flow */}
               {errorMessages && !isLoadingMessages && (
                 <div className="sticky top-2 z-20 mx-auto max-w-md">
                     <div className="text-red-800 bg-red-100 p-3 rounded-lg shadow-md my-2 text-sm font-medium text-center ">
                         {errorMessages}
                          {/* Optionally add a dismiss button */}
                          <button onClick={() => setErrorMessages(null)} className="ml-2 text-red-500 font-bold">&times;</button>
                     </div>
                 </div>
               )}

              {/* Render Messages with Date Separators */}
              {!isLoadingMessages && messages.length === 0 && !errorMessages && (
                <p className="text-center text-gray-500 py-10 text-sm">
                  No messages in this chat yet. <br/> Start the conversation!
                </p>
              )}
              {!isLoadingMessages && messages.length > 0 && (
                (() => {
                  const messageElements = [];
                  let lastMessageDateStr = null;

                  messages.forEach((msg, index) => {
                    const currentMessageDateStr = msg.createdAt || msg.clientTimestamp; // Use createdAt or clientTimestamp
                     // Ensure we have a valid date string before comparing
                     if (currentMessageDateStr && !isSameDay(lastMessageDateStr, currentMessageDateStr)) {
                      // Add date separator
                      messageElements.push(
                        <div key={`date-${currentMessageDateStr}`} className="text-center my-4">
                          <span className="text-xs font-medium text-gray-500 bg-gray-200 rounded-full px-3 py-1">
                            {formatDateSeparator(currentMessageDateStr)}
                          </span>
                        </div>
                      );
                      lastMessageDateStr = currentMessageDateStr;
                    }

                    // Add the message item
                    messageElements.push(
                      <MessageItem
                        key={msg._id || `pending-${index}`} // Use _id or a temporary key for pending
                        message={msg}
                        currentUserId={currentUserId}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        isEditing={editingMessageId === msg._id}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        // Pass only the relevant content for editing
                        editingContent={editingMessageId === msg._id ? editingContent : ''}
                        setEditingContent={setEditingContent} // Pass setter for the controlled component
                      />
                    );
                  });
                  return messageElements;
                })() // Immediately invoke the function to render elements
              )}
              {/* Scroll anchor */}
              <div ref={messagesEndRef} style={{ height: '1px' }} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-3 md:p-4 bg-white mt-auto shadow-inner">
               {/* Editing Indicator */}
                {editingMessageId && (
                  <div className="text-xs text-indigo-600 mb-1.5 flex justify-between items-center px-1">
                    <span className="font-medium">Editing message...</span>
                    <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-700 text-xs font-semibold focus:outline-none">
                      Cancel
                    </button>
                  </div>
                )}
               {/* Input Form */}
              <form
                 onSubmit={(e) => {
                    e.preventDefault(); // Always prevent default form submission
                    if (editingMessageId) {
                      handleSaveEdit(editingMessageId, editingContent);
                    } else {
                      handleSendMessage(); // Call the handler directly
                    }
                 }}
                className="flex items-end space-x-2" // Use items-end for better alignment with multi-line textareas
              >
                <textarea
                  value={editingMessageId ? editingContent : newMessageContent}
                  onChange={(e) =>
                    editingMessageId
                      ? setEditingContent(e.target.value)
                      : setNewMessageContent(e.target.value)
                  }
                  onKeyDown={(e) => {
                    // Submit on Enter (not Shift+Enter)
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault(); // Prevent newline
                       if (editingMessageId) {
                           if (editingContent.trim()) handleSaveEdit(editingMessageId, editingContent);
                       } else {
                           if (newMessageContent.trim()) handleSendMessage(); // Call directly
                       }
                    } else if (e.key === 'Escape') {
                       // Cancel edit on Escape
                       if (editingMessageId) {
                           handleCancelEdit();
                       } else {
                           // Optionally clear input on escape when not editing
                           // setNewMessageContent('');
                       }
                    }
                  }}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none custom-scrollbar overflow-y-auto" // Added overflow-y-auto
                  rows={calculateInputRows(editingMessageId ? editingContent : newMessageContent)} // Dynamic rows
                  placeholder={
                     !isConnected ? 'Connecting...' :
                     editingMessageId ? 'Edit your message...' :
                     'Type your message...'
                  }
                  disabled={!isConnected || isSending || (!selectedRoomId)} // Disable if not connected, sending, or no room selected
                  style={{ minHeight: '40px', maxHeight: '120px' }} // Fixed min/max height
                   // autoFocus // Consider if autofocus is desired on room select/load
                />
                <button
                  type="submit"
                  className={`p-2 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 flex-shrink-0 ${
                     editingMessageId
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' // Save button style
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' // Send button style
                    } ${
                     (!isConnected || isSending || (editingMessageId ? !editingContent.trim() : !newMessageContent.trim()))
                        ? 'opacity-50 cursor-not-allowed' // Disabled style
                        : ''
                    }`}
                  disabled={
                    !isConnected ||
                    isSending ||
                    !selectedRoomId || // Also disable if no room is selected
                    (editingMessageId ? !editingContent.trim() : !newMessageContent.trim()) // Disable if content is empty
                  }
                  title={editingMessageId ? "Save Changes" : "Send Message"}
                >
                  {/* Conditional Icon */}
                  {isSending ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  ) : editingMessageId ? (
                    <CheckIcon className="h-5 w-5" /> // Save icon
                  ) : (
                    <PaperAirplaneIcon className="h-5 w-5" /> // Send icon
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
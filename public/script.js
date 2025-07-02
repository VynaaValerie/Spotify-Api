document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  let currentRoom = '';
  let currentUser = '';
  
  const chatBox = document.getElementById('chatBox');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const joinBtn = document.getElementById('joinBtn');
  const roomIdInput = document.getElementById('roomId');
  const usernameInput = document.getElementById('username');
  
  // Join room
  joinBtn.addEventListener('click', () => {
    const roomId = roomIdInput.value.trim();
    const username = usernameInput.value.trim();
    
    if (!roomId || !username) {
      alert('Please enter both room ID and username');
      return;
    }
    
    currentRoom = roomId;
    currentUser = username;
    
    // Join the room
    socket.emit('joinRoom', roomId);
    
    // Load previous messages
    fetch(`/chat/${roomId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          chatBox.innerHTML = '';
          data.data.forEach(msg => {
            addMessageToChat(msg);
          });
        }
      })
      .catch(err => console.error('Error loading messages:', err));
  });
  
  // Send message
  function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !currentRoom || !currentUser) return;
    
    const messageData = {
      roomId: currentRoom,
      senderId: socket.id,
      senderName: currentUser,
      message: message,
      type: 'text'
    };
    
    socket.emit('sendMessage', messageData);
    messageInput.value = '';
  }
  
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  // Receive new message
  socket.on('newMessage', (message) => {
    if (message.roomId === currentRoom) {
      addMessageToChat(message);
    }
  });
  
  // Add message to chat box
  function addMessageToChat(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === socket.id ? 'sent' : ''}`;
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'message-info';
    infoDiv.textContent = `${message.senderName} - ${new Date(message.timestamp).toLocaleTimeString()}`;
    
    const textDiv = document.createElement('div');
    textDiv.textContent = message.message;
    
    messageDiv.appendChild(infoDiv);
    messageDiv.appendChild(textDiv);
    chatBox.appendChild(messageDiv);
    
    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});
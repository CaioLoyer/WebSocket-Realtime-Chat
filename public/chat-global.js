const socket = io(window.location.origin);

const user = document.querySelector('#user');
const msg = document.querySelector('#message');
const list = document.querySelector('#messages');
const typingStatus = document.getElementById('typingStatus');
let typingTimeout;
const TYPING_INTERVAL = 1500;

socket.emit('join_room', { lang: 'global' });

document.querySelector('#sendBtn').onclick = () => {
  if (!msg.value.trim()) return;

  socket.emit('register_user', { user: user.value || 'Anônimo' });

  socket.emit('send_message', {
    user: user.value || 'Anônimo',
    message: msg.value,
  });

  msg.value = '';
};

msg.addEventListener('input', () => {
  socket.emit('typing', { user: user.value || 'Anônimo', room: 'global' });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop_typing', { user: user.value || 'Anônimo', room: 'global' });
  }, TYPING_INTERVAL);
});

socket.on('new_message', (data) => {
  const li = document.createElement('li');
  const time = new Date(data.timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  li.textContent = `(${time}) ${data.user}: ${data.message}`;
  list.appendChild(li);
});

socket.on('highlight_message', (data) => {
  const li = document.createElement('li');
  li.style.background = '#ffff99';
  li.style.fontWeight = 'bold';
  const time = new Date(data.timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  li.textContent = `(Mencionado) (${time}) ${data.from}: ${data.message}`;
  list.appendChild(li);
});

socket.on('users_typing_update', (typingUsers) => {
  if (!typingUsers || typingUsers.length === 0) {
    typingStatus.textContent = '';
    return;
  }
  if (typingUsers.length === 1) {
    typingStatus.textContent = `${typingUsers[0]} está digitando...`;
    return;
  }
  if (typingUsers.length === 2) {
    typingStatus.textContent = `${typingUsers[0]} e ${typingUsers[1]} estão digitando...`;
    return;
  }
  typingStatus.textContent = `${typingUsers.length} pessoas estão digitando...`;
});

function goToLangChat(lang) {
  window.location.href = `chat-lang.html?lang=${lang}`;
}

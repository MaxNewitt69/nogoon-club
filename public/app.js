// App State
let state = {
  user: null,
  activePunishment: null,
  leaderboard: [],
  feed: [],
  googleClientId: null
};

// DOM Elements
const screenLogin = document.getElementById('screen-login');
const screenDashboard = document.getElementById('screen-dashboard');
const headerUser = document.getElementById('header-user');
const userAvatar = document.getElementById('user-avatar');
const btnLogout = document.getElementById('btn-logout');
const notification = document.getElementById('notification');
const notificationMsg = document.getElementById('notification-message');

// Dashboard Elements
const userStatusPill = document.getElementById('user-status-pill');
const streakTime = document.getElementById('streak-time');
const highestStreakValue = document.getElementById('highest-streak-value');
const btnRelapseTrigger = document.getElementById('btn-relapse-trigger');
const cookedBanner = document.getElementById('cooked-banner');
const activePunishmentText = document.getElementById('active-punishment-text');
const btnResolvePunishment = document.getElementById('btn-resolve-punishment');
const punishmentProofInput = document.getElementById('punishment-proof-input');
const feedContainer = document.getElementById('feed-container');

// Chat DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatPhotoInput = document.getElementById('chat-photo-input');
const btnChatAttach = document.getElementById('btn-chat-attach');
const chatPreviewContainer = document.getElementById('chat-preview-container');
const chatPreviewImg = document.getElementById('chat-preview-img');
const btnChatRemovePreview = document.getElementById('btn-chat-remove-preview');

// Lightbox Elements
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');

let chatAttachedImageBase64 = null;
let chatMessagesList = [];

// Podium Spots
const podiumSpots = {
  1: { img: document.getElementById('podium-1-img'), name: document.getElementById('podium-1-name'), streak: document.getElementById('podium-1-streak') },
  2: { img: document.getElementById('podium-2-img'), name: document.getElementById('podium-2-name'), streak: document.getElementById('podium-2-streak') },
  3: { img: document.getElementById('podium-3-img'), name: document.getElementById('podium-3-name'), streak: document.getElementById('podium-3-streak') }
};

const podiumNudgeContainers = {
  1: document.getElementById('podium-1-nudge-container'),
  2: document.getElementById('podium-2-nudge-container'),
  3: document.getElementById('podium-3-nudge-container')
};

// Relapse Modal Elements
const relapseModal = document.getElementById('relapse-modal');
const btnModalClose = document.getElementById('btn-modal-close');

// Initialize Confetti Canvas
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let confettiParticles = [];
let confettiActive = false;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Confetti Engine
class ConfettiParticle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height - canvas.height;
    this.size = Math.random() * 8 + 6;
    this.color = ['#06b6d4', '#10b981', '#f43f5e', '#eab308', '#8b5cf6'][Math.floor(Math.random() * 5)];
    this.speedX = Math.random() * 4 - 2;
    this.speedY = Math.random() * 5 + 4;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 4 - 2;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += this.rotationSpeed;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

function startConfetti() {
  confettiParticles = [];
  for (let i = 0; i < 100; i++) {
    confettiParticles.push(new ConfettiParticle());
  }
  confettiActive = true;
  animateConfetti();
  setTimeout(() => {
    confettiActive = false;
  }, 4000);
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  confettiParticles.forEach((p, index) => {
    p.update();
    p.draw();
    if (p.y > canvas.height) {
      if (confettiActive) {
        confettiParticles[index] = new ConfettiParticle();
      } else {
        confettiParticles.splice(index, 1);
      }
    }
  });
  if (confettiActive || confettiParticles.length > 0) {
    requestAnimationFrame(animateConfetti);
  }
}

// Notification Alert
function notify(message, isError = false) {
  notificationMsg.textContent = message;
  notification.style.borderColor = isError ? 'var(--accent-pink)' : 'var(--accent-cyan)';
  notification.style.boxShadow = isError ? 'var(--shadow-neon-pink)' : 'var(--shadow-neon-cyan)';
  notification.classList.add('show');
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3500);
}

// Format date distance
function formatTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

// Compress image and return Base64
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 500;
        const maxH = 500;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxW) { h *= maxW / w; w = maxW; }
        } else {
          if (h > maxH) { w *= maxH / h; h = maxH; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// Fetch and render chat messages
async function updateChatMessages() {
  if (!state.user) return;
  try {
    const res = await fetch('/api/messages');
    if (!res.ok) return;
    const messages = await res.json();
    
    // Check if we have new messages before rendering
    const hasNewMessages = messages.length !== chatMessagesList.length || 
                           JSON.stringify(messages) !== JSON.stringify(chatMessagesList);
                           
    if (!hasNewMessages) return;
    
    const wasScrolledToBottom = chatMessages.scrollHeight - chatMessages.clientHeight <= chatMessages.scrollTop + 50;
    
    chatMessagesList = messages;
    chatMessages.innerHTML = '';
    
    if (chatMessagesList.length === 0) {
      chatMessages.innerHTML = '<div class="chat-placeholder">No secret codes yet. Type below...</div>';
      return;
    }
    
    chatMessagesList.forEach(msg => {
      const wrapper = document.createElement('div');
      const isSystem = msg.message_text && msg.message_text.startsWith('🛡️');
      
      if (isSystem) {
        wrapper.className = 'chat-bubble-wrapper system';
        wrapper.innerHTML = `
          <div class="chat-bubble">
            ${msg.message_text}
            ${msg.image_data ? `<br><img src="${msg.image_data}" alt="Proof" class="chat-image">` : ''}
            <div class="chat-bubble-time" style="text-align: center; width: 100%; display: block; margin-top: 5px;">
              ${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        `;
      } else {
        const isSelf = msg.user_id === state.user.id;
        wrapper.className = `chat-bubble-wrapper ${isSelf ? 'self' : 'other'}`;
        
        wrapper.innerHTML = `
          ${!isSelf ? `<img src="${msg.picture}" alt="${msg.name}" class="chat-bubble-avatar">` : ''}
          <div class="chat-bubble-content">
            ${!isSelf ? `<span class="chat-bubble-username">${msg.name}</span>` : ''}
            <div class="chat-bubble">
              ${msg.message_text ? `<div>${msg.message_text}</div>` : ''}
              ${msg.image_data ? `<img src="${msg.image_data}" alt="Photo" class="chat-image">` : ''}
            </div>
            <span class="chat-bubble-time">
              ${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        `;
      }
      
      chatMessages.appendChild(wrapper);
    });
    
    // Bind click listeners for lightbox
    const images = chatMessages.querySelectorAll('.chat-image');
    images.forEach(img => {
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightboxModal.classList.remove('hidden');
      });
    });
    
    if (wasScrolledToBottom || chatMessages.scrollTop === 0) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  } catch (err) {
    console.error('Failed to update chat messages:', err);
  }
}// Get user state and update UI
async function loadAppData() {
  try {
    // Attempt to load current user session
    const meRes = await fetch('/api/me');
    if (meRes.ok) {
      const meData = await meRes.json();
      state.user = meData.user;
      state.activePunishment = meData.activePunishment;
      
      // Update UI elements
      userAvatar.src = state.user.picture;
      headerUser.classList.remove('hidden');
      screenLogin.classList.add('hidden');
      screenDashboard.classList.remove('hidden');

      // Populate dashboard
      await updateDashboard();
      await updateChatMessages();
    } else {
      // Not logged in - check for auto-login profile
      const savedProfile = localStorage.getItem('nogoon_profile');
      if (savedProfile) {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: savedProfile })
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          state.user = loginData.user;
          await loadAppData();
          return;
        }
      }

      headerUser.classList.add('hidden');
      screenLogin.classList.remove('hidden');
      screenDashboard.classList.add('hidden');
    }
  } catch (err) {
    console.error('Error loading app data:', err);
  }
}

// Update dashboard details (leaderboard, user status, recent events)
async function updateDashboard() {
  if (!state.user) return;

  try {
    // 1. Fetch user status update
    const meRes = await fetch('/api/me');
    if (meRes.ok) {
      const meData = await meRes.json();
      state.user = meData.user;
      state.activePunishment = meData.activePunishment;
    }

    // 2. Fetch Leaderboard and feed
    const usersRes = await fetch('/api/users');
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      state.leaderboard = usersData.users;
      state.feed = usersData.feed;
    }

    // --- Render Personal Streak ---
    const user = state.user;
    const isCooked = user.status === 'COOKED';
    
    userStatusPill.className = `status-pill ${isCooked ? 'cooked-pill' : 'active-pill'}`;
    userStatusPill.textContent = user.status;
    
    streakTime.textContent = user.streakInfo.display;
    const maxHighestHours = Math.max(user.highest_streak, user.streakInfo.totalHours);
    highestStreakValue.textContent = `${maxHighestHours}h (${Math.floor(maxHighestHours / 24)}d)`;

    if (isCooked) {
      // Cooked states
      btnRelapseTrigger.disabled = true;
      cookedBanner.classList.remove('hidden');
      if (state.activePunishment) {
        activePunishmentText.textContent = state.activePunishment.punishment_text;
      } else {
        activePunishmentText.textContent = 'Awaiting punishment assignment from the council...';
      }
    } else {
      // Active states
      btnRelapseTrigger.disabled = false;
      cookedBanner.classList.add('hidden');
    }

    // --- Render Leaderboard Podium ---
    // Clear podium placeholders first
    for (let place = 1; place <= 3; place++) {
      podiumSpots[place].img.src = `https://api.dicebear.com/7.x/bottts/svg?seed=placeholder${place}&backgroundColor=19192d`;
      podiumSpots[place].name.textContent = 'Empty Spot';
      podiumSpots[place].streak.textContent = '0d 0h';
      podiumSpots[place].img.style.borderColor = 'var(--text-secondary)';
      podiumNudgeContainers[place].innerHTML = '';
    }

    // Fill with actual data (sorted by current streak hours)
    state.leaderboard.forEach((player, idx) => {
      const rank = idx + 1;
      if (rank <= 3) {
        const spot = podiumSpots[rank];
        const nudgeContainer = podiumNudgeContainers[rank];
        spot.img.src = player.picture;
        
        const isOnline = player.last_check_in && (Date.now() - new Date(player.last_check_in) < 60000);
        spot.name.innerHTML = `${isOnline ? '<span class="online-dot" title="Online">🟢</span> ' : ''}${player.name}`;
        
        if (player.status === 'COOKED') {
          spot.streak.textContent = '🍳 COOKED';
          spot.streak.style.color = 'var(--accent-pink)';
          spot.img.style.borderColor = 'var(--accent-pink)';
        } else {
          spot.streak.textContent = player.streakInfo.display;
          spot.streak.style.color = 'var(--accent-cyan)';
          if (rank === 1) spot.img.style.borderColor = 'var(--accent-yellow)';
          else if (rank === 2) spot.img.style.borderColor = '#cbd5e1';
          else if (rank === 3) spot.img.style.borderColor = '#b45309';
        }

        // Highlight logged in player's avatar
        if (player.id === state.user.id) {
          spot.img.style.transform = 'scale(1.1)';
          spot.name.innerHTML = `👉 ${spot.name.innerHTML}`;
          nudgeContainer.innerHTML = '';
        } else {
          spot.img.style.transform = 'scale(1)';
          const isCooked = player.status === 'COOKED';
          nudgeContainer.innerHTML = isCooked
            ? `<button class="btn-nudge shamer" onclick="nudgeFriend('${player.id}')">💀 Shame</button>`
            : `<button class="btn-nudge nudger" onclick="nudgeFriend('${player.id}')">🤫 Nudge</button>`;
        }
      }
    });

    // --- Render Activity Feed ---
    if (state.feed.length === 0) {
      feedContainer.innerHTML = `<div class="feed-placeholder">No activity yet. Let's see who cooks it first...</div>`;
    } else {
      feedContainer.innerHTML = '';
      state.feed.forEach(item => {
        const div = document.createElement('div');
        const isRelapse = item.status === 'PENDING';
        div.className = `feed-item ${isRelapse ? 'feed-relapse' : 'feed-complete'}`;
        
        const timestamp = formatTimeAgo(item.created_at);
        
        if (isRelapse) {
          div.innerHTML = `
            <img src="${item.picture}" alt="${item.name}" class="feed-avatar">
            <div class="feed-content">
              <div class="feed-text">
                <span class="feed-user-name">${item.name}</span> relapsed! 🥀
                <p style="margin-top: 4px; font-style: italic; opacity: 0.9;">"${item.punishment_text}"</p>
              </div>
              <span class="feed-time">${timestamp}</span>
            </div>
          `;
        } else {
          div.innerHTML = `
            <img src="${item.picture}" alt="${item.name}" class="feed-avatar">
            <div class="feed-content">
              <div class="feed-text">
                <span class="feed-user-name">${item.name}</span> completed their punishment and was resurrected! 🛡️
                <p style="margin-top: 4px; opacity: 0.6; font-size: 0.75rem;">Completed: ${item.punishment_text.substring(0, 40)}...</p>
              </div>
              <span class="feed-time">${timestamp}</span>
            </div>
          `;
        }
        feedContainer.appendChild(div);
      });
    }

  } catch (err) {
    console.error('Error updating dashboard:', err);
  }
}

// --- Action Event Listeners ---

// Relapse Modal Handlers
btnRelapseTrigger.addEventListener('click', () => {
  relapseModal.classList.remove('hidden');
});

btnModalClose.addEventListener('click', () => {
  relapseModal.classList.add('hidden');
});

// Click reasons
const reasonButtons = document.querySelectorAll('.btn-reason');
reasonButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const reason = btn.getAttribute('data-reason');
    relapseModal.classList.add('hidden');
    
    try {
      const res = await fetch('/api/relapse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      
      if (res.ok) {
        notify('You relapsed. Check your assigned punishment!', true);
        await updateDashboard();
      } else {
        notify(data.error, true);
      }
    } catch (err) {
      notify('Failed to log relapse', true);
    }
  });
});

// Resolve Punishment (Triggers Photo Dialog first)
btnResolvePunishment.addEventListener('click', () => {
  punishmentProofInput.click();
});

punishmentProofInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  btnResolvePunishment.disabled = true;
  notify('Compressing proof photo...');
  
  try {
    const base64 = await compressImage(file);
    notify('Submitting proof to council...');
    
    const res = await fetch('/api/resolve-punishment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData: base64 })
    });
    
    const data = await res.json();
    if (res.ok) {
      notify(data.message);
      startConfetti();
      await updateDashboard();
      await updateChatMessages();
    } else {
      notify(data.error || 'Failed to resolve punishment', true);
    }
  } catch (err) {
    console.error(err);
    notify('Failed to process or upload image proof', true);
  } finally {
    btnResolvePunishment.disabled = false;
    punishmentProofInput.value = ''; // Reset input
  }
});

// Chat image attachment handlers
btnChatAttach.addEventListener('click', () => {
  chatPhotoInput.click();
});

chatPhotoInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    notify('Attaching photo...');
    const base64 = await compressImage(file);
    chatAttachedImageBase64 = base64;
    chatPreviewImg.src = base64;
    chatPreviewContainer.classList.remove('hidden');
  } catch (err) {
    console.error(err);
    notify('Failed to process image attachment', true);
  }
});

btnChatRemovePreview.addEventListener('click', () => {
  chatAttachedImageBase64 = null;
  chatPhotoInput.value = '';
  chatPreviewContainer.classList.add('hidden');
});

// Chat Submit Form
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const text = chatInput.value.trim();
  const base64 = chatAttachedImageBase64;
  
  if (!text && !base64) return;
  
  chatInput.disabled = true;
  const originalPlaceholder = chatInput.placeholder;
  chatInput.placeholder = 'Sending...';
  
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageText: text, imageData: base64 })
    });
    
    if (res.ok) {
      chatInput.value = '';
      btnChatRemovePreview.click();
      await updateChatMessages();
    } else {
      const data = await res.json();
      notify(data.error || 'Failed to send message', true);
    }
  } catch (err) {
    notify('Failed to connect to chat server', true);
  } finally {
    chatInput.disabled = false;
    chatInput.placeholder = originalPlaceholder;
    chatInput.focus();
  }
});

// Lightbox modal close handler
lightboxModal.addEventListener('click', () => {
  lightboxModal.classList.add('hidden');
});

// Profile Login Buttons
const mockButtons = document.querySelectorAll('.btn-mock');
mockButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const mockUser = btn.getAttribute('data-user');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: mockUser })
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Logged in as ${data.user.name}! Lock in.`);
        localStorage.setItem('nogoon_profile', mockUser);
        state.user = data.user;
        await loadAppData();
      } else {
        notify(data.error, true);
      }
    } catch (err) {
      notify('Login request failed', true);
    }
  });
});

// Logout Button
btnLogout.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      notify('Logged out. Stay strong.');
      localStorage.removeItem('nogoon_profile');
      state.user = null;
      await loadAppData();
    }
  } catch (err) {
    notify('Failed to log out', true);
  }
});

// Nudge/Shame friend API click binding
window.nudgeFriend = async function(friendId) {
  try {
    const res = await fetch(`/api/users/${friendId}/nudge`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      notify(data.message);
      await updateChatMessages();
    } else {
      notify(data.error || 'Failed to notify friend', true);
    }
  } catch (err) {
    notify('Failed to send nudge request', true);
  }
};

// Load the app on startup
window.addEventListener('DOMContentLoaded', () => {
  loadAppData();
  
  // Auto refresh dashboard every 30 seconds
  setInterval(() => {
    if (state.user) {
      updateDashboard();
    }
  }, 30000);

  // Auto refresh chat messages every 5 seconds
  setInterval(() => {
    if (state.user) {
      updateChatMessages();
    }
  }, 5000);
});

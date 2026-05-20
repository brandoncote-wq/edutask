// ===== INITIALIZATION =====
let currentUser = null;
let tasks = [];
let selectedDate = null;
let currentCalendarDate = new Date(); // Pour la navigation du calendrier

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromStorage();
    setupEventListeners();
    checkUserSession();
    updateNavbar();
    addNavbarScroll();

    if (window.location.pathname.includes('dashboard.html')) {
        initDashboard();
    }
});

// ===== NAVBAR SCROLL EFFECT =====
function addNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ===== UPDATE NAVBAR =====
function updateNavbar() {
    const navbarButtons = document.querySelector('.navbar-buttons');
    const navbarMenu = document.querySelector('.navbar-menu');
    if (!navbarButtons || !navbarMenu) return;

    if (currentUser) {
        navbarButtons.innerHTML = `
            <a href="dashboard.html" class="btn-calendar">Calendrier</a>
            <span class="user-greeting">Bonjour, ${currentUser.username}</span>
            <button class="btn-logout" onclick="handleLogout()">Déconnexion</button>
        `;
        navbarMenu.innerHTML = `
            <a href="dashboard.html">Tableau de bord</a>
            <a href="dashboard.html">Mes Tâches</a>
        `;
    } else {
        navbarButtons.innerHTML = `
            <a href="login.html" class="btn-login">Connexion</a>
            <a href="register.html" class="btn-signup">S'inscrire</a>
        `;
        navbarMenu.innerHTML = `
            <a href="index.html">Accueil</a>
            <a href="index.html#features">Fonctionnalités</a>
            <a href="index.html#how-it-works">Comment ça marche</a>
            <a href="index.html#contact">Contact</a>
        `;
    }
}

// ===== MENU TOGGLE =====
function toggleMenu() {
    const navMenu = document.querySelector('.navbar-menu');
    if (navMenu) {
        const isOpen = navMenu.classList.contains('mobile-open');
        if (isOpen) {
            navMenu.classList.remove('mobile-open'); document.querySelector('.hamburger')?.classList.remove('active');
        } else {
            navMenu.classList.add('mobile-open'); document.querySelector('.hamburger')?.classList.add('active');
        }
    }
}

// ===== STORAGE =====
function saveToStorage() {
    const data = {
        users: getUsers(),
        tasks: tasks,
        currentUser: currentUser
    };
    localStorage.setItem('edutaskData', JSON.stringify(data));
}

function loadDataFromStorage() {
    const data = localStorage.getItem('edutaskData');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            tasks = parsed.tasks || [];
            currentUser = parsed.currentUser || null;
        } catch (e) {
            tasks = [];
            currentUser = null;
        }
    } else {
        tasks = [];
        currentUser = null;
        saveToStorage();
    }
}

function getUsers() {
    const data = localStorage.getItem('edutaskData');
    if (data) {
        try {
            return JSON.parse(data).users || [];
        } catch (e) {
            return [];
        }
    }
    return [];
}

function setUsers(users) {
    const data = JSON.parse(localStorage.getItem('edutaskData') || '{"users":[],"tasks":[],"currentUser":null}');
    data.users = users;
    localStorage.setItem('edutaskData', JSON.stringify(data));
}

// ===== SESSION CHECK =====
// BUG CORRIGÉ : ne pas rediriger depuis index.html si l'utilisateur est connecté
// (il doit pouvoir se déconnecter et revenir à l'accueil)
function checkUserSession() {
    const path = window.location.pathname;
    const isAuthPage = path.includes('login.html') || path.includes('register.html');
    const isDashboard = path.includes('dashboard.html');

    if (currentUser) {
        // Si connecté et sur login/register, rediriger vers dashboard
        if (isAuthPage) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // Si non connecté et sur dashboard, rediriger vers accueil
        if (isDashboard) {
            window.location.href = 'index.html';
        }
    }
}

// ===== AUTHENTICATION =====
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || user.password !== password) {
        showNotification('Email ou mot de passe incorrect', 'error');
        return;
    }

    currentUser = {
        id: user.id,
        username: user.username,
        email: user.email
    };

    saveToStorage();
    updateNavbar();
    window.location.href = 'dashboard.html';
}

function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('registerConfirm').value.trim();

    if (!username || !email || !password || !confirmPassword) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Les mots de passe ne correspondent pas', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Adresse email invalide', 'error');
        return;
    }

    const users = getUsers();

    if (users.find(u => u.email === email)) {
        showNotification('Cet email est déjà utilisé', 'error');
        return;
    }

    if (users.find(u => u.username === username)) {
        showNotification('Ce nom d\'utilisateur est déjà pris', 'error');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        username: username,
        email: email,
        password: password
    };

    users.push(newUser);
    setUsers(users);

    currentUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
    };

    saveToStorage();
    updateNavbar();
    window.location.href = 'dashboard.html';
}

function handleLogout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        // BUG CORRIGÉ : ne pas effacer les tâches à la déconnexion
        currentUser = null;
        saveToStorage();
        updateNavbar();
        window.location.href = 'index.html';
    }
}

// ===== DASHBOARD =====
function initDashboard() {
    const userGreeting = document.getElementById('user-greeting');
    const userName = document.getElementById('user-name');

    if (currentUser) {
        if (userGreeting) userGreeting.textContent = `Bonjour, ${currentUser.username}`;
        if (userName) userName.textContent = currentUser.username;
    }

    selectedDate = new Date();
    currentCalendarDate = new Date();
    generateCalendar();
    displayTasks();
    updateStats();
}

// ===== STATS =====
function updateStats() {
    if (!currentUser) return;
    const userTasks = tasks.filter(t => t.userId === currentUser.id);
    const completed = userTasks.filter(t => t.completed).length;
    const pending = userTasks.filter(t => !t.completed).length;

    const today = new Date().toISOString().split('T')[0];
    const todayCount = userTasks.filter(t => t.date === today).length;

    const statTotal = document.getElementById('stat-total');
    const statCompleted = document.getElementById('stat-completed');
    const statPending = document.getElementById('stat-pending');
    const statToday = document.getElementById('stat-today');

    if (statTotal) statTotal.textContent = userTasks.length;
    if (statCompleted) statCompleted.textContent = completed;
    if (statPending) statPending.textContent = pending;
    if (statToday) statToday.textContent = todayCount;
}

// ===== CALENDAR =====
function generateCalendar() {
    // BUG CORRIGÉ : utiliser #calendar (id) au lieu de .calendar (classe)
    const calendar = document.getElementById('calendar');
    if (!calendar) return;

    calendar.innerHTML = '';

    const today = new Date();
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    // En-tête navigation mois
    const header = document.createElement('div');
    header.className = 'calendar-nav';
    const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    header.innerHTML = `
        <button onclick="prevMonth()" class="cal-nav-btn">‹</button>
        <span class="cal-month-title">${monthNames[month]} ${year}</span>
        <button onclick="nextMonth()" class="cal-nav-btn">›</button>
    `;
    calendar.appendChild(header);

    // Grille calendrier
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';

    // En-têtes jours
    const dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day day-header';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });

    // Premier jour du mois (ajustement lundi = 0)
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = (firstDay === 0) ? 6 : firstDay - 1; // Convertir dimanche=0 en lundi=0

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Cellules vides avant le début du mois
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        grid.appendChild(emptyDay);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;

        const dayDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const tasksOnDay = currentUser
            ? tasks.filter(t => t.userId === currentUser.id && t.date === dayDate)
            : [];

        if (tasksOnDay.length > 0) {
            const indicator = document.createElement('div');
            indicator.className = 'cal-task-indicator';
            indicator.textContent = tasksOnDay.length;
            dayCell.appendChild(indicator);
            dayCell.classList.add('has-tasks');
        }

        // Aujourd'hui
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayCell.classList.add('today');
        }

        // Jour sélectionné
        if (selectedDate &&
            day === selectedDate.getDate() &&
            month === selectedDate.getMonth() &&
            year === selectedDate.getFullYear()) {
            dayCell.classList.add('active');
        }

        dayCell.addEventListener('click', () => {
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('active'));
            dayCell.classList.add('active');
            selectedDate = new Date(year, month, day);
            displayTasks(dayDate);
        });

        grid.appendChild(dayCell);
    }

    calendar.appendChild(grid);
}

function prevMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    generateCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    generateCalendar();
}

// ===== DISPLAY TASKS =====
// BUG CORRIGÉ : utiliser #tasks-list (id) au lieu de .tasks-list (classe)
function displayTasks(filterDate = null) {
    const tasksList = document.getElementById('tasks-list');
    if (!tasksList) return;

    let userTasks = tasks.filter(t => t.userId === currentUser.id);

    // Filtre par date si sélectionnée
    if (filterDate) {
        userTasks = userTasks.filter(t => t.date === filterDate);
        const dateTitle = document.getElementById('tasks-date-title');
        if (dateTitle) {
            const d = new Date(filterDate + 'T00:00:00');
            dateTitle.textContent = `— ${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
        }
    } else {
        const dateTitle = document.getElementById('tasks-date-title');
        if (dateTitle) dateTitle.textContent = '';
    }

    // Tri par date
    userTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

    tasksList.innerHTML = '';

    if (userTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="tasks-empty">
                <div class="tasks-empty-icon">📋</div>
                <p>${filterDate ? 'Aucune tâche ce jour-là' : 'Aucune tâche pour l\'instant'}</p>
                <p style="font-size:13px; color:#bbb;">Cliquez sur un jour du calendrier ou sur + Ajouter</p>
            </div>`;
        return;
    }

    userTasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;

        const taskDate = new Date(task.date + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);
        const isOverdue = !task.completed && taskDate < today;

        taskEl.innerHTML = `
            <div class="task-check" onclick="toggleTask('${task.id}')">
                ${task.completed ? '✓' : ''}
            </div>
            <div class="task-body">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span class="task-date ${isOverdue ? 'overdue' : ''}">
                        ${isOverdue ? '⚠️ ' : '📅 '}${taskDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    ${task.syncedToGoogle ? '<span class="task-synced-badge">🗓️ Google</span>' : ''}
                </div>
            </div>
            <button class="task-delete" onclick="deleteTask('${task.id}')" title="Supprimer">🗑️</button>
        `;
        tasksList.appendChild(taskEl);
    });
}

// ===== TASK MANAGEMENT =====
function openAddTaskModal() {
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.classList.add('show');
        document.getElementById('taskForm').reset();

        const adviceSection = document.getElementById('aiAdviceSection');
        if (adviceSection) adviceSection.style.display = 'none';

        if (selectedDate) {
            const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
            document.getElementById('taskDate').value = dateStr;
        }
    }
}

function closeAddTaskModal() {
    const modal = document.getElementById('taskModal');
    if (modal) modal.classList.remove('show');
}

function handleAddTask(event) {
    event.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDesc').value.trim();
    const taskDate = document.getElementById('taskDate').value;

    if (!title || !taskDate) {
        showNotification('Veuillez renseigner le titre et la date', 'error');
        return;
    }

    const newTask = {
        id: Date.now().toString(),
        title: title,
        description: description,
        date: taskDate,
        completed: false,
        userId: currentUser.id
    };

    tasks.push(newTask);
    saveToStorage();
    displayTasks();
    generateCalendar();
    updateStats();
    closeAddTaskModal();
    showNotification('Tâche créée avec succès !', 'success');
}

function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.syncedToGoogle = false; // besoin de re-sync
        saveToStorage();
        displayTasks();
        generateCalendar();
        updateStats();
        showNotification(task.completed ? 'Tâche marquée comme terminée ✓' : 'Tâche réactivée', 'success');
    }
}

function deleteTask(taskId) {
    if (confirm('Supprimer cette tâche ?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveToStorage();
        displayTasks();
        generateCalendar();
        updateStats();
        showNotification('Tâche supprimée', 'info');
    }
}

// ===== GOOGLE CALENDAR SYNC =====
const GOOGLE_CLIENT_ID = '215154720471-54tqldn0hfp2oikllbuoe322n81lh8g4.apps.googleusercontent.com';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const GOOGLE_DISCOVERY = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

let googleAccessToken = null;
let googleTokenClient = null;
let gapiReady = false;
let gsiReady = false;

// Initialiser GAPI (client REST)
function initGapi() {
    gapi.load('client', async () => {
        await gapi.client.init({});
        await gapi.client.load(GOOGLE_DISCOVERY);
        gapiReady = true;
    });
}

// Initialiser GSI (token OAuth)
function initGsi() {
    googleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPE,
        callback: async (response) => {
            if (response.error) {
                showNotification('Connexion Google annulée', 'error');
                return;
            }
            googleAccessToken = response.access_token;
            gapi.client.setToken({ access_token: googleAccessToken });
            updateGoogleBtn(true);
            showNotification('Connecté à Google Agenda !', 'success');
            await syncTasksToGoogle();
        },
    });
    gsiReady = true;
}

// Appelé quand les scripts Google sont chargés
window.addEventListener('load', () => {
    // Attendre que les libs soient dispo
    const waitGapi = setInterval(() => {
        if (typeof gapi !== 'undefined') {
            clearInterval(waitGapi);
            initGapi();
        }
    }, 200);
    const waitGsi = setInterval(() => {
        if (typeof google !== 'undefined' && google.accounts) {
            clearInterval(waitGsi);
            initGsi();
        }
    }, 200);
});

function handleGoogleSync() {
    if (!currentUser) return;
    const userTasks = tasks.filter(t => t.userId === currentUser.id);
    if (userTasks.length === 0) {
        showNotification('Aucune tâche à synchroniser', 'error');
        return;
    }
    if (!gsiReady || !gapiReady) {
        showNotification('Chargement Google en cours, réessaie dans 2 secondes…', 'info');
        return;
    }
    // Demander le token (ouvre la popup Google)
    googleTokenClient.requestAccessToken({ prompt: googleAccessToken ? '' : 'consent' });
}

async function syncTasksToGoogle() {
    if (!currentUser || !googleAccessToken) return;

    const userTasks = tasks.filter(t => t.userId === currentUser.id && !t.syncedToGoogle);
    if (userTasks.length === 0) {
        showNotification('Toutes les tâches sont déjà synchronisées ✓', 'info');
        return;
    }

    updateGoogleBtn(true, true); // loading
    let synced = 0;
    let errors = 0;

    for (const task of userTasks) {
        try {
            const dateStr = task.date; // YYYY-MM-DD
            const event = {
                summary: task.title,
                description: task.description || '',
                start: { date: dateStr },
                end: { date: dateStr },
                colorId: task.completed ? '2' : '9', // vert si terminé, bleu sinon
                extendedProperties: {
                    private: { edutaskId: task.id }
                }
            };

            await gapi.client.calendar.events.insert({
                calendarId: 'primary',
                resource: event,
            });

            // Marquer comme synchronisé
            task.syncedToGoogle = true;
            synced++;
        } catch (e) {
            console.error('Erreur sync tâche:', task.title, e);
            errors++;
        }
    }

    saveToStorage();
    updateGoogleBtn(true, false);

    if (errors === 0) {
        showNotification(`${synced} tâche(s) ajoutée(s) dans Google Agenda ! 🗓️`, 'success');
    } else {
        showNotification(`${synced} synchronisée(s), ${errors} erreur(s)`, 'info');
    }
}

function updateGoogleBtn(connected, loading = false) {
    const btn = document.getElementById('btnGoogleSync');
    const label = document.getElementById('googleSyncLabel');
    if (!btn || !label) return;

    if (loading) {
        btn.classList.add('syncing');
        label.textContent = 'Synchronisation…';
    } else if (connected) {
        btn.classList.add('connected');
        btn.classList.remove('syncing');
        label.textContent = 'Synchroniser';
    } else {
        btn.classList.remove('connected', 'syncing');
        label.textContent = 'Connecter Google';
    }
}

// Reset sync status quand une tâche est modifiée
function markTaskUnsynced(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) task.syncedToGoogle = false;
}


// ===== EVENT LISTENERS =====
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', handleAddTask);
    }

    const taskModal = document.getElementById('taskModal');
    if (taskModal) {
        taskModal.addEventListener('click', (e) => {
            if (e.target === taskModal) closeAddTaskModal();
        });
    }

    // Fermer menu mobile au clic sur un lien
    document.addEventListener('click', (e) => {
        const navMenu = document.querySelector('.navbar-menu');
        const hamburger = document.querySelector('.hamburger');
        if (navMenu && hamburger && !hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('mobile-open'); document.querySelector('.hamburger')?.classList.remove('active');
        }
    });

    // Échap pour fermer le modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAddTaskModal();
    });
}

// ===== NOTIFICATIONS (remplace les alert/confirm basiques) =====
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);

    requestAnimationFrame(() => notif.classList.add('show'));

    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ===== UTILITAIRES =====
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

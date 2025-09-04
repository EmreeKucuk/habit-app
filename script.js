// Enhanced Habit Tracker Application with Social Features
console.log('Script.js loading...');

class HabitTracker {
    constructor() {
        this.habits = JSON.parse(localStorage.getItem('habits')) || [];
        this.user = JSON.parse(localStorage.getItem('user')) || this.createDefaultUser();
        this.friends = JSON.parse(localStorage.getItem('friends')) || [];
        this.groups = JSON.parse(localStorage.getItem('groups')) || [];
        this.friendRequests = JSON.parse(localStorage.getItem('friendRequests')) || [];
        this.badges = JSON.parse(localStorage.getItem('badges')) || [];
        this.currentPage = 'dashboard';
        this.theme = localStorage.getItem('theme') || 'light';
        this.currentCommentHabitId = null;
        this.isSubmitting = false; // Prevent duplicate submissions
        
        this.init();
    }

    createDefaultUser() {
        return {
            id: 'user-' + Date.now(),
            username: 'User',
            bio: 'Building healthy habits one day at a time!',
            avatarColor: '#3b82f6',
            xp: 0,
            level: 1,
            shareProgress: true,
            publicProfile: false,
            joinedAt: new Date().toISOString()
        };
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.initializeBadges();
        this.updateUserLevel();
        this.renderHabits();
        this.updateHeaderInfo();
        this.showPage('dashboard');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Navigation
        document.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                console.log('Navigating to page:', page);
                this.showPage(page);
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                console.log('Theme toggle clicked');
                this.toggleTheme();
            });
        }

        // Forms - Event listeners will be set up after DOM is loaded
        console.log('Form event listeners will be configured after DOM is ready');

        // Template cards - will be handled by delegation from DOMContentLoaded
        console.log('Template cards will be handled by event delegation');

        // Tab navigation - handled by event delegation to prevent duplicates
        console.log('Tab navigation will be handled by existing navigation system');

        // Filter buttons - handled by event delegation to prevent duplicates  
        console.log('Filter buttons will be handled by existing navigation system');

        // Mood selector - handled by event delegation to prevent duplicates
        console.log('Mood selector will be handled by existing navigation system');

        // Report period change
        const reportPeriod = document.getElementById('report-period');
        if (reportPeriod) {
            reportPeriod.addEventListener('change', (e) => {
                this.updateReports(e.target.value);
            });
        }
        
        console.log('Event listeners setup complete');
    }

    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeIcon = document.querySelector('#theme-toggle i');
        themeIcon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.setupTheme();
    }

    showPage(pageName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === pageName) {
                btn.classList.add('active');
            }
        });

        // Show page
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.classList.add('fade-in');
        }

        this.currentPage = pageName;

        // Page-specific loading
        switch (pageName) {
            case 'add-habit':
                this.clearForm();
                break;
            case 'profile':
                this.loadProfile();
                break;
            case 'friends':
                this.loadFriends();
                break;
            case 'groups':
                this.loadGroups();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'discover':
                this.loadDiscoverUsers();
                break;
        }
    }

    // XP and Level System
    calculateLevel(xp) {
        return Math.floor(xp / 100) + 1;
    }

    getXPForNextLevel(level) {
        return level * 100;
    }

    addXP(amount, reason = '') {
        this.user.xp += amount;
        const newLevel = this.calculateLevel(this.user.xp);
        
        if (newLevel > this.user.level) {
            this.user.level = newLevel;
            this.showNotification(`🎉 Level up! You're now level ${newLevel}!`, 'success');
            this.checkBadges();
        }
        
        this.updateUserLevel();
        this.saveUser();
        
        if (reason) {
            this.showXPGain(amount, reason);
        }
    }

    showXPGain(amount, reason) {
        const notification = document.createElement('div');
        notification.className = 'xp-gain-animation';
        notification.textContent = `+${amount} XP`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 50px;
            color: var(--accent-warning);
            font-weight: 600;
            font-size: 1.2rem;
            z-index: 1000;
            pointer-events: none;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 1500);
    }

    updateUserLevel() {
        const currentLevelXP = (this.user.level - 1) * 100;
        const nextLevelXP = this.user.level * 100;
        const progressXP = this.user.xp - currentLevelXP;
        const neededXP = nextLevelXP - currentLevelXP;
        
        // Update header
        document.getElementById('header-xp').textContent = `${this.user.xp} XP`;
        
        // Update profile stats
        document.getElementById('profile-xp').textContent = this.user.xp;
        document.getElementById('profile-level').textContent = this.user.level;
        document.getElementById('profile-habits').textContent = this.habits.length;
        document.getElementById('profile-friends').textContent = this.friends.length;
    }

    updateHeaderInfo() {
        document.getElementById('header-xp').textContent = `${this.user.xp} XP`;
        
        // Update avatar
        const avatarSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(this.user.avatarColor)}'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E${this.user.username.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
        document.getElementById('header-avatar').src = avatarSvg;
        document.getElementById('profile-avatar').src = avatarSvg;
    }

    // Badge System
    initializeBadges() {
        const defaultBadges = [
            { id: 'first-habit', name: 'First Steps', description: 'Create your first habit', icon: '🌱', earned: false },
            { id: 'habit-master', name: 'Habit Master', description: 'Create 10 habits', icon: '🏆', earned: false },
            { id: 'week-warrior', name: 'Week Warrior', description: 'Complete habits for 7 days in a row', icon: '⚡', earned: false },
            { id: 'month-champion', name: 'Month Champion', description: 'Complete habits for 30 days in a row', icon: '👑', earned: false },
            { id: 'xp-100', name: 'Rising Star', description: 'Earn 100 XP', icon: '⭐', earned: false },
            { id: 'xp-500', name: 'Super Star', description: 'Earn 500 XP', icon: '🌟', earned: false },
            { id: 'social-butterfly', name: 'Social Butterfly', description: 'Add 5 friends', icon: '🦋', earned: false },
            { id: 'group-leader', name: 'Group Leader', description: 'Create a habit group', icon: '👥', earned: false },
            { id: 'perfect-week', name: 'Perfect Week', description: 'Complete all habits for a week', icon: '💯', earned: false }
        ];

        // Load existing badges or use defaults
        const savedBadges = JSON.parse(localStorage.getItem('badges')) || [];
        
        if (savedBadges.length === 0) {
            this.badges = defaultBadges;
        } else {
            this.badges = savedBadges;
        }
        
        // Add condition functions to all badges (both new and loaded)
        this.badges.forEach(badge => {
            switch (badge.id) {
                case 'first-habit':
                    badge.condition = () => this.habits.length >= 1;
                    break;
                case 'habit-master':
                    badge.condition = () => this.habits.length >= 10;
                    break;
                case 'week-warrior':
                    badge.condition = () => this.getMaxStreak() >= 7;
                    break;
                case 'month-champion':
                    badge.condition = () => this.getMaxStreak() >= 30;
                    break;
                case 'xp-100':
                    badge.condition = () => this.user.xp >= 100;
                    break;
                case 'xp-500':
                    badge.condition = () => this.user.xp >= 500;
                    break;
                case 'social-butterfly':
                    badge.condition = () => this.friends.length >= 5;
                    break;
                case 'group-leader':
                    badge.condition = () => this.groups.some(g => g.createdBy === this.user.id);
                    break;
                case 'perfect-week':
                    badge.condition = () => this.checkPerfectWeek();
                    break;
                default:
                    badge.condition = () => false;
            }
        });
        
        this.saveBadges();
    }

    checkBadges() {
        let newBadges = [];
        
        this.badges.forEach(badge => {
            if (!badge.earned && badge.condition()) {
                badge.earned = true;
                badge.earnedAt = new Date().toISOString();
                newBadges.push(badge);
            }
        });
        
        if (newBadges.length > 0) {
            newBadges.forEach(badge => {
                this.showNotification(`🏆 Badge earned: ${badge.name}!`, 'success');
            });
            this.saveBadges();
            this.renderBadges();
        }
    }

    renderBadges() {
        const badgesGrid = document.getElementById('badges-grid');
        if (!badgesGrid) return;
        
        badgesGrid.innerHTML = this.badges.map(badge => `
            <div class="badge ${badge.earned ? 'earned' : 'locked'}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-description">${badge.description}</div>
            </div>
        `).join('');
    }

    getMaxStreak() {
        if (this.habits.length === 0) return 0;
        
        return Math.max(...this.habits.map(habit => habit.streak || 0));
    }

    checkPerfectWeek() {
        // Check if all daily habits were completed for the past 7 days
        const dailyHabits = this.habits.filter(h => h.frequency === 'daily');
        if (dailyHabits.length === 0) return false;
        
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            
            const allCompleted = dailyHabits.every(habit => 
                habit.completedDates.includes(dateString)
            );
            
            if (!allCompleted) return false;
        }
        
        return true;
    }

    addHabit() {
        console.log('addHabit method called');
        
        // Prevent multiple submissions
        if (this.isSubmitting) {
            console.log('Already submitting, ignoring duplicate call');
            return;
        }
        this.isSubmitting = true;
        
        const form = document.getElementById('habit-form');
        if (!form) {
            console.error('habit-form not found');
            this.showNotification('Error: Form not found', 'error');
            this.isSubmitting = false;
            return;
        }
        
        const formData = new FormData(form);
        console.log('Form data collected:', {
            habitName: formData.get('habitName'),
            category: formData.get('category'),
            frequency: formData.get('frequency'),
            notes: formData.get('notes')
        });
        
        const habitName = formData.get('habitName');
        if (!habitName || habitName.trim() === '') {
            console.error('Habit name is empty');
            this.showNotification('Please enter a habit name', 'error');
            this.isSubmitting = false;
            return;
        }
        
        const habit = {
            id: Date.now().toString(),
            name: habitName.trim(),
            category: formData.get('category') || 'other',
            frequency: formData.get('frequency') || 'daily',
            notes: formData.get('notes') || '',
            createdAt: new Date().toISOString(),
            completedDates: [],
            streak: 0,
            comments: []
        };

        console.log('Created habit:', habit);
        
        this.habits.push(habit);
        this.saveHabits();
        this.renderHabits();
        this.showPage('dashboard');
        this.showNotification('Habit added successfully!', 'success');
        this.addXP(10, 'Creating new habit');
        this.checkBadges();
        
        // Reset submission flag after a delay
        setTimeout(() => {
            this.isSubmitting = false;
        }, 1000);
    }

    addHabitFromTemplate(template) {
        // Prevent multiple submissions
        if (this.isSubmitting) {
            console.log('Already submitting, ignoring duplicate template add');
            return;
        }
        this.isSubmitting = true;
        
        const habit = {
            id: Date.now().toString(),
            name: template.name,
            category: template.category,
            frequency: template.frequency,
            notes: template.notes || '',
            createdAt: new Date().toISOString(),
            completedDates: [],
            streak: 0,
            comments: []
        };

        this.habits.push(habit);
        this.saveHabits();
        this.renderHabits();
        this.showPage('dashboard');
        this.showNotification(`"${template.name}" added to your habits!`, 'success');
        this.addXP(10, 'Adding habit from template');
        this.checkBadges();
        
        // Reset submission flag after a delay
        setTimeout(() => {
            this.isSubmitting = false;
        }, 1000);
    }

    deleteHabit(habitId) {
        if (confirm('Are you sure you want to delete this habit?')) {
            this.habits = this.habits.filter(habit => habit.id !== habitId);
            this.saveHabits();
            this.renderHabits();
            this.showNotification('Habit deleted successfully!', 'success');
        }
    }

    completeHabit(habitId) {
        console.log('completeHabit called with ID:', habitId);
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) {
            console.error('Habit not found:', habitId);
            return;
        }

        const today = new Date().toDateString();
        
        if (habit.completedDates.includes(today)) {
            // Uncomplete habit
            habit.completedDates = habit.completedDates.filter(date => date !== today);
            habit.streak = this.calculateStreak(habit);
            this.showNotification('Habit unmarked for today', 'info');
            console.log('Habit uncompleted');
        } else {
            // Complete habit
            habit.completedDates.push(today);
            habit.streak = this.calculateStreak(habit);
            
            // Award XP based on frequency and streak
            let xpGain = 5; // Base XP
            if (habit.frequency === 'daily') xpGain = 5;
            else if (habit.frequency === 'weekly') xpGain = 15;
            
            // Bonus XP for streaks
            if (habit.streak >= 7) xpGain += 2;
            if (habit.streak >= 30) xpGain += 5;
            
            this.addXP(xpGain, 'Completing habit');
            this.showNotification('Great job! Habit completed for today!', 'success');
            this.checkBadges();
            console.log('Habit completed, XP gained:', xpGain);
        }

        this.saveHabits();
        this.renderHabits();
    }

    showCommentModal(habitId) {
        this.currentCommentHabitId = habitId;
        const modal = document.getElementById('comment-modal');
        modal.classList.add('active');
        
        // Clear previous selections
        document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('habit-comment').value = '';
    }

    saveComment() {
        console.log('saveComment called, current habit ID:', this.currentCommentHabitId);
        
        if (!this.currentCommentHabitId) {
            console.error('No habit ID set for comment');
            return;
        }
        
        const comment = document.getElementById('habit-comment').value;
        const selectedMood = document.querySelector('.mood-btn.selected');
        const mood = selectedMood ? selectedMood.dataset.mood : 'okay';
        
        console.log('Comment text:', comment, 'Mood:', mood);
        
        if (!comment.trim()) {
            this.showNotification('Please enter a comment', 'error');
            return;
        }
        
        const habit = this.habits.find(h => h.id === this.currentCommentHabitId);
        if (habit) {
            habit.comments = habit.comments || [];
            habit.comments.push({
                date: new Date().toDateString(),
                text: comment,
                mood: mood,
                timestamp: new Date().toISOString()
            });
            
            console.log('Comment saved to habit:', habit.name);
            
            this.saveHabits();
            this.renderHabits();
            this.closeModal('comment-modal');
            this.showNotification('Comment saved!', 'success');
        } else {
            console.error('Habit not found for comment:', this.currentCommentHabitId);
        }
    }

    calculateStreak(habit) {
        if (habit.completedDates.length === 0) return 0;

        const sortedDates = habit.completedDates
            .map(date => new Date(date))
            .sort((a, b) => b - a);

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < sortedDates.length; i++) {
            const completedDate = new Date(sortedDates[i]);
            completedDate.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor((currentDate - completedDate) / (1000 * 60 * 60 * 24));

            if (daysDiff === streak) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (daysDiff === streak + 1 && streak === 0) {
                // Allow for missing today if this is the start of checking
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    getProgress(habit) {
        const today = new Date().toDateString();
        const isCompletedToday = habit.completedDates.includes(today);
        
        if (habit.frequency === 'daily') {
            return isCompletedToday ? 100 : 0;
        }
        
        // For weekly habits, calculate based on this week's completions
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const thisWeekCompletions = habit.completedDates.filter(date => {
            const completedDate = new Date(date);
            return completedDate >= weekStart;
        }).length;
        
        const targetCompletions = habit.frequency === 'weekly' ? 1 : 
                                 habit.frequency === 'weekdays' ? 5 : 2;
        
        return Math.min((thisWeekCompletions / targetCompletions) * 100, 100);
    }

    renderHabits() {
        const habitsGrid = document.getElementById('habits-grid');
        const emptyState = document.getElementById('empty-state');
        
        if (this.habits.length === 0) {
            habitsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        habitsGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        habitsGrid.innerHTML = this.habits.map(habit => {
            const progress = this.getProgress(habit);
            const today = new Date().toDateString();
            const isCompletedToday = habit.completedDates.includes(today);
            
            // Get recent comments
            const recentComments = (habit.comments || [])
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 3);
            
            const commentsHTML = recentComments.length > 0 ? `
                <div class="habit-comments">
                    <h5>Recent Notes</h5>
                    ${recentComments.map(comment => `
                        <div class="comment-item">
                            <div class="comment-date">${new Date(comment.timestamp).toLocaleDateString()}</div>
                            <div class="comment-text">${comment.text}</div>
                            <span class="comment-mood">${this.getMoodEmoji(comment.mood)}</span>
                        </div>
                    `).join('')}
                </div>
            ` : '';
            
            return `
                <div class="habit-card">
                    <div class="habit-header">
                        <div>
                            <h3 class="habit-title">${habit.name}</h3>
                            <div class="habit-category category-${habit.category}">
                                <i class="fas fa-tag"></i>
                                ${habit.category}
                            </div>
                            <div class="habit-frequency">${habit.frequency}</div>
                        </div>
                    </div>
                    
                    ${habit.notes ? `<div class="habit-notes">${habit.notes}</div>` : ''}
                    
                    <div class="habit-progress">
                        <div class="progress-label">
                            <span>Today's Progress</span>
                            <span>${Math.round(progress)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    
                    ${commentsHTML}
                    
                    <div class="habit-actions">
                        <button class="btn ${isCompletedToday ? 'btn-success' : 'btn-primary'}" 
                                onclick="window.habitTracker.completeHabit('${habit.id}')">
                            <i class="fas ${isCompletedToday ? 'fa-check-circle' : 'fa-circle'}"></i>
                            ${isCompletedToday ? 'Completed' : 'Complete Today'}
                        </button>
                        <button class="btn btn-secondary" onclick="window.habitTracker.showCommentModal('${habit.id}')">
                            <i class="fas fa-comment"></i>
                            Add Note
                        </button>
                        <button class="btn btn-secondary" onclick="window.habitTracker.deleteHabit('${habit.id}')">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                    
                    ${habit.streak > 0 ? `
                        <div style="margin-top: 1rem; text-align: center; color: var(--accent-secondary); font-weight: 600;">
                            🔥 ${habit.streak} day streak!
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    getMoodEmoji(mood) {
        const moods = {
            excellent: '😄',
            good: '😊',
            okay: '😐',
            bad: '😔',
            terrible: '😢'
        };
        return moods[mood] || '😐';
    }

    clearForm() {
        document.getElementById('habit-form').reset();
    }

    saveHabits() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
        this.updateUserLevel(); // Update stats when habits change
        this.checkBadges(); // Check for new badges
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                              type === 'error' ? 'fa-exclamation-circle' : 
                              'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--accent-secondary)' : 
                        type === 'error' ? 'var(--accent-danger)' : 
                        'var(--accent-primary)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        const notificationContent = notification.querySelector('.notification-content');
        notificationContent.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Export/Import functionality (enhanced)
    exportData() {
        const data = {
            user: this.user,
            habits: this.habits,
            friends: this.friends,
            groups: this.groups,
            badges: this.badges,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'habit-tracker-data.json';
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Data exported successfully!', 'success');
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.version && data.user && data.habits) {
                this.user = data.user;
                this.habits = data.habits;
                this.friends = data.friends || [];
                this.groups = data.groups || [];
                this.badges = data.badges || [];
                
                this.saveUser();
                this.saveHabits();
                this.saveFriends();
                this.saveGroups();
                this.saveBadges();
                
                this.renderHabits();
                this.updateHeaderInfo();
                this.showNotification('Data imported successfully!', 'success');
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            this.showNotification('Error importing data. Please check the file format.', 'error');
        }
    }

    // Profile Management
    loadProfile() {
        document.getElementById('profile-username').textContent = this.user.username;
        document.getElementById('profile-bio').textContent = this.user.bio;
        this.updateUserLevel();
        this.renderBadges();
        
        // Update privacy settings
        document.getElementById('share-progress').checked = this.user.shareProgress;
        document.getElementById('public-profile').checked = this.user.publicProfile;
    }

    editProfile() {
        document.getElementById('edit-username').value = this.user.username;
        document.getElementById('edit-bio').value = this.user.bio;
        document.getElementById('edit-avatar-color').value = this.user.avatarColor;
        
        const modal = document.getElementById('edit-profile-modal');
        modal.classList.add('active');
    }

    saveProfile() {
        const formData = new FormData(document.getElementById('edit-profile-form'));
        
        this.user.username = formData.get('username');
        this.user.bio = formData.get('bio');
        this.user.avatarColor = formData.get('avatarColor');
        
        this.saveUser();
        this.updateHeaderInfo();
        this.loadProfile();
        this.closeModal('edit-profile-modal');
        this.showNotification('Profile updated successfully!', 'success');
    }

    // Friends Management
    loadFriends() {
        this.renderFriends();
        this.renderFriendRequests();
    }

    renderFriends() {
        const friendsGrid = document.getElementById('friends-grid');
        const noFriends = document.getElementById('no-friends');
        
        if (this.friends.length === 0) {
            friendsGrid.style.display = 'none';
            noFriends.style.display = 'block';
            return;
        }
        
        friendsGrid.style.display = 'grid';
        noFriends.style.display = 'none';
        
        friendsGrid.innerHTML = this.friends.map(friend => `
            <div class="friend-card">
                <div class="friend-header">
                    <div class="friend-avatar">
                        <img src="${this.generateAvatar(friend.username, friend.avatarColor)}" alt="${friend.username}">
                    </div>
                    <div class="friend-info">
                        <h4>${friend.username}</h4>
                        <div class="friend-stats">
                            Level ${friend.level} • ${friend.xp} XP
                        </div>
                    </div>
                </div>
                <p>${friend.bio}</p>
                <div class="friend-actions">
                    <button class="btn btn-primary" onclick="habitTracker.viewFriendProgress('${friend.id}')">
                        <i class="fas fa-chart-line"></i>
                        View Progress
                    </button>
                    <button class="btn btn-secondary" onclick="habitTracker.removeFriend('${friend.id}')">
                        <i class="fas fa-user-minus"></i>
                        Remove
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderFriendRequests() {
        const requestsGrid = document.getElementById('requests-grid');
        const noRequests = document.getElementById('no-requests');
        
        if (this.friendRequests.length === 0) {
            requestsGrid.style.display = 'none';
            noRequests.style.display = 'block';
            return;
        }
        
        requestsGrid.style.display = 'grid';
        noRequests.style.display = 'none';
        
        requestsGrid.innerHTML = this.friendRequests.map(request => `
            <div class="friend-card">
                <div class="friend-header">
                    <div class="friend-avatar">
                        <img src="${this.generateAvatar(request.username, request.avatarColor)}" alt="${request.username}">
                    </div>
                    <div class="friend-info">
                        <h4>${request.username}</h4>
                        <div class="friend-stats">
                            Level ${request.level} • ${request.xp} XP
                        </div>
                    </div>
                </div>
                <p>${request.bio}</p>
                <div class="friend-actions">
                    <button class="btn btn-success" onclick="habitTracker.acceptFriendRequest('${request.id}')">
                        <i class="fas fa-check"></i>
                        Accept
                    </button>
                    <button class="btn btn-secondary" onclick="habitTracker.declineFriendRequest('${request.id}')">
                        <i class="fas fa-times"></i>
                        Decline
                    </button>
                </div>
            </div>
        `).join('');
    }

    addFriend(userId) {
        // Simulate adding a friend (in real app, this would be a server request)
        const user = this.generateMockUser();
        user.id = userId;
        
        this.friends.push(user);
        this.saveFriends();
        this.showNotification(`Friend request sent to ${user.username}!`, 'success');
        this.addXP(5, 'Adding new friend');
        this.checkBadges();
    }

    acceptFriendRequest(requestId) {
        const request = this.friendRequests.find(r => r.id === requestId);
        if (request) {
            this.friends.push(request);
            this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
            this.saveFriends();
            this.saveFriendRequests();
            this.renderFriends();
            this.renderFriendRequests();
            this.showNotification(`You're now friends with ${request.username}!`, 'success');
            this.addXP(5, 'Accepting friend request');
            this.checkBadges();
        }
    }

    declineFriendRequest(requestId) {
        this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
        this.saveFriendRequests();
        this.renderFriendRequests();
        this.showNotification('Friend request declined', 'info');
    }

    removeFriend(friendId) {
        if (confirm('Are you sure you want to remove this friend?')) {
            this.friends = this.friends.filter(f => f.id !== friendId);
            this.saveFriends();
            this.renderFriends();
            this.showNotification('Friend removed', 'info');
        }
    }

    // Groups Management
    loadGroups() {
        this.renderGroups();
        this.populateGroupHabits();
    }

    renderGroups() {
        const groupsGrid = document.getElementById('groups-grid');
        const noGroups = document.getElementById('no-groups');
        
        if (this.groups.length === 0) {
            groupsGrid.style.display = 'none';
            noGroups.style.display = 'block';
            return;
        }
        
        groupsGrid.style.display = 'grid';
        noGroups.style.display = 'none';
        
        groupsGrid.innerHTML = this.groups.map(group => {
            const habit = this.habits.find(h => h.id === group.habitId);
            const leaderboard = this.generateGroupLeaderboard(group);
            
            return `
                <div class="group-card">
                    <div class="group-header">
                        <h3 class="group-name">${group.name}</h3>
                        <p class="group-description">${group.description}</p>
                    </div>
                    
                    ${habit ? `<div class="group-habit">📋 Competing in: ${habit.name}</div>` : ''}
                    
                    <div class="group-members">
                        <strong>Members:</strong> ${group.members.length}
                    </div>
                    
                    <div class="group-leaderboard">
                        <h4>Leaderboard</h4>
                        ${leaderboard.map((member, index) => `
                            <div class="leaderboard-item">
                                <span class="leaderboard-position">#${index + 1}</span>
                                <div class="leaderboard-user">
                                    <div class="leaderboard-avatar">
                                        <img src="${this.generateAvatar(member.username, member.avatarColor)}" alt="${member.username}">
                                    </div>
                                    <span>${member.username}</span>
                                </div>
                                <span class="leaderboard-xp">${member.weeklyXP || 0} XP</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="friend-actions">
                        ${group.createdBy === this.user.id ? 
                            `<button class="btn btn-secondary" onclick="habitTracker.deleteGroup('${group.id}')">
                                <i class="fas fa-trash"></i>
                                Delete Group
                            </button>` :
                            `<button class="btn btn-secondary" onclick="habitTracker.leaveGroup('${group.id}')">
                                <i class="fas fa-sign-out-alt"></i>
                                Leave Group
                            </button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    showCreateGroupModal() {
        this.populateGroupHabits();
        const modal = document.getElementById('create-group-modal');
        modal.classList.add('active');
    }

    populateGroupHabits() {
        const select = document.getElementById('group-habit');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select a habit to compete with</option>' +
            this.habits.map(habit => `
                <option value="${habit.id}">${habit.name} (${habit.frequency})</option>
            `).join('');
    }

    createGroup() {
        const formData = new FormData(document.getElementById('create-group-form'));
        
        const group = {
            id: Date.now().toString(),
            name: formData.get('groupName'),
            description: formData.get('description'),
            habitId: formData.get('habitId'),
            privacy: formData.get('privacy'),
            createdBy: this.user.id,
            createdAt: new Date().toISOString(),
            members: [{ ...this.user, weeklyXP: 0 }]
        };

        this.groups.push(group);
        this.saveGroups();
        this.renderGroups();
        this.closeModal('create-group-modal');
        this.showNotification('Group created successfully!', 'success');
        this.addXP(15, 'Creating habit group');
        this.checkBadges();
    }

    generateGroupLeaderboard(group) {
        return group.members
            .sort((a, b) => (b.weeklyXP || 0) - (a.weeklyXP || 0))
            .slice(0, 5);
    }

    deleteGroup(groupId) {
        if (confirm('Are you sure you want to delete this group?')) {
            this.groups = this.groups.filter(g => g.id !== groupId);
            this.saveGroups();
            this.renderGroups();
            this.showNotification('Group deleted successfully!', 'success');
        }
    }

    leaveGroup(groupId) {
        if (confirm('Are you sure you want to leave this group?')) {
            const group = this.groups.find(g => g.id === groupId);
            if (group) {
                group.members = group.members.filter(m => m.id !== this.user.id);
                this.saveGroups();
                this.renderGroups();
                this.showNotification('You left the group', 'info');
            }
        }
    }

    // Reports and Analytics
    loadReports() {
        this.updateReports('week');
    }

    updateReports(period) {
        const stats = this.calculateStats(period);
        
        document.getElementById('completion-rate').textContent = `${stats.completionRate}%`;
        document.getElementById('current-streak').textContent = `${stats.currentStreak} days`;
        document.getElementById('xp-earned').textContent = `${stats.xpEarned} XP`;
        document.getElementById('best-habit').textContent = stats.bestHabit || '-';
    }

    calculateStats(period) {
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        const dailyHabits = this.habits.filter(h => h.frequency === 'daily');
        let totalPossible = 0;
        let totalCompleted = 0;
        let bestHabit = null;
        let maxCompletions = 0;

        dailyHabits.forEach(habit => {
            const daysInPeriod = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
            totalPossible += daysInPeriod;
            
            const completedInPeriod = habit.completedDates.filter(date => {
                const completedDate = new Date(date);
                return completedDate >= startDate && completedDate <= now;
            }).length;
            
            totalCompleted += completedInPeriod;
            
            if (completedInPeriod > maxCompletions) {
                maxCompletions = completedInPeriod;
                bestHabit = habit.name;
            }
        });

        const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
        const currentStreak = this.getMaxStreak();
        
        // Calculate XP earned in period (simplified)
        const xpEarned = Math.floor(totalCompleted * 5);

        return {
            completionRate,
            currentStreak,
            xpEarned,
            bestHabit
        };
    }

    // Discover Users
    loadDiscoverUsers() {
        this.renderDiscoverUsers('all');
    }

    searchUsers() {
        const query = document.getElementById('user-search').value.toLowerCase();
        if (query.length < 2) {
            this.showNotification('Please enter at least 2 characters', 'error');
            return;
        }
        
        // Simulate user search (in real app, this would be a server request)
        const mockUsers = this.generateMockUsers(5);
        const filteredUsers = mockUsers.filter(user => 
            user.username.toLowerCase().includes(query) ||
            user.bio.toLowerCase().includes(query)
        );
        
        this.renderUserGrid(filteredUsers);
    }

    filterUsers(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderDiscoverUsers(filter);
    }

    renderDiscoverUsers(filter) {
        let users = [];
        
        switch (filter) {
            case 'all':
                users = this.generateMockUsers(8);
                break;
            case 'similar':
                users = this.generateMockUsers(5);
                break;
            case 'top':
                users = this.generateMockUsers(6);
                // Sort by XP for top performers
                users.sort((a, b) => b.xp - a.xp);
                break;
        }
        
        this.renderUserGrid(users);
    }

    renderUserGrid(users) {
        const usersGrid = document.getElementById('users-grid');
        
        usersGrid.innerHTML = users.map(user => `
            <div class="user-card">
                <div class="user-card-avatar">
                    <img src="${this.generateAvatar(user.username, user.avatarColor)}" alt="${user.username}">
                </div>
                <h4>${user.username}</h4>
                <p class="user-card-bio">${user.bio}</p>
                <div class="user-card-stats">
                    <div class="user-card-stat">
                        <div class="user-card-stat-number">${user.level}</div>
                        <div>Level</div>
                    </div>
                    <div class="user-card-stat">
                        <div class="user-card-stat-number">${user.xp}</div>
                        <div>XP</div>
                    </div>
                    <div class="user-card-stat">
                        <div class="user-card-stat-number">${user.habits || 0}</div>
                        <div>Habits</div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="btn btn-primary" onclick="habitTracker.sendFriendRequest('${user.id}')">
                        <i class="fas fa-user-plus"></i>
                        Add Friend
                    </button>
                </div>
            </div>
        `).join('');
    }

    sendFriendRequest(userId) {
        // Simulate sending friend request
        const user = this.generateMockUser();
        user.id = userId;
        
        // Add to friend requests (simulate receiving a request back)
        this.friendRequests.push(user);
        this.saveFriendRequests();
        
        this.showNotification('Friend request sent!', 'success');
    }

    // Utility Methods
    switchTab(tabId) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        this.currentCommentHabitId = null;
    }

    generateAvatar(username, color) {
        const initial = username.charAt(0).toUpperCase();
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E${initial}%3C/text%3E%3C/svg%3E`;
    }

    generateMockUser() {
        const usernames = ['Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Avery', 'Quinn'];
        const bios = [
            'Fitness enthusiast and book lover',
            'Learning new skills every day',
            'Building better habits for a better life',
            'Focused on health and productivity',
            'Always growing and improving',
            'Passionate about self-development',
            'Striving for consistency and growth',
            'Mindful living and positive thinking'
        ];
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
        
        const username = usernames[Math.floor(Math.random() * usernames.length)];
        const bio = bios[Math.floor(Math.random() * bios.length)];
        const avatarColor = colors[Math.floor(Math.random() * colors.length)];
        const xp = Math.floor(Math.random() * 500) + 50;
        
        return {
            id: 'user-' + Date.now() + Math.random(),
            username: username + Math.floor(Math.random() * 100),
            bio,
            avatarColor,
            xp,
            level: Math.floor(xp / 100) + 1,
            habits: Math.floor(Math.random() * 10) + 1,
            weeklyXP: Math.floor(Math.random() * 100)
        };
    }

    generateMockUsers(count) {
        return Array.from({ length: count }, () => this.generateMockUser());
    }

    viewFriendProgress(friendId) {
        // Simulate viewing friend's progress
        const friend = this.friends.find(f => f.id === friendId);
        if (friend) {
            this.showNotification(`Viewing ${friend.username}'s progress! (Feature coming soon)`, 'info');
        }
    }

    // Storage Methods
    saveUser() {
        localStorage.setItem('user', JSON.stringify(this.user));
    }

    saveFriends() {
        localStorage.setItem('friends', JSON.stringify(this.friends));
    }

    saveFriendRequests() {
        localStorage.setItem('friendRequests', JSON.stringify(this.friendRequests));
    }

    saveGroups() {
        localStorage.setItem('groups', JSON.stringify(this.groups));
    }

    saveBadges() {
        // Remove condition functions before saving (they can't be serialized)
        const badgesToSave = this.badges.map(badge => {
            const { condition, ...badgeWithoutCondition } = badge;
            return badgeWithoutCondition;
        });
        localStorage.setItem('badges', JSON.stringify(badgesToSave));
    }
}

// Handler functions to prevent duplicate event listeners
function handleHabitFormSubmit(e) {
    console.log('Habit form submitted via event listener');
    e.preventDefault();
    window.habitTracker.addHabit();
}

function handleCreateGroupSubmit(e) {
    console.log('Create group form submitted');
    e.preventDefault();
    window.habitTracker.createGroup();
}

function handleEditProfileSubmit(e) {
    console.log('Edit profile form submitted');
    e.preventDefault();
    window.habitTracker.saveProfile();
}

function handleCommentSubmit(e) {
    console.log('Comment form submitted');
    e.preventDefault();
    window.habitTracker.saveComment();
}

// Initialize the application
let habitTracker;
let eventListenersInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    try {
        habitTracker = new HabitTracker();
        
        // Make habitTracker globally accessible for onclick handlers
        window.habitTracker = habitTracker;
        
        console.log('Habit Tracker initialized successfully');
        
        // Set up form event listeners only once
        if (!eventListenersInitialized) {
            setupFormEventListeners();
            setupGlobalEventListeners();
            eventListenersInitialized = true;
            console.log('Event listeners initialized');
        }
        
        // Add some sample data for demo purposes
        setTimeout(() => {
            if (habitTracker.habits.length === 0) {
                addSampleData();
            }
        }, 500);
    } catch (error) {
        console.error('Error initializing Habit Tracker:', error);
    }
});

function setupFormEventListeners() {
    // Set up form event listeners after DOM is ready (only once)
    const habitForm = document.getElementById('habit-form');
    if (habitForm) {
        console.log('Setting up habit-form event listener');
        habitForm.addEventListener('submit', handleHabitFormSubmit);
    } else {
        console.error('habit-form not found in DOM');
    }

    const createGroupForm = document.getElementById('create-group-form');
    if (createGroupForm) {
        console.log('Setting up create-group-form event listener');
        createGroupForm.addEventListener('submit', handleCreateGroupSubmit);
    }

    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        console.log('Setting up edit-profile-form event listener');
        editProfileForm.addEventListener('submit', handleEditProfileSubmit);
    }

    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        console.log('Setting up comment-form event listener');
        commentForm.addEventListener('submit', handleCommentSubmit);
    }
}

function setupGlobalEventListeners() {
    // Set up template cards event delegation (only once)
    document.body.addEventListener('click', (e) => {
        // Template cards
        if (e.target.closest('.template-card') && e.target.tagName === 'BUTTON') {
            console.log('Template card button clicked');
            const card = e.target.closest('.template-card');
            const templateData = card.dataset.template;
            if (templateData) {
                try {
                    const template = JSON.parse(templateData);
                    window.habitTracker.addHabitFromTemplate(template);
                } catch (error) {
                    console.error('Error parsing template data:', error);
                }
            }
        }
        
        // Tab navigation
        if (e.target.classList.contains('tab-btn')) {
            window.habitTracker.switchTab(e.target.dataset.tab);
        }
        
        // Filter buttons
        if (e.target.classList.contains('filter-btn')) {
            window.habitTracker.filterUsers(e.target.dataset.filter);
        }
        
        // Mood selector
        if (e.target.classList.contains('mood-btn')) {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    });
}

function addSampleData() {
    const sampleHabits = [
        {
            id: 'sample-1',
            name: 'Drink 8 glasses of water',
            category: 'health',
            frequency: 'daily',
            notes: 'Stay hydrated throughout the day for better health',
            createdAt: new Date().toISOString(),
            completedDates: [],
            streak: 0,
            comments: []
        },
        {
            id: 'sample-2',
            name: 'Read for 30 minutes',
            category: 'learning',
            frequency: 'daily',
            notes: 'Expand knowledge and improve focus',
            createdAt: new Date().toISOString(),
            completedDates: [new Date().toDateString()],
            streak: 1,
            comments: [
                {
                    date: new Date().toDateString(),
                    text: 'Started reading "Atomic Habits" today. Great insights!',
                    mood: 'excellent',
                    timestamp: new Date().toISOString()
                }
            ]
        }
    ];
    
    // Add sample friend requests
    const sampleRequests = [
        {
            id: 'friend-1',
            username: 'FitnessAlex',
            bio: 'Passionate about health and fitness!',
            avatarColor: '#10b981',
            xp: 250,
            level: 3,
            habits: 5
        }
    ];
    
    habitTracker.habits = sampleHabits;
    habitTracker.friendRequests = sampleRequests;
    habitTracker.user.xp = 75; // Give some starting XP
    habitTracker.user.level = 1;
    
    habitTracker.saveHabits();
    habitTracker.saveFriendRequests();
    habitTracker.saveUser();
    habitTracker.renderHabits();
    habitTracker.updateHeaderInfo();
    habitTracker.checkBadges();
}

// Keyboard navigation (enhanced)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                habitTracker.showPage('dashboard');
                break;
            case '2':
                e.preventDefault();
                habitTracker.showPage('add-habit');
                break;
            case '3':
                e.preventDefault();
                habitTracker.showPage('templates');
                break;
            case '4':
                e.preventDefault();
                habitTracker.showPage('groups');
                break;
            case '5':
                e.preventDefault();
                habitTracker.showPage('friends');
                break;
            case '6':
                e.preventDefault();
                habitTracker.showPage('reports');
                break;
            case '7':
                e.preventDefault();
                habitTracker.showPage('discover');
                break;
            case '8':
                e.preventDefault();
                habitTracker.showPage('profile');
                break;
        }
    }
    
    // Close modals with Escape key
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        habitTracker.currentCommentHabitId = null;
    }
});

// Click outside modal to close
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        habitTracker.currentCommentHabitId = null;
    }
});

// Auto-save privacy settings
document.addEventListener('change', (e) => {
    if (e.target.id === 'share-progress') {
        habitTracker.user.shareProgress = e.target.checked;
        habitTracker.saveUser();
    }
    if (e.target.id === 'public-profile') {
        habitTracker.user.publicProfile = e.target.checked;
        habitTracker.saveUser();
    }
});

// Service Worker registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker registration would go here for PWA features
        console.log('Habit Tracker app loaded successfully!');
    });
}

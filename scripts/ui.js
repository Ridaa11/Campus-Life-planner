// ui.js - UI rendering and updates

import { getFilteredSortedTasks, getSettings, calculateStats, getSearchPattern } from './state.js';
import { highlightMatches } from './validators.js';

/**
 * Render tasks list
 */
export function renderTasks() {
    const container = document.getElementById('tasks-container');
    const tasks = getFilteredSortedTasks();
    const searchPattern = getSearchPattern();
    const settings = getSettings();
    
    if (tasks.length === 0) {
        container.innerHTML = '<p class="empty-state">No tasks found. Try adjusting your search or add a new task!</p>';
        return;
    }
    
    container.innerHTML = tasks.map(task => {
        const title = searchPattern ? highlightMatches(task.title, searchPattern) : task.title;
        const tag = searchPattern ? highlightMatches(task.tag, searchPattern) : task.tag;
        const duration = formatDuration(task.duration, settings.timeUnit);
        
        return `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-header">
                    <h3 class="task-title">${title}</h3>
                    <span class="task-tag">${tag}</span>
                </div>
                <div class="task-details">
                    <div class="task-detail">
                        <span>📅</span>
                        <span>Due: ${formatDate(task.dueDate)}</span>
                    </div>
                    <div class="task-detail">
                        <span>⏱️</span>
                        <span>Duration: ${duration}</span>
                    </div>
                    <div class="task-detail">
                        <span>🕒</span>
                        <span>Updated: ${formatDateTime(task.updatedAt)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-edit" data-id="${task.id}" aria-label="Edit ${task.title}">
                        Edit
                    </button>
                    <button class="btn-delete" data-id="${task.id}" aria-label="Delete ${task.title}">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render dashboard statistics
 */
export function renderStats() {
    const stats = calculateStats();
    const settings = getSettings();
    
    // Update stat cards
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-hours').textContent = stats.totalHours;
    document.getElementById('stat-top-tag').textContent = stats.topTag;
    document.getElementById('stat-recent').textContent = stats.recentTasks;
    
    // Update cap status
    updateCapStatus(stats.weeklyHours, settings.weeklyCap);
    
    // Update trend chart
    renderTrendChart(stats.trendData);
}

/**
 * Update weekly cap status
 */
function updateCapStatus(weeklyHours, cap) {
    const progress = document.getElementById('cap-progress');
    const status = document.getElementById('cap-status');
    
    const percentage = Math.min((weeklyHours / cap) * 100, 100);
    const remaining = cap - weeklyHours;
    
    progress.style.width = percentage + '%';
    progress.setAttribute('aria-valuenow', Math.round(percentage));
    
    if (weeklyHours <= cap) {
        progress.classList.remove('over-cap');
        status.className = 'under';
        status.setAttribute('aria-live', 'polite');
        status.textContent = `✓ ${weeklyHours.toFixed(1)} / ${cap} hours used. ${remaining.toFixed(1)} hours remaining.`;
    } else {
        progress.classList.add('over-cap');
        status.className = 'over';
        status.setAttribute('aria-live', 'assertive');
        status.textContent = `⚠️ Over cap! ${weeklyHours.toFixed(1)} / ${cap} hours. ${Math.abs(remaining).toFixed(1)} hours over.`;
    }
}

/**
 * Render trend chart
 */
function renderTrendChart(trendData) {
    const container = document.getElementById('trend-bars');
    const maxCount = Math.max(...trendData.map(d => d.count), 1);
    
    container.innerHTML = trendData.map(day => {
        const height = (day.count / maxCount) * 100;
        return `
            <div class="trend-bar" 
                 style="height: ${height}%" 
                 data-label="${day.label}"
                 title="${day.label}: ${day.count} tasks"
                 role="img"
                 aria-label="${day.label}: ${day.count} tasks">
            </div>
        `;
    }).join('');
}

/**
 * Show page
 */
export function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected page
    const page = document.getElementById(pageName);
    if (page) {
        page.classList.add('active');
    }
    
    // Update navigation active state
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });
}

/**
 * Show form error
 */
export function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorSpan = document.getElementById(fieldId + '-error');
    
    if (input) {
        input.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
    }
    
    if (errorSpan) {
        errorSpan.textContent = message;
    }
}

/**
 * Clear form error
 */
export function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorSpan = document.getElementById(fieldId + '-error');
    
    if (input) {
        input.classList.remove('error');
        input.setAttribute('aria-invalid', 'false');
    }
    
    if (errorSpan) {
        errorSpan.textContent = '';
    }
}

/**
 * Clear all form errors
 */
export function clearAllFormErrors() {
    ['task-title', 'task-duration', 'task-date', 'task-tag'].forEach(clearFieldError);
}

/**
 * Reset form
 */
export function resetForm() {
    const form = document.getElementById('task-form');
    form.reset();
    document.getElementById('task-id').value = '';
    document.getElementById('submit-btn').textContent = 'Add Task';
    document.getElementById('form-heading').textContent = 'Add New Task';
    clearAllFormErrors();
}

/**
 * Populate form with task data (for editing)
 */
export function populateForm(task) {
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-duration').value = task.duration;
    document.getElementById('task-date').value = task.dueDate;
    document.getElementById('task-tag').value = task.tag;
    document.getElementById('submit-btn').textContent = 'Update Task';
    document.getElementById('form-heading').textContent = 'Edit Task';
}

/**
 * Show status message
 */
export function showStatus(elementId, message, type = 'success') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.textContent = message;
    element.className = type;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        element.textContent = '';
        element.className = '';
    }, 5000);
}

/**
 * Format duration based on unit setting
 */
function formatDuration(minutes, unit) {
    if (unit === 'hours') {
        const hours = (minutes / 60).toFixed(1);
        return `${hours} ${hours === '1.0' ? 'hour' : 'hours'}`;
    }
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

/**
 * Format datetime for display
 */
function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Confirm action with user
 */
export function confirmAction(message) {
    return confirm(message);
}
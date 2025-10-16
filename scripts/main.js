// main.js - Campus Life Planner Main Logic

import * as state from './state.js';
import * as ui from './ui.js';
import { validateField, validateTask, compileRegex } from './validators.js';
import { exportToJSON, importFromJSON, clearAllData } from './Storage.js';

/**
 * Initialize the application
 */
function init() {
    state.initState();           // load state
    setupNavigation();           // nav links
    setupForm();                 // task form
    setupTaskActions();          // edit/delete
    setupSearch();               // regex search
    setupSorting();              // sort select
    setupSettings();             // settings, import/export
    setupCapControls();          // weekly cap
    setupKeyboardShortcuts();    // escape cancel

    // Initial render
    ui.showPage('dashboard');
    ui.renderStats();
    ui.renderTasks();
}

/**
 * Navigation handler
 */
function setupNavigation() {
    document.querySelectorAll('nav a[data-page]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const page = link.dataset.page;
            state.setCurrentPage(page);
            ui.showPage(page);

            if (page === 'dashboard') ui.renderStats();
            if (page === 'tasks') ui.renderTasks();
            if (page === 'add-task') ui.resetForm();
        });
    });
}

/**
 * Form handlers: validation & submission
 */
function setupForm() {
    const form = document.getElementById('task-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const fields = ['title', 'duration', 'date', 'tag'];

    // Real-time validation
    fields.forEach(name => {
        const input = document.getElementById(`task-${name}`);
        input.addEventListener('blur', () => validateFormField(name));
        input.addEventListener('input', () => ui.clearFieldError(`task-${name}`));
    });

    // Submit
    form.addEventListener('submit', e => {
        e.preventDefault();
        handleFormSubmit();
    });

    // Cancel
    cancelBtn.addEventListener('click', () => {
        ui.resetForm();
        state.setEditingTaskId(null);
        ui.showPage('tasks');
        ui.renderTasks();
    });
}

/**
 * Validate a single form field
 */
function validateFormField(name) {
    const input = document.getElementById(`task-${name}`);
    const value = input.value.trim();
    const validation = validateField(name, value);

    if (!validation.valid) {
        ui.showFieldError(`task-${name}`, validation.message);
        return false;
    }

    ui.clearFieldError(`task-${name}`);
    return true;
}

/**
 * Handle form submission (add/update task)
 */
function handleFormSubmit() {
    ui.clearAllFormErrors();

    const taskData = {
        title: document.getElementById('task-title').value.trim(),
        duration: document.getElementById('task-duration').value.trim(),
        dueDate: document.getElementById('task-date').value,
        tag: document.getElementById('task-tag').value.trim()
    };

    const validation = validateTask(taskData);
    if (!validation.valid) {
        Object.entries(validation.errors).forEach(([field, msg]) => {
            const fieldId = `task-${field === 'dueDate' ? 'date' : field}`;
            ui.showFieldError(fieldId, msg);
        });
        return;
    }

    const editingId = state.getEditingTaskId();
    if (editingId) {
        state.updateTask(editingId, { 
            ...taskData, 
            duration: parseFloat(taskData.duration) 
        });
        ui.showStatus('search-status', 'Task updated successfully!', 'success');
    } else {
        state.addTask({ ...taskData, duration: parseFloat(taskData.duration) });
        ui.showStatus('search-status', 'Task added successfully!', 'success');
    }

    ui.resetForm();
    state.setEditingTaskId(null);
    ui.showPage('tasks');
    ui.renderTasks();
    ui.renderStats();
}

/**
 * Setup task edit/delete buttons
 */
function setupTaskActions() {
    const container = document.getElementById('tasks-container');
    container.addEventListener('click', e => {
        const btn = e.target;
        const taskId = btn.dataset.id;
        if (!taskId) return;

        if (btn.classList.contains('btn-edit')) {
            const task = state.getTaskById(taskId);
            if (task) {
                state.setEditingTaskId(taskId);
                ui.populateForm(task);
                state.setCurrentPage('add-task');
                ui.showPage('add-task');
            }
        }

        if (btn.classList.contains('btn-delete')) {
            const task = state.getTaskById(taskId);
            if (task && ui.confirmAction(`Delete "${task.title}"?`)) {
                state.deleteTask(taskId);
                ui.renderTasks();
                ui.renderStats();
                ui.showStatus('search-status', 'Task deleted!', 'success');
            }
        }
    });
}

/**
 * Regex search setup
 */
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const caseSensitive = document.getElementById('case-sensitive');
    const status = document.getElementById('search-status');

    function performSearch() {
        const pattern = searchInput.value.trim();
        if (!pattern) {
            state.setSearchPattern(null);
            ui.renderTasks();
            status.textContent = '';
            status.className = '';
            return;
        }

        const flags = caseSensitive.checked ? 'g' : 'gi';
        const regex = compileRegex(pattern, flags);

        if (!regex) {
            status.textContent = '⚠️ Invalid regex pattern';
            status.className = 'error';
            state.setSearchPattern(null);
            ui.renderTasks();
            return;
        }

        state.setSearchPattern(regex);
        ui.renderTasks();
        const tasks = state.getFilteredSortedTasks();
        status.textContent = `✓ Found ${tasks.length} task(s)`;
        status.className = 'success';
    }

    searchInput.addEventListener('input', performSearch);
    caseSensitive.addEventListener('change', performSearch);
}

/**
 * Sorting handler
 */
function setupSorting() {
    const sortSelect = document.getElementById('sort-select');
    sortSelect.addEventListener('change', () => {
        state.setSortBy(sortSelect.value);
        ui.renderTasks();
    });
}

/**
 * Settings: import/export, units, clear data
 */
function setupSettings() {
    const timeUnit = document.getElementById('time-unit');
    const weeklyCap = document.getElementById('weekly-cap');
    const exportBtn = document.getElementById('export-btn');
    const importFile = document.getElementById('import-file');
    const clearDataBtn = document.getElementById('clear-data-btn');

    const settings = state.getSettings();
    timeUnit.value = settings.timeUnit;
    weeklyCap.value = settings.weeklyCap;

    timeUnit.addEventListener('change', () => {
        state.updateSettings({ timeUnit: timeUnit.value });
        ui.renderTasks();
        ui.renderStats();
    });

    exportBtn.addEventListener('click', () => {
        const blob = new Blob([exportToJSON(state.getTasks())], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campus-planner-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        ui.showStatus('settings-status', 'Data exported successfully!', 'success');
    });

    importFile.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = evt => {
            const result = importFromJSON(evt.target.result);
            if (result.success && ui.confirmAction('Replace all existing tasks?')) {
                state.replaceTasks(result.data);
                ui.renderTasks();
                ui.renderStats();
                ui.showStatus('settings-status', `Imported ${result.data.length} tasks!`, 'success');
            } else if (!result.success) {
                ui.showStatus('settings-status', `Import failed: ${result.errors.join(', ')}`, 'error');
            }
            importFile.value = '';
        };
        reader.readAsText(file);
    });

    clearDataBtn.addEventListener('click', () => {
        if (ui.confirmAction('Delete ALL tasks and settings?')) {
            if (clearAllData()) {
                state.clearTasks();
                ui.renderTasks();
                ui.renderStats();
                ui.showStatus('settings-status', 'All data cleared!', 'success');
            }
        }
    });
}

/**
 * Weekly cap controls
 */
function setupCapControls() {
    const capInput = document.getElementById('weekly-cap');
    const setCapBtn = document.getElementById('set-cap-btn');

    setCapBtn.addEventListener('click', () => {
        const cap = parseFloat(capInput.value);
        if (cap > 0) {
            state.updateSettings({ weeklyCap: cap });
            ui.renderStats();
            ui.showStatus('cap-status', `Weekly cap set to ${cap} hours`, 'success');
        }
    });
}

/**
 * Keyboard shortcuts (Escape to cancel edit)
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (state.getCurrentPage() === 'add-task' && state.getEditingTaskId()) {
                ui.resetForm();
                state.setEditingTaskId(null);
                state.setCurrentPage('tasks');
                ui.showPage('tasks');
                ui.renderTasks();
            }
        }
    });
}

// DOM ready
document.addEventListener('DOMContentLoaded', init);

// storage.js - Handles localStorage persistence

const STORAGE_KEY = 'campus-planner:tasks';
const SETTINGS_KEY = 'campus-planner:settings';

/**
 * Load tasks from localStorage
 * @returns {Array} Array of task objects
 */
export function loadTasks() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading tasks:', error);
        return [];
    }
}

/**
 * Save tasks to localStorage
 * @param {Array} tasks - Array of task objects
 * @returns {boolean} Success status
 */
export function saveTasks(tasks) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error('Error saving tasks:', error);
        return false;
    }
}

/**
 * Load settings from localStorage
 * @returns {Object} Settings object
 */
export function loadSettings() {
    try {
        const data = localStorage.getItem(SETTINGS_KEY);
        return data ? JSON.parse(data) : {
            timeUnit: 'minutes',
            weeklyCap: 40
        };
    } catch (error) {
        console.error('Error loading settings:', error);
        return { timeUnit: 'minutes', weeklyCap: 40 };
    }
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings object
 * @returns {boolean} Success status
 */
export function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

/**
 * Clear all data from localStorage
 */
export function clearAllData() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing data:', error);
        return false;
    }
}

/**
 * Validate imported JSON structure
 * @param {Array} data - Data to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateImportData(data) {
    const errors = [];
    
    if (!Array.isArray(data)) {
        errors.push('Data must be an array');
        return { valid: false, errors };
    }
    
    data.forEach((task, index) => {
        if (!task.id) errors.push(`Task ${index}: missing id`);
        if (!task.title) errors.push(`Task ${index}: missing title`);
        if (typeof task.duration !== 'number') errors.push(`Task ${index}: invalid duration`);
        if (!task.dueDate) errors.push(`Task ${index}: missing dueDate`);
        if (!task.tag) errors.push(`Task ${index}: missing tag`);
        if (!task.createdAt) errors.push(`Task ${index}: missing createdAt`);
        if (!task.updatedAt) errors.push(`Task ${index}: missing updatedAt`);
    });
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Export tasks as JSON
 * @param {Array} tasks - Tasks to export
 * @returns {string} JSON string
 */
export function exportToJSON(tasks) {
    return JSON.stringify(tasks, null, 2);
}

/**
 * Import tasks from JSON string
 * @param {string} jsonString - JSON string to parse
 * @returns {Object} { success: boolean, data: Array, errors: Array }
 */
export function importFromJSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        const validation = validateImportData(data);
        
        if (!validation.valid) {
            return {
                success: false,
                data: null,
                errors: validation.errors
            };
        }
        
        return {
            success: true,
            data,
            errors: []
        };
    } catch (error) {
        return {
            success: false,
            data: null,
            errors: ['Invalid JSON format: ' + error.message]
        };
    }
}
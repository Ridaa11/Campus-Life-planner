// validators.js - Regex validation rules

/**
 * Validation patterns with explanations
 */
export const PATTERNS = {
    // Rule 1: Title - no leading/trailing spaces, no double spaces
    title: {
        regex: /^\S(?:.*\S)?$/,
        message: 'No leading/trailing spaces allowed. Must contain at least one non-space character.',
        test: (value) => {
            if (!value.trim()) return false;
            if (value !== value.trim()) return false;
            if (/\s{2,}/.test(value)) return false;
            return PATTERNS.title.regex.test(value);
        }
    },
    
    // Rule 2: Duration - whole or decimal numbers (e.g., 30 or 45.5)
    duration: {
        regex: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
        message: 'Enter a valid number (e.g., 30 or 45.5)',
        test: (value) => PATTERNS.duration.regex.test(value)
    },
    
    // Rule 3: Date - YYYY-MM-DD format with valid ranges
    date: {
        regex: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
        message: 'Enter date in YYYY-MM-DD format (e.g., 2025-10-20)',
        test: (value) => {
            if (!PATTERNS.date.regex.test(value)) return false;
            // Additional validation: check if date is valid
            const date = new Date(value);
            return date instanceof Date && !isNaN(date);
        }
    },
    
    // Rule 4: Tag - letters, spaces, hyphens only
    tag: {
        regex: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
        message: 'Use only letters, spaces, and hyphens (e.g., Study-Group, Homework)',
        test: (value) => PATTERNS.tag.regex.test(value)
    },
    
    // Advanced Rule 5: Duplicate word detection (back-reference)
    // Used for detecting repeated words in title (e.g., "the the assignment")
    duplicateWord: {
        regex: /\b(\w+)\s+\1\b/i,
        message: 'Duplicate word detected',
        test: (value) => !PATTERNS.duplicateWord.regex.test(value)
    }
};

/**
 * Validate a single field
 * @param {string} field - Field name
 * @param {string} value - Field value
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateField(field, value) {
    const pattern = PATTERNS[field];
    
    if (!pattern) {
        return { valid: true, message: '' };
    }
    
    const valid = pattern.test(value);
    
    return {
        valid,
        message: valid ? '' : pattern.message
    };
}

/**
 * Validate entire task object
 * @param {Object} task - Task object to validate
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validateTask(task) {
    const errors = {};
    
    // Validate title
    const titleValidation = validateField('title', task.title);
    if (!titleValidation.valid) {
        errors.title = titleValidation.message;
    }
    
    // Check for duplicate words in title (advanced regex)
    const dupValidation = validateField('duplicateWord', task.title);
    if (!dupValidation.valid) {
        errors.title = dupValidation.message;
    }
    
    // Validate duration
    const durationValidation = validateField('duration', task.duration);
    if (!durationValidation.valid) {
        errors.duration = durationValidation.message;
    }
    
    // Validate date
    const dateValidation = validateField('date', task.dueDate);
    if (!dateValidation.valid) {
        errors.dueDate = dateValidation.message;
    }
    
    // Validate tag
    const tagValidation = validateField('tag', task.tag);
    if (!tagValidation.valid) {
        errors.tag = tagValidation.message;
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Safe regex compiler for search
 * @param {string} input - Regex pattern string
 * @param {string} flags - Regex flags
 * @returns {RegExp|null} Compiled regex or null if invalid
 */
export function compileRegex(input, flags = 'i') {
    try {
        return input ? new RegExp(input, flags) : null;
    } catch (error) {
        return null;
    }
}

/**
 * Common search patterns for Campus Life Planner
 */
export const SEARCH_PATTERNS = {
    // Find tasks with specific tags (e.g., @homework)
    tagSearch: /@(\w+)/,
    
    // Find time patterns (e.g., 14:30)
    timePattern: /\b\d{2}:\d{2}\b/,
    
    // Find specific keywords (case-insensitive)
    keyword: (word) => new RegExp(`\\b${word}\\b`, 'i'),
    
    // Find tasks with duration in certain range
    durationRange: /(\d+)-(\d+)\s*min/,
    
    // Find dates in text
    dateInText: /\b\d{4}-\d{2}-\d{2}\b/
};

/**
 * Highlight text matches with <mark> tags
 * @param {string} text - Text to highlight
 * @param {RegExp} regex - Regex pattern
 * @returns {string} Text with <mark> tags
 */
export function highlightMatches(text, regex) {
    if (!regex || !text) return text;
    
    try {
        // Escape HTML to prevent XSS
        const escaped = text.replace(/[&<>"']/g, (char) => {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return map[char];
        });
        
        // Add <mark> tags around matches
        return escaped.replace(regex, (match) => `<mark>${match}</mark>`);
    } catch (error) {
        return text;
    }
}
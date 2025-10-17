// state.js - Application state management

import { loadTasks, saveTasks, loadSettings, saveSettings } from './Storage.js';
const state = {
    tasks: [],
    settings: {
        timeUnit: 'minutes',
        weeklyCap: 40
    },
    currentPage: 'dashboard',
    editingTaskId: null,
    searchPattern: null,
    sortBy: 'date-desc'
};

export function initState() {
    state.tasks = loadTasks();
    state.settings = loadSettings();
}

/**
 * Get all tasks
 * @returns {Array} Array of tasks
 */
export function getTasks() {
    return [...state.tasks];
}

/**
 * Get a single task by ID
 * @param {string} id - Task ID
 * @returns {Object|null} Task object or null
 */
export function getTaskById(id) {
    return state.tasks.find(task => task.id === id) || null;
}


export function addTask(taskData) {
    const now = new Date().toISOString();
    const task = {
        id: generateId(),
        title: taskData.title.trim(),
        duration: parseFloat(taskData.duration),
        dueDate: taskData.dueDate,
        tag: taskData.tag.trim(),
        createdAt: now,
        updatedAt: now
    };
    
    state.tasks.push(task);
    saveTasks(state.tasks);
    
    return task;
}


export function updateTask(id, updates) {
    const index = state.tasks.findIndex(task => task.id === id);
    
    if (index === -1) return null;
    
    state.tasks[index] = {
        ...state.tasks[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    saveTasks(state.tasks);
    
    return state.tasks[index];
}


export function deleteTask(id) {
    const initialLength = state.tasks.length;
    state.tasks = state.tasks.filter(task => task.id !== id);
    
    if (state.tasks.length < initialLength) {
        saveTasks(state.tasks);
        return true;
    }
    
    return false;
}


export function replaceTasks(tasks) {
    state.tasks = tasks;
    saveTasks(state.tasks);
}


export function clearTasks() {
    state.tasks = [];
    saveTasks(state.tasks);
}


export function getSettings() {
    return { ...state.settings };
}


export function updateSettings(updates) {
    state.settings = {
        ...state.settings,
        ...updates
    };
    saveSettings(state.settings);
}


export function setCurrentPage(page) {
    state.currentPage = page;
}


export function getCurrentPage() {
    return state.currentPage;
}


export function setEditingTaskId(id) {
    state.editingTaskId = id;
}


export function getEditingTaskId() {
    return state.editingTaskId;
}


export function setSearchPattern(pattern) {
    state.searchPattern = pattern;
}


export function getSearchPattern() {
    return state.searchPattern;
}


export function setSortBy(sortBy) {
    state.sortBy = sortBy;
}


export function getSortBy() {
    return state.sortBy;
}


function generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}


export function getFilteredSortedTasks() {
    let tasks = [...state.tasks];
    
    
    if (state.searchPattern) {
        tasks = tasks.filter(task => {
            return state.searchPattern.test(task.title) ||
                   state.searchPattern.test(task.tag) ||
                   state.searchPattern.test(task.dueDate);
        });
    }
    
    
    tasks.sort((a, b) => {
        switch (state.sortBy) {
            case 'date-asc':
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'date-desc':
                return new Date(b.dueDate) - new Date(a.dueDate);
            case 'title-asc':
                return a.title.localeCompare(b.title);
            case 'title-desc':
                return b.title.localeCompare(a.title);
            case 'duration-asc':
                return a.duration - b.duration;
            case 'duration-desc':
                return b.duration - a.duration;
            default:
                return 0;
        }
    });
    
    return tasks;
}


export function calculateStats() {
    const tasks = state.tasks;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const total = tasks.length;
    
    
    const totalMinutes = tasks.reduce((sum, task) => sum + task.duration, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    
   
    const tagCounts = {};
    tasks.forEach(task => {
        tagCounts[task.tag] = (tagCounts[task.tag] || 0) + 1;
    });
    const topTag = Object.keys(tagCounts).length > 0
        ? Object.keys(tagCounts).reduce((a, b) => tagCounts[a] > tagCounts[b] ? a : b)
        : '—';
    
    
    const recentTasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= sevenDaysAgo && taskDate <= now;
    }).length;
    
    
    const weeklyMinutes = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= sevenDaysAgo && taskDate <= now;
    }).reduce((sum, task) => sum + task.duration, 0);
    const weeklyHours = weeklyMinutes / 60;
    
    
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayTasks = tasks.filter(task => task.dueDate === dateStr);
        trendData.push({
            date: dateStr,
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
            count: dayTasks.length
        });
    }
    
    return {
        total,
        totalHours,
        topTag,
        recentTasks,
        weeklyHours,
        trendData
    };
}

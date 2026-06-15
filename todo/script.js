document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ==========================================================================
    // STATE MANAGEMENT
    // ==========================================================================
    let tasks = JSON.parse(localStorage.getItem('tasks')) || getInitialTasks();
    let currentFilter = 'all';
    let searchQuery = '';

    // Initial mock data if user starts with an empty list
    function getInitialTasks() {
        return [
            {
                id: Date.now(),
                text: 'Welcome to TaskStream! Create your first task above.',
                completed: false,
                priority: 'high',
                category: 'personal',
                dueDate: new Date().toISOString().split('T')[0]
            },
            {
                id: Date.now() + 1,
                text: 'Double click on a task text to edit it in place.',
                completed: false,
                priority: 'medium',
                category: 'work',
                dueDate: ''
            },
            {
                id: Date.now() + 2,
                text: 'Filters and search sync automatically.',
                completed: true,
                priority: 'low',
                category: 'shopping',
                dueDate: ''
            }
        ];
    }

    // Save tasks to LocalStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateStatsAndProgress();
    }

    // ==========================================================================
    // DOM ELEMENTS
    // ==========================================================================
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoCategory = document.getElementById('todo-category');
    const todoPriority = document.getElementById('todo-priority');
    const todoDate = document.getElementById('todo-date');
    const todoList = document.getElementById('todo-list');
    
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    const totalCountEl = document.getElementById('total-count');
    const completedCountEl = document.getElementById('completed-count');
    const tasksLeftEl = document.getElementById('tasks-left');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressPercentageEl = document.getElementById('progress-percentage');
    const emptyStateEl = document.getElementById('empty-state');
    
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const toastContainer = document.getElementById('toast-container');

    // ==========================================================================
    // RENDERING LOGIC
    // ==========================================================================
    function renderTasks() {
        // Clear list
        todoList.innerHTML = '';

        // Filter tasks
        const filteredTasks = tasks.filter(task => {
            // Apply Status Filter
            const matchesStatus = 
                currentFilter === 'all' || 
                (currentFilter === 'active' && !task.completed) || 
                (currentFilter === 'completed' && task.completed);
                
            // Apply Search Query
            const cleanQuery = searchQuery.toLowerCase().trim();
            const matchesSearch = 
                task.text.toLowerCase().includes(cleanQuery) || 
                task.category.toLowerCase().includes(cleanQuery) ||
                task.priority.toLowerCase().includes(cleanQuery);
                
            return matchesStatus && matchesSearch;
        });

        // Show/Hide Empty State
        if (filteredTasks.length === 0) {
            emptyStateEl.classList.add('active');
        } else {
            emptyStateEl.classList.remove('active');
        }

        // Sort Tasks: uncompleted tasks first, then sort by priority weight or ID
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        });

        // Generate DOM elements
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `todo-item ${task.completed ? 'completed' : ''}`;
            li.setAttribute('data-id', task.id);

            // Calculate if overdue
            let isOverdue = false;
            let dateString = '';
            if (task.dueDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const taskDate = new Date(task.dueDate);
                taskDate.setHours(0, 0, 0, 0);
                isOverdue = taskDate < today && !task.completed;
                
                // Format Date nicely
                const options = { month: 'short', day: 'numeric' };
                dateString = new Date(task.dueDate).toLocaleDateString('en-US', options);
            }

            const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
            const categoryLabel = task.category.charAt(0).toUpperCase() + task.category.slice(1);

            li.innerHTML = `
                <div class="todo-item-left">
                    <label class="todo-checkbox-wrapper" aria-label="Toggle task completion">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} class="task-checkbox">
                        <span class="checkmark"></span>
                    </label>
                    <div class="todo-item-content">
                        <span class="todo-text" title="Double click to edit">${escapeHTML(task.text)}</span>
                        <div class="todo-tags-wrapper">
                            <span class="todo-badge badge-category">
                                <span class="category-dot ${task.category}"></span>
                                ${categoryLabel}
                            </span>
                            <span class="todo-badge badge-priority-${task.priority}">
                                ${priorityText}
                            </span>
                            ${task.dueDate ? `
                                <span class="todo-badge badge-date ${isOverdue ? 'overdue' : ''}">
                                    <i data-lucide="calendar"></i>
                                    ${dateString} ${isOverdue ? '(Overdue)' : ''}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="todo-item-actions">
                    <button class="action-btn edit-btn" title="Edit task text" aria-label="Edit task">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete task" aria-label="Delete task">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;

            todoList.appendChild(li);
        });

        // Initialize Lucide icons inside list
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Escape HTML strings to prevent XSS
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ==========================================================================
    // STATS & PROGRESS UPDATE
    // ==========================================================================
    function updateStatsAndProgress() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const active = total - completed;

        totalCountEl.textContent = total;
        completedCountEl.textContent = completed;
        tasksLeftEl.textContent = `${active} active task${active !== 1 ? 's' : ''} left`;

        // Calculate progress percentage
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        progressBarFill.style.width = `${percentage}%`;
        progressPercentageEl.textContent = `${percentage}%`;
    }

    // ==========================================================================
    // CRUD CONTROLLERS
    // ==========================================================================

    // CREATE: Add task handler
    if (todoForm) {
        todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const taskText = todoInput.value.trim();
            const inputContainer = todoInput.closest('.input-container');
            
            if (taskText === '') {
                inputContainer.classList.add('has-error');
                return;
            }
            
            inputContainer.classList.remove('has-error');

            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false,
                priority: todoPriority.value,
                category: todoCategory.value,
                dueDate: todoDate.value
            };

            tasks.push(newTask);
            saveTasks();
            renderTasks();
            
            // Show Success toast
            showToast('Task added successfully!', 'success');

            // Reset Input
            todoInput.value = '';
            todoDate.value = '';
        });

        // Remove error on input keyup
        todoInput.addEventListener('input', () => {
            const container = todoInput.closest('.input-container');
            if (container.classList.contains('has-error')) {
                container.classList.remove('has-error');
            }
        });
    }

    // UPDATE & DELETE: Event Delegation on list container
    if (todoList) {
        // 1. Click Listener (Checkbox Toggles, Edit triggers, Delete triggers)
        todoList.addEventListener('click', (e) => {
            const target = e.target;
            const itemEl = target.closest('.todo-item');
            if (!itemEl) return;
            
            const taskId = parseInt(itemEl.getAttribute('data-id'));
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            if (taskIndex === -1) return;

            // Handle Checkbox Toggles
            if (target.classList.contains('task-checkbox') || target.closest('.todo-checkbox-wrapper')) {
                const checkbox = itemEl.querySelector('.task-checkbox');
                // Avoid double toggling if label trigger is used
                if (target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
                
                tasks[taskIndex].completed = checkbox.checked;
                saveTasks();
                
                // Animate toggle delay before re-render to allow transition animations
                setTimeout(() => {
                    renderTasks();
                }, 180);
                return;
            }

            // Handle Delete
            if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
                itemEl.classList.add('task-exit');
                
                // Wait for CSS slide and fade exit animation to finish
                setTimeout(() => {
                    tasks.splice(taskIndex, 1);
                    saveTasks();
                    renderTasks();
                    showToast('Task deleted successfully', 'error');
                }, 300);
                return;
            }

            // Handle Edit Button Trigger
            if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
                enableInlineEdit(itemEl, taskId);
            }
        });

        // 2. Double-Click Listener for inline edits
        todoList.addEventListener('dblclick', (e) => {
            const textEl = e.target.closest('.todo-text');
            if (!textEl) return;
            
            const itemEl = textEl.closest('.todo-item');
            if (itemEl.classList.contains('completed')) return; // Ignore completed tasks
            
            const taskId = parseInt(itemEl.getAttribute('data-id'));
            enableInlineEdit(itemEl, taskId);
        });
    }

    // ENABLE INLINE EDIT MODE
    function enableInlineEdit(itemEl, taskId) {
        const textEl = itemEl.querySelector('.todo-text');
        if (!textEl || itemEl.querySelector('.edit-todo-input')) return; // Already editing
        
        const originalText = textEl.textContent;
        const textContainer = textEl.parentElement;
        
        // Hide normal text span
        textEl.style.display = 'none';

        // Create edit input box
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-todo-input';
        input.value = originalText;
        textContainer.insertBefore(input, textEl);
        input.focus();

        // Save on Blur (focusout)
        input.addEventListener('blur', () => {
            saveInlineEdit(itemEl, input, textEl, taskId, originalText);
        });

        // Save on Enter key, Cancel on Escape key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveInlineEdit(itemEl, input, textEl, taskId, originalText);
            } else if (e.key === 'Escape') {
                input.remove();
                textEl.style.display = 'block';
            }
        });
    }

    // SAVE INLINE EDIT DETAILS
    function saveInlineEdit(itemEl, inputEl, textEl, taskId, originalText) {
        const updatedText = inputEl.value.trim();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (updatedText === '') {
            // Revert back if empty
            inputEl.remove();
            textEl.style.display = 'block';
            showToast('Task name cannot be empty!', 'error');
            return;
        }

        if (taskIndex !== -1) {
            tasks[taskIndex].text = updatedText;
            saveTasks();
            
            inputEl.remove();
            textEl.textContent = updatedText;
            textEl.style.display = 'block';
            
            // Only alert if text changed
            if (updatedText !== originalText) {
                showToast('Task updated', 'success');
            }
        }
    }

    // CLEAR COMPLETED
    if (clearCompletedBtn) {
        clearCompletedBtn.addEventListener('click', () => {
            const completedCount = tasks.filter(t => t.completed).length;
            if (completedCount === 0) {
                showToast('No completed tasks to clear', 'error');
                return;
            }
            
            // Filter out completed tasks
            tasks = tasks.filter(t => !t.completed);
            saveTasks();
            renderTasks();
            showToast(`Cleared ${completedCount} completed task${completedCount !== 1 ? 's' : ''}`, 'success');
        });
    }

    // ==========================================================================
    // FILTER & SEARCH EVENT HANDLERS
    // ==========================================================================
    
    // Status Tabs Filter switcher
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            
            currentFilter = tab.getAttribute('data-filter');
            renderTasks();
        });
    });

    // Real-time Search Handler
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            
            // Show/Hide Clear button
            if (searchQuery.trim() !== '') {
                clearSearchBtn.classList.add('active');
            } else {
                clearSearchBtn.classList.remove('active');
            }
            
            renderTasks();
        });
    }

    // Clear Search Input Button
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.classList.remove('active');
            renderTasks();
            searchInput.focus();
        });
    }

    // ==========================================================================
    // TOAST NOTIFICATIONS UTILITY
    // ==========================================================================
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconName = type === 'success' ? 'check-circle' : 'alert-circle';
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i data-lucide="${iconName}"></i>
            </div>
            <div class="toast-message">${message}</div>
        `;
        
        toastContainer.appendChild(toast);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Remove toast from DOM after animation completes
        setTimeout(() => {
            toast.remove();
        }, 4500);
    }

    // Initialize Page Render
    updateStatsAndProgress();
    renderTasks();
});

document.addEventListener('DOMContentLoaded', () => {
    // --- Form and List Elements ---
    const appList = document.getElementById('appList');
    const toggleFormBtn = document.getElementById('toggleFormBtn');
    const addAppForm = document.getElementById('addAppForm');
    const formTitle = document.getElementById('formTitle');
    const editAppIdInput = document.getElementById('editAppId');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveBtn = document.getElementById('saveBtn');
    const openInWindowBtn = document.getElementById('openInWindowBtn');

    // --- Utility Functions ---
    const getDueDateStatus = (dueDateStr) => {
        if (!dueDateStr) return { text: '', className: '' };
        const dueDate = new Date(dueDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)} days`, className: 'status-overdue' };
        if (diffDays === 0) return { text: 'Due today', className: 'status-overdue' };
        if (diffDays <= 7) return { text: `Due in ${diffDays} days`, className: 'status-due-soon' };
        return { text: `Due in ${diffDays} days`, className: 'status-safe' };
    };

    // --- UI/Form State Management ---
    const showForm = (isEditMode = false) => {
        formTitle.textContent = isEditMode ? 'Edit Application' : 'Add New Application';
        saveBtn.textContent = isEditMode ? 'Save Changes' : 'Save Application';
        cancelBtn.style.display = isEditMode ? 'inline-block' : 'none';
        addAppForm.style.display = 'flex';
        toggleFormBtn.textContent = '[-]';
    };

    const hideForm = () => {
        addAppForm.reset();
        editAppIdInput.value = '';
        addAppForm.style.display = 'none';
        toggleFormBtn.textContent = '[+]';
        cancelBtn.style.display = 'none';
        formTitle.textContent = 'Add New Application';
        saveBtn.textContent = 'Save Application';
    };

    // --- Core Application Logic ---
    const renderApplications = () => {
        chrome.storage.local.get(['applications'], (result) => {
            const applications = result.applications || [];
            applications.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            appList.innerHTML = '';
            if (applications.length === 0) {
                appList.innerHTML = '<p>No applications yet. Click [+] to add one!</p>';
                return;
            }
            applications.forEach(app => {
                const details = document.createElement('details');
                const summary = document.createElement('summary');
                const contentDiv = document.createElement('div');
                contentDiv.className = 'app-content';
                const { text, className } = getDueDateStatus(app.dueDate);
                summary.innerHTML = `${app.name} <span class="due-status ${className}">${text}</span>`;
                contentDiv.innerHTML = `
                    <p><strong>Address:</strong> ${app.address}</p>
                    <p><strong>Reference:</strong> ${app.reference}</p>
                    <p><strong>Authority:</strong> ${app.authority}</p>
                    <p><strong>Due Date:</strong> ${app.dueDate}</p>
                    <p><strong>URL:</strong> <a href="#" class="visit-link" data-url="${app.url}">Open in new tab</a></p>
                    <div class="app-actions">
                        <button class="action-button edit-button" data-id="${app.id}">Edit</button>
                        <button class="action-button delete-button" data-id="${app.id}">Delete</button>
                    </div>`;
                details.appendChild(summary);
                details.appendChild(contentDiv);
                appList.appendChild(details);
            });
        });
    };

    // --- Event Listeners ---
    toggleFormBtn.addEventListener('click', () => {
        addAppForm.style.display === 'none' ? showForm() : hideForm();
    });

    cancelBtn.addEventListener('click', hideForm);

    addAppForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const appData = {
            name: document.getElementById('appName').value,
            address: document.getElementById('appAddress').value,
            authority: document.getElementById('appAuthority').value,
            reference: document.getElementById('appReference').value,
            url: document.getElementById('appUrl').value,
            dueDate: document.getElementById('appDueDate').value
        };
        
        chrome.storage.local.get(['applications'], (result) => {
            let applications = result.applications || [];
            const editingId = parseInt(editAppIdInput.value, 10);

            if (editingId) { // Edit mode
                applications = applications.map(app => app.id === editingId ? { ...app, ...appData } : app);
            } else { // Add mode
                applications.push({ ...appData, id: Date.now() });
            }

            chrome.storage.local.set({ applications }, () => {
                hideForm();
                renderApplications();
            });
        });
    });

    appList.addEventListener('click', (event) => {
        const target = event.target;
        const id = parseInt(target.getAttribute('data-id'), 10);

        // Visit Link Click
        if (target.classList.contains('visit-link')) {
            event.preventDefault();
            chrome.tabs.create({ url: target.getAttribute('data-url') });
        }
        
        // Delete Button Click
        if (target.classList.contains('delete-button')) {
            if (confirm('Are you sure you want to delete this application?')) {
                chrome.storage.local.get(['applications'], (result) => {
                    let applications = result.applications || [];
                    applications = applications.filter(app => app.id !== id);
                    chrome.storage.local.set({ applications }, renderApplications);
                });
            }
        }

        // Edit Button Click
        if (target.classList.contains('edit-button')) {
            chrome.storage.local.get(['applications'], (result) => {
                const appToEdit = (result.applications || []).find(app => app.id === id);
                if (appToEdit) {
                    document.getElementById('editAppId').value = appToEdit.id;
                    document.getElementById('appName').value = appToEdit.name;
                    document.getElementById('appAddress').value = appToEdit.address;
                    document.getElementById('appAuthority').value = appToEdit.authority;
                    document.getElementById('appReference').value = appToEdit.reference;
                    document.getElementById('appUrl').value = appToEdit.url;
                    document.getElementById('appDueDate').value = appToEdit.dueDate;
                    showForm(true); // Show form in edit mode
                }
            });
        }
    });

    // Initial render
    renderApplications();

    if (openInWindowBtn) {
        // Only show the button if we're in a popup (not a standalone window)
        if (window.location.search.includes('standalone')) {
            openInWindowBtn.style.display = 'none';
        } else {
            openInWindowBtn.addEventListener('click', () => {
                chrome.windows.create({
                    url: chrome.runtime.getURL('popup.html?standalone'),
                    type: 'popup',
                    width: 400,
                    height: 700
                });
            });
        }
    }
});
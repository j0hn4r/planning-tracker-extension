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
    const tabActive = document.getElementById('tabActive');
    const tabDecided = document.getElementById('tabDecided');

    let currentTab = 'active';

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
        document.getElementById('toggleFormIcon').textContent = 'remove';
    };

    const hideForm = () => {
        addAppForm.reset();
        editAppIdInput.value = '';
        addAppForm.style.display = 'none';
        document.getElementById('toggleFormIcon').textContent = 'add';
        cancelBtn.style.display = 'none';
        formTitle.textContent = 'Add New Application';
        saveBtn.textContent = 'Save Application';
    };

    // --- Core Application Logic ---
    const renderApplications = () => {
        chrome.storage.local.get(['applications'], (result) => {
            let applications = result.applications || [];
            
            applications = applications.filter(app => {
                const status = app.status || 'active';
                if (currentTab === 'active') return status === 'active';
                return status === 'approved' || status === 'refused';
            });
            
            applications.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            appList.innerHTML = '';
            if (applications.length === 0) {
                appList.innerHTML = '<p class="text-sm text-outline">No applications in this tab.</p>';
                return;
            }
            applications.forEach(app => {
                const div = document.createElement('div');
                div.className = 'group bg-surface-container-low hover:bg-surface-bright hover:shadow-sm rounded-xl p-4 flex justify-between transition-all flex-col !items-stretch';
                
                let badgeClass = 'bg-secondary-container text-on-secondary-container';
                let statusText = '';
                
                if (app.status === 'approved') {
                    badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                    statusText = 'Approved';
                } else if (app.status === 'refused') {
                    badgeClass = 'bg-rose-100 text-rose-800 border border-rose-200';
                    statusText = 'Refused';
                } else {
                    const { text, className } = getDueDateStatus(app.dueDate);
                    statusText = text;
                    if (className === 'status-overdue') badgeClass = 'bg-error-container text-on-error-container';
                    else if (className === 'status-due-soon') badgeClass = 'bg-tertiary-container/20 text-on-tertiary-container';
                }

                div.innerHTML = `
                    <div class="flex flex-col w-full">
                        <h3 class="text-sm font-bold text-on-surface group-hover:text-surface-tint transition-colors">${app.name}</h3>
                        <p class="text-[11px] text-on-surface-variant">${app.reference || 'No Ref'} • ${app.authority || 'Unknown'}</p>
                        <p class="text-[11px] text-on-surface mt-1 truncate">${app.address}</p>
                        <div class="flex gap-4 mt-2">
                            <a class="visit-link flex items-center gap-1 text-[10px] font-bold text-outline hover:text-[#0F172A] transition-colors" href="#" data-url="${app.url}">
                                <span class="visit-link material-symbols-outlined text-[14px]" data-url="${app.url}">open_in_new</span> PORTAL
                            </a>
                            ${app.commsUrl ? `<a class="visit-link flex items-center gap-1 text-[10px] font-bold text-outline hover:text-[#0F172A] transition-colors" href="#" data-url="${app.commsUrl}">
                                <span class="visit-link material-symbols-outlined text-[14px]" data-url="${app.commsUrl}">forum</span> COMMS
                            </a>` : ''}
                            <button class="edit-button flex items-center gap-1 text-[10px] font-bold text-outline hover:text-[#0F172A] transition-colors" data-id="${app.id}">
                                <span class="edit-button material-symbols-outlined text-[14px]" data-id="${app.id}">edit</span> EDIT
                            </button>
                            <button class="delete-button flex items-center gap-1 text-[10px] font-bold text-error hover:text-red-700 transition-colors" data-id="${app.id}">
                                <span class="delete-button material-symbols-outlined text-[14px]" data-id="${app.id}">delete</span> DELETE
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 justify-between mt-1 border-t border-outline-variant/10 pt-2">
                        <span class="px-3 py-1 rounded-full text-[10px] font-semibold ${badgeClass}">
                            ${statusText}
                        </span>
                        ${(app.status || 'active') === 'active' ? `
                        <div class="flex gap-2">
                            <button class="status-action flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold transition-colors" data-id="${app.id}" data-action="approved">
                                <span class="status-action material-symbols-outlined text-[12px]" data-id="${app.id}" data-action="approved">check</span> Approve
                            </button>
                            <button class="status-action flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold transition-colors" data-id="${app.id}" data-action="refused">
                                <span class="status-action material-symbols-outlined text-[12px]" data-id="${app.id}" data-action="refused">close</span> Refuse
                            </button>
                        </div>
                        ` : `
                        <div class="flex gap-2">
                            <button class="status-action flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-colors" data-id="${app.id}" data-action="active">
                                <span class="status-action material-symbols-outlined text-[12px]" data-id="${app.id}" data-action="active">undo</span> Move to Active
                            </button>
                        </div>
                        `}
                    </div>
                `;
                appList.appendChild(div);
            });
        });
    };

    // --- Event Listeners ---
    if (tabActive) {
        tabActive.addEventListener('click', () => {
            currentTab = 'active';
            tabActive.className = 'text-[#0f172a] border-b-2 border-[#0f172a] py-2 transition-colors';
            tabDecided.className = 'text-[#64748b] hover:text-[#0f172a] py-2 border-b-2 border-transparent transition-colors';
            renderApplications();
        });
    }

    if (tabDecided) {
        tabDecided.addEventListener('click', () => {
            currentTab = 'decided';
            tabDecided.className = 'text-[#0f172a] border-b-2 border-[#0f172a] py-2 transition-colors';
            tabActive.className = 'text-[#64748b] hover:text-[#0f172a] py-2 border-b-2 border-transparent transition-colors';
            renderApplications();
        });
    }

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
            commsUrl: document.getElementById('appCommsUrl').value,
            dueDate: document.getElementById('appDueDate').value,
            status: document.getElementById('appStatus').value
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
                    document.getElementById('appReference').value = appToEdit.reference || '';
                    document.getElementById('appUrl').value = appToEdit.url || '';
                    document.getElementById('appCommsUrl').value = appToEdit.commsUrl || '';
                    document.getElementById('appDueDate').value = appToEdit.dueDate || '';
                    document.getElementById('appStatus').value = appToEdit.status || 'active';
                    showForm(true); // Show form in edit mode
                }
            });
        }

        // Status Action Click
        if (target.classList.contains('status-action')) {
            const action = target.getAttribute('data-action');
            chrome.storage.local.get(['applications'], (result) => {
                let applications = result.applications || [];
                applications = applications.map(app => 
                    app.id === id ? { ...app, status: action } : app
                );
                chrome.storage.local.set({ applications }, renderApplications);
            });
        }
    });

    // Initial render
    renderApplications();

    if (openInWindowBtn) {
        // Only show the button if we're in a popup (not a standalone window)
        if (window.location.search.includes('standalone')) {
            openInWindowBtn.classList.add('hidden');
            openInWindowBtn.classList.remove('flex');
        } else {
            openInWindowBtn.classList.remove('hidden');
            openInWindowBtn.classList.add('flex');
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
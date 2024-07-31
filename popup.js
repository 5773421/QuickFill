document.addEventListener('DOMContentLoaded', function() {
    const fieldsContainer = document.getElementById('fields-container');
    const addFieldButton = document.getElementById('add-field');
    const statusElement = document.getElementById('status');
    const iconToggle = document.getElementById('icon-toggle');

    let saveTimeout;

    // Load fields and toggle state from storage
    chrome.storage.sync.get(['formFields', 'showIcon'], function(data) {
        if (data.formFields) {
            data.formFields.forEach(field => addField(field.name, field.value));
        } else {
            addField('example', '');
        }
        
        iconToggle.checked = data.showIcon !== false; // Default to true if not set
    });

    addFieldButton.addEventListener('click', () => addField());

    iconToggle.addEventListener('change', function() {
        chrome.storage.sync.set({ showIcon: this.checked });
        
        // Send message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "toggleIcon", show: iconToggle.checked});
        });
    });

    function addField(name = '', value = '') {
        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'field-group';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Field Name';
        nameInput.value = name;
        nameInput.className = 'field-name';

        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.placeholder = 'Field Value';
        valueInput.value = value;
        valueInput.className = 'field-value';

        const removeButton = document.createElement('button');
        removeButton.textContent = '×';
        removeButton.className = 'remove-field';
        removeButton.addEventListener('click', () => {
            fieldsContainer.removeChild(fieldGroup);
            saveFields();
        });

        fieldGroup.appendChild(nameInput);
        fieldGroup.appendChild(valueInput);
        fieldGroup.appendChild(removeButton);

        fieldsContainer.appendChild(fieldGroup);

        // Add event listeners for auto-save
        nameInput.addEventListener('input', debouncedSave);
        valueInput.addEventListener('input', debouncedSave);
    }

    function debouncedSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveFields, 500);
    }

    function saveFields() {
        const fields = [];
        document.querySelectorAll('.field-group').forEach(group => {
            const name = group.querySelector('.field-name').value;
            const value = group.querySelector('.field-value').value;
            if (name && value) {
                fields.push({ name, value });
            }
        });

        chrome.storage.sync.set({ formFields: fields }, function() {
            showStatus('Changes saved');
        });
    }

    function showStatus(message) {
        statusElement.textContent = message;
        statusElement.style.opacity = '1';
        setTimeout(() => {
            statusElement.style.opacity = '0';
        }, 2000);
    }
});
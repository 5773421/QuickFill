// content.js
let currentInput = null;
let fillIcon = null;
let fillMenu = null;
let showIconTimeout = null;
let hideIconTimeout = null;
let showIcon = true;  // Default to true

// Create fill icon
function createFillIcon() {
    fillIcon = document.createElement('div');
    fillIcon.id = 'auto-fill-icon';
    fillIcon.textContent = '📝';
    fillIcon.style.display = 'none';
    document.body.appendChild(fillIcon);

    fillIcon.addEventListener('mouseenter', showFillMenu);
    fillIcon.addEventListener('mouseleave', hideFillMenuWithDelay);
}

// Create fill menu
function createFillMenu() {
    fillMenu = document.createElement('div');
    fillMenu.id = 'auto-fill-menu';
    fillMenu.style.display = 'none';
    document.body.appendChild(fillMenu);

    fillMenu.addEventListener('mouseenter', () => {
        clearTimeout(hideMenuTimeout);
    });
    fillMenu.addEventListener('mouseleave', hideFillMenuWithDelay);
}

// Show fill menu
function showFillMenu() {
    chrome.storage.sync.get('formFields', function(data) {
        if (data.formFields && data.formFields.length > 0) {
            fillMenu.innerHTML = '';
            data.formFields.forEach(field => {
                const item = document.createElement('div');
                item.className = 'fill-item';
                item.textContent = `${field.name}: ${field.value}`;
                item.addEventListener('click', () => fillField(field.value));
                fillMenu.appendChild(item);
            });
            const rect = fillIcon.getBoundingClientRect();
            fillMenu.style.top = `${rect.bottom + window.scrollY}px`;
            fillMenu.style.left = `${rect.left + window.scrollX}px`;
            fillMenu.style.display = 'block';
        }
    });
}

let hideMenuTimeout;

// Hide fill menu with delay
function hideFillMenuWithDelay() {
    hideMenuTimeout = setTimeout(hideFillMenu, 300);
}

// Fill field
function fillField(value) {
    if (currentInput) {
        currentInput.value = value;
        currentInput.dispatchEvent(new Event('input', { bubbles: true }));
        currentInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    hideFillMenu();
}

// Hide fill menu
function hideFillMenu() {
    if (fillMenu) {
        fillMenu.style.display = 'none';
    }
}

// Update fill icon position
function updateFillIconPosition() {
    if (currentInput && fillIcon && showIcon) {
        const rect = currentInput.getBoundingClientRect();
        fillIcon.style.top = `${rect.bottom + window.scrollY - 20}px`;
        fillIcon.style.left = `${rect.right + window.scrollX - 20}px`;
        fillIcon.style.display = 'block';
    }
}

// Show fill icon with delay
function showFillIconWithDelay() {
    clearTimeout(hideIconTimeout);
    clearTimeout(showIconTimeout);
    showIconTimeout = setTimeout(() => {
        if (currentInput && showIcon) {
            updateFillIconPosition();
        }
    }, 100);
}

// Hide fill icon with delay
function hideFillIconWithDelay() {
    clearTimeout(hideIconTimeout);
    hideIconTimeout = setTimeout(() => {
        if (fillIcon && !fillMenu.contains(document.activeElement)) {
            fillIcon.style.display = 'none';
            hideFillMenu();
        }
    }, 200);
}

// Hide fill icon
function hideFillIcon() {
    if (fillIcon) {
        fillIcon.style.display = 'none';
    }
    if (fillMenu) {
        fillMenu.style.display = 'none';
    }
}

// Listen for input focus events
document.addEventListener('focusin', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        currentInput = e.target;
        if (showIcon) {
            showFillIconWithDelay();
        }
    }
}, true);

// Listen for input blur events
document.addEventListener('focusout', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        hideFillIconWithDelay();
    }
}, true);

// Listen for scroll events to update icon position
window.addEventListener('scroll', updateFillIconPosition);
window.addEventListener('resize', updateFillIconPosition);

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "toggleIcon") {
        showIcon = request.show;
        if (!showIcon) {
            hideFillIcon();
        } else if (currentInput) {
            showFillIconWithDelay();
        }
    }
});

// Initialize
chrome.storage.sync.get('showIcon', function(data) {
    showIcon = data.showIcon !== false;  // Default to true if not set
    createFillIcon();
    createFillMenu();
});

// Recheck showIcon status when the page becomes visible
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        chrome.storage.sync.get('showIcon', function(data) {
            showIcon = data.showIcon !== false;
            if (currentInput && showIcon) {
                showFillIconWithDelay();
            } else if (!showIcon) {
                hideFillIcon();
            }
        });
    }
});
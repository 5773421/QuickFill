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
    fillIcon.style.position = 'absolute';
    fillIcon.style.display = 'none';
    fillIcon.style.zIndex = '9999';
    fillIcon.style.cursor = 'pointer';
    fillIcon.style.backgroundColor = '#4CAF50';
    fillIcon.style.color = 'white';
    fillIcon.style.borderRadius = '50%';
    fillIcon.style.width = '24px';
    fillIcon.style.height = '24px';
    fillIcon.style.textAlign = 'center';
    fillIcon.style.lineHeight = '24px';
    fillIcon.style.fontSize = '14px';
    fillIcon.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    document.body.appendChild(fillIcon);

    fillIcon.addEventListener('mouseenter', showFillMenu);
    fillIcon.addEventListener('mouseleave', hideFillMenuWithDelay);
}

// Create fill menu
function createFillMenu() {
    fillMenu = document.createElement('div');
    fillMenu.id = 'auto-fill-menu';
    fillMenu.style.position = 'absolute';
    fillMenu.style.display = 'none';
    fillMenu.style.zIndex = '10000';
    fillMenu.style.backgroundColor = 'white';
    fillMenu.style.border = 'none';
    fillMenu.style.borderRadius = '8px';
    fillMenu.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    fillMenu.style.padding = '10px 0';
    fillMenu.style.maxHeight = '300px';
    fillMenu.style.overflowY = 'auto';
    fillMenu.style.transition = 'all 0.3s ease';
    fillMenu.style.opacity = '0';
    fillMenu.style.transform = 'translateY(-10px)';
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
                item.innerHTML = `<strong>${field.name}:</strong> ${field.value}`;
                item.style.padding = '10px 15px';
                item.style.cursor = 'pointer';
                item.style.transition = 'background-color 0.2s ease';
                item.addEventListener('click', () => fillField(field.value));
                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = '#f0f0f0';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.backgroundColor = 'transparent';
                });
                fillMenu.appendChild(item);
            });
            const rect = fillIcon.getBoundingClientRect();
            fillMenu.style.top = `${rect.bottom + window.scrollY + 10}px`;
            fillMenu.style.left = `${rect.left + window.scrollX - 5}px`;
            fillMenu.style.display = 'block';
            
            // Trigger reflow to enable transition
            fillMenu.offsetHeight;
            fillMenu.style.opacity = '1';
            fillMenu.style.transform = 'translateY(0)';
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
        fillMenu.style.opacity = '0';
        fillMenu.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            fillMenu.style.display = 'none';
        }, 300); // Match this with the transition duration
    }
}

// Update fill icon position
function updateFillIconPosition() {
    if (currentInput && fillIcon && showIcon) {
        const rect = currentInput.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        
        // Calculate position to place icon inside the input field
        const iconSize = 24; // Assuming the icon is 24x24 pixels
        const padding = 5; // Padding from the edges of the input field
        
        fillIcon.style.top = `${rect.bottom + scrollY - iconSize - padding}px`;
        fillIcon.style.left = `${rect.right + scrollX - iconSize - padding}px`;
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

// Listen for scroll and resize events to update icon position
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
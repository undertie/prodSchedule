document.addEventListener('DOMContentLoaded', function() {
    // Modal elements
    const modal = document.getElementById('bugReportModal');
    const btn = document.getElementById('reportBugBtn');
    const span = document.getElementsByClassName('close')[0];
    const form = document.getElementById('bugReportForm');
    const fileInput = document.getElementById('screenshotUpload');
    const preview = document.getElementById('screenshotPreview');
    const screenshotDataInput = document.getElementById('screenshotData');
    
    let screenshotData = null;

    // Open modal
    btn.onclick = function() {
        modal.style.display = 'block';
    };

    // Close modal
    span.onclick = function() {
        modal.style.display = 'none';
        resetForm();
    };

    // Close when clicking outside
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            resetForm();
        }
    };

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                displayScreenshot(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle clipboard paste
    document.addEventListener('paste', function(e) {
        if (modal.style.display !== 'block') return;
        
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.onload = function(event) {
                    displayScreenshot(event.target.result);
                };
                reader.readAsDataURL(blob);
                break;
            }
        }
    });

    function displayScreenshot(dataUrl) {
        preview.innerHTML = '';
        const img = document.createElement('img');
        img.src = dataUrl;
        preview.appendChild(img);
        screenshotData = dataUrl;
        screenshotDataInput.value = dataUrl;
    }

    function resetForm() {
        form.reset();
        preview.innerHTML = '<p>Screenshot preview will appear here</p>';
        screenshotData = null;
        screenshotDataInput.value = '';
        fileInput.value = '';
    }
});

// Handle alert messages
document.addEventListener('DOMContentLoaded', function() {
    // Close button functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close-alert')) {
            fadeOutAlert(e.target.parentElement);
        }
    });
    
    // Auto-dismiss after 10 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            fadeOutAlert(alert);
        }, 10000); // 10 seconds timeout
    });
    
    function fadeOutAlert(alertElement) {
        alertElement.style.animation = 'fadeOut 0.5s';
        alertElement.addEventListener('animationend', function() {
            alertElement.remove();
        });
    }
});
// js/feedback.js
// Feedback-Funktionalität für Blog-Artikel (Rating & Share Buttons)

document.addEventListener('DOMContentLoaded', () => {
    initFeedbackSection();
});

function initFeedbackSection() {
    const feedbackSection = document.querySelector('.feedback-section');
    if (!feedbackSection) return;

    initRatingButtons(feedbackSection);
    initShareButtons(feedbackSection);
}

// === RATING BUTTONS ===
function initRatingButtons(container) {
    const ratingButtons = container.querySelectorAll('.rating-btn');
    if (ratingButtons.length === 0) return;

    // LocalStorage Key basierend auf der aktuellen Seite
    const storageKey = `feedback_${window.location.pathname}`;
    
    // Prüfen ob bereits abgestimmt wurde
    const existingVote = localStorage.getItem(storageKey);
    if (existingVote) {
        markVotedState(container, existingVote);
    }

    ratingButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Bereits abgestimmt?
            if (localStorage.getItem(storageKey)) {
                showFeedbackMessage(container, 'Du hast bereits abgestimmt. Danke!', 'info');
                return;
            }

            // Vote-Typ ermitteln
            let voteType = 'neutral';
            if (btn.classList.contains('positive')) voteType = 'positive';
            if (btn.classList.contains('negative')) voteType = 'negative';

            // Vote speichern
            localStorage.setItem(storageKey, voteType);
            
            // UI aktualisieren
            markVotedState(container, voteType);
            showFeedbackMessage(container, 'Danke für dein Feedback!', 'success');
            
            // Optional: Analytics-Event senden (falls vorhanden)
            if (typeof gtag === 'function') {
                gtag('event', 'feedback_vote', {
                    'event_category': 'engagement',
                    'event_label': voteType,
                    'value': voteType === 'positive' ? 1 : (voteType === 'negative' ? -1 : 0)
                });
            }
        });
    });
}

function markVotedState(container, voteType) {
    const buttons = container.querySelectorAll('.rating-btn');
    
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.cursor = 'default';
        btn.style.opacity = '0.5';
        
        // Den gewählten Button hervorheben
        if (btn.classList.contains(voteType)) {
            btn.style.opacity = '1';
            btn.style.transform = 'scale(1.05)';
            
            if (voteType === 'positive') {
                btn.style.backgroundColor = 'rgba(81, 207, 102, 0.2)';
                btn.style.borderColor = '#51cf66';
                btn.style.color = '#51cf66';
            } else if (voteType === 'negative') {
                btn.style.backgroundColor = 'rgba(255, 107, 107, 0.2)';
                btn.style.borderColor = '#ff6b6b';
                btn.style.color = '#ff6b6b';
            } else {
                btn.style.backgroundColor = 'rgba(252, 181, 0, 0.2)';
                btn.style.borderColor = '#FCB500';
                btn.style.color = '#FCB500';
            }
        }
    });
}

function showFeedbackMessage(container, message, type) {
    // Existierende Nachricht entfernen
    const existingMsg = container.querySelector('.feedback-message');
    if (existingMsg) existingMsg.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `feedback-message feedback-${type}`;
    msgDiv.textContent = message;
    msgDiv.style.cssText = `
        text-align: center;
        padding: 10px 15px;
        margin-top: 15px;
        border-radius: 8px;
        font-size: 0.9rem;
        animation: fadeIn 0.3s ease;
        ${type === 'success' ? 'background: rgba(81, 207, 102, 0.1); color: #51cf66; border: 1px solid rgba(81, 207, 102, 0.3);' : ''}
        ${type === 'info' ? 'background: rgba(252, 181, 0, 0.1); color: #FCB500; border: 1px solid rgba(252, 181, 0, 0.3);' : ''}
    `;

    // Nach den Rating-Buttons einfügen
    const ratioBar = container.querySelector('.rating-ratio-bar');
    if (ratioBar) {
        ratioBar.parentNode.insertBefore(msgDiv, ratioBar);
    } else {
        container.querySelector('.feedback-container').appendChild(msgDiv);
    }

    // Nach 3 Sekunden ausblenden
    setTimeout(() => {
        msgDiv.style.opacity = '0';
        msgDiv.style.transition = 'opacity 0.3s ease';
        setTimeout(() => msgDiv.remove(), 300);
    }, 3000);
}

// === SHARE BUTTONS ===
function initShareButtons(container) {
    const shareLinks = container.querySelectorAll('.share-icon');
    if (shareLinks.length === 0) return;

    const pageUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(document.title);

    shareLinks.forEach(link => {
        const icon = link.querySelector('i');
        if (!icon) return;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            let shareUrl = '';

            // WhatsApp
            if (icon.classList.contains('fa-whatsapp')) {
                shareUrl = `https://wa.me/?text=${pageTitle}%20${pageUrl}`;
            }
            // LinkedIn
            else if (icon.classList.contains('fa-linkedin-in')) {
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
            }
            // Reddit
            else if (icon.classList.contains('fa-reddit-alien')) {
                shareUrl = `https://www.reddit.com/submit?url=${pageUrl}&title=${pageTitle}`;
            }
            // X (Twitter)
            else if (icon.classList.contains('fa-x-twitter')) {
                shareUrl = `https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`;
            }

            if (shareUrl) {
                // Popup öffnen
                window.open(shareUrl, '_blank', 'width=600,height=400,menubar=no,toolbar=no');
                
                // Optional: Analytics
                if (typeof gtag === 'function') {
                    gtag('event', 'share', {
                        'event_category': 'engagement',
                        'event_label': icon.className
                    });
                }
            }
        });

        // Hover-Effekt verbessern
        link.style.cursor = 'pointer';
    });
}

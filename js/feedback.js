// js/feedback.js
// Feedback-Funktionalität für Blog-Artikel (Rating & Share Buttons)
// Funktioniert auch mit dynamisch geladenem Content

(function() {
    'use strict';

    // === INITIALISIERUNG ===
    // Mehrere Wege um sicherzustellen, dass der Code ausgeführt wird
    
    // 1. Bei DOMContentLoaded (für statischen Content)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }

    // 2. MutationObserver für dynamisch geladenen Content
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                tryInit();
            }
        });
    });

    // Observer starten
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 3. Globale Funktion für manuellen Aufruf (Fallback)
    window.initFeedbackSection = tryInit;

    // === HAUPTFUNKTION ===
    function tryInit() {
        const feedbackSection = document.querySelector('.feedback-section');
        if (!feedbackSection) return;
        
        // Prüfen ob bereits initialisiert
        if (feedbackSection.dataset.initialized === 'true') return;
        
        // Als initialisiert markieren
        feedbackSection.dataset.initialized = 'true';
        
        console.log('✅ Feedback-Sektion gefunden und initialisiert');
        
        initRatingButtons(feedbackSection);
        initShareButtons(feedbackSection);
        
        // Observer kann gestoppt werden wenn gefunden
        observer.disconnect();
    }

    // === RATING BUTTONS ===
    function initRatingButtons(container) {
        const ratingButtons = container.querySelectorAll('.rating-btn');
        if (ratingButtons.length === 0) {
            console.warn('⚠️ Keine Rating-Buttons gefunden');
            return;
        }

        // LocalStorage Key basierend auf der aktuellen Seite
        const storageKey = 'feedback_' + window.location.pathname;
        
        // Prüfen ob bereits abgestimmt wurde
        const existingVote = localStorage.getItem(storageKey);
        if (existingVote) {
            markVotedState(container, existingVote);
        }

        ratingButtons.forEach(function(btn) {
            // Event-Listener nur einmal hinzufügen
            if (btn.dataset.listenerAdded === 'true') return;
            btn.dataset.listenerAdded = 'true';
            
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🖱️ Rating-Button geklickt');
                
                // Bereits abgestimmt?
                if (localStorage.getItem(storageKey)) {
                    showFeedbackMessage(container, 'Du hast bereits abgestimmt. Danke!', 'info');
                    return;
                }

                // Vote-Typ ermitteln
                var voteType = btn.dataset.vote || 'neutral';
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
        
        console.log('✅ ' + ratingButtons.length + ' Rating-Buttons initialisiert');
    }

    function markVotedState(container, voteType) {
        var buttons = container.querySelectorAll('.rating-btn');
        
        buttons.forEach(function(btn) {
            btn.disabled = true;
            btn.style.cursor = 'default';
            btn.style.opacity = '0.4';
            btn.style.transform = 'none';
            
            // Den gewählten Button hervorheben
            var isSelected = btn.classList.contains(voteType) || btn.dataset.vote === voteType;
            
            if (isSelected) {
                btn.style.opacity = '1';
                btn.style.transform = 'scale(1.05)';
                
                if (voteType === 'positive') {
                    btn.style.backgroundColor = 'rgba(81, 207, 102, 0.15)';
                    btn.style.borderColor = '#51cf66';
                    btn.style.color = '#51cf66';
                    btn.style.boxShadow = '0 4px 20px rgba(81, 207, 102, 0.25)';
                } else if (voteType === 'negative') {
                    btn.style.backgroundColor = 'rgba(255, 107, 107, 0.15)';
                    btn.style.borderColor = '#ff6b6b';
                    btn.style.color = '#ff6b6b';
                    btn.style.boxShadow = '0 4px 20px rgba(255, 107, 107, 0.25)';
                } else {
                    btn.style.backgroundColor = 'rgba(252, 181, 0, 0.15)';
                    btn.style.borderColor = '#FCB500';
                    btn.style.color = '#FCB500';
                    btn.style.boxShadow = '0 4px 20px rgba(252, 181, 0, 0.25)';
                }
            }
        });
    }

    function showFeedbackMessage(container, message, type) {
        // Existierende Nachricht entfernen
        var existingMsg = container.querySelector('.feedback-message');
        if (existingMsg) existingMsg.remove();

        var msgDiv = document.createElement('div');
        msgDiv.className = 'feedback-message feedback-' + type;
        msgDiv.textContent = message;
        msgDiv.style.cssText = 
            'text-align: center;' +
            'padding: 12px 18px;' +
            'margin: 15px auto;' +
            'border-radius: 10px;' +
            'font-size: 0.9rem;' +
            'max-width: 400px;' +
            'animation: feedbackFadeIn 0.3s ease;';
        
        if (type === 'success') {
            msgDiv.style.background = 'rgba(81, 207, 102, 0.1)';
            msgDiv.style.color = '#51cf66';
            msgDiv.style.border = '1px solid rgba(81, 207, 102, 0.25)';
        } else if (type === 'info') {
            msgDiv.style.background = 'rgba(252, 181, 0, 0.1)';
            msgDiv.style.color = '#FCB500';
            msgDiv.style.border = '1px solid rgba(252, 181, 0, 0.25)';
        }

        // Nach den Rating-Buttons einfügen
        var ratioBar = container.querySelector('.rating-ratio-bar');
        var feedbackContainer = container.querySelector('.feedback-container');
        
        if (ratioBar && ratioBar.parentNode) {
            ratioBar.parentNode.insertBefore(msgDiv, ratioBar);
        } else if (feedbackContainer) {
            feedbackContainer.appendChild(msgDiv);
        } else {
            container.appendChild(msgDiv);
        }

        // Nach 3 Sekunden ausblenden
        setTimeout(function() {
            msgDiv.style.opacity = '0';
            msgDiv.style.transition = 'opacity 0.3s ease';
            setTimeout(function() {
                if (msgDiv.parentNode) {
                    msgDiv.remove();
                }
            }, 300);
        }, 3000);
    }

    // === SHARE BUTTONS ===
    function initShareButtons(container) {
        var shareLinks = container.querySelectorAll('.share-icon');
        if (shareLinks.length === 0) {
            console.warn('⚠️ Keine Share-Buttons gefunden');
            return;
        }

        var pageUrl = encodeURIComponent(window.location.href);
        var pageTitle = encodeURIComponent(document.title);

        shareLinks.forEach(function(link) {
            // Event-Listener nur einmal hinzufügen
            if (link.dataset.listenerAdded === 'true') return;
            link.dataset.listenerAdded = 'true';
            
            link.style.cursor = 'pointer';
            
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🖱️ Share-Button geklickt');

                var shareUrl = '';
                var platform = link.dataset.platform;
                
                // Fallback: Platform aus Icon-Klasse ermitteln
                if (!platform) {
                    var icon = link.querySelector('i');
                    if (icon) {
                        if (icon.classList.contains('fa-whatsapp')) platform = 'whatsapp';
                        else if (icon.classList.contains('fa-linkedin-in') || icon.classList.contains('fa-linkedin')) platform = 'linkedin';
                        else if (icon.classList.contains('fa-reddit-alien') || icon.classList.contains('fa-reddit')) platform = 'reddit';
                        else if (icon.classList.contains('fa-x-twitter') || icon.classList.contains('fa-twitter')) platform = 'twitter';
                        else if (icon.classList.contains('fa-link') || icon.classList.contains('fa-copy')) platform = 'copy';
                    }
                }

                console.log('📤 Platform:', platform);

                switch (platform) {
                    case 'whatsapp':
                        shareUrl = 'https://wa.me/?text=' + pageTitle + '%20' + pageUrl;
                        break;
                    case 'linkedin':
                        shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + pageUrl;
                        break;
                    case 'reddit':
                        shareUrl = 'https://www.reddit.com/submit?url=' + pageUrl + '&title=' + pageTitle;
                        break;
                    case 'twitter':
                        shareUrl = 'https://twitter.com/intent/tweet?url=' + pageUrl + '&text=' + pageTitle;
                        break;
                    case 'copy':
                        copyToClipboard(window.location.href, link);
                        return; // Kein Popup öffnen
                    default:
                        console.warn('⚠️ Unbekannte Platform:', platform);
                        return;
                }

                if (shareUrl) {
                    // Popup öffnen
                    window.open(shareUrl, '_blank', 'width=600,height=500,menubar=no,toolbar=no,scrollbars=yes');
                    
                    console.log('✅ Share-Popup geöffnet für:', platform);
                    
                    // Optional: Analytics
                    if (typeof gtag === 'function') {
                        gtag('event', 'share', {
                            'event_category': 'engagement',
                            'event_label': platform
                        });
                    }
                }
            });
        });
        
        console.log('✅ ' + shareLinks.length + ' Share-Buttons initialisiert');
    }

    // === COPY TO CLIPBOARD ===
    function copyToClipboard(text, element) {
        // Modern Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                showCopyTooltip(element, 'Link kopiert!');
                console.log('✅ Link kopiert (Clipboard API)');
            }).catch(function(err) {
                console.warn('Clipboard API fehlgeschlagen, nutze Fallback', err);
                fallbackCopy(text, element);
            });
        } else {
            fallbackCopy(text, element);
        }
    }

    function fallbackCopy(text, element) {
        var textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.cssText = 'position:fixed;left:-9999px;top:0;';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            var successful = document.execCommand('copy');
            if (successful) {
                showCopyTooltip(element, 'Link kopiert!');
                console.log('✅ Link kopiert (Fallback)');
            } else {
                showCopyTooltip(element, 'Kopieren fehlgeschlagen');
            }
        } catch (err) {
            console.error('Fallback Copy fehlgeschlagen:', err);
            showCopyTooltip(element, 'Fehler beim Kopieren');
        }

        document.body.removeChild(textArea);
    }

    function showCopyTooltip(element, message) {
        // Existierenden Tooltip entfernen
        var existingTooltip = document.querySelector('.copy-tooltip');
        if (existingTooltip) existingTooltip.remove();

        var tooltip = document.createElement('span');
        tooltip.className = 'copy-tooltip';
        tooltip.textContent = message;
        tooltip.style.cssText = 
            'position: absolute;' +
            'background: #FCB500;' +
            'color: #000;' +
            'padding: 6px 12px;' +
            'border-radius: 6px;' +
            'font-size: 0.75rem;' +
            'font-weight: 500;' +
            'white-space: nowrap;' +
            'z-index: 1000;' +
            'left: 50%;' +
            'bottom: 100%;' +
            'transform: translateX(-50%);' +
            'margin-bottom: 8px;' +
            'animation: tooltipPop 0.3s ease;';

        // Position relativ machen falls nötig
        var computedStyle = window.getComputedStyle(element);
        if (computedStyle.position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(tooltip);

        // Nach 2 Sekunden entfernen
        setTimeout(function() {
            tooltip.style.opacity = '0';
            tooltip.style.transition = 'opacity 0.2s ease';
            setTimeout(function() {
                if (tooltip.parentNode) {
                    tooltip.remove();
                }
            }, 200);
        }, 2000);

        // Analytics
        if (typeof gtag === 'function') {
            gtag('event', 'share', {
                'event_category': 'engagement',
                'event_label': 'copy_link'
            });
        }
    }

    // === CSS ANIMATION HINZUFÜGEN ===
    var style = document.createElement('style');
    style.textContent = 
        '@keyframes feedbackFadeIn {' +
        '  from { opacity: 0; transform: translateY(-10px); }' +
        '  to { opacity: 1; transform: translateY(0); }' +
        '}' +
        '@keyframes tooltipPop {' +
        '  0% { opacity: 0; transform: translateX(-50%) scale(0.8); }' +
        '  100% { opacity: 1; transform: translateX(-50%) scale(1); }' +
        '}';
    document.head.appendChild(style);

})();

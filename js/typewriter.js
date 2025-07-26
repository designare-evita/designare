// js/typewriter.js

// --- Globale Variablen für den AI Placeholder ---
const AI_TYPING_SPEED = 120;
const AI_DELETING_SPEED = 50;
const AI_DELAY_AFTER_TYPING = 5000;
const placeholderTexts = ["Hallo! Evita hier...", "Michaels KI-Joker...", "Frag mich etwas..."];
let placeholderIndex = 0;
let charPlaceholderIndex = 0;
let typeInterval;
let deleteInterval;
let aiQuestionInput; // Wird in initAiPlaceholderTypewriter initialisiert

/**
 * Stoppt die Typewriter-Animation für das AI-Input-Feld.
 * Wichtig, damit der Benutzer tippen kann.
 */
export function stopPlaceholderAnimation() {
    clearInterval(typeInterval);
    clearInterval(deleteInterval);
    if (aiQuestionInput) {
        aiQuestionInput.placeholder = ""; // Bestehenden Platzhalter löschen
    }
}

/**
 * Startet die Typewriter-Animation für das AI-Input-Feld neu.
 */
export function startPlaceholderAnimation() {
    // Sicherstellen, dass keine alten Animationen laufen
    stopPlaceholderAnimation(); 
    if (!aiQuestionInput) return;
    
    // Setzt den Startpunkt zurück und beginnt mit dem Tippen
    charPlaceholderIndex = 0;
    aiQuestionInput.placeholder = ""; 
    setTimeout(typePlaceholder, 100);
}

function typePlaceholder() {
    let newText = placeholderTexts[placeholderIndex];
    typeInterval = setInterval(() => {
        if (charPlaceholderIndex < newText.length) {
            if (aiQuestionInput) {
                aiQuestionInput.placeholder += newText.charAt(charPlaceholderIndex++);
            }
        } else {
            clearInterval(typeInterval);
            setTimeout(deletePlaceholder, AI_DELAY_AFTER_TYPING);
        }
    }, AI_TYPING_SPEED);
}

function deletePlaceholder() {
    deleteInterval = setInterval(() => {
        if (aiQuestionInput) {
            let currentText = aiQuestionInput.placeholder;
            if (currentText.length > 0) {
                aiQuestionInput.placeholder = currentText.slice(0, -1);
            } else {
                clearInterval(deleteInterval);
                placeholderIndex = (placeholderIndex + 1) % placeholderTexts.length;
                // Starte die Animation für den nächsten Text von vorne
                startPlaceholderAnimation(); 
            }
        }
    }, AI_DELETING_SPEED);
}

function initH1Typewriter() {
    const typewriterElement = document.getElementById('typewriter-h1');
    if (!typewriterElement) return;

    const H1_TYPING_SPEED = 120;
    const H1_DELETING_SPEED = 70;
    const H1_DELAY_BETWEEN_TEXTS = 2200;
    const textsToType = ["Michael Kanda", "Web-Magier", "KI-Therapeut"];
    let textIndex = 0, charIndex = 0, isDeleting = false;

    function typeWriter() {
        const currentText = textsToType[textIndex];
        if (isDeleting) {
            typewriterElement.innerHTML = currentText.substring(0, charIndex - 1) + '<span class="cursor"></span>';
            charIndex--;
        } else {
            typewriterElement.innerHTML = currentText.substring(0, charIndex + 1) + '<span class="cursor"></span>';
            charIndex++;
        }
        if (!isDeleting && charIndex === currentText.length) {
            isDeleting = true; setTimeout(typeWriter, H1_DELAY_BETWEEN_TEXTS); return;
        }
        if (isDeleting && charIndex === 0) {
            isDeleting = false; textIndex = (textIndex + 1) % textsToType.length; setTimeout(typeWriter, 500); return;
        }
        setTimeout(typeWriter, isDeleting ? H1_DELETING_SPEED : H1_TYPING_SPEED);
    }
    setTimeout(typeWriter, 500);
}

function initAiPlaceholderTypewriter() {
    const aiForm = document.getElementById('ai-form');
    aiQuestionInput = document.getElementById('ai-question'); // Weise die globale Variable zu
    if (!aiForm || !aiQuestionInput) return;
    
    aiQuestionInput.addEventListener('focus', stopPlaceholderAnimation);
    aiQuestionInput.addEventListener('blur', () => { if (aiQuestionInput.value === '') startPlaceholderAnimation(); });
    
    startPlaceholderAnimation();
}

// Exportiert eine Haupt-Initialisierungsfunktion für alle Typewriter
export function initTypewriters() {
    initH1Typewriter();

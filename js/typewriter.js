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
let aiQuestionInput; // Wird später zugewiesen

/**
 * Stoppt die Typewriter-Animation für das AI-Input-Feld.
 * Diese Funktion wird exportiert, damit andere Module sie nutzen können.
 */
export function stopPlaceholderAnimation() {
    clearInterval(typeInterval);
    clearInterval(deleteInterval);
}

/**
 * Startet die Typewriter-Animation für das AI-Input-Feld neu.
 * Diese Funktion wird ebenfalls exportiert.
 */
export function startPlaceholderAnimation() {
    // Sicherstellen, dass keine alten Animationen laufen
    stopPlaceholderAnimation();
    if (!aiQuestionInput) return;
    
    charPlaceholderIndex = 0;
    aiQuestionInput.placeholder = ""; // Platzhalter leeren vor dem Start
    typePlaceholder();
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
    aiQuestionInput = document.getElementById('ai-question');
    if (!aiQuestionInput) return;
    
    // Animation steuern, wenn der Nutzer mit dem Feld interagiert
    aiQuestionInput.addEventListener('focus', stopPlaceholderAnimation);
    aiQuestionInput.addEventListener('blur', () => { 
        if (aiQuestionInput.value === '') {
            startPlaceholderAnimation();
        }
    });
    
    startPlaceholderAnimation();
}

// Exportiert die Haupt-Initialisierungsfunktion
export function initTypewriters() {
    initH1Typewriter();
    initAiPlaceholderTypewriter();

    // Stellt den Cursor-Stil für die H1-Animation bereit
    const style = document.createElement('style');
    style.innerHTML = `.cursor { display: inline-block; width: 3px; height: 1em; background-color: var(--accent-color); animation: blink 0.7s infinite; vertical-align: bottom; margin-left: 5px; } @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`;
    document.head.appendChild(style);
}

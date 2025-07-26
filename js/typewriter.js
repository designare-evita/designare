// js/typewriter.js

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
    if (!aiForm) return;

    const aiQuestionInput = document.getElementById('ai-question');
    const AI_TYPING_SPEED = 120, AI_DELETING_SPEED = 50, AI_DELAY_AFTER_TYPING = 5000;
    const placeholderTexts = ["Hallo! Evita hier...", "Michaels KI-Joker...", "Frag mich etwas..."];
    let placeholderIndex = 0, charPlaceholderIndex = 0, typeInterval, deleteInterval;

    const stopPlaceholderAnimation = () => {
        clearInterval(typeInterval); clearInterval(deleteInterval);
        if (aiQuestionInput) aiQuestionInput.placeholder = "";
    };

    const startPlaceholderAnimation = () => {
        clearInterval(typeInterval); clearInterval(deleteInterval);
        if (aiQuestionInput) aiQuestionInput.placeholder = "";
        charPlaceholderIndex = 0;
        setTimeout(typePlaceholder, 100);
    };

    function typePlaceholder() {
        let newText = placeholderTexts[placeholderIndex];
        typeInterval = setInterval(() => {
            if (charPlaceholderIndex < newText.length) {
                aiQuestionInput.placeholder += newText.charAt(charPlaceholderIndex++);
            } else {
                clearInterval(typeInterval); setTimeout(deletePlaceholder, AI_DELAY_AFTER_TYPING);
            }
        }, AI_TYPING_SPEED);
    }

    function deletePlaceholder() {
        deleteInterval = setInterval(() => {
            let currentText = aiQuestionInput.placeholder;
            if (currentText.length > 0) {
                aiQuestionInput.placeholder = currentText.slice(0, -1);
            } else {
                clearInterval(deleteInterval);
                placeholderIndex = (placeholderIndex + 1) % placeholderTexts.length;
                startPlaceholderAnimation();
            }
        }, AI_DELETING_SPEED);
    }
    
    aiQuestionInput.addEventListener('focus', stopPlaceholderAnimation);
    aiQuestionInput.addEventListener('blur', () => { if (aiQuestionInput.value === '') startPlaceholderAnimation(); });
    
    aiForm.addEventListener('submit', () => stopPlaceholderAnimation());
    const originalSubmitHandler = aiForm.onsubmit;
    aiForm.onsubmit = (e) => {
        if(originalSubmitHandler) originalSubmitHandler(e);
        const thinkingMessage = "Einen Moment, Evita gleicht gerade ihre Bits und Bytes ab...";
        // ... Logik um nach dem Submit die Animation wieder zu starten
    };

    startPlaceholderAnimation();
}


// Exportiert eine Haupt-Initialisierungsfunktion für alle Typewriter
export function initTypewriters() {
    initH1Typewriter();
    initAiPlaceholderTypewriter();

    // Stellt den Cursor-Stil bereit
    const style = document.createElement('style');
    style.innerHTML = `.cursor { display: inline-block; width: 3px; height: 1em; background-color: var(--accent-color); animation: blink 0.7s infinite; vertical-align: bottom; margin-left: 5px; } @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`;
    document.head.appendChild(style);
}

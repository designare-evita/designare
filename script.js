// In script.js
// --- H1-TYPEWRITER ---
const typewriterElement = document.getElementById('typewriter-h1');
if (typewriterElement) {
    const textsToType = [ "Michael Kanda", "Web-Entwickler", "KI-Spezialist" ]; // GEÄNDERT
    let textIndex = 0; let charIndex = 0; let isDeleting = false;
    const typingSpeed = 110, deletingSpeed = 55, delayBetweenTexts = 2000;

    function typeWriter() { /* ... unveränderte Funktion ... */ }

    // ... (restlicher unveränderter Typewriter-Code) ...
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
            isDeleting = true; setTimeout(typeWriter, delayBetweenTexts); return;
        }
        if (isDeleting && charIndex === 0) {
            isDeleting = false; textIndex = (textIndex + 1) % textsToType.length; setTimeout(typeWriter, 500); return;
        }
        const currentSpeed = isDeleting ? deletingSpeed : typingSpeed;
        setTimeout(typeWriter, currentSpeed);
    }
    const style = document.createElement('style');
    style.innerHTML = `.cursor { display: inline-block; width: 3px; height: 1em; background-color: var(--accent-color); animation: blink 0.7s infinite; vertical-align: bottom; margin-left: 5px; } @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`;
    document.head.appendChild(style);
    setTimeout(typeWriter, 500);
}
import { initTheme } from './theme.js';
import { initEffects } from './effects.js';
import { initTypewriter } from './typewriter.js';
import { initModals, loadHeaderFooter, initLegalLinks, initContactForm, initCookieBanner } from './modals.js';
import { initAIForm } from './ai-form.js';

document.addEventListener('DOMContentLoaded', () => {
    loadHeaderFooter();
    initTheme();
    initEffects();
    initTypewriter();
    initModals();
    initLegalLinks();
    initContactForm();
    initCookieBanner();
    initAIForm();
});

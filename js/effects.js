// js/effects.js

export function initEffects() {
    // Sicherheitscheck: Ist die Particles-Lib geladen?
    if (typeof window.particlesJS === 'undefined') {
        console.warn('Particles.js Library nicht gefunden.');
        return;
    }

    // Wir holen uns die Farbe direkt aus deinen CSS-Variablen
    // So passt sich die Farbe automatisch an, wenn du sie im CSS änderst.
    const style = getComputedStyle(document.body);
    const particleColor = style.getPropertyValue('--particle-color').trim() || '#e0e0e0';

    /* KONFIGURATION FÜR "MINIMAL HELLER":
       Wir nutzen eine sehr niedrige Opacity.
       Zusammenspiel: 
       CSS #particles-js hat opacity: 0.4
       JS config hat opacity: 0.1
       Ergebnis: 0.4 * 0.1 = 0.04 (4% Sichtbarkeit) -> Sehr subtil!
    */

    window.particlesJS('particles-js', {
        "particles": {
            "number": {
                "value": 60, // Nicht zu viele Partikel, wirkt ruhiger
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": particleColor // Nimmt #e0e0e0 aus deinem CSS
            },
            "shape": {
                "type": "circle"
            },
            "opacity": {
                "value": 0.1, // Hier ist der Schlüssel für "minimal heller"
                "random": true, // Manche sind noch schwächer
                "anim": {
                    "enable": true,
                    "speed": 0.5,
                    "opacity_min": 0.02,
                    "sync": false
                }
            },
            "size": {
                "value": 3,
                "random": true,
                "anim": {
                    "enable": false
                }
            },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": particleColor,
                "opacity": 0.08, // Auch die Linien sehr zart halten
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 1, // Langsame Bewegung wirkt edler
                "direction": "none",
                "random": false,
                "straight": false,
                "out_mode": "out",
                "bounce": false
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": {
                    "enable": true,
                    "mode": "grab" // Verbindet Partikel mit der Maus
                },
                "onclick": {
                    "enable": true,
                    "mode": "push"
                },
                "resize": true
            },
            "modes": {
                "grab": {
                    "distance": 140,
                    "line_linked": {
                        "opacity": 0.2 // Beim Hovern etwas heller
                    }
                }
            }
        },
        "retina_detect": true
    });
    
    console.log('✨ Particles Effects initialisiert');
}

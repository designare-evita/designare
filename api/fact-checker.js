// fact-checker.js - Separates Fact-Checking Modul für Silas

class FactChecker {
    constructor() {
        this.claimPatterns = [
            /(\d+(?:,\d+)*(?:\.\d+)?)\s*%/g,  // Prozentangaben
            /(\d+(?:,\d+)*(?:\.\d+)?)\s*(millionen?|milliarden?|tausende?)/gi, // Große Zahlen
            /(studien zeigen|forschung belegt|wissenschaftlich bewiesen)/gi, // Studien-Claims
            /(marktführer|nummer 1|beste|größte)/gi, // Superlative
            /(bis zu \d+)/gi, // "Bis zu X" Claims
            /(garantiert|100%|immer|nie)/gi // Absolute Aussagen
        ];

        this.problematicPhrases = {
            'garantiert': { replacement: 'in der Regel', severity: 'high' },
            '100%': { replacement: 'sehr hohe', severity: 'high' },
            'immer': { replacement: 'üblicherweise', severity: 'medium' },
            'nie': { replacement: 'selten', severity: 'medium' },
            'nummer 1': { replacement: 'eine führende Position', severity: 'high' },
            'marktführer': { replacement: 'ein etablierter Anbieter', severity: 'high' },
            'revolutionär': { replacement: 'innovativ', severity: 'medium' },
            'einzigartig': { replacement: 'besonders', severity: 'low' },
            'beste': { replacement: 'sehr gute', severity: 'medium' },
            'größte': { replacement: 'eine der größten', severity: 'medium' }
        };
    }

    /**
     * Hauptfunktion: Analysiert und korrigiert Content
     */
    async checkContent(contentData, keyword) {
        const result = {
            keyword,
            totalClaims: 0,
            flaggedClaims: [],
            suggestions: [],
            confidenceScore: 85, // Default Score
            correctedContent: { ...contentData },
            corrections: []
        };

        try {
            // 1. Extrahiere alle Claims
            const claims = this.extractClaims(contentData);
            result.totalClaims = claims.length;

            // 2. Evaluiere und korrigiere jeden Claim
            for (const claim of claims) {
                const evaluation = this.evaluateClaim(claim);
                
                if (evaluation.needsCorrection) {
                    result.flaggedClaims.push({
                        original: claim.text,
                        corrected: evaluation.suggestion,
                        field: claim.field,
                        severity: evaluation.severity,
                        reason: evaluation.reason
                    });

                    // Wende Korrektur an
                    result.correctedContent[claim.field] = this.applyCorrectionToField(
                        result.correctedContent[claim.field],
                        claim.text,
                        evaluation.suggestion
                    );

                    result.corrections.push({
                        field: claim.field,
                        from: claim.text,
                        to: evaluation.suggestion
                    });
                }
            }

            // 3. Berechne finalen Confidence Score
            result.confidenceScore = this.calculateScore(result);

            // 4. Generiere Suggestions für manuelle Review
            result.suggestions = this.generateSuggestions(result);

            console.log(`Fact-Check für '${keyword}': ${result.flaggedClaims.length}/${result.totalClaims} Claims korrigiert, Score: ${result.confidenceScore}`);

            return result;

        } catch (error) {
            console.error('Fact-check error:', error);
            return {
                ...result,
                error: error.message,
                correctedContent: contentData // Fallback auf Original
            };
        }
    }

    /**
     * Extrahiert Claims aus allen relevanten Feldern
     */
    extractClaims(contentData) {
        const claims = [];
        const fieldsToCheck = [
            'hero_text', 'hero_subtext', 'benefits_list', 'features_list',
            'social_proof', 'testimonial_1', 'testimonial_2', 
            'guarantee_text', 'trust_signals', 'meta_description'
        ];

        fieldsToCheck.forEach(field => {
            if (contentData[field]) {
                const fieldClaims = this.extractClaimsFromText(contentData[field], field);
                claims.push(...fieldClaims);
            }
        });

        return claims;
    }

    /**
     * Extrahiert Claims aus einzelnem Text-Feld
     */
    extractClaimsFromText(text, field) {
        const claims = [];
        
        // Pattern-basierte Extraktion
        this.claimPatterns.forEach((pattern, patternIndex) => {
            const matches = [...text.matchAll(pattern)];
            matches.forEach(match => {
                claims.push({
                    text: match[0],
                    field: field,
                    patternType: patternIndex,
                    fullContext: this.getContext(text, match.index, 30),
                    position: match.index
                });
            });
        });

        // Phrase-basierte Extraktion
        Object.keys(this.problematicPhrases).forEach(phrase => {
            const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
            const matches = [...text.matchAll(regex)];
            matches.forEach(match => {
                claims.push({
                    text: match[0],
                    field: field,
                    patternType: 'phrase',
                    fullContext: this.getContext(text, match.index, 30),
                    position: match.index
                });
            });
        });

        return claims;
    }

    /**
     * Evaluiert einen einzelnen Claim
     */
    evaluateClaim(claim) {
        // Prüfe gegen problematische Phrases
        for (const [phrase, correction] of Object.entries(this.problematicPhrases)) {
            if (claim.text.toLowerCase().includes(phrase.toLowerCase())) {
                return {
                    needsCorrection: true,
                    suggestion: claim.text.replace(new RegExp(phrase, 'gi'), correction.replacement),
                    severity: correction.severity,
                    reason: `Unbelegte/übertriebene Behauptung: "${phrase}"`
                };
            }
        }

        // Pattern-spezifische Evaluierung
        if (claim.patternType === 2) { // Studien-Claims
            return {
                needsCorrection: true,
                suggestion: claim.text.replace(/(studien zeigen|forschung belegt|wissenschaftlich bewiesen)/gi, 'Untersuchungen deuten darauf hin'),
                severity: 'high',
                reason: 'Unbelegte Studien-Referenz'
            };
        }

        // Numerische Claims überprüfen
        if (claim.patternType === 0 || claim.patternType === 1) { // Prozente oder große Zahlen
            const hasHyperbole = /über \d|mehr als \d/i.test(claim.fullContext);
            if (hasHyperbole) {
                return {
                    needsCorrection: false,
                    severity: 'low',
                    reason: 'Numerischer Claim mit Kontext - manuelle Prüfung empfohlen'
                };
            }
        }

        return { needsCorrection: false };
    }

    /**
     * Wendet Korrektur auf Text-Feld an
     */
    applyCorrectionToField(fieldText, originalClaim, correction) {
        // Case-insensitive replacement
        const regex = new RegExp(originalClaim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        return fieldText.replace(regex, correction);
    }

    /**
     * Berechnet Confidence Score basierend auf Korrekturen
     */
    calculateScore(factCheckResult) {
        const { totalClaims, flaggedClaims } = factCheckResult;
        
        if (totalClaims === 0) return 85; // Default für claim-freien Content
        
        const severityWeights = { high: 20, medium: 12, low: 5 };
        let totalPenalty = 0;

        flaggedClaims.forEach(claim => {
            totalPenalty += severityWeights[claim.severity] || 10;
        });

        // Basis-Score minus Penalties
        const baseScore = 90;
        const finalScore = Math.max(30, baseScore - totalPenalty);
        
        return Math.round(finalScore);
    }

    /**
     * Generiert Suggestions für manuelle Review
     */
    generateSuggestions(factCheckResult) {
        const suggestions = [];

        if (factCheckResult.confidenceScore < 70) {
            suggestions.push({
                type: 'review',
                message: 'Content sollte vor Veröffentlichung manuell überprüft werden',
                priority: 'high'
            });
        }

        if (factCheckResult.flaggedClaims.length > 3) {
            suggestions.push({
                type: 'rewrite',
                message: 'Viele Marketing-Claims gefunden - consider weniger werbliche Sprache',
                priority: 'medium'
            });
        }

        return suggestions;
    }

    /**
     * Hilfsfunktion: Kontext um Claim extrahieren
     */
    getContext(text, position, length) {
        const start = Math.max(0, position - length);
        const end = Math.min(text.length, position + length);
        return text.substring(start, end).trim();
    }

    /**
     * Erstellt erweiterten Prompt mit Fact-Check Anweisungen
     */
    static createFactCheckAwarePrompt(keyword, intent, zielgruppe, tonalitaet, usp, domain, email, phone) {
        const roleAndTask = intent === 'commercial' 
            ? 'Du bist ein erstklassiger Marketing-Texter und SEO-Stratege. Dein Stil ist überzeugend, klar und auf Conversions ausgerichtet.'
            : 'Du bist ein Fachexperte und SEO-Redakteur. Dein Stil ist informativ, klar und hilfreich.';

        let kontext = "";
        if (zielgruppe) kontext += `- ZIELGRUPPE: ${zielgruppe}\n`;
        if (tonalitaet) kontext += `- TONALITÄT: ${tonalitaet}\n`;
        if (usp) kontext += `- ALLEINSTELLUNGSMERKMAL (USP): ${usp}\n`;
        if (domain) kontext += `- WEBSEITE: ${domain}\n`;
        if (email) kontext += `- E-MAIL: ${email}\n`;
        if (phone) kontext += `- TELEFONNUMMER: ${phone}\n`;

        return `
            Du bist ein erstklassiger SEO-Content-Strategist. Erstelle vollständigen Landingpage-Content für das Thema "${keyword}".

            ${kontext ? `ZUSÄTZLICHER KONTEXT, DER UNBEDINGT ZU BEACHTEN IST:\n${kontext}` : ''}

            ROLLE: ${roleAndTask}
            
            🚨 WICHTIGE FACT-CHECKING RICHTLINIEN:
            - VERMEIDE unbelegte Superlative wie "beste", "nummer 1", "marktführer"
            - VERWENDE KEINE absoluten Begriffe wie "garantiert", "100%", "immer", "nie"
            - ERSTELLE realistische, glaubwürdige Aussagen statt übertriebener Claims
            - NUTZE messbare, spezifische Begriffe statt vager Behauptungen
            - BEI Zahlen: verwende "bis zu", "durchschnittlich", "typischerweise"
            - KEINE unbelegten Studien-Referenzen ("Studien zeigen", "wissenschaftlich bewiesen")
            
            ERSETZE problematische Begriffe:
            ❌ "revolutionär" → ✅ "innovativ"
            ❌ "einzigartig" → ✅ "besonders"  
            ❌ "garantiert" → ✅ "in der Regel"
            ❌ "immer" → ✅ "üblicherweise"
            ❌ "marktführer" → ✅ "ein etablierter Anbieter"
            ❌ "beste" → ✅ "sehr gute"

            WICHTIG: Deine Antwort MUSS ein einziges, valides JSON-Objekt sein. Beginne direkt mit { und ende mit }.
            
            Das JSON-Objekt muss ALLE folgenden Felder enthalten und mit umfangreichem, aber FAKTISCH VERANTWORTLICHEM Content füllen:
            {
              "post_title": "SEO-optimierter Titel (50-60 Zeichen) für ${keyword}",
              "post_name": "seo-freundlicher-url-slug-fuer-${keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}",
              "meta_title": "Alternativer SEO-Titel (50-60 Zeichen) für ${keyword}",
              "meta_description": "Fesselnde Meta-Beschreibung (150-160 Zeichen) mit CTA für ${keyword}",
              "h1": "Kraftvolle H1-Überschrift für ${keyword}, die den Hauptnutzen kommuniziert",
              "h2_1": "Erste H2-Überschrift (Problemorientiert) für ${keyword}",
              "h2_2": "Zweite H2-Überschrift (Lösungsorientiert) für ${keyword}",
              "h2_3": "Dritte H2-Überschrift (Feature-/Nutzen-orientiert) für ${keyword}",
              "h2_4": "Vierte H2-Überschrift (Vertrauensbildend) für ${keyword}",
              "primary_cta": "Kurzer, starker Call-to-Action Text (z.B. 'Jetzt ${keyword} anfragen')",
              "secondary_cta": "Alternativer, sanfterer Call-to-Action (z.B. 'Mehr über ${keyword} erfahren')",
              "hero_text": "Überzeugender Einleitungstext für den Hero-Bereich (50-80 Wörter) über ${keyword} - OHNE Superlative",
              "hero_subtext": "Unterstützende Unterüberschrift für den Hero-Bereich (20-30 Wörter) zu ${keyword}",
              "benefits_list": "HTML-Liste (<ul><li>...</li></ul>) mit 4-6 realistischen, messbaren Vorteilen von ${keyword}",
              "features_list": "HTML-Liste (<ul><li>...</li></ul>) mit 4-6 konkreten, verifizierbaren Features von ${keyword}",
              "social_proof": "Realistischer Satz über soziale Bewährtheit OHNE übertriebene Zahlen",
              "testimonial_1": "Glaubwürdiges, realistisches Kunden-Testimonial mit Name und authentischer Aussage zu ${keyword}",
              "testimonial_2": "Zweites, realistisches Kunden-Testimonial mit Name und authentischer Aussage zu ${keyword}",
              "pricing_title": "Überschrift für den Preisbereich (z.B. 'Wählen Sie Ihren ${keyword}-Plan')",
              "price_1": "Realistische Beschreibung für das erste ${keyword}-Preispaket (Starter/Basic)",
              "price_2": "Realistische Beschreibung für das zweite ${keyword}-Preispaket (Professional)",
              "price_3": "Realistische Beschreibung für das dritte ${keyword}-Preispaket (Enterprise/Premium)",
              "faq_1": "Erste häufig gestellte, realistische Frage zu ${keyword}",
              "faq_answer_1": "Ehrliche, hilfreiche Antwort auf die erste ${keyword}-Frage (30-50 Wörter)",
              "faq_2": "Zweite häufig gestellte, praktische Frage zu ${keyword}",
              "faq_answer_2": "Ehrliche, hilfreiche Antwort auf die zweite ${keyword}-Frage (30-50 Wörter)",
              "faq_3": "Dritte häufig gestellte, relevante Frage zu ${keyword}",
              "faq_answer_3": "Ehrliche, hilfreiche Antwort auf die dritte ${keyword}-Frage (30-50 Wörter)",
              "contact_info": "Realistische Kontaktinformation oder Hinweis für ${keyword}",
              "footer_cta": "Abschließender Call-to-Action OHNE übertriebene Versprechen",
              "trust_signals": "Ehrliche Vertrauenssignale für ${keyword} OHNE Superlative",
              "guarantee_text": "Realistische Garantie-Aussage für ${keyword} OHNE absolute Versprechen"
            }

            QUALITÄTS-ANFORDERUNGEN:
            - Jedes Textfeld muss mindestens 10-15 Wörter enthalten (außer CTAs)
            - Hero-Text: 50-80 Wörter, faktisch verantwortlich
            - FAQ-Antworten: 30-50 Wörter, ehrlich und hilfreich
            - Benefits/Features: 4-6 Listenelemente mit realistischen, messbaren Beschreibungen
            - Testimonials: Authentische Zitate mit realistischen Namen und Firmen
            - KEINE unbelegten Behauptungen oder Superlative
            - Alle Texte müssen spezifisch auf "${keyword}" bezogen sein
            - Professioneller, vertrauensvoller Ton ohne Übertreibungen
            - SEO-optimiert aber natürlich lesbar
            - Deutsche Sprache
            - Alle Listen müssen vollständiges HTML-Markup enthalten
            
            Erstelle jetzt das vollständige JSON-Objekt mit verantwortlichem, fact-check-sicherem Content für "${keyword}":
        `;
    }
}

module.exports = { FactChecker };

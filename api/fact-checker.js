// fact-checker.js - Angepasste Version

class FactChecker {
    constructor() {
        this.problematicPhrases = {
            'garantiert': { severity: 'high' },
            '100%': { severity: 'high' },
            'immer': { severity: 'medium' },
            'nie': { severity: 'medium' },
            'nummer 1': { severity: 'high' },
            'marktführer': { severity: 'high' },
            'beste': { severity: 'medium' },
            'revolutionär': { severity: 'medium' },
            'einzigartig': { severity: 'low' }
        };
    }

    async checkContent(contentData, keyword) {
        const result = {
            keyword,
            flaggedClaims: [],
            confidenceScore: 95,
        };
        const fieldsToCheck = ['hero_text', 'social_proof', 'guarantee_text', 'meta_description', 'benefits_list', 'features_list', 'benefits_list_fließtext', 'features_list_fließtext', 'testimonial_1', 'testimonial_2', 'h2_1_text', 'h2_2_text', 'h2_3_text', 'h2_4_text' ];
        let penalty = 0;

        fieldsToCheck.forEach(field => {
            if (contentData[field]) {
                Object.keys(this.problematicPhrases).forEach(phrase => {
                    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
                    if (regex.test(contentData[field])) {
                        const { severity } = this.problematicPhrases[phrase];
                        penalty += (severity === 'high' ? 15 : (severity === 'medium' ? 10 : 5));
                        result.flaggedClaims.push({ original: phrase, field, severity });
                    }
                });
            }
        });

        result.confidenceScore = Math.max(30, 95 - penalty);
        console.log(`E-E-A-T Check für '${keyword}': Score ${result.confidenceScore}%, ${result.flaggedClaims.length} problematische Phrasen gefunden.`);
        return result;
    }

    generateResponsiblePrompt(keywordData) {
        const { keyword, intent, zielgruppe, tonalitaet, usp, domain, email, phone, address, brand, grammaticalPerson } = keywordData;

        const roleAndTask = intent === 'commercial'
            ? 'Du bist ein erstklassiger, menschenähnlicher Marketing-Texter und SEO-Stratege. Dein Stil ist überzeugend, menschlich, natürlich, klar und auf Conversions ausgerichtet.'
            : 'Du bist ein menschenähnlicher Fachexperte und SEO-Redakteur. Dein Stil ist natürlich, informativ, klar und hilfreich. Du schreibst für Menschen, die echten Mehrwert aus deinen Texten ziehen wollen.';

        let kontext = "";
        if (brand) kontext += `- BRAND/ANSPRECHPARTNER: ${brand}\n`;
        if (zielgruppe) kontext += `- ZIELGRUPPE: ${zielgruppe}\n`;
        if (tonalitaet) kontext += `- TONALITÄT: ${tonalitaet}\n`;
        if (usp) kontext += `- ALLEINSTELLUNGSMERKMAL (USP): ${usp}\n`;
        if (domain) kontext += `- WEBSEITE: ${domain}\n`;
        if (email) kontext += `- E-MAIL FÜR CTA: ${email}\n`;
        if (phone) kontext += `- TELEFONNUMMER FÜR CTA: ${phone}\n`;
        if (address) kontext += `- ADRESSE FÜR CTA: ${address}\n`;

        return `
            Hier ist ein Beispiel für einen perfekten, faktenbasierten JSON-Output zum Thema "SEO & GEO Agentur":
            {
              "post_title": "SEO & GEO Agentur",
              "post_name": "seo-geo-agentur",
              "meta_title": "SEO & GEO Agentur ➤ Mehr Sichtbarkeit auf Google und in KI",
              "meta_description": "Jetzt mit SEO & GEO auf Platz 1 in Google & KI ✓ SEO Agentur ✓ Über 500 erfolgreiche Projekte ✓ Kostenfreies Erstgespräch.",
             "h1": "SEO Agentur: Mehr Sichtbarkeit auf Google und in KI",
  "h2_1": "Mehr als nur eine SEO und GEO Agentur",
  "h2_1_text": "Auf den ersten Blick könnte man meinen, wir sind eine klassische SEO und GEO Agentur mit Sitz in Niederösterreich. Näher betrachtet sind wir aber mehr als das. Ob SEO, GEO oder LLMO – wir sorgen dafür, dass dein Unternehmen nicht nur gefunden, sondern auch verstanden wird. Wir hören zu, analysieren, recherchieren, denken mit und setzen um. Mit Leidenschaft, Struktur und dem Ziel, dein Unternehmen online maximal sichtbar zu machen.",
  "h2_2": "Mehr Sichtbarkeit in Suchmaschinen und KI sichern",
  "h2_2_text": "Professionelle Suchmaschinenoptimierung (SEO) bringt deine Website nachhaltig auf Top-Positionen bei Google &amp; Co. Gleichzeitig sorgt Generative Engine Optimization (GEO) bzw. LLMO (Large Language Model Optimization) dafür, dass deine Inhalte auch in den Antworten von KI-Sprachmodellen wie ChatGPT, Gemini, Perplexity oder im Google AI Mode präsent sind. Wir helfen dir und deinem Unternehmen dabei, diese Sichtbarkeit zu erreichen.",
  "h2_3": "Mehr Reichweite bedeutet mehr Anfragen & Umsatz",
  "h2_3_text": "Gezielte SEO-Strategien steigern deine Online-Sichtbarkeit und damit deine Reichweite. Das führt mehr potenzielle Kunden direkt auf deine Website. Durch GEO wirst du zusätzlich dort gefunden, wo Nutzer zunehmend suchen: in KI-gestützten Systemen. Wir vereinen SEO und GEO mit Conversion-Optimierung und gut gestalteten Landingpages. So generierst du konstant neue Anfragen und steigerst langfristig deinen Umsatz.",
  "h2_4": "Nachhaltiges organisches Wachstum statt teurer Werbung",
  "h2_4_text": "SEO und GEO wirken dauerhaft und sind deutlich nachhaltiger als kurzfristige Werbeanzeigen. Laut einer empirischen Studie der NYU Stern School of Business zeigen organische Suchergebnisse nachhaltigere Leistung im Vergleich zu bezahlter Werbung, wobei Keyword-spezifische Faktoren einen statistisch signifikant stärkeren Einfluss auf organische Suche haben als auf bezahlte Anzeigen.",
              "primary_cta": "Jetzt beraten lassen",
              "secondary_cta": "Mehr erfahren",
              "hero_text": "Als Marketing-Leiter oder Geschäftsführer weißt du: Digitale Sichtbarkeit ist entscheidend. Doch mit der Entwicklung von KI-Suchmaschinen ändern sich die Regeln. Wir helfen dir, nicht nur gefunden zu werden, sondern als erste Wahl in generativen Antworten zu erscheinen. Entdecke, wie du mit einer cleveren GEO-Strategie der Konkurrenz einen Schritt voraus bist.",
              "hero_subtext": "Wir setzen uns für deinen nachhaltigen digitalen Erfolg ein",
              "benefits_list_fließtext": "Steigere deine Sichtbarkeit in Suchmaschinen und KI-generierten Antworten, erhöhe deine Markenautorität durch strategische PR und profitiere von einer integrierten Marketingstrategie aus einer Hand, um deine Zielgruppe präziser zu erreichen.",
              "benefits_list": "<ul><li>Steigere deine Sichtbarkeit in herkömmlichen Suchmaschinen (SEO).</li><li>Optimiere deine Inhalte für KI-basierte Suchergebnisse (GEO).</li><li>Erhöhe deine Markenautorität durch strategische Digitale PR &amp; Backlinks.</li><li>Profitiere von einer integrierten Marketingstrategie aus einer Hand.</li><li>Erreiche deine Zielgruppe präziser und effektiver.</li></ul>",
              "features_list_fließtext": "Wir bieten dir ganzheitliche SEO-Analysen, spezialisierte GEO-Strategien, professionelle Content-Erstellung, gezielten Backlink-Aufbau und kontinuierliches Monitoring für optimale Ergebnisse.",
              "features_list": "<ul><li>Ganzheitliche SEO-Analyse &amp; On-Page/Off-Page Optimierung.</li><li>Spezialisierte GEO-Strategien für generative Engines.</li><li>Professionelle Content-Erstellung und -Optimierung.</li><li>Gezielter Aufbau hochwertiger Backlinks und Digitale PR.</li><li>Kontinuierliches Monitoring und Reporting der Performance.</li></ul>",
              "social_proof": "Über 150 Unternehmen vertrauen bereits auf unsere Expertise in digitaler Sichtbarkeit.",
              "testimonial_1": "Dank der Arbeit des gesamten maxonline Teams hat sich unsere Sichtbarkeit in kürzester Zeit enorm gesteigert, was sich natürlich auch direkt positiv auf unseren Umsatz ausgewirkt hat. - Anna L., Wien",
              "testimonial_2": "Eine ganz klare Weiterempfehlung für alle, die wirklich Ergebnisse sehen wollen und gleichzeitig Wert auf eine persönliche, professionelle und ehrliche Zusammenarbeit legen. - Markus T., Berlin",
              "pricing_title": "Laufende SEO & GEO Betreuung",
              "price_1": "<strong>Starter</strong><br />Für den Einstieg in die Sichtbarkeit. Ideal für kleine Unternehmen, die ihre Online-Präsenz gezielt aufbauen wollen.<br />✅ SEO-Grundanalyse<br />✅ Keyword-Strategie<br />✅ Onpage-Optimierung<br />✅ laufende Betreuung<br /><strong>ab 790 € pro Monat</strong>",
              "price_2": "<strong>Pro</strong><br />Für wachsende Marken mit klaren Zielen. Du willst mehr Reichweite, bessere Rankings und sichtbare Ergebnisse.<br />✅ SEO + GEO-Strategie<br />✅ Technisches SEO & Content-Optimierung<br />✅ Linkstruktur & Performance<br />✅ laufende Betreuung<br /><strong>ab 1.990 € pro Monat</strong>",
              "price_3": "<strong>Maximal</strong><br />Für Unternehmen, die online ganz vorne stehen wollen. Hier entsteht Sichtbarkeit mit System – dauerhaft und messbar.<br />✅ SEO + GEO + LLMO-Komplettpaket<br />✅ Content- & KI-Optimierung<br />✅ Laufende Analysen & Reports<br />✅ Laufende Betreuung<br /><strong>ab 3.990 € pro Monat</strong>",
              "faq_1": "Wie läuft eine SEO und GEO Betreuung bei [BRANDNAME] ab?",
              "faq_answer_1": "Bei uns werden moderne SEO mit KI-gestützten Tools kombiniert, um gezielt Inhalte, Strukturen und Keywords zu optimieren. Dabei bekommst du persönliche Betreuung und regelmäßige Analysen, um Fortschritte messbar zu machen. Ziel ist nicht nur ein besseres Ranking bei Google, sondern auch langfristige Sichtbarkeit – auch in KI-Systemen wie ChatGPT.",
              "faq_2": "Wie lange dauert es normalerweise, bis SEO-Maßnahmen Wirkung zeigen?",
              "faq_answer_2": "SEO ist in der Regel eine mittel- bis langfristige Strategie. Erste Ergebnisse lassen sich oft nach 2–3 Monaten beobachten, echte nachhaltige Sichtbarkeit entsteht meist über mehrere Monate hinweg. Bei maxonline wird die Optimierung individuell geplant und kontinuierlich überprüft, um langfristig erfolgreich zu sein – auch in Kombination mit GEO für KI-Sichtbarkeit.",
              "faq_3": "Wie kann ich herausfinden, warum meine Website bei Google schlecht rankt?",
              "faq_answer_3": "Eine fundierte SEO-Analyse zeigt dir, wo deine Website technische Schwächen oder inhaltliche Lücken hat. maxonline bietet solche Analysen an, bei denen z.B. Keywords, Ladezeiten, Mobilfreundlichkeit und externe Verlinkungen geprüft werden. So bekommst du einen klaren Überblick, was konkret verbessert werden muss.",
              "faq_4": "Was bringt mir GEO konkret, wenn ich bereits SEO mache?",
              "faq_answer_4": "GEO ergänzt deine bestehende SEO-Strategie, indem es deine Inhalte speziell für KI-Systeme aufbereitet. Das bedeutet, dass dein Unternehmen nicht nur bei Google besser gefunden wird, sondern auch in Antworten von ChatGPT oder Perplexity auftauchen kann. Besonders in Zeiten, in denen Nutzer immer öfter KI für Produktempfehlungen nutzen, kann GEO einen entscheidenden Unterschied machen.",
              "faq_5": "Kann ich meine Sichtbarkeit in ChatGPT gezielt verbessern?",
              "faq_answer_5": "Ja, durch gezielte GEO-Maßnahmen (Generative Engine Optimization) kann deine Marke so positioniert werden, dass sie auch in KI-generierten Antworten häufiger genannt wird. Das funktioniert unter anderem durch hochwertige Inhalte, strukturierte Daten und digitaler PR, die von Systemen wie ChatGPT besser erkannt und genutzt werden.",
              "contact_info": "Lass uns über dein Projekt sprechen! Melde dich noch heute für eine kostenlose Beratung.",
              "footer_cta": "Jetzt kostenloses Erstgespräch vereinbaren",
              "trust_signals": "Ganzheitliche Strategien | Transparentes Reporting | Zukunftsorientiert",
              "guarantee_text": "Garantiert mehr Sichtbarkeit auf Google und in KI-Sprachmodellen."
            }

            ---

            Erstelle jetzt einen ebenso hochwertigen und FAKTISCH VERANTWORTLICHEN JSON-Output für das Thema "${keyword}".

            ${kontext ? `ZUSÄTZLICHER KONTEXT, DER UNBEDINGT ZU BEACHTEN IST:\n${kontext}` : ''}

            ROLLE: ${roleAndTask}

            🚨 WICHTIGE RICHTLINIEN:
            - Der "meta_title" darf maximal 55 Zeichen lang sein.
            - Die "meta_description" darf maximal 155 Zeichen lang sein.
            - VERWENDE für "meta_title" und "meta_description" Sympole als Trennzeichen.
            - VERWENDE für "post_title" immer das keyword.
            - VERMEIDE Superlative wie "beste", "Nummer 1", "Marktführer".
            - VERMEIDE übermäßigen Einsatz von Gedanken-Trennstrichen in den Texten.
            - Achte auf eine natürliche Sprache, die dem Text-Stil eines Menschen sehr ähnlich ist.
            - VERWENDE KEINE absoluten Begriffe wie "garantiert", "100%", "immer", "nie".
            - Deine Antwort MUSS ein einziges, valides JSON-Objekt sein. Beginne direkt mit { und ende mit }.
            - Fülle ALLE geforderten Felder mit umfangreichem und thematisch passendem Inhalt.

            Das JSON-Objekt muss exakt diese Struktur haben:
            {
  "post_title": "...",
  "post_name": "...",
  "meta_title": "...",
  "meta_description": "...",
  "h1": "...",
  "h2_1": "...",
  "h2_1_text": "...",
  "h2_2": "...",
  "h2_2_text": "...",
  "h2_3": "...",
  "h2_3_text": "...",
  "h2_4": "...",
  "h2_4_text": "...",
  "primary_cta": "...",
  "secondary_cta": "...",
  "hero_text": "...",
  "hero_subtext": "...",
  "benefits_list_fließtext": "...",
  "benefits_list": "...",
  "features_list_fließtext": "...",
  "features_list": "...",
  "social_proof": "...",
  "testimonial_1": "...",
  "testimonial_2": "...",
  "pricing_title": "...",
  "price_1": "...",
  "price_2": "...",
  "price_3": "...",
  "faq_1": "...",
  "faq_answer_1": "...",
  "faq_2": "...",
  "faq_answer_2": "...",
  "faq_3": "...",
  "faq_answer_3": "...",
  "faq_4": "...",
  "faq_answer_4": "...",
  "faq_5": "...",
  "faq_answer_5": "...",
  "contact_info": "...",
  "footer_cta": "...",
  "trust_signals": "...",
  "guarantee_text": "..."
}
        `;
    }
}

module.exports = { FactChecker };

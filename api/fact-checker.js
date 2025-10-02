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
            ? 'Du bist ein erstklassiger Marketing-Texter und SEO-Stratege. Dein Stil ist überzeugend, klar und auf Conversions ausgerichtet.'
            : 'Du bist ein Fachexperte und SEO-Redakteur. Dein Stil ist informativ, klar und hilfreich.';

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
            Hier ist ein Beispiel für einen perfekten, faktenbasierten JSON-Output zum Thema "nachhaltige Kaffeebohnen":
            {
              "post_title": "Nachhaltige Kaffeebohnen: Genuss mit gutem Gewissen",
              "post_name": "nachhaltige-kaffeebohnen-kaufen",
              "meta_title": "Nachhaltige Kaffeebohnen: Worauf Sie beim Kauf achten sollten",
              "meta_description": "Entdecken Sie, woran Sie hochwertige und nachhaltige Kaffeebohnen erkennen. Tipps für fairen Anbau, Bio-Qualität und besten Geschmack.",
             "h1": "Nachhaltige Kaffeebohnen: Ihr Weg zu fairem und aromatischem Kaffee",
  "h2_1": "Was bedeutet Nachhaltigkeit bei Kaffee wirklich?",
  "h2_1_text": "Nachhaltigkeit im Kaffeeanbau umfasst weit mehr als nur Bio-Zertifikate. Es geht um faire Löhne für Bauern, umweltschonende Anbaumethoden ohne Pestizide und eine transparente Lieferkette vom Anbau bis zur Tasse. Echter nachhaltiger Kaffee berücksichtigt soziale, ökologische und ökonomische Aspekte gleichermaßen.",
  "h2_2": "Die wichtigsten Siegel für fairen Kaffee im Überblick",
  "h2_2_text": "Anerkannte Zertifizierungen wie Fairtrade, Bio und Rainforest Alliance garantieren bestimmte Standards. Fairtrade sichert Mindestpreise und faire Arbeitsbedingungen, Bio-Siegel stehen für ökologischen Anbau ohne Chemikalien, während Rainforest Alliance den Fokus auf Waldschutz und Biodiversität legt. Diese Siegel sind verlässliche Orientierungshilfen beim Kauf.",
  "h2_3": "Tipps für die Zubereitung von nachhaltigem Kaffee",
  "h2_3_text": "Die richtige Zubereitung holt das Beste aus nachhaltigen Kaffeebohnen heraus. Frisch gemahlene Bohnen entfalten ihr Aroma optimal, während die richtige Wassertemperatur zwischen 92-96°C liegt. Eine saubere Kaffeemaschine und das richtige Verhältnis von Wasser zu Kaffee (etwa 60g pro Liter) sind entscheidend für den perfekten Geschmack.",
  "h2_4": "Warum sich der Umstieg auf fairen Kaffee lohnt",
  "h2_4_text": "Die Entscheidung für nachhaltigen Kaffee hat direkte positive Auswirkungen. Sie unterstützen Kleinbauern in Entwicklungsländern, schützen Regenwälder vor Abholzung und genießen oft qualitativ hochwertigeren Kaffee. Der minimale Mehrpreis fließt direkt in bessere Lebensbedingungen und Umweltschutz – ein Beitrag, der messbare Veränderungen bewirkt.",
              "primary_cta": "Jetzt Sortiment entdecken",
              "secondary_cta": "Mehr über Anbau erfahren",
              "hero_text": "Immer mehr Kaffeeliebhaber legen Wert auf Nachhaltigkeit. Doch was bedeutet das genau? Es geht um faire Arbeitsbedingungen für Kaffeebauern, umweltschonenden Anbau ohne Pestizide und eine transparente Lieferkette. Guter Kaffee sollte nicht nur schmecken, sondern auch ein gutes Gefühl hinterlassen.",
              "hero_subtext": "Erfahren Sie, wie Sie mit jeder Tasse einen Unterschied machen können.",
              "benefits_list": "<ul><li>Faire Löhne und sichere Arbeitsbedingungen für Kaffeebauern unterstützen.</li><li>Die Umwelt durch biologischen Anbau und den Verzicht auf Monokulturen schonen.</li><li>Höhere Qualität und reineren Geschmack durch sorgfältige, traditionelle Anbaumethoden genießen.</li><li>Transparenz über die Herkunft und Verarbeitung der Bohnen erhalten.</li></ul>",
              "features_list": "<ul><li>Zertifiziert durch anerkannte Siegel wie Fairtrade, Bio oder Rainforest Alliance.</li><li>Schonende Langzeit-Trommelröstung zur vollen Entfaltung der Aromen.</li><li>Direkter Handel (Direct Trade) mit Kaffeekooperativen vor Ort.</li><li>Verpackung aus recycelbaren Materialien.</li></ul>",
              "benefits_list_fließtext": "Unterstützen Sie faire Löhne und sichere Arbeitsbedingungen für Kaffeebauern, schonen Sie die Umwelt durch biologischen Anbau und genießen Sie höhere Qualität durch traditionelle Methoden.",
              "features_list_fließtext": "Unser Kaffee ist durch Siegel wie Fairtrade und Bio zertifiziert, wird schonend geröstet und direkt von Kooperativen bezogen. Zudem verwenden wir recycelbare Verpackungen.",
              "social_proof": "Von über 3.000 zufriedenen Kunden als 'hervorragend' bewertet.",
              "testimonial_1": "Der beste Kaffee, den ich seit langem getrunken habe. Man schmeckt die Qualität und das gute Gewissen trinkt mit. - Anna L., Wien",
              "testimonial_2": "Endlich ein Anbieter, bei dem Transparenz wirklich gelebt wird. Die Informationen zur Herkunft sind erstklassig. - Markus T., Berlin",
              "pricing_title": "Unsere nachhaltigen Kaffeesorten",
              "price_1": "Mild & Ausgewogen: Ideal für den täglichen Genuss. 1kg Bohnen.",
              "price_2": "Kräftig & Intensiv: Perfekt für Espresso und Cappuccino. 1kg Bohnen.",
              "price_3": "Entkoffeiniert & Aromatisch: Voller Geschmack, ohne Koffein. 1kg Bohnen.",
              "faq_1": "Ist Bio-Kaffee automatisch auch fair gehandelt?",
              "faq_answer_1": "Nicht unbedingt. Ein Bio-Siegel bestätigt den ökologischen Anbau, während ein Fairtrade-Siegel auf soziale und ökonomische Fairness achtet. Für maximale Nachhaltigkeit ist eine Kombination beider Siegel empfehlenswert.",
              "faq_2": "Wie erkenne ich wirklich nachhaltigen Kaffee?",
              "faq_answer_2": "Achten Sie auf anerkannte Siegel. Informieren Sie sich zudem auf der Webseite des Anbieters über die Herkunft und die Handelsbeziehungen. Direkter Handel (Direct Trade) ist oft ein sehr gutes Zeichen für Fairness und Qualität.",
              "faq_3": "Ist nachhaltiger Kaffee teurer?",
              "faq_answer_3": "Nachhaltiger Kaffee ist oft etwas teurer, da faire Löhne und umweltschonende Methoden mehr Kosten verursachen. Dieser Aufpreis ist jedoch eine direkte Investition in bessere Lebensbedingungen und den Schutz der Umwelt.",
              "faq_4": "Welche Rolle spielt die Röstung?",
              "faq_answer_4": "Die Röstung ist entscheidend für das Aroma. Eine schonende Langzeit-Trommelröstung bei niedrigen Temperaturen sorgt dafür, dass sich die Aromen voll entfalten können und der Kaffee bekömmlicher wird.",
              "faq_5": "Woher beziehen Sie Ihren Kaffee?",
              "faq_answer_5": "Wir setzen auf direkten Handel mit kleinen Kaffeekooperativen in den besten Anbaugebieten der Welt. Das sichert nicht nur exzellente Qualität, sondern auch eine faire Bezahlung der Bauern.",
              "contact_info": "Bei Fragen zu unseren Kaffeesorten stehen wir Ihnen unter beispiel@kaffee.de oder unter 0123 456789 zur Verfügung. Unsere Adresse: Kaffeestraße 1, 12345 Röststadt",
              "footer_cta": "Entdecken Sie jetzt die Vielfalt nachhaltiger Kaffees",
              "trust_signals": "Bio-zertifiziert | Fairtrade-Partner | CO2-neutraler Versand",
              "guarantee_text": "Wir stehen für Qualität und Transparenz in jeder Bohne."
            }

            ---

            Erstelle jetzt einen ebenso hochwertigen und FAKTISCH VERANTWORTLICHEN JSON-Output für das Thema "${keyword}".

            ${kontext ? `ZUSÄTZLICHER KONTEXT, DER UNBEDINGT ZU BEACHTEN IST:\n${kontext}` : ''}

            ROLLE: ${roleAndTask}
            
            🚨 WICHTIGE RICHTLINIEN:
            - Der "meta_title" darf maximal 60 Zeichen lang sein.
            - Die "meta_description" darf maximal 160 Zeichen lang sein.
            - VERMEIDE Superlative wie "beste", "nummer 1", "marktführer".
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
  "benefits_list": "...", 
  "features_list": "...", 
  "benefits_list_fließtext": "...", 
  "features_list_fließtext": "...", 
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

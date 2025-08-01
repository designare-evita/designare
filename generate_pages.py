import pandas as pd
import os

def generate_landing_pages(template_file, data_file, output_folder):
    """
    Generiert Landingpages aus einer HTML-Vorlage und einer CSV-Datenquelle.
    """
    
    # Sicherstellen, dass der Ausgabeordner existiert
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        print(f"Ausgabeordner '{output_folder}' erstellt.")
    
    try:
        # 1. Die HTML-Vorlage laden
        with open(template_file, 'r', encoding='utf-8') as f:
            template_content = f.read()
    except FileNotFoundError:
        print(f"Fehler: Die Vorlagendatei '{template_file}' wurde nicht gefunden.")
        return
    
    try:
        # 2. Die CSV-Daten mit pandas laden
        df = pd.read_csv(data_file)
    except FileNotFoundError:
        print(f"Fehler: Die Datendatei '{data_file}' wurde nicht gefunden.")
        return
        
    # 3. Jede Zeile im DataFrame durchgehen und eine Seite generieren
    for index, row in df.iterrows():
        page_content = template_content
        
        # Ersetze die Platzhalter mit den Daten aus der aktuellen Zeile
        for column in df.columns:
            placeholder = '{{ ' + column + ' }}'
            page_content = page_content.replace(placeholder, str(row[column]))
        
        # Dateinamen aus der Spalte 'file_name' holen
        file_name = row['file_name']
        output_path = os.path.join(output_folder, file_name)
        
        # 4. Die generierte HTML-Datei speichern
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(page_content)
        
        print(f"Seite '{file_name}' erfolgreich generiert.")
        
    print("\nAlle Landingpages wurden erfolgreich erstellt!")

if __name__ == "__main__":
    # Dateipfade anpassen, falls nötig
    template_file = 'template.html'
    data_file = 'content.csv'
    output_folder = 'landingpages'
    
    # Skript ausführen
    generate_landing_pages(template_file, data_file, output_folder)

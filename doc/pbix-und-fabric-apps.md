# PBIX-Dateien mit Rayfin und Fabric Apps nutzen

## Kurzantwort

Eine Fabric App liest eine `.pbix`-Datei nicht direkt über einen Rayfin-Connector. Für Abfragen auf Power-BI-Daten verbindet sich die App mit einem **semantischen Modell**, das in einem Fabric- oder Power-BI-Workspace verfügbar ist.

Ein neues Modell muss nicht zwingend separat erstellt werden: Enthält die `.pbix` ein eigenes Modell, wird dieses beim Veröffentlichen in den Workspace als semantisches Modell bereitgestellt; vorhandene Berichte werden ebenfalls veröffentlicht. Verwendet die `.pbix` dagegen eine Liveverbindung zu einem bereits vorhandenen Modell, kann die App dieses bestehende Modell nutzen, sofern es erreichbar ist und die erforderlichen Berechtigungen vorliegen.

## Vorgehen

1. **Modell bereitstellen:** Eine `.pbix` mit eigenem Modell in Power BI Desktop über **Veröffentlichen** oder im Fabric-Workspace über **Hochladen** bereitstellen. Alternativ lässt sich der Import über die [Power BI Imports REST API](https://learn.microsoft.com/rest/api/power-bi/imports/post-import-in-group) automatisieren. Falls bereits ein geeignetes semantisches Modell existiert, kann dieses verwendet werden.
2. **Modell-ID ermitteln:** Im Rayfin-Projekt die Modelle des Workspace suchen:

   ```bash
   npx rayfin connector search --workspace-id <workspace-id> --type fabric-semanticmodel --json
   ```

3. **Connector hinzufügen:** Die ermittelte Item-ID des semantischen Modells verwenden:

   ```bash
   npx rayfin connector add --type fabric-semanticmodel --workspace-id <workspace-id> --item-id <semantic-model-item-id> --name salesModel --operations executeQuery
   ```

   Der Befehl ergänzt die Connector-Konfiguration und gibt einen zur CLI-Version passenden Installationsbefehl für die benötigten Pakete aus. Diesen Installationsbefehl ausführen.

4. **Daten in der App abfragen:** Den Connector-Client `ConnectorsRayfinClient` verwenden und DAX-Abfragen wie `EVALUATE …` gegen das Modell ausführen. Die App erstellt ihre Ansichten und Visualisierungen aus den Abfrageergebnissen.

## Voraussetzungen und Hinweise

- Für das Modell sind **Read- und Build-Berechtigungen** erforderlich. Der semantische Modell-Connector verwendet delegierte Authentifizierung: Die Berechtigungen der angemeldeten Person gelten für den Zugriff.
- Die Mandanteneinstellung **Semantic Model Execute Queries REST API** muss aktiviert sein. Das Modell muss auf einer Fabric- oder Power-BI-Kapazität gehostet sein.
- Die App fragt Tabellen und Measures des Modells ab. Die Visualisierungen des PBIX-Berichts werden nicht automatisch in die App übernommen.
- Bei einem Import-Modell muss die Aktualisierung im Service eingerichtet sein, damit die App aktuelle Daten erhält. Je nach Datenquelle sind Anmeldedaten und ein Gateway erforderlich. DirectQuery-Modelle fragen die angebundene Datenquelle ab.
- Der semantische Modell-Connector unterstützt `executeQuery`, aber kein direktes Zurückschreiben. Für Schreibzugriffe kann zusätzlich beispielsweise ein Warehouse oder eine SQL-Datenbank in Fabric verwendet werden.
- Erneutes Veröffentlichen kann ein vorhandenes semantisches Modell ersetzen und abhängige Berichte oder Apps beeinflussen. Änderungen an Spalten und Measures daher vorab prüfen.

## Quellen und Beispiel

- [Microsoft Learn: Connect Fabric Apps to Fabric data](https://learn.microsoft.com/fabric/apps/connectors)
- [Microsoft Learn: Create an app connected to a semantic model](https://learn.microsoft.com/fabric/apps/data-apps-template)
- [Microsoft Learn: Publish semantic models and reports from Power BI Desktop](https://learn.microsoft.com/power-bi/create-reports/desktop-upload-desktop-files)
- [Microsoft Learn: Imports – Post Import in Group](https://learn.microsoft.com/rest/api/power-bi/imports/post-import-in-group)
- Beispiel in diesem Repository: [finance-analytics – Connect a real semantic model](../finance-analytics/README.md#connect-a-real-semantic-model)

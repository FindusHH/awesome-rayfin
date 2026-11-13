# Vibe Coding mit Power BI

Stand der Recherche: 13. November 2026.

Mit „Vibe Coding“ ist hier gemeint, Anforderungen in natürlicher Sprache zu beschreiben und einen KI-Assistenten oder Agenten bei der Umsetzung einzusetzen. In Power BI gibt es dafür mehrere Wege. Entscheidend ist, ob ein **echter Power-BI-Bericht** oder eine **separate App mit Power-BI-Daten** entstehen soll.

| Ziel | Möglichkeit | Ergebnis |
| --- | --- | --- |
| Schnell Berichte erzeugen | Copilot direkt in Power BI | Power-BI-Berichtsseiten |
| Modelle per Agent entwickeln | Power BI Agentic und MCP | Semantisches Modell mit Measures, Beziehungen und weiteren Objekten |
| Berichte per Agent entwickeln | PBIP/PBIR und Power BI Report Skill | Echter Power-BI-Bericht |
| Besondere Visualisierung bauen | Custom Visual und Coding-Agent | `.pbiviz` für einen Power-BI-Bericht |
| Individuelle Daten-App bauen | Rayfin und GitHub Copilot | Separate Fabric App |
| Vorhandene Berichte in einer App zeigen | Power BI Embedded | Eingebetteter Power-BI-Bericht |

## 1. Copilot direkt in Power BI

In Power BI Desktop oder im Power BI Service lassen sich Berichtsseiten in natürlicher Sprache anfordern, zum Beispiel:

> Erstelle eine Berichtsseite mit Umsatz und Marge nach Monat sowie einem Vergleich der Regionen.

Copilot kann Berichtsseiten erzeugen und Visuals hinzufügen, ändern oder löschen. In der **DAX-Abfrageansicht** kann Copilot außerdem DAX schreiben und erklären. Vorgeschlagene Measures lassen sich nach Prüfung ins Modell übernehmen.

**Grenze:** Laut Microsoft unterstützt diese Berichtserstellung derzeit keine Custom Visuals und keine Stil- oder Formatierungsänderungen. Die fachliche Richtigkeit der erzeugten Ergebnisse muss geprüft werden.

Quellen:

- [Microsoft Learn: Create and edit Power BI reports with Copilot](https://learn.microsoft.com/power-bi/create-reports/copilot-create-reports)
- [Microsoft Learn: Write DAX queries with Copilot](https://learn.microsoft.com/dax/dax-copilot)
- [Microsoft Learn: Quick measure suggestions with Copilot](https://learn.microsoft.com/power-bi/transform-model/quick-measure-suggestions)

## 2. Power BI Agentic: KI-Agent für semantische Modelle

Microsoft bietet das **Power-BI-Authoring-Plugin** mit Agent Skills und einem **Power BI Authoring MCP Server** an. Ein Agent wie GitHub Copilot in VS Code kann damit Power-BI-Werkzeuge für Aufgaben wie diese verwenden:

- Tabellen, Beziehungen und Measures erstellen oder ändern.
- DAX-Abfragen ausführen und Berechnungen prüfen.
- Übersetzungen und Beschreibungen erstellen.
- Ein Modell analysieren und nach Best Practices überarbeiten.

Ein möglicher Auftrag:

> Analysiere mein Modell, erstelle Measures für Umsatz, Marge und Vorjahresvergleich und teste sie mit DAX-Abfragen. Zeige mir die Änderungen vor der Veröffentlichung.

Der Authoring-MCP-Server bearbeitet das **semantische Modell**, nicht die Berichtsseiten. Für Berichte gibt es den separaten Report Skill im nächsten Abschnitt.

Microsoft unterscheidet zwei Servervarianten:

- **Lokal:** Kann mit einem in Power BI Desktop geöffneten Modell oder mit PBIP-/TMDL-Dateien auf dem Rechner arbeiten. Für Modelle in einem Fabric-Workspace kann er ebenfalls verwendet werden.
- **Gehostet (Preview):** Arbeitet mit semantischen Modellen in Fabric-Workspaces, erreicht aber keine lokalen Desktop-Modelle oder PBIP-Dateien.

Quellen:

- [Microsoft Learn: Power BI Agentic overview](https://learn.microsoft.com/power-bi/developer/agentic/power-bi-agentic-overview)
- [Microsoft Learn: Power BI Authoring MCP server](https://learn.microsoft.com/power-bi/developer/mcp/power-bi-authoring-mcp)
- [Microsoft Learn: Power BI Semantic Model Authoring skill](https://learn.microsoft.com/power-bi/developer/agentic/semantic-model-authoring-skill-overview)

## 3. Echte Berichte mit PBIP/PBIR und Coding-Agent

Eine bestehende `.pbix` lässt sich in Power BI Desktop als **Power BI Project (`.pbip`)** speichern. Dadurch werden Definitionen als Textdateien verfügbar:

- **TMDL** beschreibt das semantische Modell.
- **PBIR** beschreibt den Bericht, einschließlich Seiten und Visuals.

Ein Coding-Agent kann unterstützte Projektdateien bearbeiten. Microsofts **Power BI Report Skill** unterstützt unter anderem das Planen, Erstellen, Formatieren und Validieren von PBIR-Berichten.

Ein möglicher Ablauf:

1. Die `.pbix` in Power BI Desktop öffnen und als `.pbip` speichern.
2. Das Projekt in VS Code öffnen und eine überprüfbare Ausgangsversion sichern, beispielsweise mit Git.
3. Den Agenten beauftragen, Modell oder Bericht zu ändern. Für das Modell kann der Authoring-MCP-Server verwendet werden; für die Berichtsebene der Report Skill.
4. Die Änderungen und DAX-Ergebnisse prüfen und den Bericht visuell kontrollieren.
5. Den Bericht bei Bedarf veröffentlichen oder in Power BI Desktop wieder als `.pbix` speichern.

Das ist besonders interessant, wenn ein **echter Power-BI-Bericht erhalten bleiben** und trotzdem mit VS Code, Agent und Versionsverwaltung gearbeitet werden soll.

Quellen:

- [Microsoft Learn: Power BI Desktop projects](https://learn.microsoft.com/power-bi/developer/projects/projects-overview)
- [Microsoft Learn: Power BI Report skill](https://learn.microsoft.com/power-bi/developer/agentic/power-bi-report-skill-overview)
- [Microsoft Learn: Enhanced report format (PBIR)](https://learn.microsoft.com/power-bi/developer/embedded/projects-enhanced-report-format)
- [Microsoft Learn: Edit PBIP files outside Power BI Desktop](https://learn.microsoft.com/power-bi/developer/projects/projects-external-editing)

## 4. Datenaufbereitung und eigene Visuals

### Power Query und Fabric Dataflow Gen2

In einem Fabric Dataflow Gen2 kann Copilot Transformationsschritte aus natürlicher Sprache erzeugen, etwa Spalten bereinigen oder Daten gruppieren. Für Power Query M kann auch ein Coding-Agent Vorschläge machen, die anschließend geprüft und übernommen werden.

Quelle: [Microsoft Learn: Get started with Copilot in Fabric Data Factory](https://learn.microsoft.com/fabric/data-factory/copilot-fabric-data-factory-get-started)

### Power BI Custom Visuals

Mit einem Coding-Agent lässt sich ein eigenes Power-BI-Visual beispielsweise in TypeScript entwickeln, als `.pbiviz` paketieren und in einen Bericht importieren. Das ist sinnvoll, wenn Standardvisuals für den gewünschten Anwendungsfall nicht ausreichen.

Quelle: [Microsoft Learn: Power BI custom visuals](https://learn.microsoft.com/power-bi/developer/visuals/develop-power-bi-visuals)

## 5. Rayfin-App oder eingebetteter Bericht

### Rayfin und Fabric Apps

Ein Agent kann eine eigene analytische Fabric App erstellen, die ein veröffentlichtes semantisches Modell per DAX abfragt. Die Oberfläche wird dabei neu gebaut; sie ist **kein Power-BI-Bericht**.

Quelle: [Microsoft Learn: Create a semantic model app with GitHub Copilot](https://learn.microsoft.com/fabric/apps/create-app-with-github-copilot)

Mehr zum Zugriff auf ein Modell aus einer Rayfin-App: [PBIX-Dateien mit Rayfin und Fabric Apps nutzen](./pbix-und-fabric-apps.md).

### Power BI Embedded

Wenn bestehende Power-BI-Visuals in einer eigenen Web-App gezeigt werden sollen, kann ein veröffentlichter Bericht eingebettet werden. Das ist eine eigene Integrationsvariante mit entsprechenden Authentifizierungs- und Lizenzvoraussetzungen; der Rayfin-Semantic-Model-Connector bettet den Bericht nicht automatisch ein.

Quelle: [Microsoft Learn: Embed a Power BI item in a React application](https://learn.microsoft.com/javascript/api/overview/powerbi/powerbi-client-react)

### Beispiel im Repository

[Power BI Fixer](../pbi-fixwe/README.md) verbindet bereits mehrere Ideen, etwa KI-gestützte Modellbeschreibungen und Übersetzungen sowie PBIR-Bearbeitung. Das Projekt bezeichnet sich derzeit als Beta.

## Voraussetzungen und Sicherheit

- **Fabric Copilot und GitHub Copilot sind unterschiedliche Produkte.** Für Copilot direkt in Power BI gelten Fabric-Copilot-, Kapazitäts- und Admin-Voraussetzungen. Microsoft nennt unter anderem bezahlte Fabric-Kapazitäten ab F2 beziehungsweise eine Fabric-Copilot-Kapazität. GitHub Copilot und MCP haben eigene Zugriffs- und Berechtigungsanforderungen. Details: [Enable Fabric Copilot for Power BI](https://learn.microsoft.com/power-bi/create-reports/copilot-enable-power-bi).
- **macOS:** Power BI Desktop benötigt Windows. Der lokale Power-BI-Authoring-MCP-Server unterstützt laut Microsoft kein macOS. Für ein bereits veröffentlichtes Modell ist der gehostete MCP-Server eine Alternative; lokale Desktop-Modelle und PBIP-Dateien erreicht er aber nicht.
- **Prüfung und Datenschutz:** Änderungen zunächst an einer Kopie oder in einer Entwicklungsumgebung testen. DAX-Ergebnisse, Berechtigungen und Darstellung prüfen. Modellmetadaten und Abfrageergebnisse können über den Agenten an den gewählten KI-Anbieter weitergegeben werden; dafür gelten die Datenschutz- und Sicherheitsvorgaben der Organisation.

## Empfehlung

Für **echte Power-BI-Berichte** ist PBIP/PBIR mit Power BI Agentic und dem Report Skill ein guter Einstieg. Für eine **frei gestaltbare Fachanwendung** ist eine Rayfin-App sinnvoll. Sollen vorhandene Power-BI-Berichte in einer App erhalten bleiben, ist Power BI Embedded eine weitere Option.

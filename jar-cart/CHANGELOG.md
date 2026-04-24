# Change Log

All notable changes to the **JAR Cart** extension are documented in this file.

## [1.0.0] - 2026-04-24

### Added

- **Maven Central Integration**: Instant access to millions of artifacts via the official Maven search API.
- **The "Cart" System**: Interactive workflow to search, select, and manage multiple libraries before downloading.
- **Recursive Dependency Solver**: New "Include All Dependencies" mode that parses POM files to download full runtime trees.
- **Surgical Download Mode**: "Direct JARs Only" option for lightweight project structures without dependency bloat.
- **Smart Conflict Resolution**: Automatic detection and cleanup of old/conflicting versions during upgrades or downgrades.
- **Status Bar Integration**: Real-time cart counter for quick access and visibility.
- **Enhanced UI**: Added a Version Picker to select specific historical releases of any library.
- **Developer Productivity**: Global shortcut `Ctrl+Shift+J` (or `Cmd+Shift+J`) to trigger instant search.
- **Library Hygiene**: Added a "Purge lib folder" command to wipe the workspace clean when needed.

### Fixed

- Improved URL pathing logic for Group IDs containing dots (e.g., `org.apache.poi` -> `org/apache/poi`).
- Fixed stream handling to ensure JAR files are fully written to disk before concluding the checkout.

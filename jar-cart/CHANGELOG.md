# Change Log

All notable changes to the **JAR Cart** extension are documented in this file.

## [1.1.0] - 2026-04-26

### Added

- **Sovereign Manifest System**: Introducing `jar-cart.json`. Your project dependencies are now stored in a readable, editable manifest that acts as the single source of truth.
- **Nested Dependency Visualization**: "Include All Dependencies" now generates a hierarchical tree in the manifest, showing exactly which library brought in which sub-dependency.
- **Selective Sync Logic**: Users can now manually delete unwanted sub-dependencies from the manifest before installing, allowing for ultra-lean project builds.
- **Two-Stage Workflow**: Separation of the "Drafting" phase (building the JSON) and the "Installation" phase (Syncing to `/lib`).
- **Auto-Review**: The manifest now automatically opens for inspection after adding a new library.

### Changed

- **Cleaner Manifest Schema**: Simplified the JSON structure by removing redundant internal keys and timestamps for better readability.
- **Improved Version Logic**: Enhanced version comparison to handle complex Maven version strings and prioritize newer releases.
- **Enforced Sync**: The `Sync` command now strictly matches the disk to the manifest, automatically deleting any JARs not explicitly defined in the JSON.

### Fixed

- **Cognitive Complexity**: Refactored the core dependency resolver to improve extension performance and maintainability.
- **Conflict Resolution**: Fixed an issue where duplicate dependencies with different versions could cause redundant downloads; the system now settles on the highest version found in the tree.

## [1.0.0] - 2026-04-24

### Added

- **Maven Central Integration**: Instant access to millions of artifacts via the official Maven search API.
- **The "Cart" System**: Interactive workflow to search, select, and manage multiple libraries before downloading.
- **Recursive Dependency Solver**: New "Include All Dependencies" mode that parses POM files to download full runtime trees.
- **Surgical Download Mode**: "Direct JARs Only" option for lightweight project structures without dependency bloat.
- **Status Bar Integration**: Real-time cart counter for quick access and visibility.
- **Enhanced UI**: Added a Version Picker to select specific historical releases of any library.
- **Developer Productivity**: Global shortcut `Ctrl+Shift+J` to trigger instant search.
- **Library Hygiene**: Added a "Purge lib folder" command to wipe the workspace clean.

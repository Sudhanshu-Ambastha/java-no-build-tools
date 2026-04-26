# JAR Cart 🛒

The **Sovereign dependency manager for Java**. Search, select, and "checkout" JAR files directly into your project's `lib` folder. No Maven, no Gradle, no XML headaches.

Perfect for **"No-Build"** setups, student assignments, and high-speed prototyping where you want **total control** over your classpath.

## 🎥 Tutorial

Here’s a quick walkthrough of how to use JAR Cart:
![How to setup](https://raw.githubusercontent.com/Sudhanshu-Ambastha/java-no-build-tools/main/jar-cart/images/example.gif)

## ✨ New in Version 1.1.0

- **Sovereign Manifest (`jar-cart.json`):** Your project now has a dedicated "Source of Truth." View exactly what is being installed and why.
- **Selective Sync:** Delete unwanted sub-dependencies directly from the JSON tree before syncing to keep your `/lib` folder lean.
- **Lockfile Stability:** Once you sync, your environment is locked. No unexpected updates or hidden downloads.
- **Auto-Clean Hygiene:** The system automatically prunes and deletes JARs from your `/lib` folder that are no longer in your manifest.
- **Smart Version Picker:** Pick specific historical releases of any library.

## 🚀 How to Use

1. **Search & Add:** Press `Ctrl + Shift + J` (or `Cmd + Shift + J` on Mac). Search for a library and pick your version.
2. **Strategy Selection:** - Choose **Direct JARs Only** for a surgical setup.
   - Choose **Include All Dependencies** to generate a full, nested tree in your manifest.
3. **Review & Prune:** The `jar-cart.json` will open automatically. Feel free to delete any sub-dependency blocks you don't need! ✏️
4. **Sync:** Run `JAR Cart: Sync from jar-cart.json`. This makes your physical `/lib` folder match your JSON perfectly.
5. **View/Edit:** Click the **🛒 Cart** icon in the Status Bar to jump back into your manifest at any time.

## 🛠️ Development & Setup

If you want to modify JAR Cart or build it from source:

1. **Install the VS Code Extension Generator:**
   ```bash
   npm install -g yo generator-code
   ```
2. **Clone the repo and install dependencies:**
   ```bash
   npm install axios fs-extra xml2js
   ```
3. **Launch:**
   - Open the project in VS Code.
   - Press `F5` to open the Extension Development Host.

## ⚖️ License

Distributed under the [Apache License 2.0](./LICENSE). See `LICENSE` for more information.

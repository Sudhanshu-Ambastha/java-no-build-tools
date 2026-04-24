# JAR Cart 🛒

The **zero-config dependency manager for Java**. Search, select, and "checkout" JAR files directly into your project's `lib` folder. No Maven, no Gradle, no XML headaches.

Perfect for **"No-Build"** setups, student assignments, and high-speed prototyping.

![How to setup](./images/example.gif)

## ✨ New in Version 1.0.0

- **Smart Version Picker:** Don't just get the "latest." Pick the exact version (e.g., GSON 2.10.1) you need.
- **Dependency Toggle:** Choose between **Surgical Mode** (Only selected JARs) or **Recursive Mode** (All required dependencies).
- **Auto-Clean Hygiene:** Automatically detects and removes old/conflicting versions when you upgrade or downgrade.
- **Status Bar Integration:** Real-time cart count at the bottom of your editor.
- **Lightning Fast Shortcut:** Press `Ctrl + Shift + J` to start searching instantly.

## 🚀 How to Use

1. **Search:** Press `Ctrl + Shift + J` (or `Cmd + Shift + J` on Mac).
2. **Add:** Search for a library (e.g., `poi-ooxml`), select the artifact, and pick your version.
3. **Manage:** Click the **🛒 Cart** icon in the Status Bar to view or remove items.
4. **Checkout:** Run `JAR Cart: Checkout`.
   - Select **Direct JARs Only** for a lightweight `/lib`.
   - Select **Include All Dependencies** for a fully-loaded, safe setup.
5. **Purge:** Run `JAR Cart: Purge` to wipe the `/lib` folder and start fresh.

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

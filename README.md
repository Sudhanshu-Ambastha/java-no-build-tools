# Jar-Cart

The **zero-config dependency manager for Java beginners**. Search, select, and "checkout" JAR files directly into your project's `lib` folder. No Maven, no Gradle, no stress.

Perfect for **"No Build Tool"** setups, college students, and quick prototyping where you just want to write code, not XML.

## ✨ Features

- **Global Search:** Instant access to 10M+ JARs via the Maven Central API.
- **The "Cart" System:** Search for multiple libraries (e.g., GSON, SQLite, MySQL) and add them to your cart before downloading.
- **Bulk Checkout:** One command to download and organize everything into your project's /lib folder.
- **Trusted Badges:** Visual ⭐ indicators for verified sources like Google, Apache, and Oracle (MySQL).
- **Zero Config:** No pom.xml or build.gradle required. It just works.

## 🚀 How to Use

1. Open your Java project folder in VS Code.
2. Press `Ctrl + Shift + P` to open the Command Palette.
3. Run `JAR Cart: Search & Add to Cart`.
4. Select your libraries.
5. Run `JAR Cart: Checkout` to drop the JARs into your project!

## 🛠️ Development & Setup

If you want to modify Jar-Cart or build it from source, use the following setup:

1. Install the VS Code Extension Generator:
   ```
   npm install -g yo generator-code
   ```
2. Scaffold/Initialize (if starting fresh):
   ```
   yo code
   ```
3. Install Required Dependencies:
   ```
   npm install axios fs-extra
   ```

## 📜 License

This project is licensed under the [MIT License](./LICENSE)—free to use, modify, and distribute.

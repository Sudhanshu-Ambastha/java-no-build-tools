// @ts-nocheck
const vscode = require("vscode");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

/**
 * @typedef {Object} MavenDoc
 * @property {string} id
 * @property {string} g
 * @property {string} a
 * @property {string} latestVersion
 */

/** @type {MavenDoc[]} */
let jarCart = [];

function activate(context) {
  console.log("JAR Cart is active! 🛒");

  let addCommand = vscode.commands.registerCommand(
    "jar-cart.add",
    async function () {
      const query = await vscode.window.showInputBox({
        prompt: "Search Maven Central (e.g., gson, sqlite, mysql)",
        placeHolder: "Enter library name...",
      });

      if (!query) return;

      try {
        const url = `https://search.maven.org/solrsearch/select?q=${query}&rows=20&wt=json`;
        const res = await axios.get(url);
        const docs = res.data.response.docs;

        if (docs.length === 0) {
          vscode.window.showErrorMessage("No JARs found for that search.");
          return;
        }

        const items = docs.map((d) => {
          const isTrusted =
            d.g.startsWith("com.google") ||
            d.g.startsWith("org.apache") ||
            d.g.startsWith("com.mysql") ||
            d.g.startsWith("xerial");
          return {
            label: `${isTrusted ? "⭐ " : ""}${d.a}`,
            description: `v${d.latestVersion}`,
            detail: `Group: ${d.g}`,
            doc: d,
          };
        });

        const selected = await vscode.window.showQuickPick(items, {
          canPickMany: true,
          placeHolder: "Select JARs to add to your Cart",
        });

        if (selected) {
          selected.forEach((item) => {
            if (!jarCart.find((c) => c.id === item.doc.id)) {
              jarCart.push(item.doc);
            }
          });
          vscode.window.showInformationMessage(
            `Added to Cart. Current items: ${jarCart.length} 🛒`,
          );
        }
      } catch (err) {
        vscode.window.showErrorMessage("Failed to fetch from Maven Central.");
      }
    },
  );

  let checkoutCommand = vscode.commands.registerCommand(
    "jar-cart.checkout",
    async function () {
      if (jarCart.length === 0) {
        vscode.window.showWarningMessage("Your cart is empty!");
        return;
      }

      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage("Please open a folder/project first!");
        return;
      }

      const libDir = path.join(workspaceFolders[0].uri.fsPath, "lib");
      await fs.ensureDir(libDir);

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Checking out JARs...",
          cancellable: false,
        },
        async (progress) => {
          for (const doc of jarCart) {
            const gPath = doc.g.replace(/\./g, "/");
            const v = doc.latestVersion;
            const a = doc.a;

            const downloadUrl = `https://repo1.maven.org/maven2/${gPath}/${a}/${v}/${a}-${v}.jar`;
            const destPath = path.join(libDir, `${a}-${v}.jar`);

            progress.report({ message: `Downloading ${a}...` });

            try {
              const response = await axios({
                url: downloadUrl,
                responseType: "stream",
              });
              const writer = fs.createWriteStream(destPath);
              response.data.pipe(writer);

              await new Promise((resolve, reject) => {
                writer.on("finish", resolve);
                writer.on("error", reject);
              });
            } catch (err) {
              vscode.window.showErrorMessage(`Failed to download ${a}`);
            }
          }
        },
      );

      vscode.window.showInformationMessage(
        `Checkout complete! ${jarCart.length} JARs added to /lib folder. 🎉`,
      );
      jarCart = [];
    },
  );

  let clearCommand = vscode.commands.registerCommand("jar-cart.clear", () => {
    jarCart = [];
    vscode.window.showInformationMessage("Cart cleared.");
  });

  context.subscriptions.push(addCommand, checkoutCommand, clearCommand);
}

function deactivate() {}

module.exports = { activate, deactivate };

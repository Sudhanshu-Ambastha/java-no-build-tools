// @ts-nocheck
const vscode = require("vscode");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const xml2js = require("xml2js");

/** @type {any[]} */
let jarCart = [];
let statusBarItem;

function updateStatusBar() {
  if (jarCart.length > 0) {
    statusBarItem.text = `$(shopping-cart) ${jarCart.length} JAR${jarCart.length > 1 ? "s" : ""}`;
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}

async function resolveDependencies(
  doc,
  allToDownload = new Set(),
  visited = new Set(),
) {
  const depKey = `${doc.g}:${doc.a}:${doc.v}`;
  if (visited.has(depKey)) return;
  visited.add(depKey);
  allToDownload.add(doc);
  try {
    const gPath = doc.g.replace(/\./g, "/");
    const pomUrl = `https://repo1.maven.org/maven2/${gPath}/${doc.a}/${doc.v}/${doc.a}-${doc.v}.pom`;
    const res = await axios.get(pomUrl);
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(res.data);
    let deps = result.project.dependencies?.dependency;
    if (!deps) return;
    if (!Array.isArray(deps)) deps = [deps];
    for (const dep of deps) {
      const scope = dep.scope || "compile";
      if (["compile", "runtime"].includes(scope) && dep.optional !== "true") {
        let version = dep.version || doc.v;
        if (version.includes("${")) version = doc.v;
        await resolveDependencies(
          { g: dep.groupId, a: dep.artifactId, v: version },
          allToDownload,
          visited,
        );
      }
    }
  } catch (err) {
    console.error(`Dep Error: ${doc.a}`);
  }
}

function activate(context) {
  console.log("JAR Cart Pro is active! 🛒");

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = "jar-cart.view";
  context.subscriptions.push(statusBarItem);

  let addCommand = vscode.commands.registerCommand(
    "jar-cart.add",
    async function () {
      const query = await vscode.window.showInputBox({
        prompt: "Search Maven (Ctrl+Shift+J)",
        placeHolder: "e.g. gson, poi, sqlite",
      });
      if (!query) return;

      try {
        const url = `https://search.maven.org/solrsearch/select?q=${encodeURIComponent(query)}&rows=20&wt=json&sort=score`;
        const res = await axios.get(url);
        const docs = res.data.response.docs;
        if (docs.length === 0)
          return vscode.window.showErrorMessage("No JARs found.");

        const selectedBase = await vscode.window.showQuickPick(
          docs.map((d) => ({ label: d.a, description: d.g, doc: d })),
          { placeHolder: "Select a library" },
        );
        if (!selectedBase) return;

        const vUrl = `https://search.maven.org/solrsearch/select?q=g:${selectedBase.doc.g} AND a:${selectedBase.doc.a}&core=gav&rows=10&wt=json`;
        const vRes = await axios.get(vUrl);
        const versions = vRes.data.response.docs.map((d) => d.v);

        const selectedVersion = await vscode.window.showQuickPick(versions, {
          placeHolder: `Select version for ${selectedBase.doc.a}`,
        });

        if (selectedVersion) {
          jarCart.push({
            g: selectedBase.doc.g,
            a: selectedBase.doc.a,
            v: selectedVersion,
          });
          updateStatusBar();
          vscode.window.showInformationMessage(
            `Added ${selectedBase.doc.a} 🛒`,
          );
        }
      } catch (err) {
        vscode.window.showErrorMessage("Maven Search Failed.");
      }
    },
  );

  let viewCommand = vscode.commands.registerCommand(
    "jar-cart.view",
    async function () {
      if (jarCart.length === 0)
        return vscode.window.showInformationMessage("Cart is empty.");

      const items = jarCart.map((item, index) => ({
        label: `$(file-zip) ${item.a}`,
        description: `v${item.v}`,
        detail: `Group: ${item.g} (Select to REMOVE)`,
        index: index,
      }));

      const toRemove = await vscode.window.showQuickPick(items, {
        placeHolder: "Your Cart Items (Click an item to remove it from cart)",
      });

      if (toRemove) {
        jarCart.splice(toRemove.index, 1);
        updateStatusBar();
        vscode.window.showInformationMessage(
          `Removed ${toRemove.label} from cart.`,
        );
      }
    },
  );

  let checkoutCommand = vscode.commands.registerCommand(
    "jar-cart.checkout",
    async function () {
      if (jarCart.length === 0) return;
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) return;

      const mode = await vscode.window.showQuickPick(
        [
          { label: "Direct JARs Only", detail: "Fast & Light" },
          { label: "Include All Dependencies", detail: "Safest" },
        ],
        { placeHolder: "Download Strategy" },
      );
      if (!mode) return;
      const includeDeps = mode.label.includes("Include All");

      const libDir = path.join(workspaceFolders[0].uri.fsPath, "lib");
      await fs.ensureDir(libDir);

      const finalDownloadList = new Set();
      const visited = new Set();

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Resolving...",
        },
        async () => {
          if (includeDeps) {
            for (const item of jarCart)
              await resolveDependencies(item, finalDownloadList, visited);
          } else {
            jarCart.forEach((i) => finalDownloadList.add(i));
          }
        },
      );

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Downloading...`,
        },
        async (progress) => {
          const existingFiles = await fs.readdir(libDir);
          for (const doc of finalDownloadList) {
            const fileName = `${doc.a}-${doc.v}.jar`;
            const gPath = doc.g.replace(/\./g, "/");
            const url = `https://repo1.maven.org/maven2/${gPath}/${doc.a}/${doc.v}/${fileName}`;

            const conflictRegex = new RegExp(`^${doc.a}-.*\\.jar$`);
            for (const f of existingFiles) {
              if (conflictRegex.test(f) && f !== fileName)
                await fs.remove(path.join(libDir, f));
            }

            try {
              const response = await axios({ url, responseType: "stream" });
              const writer = fs.createWriteStream(path.join(libDir, fileName));
              response.data.pipe(writer);
              await new Promise((res, rej) => {
                writer.on("finish", res);
                writer.on("error", rej);
              });
            } catch (e) {}
          }
        },
      );

      vscode.window.showInformationMessage("Success! 🎉");
      jarCart = [];
      updateStatusBar();
    },
  );

  let purgeCommand = vscode.commands.registerCommand(
    "jar-cart.purge",
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) return;
      const libDir = path.join(workspaceFolders[0].uri.fsPath, "lib");
      if (await fs.pathExists(libDir)) {
        const confirm = await vscode.window.showWarningMessage(
          "Wipe lib folder?",
          "Yes",
          "No",
        );
        if (confirm === "Yes") {
          await fs.emptyDir(libDir);
          vscode.window.showInformationMessage("Purged.");
        }
      }
    },
  );

  let clearCommand = vscode.commands.registerCommand("jar-cart.clear", () => {
    jarCart = [];
    updateStatusBar();
    vscode.window.showInformationMessage("Cart cleared.");
  });

  context.subscriptions.push(
    addCommand,
    checkoutCommand,
    clearCommand,
    purgeCommand,
    viewCommand,
  );
}

module.exports = { activate, deactivate: () => {} };

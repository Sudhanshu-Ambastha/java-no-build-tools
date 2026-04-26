// @ts-nocheck
const vscode = require("vscode");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("node:path");
const { saveManifest } = require("./manifest");
const { downloadJars } = require("./downloader");

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

function activate(context) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = "jar-cart.view";
  context.subscriptions.push(statusBarItem);

  const addCmd = vscode.commands.registerCommand("jar-cart.add", async () => {
    const query = await vscode.window.showInputBox({ prompt: "Search Maven" });
    if (!query) return;
    try {
      const res = await axios.get(
        `https://search.maven.org/solrsearch/select`,
        {
          params: { q: query, rows: 20, wt: "json" },
          headers: { "User-Agent": "JarCart-VSCode/1.0.3" },
        },
      );
      const docs = res.data.response.docs;
      const pick = await vscode.window.showQuickPick(
        docs.map((d) => ({ label: d.a, description: d.g, doc: d })),
      );
      if (!pick) return;

      const vRes = await axios.get(
        `https://search.maven.org/solrsearch/select`,
        {
          params: {
            q: `g:${pick.doc.g} AND a:${pick.doc.a}`,
            core: "gav",
            rows: 10,
            wt: "json",
          },
          headers: { "User-Agent": "JarCart-VSCode/1.0.3" },
        },
      );
      const ver = await vscode.window.showQuickPick(
        vRes.data.response.docs.map((d) => d.v),
      );

      if (ver) {
        jarCart.push({ group: pick.doc.g, library: pick.doc.a, version: ver });
        updateStatusBar();

        const strategy = await vscode.window.showQuickPick(
          ["Direct JARs Only", "Include All Dependencies"],
          { placeHolder: "Generate manifest with dependencies?" },
        );

        if (strategy) {
          await saveManifest(jarCart, strategy);
          vscode.window.showInformationMessage(
            `Manifest updated! Run 'Sync' when ready to install. ✏️`,
          );
          vscode.commands.executeCommand("jar-cart.view");
        }
      }
    } catch (e) {
      vscode.window.showErrorMessage("Search Failed");
    }
  });

  const checkoutCmd = vscode.commands.registerCommand(
    "jar-cart.checkout",
    async () => {
      vscode.commands.executeCommand("jar-cart.sync");
    },
  );

  const syncCmd = vscode.commands.registerCommand("jar-cart.sync", async () => {
    const root = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!root) return;
    const configPath = path.join(root, "jar-cart.json");
    if (!(await fs.pathExists(configPath)))
      return vscode.window.showErrorMessage("No manifest found.");

    const config = await fs.readJson(configPath);
    const libDir = path.join(root, "lib");
    await fs.ensureDir(libDir);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Syncing /lib with Manifest...",
      },
      async () => {
        await downloadJars(config.dependencies, libDir);
      },
    );

    vscode.window.showInformationMessage("Environment Synced! 🏁");
    jarCart = [];
    updateStatusBar();
  });

  const viewCmd = vscode.commands.registerCommand("jar-cart.view", async () => {
    const root = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!root) return;
    const configPath = path.join(root, "jar-cart.json");
    if (await fs.pathExists(configPath)) {
      const doc = await vscode.workspace.openTextDocument(configPath);
      await vscode.window.showTextDocument(doc);
      vscode.window.showInformationMessage(
        "Edit dependencies, then run 'Sync' to apply. ✏️",
      );
    } else {
      vscode.window.showInformationMessage("Cart is empty.");
    }
  });

  const purgeCmd = vscode.commands.registerCommand(
    "jar-cart.purge",
    async () => {
      const root = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      const libDir = path.join(root || "", "lib");
      if (await fs.pathExists(libDir)) {
        const confirm = await vscode.window.showWarningMessage(
          "Wipe lib folder?",
          "Yes",
          "No",
        );
        if (confirm === "Yes") await fs.emptyDir(libDir);
      }
    },
  );

  context.subscriptions.push(addCmd, checkoutCmd, syncCmd, viewCmd, purgeCmd);
}

module.exports = { activate, deactivate: () => {} };

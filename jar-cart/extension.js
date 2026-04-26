// @ts-nocheck
const vscode = require("vscode");
const fs = require("fs-extra");
const path = require("node:path");
const { saveManifest } = require("./manifest");
const { downloadJars } = require("./downloader");
const {
  searchAndPickJar,
  getManifestPath,
  createStatusBar,
  updateStatusBar,
} = require("./utils");

let jarCart = [];
let statusBarItem;

function activate(context) {
  statusBarItem = createStatusBar();
  context.subscriptions.push(statusBarItem);

  const addCmd = vscode.commands.registerCommand("jar-cart.add", async () => {
    const jar = await searchAndPickJar();
    if (!jar) return;

    jarCart.push(jar);
    updateStatusBar(statusBarItem, jarCart);

    const strategy = await vscode.window.showQuickPick(
      ["Direct JARs Only", "Include All Dependencies"],
      { placeHolder: "Select generation strategy" },
    );

    if (strategy) {
      let targetPath = await getManifestPath(
        "Which project should this JAR be added to?",
      );
      if (!targetPath) {
        const root = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (root) targetPath = path.join(root, "jar-cart.json");
      }

      if (targetPath) {
        await saveManifest(jarCart, strategy, targetPath);
        vscode.window.showInformationMessage(
          `Updated ${path.basename(path.dirname(targetPath))}! ✏️`,
        );
        jarCart = [];
        updateStatusBar(statusBarItem, jarCart);
      }
    }
  });

  const syncCmd = vscode.commands.registerCommand("jar-cart.sync", async () => {
    const configPath = await getManifestPath("Select the project to Sync");
    if (!configPath) return;

    const config = await fs.readJson(configPath);
    const libDir = path.join(path.dirname(configPath), "lib");
    await fs.ensureDir(libDir);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Syncing lib...`,
      },
      async () => {
        await downloadJars(config.dependencies, libDir);
      },
    );
    vscode.window.showInformationMessage("Environment Synced! 🏁");
  });

  const viewCmd = vscode.commands.registerCommand("jar-cart.view", async () => {
    const configPath = await getManifestPath("Select manifest to view");
    if (configPath) {
      const doc = await vscode.workspace.openTextDocument(configPath);
      await vscode.window.showTextDocument(doc);
    }
  });

  const purgeCmd = vscode.commands.registerCommand(
    "jar-cart.purge",
    async () => {
      const configPath = await getManifestPath("Select project to purge");
      if (!configPath) return;

      const libDir = path.join(path.dirname(configPath), "lib");
      if (await fs.pathExists(libDir)) {
        const confirm = await vscode.window.showWarningMessage(
          `Wipe ${path.basename(path.dirname(configPath))}/lib?`,
          "Yes",
          "No",
        );
        if (confirm === "Yes") await fs.emptyDir(libDir);
      }
    },
  );

  context.subscriptions.push(addCmd, syncCmd, viewCmd, purgeCmd);
}

module.exports = { activate, deactivate: () => {} };

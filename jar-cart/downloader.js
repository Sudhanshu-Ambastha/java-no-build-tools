// @ts-nocheck
const vscode = require("vscode");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("node:path");

async function downloadJars(manifestDeps, libDir) {
  const requiredFiles = new Map();

  function flatten(list) {
    for (const d of list) {
      const fileName = `${d.library}-${d.version}.jar`;
      if (!requiredFiles.has(fileName)) {
        requiredFiles.set(fileName, {
          group: d.group,
          library: d.library,
          version: d.version,
          fileName: fileName,
        });
      }
      if (d.dependencies && d.dependencies.length > 0) {
        flatten(d.dependencies);
      }
    }
  }

  flatten(manifestDeps);

  const existingFiles = await fs.readdir(libDir);
  for (const file of existingFiles) {
    if (file.endsWith(".jar") && !requiredFiles.has(file)) {
      await fs.remove(path.join(libDir, file));
    }
  }

  for (const dep of requiredFiles.values()) {
    const filePath = path.join(libDir, dep.fileName);
    if (await fs.pathExists(filePath)) continue;

    try {
      const gPath = dep.group.replaceAll(".", "/");
      const url = `https://repo1.maven.org/maven2/${gPath}/${dep.library}/${dep.version}/${dep.fileName}`;

      const response = await axios({
        url,
        responseType: "stream",
        headers: { "User-Agent": "JarCart-VSCode/1.0.3" },
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve) => {
        writer.on("finish", resolve);
        writer.on("error", () => {
          writer.close();
          resolve();
        });
      });
    } catch (e) {
      vscode.window.showErrorMessage(`Failed to download ${dep.fileName}`);
    }
  }
}

module.exports = { downloadJars };

// @ts-nocheck
const vscode = require("vscode");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("node:path");
const xml2js = require("xml2js");

async function saveManifest(jarCart, strategy = "Direct JARs Only") {
  const root = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!root) return;
  const manifestPath = path.join(root, "jar-cart.json");

  const finalDeps = [];
  const visited = new Set();
  const versionMap = new Map();

  for (const item of jarCart) {
    const doc = {
      g: item.group || item.g,
      a: item.library || item.a,
      v: item.version || item.v,
    };

    if (strategy.includes("All")) {
      const node = await resolveDependencies(doc, visited, versionMap);
      if (node) finalDeps.push(node);
    } else {
      finalDeps.push({
        group: doc.g,
        library: doc.a,
        version: doc.v,
        dependencies: [],
      });
    }
  }

  const manifest = {
    project: vscode.workspace.name || "java-project",
    strategy,
    dependencies: finalDeps,
  };

  await fs.writeJson(manifestPath, manifest, { spaces: 2 });
}

async function getPomDependencies(doc) {
  try {
    const gPath = doc.g.replaceAll(".", "/");
    const url = `https://repo1.maven.org/maven2/${gPath}/${doc.a}/${doc.v}/${doc.a}-${doc.v}.pom`;
    const res = await axios.get(url, {
      headers: { "User-Agent": "JarCart-VSCode/1.0.3" },
      timeout: 5000,
    });
    const result = await new xml2js.Parser({
      explicitArray: false,
    }).parseStringPromise(res.data);

    let deps = result.project.dependencies?.dependency;
    if (!deps) return [];
    return Array.isArray(deps) ? deps : [deps];
  } catch {
    return [];
  }
}

function isRequiredDependency(dep) {
  const validScopes = ["compile", "runtime"];
  const scope = dep.scope || "compile";
  return validScopes.includes(scope) && dep.optional !== "true";
}

async function resolveDependencies(doc, visited, versionMap) {
  const depKey = `${doc.g}:${doc.a}`;
  const currentBestV = versionMap.get(depKey);

  if (!currentBestV || compareVersions(doc.v, currentBestV) > 0) {
    versionMap.set(depKey, doc.v);
  } else {
    doc.v = currentBestV;
  }

  const uniqueId = `${depKey}:${doc.v}`;
  if (visited.has(uniqueId)) return null;
  visited.add(uniqueId);

  const node = {
    group: doc.g,
    library: doc.a,
    version: doc.v,
    dependencies: [],
  };
  const rawDeps = await getPomDependencies(doc);

  for (const dep of rawDeps) {
    if (isRequiredDependency(dep)) {
      let v = dep.version || doc.v;
      if (v.includes("${") || v.includes("[") || v.includes("(")) v = doc.v;

      const child = await resolveDependencies(
        { g: dep.groupId, a: dep.artifactId, v },
        visited,
        versionMap,
      );
      if (child) node.dependencies.push(child);
    }
  }
  return node;
}

function compareVersions(v1, v2) {
  if (!v1 || !v2) return 0;
  const split = (v) =>
    v.split(/[-.]/).map((x) => {
      const num = Number(x);
      return Number.isNaN(num) ? x : num;
    });

  const a = split(v1);
  const b = split(v2);
  const len = Math.max(a.length, b.length);

  for (let i = 0; i < len; i++) {
    const valA = a[i] ?? 0;
    const valB = b[i] ?? 0;
    if (valA > valB) return 1;
    if (valA < valB) return -1;
  }
  return 0;
}

module.exports = { saveManifest };

// bump-version.js
const fs = require("fs");
const path = require("path");

const pkgPath = path.join(__dirname, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

// Which part to bump: "major", "minor", or "patch"
const part = (process.argv[2] || "patch").toLowerCase();

// Allowed values
const allowed = ["major", "minor", "patch"];

if (!allowed.includes(part)) {
  console.error(`❌ Invalid version part "${part}".`);
  console.error(`   Allowed values: ${allowed.join(", ")}`);
  process.exit(1); // 🔥 Stop execution with error
}

const version = pkg.version || "0.0.0";

// Simple semver split: assumes "x.y.z"
let [major, minor, patch] = version.split(".").map(Number);

if ([major, minor, patch].some(isNaN)) {
  console.error(
    `❌ Invalid version format in package.json: "${version}". Expected "x.y.z".`,
  );
  process.exit(1);
}

switch (part) {
  case "major":
    major += 1;
    minor = 0;
    patch = 0;
    break;
  case "minor":
    minor += 1;
    patch = 0;
    break;
  case "patch":
    patch += 1;
    break;
}

const newVersion = `${major}.${minor}.${patch}`;
pkg.version = newVersion;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

console.log(`✅ Version bumped successfully: ${version} → ${newVersion}`);

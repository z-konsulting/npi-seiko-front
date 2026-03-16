const fs = require("fs");
const path = require("path");
const prodConfig = require("path");

// Read the app version from package.json
const pkg = require("./package.json");

// Read the environment argument: "prod" or "dev"
// Example usage:  node update-config.js prod
const env = process.argv[2] || "dev"; // default = dev

// Path to the Angular config file to update
const configPath = path.join(__dirname, "src", "assets", "config.json");

// 1) Read the existing config.json file
let config = {};
try {
  const raw = fs.readFileSync(configPath, "utf8");
  config = JSON.parse(raw);
} catch (err) {
  console.warn("Could not read src/assets/config.json, creating a new one.");
  config = {};
}

// 2) Update values depending on the environment
const envConfigPaths = {
  prod: "./deployment/prod-config.json",
  sandbox: "./deployment/sandbox-config.json",
  demo: "./deployment/demo-config.json",
  dev: "http://localhost:9090",
};
const allowed = ["prod", "sandbox", "demo", "dev"];
if (!allowed.includes(env)) {
  console.error(`❌ Invalid env config path "${env}".`);
  console.error(`   Allowed values: ${allowed.join(", ")}`);
  process.exit(1); // 🔥 Stop execution with error
}
if (env !== "dev" && envConfigPaths[env]) {
  const envConfig = require(envConfigPaths[env]);
  config.apiUrl = envConfig.apiUrl;
} else {
  // In development: overwrite on localhost api
  config.apiUrl = envConfigPaths[env];
}

console.log(
  `Environment = ${env.toUpperCase()} → apiUrl set to:`,
  config.apiUrl,
);

// Update version and timestamp in both prod and dev
config.version = pkg.version;
config.buildTimestamp = new Date().toISOString();

// 3) Write back the updated config.json file
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log(`config.json updated for env=${env} with version`, config.version);

// Custom command to selfupdate uplink binary.

const { existsSync } = require("fs");
const { join } = require("path");
const https = require("https");

let { platform, arch } = process;

switch (platform) {
  case "darwin":
    platform = "darwin";
    break;
  case "freebsd":
  case "linux":
    break;
  case "win32":
    platform = "windows";
  default:
    break;
}

switch (arch) {
  case "arm":
    break;
  case "arm64":
    break;
  case "x64":
    arch = "amd64";
  default:
    break;
}

/**
 * Fetches a remote URL
 * @param {string} url the remote URL to fetch.
 * @returns {Promise<Buffer>} the response as Buffer.
 */
async function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
    }).on("error", reject);
  });
}

const UPLINK_DIR = join(__dirname, "..", "bin");
const DEFAULT_UPLINK_EXECUTABLE = join(UPLINK_DIR, `uplink${ platform === "windows"? ".exe" : "" }`);
const {
  UPLINK_EXECUTABLE = DEFAULT_UPLINK_EXECUTABLE,
} = process.env;

/**
 * Updates uplink binary based on current OS.
 * @returns {Promise}
 */
module.exports = function(options = {}) {
  const {
    version,
    check = false,
  } = options;

  // Passes along to `uplink` if exists.
  if (existsSync(UPLINK_EXECUTABLE)) {
    return this.selfupdate(options);
  }

  const baseUrl = "https://github.com/storj/storj/releases/";
  const apiUrl = "https://api.github.com/repos/storj/storj/releases/latest";

  if (check) {
    return fetch(apiUrl)
      .then(response => response.json())
      .then(data => console.log(`The latest version is: ${ data.tag_name }`));
  }

  console.log("Downloading uplink...");
  const archiveName = version ? `download/${ version }/uplink` : `latest/download/uplink`;
  return fetch(`${ baseUrl }/${ archiveName }_${ platform }_${ arch }.zip`).then(archive => {
    console.log("Extracting uplink...");
    const AdmZip = require("adm-zip");
    const { chmodSync } = require("fs");

    const zip = new AdmZip(archive);
    zip.getEntries().forEach((entry) => {
      const { name, entryName } = entry;
      if (/uplink(\.exe)?$/.test(name)) {
        zip.extractEntryTo(entry, UPLINK_DIR, false, true);
        // Make it executable.
        chmodSync(DEFAULT_UPLINK_EXECUTABLE, 0o755);

        console.log(`${ entryName.replace(`/${ name }`, "") } is installed.`);
      }
    });
  });
}
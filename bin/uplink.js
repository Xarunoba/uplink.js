#!/usr/bin/env node
const { join } = require("path");

const mri = require("mri");

const uplink = require("../");

const {_: args, ...flags} = mri(process.argv.slice(2));
const [commandName, ...commandArguments] = args;

// Executes uplink command if available.
let { [commandName]: command } = uplink;

// The current directory has highest priority.
module.paths.push(".");
// Then the library's "uplink" folder for `uplink.js` custom commands.
module.paths.push(join(__dirname, "..", "uplink"));

try {
  // If the command is a custom module, requires it instead.
  command = require(commandName);
} catch(error) {
  try {
    // If exact name is not found, maybe one prefixed with `uplink-`?
    command = require(`uplink-${commandName}`);
  } catch(error) {

  }
}

const subprocess = command ?
      command.call(uplink, ...commandArguments, flags) :
      uplink(...args, flags);

try {
  if(require.main === module) // If from CLI
    process.stdin.pipe(subprocess.stdin); 
} catch (error) {
}

subprocess.stdout?.on("data", (data) => {
  process.stdout.write(data);
});

subprocess.stderr?.on("data", (data) => {
  process.stderr.write(data);
});

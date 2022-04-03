const { join } = require("path");
const { spawn, ChildProcess } = require("child_process");

let { platform } = process;

const UPLINK_DIR = join(__dirname, "bin");
const DEFAULT_UPLINK_EXECUTABLE = join(UPLINK_DIR, `uplink${ platform === "windows"? ".exe" : "" }`);
const {
  UPLINK_EXECUTABLE = DEFAULT_UPLINK_EXECUTABLE,
} = process.env;

const CHILD_OPTIONS = [
  "cwd",
  "env",
  "argv0",
  "stdio",
  "detached",
  "uid",
  "gid",
  "serialization",
  "shell",
  "windowsVerbatimArguments",
  "windowsHide",
  "signal",
  "timeout",
  "killSignal",
];

/**
 * Spawns a uplink process to execute with the supplied arguments.
 *
 * The last argument can also be an object with all the flags.
 *
 * Options for the child process can also be passed into this last argument,
 * and they will be picked out.
 *
 * @param {...string|object} args arguments for the API call.
 * @returns {ChildProcess} the uplink subprocess.
 */
const api = function(...args) {
  let flags = args.pop();
  let childOptions = {};

  if (!!flags && flags.constructor === Object) {
    Object.entries(flags).forEach(([key, value]) => {
      if (CHILD_OPTIONS.indexOf(key) > -1) {
        childOptions[key] = value;
        return;
      }

      // No need to handle key when value is null or undefined.
      if (value == null) {
        return;
      }

      if (value === false) {
        key = `no-${ key }`;
      }
      const values = Array.isArray(value)? value : [value];
      values.forEach(value => {
        args.push(`--${ key }`);
        if (typeof value === "boolean") return;
        if (typeof value === "string") {
          args.push(`${ value }`);
        } else {
          args.push(`${ JSON.stringify(value) }`);
        }
      });
    });
  } else {
    // Not a flag object, push it back.
    args.push(flags);
  }

  return spawn(UPLINK_EXECUTABLE, args, childOptions);
}

// Promise-based API.
const promises = api.promises = function(...args) {
  return new Promise((resolve, reject) => {
    const subprocess = api(...args);

    subprocess.on("error", (error) => {
      reject(error);
    });

    const stdout = [], stderr = [];
    subprocess.stdout.on("data", (chunk) => {
      stdout.push(chunk);
    });
    subprocess.stdout.on("end", () => {
      resolve(Buffer.concat(stdout));
    });
    subprocess.stderr.on("data", (chunk) => {
      stderr.push(chunk);
    });
    subprocess.stderr.on("end", () => {
      if (stderr.length) {
        reject(Buffer.concat(stderr));
      }
    });
  });
};

const COMMANDS = [
  "access",               // set of commands to manage accesses
  "acces create",         //	Create an access from a setup token. uplink setup is an alias for this.
  "access delete",        //	Delete an access from local store
  "access import",        //	Save an existing access. uplink import is an alias for this.
  "access inspect",       //	Inspect allows you to expand a serialized access into its constituent parts
  "access list",          //	Prints name and associated satellite of all available accesses
  "access register",      //	Register an access grant for use with a hosted S3 compatible gateway and linksharing
  "access restrict",	    //Restrict an access
  "access revoke",	      //Revoke an access
  "access use",	          //Set default access to use
  "cp",                   // copy a file from outside of Storj bucket to inside or vice versa
  "ls",                   // List objects and prefixes or all buckets
  "mb",                   // make a new bucket
  "meta",                 // metadata related commands
  "mv",                   // moves a Storj object to another location in Storj DCS
  "rb",                   // remove a bucket
  "rm",                   // remove a file from a Storj bucket
  "setup",                // create an uplink config file
  "share",                // shares restricted access to objects
  "selfupdate",           // Updates the uplink binary
];

COMMANDS.forEach(commandName => {
  // Normal API command to return a subprocess.
  Object.defineProperty(api, commandName, {
    /**
     * @param  {...string|object} args arguments for the API call
     * @returns {ChildProcess} the uplink subprocess.
     */
    value: function(...args) {
      return api(commandName, ...args);
    },
    enumerable: true,
  });

  // Promise API command to return a Promise.
  Object.defineProperty(promises, commandName, {
    /**
     * @param  {...string|object} args arguments for the API call
     * @returns {Promise<string>} the output of the command.
     */
    value: function(...args) {
      return promises(commandName, ...args);
    },
    enumerable: true,
  });
});

module.exports = api;

# Uplink.js
![Node.js Workflow](https://github.com/Xarunoba/uplink.js/actions/workflows/node.js.yml/badge.svg)

The JavaScript API to the Uplink CLI
[Uplink](https://storj.io/).

The code is forked from [rclone.js](https://github.com/sntran/rclone.js) and edited
to work with Uplink CLI.

Besides providing a way to install uplink on different platforms, a CLI and
a JavaScript API are included.

Special thanks to [@sntran](https://github.com/sntran) for developing `rclone.js`

As this is my first ever package, contributions/PRs are highly welcomed.

## Installation

NPM:
```sh
npm install -D @xarunoba/uplink.js
```

PNPM:
```sh
pnpm install -D @xarunoba/uplink.js
```

After installation, the latest binary of `uplink` is also fetched based on
your system environment.

If a custom version of `uplink` binary is needed, use `UPLINK_EXECUTABLE`
environment variable to set the path to that custom binary.

## Usage

### Node.js

All API functions return a child process whose events we can listen to. 
Optional flags can be passed as an object to the last argument of the function call. 
Except removing the `--` prefix, there is no other conversion to the flag name.
JSON values are stringified before passed to `uplink`.

Each API functions can also take options for the spawned child process. See
https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
for their documentation.

```js
const uplink = require("uplink.js");

const ls = uplink.ls("source:", {
  // Spawn options:
  "env": {

  },
  "shell": "/bin/sh",
});

ls.stdout.on("data", (data) => {
  console.log(data.toString());
});

ls.stderr.on("data", (data) => {
  console.error(data.toString());
});
```

There is also a Promise-based API:

```js
const uplink = require("uplink.js").promises;

(async function() {
  const results = await uplink.ls("source:", {
    // Spawn options:
    "env": {

    },
    "shell": "/bin/sh",
  });

  console.log(results);
})();
```

When the official `uplink` adds new command that has not been provided here,
we can still use the command through the default exported functions, passing
the command name as first argument:

```js
const uplink = require("uplink.js");

uplink("newcommand", "source:", "target:", {
  "flag": true,
});

(async function() {
  const results = await uplink.promises("newcommand", "source:", "target:", {
    "flag": true,
  });

  console.log(results);
})();
```

### CLI

This simple CLI calls the JS API above and outputs `stdout` and `stderr`.

NPM:
```sh
$ npx uplink ls
CREATED                NAME
2022-04-03 15:53:40    something1
2022-03-31 15:06:35    something2
2022-04-02 21:02:41    something3
```

PNPM:
```sh
$ pnpm exec uplink ls
CREATED                NAME
2022-04-03 15:53:40    something1
2022-03-31 15:06:35    something2
2022-04-02 21:02:41    something3
```

### Custom command

The CLI also supports executing a custom JS-based command to further extend
usage outside of what the official `uplink` offers:

NPM:
```sh
$ npx uplink echo.js arg1 --string value arg2 --boolean
```

PNPM:
```sh
$ pnpm exec uplink echo.js arg1 --string value arg2 --boolean
```

The custom JS file just needs to export a function that takes the arguments and
flags parsed from the CLI. It can either return a child process, or a `Promise`.
For a child process, its `stdout` and `stderr` are piped to the caller process.

Inside the function, `this` is set to `uplink.js` module.

```js
const { spawn } = require("child_process");

module.exports = function echo(arg1, arg2, flags = {}) {
  return spawn("echo", [arg1, arg2, JSON.stringify(flags)]);
}
```

The custom module is loaded through `require`, so it has some nice advantages
when [locating module](https://nodejs.org/api/modules.html#all-together):

- Does not need to specify `.js` extension, `custom` is same as `custom.js`.
- Considers both `foobar.js` and `foobar/index.js`.
- Can be extended through `NODE_PATH` environment variable.
- Can also use module from `node_modules` by its name.

With that, there are a few things custom commands can be used:

- Wraps existing API to add new functionality, such as `archive`.
- Defines a module with the same name as existing API to extend it with new
  flags and/or backends.

For publishing a custom `uplink` command as NPM package, consider prefixing the
package name with `uplink-` so it's clearer and not conflicting.

### Example Custom Commands

This is an example from `rclone.js` but since this package is a fork of rclone.js,
creating a custom command for `uplink.js` is almost exactly the same.
- [rclone-archive](https://www.npmjs.com/package/rclone-archive):
  Tracking https://github.com/rclone/rclone/issues/2815.

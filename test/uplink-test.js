const childProcess = require("child_process");
const {EventEmitter, Writable, Readable} = require("stream");

childProcess.spawn = function(spawnfile, spawnargs, spwanoptions) {
  mockChildProcess.spawnfile = spawnfile;
  mockChildProcess.spawnargs = spawnargs;
  mockChildProcess.spwanoptions = spwanoptions;
  return mockChildProcess;
}

const uplink = require("..");

const assert = require("assert");

const mockChildProcess = new EventEmitter();
mockChildProcess.stdin = new Writable({
  write () {
    // mock out the data to be sent
  },
  final () {
    // for when the processes ends
  }
});

mockChildProcess.stdout = new Readable({
  read () {
    // mock out the child process writing some data to STDOUT
    const { spawnfile, spawnargs } = mockChildProcess;
    this.push(`${ spawnargs }`);

    // null signals that there's nothing left to read from the stream
    this.push(null);
  }
});

mockChildProcess.stderr = new Readable({
  read () {
    // collect and verify the data to be read from stderr.
  }
});

test("should spawn a child process with uplink executable and arguments", () => {
  const spawnargs = ["command", "arg1", "--string-flag", "string-value", "arg2"];
  const subprocess = uplink(...spawnargs);
  assert.match(subprocess.spawnfile, /uplink/);
  assert.deepEqual(subprocess.spawnargs, spawnargs);
});

test("should take the flags as object in the last argument", () => {
  const command = "command";
  const args = ["arg1", "arg2"];
  const flags = {
    "string-flag": "string-value"
  };
  const spawnargs = [command, ...args, `--${Object.keys(flags)[0]}`, Object.values(flags)[0]];
  const subprocess = uplink(command, ...args, flags);
  assert.deepEqual(subprocess.spawnargs, spawnargs);
});

test("should not set value for boolean flag", () => {
  const command = "command";
  const args = ["arg1", "arg2"];
  const flags = {
    boolean: true,
  }
  const spawnargs = [command, ...args, `--boolean`];
  const subprocess = uplink(command, ...args, flags);
  assert.deepEqual(subprocess.spawnargs, spawnargs);
});

test("should prefix `no-` to false flag", () => {
  const command = "command";
  const args = ["arg1", "arg2"];
  const flags = {
    boolean: false,
  }
  const spawnargs = [command, ...args, `--no-boolean`];
  const subprocess = uplink(command, ...args, flags);
  assert.deepEqual(subprocess.spawnargs, spawnargs);
});

test("should stringify JSON flag", () => {
  const command = "command";
  const args = ["arg1", "arg2"];
  const flags = {
    json: {
      "p1": [1,"2",null,4],
      "p2": { "a":1, "b":2 },
      "_async": true,
    },
  }
  const spawnargs = [command, ...args, "--json", JSON.stringify(flags.json)];
  const subprocess = uplink(command, ...args, flags);
  assert.deepEqual(subprocess.spawnargs, spawnargs);
});

test("should take options for child process", () => {
  const command = "command";
  const args = ["arg1", "arg2"];
  const spwanoptions = {
    "cwd": ".",
    "env": process.env,
    "argv0": command,
    "stdio": {},
    "detached": false,
    "uid": undefined,
    "gid": undefined,
    "serialization": "json",
    "shell": false,
    "windowsVerbatimArguments": false,
    "windowsHide": false,
    "signal": undefined,
    "timeout": undefined,
    "killSignal": "SIGTERM",
  };
  const flags = {
    boolean: false,
    ...spwanoptions,
  }
  const spawnargs = [command, ...args, `--no-boolean`];
  const subprocess = uplink(command, ...args, flags);
  assert.deepEqual(subprocess.spawnargs, spawnargs);
  assert.deepEqual(subprocess.spwanoptions, spwanoptions);
});

test("should also be able to return promise", async () => {
  const command = "command";
  const args = ["arg1", "arg2"];
  const flags = {
    "string-flag": "string-value"
  };
  const spawnargs = [command, ...args, `--${Object.keys(flags)[0]}`, Object.values(flags)[0]];
  const result = await uplink.promises(command, ...args, flags);
  assert.equal(`${ result }`, `${spawnargs}`)
});
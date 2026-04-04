#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const entry = path.join(root, "dev-bot.ts");

const child = spawn(process.execPath, ["--import", "tsx", entry], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

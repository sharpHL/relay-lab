import { describe, it, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const execFile = promisify(execFileCb);
const TEST_HOME = join(tmpdir(), `relay-lab-cli-test-${Date.now()}`);
const CLI = join(process.cwd(), "src/cli.js");

async function run(...args) {
  try {
    const { stdout, stderr } = await execFile("node", [CLI, ...args], {
      env: { ...process.env, HOME: TEST_HOME },
    });
    return { stdout: stdout.trim(), stderr: stderr.trim(), code: 0 };
  } catch (err) {
    return {
      stdout: (err.stdout || "").trim(),
      stderr: (err.stderr || "").trim(),
      code: err.code,
    };
  }
}

describe("cli", () => {
  beforeEach(async () => {
    await rm(TEST_HOME, { recursive: true, force: true });
    await mkdir(TEST_HOME, { recursive: true });
  });

  after(async () => {
    await rm(TEST_HOME, { recursive: true, force: true });
  });

  it("should show usage when no command given", async () => {
    const { stdout } = await run();
    assert.ok(stdout.includes("Usage:"));
  });

  it("should show usage for help command", async () => {
    const { stdout } = await run("help");
    assert.ok(stdout.includes("Usage:"));
  });

  it("should error on unknown command", async () => {
    const { stderr, code } = await run("foo");
    assert.ok(stderr.includes("Unknown command: foo"));
    assert.notEqual(code, 0);
  });

  it("should add a task", async () => {
    const { stdout } = await run("add", "Buy groceries");
    assert.ok(stdout.includes("Added: #1 Buy groceries"));
  });

  it("should error when adding without text", async () => {
    const { stderr, code } = await run("add");
    assert.ok(stderr.includes("text is required"));
    assert.notEqual(code, 0);
  });

  it("should list tasks", async () => {
    await run("add", "Task A");
    await run("add", "Task B");
    const { stdout } = await run("list");
    assert.ok(stdout.includes("#1"));
    assert.ok(stdout.includes("Task A"));
    assert.ok(stdout.includes("#2"));
    assert.ok(stdout.includes("Task B"));
  });

  it("should show empty message when no tasks", async () => {
    const { stdout } = await run("list");
    assert.ok(stdout.includes("No tasks yet"));
  });

  it("should mark task as done", async () => {
    await run("add", "Test task");
    const { stdout } = await run("done", "1");
    assert.ok(stdout.includes("marked as done"));
  });

  it("should error when done with no ID", async () => {
    const { stderr, code } = await run("done");
    assert.ok(stderr.includes("ID is required"));
    assert.notEqual(code, 0);
  });

  it("should error when done with non-existent ID", async () => {
    const { stderr, code } = await run("done", "999");
    assert.ok(stderr.includes("not found"));
    assert.notEqual(code, 0);
  });

  it("should remove a task", async () => {
    await run("add", "To remove");
    const { stdout } = await run("remove", "1");
    assert.ok(stdout.includes("Removed: #1"));
  });

  it("should error when remove with non-existent ID", async () => {
    const { stderr, code } = await run("remove", "999");
    assert.ok(stderr.includes("not found"));
    assert.notEqual(code, 0);
  });

  it("should show checkmark for done tasks in list", async () => {
    await run("add", "Done task");
    await run("done", "1");
    const { stdout } = await run("list");
    assert.ok(stdout.includes("✓"));
  });
});

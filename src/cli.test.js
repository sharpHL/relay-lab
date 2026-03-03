import { describe, it, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { tasksToCSV } from "./cli.js";

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
    assert.ok(stdout.includes("#1") && stdout.includes("Buy groceries"));
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

  it("should search tasks by keyword (case-insensitive)", async () => {
    await run("add", "Buy groceries");
    await run("add", "Clean house");
    await run("add", "Buy milk");
    const { stdout } = await run("search", "buy");
    assert.ok(stdout.includes("Buy groceries"));
    assert.ok(stdout.includes("Buy milk"));
    assert.ok(!stdout.includes("Clean house"));
  });

  it("should show no matches message", async () => {
    await run("add", "Something");
    const { stdout } = await run("search", "xyz");
    assert.ok(stdout.includes("No tasks matching"));
  });

  it("should error when search without keyword", async () => {
    const { stderr, code } = await run("search");
    assert.ok(stderr.includes("keyword is required"));
    assert.notEqual(code, 0);
  });

  it("should add task with priority flag", async () => {
    const { stdout } = await run("add", "-p", "high", "Urgent task");
    assert.ok(stdout.includes("🔴"));
    assert.ok(stdout.includes("Urgent task"));
  });

  it("should default to medium priority", async () => {
    await run("add", "Normal task");
    const { stdout } = await run("list");
    assert.ok(stdout.includes("🟡"));
  });

  it("should show priority icons in list", async () => {
    await run("add", "-p", "high", "High");
    await run("add", "-p", "low", "Low");
    const { stdout } = await run("list");
    assert.ok(stdout.includes("🔴"));
    assert.ok(stdout.includes("⚪"));
  });

  it("should export tasks to CSV with header", async () => {
    await run("add", "-p", "high", "Buy groceries");
    await run("add", "Clean house");
    const { stdout } = await run("export");
    const lines = stdout.split("\n");
    assert.equal(lines[0], "id,text,priority,done,createdAt");
    assert.ok(lines[1].startsWith("1,Buy groceries,high,false,"));
    assert.ok(lines[2].startsWith("2,Clean house,medium,false,"));
  });

  it("should export empty CSV with only header when no tasks", async () => {
    const { stdout } = await run("export");
    assert.equal(stdout, "id,text,priority,done,createdAt");
  });

  it("should export done status correctly in CSV", async () => {
    await run("add", "Test task");
    await run("done", "1");
    const { stdout } = await run("export");
    const lines = stdout.split("\n");
    assert.ok(lines[1].includes(",true,"));
  });

  it("should quote CSV fields that contain commas", async () => {
    const tasks = [
      { id: 1, text: "Buy milk, eggs", priority: "low", done: false, createdAt: "2024-01-01T00:00:00.000Z" },
    ];
    const csv = tasksToCSV(tasks);
    const lines = csv.split("\n");
    assert.ok(lines[1].includes('"Buy milk, eggs"'));
  });

  it("should escape double quotes in CSV fields", async () => {
    const tasks = [
      { id: 1, text: 'Say "hello"', priority: "medium", done: false, createdAt: "2024-01-01T00:00:00.000Z" },
    ];
    const csv = tasksToCSV(tasks);
    const lines = csv.split("\n");
    assert.ok(lines[1].includes('"Say ""hello"""'));
  });

  it("should sort by priority", async () => {
    await run("add", "-p", "low", "Low task");
    await run("add", "-p", "high", "High task");
    await run("add", "-p", "medium", "Medium task");
    const { stdout } = await run("list", "--sort", "priority");
    const lines = stdout.split("\n");
    assert.ok(lines[0].includes("High task"));
    assert.ok(lines[2].includes("Low task"));
  });
});

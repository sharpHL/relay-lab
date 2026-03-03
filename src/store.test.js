import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Override DATA_DIR for testing — we dynamically patch the module
// Since store.js uses homedir(), we test via a subprocess with HOME override
const TEST_HOME = join(tmpdir(), `relay-lab-test-${Date.now()}`);

async function runStore(code) {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const exec = promisify(execFile);
  const script = `
    import { load, save, getAll, add, remove, toggle } from './src/store.js';
    ${code}
  `;
  const { stdout } = await exec("node", ["--input-type=module", "-e", script], {
    cwd: process.cwd(),
    env: { ...process.env, HOME: TEST_HOME },
  });
  return stdout.trim();
}

describe("store", () => {
  beforeEach(async () => {
    await rm(TEST_HOME, { recursive: true, force: true });
    await mkdir(TEST_HOME, { recursive: true });
  });

  after(async () => {
    await rm(TEST_HOME, { recursive: true, force: true });
  });

  it("should auto-create data file on first load", async () => {
    const result = await runStore(`
      const tasks = await getAll();
      console.log(JSON.stringify(tasks));
    `);
    assert.deepEqual(JSON.parse(result), []);
  });

  it("should add a task and return it", async () => {
    const result = await runStore(`
      const task = await add("Buy groceries");
      console.log(JSON.stringify(task));
    `);
    const task = JSON.parse(result);
    assert.equal(task.id, 1);
    assert.equal(task.text, "Buy groceries");
    assert.equal(task.done, false);
    assert.ok(task.createdAt);
  });

  it("should auto-increment IDs", async () => {
    const result = await runStore(`
      await add("Task 1");
      const t2 = await add("Task 2");
      console.log(t2.id);
    `);
    assert.equal(result, "2");
  });

  it("should list all tasks", async () => {
    const result = await runStore(`
      await add("A");
      await add("B");
      const all = await getAll();
      console.log(all.length);
    `);
    assert.equal(result, "2");
  });

  it("should toggle task done status", async () => {
    const result = await runStore(`
      await add("Test toggle");
      const toggled = await toggle(1);
      console.log(toggled.done);
    `);
    assert.equal(result, "true");
  });

  it("should toggle back to not done", async () => {
    const result = await runStore(`
      await add("Test toggle");
      await toggle(1);
      const toggled = await toggle(1);
      console.log(toggled.done);
    `);
    assert.equal(result, "false");
  });

  it("should remove a task", async () => {
    const result = await runStore(`
      await add("To remove");
      await add("To keep");
      const removed = await remove(1);
      const all = await getAll();
      console.log(JSON.stringify({ removed: removed.text, remaining: all.length }));
    `);
    const data = JSON.parse(result);
    assert.equal(data.removed, "To remove");
    assert.equal(data.remaining, 1);
  });

  it("should return null when removing non-existent task", async () => {
    const result = await runStore(`
      const removed = await remove(999);
      console.log(removed);
    `);
    assert.equal(result, "null");
  });

  it("should return null when toggling non-existent task", async () => {
    const result = await runStore(`
      const toggled = await toggle(999);
      console.log(toggled);
    `);
    assert.equal(result, "null");
  });

  it("should add task with default medium priority", async () => {
    const result = await runStore(`
      const task = await add("Test priority");
      console.log(task.priority);
    `);
    assert.equal(result, "medium");
  });

  it("should add task with explicit priority", async () => {
    const result = await runStore(`
      const task = await add("Urgent", "high");
      console.log(task.priority);
    `);
    assert.equal(result, "high");
  });

  it("should reject invalid priority", async () => {
    const result = await runStore(`
      try { await add("Bad", "critical"); } catch(e) { console.log(e.message); }
    `);
    assert.ok(result.includes("Invalid priority"));
  });

  it("should add task with null dueDate by default", async () => {
    const result = await runStore(`
      const task = await add("No due date");
      console.log(JSON.stringify(task.dueDate));
    `);
    assert.equal(result, "null");
  });

  it("should add task with explicit dueDate", async () => {
    const result = await runStore(`
      const task = await add("Report", "medium", "2026-03-10");
      console.log(task.dueDate);
    `);
    assert.equal(result, "2026-03-10");
  });

  it("should persist dueDate in stored task", async () => {
    const result = await runStore(`
      await add("Persist date", "low", "2026-04-01");
      const all = await getAll();
      console.log(all[0].dueDate);
    `);
    assert.equal(result, "2026-04-01");
  });
});

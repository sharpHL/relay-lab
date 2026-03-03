import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const DATA_DIR = join(homedir(), ".relay-lab");
const DATA_FILE = join(DATA_DIR, "tasks.json");

async function ensureFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE);
  } catch {
    await writeFile(DATA_FILE, JSON.stringify({ nextId: 1, tasks: [] }));
  }
}

export async function load() {
  await ensureFile();
  const raw = await readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

export async function save(data) {
  await ensureFile();
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function getAll() {
  const data = await load();
  return data.tasks;
}

export async function add(text) {
  const data = await load();
  const task = {
    id: data.nextId++,
    text,
    done: false,
    createdAt: new Date().toISOString(),
  };
  data.tasks.push(task);
  await save(data);
  return task;
}

export async function remove(id) {
  const data = await load();
  const index = data.tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  const [removed] = data.tasks.splice(index, 1);
  await save(data);
  return removed;
}

export async function toggle(id) {
  const data = await load();
  const task = data.tasks.find((t) => t.id === id);
  if (!task) return null;
  task.done = !task.done;
  await save(data);
  return task;
}

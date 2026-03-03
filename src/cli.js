#!/usr/bin/env node

import { getAll, add, remove, toggle } from "./store.js";
import { fileURLToPath } from "node:url";

const [command, ...args] = process.argv.slice(2);

const PRIORITY_ICONS = { high: "🔴", medium: "🟡", low: "⚪" };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const USAGE = `Usage:
  task add [-p high|medium|low] [-d YYYY-MM-DD] <text>  Add a new task (default: medium)
  task list [--sort priority|due]                        List all tasks
  task done <id>                                         Toggle task done/undone
  task remove <id>                                       Remove a task
  task search <keyword>                                  Search tasks by keyword
  task export                                            Export all tasks to CSV (stdout)
  task stats                                             Show task summary statistics`;

function csvField(value) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function taskStats(tasks) {
  if (tasks.length === 0) {
    return "No tasks yet.";
  }
  const done = tasks.filter((t) => t.done).length;
  const pending = tasks.length - done;
  const high = tasks.filter((t) => (t.priority || "medium") === "high").length;
  const medium = tasks.filter((t) => (t.priority || "medium") === "medium").length;
  const low = tasks.filter((t) => (t.priority || "medium") === "low").length;
  return [
    `Total: ${tasks.length}  Done: ${done}  Pending: ${pending}`,
    `Priority — 🔴 High: ${high}  🟡 Medium: ${medium}  ⚪ Low: ${low}`,
  ].join("\n");
}

export function tasksToCSV(tasks) {
  const header = "id,text,priority,done,createdAt";
  const rows = tasks.map((t) =>
    [t.id, t.text, t.priority, t.done, t.createdAt].map(csvField).join(",")
  );
  return [header, ...rows].join("\n");
}

async function main() {
  switch (command) {
    case "add": {
      let priority = "medium";
      let dueDate = null;
      const remaining = [...args];
      while (remaining.length > 0 && remaining[0].startsWith("-")) {
        if (remaining[0] === "-p" && remaining[1]) {
          priority = remaining[1];
          remaining.splice(0, 2);
        } else if (remaining[0] === "-d" && remaining[1]) {
          dueDate = remaining[1];
          remaining.splice(0, 2);
        } else {
          break;
        }
      }
      const text = remaining.join(" ");
      if (!text) {
        console.error("Error: task text is required.\n" + USAGE);
        process.exit(1);
      }
      const task = await add(text, priority, dueDate);
      const icon = PRIORITY_ICONS[task.priority];
      const duePart = task.dueDate ? ` (due: ${task.dueDate})` : "";
      console.log(`Added: ${icon} #${task.id} ${task.text}${duePart}`);
      break;
    }

    case "list": {
      let tasks = await getAll();
      if (tasks.length === 0) {
        console.log("No tasks yet. Use `task add <text>` to create one.");
        break;
      }
      const sortIndex = args.indexOf("--sort");
      const sortBy = sortIndex !== -1 ? args[sortIndex + 1] : null;
      if (sortBy === "priority") {
        tasks = [...tasks].sort(
          (a, b) => (PRIORITY_ORDER[a.priority || "medium"] ?? 1) - (PRIORITY_ORDER[b.priority || "medium"] ?? 1)
        );
      } else if (sortBy === "due") {
        tasks = [...tasks].sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      }
      for (const t of tasks) {
        const mark = t.done ? "✓" : " ";
        const icon = PRIORITY_ICONS[t.priority || "medium"];
        const duePart = t.dueDate ? `  due: ${t.dueDate}` : "";
        console.log(`  [${mark}] ${icon} #${t.id}  ${t.text}${duePart}`);
      }
      break;
    }

    case "done": {
      const id = Number(args[0]);
      if (!id) {
        console.error("Error: task ID is required.\n" + USAGE);
        process.exit(1);
      }
      const task = await toggle(id);
      if (!task) {
        console.error(`Error: task #${id} not found.`);
        process.exit(1);
      }
      const status = task.done ? "done" : "not done";
      console.log(`Task #${task.id} marked as ${status}.`);
      break;
    }

    case "remove": {
      const id = Number(args[0]);
      if (!id) {
        console.error("Error: task ID is required.\n" + USAGE);
        process.exit(1);
      }
      const task = await remove(id);
      if (!task) {
        console.error(`Error: task #${id} not found.`);
        process.exit(1);
      }
      console.log(`Removed: #${task.id} ${task.text}`);
      break;
    }

    case "export": {
      const tasks = await getAll();
      console.log(tasksToCSV(tasks));
      break;
    }

    case "stats": {
      const tasks = await getAll();
      console.log(taskStats(tasks));
      break;
    }

    case "search": {
      const keyword = args.join(" ");
      if (!keyword) {
        console.error("Error: search keyword is required.\n" + USAGE);
        process.exit(1);
      }
      const tasks = await getAll();
      const matches = tasks.filter((t) =>
        t.text.toLowerCase().includes(keyword.toLowerCase())
      );
      if (matches.length === 0) {
        console.log(`No tasks matching "${keyword}".`);
        break;
      }
      for (const t of matches) {
        const mark = t.done ? "✓" : " ";
        const icon = PRIORITY_ICONS[t.priority || "medium"];
        console.log(`  [${mark}] ${icon} #${t.id}  ${t.text}`);
      }
      break;
    }

    case "help":
    case undefined: {
      console.log(USAGE);
      break;
    }

    default: {
      console.error(`Unknown command: ${command}\n` + USAGE);
      process.exit(1);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

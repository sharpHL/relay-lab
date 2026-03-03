#!/usr/bin/env node

import { getAll, add, remove, toggle } from "./store.js";

const [command, ...args] = process.argv.slice(2);

const PRIORITY_ICONS = { high: "🔴", medium: "🟡", low: "⚪" };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const USAGE = `Usage:
  task add [-p high|medium|low] <text>  Add a new task (default: medium)
  task list [--sort priority]           List all tasks
  task done <id>                        Toggle task done/undone
  task remove <id>                      Remove a task
  task search <keyword>                 Search tasks by keyword`;

async function main() {
  switch (command) {
    case "add": {
      let priority = "medium";
      const remaining = [...args];
      if (remaining[0] === "-p" && remaining[1]) {
        priority = remaining[1];
        remaining.splice(0, 2);
      }
      const text = remaining.join(" ");
      if (!text) {
        console.error("Error: task text is required.\n" + USAGE);
        process.exit(1);
      }
      const task = await add(text, priority);
      const icon = PRIORITY_ICONS[task.priority];
      console.log(`Added: ${icon} #${task.id} ${task.text}`);
      break;
    }

    case "list": {
      let tasks = await getAll();
      if (tasks.length === 0) {
        console.log("No tasks yet. Use `task add <text>` to create one.");
        break;
      }
      if (args.includes("--sort") && args.includes("priority")) {
        tasks = [...tasks].sort(
          (a, b) => (PRIORITY_ORDER[a.priority || "medium"] ?? 1) - (PRIORITY_ORDER[b.priority || "medium"] ?? 1)
        );
      }
      for (const t of tasks) {
        const mark = t.done ? "✓" : " ";
        const icon = PRIORITY_ICONS[t.priority || "medium"];
        console.log(`  [${mark}] ${icon} #${t.id}  ${t.text}`);
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

main();

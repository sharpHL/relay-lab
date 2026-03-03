#!/usr/bin/env node

import { getAll, add, remove, toggle } from "./store.js";

const [command, ...args] = process.argv.slice(2);

const USAGE = `Usage:
  task add <text>     Add a new task
  task list           List all tasks
  task done <id>      Toggle task done/undone
  task remove <id>    Remove a task`;

async function main() {
  switch (command) {
    case "add": {
      const text = args.join(" ");
      if (!text) {
        console.error("Error: task text is required.\n" + USAGE);
        process.exit(1);
      }
      const task = await add(text);
      console.log(`Added: #${task.id} ${task.text}`);
      break;
    }

    case "list": {
      const tasks = await getAll();
      if (tasks.length === 0) {
        console.log("No tasks yet. Use `task add <text>` to create one.");
        break;
      }
      for (const t of tasks) {
        const mark = t.done ? "✓" : " ";
        console.log(`  [${mark}] #${t.id}  ${t.text}`);
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

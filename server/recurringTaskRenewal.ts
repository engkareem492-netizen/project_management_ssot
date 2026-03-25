/**
 * Recurring Task Renewal Engine
 * Runs nightly (or on-demand) to renew recurring tasks whose due date has passed.
 * For each qualifying task:
 *   1. Snapshot the current state into taskHistory
 *   2. Reset status to "Not Started"
 *   3. Calculate the next due date based on recurringType and project work-week settings
 */

import { getDb } from "./db";
import { tasks, taskHistory, projectWorkWeek } from "../drizzle/schema";
import { eq, and, lte, ne, isNotNull, sql } from "drizzle-orm";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWorkWeekSettings(settings: any) {
  const workingDays: number[] = (settings?.workingDays ?? "0,1,2,3,4")
    .split(",")
    .map(Number)
    .filter((n: number) => !isNaN(n));
  const weekEndDay: number = settings?.weekEndDay ?? 4; // Thursday default
  return { workingDays, weekEndDay };
}

/**
 * Get the next due date for a recurring task.
 * - daily: next working day
 * - weekly: end of next work week (weekEndDay)
 * - monthly: last working day of next month
 */
function getNextDueDate(
  recurringType: string,
  currentDueDate: string,
  workingDays: number[],
  weekEndDay: number
): string {
  const base = new Date(currentDueDate + "T00:00:00");
  if (isNaN(base.getTime())) {
    // Fallback to today
    base.setTime(Date.now());
  }

  if (recurringType === "daily") {
    // Advance to next working day
    const next = new Date(base);
    next.setDate(next.getDate() + 1);
    while (!workingDays.includes(next.getDay())) {
      next.setDate(next.getDate() + 1);
    }
    return next.toISOString().split("T")[0];
  }

  if (recurringType === "weekly") {
    // Find the next occurrence of weekEndDay
    const next = new Date(base);
    next.setDate(next.getDate() + 1); // move past current date
    while (next.getDay() !== weekEndDay) {
      next.setDate(next.getDate() + 1);
    }
    return next.toISOString().split("T")[0];
  }

  if (recurringType === "monthly") {
    // Last working day of next month
    const next = new Date(base);
    next.setMonth(next.getMonth() + 2, 0); // last day of next month
    while (!workingDays.includes(next.getDay())) {
      next.setDate(next.getDate() - 1);
    }
    return next.toISOString().split("T")[0];
  }

  // Fallback: +1 day
  const next = new Date(base);
  next.setDate(next.getDate() + 1);
  return next.toISOString().split("T")[0];
}

function getPeriodLabel(recurringType: string, dueDate: string): string {
  const d = new Date(dueDate + "T00:00:00");
  if (recurringType === "daily") return `Day of ${dueDate}`;
  if (recurringType === "weekly") {
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - 6);
    return `Week of ${weekStart.toISOString().split("T")[0]}`;
  }
  if (recurringType === "monthly") {
    return `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
  }
  return dueDate;
}

export async function renewRecurringTasks(): Promise<{ renewed: number; errors: string[] }> {
  const db = await getDb();
  if (!db) return { renewed: 0, errors: ["DB unavailable"] };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Find all recurring tasks whose dueDate <= today and are not completed/cancelled
  const dueTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        ne(tasks.recurringType, "none"),
        isNotNull(tasks.recurringType),
        lte(tasks.dueDate, todayStr),
        sql`COALESCE(${tasks.status}, '') NOT IN ('Completed', 'Cancelled', 'Done', 'Closed')`
      )
    );

  let renewed = 0;
  const errors: string[] = [];

  for (const task of dueTasks) {
    try {
      // Get project work-week settings
      const wwRows = await db
        .select()
        .from(projectWorkWeek)
        .where(eq(projectWorkWeek.projectId, task.projectId))
        .limit(1);
      const ww = wwRows[0] ?? null;
      const { workingDays, weekEndDay } = getWorkWeekSettings(ww);

      // 1. Snapshot current state to history
      await db.insert(taskHistory).values({
        taskId: task.id,
        projectId: task.projectId,
        taskIdCode: task.taskId,
        description: task.description ?? null,
        status: task.status ?? null,
        priority: task.priority ?? null,
        responsible: task.responsible ?? null,
        subject: (task as any).subject ?? null,
        dueDate: task.dueDate ?? null,
        currentStatus: task.currentStatus ?? null,
        statusUpdate: task.statusUpdate ?? null,
        periodLabel: getPeriodLabel(task.recurringType ?? "daily", task.dueDate ?? todayStr),
      });

      // 2. Calculate next due date
      const nextDue = getNextDueDate(
        task.recurringType ?? "daily",
        task.dueDate ?? todayStr,
        workingDays,
        weekEndDay
      );

      // 3. Reset task
      await db.update(tasks).set({
        status: "Not Started",
        dueDate: nextDue,
        currentStatus: null,
        statusUpdate: null,
        updateDate: todayStr,
      }).where(eq(tasks.id, task.id));

      renewed++;
    } catch (e: any) {
      errors.push(`Task ${task.taskId}: ${e.message}`);
    }
  }

  return { renewed, errors };
}

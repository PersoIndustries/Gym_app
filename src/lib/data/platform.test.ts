import { describe, expect, it } from "vitest";
import { computeMrr, invoiceTotals, TENANTS_OPS, type Invoice } from "./platform";
import { duplicateTask, sortTasks } from "./tasks";
import type { RoadmapItem } from "@/lib/domain/types";

describe("platform metrics", () => {
  it("MRR only counts active boxes", () => {
    // t1 pro 99 + t3 enterprise 249 = 348 €
    expect(computeMrr(TENANTS_OPS)).toBe(34800);
  });
  it("invoice totals split by status", () => {
    const inv: Invoice[] = [
      { id: "a", tenant_id: "t", number: "1", date: "", amount_cents: 100, status: "paid", method: "" },
      { id: "b", tenant_id: "t", number: "2", date: "", amount_cents: 50, status: "failed", method: "" },
    ];
    expect(invoiceTotals(inv)).toEqual({ paid: 100, pending: 0, failed: 50, refunded: 0 });
  });
});

describe("tasks", () => {
  const base = (id: string, priority: NonNullable<RoadmapItem["priority"]>, sort_order: number): RoadmapItem => ({ id, title: id, description: "", status: "done", sort_order, priority });
  it("urgent tasks sort first", () => {
    expect(sortTasks([base("a", "low", 1), base("b", "urgent", 2), base("c", "high", 3)]).map((t) => t.id)).toEqual(["b", "c", "a"]);
  });
  it("a copy goes back to pending at the end", () => {
    const all = [base("a", "high", 1), base("b", "low", 7)];
    const c = duplicateTask(all[0]!, all, "new");
    expect([c.status, c.sort_order, c.priority, c.title]).toEqual(["pending", 8, "high", "a (copia)"]);
  });
});

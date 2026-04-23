/**
 * Critical Path Method (CPM) — Forward/Backward Pass
 * Computes earlyStart, earlyFinish, lateStart, lateFinish, totalFloat, isCritical
 * for all tasks in a project using topological sort (Kahn's algorithm).
 */

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function diffDays(a: Date, b: Date): number {
  return Math.max(0, Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function toDate(d: string | null | undefined): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export interface CpmNode {
  id: number;
  plannedStart: string | null;
  plannedEnd: string | null;
  durationDays: string | null;
  predecessors: Array<{ predecessorId: number; lagDays?: number }>;
  successors: Array<{ successorId: number; lagDays?: number }>;
}

export interface CpmResult {
  id: number;
  earlyStart: string;
  earlyFinish: string;
  lateStart: string;
  lateFinish: string;
  totalFloat: number;
  isCritical: boolean;
}

export function computeCPM(nodes: CpmNode[]): { results: CpmResult[]; cycle: boolean } {
  if (nodes.length === 0) return { results: [], cycle: false };

  const byId = new Map<number, CpmNode>();
  for (const n of nodes) byId.set(n.id, n);

  // Topological sort via Kahn's algorithm
  const indeg = new Map<number, number>();
  nodes.forEach((n) => indeg.set(n.id, n.predecessors.length));
  const ready: number[] = [];
  indeg.forEach((d, id) => d === 0 && ready.push(id));
  const order: number[] = [];

  while (ready.length) {
    const id = ready.shift()!;
    order.push(id);
    const n = byId.get(id)!;
    for (const s of n.successors) {
      const d = (indeg.get(s.successorId) ?? 0) - 1;
      indeg.set(s.successorId, d);
      if (d === 0) ready.push(s.successorId);
    }
  }

  if (order.length !== nodes.length) {
    return { results: [], cycle: true };
  }

  const earlyStart = new Map<number, Date>();
  const earlyFinish = new Map<number, Date>();
  const duration = new Map<number, number>();

  // Forward pass
  for (const id of order) {
    const n = byId.get(id)!;
    const ps = toDate(n.plannedStart);
    const pe = toDate(n.plannedEnd);
    const dur = n.durationDays != null
      ? parseFloat(n.durationDays)
      : ps && pe
      ? diffDays(ps, pe)
      : 1;
    duration.set(id, dur);

    let es: Date;
    if (n.predecessors.length === 0) {
      es = ps ?? new Date();
    } else {
      es = new Date(0);
      for (const p of n.predecessors) {
        const pef = earlyFinish.get(p.predecessorId);
        if (!pef) continue;
        const candidate = addDays(pef, p.lagDays ?? 0);
        if (candidate > es) es = candidate;
      }
      if (ps && ps > es) es = ps;
    }
    earlyStart.set(id, es);
    earlyFinish.set(id, addDays(es, dur));
  }

  // Project finish = max earlyFinish
  let projectFinish = new Date(0);
  for (const id of order) {
    const ef = earlyFinish.get(id)!;
    if (ef > projectFinish) projectFinish = ef;
  }

  const lateFinish = new Map<number, Date>();
  const lateStart = new Map<number, Date>();

  // Backward pass
  for (const id of [...order].reverse()) {
    const n = byId.get(id)!;
    let lf: Date;
    if (n.successors.length === 0) {
      lf = projectFinish;
    } else {
      lf = projectFinish;
      for (const s of n.successors) {
        const sls = lateStart.get(s.successorId);
        if (!sls) continue;
        const candidate = addDays(sls, -(s.lagDays ?? 0));
        if (candidate < lf) lf = candidate;
      }
    }
    lateFinish.set(id, lf);
    lateStart.set(id, addDays(lf, -(duration.get(id) ?? 0)));
  }

  const results: CpmResult[] = order.map((id) => {
    const ls = lateStart.get(id)!;
    const es = earlyStart.get(id)!;
    const floatDays = diffDays(es, ls);
    return {
      id,
      earlyStart: earlyStart.get(id)!.toISOString().slice(0, 10),
      earlyFinish: earlyFinish.get(id)!.toISOString().slice(0, 10),
      lateStart: ls.toISOString().slice(0, 10),
      lateFinish: lateFinish.get(id)!.toISOString().slice(0, 10),
      totalFloat: floatDays,
      isCritical: floatDays === 0,
    };
  });

  return { results, cycle: false };
}

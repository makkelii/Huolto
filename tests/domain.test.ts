import { describe, it, expect } from "vitest";
import { seed } from "../src/seed";
import { completeJob, readiness, matchFaults, csv } from "../src/domain";
describe("readiness and safety", () => {
  it("missing supplies take precedence", () => {
    expect(readiness(seed().jobs[0])).toBe("needs");
  });
  it("empty checklist cannot be ready", () =>
    expect(readiness({ ...seed().jobs[0], requirements: [] })).toBe(
      "unchecked",
    ));
});
describe("atomic demo stock consumption", () => {
  it("consumes parts but returns tools and records history", () => {
    const s = seed();
    const result = completeJob(s, "j1", { i1: 1, i2: 1 }, "Verified repair");
    expect(result.items[0].quantity).toBe(2);
    expect(result.items[1].quantity).toBe(0);
    expect(result.jobs[0].status).toBe("completed");
    expect(s.items[1].quantity).toBe(1);
    expect(result.events).toHaveLength(1);
  });
  it.each([-1, 2, NaN, Infinity])(
    "rejects invalid stock %s without mutation",
    (n) => {
      const s = seed();
      expect(() => completeJob(s, "j1", { i2: n }, "")).toThrow();
      expect(s.items[1].quantity).toBe(1);
    },
  );
  it("prevents duplicate completion", () => {
    const s = completeJob(seed(), "j1", {}, "Done");
    expect(() => completeJob(s, "j1", {}, "Again")).toThrow();
  });
});
describe("historical matching", () => {
  it("restricts evidence to same organization and verified outcomes", () => {
    const s = seed();
    expect(matchFaults("Moottori pysähtyy", s.faults, "other")).toEqual([]);
    expect(
      matchFaults(
        "Moottori pysähtyy",
        [{ ...s.faults[0], verified: false }],
        "demo",
      ),
    ).toEqual([]);
    expect(
      matchFaults("Moottori pysähtyy", s.faults, "demo")[0].terms,
    ).toContain("moottori");
  });
  it("never invents a match", () =>
    expect(matchFaults("unrelated", seed().faults, "demo")).toEqual([]));
});
it("escapes CSV quotes and spreadsheet formulas", () =>
  expect(csv([["=CMD()", 'a"b']])).toContain('"\'=CMD()","a""b"'));
it("creates next recurring job with fresh preparation and no duplicate completion", () => {
  const s = seed();
  const r = completeJob(s, "j1", {}, "Done");
  expect(r.jobs).toHaveLength(s.jobs.length + 1);
  const next = r.jobs.at(-1)!;
  expect(next.status).toBe("planned");
  expect(next.requirements.every((x) => x.state === "unchecked")).toBe(true);
  expect(next.actual).toEqual({});
  expect(next.due > s.jobs[0].due).toBe(true);
});
it("does not consume reserved stock", () => {
  const s = seed();
  s.items[1].reserved = 1;
  expect(() => completeJob(s, "j1", { i2: 1 }, "")).toThrow();
});

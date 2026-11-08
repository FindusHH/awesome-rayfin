import { describe, expect, it } from "vitest";
import type { DataPointPredicate, DataPointSelection } from "../finance/data/fabric-interop";
import type { DataTable } from "../finance/lib/types";
import {
  applySelections, eventsToSelections, filtersToSelections,
  selectionListsMatch, selectionsToFilters,
} from "../finance/lib/interaction";
import { selectionToIndex } from "../finance/features/fabric-chart.specs";
import { toGridColumns } from "../finance/features/fabric-data-grid.helpers";
import { timeSeriesGridColumns, varianceGridColumns } from "../finance/features/finance-grid-columns";

const table: DataTable = {
  columns: [{ key: "label", label: "Label" }, { key: "value", label: "Value", numeric: true }],
  rows: [
    { label: "Alpha", value: 10, date: "2026-01-15" },
    { label: "Beta", value: 20, date: "2026-07-15" },
    { label: null, value: 30, date: "invalid" },
    { label: "", value: null, date: "2026-02-30" },
  ],
};

const select = (...predicates: DataPointPredicate[]): DataPointSelection[] => [{ predicates }];
const filtered = (...predicates: DataPointPredicate[]) => applySelections(table, select(...predicates)).rows;

describe("Fabric 5.1 interaction contract", () => {
  it("round-trips host filters with field IDs and tagged scalar values", () => {
    const selections = filtersToSelections({ label: "Alpha", empty: "" });
    expect(selections).toEqual(select({ type: "set", fieldId: "label", values: [{ kind: "value", value: "Alpha" }] }));
    expect(selectionsToFilters([{ action: "select", selections }])).toEqual({ label: "Alpha" });
    expect(applySelections(table, selections).rows).toEqual([table.rows[0]]);
  });

  it("keeps blanks distinct from empty strings and supports exclusions", () => {
    expect(filtered({ type: "set", fieldId: "label", values: [{ kind: "blank" }] })).toEqual([table.rows[2]]);
    expect(filtered({ type: "set", fieldId: "label", values: [{ kind: "value", value: "" }] })).toEqual([table.rows[3]]);
    expect(filtered({ type: "set", fieldId: "label", values: [{ kind: "blank" }], excluded: true })).toHaveLength(3);
    expect(selectionsToFilters([{ action: "select", selections: select({
      type: "set", fieldId: "label", values: [{ kind: "value", value: "Alpha" }], excluded: true,
    }) }])).toEqual({});
  });

  it("respects inclusive and exclusive range boundaries", () => {
    expect(filtered({ type: "range", fieldId: "value", min: { kind: "value", value: 10, inclusive: false }, max: { kind: "value", value: 20 } }))
      .toEqual([table.rows[1]]);
    expect(filtered({ type: "range", fieldId: "date", min: { kind: "value", value: "2026-01-15" }, max: { kind: "value", value: "2026-07-15", inclusive: false } }))
      .toEqual([table.rows[0]]);
  });

  it("handles blank, text and calendar date-part predicates", () => {
    expect(filtered({ type: "blank", fieldId: "label", operator: "isBlank" })).toEqual([table.rows[2]]);
    expect(filtered({ type: "text", fieldId: "label", operator: "startsWith", terms: ["al"], match: "any" })).toEqual([table.rows[0]]);
    expect(filtered({ type: "text", fieldId: "label", operator: "contains", terms: ["b", "ta"], match: "all" })).toEqual([table.rows[1]]);
    expect(filtered({ type: "datePart", fieldId: "date", part: "semester", values: [1] })).toEqual([table.rows[0]]);
  });

  it("uses SDK equality for the echo guard and folds readonly event batches", () => {
    const selections = filtersToSelections({ label: "Alpha", value: "10" });
    expect(selectionListsMatch(selections, [...selections].reverse())).toBe(true);
    expect(selectionListsMatch(selections, filtersToSelections({ label: "Beta", value: "10" }))).toBe(false);
    expect(eventsToSelections([{ action: "select", selections }, { action: "clear" }])).toEqual([]);
  });

  it("resolves chart clicks from tagged label predicates", () => {
    const data = [{ label: "Alpha", value: 10 }, { label: "Beta", value: 20 }];
    expect(selectionToIndex(filtersToSelections({ label: "Beta" })[0], data)).toBe(1);
    expect(selectionToIndex(select({ type: "set", fieldId: "label", values: [{ kind: "blank" }] })[0], data)).toBe(-1);
  });
});

describe("Fabric 5.1 grid columns", () => {
  it("preserves numeric styling and raw copyable values", () => {
    expect(toGridColumns(table.columns)[1].numericStyling).toBe(true);
    const variance = varianceGridColumns([{ label: "Sales", actual: 10, lowerIsBetter: false }]);
    expect(variance.columns[1].numericStyling).toBe(true);
    expect(variance.data[0].actual).toBe(10);
    const series = timeSeriesGridColumns([], { periods: ["Jan", "Feb"] });
    expect(series.columns.filter((c) => ["p0", "p1", "total", "pop"].includes(c.id)).every((c) => c.numericStyling)).toBe(true);
  });
});

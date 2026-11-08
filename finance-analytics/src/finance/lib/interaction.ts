/**
 * Interaction adapter — translates between the official Fabric interaction contract
 * (`onInteraction` emits `InteractionEvent[]` carrying set/range predicates) and this
 * package's canonical, host-owned filter state (`FilterState`).
 *
 * The Fabric substrate is explicitly host-driven: a visual reports a selection via
 * `onInteraction`, and the host decides whether to treat it as a cross-filter by
 * re-passing a filtered/highlighted `DataTable`. So OUR filter state stays canonical
 * and an incoming `InteractionEvent` is just an **input event** we fold in. This module
 * is the typed, tested seam for that fold — plus the reverse projection so our active
 * filters can be expressed as official selections (e.g. to drive a visual's highlight).
 *
 * Selection equality uses the SDK's semantic comparison so the host echo-guard
 * stays consistent with the visual's selection contract.
 */

import type { CellValue, DataTable } from "./types";
import type { FilterState } from "./filters";
import { parseCalendarDate, semanticSelectionEqual, semanticSelectionsEqual } from "@microsoft/fabric-visuals-core";
import type {
  DataPointPredicate,
  DataPointSelection,
  InteractionEvent,
  SetPredicate,
} from "../data/fabric-interop";

/**
 * Project our active `FilterState` into official set-predicate selections — one
 * selection per active column, each a single-value `SetPredicate`. Useful for driving
 * a visual's highlight/selection state from the host's canonical filters.
 */
export function filtersToSelections(active: FilterState): DataPointSelection[] {
  return Object.entries(active)
    .filter(([, v]) => v !== "" && v != null)
    .map(([fieldId, value]) => ({
      predicates: [{ type: "set", fieldId, values: [{ kind: "value", value }] } satisfies SetPredicate],
    }));
}

/**
 * Fold an official `InteractionEvent` stream into a next `FilterState`, merged onto
 * `base`. A `'clear'` event resets to an empty state; a `'select'` event applies each
 * `SetPredicate` as a single-value column filter (first value wins, since `FilterState`
 * is exact-match single-value per column).
 *
 * `RangePredicate`s are intentionally skipped — our exact-match `FilterState` can't
 * represent a range losslessly. Range-driven cross-filtering is handled at the visual
 * boundary by re-passing a range-filtered official `DataTable`, not by mutating filters.
 */
export function selectionsToFilters(events: InteractionEvent[], base: FilterState = {}): FilterState {
  let next: FilterState = { ...base };
  for (const ev of events) {
    if (ev.action === "clear") {
      next = {};
      continue;
    }
    for (const sel of ev.selections) {
      for (const p of sel.predicates) {
        if (p.type !== "set") continue;
        if (!p.fieldId || p.excluded || p.values.length === 0) continue;
        const first = p.values[0];
        if (first.kind !== "value") continue;
        next[p.fieldId] = String(first.value);
      }
    }
  }
  return next;
}

/**
 * Extract the canonical `DataPointSelection[]` an official `InteractionEvent` expresses.
 * A `'clear'` event yields an empty selection (the "nothing selected" state); a
 * `'select'` event yields its `selections` verbatim. This is the selection-space analog
 * of {@link selectionsToFilters} — used to fold a fabric visual's `onInteraction` into
 * the app's selection state without projecting through exact-match filters (so range
 * predicates survive the round-trip to the host).
 */
export function eventToSelections(event: InteractionEvent): DataPointSelection[] {
  return event.action === "clear" ? [] : [...event.selections];
}

/**
 * Reduce an official `InteractionEvent[]` batch (the shape `onInteraction` delivers) to
 * the net selection it expresses: a `'clear'` resets, a `'select'` replaces, last event
 * wins. The array analog of {@link eventToSelections}, used by the SelectionProvider to
 * accept a visual's raw interaction callback.
 */
export function eventsToSelections(events: InteractionEvent[]): DataPointSelection[] {
  return events.reduce<DataPointSelection[]>((_acc, e) => eventToSelections(e), []);
}

/**
 * Order-independent structural equality of two selection *lists* — pairwise
 * {@link selectionsMatch} up to ordering. Powers the selection bus echo-guard so a
 * value received from the host isn't republished (which would loop between items).
 */
export function selectionListsMatch(a: DataPointSelection[], b: DataPointSelection[]): boolean {
  return semanticSelectionsEqual(a, b);
}

/**
 * Structural, order-independent equality of two selections using the SDK contract.
 */
export function selectionsMatch(a: DataPointSelection, b: DataPointSelection): boolean {
  return semanticSelectionEqual(a, b);
}

function cmp(a: unknown, b: unknown): number | null {
  const numericValue = (value: unknown) => value instanceof Date ? value.getTime()
    : typeof value === "string" && parseCalendarDate(value) ? Date.parse(value) : Number(value);
  const na = numericValue(a);
  const nb = numericValue(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return null;
}

/** Does one row satisfy a single predicate? */
function predicateMatches(row: Record<string, CellValue>, p: DataPointPredicate): boolean {
  const cell = row[p.fieldId];
  if (p.type === "set") {
    const matches = p.values.some((v) =>
      v.kind === "blank" ? cell == null : cell != null && String(v.value) === String(cell),
    );
    return p.excluded ? !matches : matches;
  }
  if (p.type === "blank") {
    return p.operator === "isBlank" ? cell == null : cell != null;
  }
  if (p.type === "text") {
    if (cell == null) return false;
    const text = String(cell).toLowerCase();
    const matchesTerm = (term: string) =>
      p.operator === "contains" ? text.includes(term.toLowerCase()) : text.startsWith(term.toLowerCase());
    const matches = p.match === "all" ? p.terms.every(matchesTerm) : p.terms.some(matchesTerm);
    return p.negated ? !matches : matches;
  }
  if (p.type === "datePart") {
    const date = typeof cell === "string" ? parseCalendarDate(cell) : undefined;
    if (!date) return false;
    const { year, month } = date;
    const value = p.part === "year" ? year : p.part === "month" ? month
      : p.part === "quarter" ? Math.ceil(month / 3) : Math.ceil(month / 6);
    return p.values.includes(value);
  }
  // range
  if (cell == null) return false;
  if (p.min != null) {
    const d = cmp(cell, p.min.value);
    if (d == null || d < 0 || (d === 0 && p.min.inclusive === false)) return false;
  }
  if (p.max != null) {
    const d = cmp(cell, p.max.value);
    if (d == null || d > 0 || (d === 0 && p.max.inclusive === false)) return false;
  }
  return true;
}

/**
 * Apply official selections to our object-row `DataTable`, powering host-owned
 * cross-filter when a visual's `onInteraction` selection is treated as a data filter.
 * Semantics match the official contract: predicates within a selection are conjunctive
 * (AND); multiple selections are disjunctive (OR). An empty selection array is a no-op
 * (returns the table unchanged).
 */
export function applySelections(table: DataTable, selections: DataPointSelection[]): DataTable {
  if (!selections.length) return table;
  return {
    columns: table.columns,
    rows: table.rows.filter((row) =>
      selections.some((sel) => sel.predicates.every((p) => predicateMatches(row, p))),
    ),
  };
}

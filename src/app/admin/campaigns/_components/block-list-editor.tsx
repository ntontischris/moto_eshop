"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import {
  BLOCK_DEFS,
  BLOCK_DEF_MAP,
  type EditorBlock,
} from "./block-descriptors";
import { BlockFields } from "./block-fields";

const inputCls =
  "rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary";
const iconBtn =
  "rounded p-1 text-text-muted transition-colors hover:bg-bg-elevated disabled:opacity-30";

export function BlockListEditor({
  blocks,
  onChange,
}: {
  blocks: EditorBlock[];
  onChange: (b: EditorBlock[]) => void;
}) {
  const [addType, setAddType] = useState(BLOCK_DEFS[0].type);
  const [open, setOpen] = useState<number | null>(0);

  function add() {
    onChange([...blocks, BLOCK_DEF_MAP[addType].create()]);
    setOpen(blocks.length);
  }
  function update(i: number, b: EditorBlock) {
    const next = [...blocks];
    next[i] = b;
    onChange(next);
  }
  function remove(i: number) {
    onChange(blocks.filter((_, j) => j !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-border-default bg-bg-surface"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex-1 text-left text-sm font-medium text-text-primary"
            >
              {i + 1}. {BLOCK_DEF_MAP[block.type]?.label ?? block.type}
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className={iconBtn}
                aria-label="Πάνω"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === blocks.length - 1}
                className={iconBtn}
                aria-label="Κάτω"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className={`${iconBtn} hover:text-red-400`}
                aria-label="Διαγραφή"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {open === i && (
            <div className="border-t border-border-default p-3">
              <BlockFields block={block} onChange={(b) => update(i, b)} />
            </div>
          )}
        </div>
      ))}
      {blocks.length === 0 && (
        <p className="text-sm text-text-muted">Κανένα block ακόμη.</p>
      )}

      <div className="flex gap-2 pt-2">
        <select
          value={addType}
          onChange={(e) => setAddType(e.target.value)}
          className={inputCls}
        >
          {BLOCK_DEFS.map((d) => (
            <option key={d.type} value={d.type}>
              {d.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
        >
          <Plus className="h-4 w-4" />
          Προσθήκη block
        </button>
      </div>
    </div>
  );
}

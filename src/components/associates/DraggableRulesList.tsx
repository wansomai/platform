'use client';

import { useState, useCallback } from 'react';
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion';
import { GripVertical, ChevronDown, BookOpen } from 'lucide-react';

interface DraggableRulesListProps {
  rules: string[];
  onReorder?: (reorderedRules: string[]) => void;
  collapsed?: boolean;
}

function RuleItem({
  rule,
  index,
}: {
  rule: string;
  index: number;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={rule}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-start gap-2 rounded-md border border-transparent bg-white px-2.5 py-2 shadow-sm transition-shadow hover:shadow-md data-[dragging]:shadow-lg data-[dragging]:border-[#74C6B8]/40 data-[dragging]:z-10"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
    >
      <button
        type="button"
        className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-gray-400 hover:text-[#74C6B8] hover:bg-[#E9F5F3] active:cursor-grabbing transition-colors"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="text-[11px] font-medium text-[#74C6B8] tabular-nums shrink-0 mt-[3px] select-none">
        {index + 1}.
      </span>
      <span className="text-xs text-gray-700 leading-relaxed">{rule}</span>
    </Reorder.Item>
  );
}

export function DraggableRulesList({
  rules: initialRules,
  onReorder,
  collapsed: controlledCollapsed,
}: DraggableRulesListProps) {
  const [items, setItems] = useState(initialRules);
  const isControlled = controlledCollapsed !== undefined;
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const collapsed = isControlled ? controlledCollapsed : internalCollapsed;

  const handleReorder = useCallback(
    (newOrder: string[]) => {
      setItems(newOrder);
      onReorder?.(newOrder);
    },
    [onReorder]
  );

  if (items.length === 0) return null;

  return (
    <div className="mt-2 rounded-md border border-[#74C6B8]/20 bg-[#F7FBFA] overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-[#E9F5F3]"
        onClick={() => {
          if (!isControlled) setInternalCollapsed((c) => !c);
        }}
      >
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-[#74C6B8]" />
          <span className="text-[11px] font-semibold text-gray-700">
            Rules for Thinking
          </span>
          <span className="text-[10px] text-gray-400 ml-1">
            {items.length} rule{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${
            collapsed ? '' : 'rotate-180'
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2">
              <Reorder.Group
                axis="y"
                values={items}
                onReorder={handleReorder}
                className="space-y-1"
              >
                {items.map((rule, index) => (
                  <RuleItem key={rule} rule={rule} index={index} />
                ))}
              </Reorder.Group>
              <p className="mt-2 text-center text-[10px] text-gray-400 select-none">
                Drag to reorder priority
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

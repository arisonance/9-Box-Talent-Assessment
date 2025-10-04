"use client";

import React, { useMemo, useState } from 'react';
import type { Employee, Assessment, BoxDefinition, Performance, Potential, Department } from '@/types';
import { buildBoxByPositionMap, gridToRatings } from '@/lib/box';
import clsx from 'clsx';

type Props = {
  employees: Employee[];
  departments: Department[];
  assessments: Assessment[];
  boxDefinitions: BoxDefinition[];
  onMove: (args: { employeeId: string; performance: Performance; potential: Potential; boxKey: string }) => Promise<void> | void;
};

export function NineBoxGrid({ employees, departments, assessments, boxDefinitions, onMove }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const deptById = useMemo(() => {
    const map: Record<string, Department> = {};
    for (const d of departments) map[d.id] = d;
    return map;
  }, [departments]);

  const assessmentByEmployeeId = useMemo(() => {
    const map: Record<string, Assessment> = {};
    for (const a of assessments) map[a.employee_id] = a;
    return map;
  }, [assessments]);

  const defByPos = useMemo(() => buildBoxByPositionMap(boxDefinitions), [boxDefinitions]);

  const assignedByBoxKey = useMemo(() => {
    const grouping: Record<string, Employee[]> = {};
    for (const emp of employees) {
      const a = assessmentByEmployeeId[emp.id];
      if (!a) continue;
      if (!grouping[a.box_key]) grouping[a.box_key] = [];
      grouping[a.box_key].push(emp);
    }
    return grouping;
  }, [employees, assessmentByEmployeeId]);

  const onDropOnCell = async (e: React.DragEvent<HTMLDivElement>, gridX: 1 | 2 | 3, gridY: 1 | 2 | 3) => {
    e.preventDefault();
    const employeeId = e.dataTransfer.getData('text/plain');
    if (!employeeId) return;
    const { performance, potential } = gridToRatings(gridX, gridY);
    const def = defByPos[`${gridX}-${gridY}`];
    if (!def) return;
    await onMove({ employeeId, performance, potential, boxKey: def.key });
    setDraggingId(null);
  };

  const renderPersonTile = (emp: Employee) => {
    const dept = emp.department_id ? deptById[emp.department_id] : undefined;
    return (
      <div
        key={emp.id}
        className={clsx(
          'flex items-center justify-between rounded border border-[var(--color-border)] p-2 text-sm bg-[var(--color-card)] text-[var(--color-card-foreground)]',
          draggingId === emp.id && 'opacity-60'
        )}
        draggable
        onDragStart={(e) => {
          setDraggingId(emp.id);
          e.dataTransfer.setData('text/plain', emp.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => setDraggingId(null)}
      >
        <div className="flex items-center gap-2">
          {dept?.color ? (
            <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: dept.color || undefined }} />
          ) : null}
          <span className="font-medium">{emp.name}</span>
        </div>
        {emp.title ? <span className="text-xs text-gray-500">{emp.title}</span> : null}
      </div>
    );
  };

  const renderCell = (gridX: 1 | 2 | 3, gridY: 1 | 2 | 3) => {
    const def = defByPos[`${gridX}-${gridY}`];
    const people = def ? assignedByBoxKey[def.key] ?? [] : [];
    return (
      <div
        key={`${gridX}-${gridY}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDropOnCell(e, gridX, gridY)}
        className="flex h-60 min-h-48 flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded border border-[var(--color-border)]"
              style={{ backgroundColor: def?.color || '#E5E7EB' }}
            />
            <div className="text-sm font-semibold">
              {def?.label ?? '—'}
            </div>
          </div>
          {def?.action_hint ? (
            <div className="text-xs text-[var(--color-muted-foreground)]">{def.action_hint}</div>
          ) : null}
        </div>
        <div className="scrollbar-thin flex-1 space-y-2 overflow-auto">
          {people.map(renderPersonTile)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {/* Y=3 row (high potential) */}
        {([1, 2, 3] as const).map((x) => renderCell(x, 3))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {/* Y=2 row (medium potential) */}
        {([1, 2, 3] as const).map((x) => renderCell(x, 2))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {/* Y=1 row (low potential) */}
        {([1, 2, 3] as const).map((x) => renderCell(x, 1))}
      </div>
    </div>
  );
}



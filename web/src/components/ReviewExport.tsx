"use client";

import React from 'react';
import html2canvas from 'html2canvas';
import type { Assessment, Employee, BoxDefinition, Department } from '@/types';

type Props = {
  targetSelector: string; // CSS selector for grid root to snapshot
  employees: Employee[];
  assessments: Assessment[];
  boxDefinitions: BoxDefinition[];
  departments: Department[];
};

export function ReviewExport({ targetSelector, employees, assessments, boxDefinitions, departments }: Props) {
  const onExportPNG = async () => {
    const el = document.querySelector(targetSelector) as HTMLElement | null;
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2 });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = '9box.png';
    a.click();
  };

  const onExportCSV = () => {
    const boxByKey: Record<string, BoxDefinition> = {};
    for (const b of boxDefinitions) boxByKey[b.key] = b;
    const empById: Record<string, Employee> = {};
    for (const e of employees) empById[e.id] = e;
    const deptById: Record<string, Department> = {};
    for (const d of departments) deptById[d.id] = d;

    const header = ['name', 'employee_id', 'department', 'performance', 'potential', 'box_label', 'assessed_at'];
    const rows = assessments.map((a) => {
      const emp = empById[a.employee_id];
      const deptName = emp?.department_id ? deptById[emp.department_id]?.name ?? '' : '';
      const boxLabel = boxByKey[a.box_key]?.label ?? a.box_key;
      return [emp?.name ?? '', emp?.id ?? '', deptName, a.performance, a.potential, boxLabel, a.assessed_at];
    });

    const csv = [header, ...rows]
      .map((cols) => cols.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = '9box.csv';
    a.click();
  };

  return (
    <div className="flex items-center gap-3">
      <button className="button button-primary px-3 py-2" onClick={() => void onExportPNG()}>
        Export PNG
      </button>
      <button className="button px-3 py-2" onClick={() => void onExportCSV()}>
        Export CSV
      </button>
    </div>
  );
}



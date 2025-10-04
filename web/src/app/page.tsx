"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { CSVImport } from '@/components/CSVImport';
import { NineBoxGrid } from '@/components/NineBoxGrid';
import { ReviewExport } from '@/components/ReviewExport';
import { supabaseClient } from '@/lib/supabase/client';
import type { Employee, Department, Assessment, BoxDefinition, Performance, Potential } from '@/types';

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [boxDefs, setBoxDefs] = useState<BoxDefinition[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  const refresh = async () => {
    const [emp, dept, defs, asmt] = await Promise.all([
      supabaseClient.from('employees').select('*'),
      supabaseClient.from('departments').select('*'),
      supabaseClient.from('box_definitions').select('*'),
      supabaseClient.from('assessments').select('* order by assessed_at desc'),
    ]);
    if (!emp.error && emp.data) setEmployees(emp.data as unknown as Employee[]);
    if (!dept.error && dept.data) setDepartments(dept.data as unknown as Department[]);
    if (!defs.error && defs.data) setBoxDefs(defs.data as unknown as BoxDefinition[]);
    if (!asmt.error && asmt.data) setAssessments(asmt.data as unknown as Assessment[]);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const onMove = async (args: { employeeId: string; performance: Performance; potential: Potential; boxKey: string }) => {
    const payload = {
      employee_id: args.employeeId,
      performance: args.performance,
      potential: args.potential,
      box_key: args.boxKey,
      assessed_at: new Date().toISOString(),
    };
    await supabaseClient.from('assessments').upsert(payload, { onConflict: 'employee_id' });
    await refresh();
  };

  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of assessments) counts[a.box_key] = (counts[a.box_key] ?? 0) + 1;
    const total = assessments.length || 1;
    return { counts, total };
  }, [assessments]);

  return (
    <main>
      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            className={
              `button px-3 py-2 ${step === s ? 'button-primary' : ''}`
            }
            onClick={() => setStep(s as 1 | 2 | 3 | 4)}
          >
            {s === 1 ? 'Import' : s === 2 ? 'Departments' : s === 3 ? 'Assess' : 'Review'}
          </button>
        ))}
      </div>

      {step === 1 && (
        <section className="space-y-4 card p-4">
          <h2 className="text-xl font-semibold">1) Import people</h2>
          <CSVImport onComplete={() => void refresh()} />
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4 card p-4">
          <h2 className="text-xl font-semibold">2) Departments</h2>
          <div className="rounded border border-[var(--color-border)] p-3">
            <div className="mb-2 text-sm text-gray-600">Existing departments</div>
            <ul className="space-y-1 text-sm">
              {departments.map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: d.color || '#e5e7eb' }} />
                  <span className="font-medium">{d.name}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-xs text-gray-500">Color editing and creation UI can be added here.</div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4 card p-4">
          <h2 className="text-xl font-semibold">3) Assess</h2>
          <div id="ninebox-grid" className="rounded border border-[var(--color-border)] p-3">
            <NineBoxGrid
              employees={employees}
              departments={departments}
              assessments={assessments}
              boxDefinitions={boxDefs}
              onMove={onMove}
            />
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4 card p-4">
          <h2 className="text-xl font-semibold">4) Review & export</h2>
          <div className="rounded border border-[var(--color-border)] p-3">
            <div className="mb-3 grid grid-cols-3 gap-2 text-sm">
              {boxDefs.map((b) => (
                <div key={b.key} className="flex items-center justify-between rounded border px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: b.color || '#e5e7eb' }} />
                    <span>{b.label}</span>
                  </div>
                  <span className="tabular-nums">{distribution.counts[b.key] ?? 0} ({Math.round(((distribution.counts[b.key] ?? 0) / distribution.total) * 100)}%)</span>
                </div>
              ))}
            </div>
            <ReviewExport
              targetSelector="#ninebox-grid"
              employees={employees}
              assessments={assessments}
              boxDefinitions={boxDefs}
              departments={departments}
            />
          </div>
        </section>
      )}
    </main>
  );
}

"use client";

import React, { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { supabaseClient } from '@/lib/supabase/client';

type Row = {
  employee_id?: string;
  name?: string;
  email?: string;
  department?: string;
  manager?: string;
  title?: string;
  performance?: string;
  potential?: string;
};

type Props = { onComplete?: () => void };

export function CSVImport({ onComplete }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [preview, setPreview] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasData = rows.length > 0;

  const handleFile = async (file: File) => {
    setError(null);
    setSummary(null);
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = (results.data ?? []).filter((r) => r && (r.employee_id || r.name));
        setRows(data);
        setPreview(data.slice(0, 5));
      },
      error: (err) => setError(err.message),
    });
  };

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.department) set.add(r.department);
    return Array.from(set);
  }, [rows]);

  const onImport = async () => {
    if (!hasData) return;
    setImporting(true);
    setError(null);
    setSummary(null);
    try {
      // Upsert departments by name
      const deptPayload = uniqueDepartments.map((name) => ({ name }));
      if (deptPayload.length > 0) {
        const { error: deptErr } = await supabaseClient.from('departments').upsert(deptPayload, {
          onConflict: 'name',
        });
        if (deptErr) throw deptErr;
      }

      // Fetch depts map
      const { data: depts, error: deptsErr } = await supabaseClient.from('departments').select('*');
      if (deptsErr) throw deptsErr;
      const byName: Record<string, string> = {};
      for (const d of depts ?? []) byName[d.name] = d.id;

      // Upsert employees
      const empPayload = rows.map((r) => ({
        id: r.employee_id ?? r.email ?? crypto.randomUUID(),
        name: r.name ?? 'Unknown',
        email: r.email ?? null,
        department_id: r.department ? byName[r.department] ?? null : null,
        manager_name: r.manager ?? null,
        title: r.title ?? null,
      }));

      const { error: empErr } = await supabaseClient.from('employees').upsert(empPayload, {
        onConflict: 'id',
      });
      if (empErr) throw empErr;

      setSummary(`Import complete. Departments: ${deptPayload.length}, Employees processed: ${empPayload.length}.`);
      onComplete?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
      {preview.length > 0 && (
        <div className="rounded border border-[var(--color-border)] p-3 bg-[var(--color-muted)]">
          <div className="mb-2 text-sm font-semibold">Preview (first 5 rows)</div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-muted-foreground)]">
                  {Object.keys(preview[0]).map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-1">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, idx) => (
                  <tr key={idx} className="border-t">
                    {Object.values(r).map((v, i) => (
                      <td key={i} className="px-2 py-1">{String(v ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          className="button button-primary px-3 py-2 disabled:opacity-50"
          disabled={!hasData || importing}
          onClick={() => void onImport()}
        >
          {importing ? 'Importing…' : 'Import'}
        </button>
        {summary ? <div className="text-green-500">{summary}</div> : null}
        {error ? <div className="text-red-400">{error}</div> : null}
      </div>
      <div className="text-xs text-[var(--color-muted-foreground)]">
        Expected headers: employee_id, name, email, department, manager, title, performance, potential.
      </div>
    </div>
  );
}



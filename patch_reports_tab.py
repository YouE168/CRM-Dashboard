#!/usr/bin/env python3
PATH = "components/dashboard/reports-tab.tsx"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

original = content
applied = []

old_imports = '''"use client";

import { useState } from "react";
import { SessionsChart } from "./sessions-chart";
import { ClientsByCountyChart } from "./clients-by-county-chart";
import { loadReportData } from "@/lib/report-data";
import {'''

new_imports = '''"use client";

import { useState, useEffect, useCallback } from "react";
import { SessionsChart } from "./sessions-chart";
import { ClientsByCountyChart } from "./clients-by-county-chart";
import {
  getReportData,
  subscribeToReportData,
  type ReportData,
} from "@/lib/supabase/dashboard-data";
import {'''

if old_imports in content:
    content = content.replace(old_imports, new_imports)
    applied.append("1. Imports -> Supabase")
else:
    print("WARNING: block 1 (imports) not found - skipped.")

old_data_load = '''  const [currentView, setCurrentView] = useState<ReportView>("list");
  const [noteInput, setNoteInput] = useState("");

  // Load editable report data
  const reportData = loadReportData();'''

new_data_load = '''  const [currentView, setCurrentView] = useState<ReportView>("list");
  const [noteInput, setNoteInput] = useState("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await getReportData();
      setReportData(data);
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToReportData(loadData);
    return unsubscribe;
  }, [loadData]);

  if (loading || !reportData) {
    return <div className="p-6 text-sm text-gray-400">Loading reports…</div>;
  }'''

if old_data_load in content:
    content = content.replace(old_data_load, new_data_load)
    applied.append("2. reportData loading -> Supabase + realtime")
else:
    print("WARNING: block 2 (data load) not found - skipped.")

if content == original:
    print("\nNo changes made.")
else:
    with open(PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"\nPatched {PATH}")
    for a in applied:
        print(f"   {a}")
    print(f"\nTotal lines now: {len(content.splitlines())}")

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllPartnersOverview,
  subscribeToAllPartnersData,
  savePartnerProfileData,
  addPartnerCollaboration,
  updatePartnerCollaboration,
  deletePartnerCollaboration,
  addPartnerResource,
  deletePartnerResource,
  type PartnerOverviewRow,
} from "@/lib/supabase/dashboard-data";
import { Handshake, Briefcase, GraduationCap, Trash2, Plus } from "lucide-react";

export function PartnersTab() {
  const [partners, setPartners] = useState<PartnerOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingCollab, setAddingCollab] = useState(false);
  const [newCollabTitle, setNewCollabTitle] = useState("");
  const [newCollabProgramId, setNewCollabProgramId] = useState("");
  const [addingResource, setAddingResource] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState("");

  const loadData = useCallback(async () => {
    try {
      const data = await getAllPartnersOverview();
      setPartners(data);
    } catch (err) {
      console.error("Failed to load partners overview:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToAllPartnersData(loadData);
    return unsubscribe;
  }, [loadData]);

  const selected = partners.find((p) => p.userId === selectedId) || null;

  const editMetric = async (
    field: "metric_active_collaborations" | "metric_internships_posted" | "metric_student_placements",
    value: string,
  ) => {
    if (!selected) return;
    await savePartnerProfileData(selected.userId, { [field]: Number(value) || 0 } as any);
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Loading partners…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every partner org's self-reported collaborations, internships, and shared resources - view here, or edit on their behalf if a partner needs help.
        </p>
      </div>

      {partners.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
          No partner accounts yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {partners.map((p) => (
              <button
                key={p.userId}
                onClick={() => setSelectedId(p.userId)}
                className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors ${
                  selectedId === p.userId ? "bg-orange-50" : ""
                }`}
              >
                <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                <p className="text-xs text-gray-500">{p.organization || p.email}</p>
                <div className="flex gap-3 mt-1 text-[11px] text-gray-400">
                  <span>{p.collaborations.length} collaborations</span>
                  <span>{p.resources.length} resources</span>
                </div>
              </button>
            ))}
          </div>

          <div className="md:col-span-2">
            {!selected ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                Select a partner to view their dashboard.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-1">{selected.name}</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    {selected.organization || selected.email}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <Handshake className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                      <input
                        type="number"
                        defaultValue={selected.profile?.metric_active_collaborations ?? 0}
                        onBlur={(e) => editMetric("metric_active_collaborations", e.target.value)}
                        className="w-full text-center text-lg font-bold bg-transparent"
                      />
                      <p className="text-[11px] text-gray-500">Active Collaborations</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <Briefcase className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                      <input
                        type="number"
                        defaultValue={selected.profile?.metric_internships_posted ?? 0}
                        onBlur={(e) => editMetric("metric_internships_posted", e.target.value)}
                        className="w-full text-center text-lg font-bold bg-transparent"
                      />
                      <p className="text-[11px] text-gray-500">Internships Posted</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <GraduationCap className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                      <input
                        type="number"
                        defaultValue={selected.profile?.metric_student_placements ?? 0}
                        onBlur={(e) => editMetric("metric_student_placements", e.target.value)}
                        className="w-full text-center text-lg font-bold bg-transparent"
                      />
                      <p className="text-[11px] text-gray-500">Student Placements</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">Programs</h4>
                  {selected.programs.length === 0 ? (
                    <p className="text-xs text-gray-400">Not enrolled in any program yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selected.programs.map((p) => (
                        <span
                          key={p.user_program_id}
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            p.approved
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {p.name}
                          {!p.approved && " (pending)"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h4 className="font-medium text-gray-900 text-sm">Collaborations</h4>
                    <button
                      onClick={() => setAddingCollab(!addingCollab)}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {addingCollab && (
                    <div className="px-4 py-3 border-b border-gray-100 space-y-2">
                      <select
                        value={newCollabProgramId}
                        onChange={(e) => setNewCollabProgramId(e.target.value)}
                        className="w-full border rounded-lg px-2 py-1 text-sm bg-orange-50"
                      >
                        <option value="">
                          {selected.programs.length === 0
                            ? "Partner has no programs yet"
                            : "Which program? (optional)"}
                        </option>
                        {selected.programs.map((p) => (
                          <option key={p.user_program_id} value={p.program_id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Title"
                          value={newCollabTitle}
                          onChange={(e) => setNewCollabTitle(e.target.value)}
                          className="flex-1 border rounded-lg px-2 py-1 text-sm"
                        />
                        <button
                          onClick={async () => {
                            if (!newCollabTitle.trim()) return;
                            await addPartnerCollaboration(selected.userId, {
                              title: newCollabTitle.trim(),
                              program_id: newCollabProgramId || undefined,
                            });
                            setNewCollabTitle("");
                            setNewCollabProgramId("");
                            setAddingCollab(false);
                          }}
                          className="px-3 py-1 bg-orange-600 text-white rounded-lg text-sm"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                  {selected.collaborations.length === 0 ? (
                    <p className="px-4 py-6 text-center text-gray-400 text-sm">No collaborations yet</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {selected.collaborations.map((c) => (
                        <div key={c.id} className="px-4 py-3 flex justify-between items-start gap-2">
                          <div>
                            {c.program_id && (
                              <span className="inline-block text-[11px] font-medium bg-orange-600 text-white px-2 py-0.5 rounded-full mb-1">
                                {selected.programs.find((p) => p.program_id === c.program_id)?.name || "Program"}
                              </span>
                            )}
                            <p className="text-sm font-medium text-gray-800">{c.title}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {c.project_type && (
                                <span className="text-[11px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                                  {c.project_type}
                                </span>
                              )}
                              {c.org_type && (
                                <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  {c.org_type}
                                </span>
                              )}
                              {c.hours_worked ? (
                                <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  {c.hours_worked} hrs
                                </span>
                              ) : null}
                              <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {c.status}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              await deletePartnerCollaboration(c.id);
                              loadData();
                            }}
                            className="text-gray-300 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h4 className="font-medium text-gray-900 text-sm">Shared Resources</h4>
                    <button
                      onClick={() => setAddingResource(!addingResource)}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {addingResource && (
                    <div className="px-4 py-3 border-b border-gray-100 flex gap-2">
                      <input
                        type="text"
                        placeholder="Title"
                        value={newResourceTitle}
                        onChange={(e) => setNewResourceTitle(e.target.value)}
                        className="flex-1 border rounded-lg px-2 py-1 text-sm"
                      />
                      <button
                        onClick={async () => {
                          if (!newResourceTitle.trim()) return;
                          await addPartnerResource(selected.userId, { title: newResourceTitle.trim() });
                          setNewResourceTitle("");
                          setAddingResource(false);
                        }}
                        className="px-3 py-1 bg-orange-600 text-white rounded-lg text-sm"
                      >
                        Add
                      </button>
                    </div>
                  )}
                  {selected.resources.length === 0 ? (
                    <p className="px-4 py-6 text-center text-gray-400 text-sm">No resources yet</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {selected.resources.map((r) => (
                        <div key={r.id} className="px-4 py-3 flex justify-between items-center">
                          <p className="text-sm font-medium text-gray-800">{r.title}</p>
                          <button
                            onClick={async () => {
                              await deletePartnerResource(r.id);
                              loadData();
                            }}
                            className="text-gray-300 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

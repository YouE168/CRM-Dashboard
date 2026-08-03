"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllCoalitionsOverview,
  subscribeToAllCoalitionsData,
  saveCoalitionProfileData,
  addCoalitionMeeting,
  deleteCoalitionMeeting,
  addCoalitionInitiative,
  updateCoalitionInitiative,
  deleteCoalitionInitiative,
  addCoalitionResource,
  deleteCoalitionResource,
  setProgramAccessByName,
  type CoalitionOverviewRow,
} from "@/lib/supabase/dashboard-data";
import {
  Users,
  Calendar,
  Target,
  Home,
  Trash2,
  Plus,
  ExternalLink,
  Check,
} from "lucide-react";

export function CoalitionsTab() {
  const [coalitions, setCoalitions] = useState<CoalitionOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingMeeting, setAddingMeeting] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState("");
  const [newMeetingDate, setNewMeetingDate] = useState("");
  const [addingInitiative, setAddingInitiative] = useState(false);
  const [newInitiativeTitle, setNewInitiativeTitle] = useState("");
  const [addingResource, setAddingResource] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceLink, setNewResourceLink] = useState("");
  const [togglingProgram, setTogglingProgram] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await getAllCoalitionsOverview();
      setCoalitions(data);
    } catch (err) {
      console.error("Failed to load coalitions overview:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToAllCoalitionsData(loadData);
    return unsubscribe;
  }, [loadData]);

  const selected = coalitions.find((c) => c.userId === selectedId) || null;

  const editMetric = async (
    field:
      | "metric_coalition_members"
      | "metric_meetings_held"
      | "metric_projects_initiated"
      | "metric_residents_impacted",
    value: string,
  ) => {
    if (!selected) return;
    await saveCoalitionProfileData(selected.userId, {
      [field]: Number(value) || 0,
    } as any);
  };

  // Lets Jody approve/revoke a coalition leader's program access right from
  // this chip, same pattern as the Partners tab.
  const toggleProgramAccess = async (programName: string, approved: boolean) => {
    if (!selected) return;
    setTogglingProgram(programName);
    try {
      await setProgramAccessByName(selected.userId, programName, !approved);
      await loadData();
    } catch (err) {
      console.error("Failed to update program access:", err);
    } finally {
      setTogglingProgram(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Loading coalitions…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coalitions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every coalition leader's self-reported meetings, initiatives, and
          shared resources - view here, or edit on their behalf if a
          coalition leader needs help.
        </p>
      </div>

      {coalitions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
          No coalition accounts yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {coalitions.map((c) => (
              <button
                key={c.userId}
                onClick={() => setSelectedId(c.userId)}
                className={`w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors ${
                  selectedId === c.userId ? "bg-purple-50" : ""
                }`}
              >
                <p className="font-medium text-gray-800 text-sm">{c.name}</p>
                <p className="text-xs text-gray-500">
                  {c.organization || c.email}
                </p>
                <div className="flex gap-3 mt-1 text-[11px] text-gray-400">
                  <span>{c.meetings.length} meetings</span>
                  <span>{c.initiatives.length} initiatives</span>
                  <span>{c.resources.length} resources</span>
                </div>
              </button>
            ))}
          </div>

          <div className="md:col-span-2">
            {!selected ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                Select a coalition to view their dashboard.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {selected.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    {selected.organization || selected.email}
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <Users className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                      <input
                        type="number"
                        defaultValue={
                          selected.profile?.metric_coalition_members ?? 0
                        }
                        onBlur={(e) =>
                          editMetric("metric_coalition_members", e.target.value)
                        }
                        className="w-full text-center text-lg font-bold bg-transparent"
                      />
                      <p className="text-[11px] text-gray-500">Members</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <Calendar className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                      <input
                        type="number"
                        defaultValue={
                          selected.profile?.metric_meetings_held ?? 0
                        }
                        onBlur={(e) =>
                          editMetric("metric_meetings_held", e.target.value)
                        }
                        className="w-full text-center text-lg font-bold bg-transparent"
                      />
                      <p className="text-[11px] text-gray-500">Meetings Held</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <Target className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                      <input
                        type="number"
                        defaultValue={
                          selected.profile?.metric_projects_initiated ?? 0
                        }
                        onBlur={(e) =>
                          editMetric(
                            "metric_projects_initiated",
                            e.target.value,
                          )
                        }
                        className="w-full text-center text-lg font-bold bg-transparent"
                      />
                      <p className="text-[11px] text-gray-500">
                        Projects Initiated
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <Home className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                      <input
                        type="number"
                        defaultValue={
                          selected.profile?.metric_residents_impacted ?? 0
                        }
                        onBlur={(e) =>
                          editMetric(
                            "metric_residents_impacted",
                            e.target.value,
                          )
                        }
                        className="w-full text-center text-lg font-bold bg-transparent"
                      />
                      <p className="text-[11px] text-gray-500">
                        Residents Impacted
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">
                    Programs
                  </h4>
                  <p className="text-[11px] text-gray-400 mb-2">
                    Click a program to approve or revoke access.
                  </p>
                  {selected.programs.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      Not enrolled in any program yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selected.programs.map((p) => {
                        // Business Professional Services is auto-approved
                        // for every account at signup - always show it as
                        // approved even if an older/invited account's
                        // user_programs row is missing that flag.
                        const isApproved =
                          p.approved ||
                          p.name === "Business Professional Services";
                        return (
                          <button
                            key={p.user_program_id}
                            onClick={() => toggleProgramAccess(p.name, p.approved)}
                            disabled={togglingProgram === p.name}
                            className={`text-[11px] px-2 py-0.5 rounded-full transition-colors disabled:opacity-50 inline-flex items-center gap-1 ${
                              isApproved
                                ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                                : "bg-yellow-100 text-yellow-700 hover:bg-green-100 hover:text-green-700"
                            }`}
                            title={
                              isApproved
                                ? "Click to revoke access"
                                : "Click to approve access"
                            }
                          >
                            {togglingProgram === p.name ? (
                              "…"
                            ) : (
                              <>
                                {isApproved && <Check className="h-3 w-3" />}
                                {p.name}
                                {!isApproved && " (pending)"}
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h4 className="font-medium text-gray-900 text-sm">
                      Upcoming Meetings
                    </h4>
                    <button
                      onClick={() => setAddingMeeting(!addingMeeting)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {addingMeeting && (
                    <div className="px-4 py-3 border-b border-gray-100 space-y-2">
                      <input
                        type="text"
                        placeholder="Meeting title"
                        value={newMeetingTitle}
                        onChange={(e) => setNewMeetingTitle(e.target.value)}
                        className="w-full border rounded-lg px-2 py-1 text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={newMeetingDate}
                          onChange={(e) => setNewMeetingDate(e.target.value)}
                          className="flex-1 border rounded-lg px-2 py-1 text-sm"
                        />
                        <button
                          onClick={async () => {
                            if (!newMeetingTitle.trim()) return;
                            await addCoalitionMeeting(selected.userId, {
                              title: newMeetingTitle.trim(),
                              date: newMeetingDate || undefined,
                            });
                            setNewMeetingTitle("");
                            setNewMeetingDate("");
                            setAddingMeeting(false);
                          }}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                  {selected.meetings.length === 0 ? (
                    <p className="px-4 py-6 text-center text-gray-400 text-sm">
                      No meetings yet
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {selected.meetings.map((m) => (
                        <div
                          key={m.id}
                          className="px-4 py-3 flex justify-between items-start gap-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {m.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {m.date
                                ? new Date(m.date).toLocaleDateString()
                                : "No date set"}
                              {m.time ? ` · ${m.time}` : ""}
                              {" · "}
                              {m.type === "virtual" ? "Virtual" : "In Person"}
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              await deleteCoalitionMeeting(m.id);
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
                    <h4 className="font-medium text-gray-900 text-sm">
                      Active Initiatives
                    </h4>
                    <button
                      onClick={() => setAddingInitiative(!addingInitiative)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {addingInitiative && (
                    <div className="px-4 py-3 border-b border-gray-100 space-y-2">
                      <input
                        type="text"
                        placeholder="Initiative title"
                        value={newInitiativeTitle}
                        onChange={(e) => setNewInitiativeTitle(e.target.value)}
                        className="w-full border rounded-lg px-2 py-1 text-sm"
                      />
                      <button
                        onClick={async () => {
                          if (!newInitiativeTitle.trim()) return;
                          await addCoalitionInitiative(selected.userId, {
                            title: newInitiativeTitle.trim(),
                          });
                          setNewInitiativeTitle("");
                          setAddingInitiative(false);
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm"
                      >
                        Add
                      </button>
                    </div>
                  )}
                  {selected.initiatives.length === 0 ? (
                    <p className="px-4 py-6 text-center text-gray-400 text-sm">
                      No initiatives yet
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {selected.initiatives.map((i) => (
                        <div
                          key={i.id}
                          className="px-4 py-3 flex justify-between items-start gap-2"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {i.title}
                            </p>
                            {i.description && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {i.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <select
                                value={i.status}
                                onChange={async (e) => {
                                  await updateCoalitionInitiative(i.id, {
                                    status: e.target.value,
                                  });
                                  loadData();
                                }}
                                className="text-[11px] border rounded px-1 py-0.5"
                              >
                                <option value="Proposed">Proposed</option>
                                <option value="Planning">Planning</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                              <span className="text-[11px] text-gray-400">
                                {i.progress}% complete
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              await deleteCoalitionInitiative(i.id);
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
                    <h4 className="font-medium text-gray-900 text-sm">
                      Coalition Resources
                    </h4>
                    <button
                      onClick={() => setAddingResource(!addingResource)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {addingResource && (
                    <div className="px-4 py-3 border-b border-gray-100 space-y-2">
                      <input
                        type="text"
                        placeholder="Title"
                        value={newResourceTitle}
                        onChange={(e) => setNewResourceTitle(e.target.value)}
                        className="w-full border rounded-lg px-2 py-1 text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Link URL (optional)"
                          value={newResourceLink}
                          onChange={(e) => setNewResourceLink(e.target.value)}
                          className="flex-1 border rounded-lg px-2 py-1 text-sm"
                        />
                        <button
                          onClick={async () => {
                            if (!newResourceTitle.trim()) return;
                            await addCoalitionResource(selected.userId, {
                              title: newResourceTitle.trim(),
                              link: newResourceLink.trim() || undefined,
                            });
                            setNewResourceTitle("");
                            setNewResourceLink("");
                            setAddingResource(false);
                          }}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                  {selected.resources.length === 0 ? (
                    <p className="px-4 py-6 text-center text-gray-400 text-sm">
                      No resources yet
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {selected.resources.map((r) => (
                        <div
                          key={r.id}
                          className="px-4 py-3 flex justify-between items-center"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {r.title}
                            </p>
                            {r.link && (
                              <a
                                href={r.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-0.5"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {r.link}
                              </a>
                            )}
                          </div>
                          <button
                            onClick={async () => {
                              await deleteCoalitionResource(r.id);
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

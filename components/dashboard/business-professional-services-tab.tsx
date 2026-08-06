"use client";

import { useState, useEffect, useCallback } from "react";
import { linkifyText } from "@/lib/linkify";
import {
  Users,
  UserCheck,
  Heart,
  Briefcase,
  MessageCircle,
  Send,
  X,
  Mail,
  Phone,
  Plus,
  Check,
  Trash2,
  ClipboardList,
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getAllCrmMembers,
  getCaseNotesForMember,
  addCaseNote,
  deleteCaseNote,
  subscribeToCaseNotes,
  getUpcomingCaseNotes,
  getMyPersonalNotes,
  addPersonalNote,
  togglePersonalNote,
  deletePersonalNote,
  subscribeToPersonalNotes,
  type CrmMemberRow,
  type CaseNoteRow,
  type PersonalNoteRow,
} from "@/lib/supabase/dashboard-data";
import { supabase } from "@/lib/supabase/client";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

const typeLabels: Record<string, string> = {
  mentee: "Mentee",
  entrepreneur: "Entrepreneur",
  partner: "Partner",
  coalition: "Coalition",
  mentor: "Mentor",
};

const typeBadge: Record<string, string> = {
  mentee: "bg-emerald-100 text-emerald-700",
  entrepreneur: "bg-blue-100 text-blue-700",
  partner: "bg-purple-100 text-purple-700",
  coalition: "bg-amber-100 text-amber-700",
  mentor: "bg-rose-100 text-rose-700",
};

const avatarColors = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  return p.length >= 2 ? p[0][0] + p[1][0] : p[0][0];
}

// Case notes + contact details for one member, regardless of what role
// they are - opened from the roster table below.
function MemberDetailModal({
  member,
  currentAuthorName,
  onClose,
}: {
  member: CrmMemberRow;
  currentAuthorName: string;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<CaseNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const data = await getCaseNotesForMember(member.id);
      setNotes(data);
    } catch (err) {
      console.error("Failed to load case notes:", err);
    } finally {
      setLoading(false);
    }
  }, [member.id]);

  useEffect(() => {
    loadNotes();
    const unsubscribe = subscribeToCaseNotes(loadNotes);
    return unsubscribe;
  }, [loadNotes]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await addCaseNote(
        member.member_type,
        member.id,
        member.name,
        newNote,
        currentAuthorName,
        {
          date: meetingDate,
          time: meetingTime,
          location: meetingLocation,
          link: meetingLink,
        },
      );
      setNewNote("");
      setMeetingDate("");
      setMeetingTime("");
      setMeetingLocation("");
      setMeetingLink("");
      setShowMeetingDetails(false);
      await loadNotes();
    } catch (err) {
      console.error("Failed to save case note:", err);
      alert("Couldn't save that note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDeleteNote = async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      await deleteCaseNote(pendingDeleteId);
      await loadNotes();
      setPendingDeleteId(null);
    } catch (err) {
      console.error("Failed to delete case note:", err);
      alert("Couldn't delete that note. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{member.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  typeBadge[member.member_type] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {typeLabels[member.member_type] ?? member.member_type}
              </span>
              {member.detail && (
                <span className="text-xs text-gray-400">{member.detail}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium">{member.email || "—"}</p>
                {member.email && (
                  <button
                    onClick={() => (window.location.href = `mailto:${member.email}`)}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    <Mail className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium">{member.phone || "—"}</p>
                {member.phone && (
                  <button
                    onClick={() => (window.location.href = `tel:${member.phone}`)}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    <Phone className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs capitalize">
                {member.status}
              </span>
            </div>
            {member.member_type === "mentor" ? (
              <>
                <div>
                  <p className="text-xs text-gray-400">Specialty</p>
                  <p className="text-sm font-medium">{member.detail || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Mentees</p>
                  <p className="text-sm font-medium">{member.menteeCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Entrepreneurs</p>
                  <p className="text-sm font-medium">
                    {member.entrepreneurCount ?? 0}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-gray-400">Assigned Mentor</p>
                  <p className="text-sm font-medium">
                    {member.mentor || "Not assigned"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Programs</p>
                  {member.programs.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {member.programs.map((p) => (
                        <span
                          key={p}
                          className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No approved programs yet
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-gray-900">Case Notes</h3>
            </div>

            <div className="flex gap-2 mb-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log a call, meeting, email, or any interaction with this member..."
                rows={2}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleAddNote}
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5 self-start"
              >
                <Send className="h-4 w-4" />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>

            <button
              onClick={() => setShowMeetingDetails(!showMeetingDetails)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 mb-3"
            >
              {showMeetingDetails ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              Add date, time, location, or link (optional)
            </button>

            {showMeetingDetails && (
              <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50 p-3 rounded-xl">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                    placeholder="e.g. RCP office"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Link</label>
                  <input
                    type="text"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="Zoom / meeting URL"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>
            )}

            {loading ? (
              <p className="text-sm text-gray-400">Loading notes…</p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-gray-400">No notes yet for this member.</p>
            ) : (
              <div className="space-y-2">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="group bg-gray-50 p-3 rounded-lg border border-gray-100"
                  >
                    {(n.meeting_date || n.meeting_time || n.meeting_location || n.meeting_link) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-xs text-emerald-700">
                        {n.meeting_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(n.meeting_date + "T00:00:00").toLocaleDateString()}
                          </span>
                        )}
                        {n.meeting_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {n.meeting_time}
                          </span>
                        )}
                        {n.meeting_location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {n.meeting_location}
                          </span>
                        )}
                        {n.meeting_link && (
                          <a
                            href={n.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline"
                          >
                            <LinkIcon className="h-3 w-3" />
                            Meeting link
                          </a>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {linkifyText(n.note)}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-gray-400">
                        {n.author || "Staff"} · {new Date(n.created_at).toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleDeleteNote(n.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <ConfirmationModal
          isOpen={pendingDeleteId !== null}
          title="Delete note"
          message="Delete this note? This can't be undone."
          confirmText={deleting ? "Deleting…" : "Delete"}
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDeleteNote}
          onCancel={() => setPendingDeleteId(null)}
        />
      </div>
    </div>
  );
}

// Private "note to myself" checklist - not tied to any member, just a
// running list of reminders/to-dos for whoever is logged in.
function PersonalReminders({ adminId }: { adminId: string }) {
  const [notes, setNotes] = useState<PersonalNoteRow[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const loadNotes = useCallback(async () => {
    try {
      const data = await getMyPersonalNotes(adminId);
      setNotes(data);
    } catch (err) {
      console.error("Failed to load personal reminders:", err);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    loadNotes();
    const unsubscribe = subscribeToPersonalNotes(adminId, loadNotes);
    return unsubscribe;
  }, [adminId, loadNotes]);

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    try {
      await addPersonalNote(adminId, newNote, {
        date: meetingDate,
        time: meetingTime,
        location: meetingLocation,
        link: meetingLink,
      });
      setNewNote("");
      setMeetingDate("");
      setMeetingTime("");
      setMeetingLocation("");
      setMeetingLink("");
      setShowMeetingDetails(false);
      await loadNotes();
    } catch (err) {
      console.error("Failed to add reminder:", err);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, completed } : n)));
    try {
      await togglePersonalNote(id, completed);
    } catch (err) {
      console.error("Failed to update reminder:", err);
      loadNotes();
    }
  };

  const handleDelete = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await deletePersonalNote(id);
    } catch (err) {
      console.error("Failed to delete reminder:", err);
      loadNotes();
    }
  };

  const visibleNotes = notes.filter((n) => showCompleted || !n.completed);
  const openCount = notes.filter((n) => !n.completed).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-900">
            My Reminders {openCount > 0 && `(${openCount})`}
          </h2>
        </div>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="text-xs text-gray-400 hover:text-emerald-600"
        >
          {showCompleted ? "Hide completed" : "Show completed"}
        </button>
      </div>

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="Add a reminder for yourself (e.g. 'Follow up with Lisa next week')..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button
        onClick={() => setShowMeetingDetails(!showMeetingDetails)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 mb-3"
      >
        {showMeetingDetails ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        Add date, time, location, or link (optional)
      </button>

      {showMeetingDetails && (
        <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50 p-3 rounded-xl">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Time</label>
            <input
              type="time"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Location</label>
            <input
              type="text"
              value={meetingLocation}
              onChange={(e) => setMeetingLocation(e.target.value)}
              placeholder="e.g. RCP office"
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Link</label>
            <input
              type="text"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="Zoom / meeting URL"
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : visibleNotes.length === 0 ? (
        <p className="text-sm text-gray-400">Nothing on your list right now.</p>
      ) : (
        <div className="space-y-1.5">
          {visibleNotes.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-2 px-3 py-2 bg-gray-50 rounded-lg group"
            >
              <button
                onClick={() => handleToggle(n.id, !n.completed)}
                className={`shrink-0 mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                  n.completed
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-gray-300 hover:border-emerald-400"
                }`}
              >
                {n.completed && <Check className="h-3 w-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm ${
                    n.completed ? "text-gray-400 line-through" : "text-gray-700"
                  }`}
                >
                  {n.note}
                </span>
                {(n.meeting_date ||
                  n.meeting_time ||
                  n.meeting_location ||
                  n.meeting_link) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-emerald-700">
                    {n.meeting_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(n.meeting_date + "T00:00:00").toLocaleDateString()}
                      </span>
                    )}
                    {n.meeting_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {n.meeting_time}
                      </span>
                    )}
                    {n.meeting_location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {n.meeting_location}
                      </span>
                    )}
                    {n.meeting_link && (
                      <a
                        href={n.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:underline"
                      >
                        <LinkIcon className="h-3 w-3" />
                        Link
                      </a>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(n.id)}
                title="Delete reminder"
                className="p-1.5 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all shrink-0 mt-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BusinessProfessionalServicesTab() {
  const [members, setMembers] = useState<CrmMemberRow[]>([]);
  const [upcoming, setUpcoming] = useState<CaseNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedMember, setSelectedMember] = useState<CrmMemberRow | null>(null);
  const [currentAuthorName, setCurrentAuthorName] = useState("Staff");
  const [adminId, setAdminId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [membersData, upcomingData] = await Promise.all([
        getAllCrmMembers(),
        getUpcomingCaseNotes(),
      ]);
      setMembers(membersData);
      setUpcoming(upcomingData);
    } catch (err) {
      console.error("Failed to load CRM members:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        setAdminId(authData.user.id);
        const { data: userRow } = await supabase
          .from("users")
          .select("name")
          .eq("id", authData.user.id)
          .maybeSingle();
        if (userRow?.name) setCurrentAuthorName(userRow.name);
      }
    };
    init();
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = subscribeToCaseNotes(loadData);
    return unsubscribe;
  }, [loadData]);

  const filtered = members.filter((m) => {
    if (typeFilter !== "All" && m.member_type !== typeFilter) return false;
    if (q && !m.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const counts = {
    total: members.length,
    mentors: members.filter((m) => m.member_type === "mentor").length,
    mentees: members.filter((m) =>
      ["mentee", "entrepreneur"].includes(m.member_type),
    ).length,
    orgs: members.filter((m) =>
      ["partner", "coalition"].includes(m.member_type),
    ).length,
  };

  // Note per Jody: every non-mentor member counts as one of "her
  // mentees" for the purposes of this card - mentors are the only role
  // excluded.
  const activeMentees = members.filter(
    (m) => m.member_type !== "mentor" && m.status === "active",
  );

  const scrollToAllMembers = () => {
    document
      .getElementById("bps-all-members")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-400">Loading members…</div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
          Business Professional Services
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Every CRM member and their case notes, in one place
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
              <p className="text-sm text-gray-500">Total Members</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{counts.mentees}</p>
              <p className="text-sm text-gray-500">Mentees & Entrepreneurs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Heart className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{counts.mentors}</p>
              <p className="text-sm text-gray-500">Mentors</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{counts.orgs}</p>
              <p className="text-sm text-gray-500">Partners & Coalitions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Mentees + Upcoming Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          onClick={scrollToAllMembers}
          className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">Your Mentees</h3>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                {activeMentees.length} active
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {activeMentees.length}
                </p>
                <p className="text-sm text-gray-500">Active Mentees</p>
                <p className="text-xs text-emerald-600 mt-1">View all →</p>
              </div>
              {activeMentees.length > 0 && (
                <div className="flex -space-x-2">
                  {activeMentees.slice(0, 3).map((m, idx) => {
                    const colors = [
                      { bg: "bg-emerald-100", text: "text-emerald-700" },
                      { bg: "bg-blue-100", text: "text-blue-700" },
                      { bg: "bg-purple-100", text: "text-purple-700" },
                    ][idx % 3];
                    return (
                      <div
                        key={`${m.member_type}-${m.id}`}
                        className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center text-xs font-bold ${colors.text} ring-2 ring-white`}
                      >
                        {initials(m.name)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">Upcoming Sessions</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {upcoming.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No upcoming sessions logged yet.
              </div>
            ) : (
              upcoming.map((note, idx) => {
                const colors = [
                  { bg: "bg-emerald-100", text: "text-emerald-600" },
                  { bg: "bg-purple-100", text: "text-purple-600" },
                ][idx % 2];

                const sessionDate = new Date(note.meeting_date + "T00:00:00");
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                let whenLabel = sessionDate.toLocaleDateString();
                if (sessionDate.getTime() === today.getTime()) {
                  whenLabel = "Today";
                } else if (sessionDate.getTime() === tomorrow.getTime()) {
                  whenLabel = "Tomorrow";
                }
                if (note.meeting_time) whenLabel += ` at ${note.meeting_time}`;

                const matchingMember = members.find(
                  (m) => m.id === note.member_id && m.member_type === note.member_type,
                );

                return (
                  <div className="p-4" key={note.id}>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}
                      >
                        <span className={`text-sm font-bold ${colors.text}`}>
                          {initials(note.member_name)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {note.member_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {whenLabel}
                          {note.meeting_location ? ` - ${note.meeting_location}` : ""}
                        </p>
                        {note.meeting_link && (
                          <a
                            href={note.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <LinkIcon className="h-3 w-3" />
                            Join link
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          matchingMember && setSelectedMember(matchingMember)
                        }
                        disabled={!matchingMember}
                        className="text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        Log Session →
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {adminId && <PersonalReminders adminId={adminId} />}

      {/* Search + Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search members by name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="All">All Types</option>
          <option value="mentee">Mentees</option>
          <option value="entrepreneur">Entrepreneurs</option>
          <option value="mentor">Mentors</option>
          <option value="partner">Partners</option>
          <option value="coalition">Coalitions</option>
        </select>
      </div>

      {/* Members List */}
      <div id="bps-all-members" className="space-y-4 scroll-mt-6">
        <h2 className="text-lg font-semibold text-gray-900">All Members</h2>
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No members found</p>
          </div>
        ) : (
          filtered.map((m, idx) => (
            <div
              key={`${m.member_type}-${m.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedMember(m)}
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold shrink-0 ${avatarColors[idx % avatarColors.length]}`}
                  >
                    {initials(m.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{m.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          typeBadge[m.member_type] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {typeLabels[m.member_type] ?? m.member_type}
                      </span>
                      {m.member_type === "mentor"
                        ? m.detail && (
                            <span className="text-sm text-gray-500">{m.detail}</span>
                          )
                        : m.programs.length > 0 && (
                            <span className="text-sm text-gray-500">
                              {m.programs.join(", ")}
                            </span>
                          )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {m.email && (
                        <span className="text-xs text-emerald-600">{m.email}</span>
                      )}
                      {m.phone && (
                        <span className="text-xs text-gray-400">{m.phone}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                    {m.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMember(m);
                    }}
                    className="px-3 py-1.5 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Tips */}
      <div className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-full">
              <MessageCircle className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Quick Tips</h3>
              <p className="text-sm text-gray-600">
                Click on any member to log a call, email, or meeting
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            💡 Case notes help you pick up right where you left off
          </div>
        </div>
      </div>

      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          currentAuthorName={currentAuthorName}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </>
  );
}

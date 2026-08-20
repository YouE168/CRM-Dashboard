"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  History,
  NotebookPen,
  UserPlus,
  Bell,
} from "lucide-react";
import {
  getAllCrmMembers,
  setCrmMemberStatus,
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
  getMyNotepadEntries,
  addNotepadEntry,
  deleteNotepadEntry,
  subscribeToNotepad,
  getAllBusinesses,
  addBusiness,
  deleteBusiness,
  addBusinessContact,
  deleteBusinessContact,
  markBusinessContactInvited,
  addBusinessReferral,
  updateBusinessReferral,
  deleteBusinessReferral,
  subscribeToBusinesses,
  getAllPrograms,
  type CrmMemberRow,
  type CaseNoteRow,
  type PersonalNoteRow,
  type NotepadRow,
  type BusinessWithDetails,
  type BusinessContactRow,
  type BusinessReferralRow,
  type ProgramRow,
} from "@/lib/supabase/dashboard-data";
import { supabase } from "@/lib/supabase/client";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { getProgramsForRole, getDefaultProgramsForRole, ROLE_PROGRAM_OPTIONS } from "@/lib/role-programs";

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
  onChanged,
}: {
  member: CrmMemberRow;
  currentAuthorName: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [notes, setNotes] = useState<CaseNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const isActive = member.status?.toLowerCase() !== "inactive";
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

  const confirmStatusChange = async () => {
    setStatusChanging(true);
    try {
      await setCrmMemberStatus(member.member_type, member.id, isActive ? "inactive" : "active");
      setPendingStatusChange(false);
      onClose();
      onChanged();
    } catch (err) {
      console.error("Failed to change member status:", err);
      alert("Couldn't update that member. Please try again.");
    } finally {
      setStatusChanging(false);
    }
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const upcomingNotes = notes.filter(
    (n) =>
      n.meeting_date && new Date(n.meeting_date + "T00:00:00") >= todayStart,
  );
  const historyNotes = notes.filter(
    (n) =>
      !n.meeting_date || new Date(n.meeting_date + "T00:00:00") < todayStart,
  );

  const renderNoteCard = (n: CaseNoteRow) => (
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
  );

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
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPendingStatusChange(true)}
              className={`p-2 rounded-xl transition-colors ${
                isActive
                  ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                  : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
              }`}
              title={isActive ? "Deactivate member" : "Reactivate member"}
            >
              {isActive ? (
                <Trash2 className="h-4 w-4" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <X className="h-5 w-5" />
            </button>
          </div>
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
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-600 mb-3"
            >
              {showMeetingDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
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
              <>
                {upcomingNotes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                      Upcoming
                    </p>
                    <div className="space-y-2">
                      {upcomingNotes.map((n) => renderNoteCard(n))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1.5 mb-2">
                  <History className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Session History
                  </p>
                </div>
                {historyNotes.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No past sessions logged yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {historyNotes.map((n) => renderNoteCard(n))}
                  </div>
                )}
              </>
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
        <ConfirmationModal
          isOpen={pendingStatusChange}
          title={isActive ? "Deactivate member" : "Reactivate member"}
          message={
            isActive
              ? `Deactivate ${member.name}? They'll be marked inactive and dropped from the active roster. Their login, programs, and case note history stay intact, and you can reactivate them anytime.`
              : `Reactivate ${member.name}? They'll show as active again.`
          }
          confirmText={
            statusChanging ? "Saving…" : isActive ? "Deactivate" : "Reactivate"
          }
          cancelText="Cancel"
          type={isActive ? "danger" : "info"}
          onConfirm={confirmStatusChange}
          onCancel={() => setPendingStatusChange(false)}
        />
      </div>
    </div>
  );
}

const REFERRAL_STATUSES: { value: string; label: string; color: string }[] = [
  { value: "referred", label: "Referred", color: "bg-gray-100 text-gray-700" },
  { value: "applied", label: "Applied", color: "bg-blue-100 text-blue-700" },
  { value: "enrolled", label: "Enrolled", color: "bg-purple-100 text-purple-700" },
  { value: "completed", label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  { value: "not_selected", label: "Not Selected", color: "bg-red-100 text-red-700" },
];

// Add a business as a lead/client (no login account) with one or more
// contacts attached - the "Greg and Betti Jo's business" example Jody
// asked for.
function AddBusinessModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [contacts, setContacts] = useState([{ name: "", email: "", phone: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateContact = (idx: number, field: "name" | "email" | "phone", value: string) => {
    setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };
  const addContactRow = () =>
    setContacts((prev) => [...prev, { name: "", email: "", phone: "" }]);
  const removeContactRow = (idx: number) =>
    setContacts((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Business name is required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const createdBy = authData.user?.id;
      if (!createdBy) throw new Error("Not signed in");
      const id = await addBusiness(name, industry || null, createdBy, contacts);
      onCreated(id);
    } catch (err) {
      console.error("Failed to add business:", err);
      setError("Couldn't save that business. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Add Business</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Business Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Walters Woodworks"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Industry (optional)</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Retail"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Contacts (people connected to this business)
            </label>
            <div className="space-y-2">
              {contacts.map((c, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 bg-gray-50 p-2 rounded-lg">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateContact(idx, "name", e.target.value)}
                    placeholder="Name"
                    className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <input
                    type="email"
                    value={c.email}
                    onChange={(e) => updateContact(idx, "email", e.target.value)}
                    placeholder="Email"
                    className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={c.phone}
                      onChange={(e) => updateContact(idx, "phone", e.target.value)}
                      placeholder="Phone"
                      className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    {contacts.length > 1 && (
                      <button
                        onClick={() => removeContactRow(idx)}
                        className="text-gray-300 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addContactRow}
              className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add another contact
            </button>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white p-5 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create Business"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Contacts, referrals (program + status + dates), and meeting notes for
// one business - meeting notes reuse case_notes (member_type =
// "business") so they share the exact same composer/history pattern as
// MemberDetailModal above, and automatically feed the "Upcoming
// Sessions" card too.
function BusinessDetailModal({
  business,
  currentAuthorName,
  adminId,
  onClose,
  onChanged,
}: {
  business: BusinessWithDetails;
  currentAuthorName: string;
  adminId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [contacts, setContacts] = useState<BusinessContactRow[]>(business.contacts);
  const [referrals, setReferrals] = useState<BusinessReferralRow[]>(business.referrals);
  const [notes, setNotes] = useState<CaseNoteRow[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [pendingDeleteContactId, setPendingDeleteContactId] = useState<string | null>(null);
  const [inviteRoleByContact, setInviteRoleByContact] = useState<Record<string, string>>({});
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);

  const [showAddReferral, setShowAddReferral] = useState(false);
  const [referralProgramId, setReferralProgramId] = useState("");
  const [referralFollowUp, setReferralFollowUp] = useState("");
  const [referralNotes, setReferralNotes] = useState("");
  const [pendingDeleteReferralId, setPendingDeleteReferralId] = useState<string | null>(null);

  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [pendingDeleteNoteId, setPendingDeleteNoteId] = useState<string | null>(null);
  const [deletingNote, setDeletingNote] = useState(false);
  const [pendingDeleteBusiness, setPendingDeleteBusiness] = useState(false);
  const [deletingBusiness, setDeletingBusiness] = useState(false);

  // Keep contacts/referrals in sync with the latest business prop - the
  // parent re-fetches and passes a fresh object whenever the list
  // changes (including when this same modal is closed and reopened
  // later), but useState's initial value only applies on first mount,
  // so without this a reopened modal could show stale contacts/
  // referrals from whenever it was first opened.
  useEffect(() => {
    setContacts(business.contacts);
    setReferrals(business.referrals);
  }, [business]);

  const refreshBusinessData = useCallback(async () => {
    try {
      const all = await getAllBusinesses();
      const fresh = all.find((b) => b.id === business.id);
      if (fresh) {
        setContacts(fresh.contacts);
        setReferrals(fresh.referrals);
      }
    } catch (err) {
      console.error("Failed to refresh business:", err);
    }
  }, [business.id]);

  const confirmDeleteBusiness = async () => {
    setDeletingBusiness(true);
    try {
      await deleteBusiness(business.id);
      setPendingDeleteBusiness(false);
      onClose();
      onChanged();
    } catch (err) {
      console.error("Failed to delete business:", err);
      alert("Couldn't delete that business. Please try again.");
    } finally {
      setDeletingBusiness(false);
    }
  };

  const loadNotes = useCallback(async () => {
    try {
      const data = await getCaseNotesForMember(business.id);
      setNotes(data);
    } catch (err) {
      console.error("Failed to load business notes:", err);
    } finally {
      setLoadingNotes(false);
    }
  }, [business.id]);

  useEffect(() => {
    loadNotes();
    const unsubscribe = subscribeToCaseNotes(loadNotes);
    return unsubscribe;
  }, [loadNotes]);

  useEffect(() => {
    getAllPrograms()
      .then(setPrograms)
      .catch((err) => console.error("Failed to load programs:", err));
  }, []);

  const handleAddContact = async () => {
    if (!contactName.trim()) return;
    try {
      await addBusinessContact(business.id, {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        role_title: contactRole,
      });
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactRole("");
      setShowAddContact(false);
      await refreshBusinessData();
      onChanged();
    } catch (err) {
      console.error("Failed to add contact:", err);
      alert("Couldn't add that contact. Please try again.");
    }
  };

  const confirmDeleteContact = async () => {
    if (!pendingDeleteContactId) return;
    try {
      await deleteBusinessContact(pendingDeleteContactId);
      setPendingDeleteContactId(null);
      await refreshBusinessData();
      onChanged();
    } catch (err) {
      console.error("Failed to delete contact:", err);
      alert("Couldn't delete that contact. Please try again.");
    }
  };

  const handleSendInvite = async (contact: BusinessContactRow) => {
    if (!contact.email) {
      alert("This contact doesn't have an email on file.");
      return;
    }
    const role = inviteRoleByContact[contact.id];
    if (!role) {
      alert("Pick an account type first.");
      return;
    }
    setSendingInviteId(contact.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const params = new URLSearchParams({
        inviteRole: role,
        email: contact.email,
        name: contact.name,
        business: business.name,
        contactId: contact.id,
      });
      const actionLink = `${window.location.origin}/signup?${params.toString()}`;

      const res = await fetch("/api/business/send-signup-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: contact.email,
          name: contact.name,
          businessName: business.name,
          actionLink,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to send invite");
      }
      await markBusinessContactInvited(contact.id);
      await refreshBusinessData();
      onChanged();
    } catch (err) {
      console.error("Failed to send signup invite:", err);
      alert("Couldn't send that invite. Please try again.");
    } finally {
      setSendingInviteId(null);
    }
  };

  const handleAddReferral = async () => {
    const program = programs.find((p) => p.id === referralProgramId);
    if (!program) {
      alert("Pick a program first.");
      return;
    }
    try {
      await addBusinessReferral(business.id, program.id, program.name, adminId, {
        followUpDate: referralFollowUp || undefined,
        notes: referralNotes || undefined,
      });
      setReferralProgramId("");
      setReferralFollowUp("");
      setReferralNotes("");
      setShowAddReferral(false);
      await refreshBusinessData();
      onChanged();
    } catch (err) {
      console.error("Failed to add referral:", err);
      alert("Couldn't add that referral. Please try again.");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateBusinessReferral(id, { status });
      await refreshBusinessData();
      onChanged();
    } catch (err) {
      console.error("Failed to update referral status:", err);
      alert("Couldn't update that referral. Please try again.");
    }
  };

  const confirmDeleteReferral = async () => {
    if (!pendingDeleteReferralId) return;
    try {
      await deleteBusinessReferral(pendingDeleteReferralId);
      setPendingDeleteReferralId(null);
      await refreshBusinessData();
      onChanged();
    } catch (err) {
      console.error("Failed to delete referral:", err);
      alert("Couldn't delete that referral. Please try again.");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await addCaseNote("business", business.id, business.name, newNote, currentAuthorName, {
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
      console.error("Failed to save business note:", err);
      alert("Couldn't save that note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteNote = async () => {
    if (!pendingDeleteNoteId) return;
    setDeletingNote(true);
    try {
      await deleteCaseNote(pendingDeleteNoteId);
      await loadNotes();
      setPendingDeleteNoteId(null);
    } catch (err) {
      console.error("Failed to delete business note:", err);
      alert("Couldn't delete that note. Please try again.");
    } finally {
      setDeletingNote(false);
    }
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const upcomingNotes = notes.filter(
    (n) => n.meeting_date && new Date(n.meeting_date + "T00:00:00") >= todayStart,
  );
  const historyNotes = notes.filter(
    (n) => !n.meeting_date || new Date(n.meeting_date + "T00:00:00") < todayStart,
  );

  const renderNoteCard = (n: CaseNoteRow) => (
    <div key={n.id} className="group bg-gray-50 p-3 rounded-lg border border-gray-100">
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
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{linkifyText(n.note)}</p>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-xs text-gray-400">
          {n.author || "Staff"} · {new Date(n.created_at).toLocaleString()}
        </p>
        <button
          onClick={() => setPendingDeleteNoteId(n.id)}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all"
          title="Delete note"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Delete</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{business.name}</h2>
            {business.industry && (
              <p className="text-xs text-gray-400 mt-1">{business.industry}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPendingDeleteBusiness(true)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Delete business"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">Contacts</h3>
              </div>
              <button
                onClick={() => setShowAddContact(!showAddContact)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Contact
              </button>
            </div>

            {showAddContact && (
              <div className="grid grid-cols-2 gap-2 mb-3 bg-gray-50 p-3 rounded-xl">
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Name"
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <input
                  type="text"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  placeholder="Role (e.g. Owner)"
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Email"
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Phone"
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={handleAddContact}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700"
                  >
                    Save Contact
                  </button>
                </div>
              </div>
            )}

            {contacts.length === 0 ? (
              <p className="text-sm text-gray-400">No contacts yet.</p>
            ) : (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="group bg-gray-50 p-3 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {c.name}
                          {c.role_title ? ` · ${c.role_title}` : ""}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {c.email && (
                            <span className="text-xs text-emerald-600">{c.email}</span>
                          )}
                          {c.phone && (
                            <span className="text-xs text-gray-400">{c.phone}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setPendingDeleteContactId(c.id)}
                        className="p-1.5 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Remove contact"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 flex-wrap">
                        {c.user_id ? (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            Account created
                          </span>
                        ) : (
                          <>
                            <select
                              value={inviteRoleByContact[c.id] || ""}
                              onChange={(e) =>
                                setInviteRoleByContact((prev) => ({
                                  ...prev,
                                  [c.id]: e.target.value,
                                }))
                              }
                              className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            >
                              <option value="">Account type…</option>
                              {ROLE_PROGRAM_OPTIONS.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleSendInvite(c)}
                              disabled={sendingInviteId === c.id}
                              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                            >
                              {sendingInviteId === c.id
                                ? "Sending…"
                                : c.invited_at
                                  ? "Resend Invite"
                                  : "Send Invite"}
                            </button>
                            {c.invited_at && (
                              <span className="text-xs text-gray-400">
                                Invited {new Date(c.invited_at).toLocaleDateString()}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Referrals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Program Referrals</h3>
              </div>
              <button
                onClick={() => setShowAddReferral(!showAddReferral)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Referral
              </button>
            </div>

            {showAddReferral && (
              <div className="space-y-2 mb-3 bg-gray-50 p-3 rounded-xl">
                <select
                  value={referralProgramId}
                  onChange={(e) => setReferralProgramId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                >
                  <option value="">Select a program…</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Follow-up date (optional)
                  </label>
                  <input
                    type="date"
                    value={referralFollowUp}
                    onChange={(e) => setReferralFollowUp(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <textarea
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddReferral}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700"
                  >
                    Save Referral
                  </button>
                </div>
              </div>
            )}

            {referrals.length === 0 ? (
              <p className="text-sm text-gray-400">No referrals logged yet.</p>
            ) : (
              <div className="space-y-2">
                {referrals.map((r) => {
                  const statusMeta =
                    REFERRAL_STATUSES.find((s) => s.value === r.status) ?? REFERRAL_STATUSES[0];
                  return (
                    <div
                      key={r.id}
                      className="group bg-gray-50 p-3 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{r.program_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Referred{" "}
                            {new Date(r.referred_date + "T00:00:00").toLocaleDateString()}
                            {r.follow_up_date && (
                              <>
                                {" "}
                                · Follow up{" "}
                                {new Date(r.follow_up_date + "T00:00:00").toLocaleDateString()}
                              </>
                            )}
                          </p>
                          {r.notes && (
                            <p className="text-xs text-gray-500 mt-1">
                              {linkifyText(r.notes)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={r.status}
                            onChange={(e) => handleStatusChange(r.id, e.target.value)}
                            className={`text-xs font-medium rounded-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${statusMeta.color}`}
                          >
                            {REFERRAL_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setPendingDeleteReferralId(r.id)}
                            className="p-1 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Delete referral"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Meeting notes - shared case_notes pattern */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-gray-900">Meeting Notes</h3>
            </div>

            <div className="flex gap-2 mb-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log a call, meeting, goals, homework, or progress..."
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
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-600 mb-3"
            >
              {showMeetingDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
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

            {loadingNotes ? (
              <p className="text-sm text-gray-400">Loading notes…</p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-gray-400">No notes yet for this business.</p>
            ) : (
              <>
                {upcomingNotes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                      Upcoming
                    </p>
                    <div className="space-y-2">{upcomingNotes.map((n) => renderNoteCard(n))}</div>
                  </div>
                )}
                <div className="flex items-center gap-1.5 mb-2">
                  <History className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    History
                  </p>
                </div>
                {historyNotes.length === 0 ? (
                  <p className="text-sm text-gray-400">No past notes logged yet.</p>
                ) : (
                  <div className="space-y-2">{historyNotes.map((n) => renderNoteCard(n))}</div>
                )}
              </>
            )}
          </div>
        </div>

        <ConfirmationModal
          isOpen={pendingDeleteNoteId !== null}
          title="Delete note"
          message="Delete this note? This can't be undone."
          confirmText={deletingNote ? "Deleting…" : "Delete"}
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDeleteNote}
          onCancel={() => setPendingDeleteNoteId(null)}
        />
        <ConfirmationModal
          isOpen={pendingDeleteContactId !== null}
          title="Remove contact"
          message="Remove this contact from the business? This can't be undone."
          confirmText="Remove"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDeleteContact}
          onCancel={() => setPendingDeleteContactId(null)}
        />
        <ConfirmationModal
          isOpen={pendingDeleteReferralId !== null}
          title="Delete referral"
          message="Delete this referral? This can't be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDeleteReferral}
          onCancel={() => setPendingDeleteReferralId(null)}
        />
        <ConfirmationModal
          isOpen={pendingDeleteBusiness}
          title="Delete business"
          message={`Delete ${business.name}? This removes all of its contacts, referrals, and meeting notes. This can't be undone.`}
          confirmText={deletingBusiness ? "Deleting…" : "Delete"}
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDeleteBusiness}
          onCancel={() => setPendingDeleteBusiness(false)}
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
  const [noteError, setNoteError] = useState("");
  const noteInputRef = useRef<HTMLInputElement>(null);

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
    if (!newNote.trim()) {
      setNoteError("Type a reminder above first.");
      noteInputRef.current?.focus();
      return;
    }
    setNoteError("");
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
      setNoteError("Couldn't save that reminder. Please try again.");
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

      <div className="flex gap-2 mb-1">
        <input
          ref={noteInputRef}
          type="text"
          value={newNote}
          onChange={(e) => {
            setNewNote(e.target.value);
            if (noteError) setNoteError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="Add a reminder for yourself (e.g. 'Follow up with Lisa next week')..."
          className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            noteError
              ? "border-red-300 focus:ring-red-400"
              : "border-gray-200 focus:ring-emerald-400"
          }`}
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
      {noteError && <p className="text-xs text-red-600 mb-2">{noteError}</p>}

      <button
        onClick={() => setShowMeetingDetails(!showMeetingDetails)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-600 mb-3"
      >
        {showMeetingDetails ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        Add date, time, location, or link (optional)
      </button>

      {showMeetingDetails && (
        <div className="mb-4 bg-gray-50 p-3 rounded-xl">
          <div className="grid grid-cols-2 gap-2">
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
              <label className="block text-xs text-gray-400 mb-1">
                Location <span className="text-gray-300">(optional)</span>
              </label>
              <input
                type="text"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder="e.g. RCP office"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Link <span className="text-gray-300">(optional)</span>
              </label>
              <input
                type="text"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="Zoom / meeting URL"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-3">
            {noteError && <p className="text-xs text-red-600">{noteError}</p>}
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Done
            </button>
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

// Private notepad - not tied to any member, not a checklist. Jody (or
// whoever's logged in) can save as many free-form notes here as she
// wants, each independently deletable. Any URL pasted into a note is
// rendered as a clickable link via linkifyText, so a pasted meeting/doc
// link can be opened directly from the note instead of being copy-pasted
// elsewhere. Private via RLS, same as the reminder checklist above.
const NOTEPAD_PREVIEW_COUNT = 3;

function MyNotepad({ adminId }: { adminId: string }) {
  const [entries, setEntries] = useState<NotepadRow[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingNote, setViewingNote] = useState<NotepadRow | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMyNotepadEntries(adminId);
      setEntries(data);
    } catch (err) {
      console.error("Failed to load notepad:", err);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToNotepad(adminId, load);
    return unsubscribe;
  }, [adminId, load]);

  const handleAdd = async () => {
    if (!newSubject.trim() || !newContent.trim()) return;
    setSaving(true);
    try {
      await addNotepadEntry(adminId, newSubject, newContent);
      setNewSubject("");
      setNewContent("");
      await load();
    } catch (err) {
      console.error("Failed to save note:", err);
      alert("Couldn't save that note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      await deleteNotepadEntry(pendingDeleteId);
      await load();
      setPendingDeleteId(null);
    } catch (err) {
      console.error("Failed to delete note:", err);
      alert("Couldn't delete that note. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const renderNoteEntry = (n: NotepadRow) => (
    <div
      key={n.id}
      onClick={() => setViewingNote(n)}
      className="group bg-gray-50 p-3 rounded-lg border border-gray-100 cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors"
    >
      <p className="text-sm font-semibold text-gray-900">
        {n.subject || "(No subject)"}
      </p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap mt-0.5 line-clamp-3">
        {linkifyText(n.content)}
      </p>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-xs text-gray-400">
          {new Date(n.created_at).toLocaleString()}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPendingDeleteId(n.id);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all"
          title="Delete note"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Delete</span>
        </button>
      </div>
    </div>
  );

  const previewEntries = entries.slice(0, NOTEPAD_PREVIEW_COUNT);
  const filteredEntries = entries.filter((n) =>
    (n.subject || "(No subject)").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <NotebookPen className="h-5 w-5 text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-900">
            My Notepad {entries.length > 0 && `(${entries.length})`}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {entries.length > NOTEPAD_PREVIEW_COUNT && (
            <button
              onClick={() => setShowAllNotes(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View all →
            </button>
          )}
          <span className="text-xs text-gray-400">Private to you</span>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          placeholder="Subject"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 mb-2"
        />
        <div className="flex gap-2">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Jot down anything you want to remember - paste a link and it'll be clickable once saved..."
            rows={3}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-y"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newSubject.trim() || !newContent.trim()}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 self-start whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            {saving ? "Saving…" : "Save Note"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-400">No notes yet.</p>
      ) : (
        <div className="space-y-2">{previewEntries.map(renderNoteEntry)}</div>
      )}

      {showAllNotes && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowAllNotes(false);
              setSearchQuery("");
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <NotebookPen className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-gray-900">
                  All Notes ({entries.length})
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAllNotes(false);
                  setSearchQuery("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by subject…"
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div className="p-4 overflow-y-auto space-y-2">
              {filteredEntries.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No notes match "{searchQuery}".
                </p>
              ) : (
                filteredEntries.map(renderNoteEntry)
              )}
            </div>
          </div>
        </div>
      )}

      {viewingNote && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setViewingNote(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {viewingNote.subject || "(No subject)"}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(viewingNote.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setViewingNote(null)}
                className="text-gray-400 hover:text-gray-600 shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {linkifyText(viewingNote.content)}
              </p>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setPendingDeleteId(viewingNote.id);
                  setViewingNote(null);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={pendingDeleteId !== null}
        title="Delete note"
        message="Delete this note? This can't be undone."
        confirmText={deleting ? "Deleting…" : "Delete"}
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

// Lets an admin/staff user add a brand-new person straight to the CRM
// instead of waiting for them to sign up themselves - creates a real
// login (invite email to set a password), same as approving an access
// request. On success, the caller refreshes the roster and opens the
// new member's detail modal so a first case note can be logged right
// away.
function AddMemberModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string, memberType: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [memberType, setMemberType] = useState("mentee");
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(
    getDefaultProgramsForRole("mentee"),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleMemberTypeChange = (value: string) => {
    setMemberType(value);
    setSelectedPrograms(getDefaultProgramsForRole(value));
  };

  const toggleProgram = (programName: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(programName)
        ? prev.filter((p) => p !== programName)
        : [...prev, programName],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Your session expired. Please log in again.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/add-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          memberType,
          programs: memberType === "mentor" ? [] : selectedPrograms,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.error || "Couldn't add this member. Please try again.");
        setSaving(false);
        return;
      }
      if (!result.emailSent) {
        alert(
          `${name} was added, but the invite email couldn't be sent. They'll need a password-reset link to log in - try "Forgot password" on the login page with ${email}.`,
        );
      }
      onCreated(result.member.id, result.member.member_type);
    } catch (err) {
      console.error("Failed to add member:", err);
      setError("Couldn't add this member. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Add New Member</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-500">
            This creates a real account and emails them a link to set their
            password - same as approving an access request.
          </p>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Member Type *</label>
            <select
              value={memberType}
              onChange={(e) => handleMemberTypeChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="mentee">Mentee</option>
              <option value="entrepreneur">Entrepreneur</option>
              <option value="partner">Partner</option>
              <option value="coalition">Coalition</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>

          {memberType === "mentor" ? (
            <p className="text-xs text-gray-400">
              Mentors are staff, not program clients, so they don't have
              program access to choose.
            </p>
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-2">
                Programs for this {typeLabels[memberType] ?? memberType}
              </label>
              <div className="space-y-1.5 border border-gray-200 rounded-lg p-3">
                {getProgramsForRole(memberType).map((programName) => (
                  <label
                    key={programName}
                    className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPrograms.includes(programName)}
                      onChange={() => toggleProgram(programName)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-400"
                    />
                    {programName}
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !email.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Adding…" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// "Upcoming Sessions" shows two different kinds of things side by side:
// scheduled case_notes (tied to a member) and My Reminders entries that
// have a date attached (private to the admin, not tied to a member).
// Merged and sorted together by date/time so Jody sees everything
// coming up in one place.
type UpcomingEntry =
  | {
      kind: "session";
      id: string;
      date: string;
      time: string | null;
      location: string | null;
      link: string | null;
      sortKey: string;
      session: CaseNoteRow;
    }
  | {
      kind: "reminder";
      id: string;
      date: string;
      time: string | null;
      location: string | null;
      link: string | null;
      sortKey: string;
      reminder: PersonalNoteRow;
    };

export function BusinessProfessionalServicesTab() {
  const [members, setMembers] = useState<CrmMemberRow[]>([]);
  const [upcoming, setUpcoming] = useState<CaseNoteRow[]>([]);
  const [personalReminders, setPersonalReminders] = useState<PersonalNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedMember, setSelectedMember] = useState<CrmMemberRow | null>(null);
  const [currentAuthorName, setCurrentAuthorName] = useState("Staff");
  const [adminId, setAdminId] = useState<string | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [rosterTab, setRosterTab] = useState<"members" | "businesses">("members");
  const [businesses, setBusinesses] = useState<BusinessWithDetails[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessWithDetails | null>(null);
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [businessQ, setBusinessQ] = useState("");

  const loadBusinesses = useCallback(async () => {
    try {
      const data = await getAllBusinesses();
      setBusinesses(data);
    } catch (err) {
      console.error("Failed to load businesses:", err);
    } finally {
      setBusinessesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBusinesses();
    const unsubscribe = subscribeToBusinesses(loadBusinesses);
    return unsubscribe;
  }, [loadBusinesses]);

  // Keep the open business detail modal in sync with the live list -
  // e.g. after adding a referral, the modal's own local state already
  // updates itself, but this also keeps it correct if the change came
  // from realtime (another tab/device).
  useEffect(() => {
    if (!selectedBusiness) return;
    const fresh = businesses.find((b) => b.id === selectedBusiness.id);
    if (fresh && fresh !== selectedBusiness) setSelectedBusiness(fresh);
  }, [businesses, selectedBusiness]);

  const loadData = useCallback(async () => {
    try {
      const [membersData, upcomingData] = await Promise.all([
        getAllCrmMembers(),
        getUpcomingCaseNotes(50),
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

  useEffect(() => {
    if (!adminId) return;
    const loadReminders = async () => {
      try {
        const data = await getMyPersonalNotes(adminId);
        setPersonalReminders(data);
      } catch (err) {
        console.error("Failed to load personal reminders:", err);
      }
    };
    loadReminders();
    const unsubscribe = subscribeToPersonalNotes(adminId, loadReminders);
    return unsubscribe;
  }, [adminId]);

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

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingEntries: UpcomingEntry[] = [
    ...upcoming.map((n) => ({
      kind: "session" as const,
      id: `session-${n.id}`,
      date: n.meeting_date as string,
      time: n.meeting_time,
      location: n.meeting_location,
      link: n.meeting_link,
      sortKey: `${n.meeting_date}T${n.meeting_time || "00:00"}`,
      session: n,
    })),
    ...personalReminders
      .filter((n) => n.meeting_date && n.meeting_date >= todayStr && !n.completed)
      .map((n) => ({
        kind: "reminder" as const,
        id: `reminder-${n.id}`,
        date: n.meeting_date as string,
        time: n.meeting_time,
        location: n.meeting_location,
        link: n.meeting_link,
        sortKey: `${n.meeting_date}T${n.meeting_time || "00:00"}`,
        reminder: n,
      })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const renderUpcomingEntry = (entry: UpcomingEntry, idx: number) => {
    const colors = [
      { bg: "bg-emerald-100", text: "text-emerald-600" },
      { bg: "bg-purple-100", text: "text-purple-600" },
    ][idx % 2];

    const sessionDate = new Date(entry.date + "T00:00:00");
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
    if (entry.time) whenLabel += ` at ${entry.time}`;

    if (entry.kind === "reminder") {
      const note = entry.reminder;
      return (
        <div className="p-4" key={entry.id}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Bell className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">{note.note}</p>
              <p className="text-xs text-gray-500">
                {whenLabel}
                {entry.location ? ` - ${entry.location}` : ""}
              </p>
              {entry.link && (
                <a
                  href={entry.link}
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
            <span className="text-xs text-amber-600 whitespace-nowrap">
              My Reminder
            </span>
          </div>
        </div>
      );
    }

    const note = entry.session;
    const isBusiness = note.member_type === "business";
    const matchingMember = isBusiness
      ? undefined
      : members.find(
          (m) => m.id === note.member_id && m.member_type === note.member_type,
        );
    const matchingBusiness = isBusiness
      ? businesses.find((b) => b.id === note.member_id)
      : undefined;
    const canOpen = isBusiness ? Boolean(matchingBusiness) : Boolean(matchingMember);

    return (
      <div className="p-4" key={entry.id}>
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}
          >
            <span className={`text-sm font-bold ${colors.text}`}>
              {initials(note.member_name)}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-800">{note.member_name}</p>
            <p className="text-xs text-gray-500">
              {whenLabel}
              {entry.location ? ` - ${entry.location}` : ""}
            </p>
            {entry.link && (
              <a
                href={entry.link}
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
            onClick={() => {
              setShowAllSessions(false);
              if (isBusiness && matchingBusiness) {
                setSelectedBusiness(matchingBusiness);
              } else if (matchingMember) {
                setSelectedMember(matchingMember);
              }
            }}
            disabled={!canOpen}
            className="text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Log Session →
          </button>
        </div>
      </div>
    );
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
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">Upcoming Sessions</h3>
            </div>
            {upcomingEntries.length > 3 && (
              <button
                onClick={() => setShowAllSessions(true)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View all →
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingEntries.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No upcoming sessions or reminders logged yet.
              </div>
            ) : (
              upcomingEntries
                .slice(0, 3)
                .map((entry, idx) => renderUpcomingEntry(entry, idx))
            )}
          </div>
        </div>
      </div>

      {showAllSessions && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAllSessions(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">
                  All Upcoming ({upcomingEntries.length})
                </h3>
              </div>
              <button
                onClick={() => setShowAllSessions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto">
              {upcomingEntries.map((entry, idx) => renderUpcomingEntry(entry, idx))}
            </div>
          </div>
        </div>
      )}

      {adminId && <PersonalReminders adminId={adminId} />}
      {adminId && <MyNotepad adminId={adminId} />}

      {/* Members / Businesses tab toggle */}
      <div className="mb-6 flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setRosterTab("members")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            rosterTab === "members"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Members
        </button>
        <button
          onClick={() => setRosterTab("businesses")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            rosterTab === "businesses"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Businesses
        </button>
      </div>

      {rosterTab === "businesses" && (
        <BusinessesSection
          businesses={businesses}
          loading={businessesLoading}
          q={businessQ}
          setQ={setBusinessQ}
          onSelect={setSelectedBusiness}
          onAdd={() => setShowAddBusiness(true)}
        />
      )}

      {rosterTab === "members" && (
        <>
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Members</h2>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
          >
            <UserPlus className="h-4 w-4" />
            Add New Member
          </button>
        </div>
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
        </>
      )}

      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          currentAuthorName={currentAuthorName}
          onClose={() => setSelectedMember(null)}
          onChanged={loadData}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onCreated={async (id, memberType) => {
            setShowAddMember(false);
            try {
              const data = await getAllCrmMembers();
              setMembers(data);
              const created = data.find(
                (m) => m.id === id && m.member_type === memberType,
              );
              if (created) setSelectedMember(created);
            } catch (err) {
              console.error("Failed to refresh members after add:", err);
            }
          }}
        />
      )}

      {selectedBusiness && adminId && (
        <BusinessDetailModal
          business={selectedBusiness}
          currentAuthorName={currentAuthorName}
          adminId={adminId}
          onClose={() => setSelectedBusiness(null)}
          onChanged={loadBusinesses}
        />
      )}

      {showAddBusiness && (
        <AddBusinessModal
          onClose={() => setShowAddBusiness(false)}
          onCreated={async (id) => {
            setShowAddBusiness(false);
            await loadBusinesses();
            try {
              const data = await getAllBusinesses();
              setBusinesses(data);
              const created = data.find((b) => b.id === id);
              if (created) setSelectedBusiness(created);
            } catch (err) {
              console.error("Failed to refresh businesses after add:", err);
            }
          }}
        />
      )}
    </>
  );
}

// Businesses/leads list with a monthly referral summary - the roster
// half of the "Businesses" tab, mirrors the layout of the Members list
// (search + list + detail-on-click) but for businesses/contacts/
// referrals instead of CRM member accounts.
function BusinessesSection({
  businesses,
  loading,
  q,
  setQ,
  onSelect,
  onAdd,
}: {
  businesses: BusinessWithDetails[];
  loading: boolean;
  q: string;
  setQ: (v: string) => void;
  onSelect: (b: BusinessWithDetails) => void;
  onAdd: () => void;
}) {
  const filtered = businesses.filter(
    (b) => !q || b.name.toLowerCase().includes(q.toLowerCase()),
  );

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = nextMonth.toISOString().slice(0, 10);

  const allReferrals = businesses.flatMap((b) => b.referrals);
  const referralsThisMonth = allReferrals.filter(
    (r) => r.referred_date >= monthStart && r.referred_date < monthEnd,
  );
  const statusCounts = REFERRAL_STATUSES.map((s) => ({
    ...s,
    count: allReferrals.filter((r) => r.status === s.value).length,
  }));

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Loading businesses…</div>;
  }

  return (
    <>
      {/* Monthly referral summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-gray-900">{referralsThisMonth.length}</p>
          <p className="text-xs text-gray-500">Referrals this month</p>
        </div>
        {statusCounts.map((s) => (
          <div key={s.value} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{s.count}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search businesses by name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Businesses</h2>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
          >
            <UserPlus className="h-4 w-4" />
            Add Business
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">
              {businesses.length === 0
                ? "No businesses added yet"
                : "No businesses found"}
            </p>
          </div>
        ) : (
          filtered.map((b, idx) => {
            const activeReferrals = b.referrals.filter(
              (r) => r.status !== "completed" && r.status !== "not_selected",
            );
            return (
              <div
                key={b.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onSelect(b)}
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold shrink-0 ${avatarColors[idx % avatarColors.length]}`}
                    >
                      {initials(b.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{b.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {b.industry && (
                          <span className="text-sm text-gray-500">{b.industry}</span>
                        )}
                        <span className="text-xs text-gray-400">
                          {b.contacts.length} contact{b.contacts.length === 1 ? "" : "s"}
                        </span>
                        {activeReferrals.length > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                            {activeReferrals.length} active referral
                            {activeReferrals.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                      {b.contacts.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {b.contacts.map((c) => c.name).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(b);
                    }}
                    className="px-3 py-1.5 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

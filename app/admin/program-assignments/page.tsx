"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserCheck, Briefcase, Save, X } from "lucide-react";

interface User {
  email: string;
  fullName: string;
  role: string;
  assignedPrograms: string[];
}

const ALL_PROGRAMS = [
  "RCP Small Business Mentorship",
  "SEED Micro-Grant",
  "Business Technical Assistance",
  "Parker Dewey Internships",
  "Workforce Development",
  "LHEATs",
  "Coalition Leadership Roundtable",
  "Rural Connect Magazine",
  "Park Upgrades",
  "Microloan Program",
  "MAZK Initiative",
];

export default function ProgramAssignmentsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [assignedPrograms, setAssignedPrograms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: string;
    visible: boolean;
  }>({
    message: "",
    type: "success",
    visible: false,
  });

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser !== "admin@ruralcommunity.org") {
      router.push("/");
      return;
    }

    // Load all users
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const programManagers = allUsers
      .filter(
        (u: any) =>
          u.primaryRole === "program_manager" ||
          u.roles?.includes("program_manager"),
      )
      .map((u: any) => {
        const savedAssignments = localStorage.getItem(
          `program_assignments_${u.email}`,
        );
        return {
          email: u.email,
          fullName: u.fullName || u.email.split("@")[0],
          role: "Program Manager",
          assignedPrograms: savedAssignments
            ? JSON.parse(savedAssignments)
            : [],
        };
      });

    setUsers(programManagers);
  }, [router]);

  const saveAssignments = () => {
    if (!selectedUser) return;
    setSaving(true);
    localStorage.setItem(
      `program_assignments_${selectedUser}`,
      JSON.stringify(assignedPrograms),
    );
    setToast({
      message: "Assignments saved successfully!",
      type: "success",
      visible: true,
    });
    setTimeout(
      () => setToast({ message: "", type: "success", visible: false }),
      3000,
    );
    setSaving(false);
  };

  const toggleProgram = (program: string) => {
    if (assignedPrograms.includes(program)) {
      setAssignedPrograms(assignedPrograms.filter((p) => p !== program));
    } else {
      setAssignedPrograms([...assignedPrograms, program]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                Program Assignments
              </h1>
              <p className="text-xs text-gray-500">
                Assign programs to program managers
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {toast.visible && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg flex items-center gap-2">
            <Check className="h-4 w-4" />
            {toast.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Program Managers List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Program Managers
            </h2>
            <div className="space-y-2">
              {users.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No program managers found
                </p>
              ) : (
                users.map((user) => (
                  <button
                    key={user.email}
                    onClick={() => {
                      setSelectedUser(user.email);
                      setAssignedPrograms(user.assignedPrograms);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-colors flex items-center gap-3 ${
                      selectedUser === user.email
                        ? "bg-emerald-50 border border-emerald-200"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Program Assignment Editor */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedUser
                ? `Assign Programs to ${selectedUser.split("@")[0]}`
                : "Select a Program Manager"}
            </h2>

            {selectedUser ? (
              <>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {ALL_PROGRAMS.map((program) => (
                    <label
                      key={program}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                        assignedPrograms.includes(program)
                          ? "bg-emerald-50 border border-emerald-200"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Briefcase
                          className={`h-4 w-4 ${assignedPrograms.includes(program) ? "text-emerald-600" : "text-gray-400"}`}
                        />
                        <span className="text-sm text-gray-700">{program}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleProgram(program)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          assignedPrograms.includes(program)
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {assignedPrograms.includes(program) && (
                          <Check className="h-3 w-3" />
                        )}
                      </button>
                    </label>
                  ))}
                </div>

                <button
                  onClick={saveAssignments}
                  disabled={saving}
                  className="mt-5 w-full py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Assignments"}
                </button>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a program manager from the list</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Add missing Check import
const Check = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

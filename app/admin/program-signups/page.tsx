"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Mail,
  Phone,
  Building,
  Target,
  Calendar,
  Download,
  Search,
  X,
} from "lucide-react";

interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  roleLabel: string;
  organization: string;
  position: string;
  selectedPrograms: string[];
  goals: string;
  hearAbout?: string;
  submittedAt: string;
  status: string;
}

export default function ProgramSignupsPage() {
  const router = useRouter();
  const [signups, setSignups] = useState<SignupRequest[]>([]);
  const [selectedSignup, setSelectedSignup] = useState<SignupRequest | null>(
    null,
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user !== "admin@ruralcommunity.org") {
      router.push("/");
      return;
    }
    setIsAdmin(true);

    // Load all signups
    const savedSignups = JSON.parse(
      localStorage.getItem("programSignups") || "[]",
    );
    setSignups(savedSignups);
  }, [router]);

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Role",
      "Organization",
      "Programs",
      "Submitted Date",
    ];
    const csvData = filteredSignups.map((s) => [
      `${s.firstName} ${s.lastName}`,
      s.email,
      s.phone || "",
      s.roleLabel,
      s.organization || "",
      s.selectedPrograms.join("; "),
      new Date(s.submittedAt).toLocaleDateString(),
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `program_signups_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter signups based on search and date
  const filteredSignups = signups.filter((signup) => {
    const matchesSearch =
      searchTerm === "" ||
      `${signup.firstName} ${signup.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      signup.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signup.organization?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (dateFilter === "today") {
      const today = new Date().toDateString();
      return new Date(signup.submittedAt).toDateString() === today;
    }
    if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(signup.submittedAt) >= weekAgo;
    }
    if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return new Date(signup.submittedAt) >= monthAgo;
    }
    return true;
  });

  if (!isAdmin) return null;

  const totalCount = signups.length;
  const filteredCount = filteredSignups.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                  Program Signup
                </h1>
                <p className="text-xs text-gray-500">
                  View all user applications
                </p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export to CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
            <p className="text-sm opacity-90">Total Signups</p>
            <p className="text-3xl font-bold">{totalCount}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
            <p className="text-sm opacity-90">This Month</p>
            <p className="text-3xl font-bold">
              {
                signups.filter(
                  (s) =>
                    new Date(s.submittedAt).getMonth() ===
                    new Date().getMonth(),
                ).length
              }
            </p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-5 text-white">
            <p className="text-sm opacity-90">Unique Programs</p>
            <p className="text-3xl font-bold">
              {new Set(signups.flatMap((s) => s.selectedPrograms)).size}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Showing {filteredCount} of {totalCount} signups
          </p>
        </div>

        {/* Signups List */}
        <div className="space-y-4">
          {filteredSignups.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-400">No signups found</p>
              <p className="text-xs text-gray-400 mt-1">
                New applications will appear here
              </p>
            </div>
          ) : (
            filteredSignups.map((signup, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    {/* Name and Role */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {signup.firstName} {signup.lastName}
                      </h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                        {signup.roleLabel}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(signup.submittedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-3.5 w-3.5" />
                        {signup.email}
                      </div>
                      {signup.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-3.5 w-3.5" />
                          {signup.phone}
                        </div>
                      )}
                      {signup.organization && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building className="h-3.5 w-3.5" />
                          {signup.organization}{" "}
                          {signup.position && `(${signup.position})`}
                        </div>
                      )}
                    </div>

                    {/* Programs */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {signup.selectedPrograms.map((program) => (
                        <span
                          key={program}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full"
                        >
                          {program}
                        </span>
                      ))}
                    </div>

                    {/* Goals Preview */}
                    {signup.goals && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        <span className="font-medium">Goals:</span>{" "}
                        {signup.goals.substring(0, 150)}
                        {signup.goals.length > 150 ? "..." : ""}
                      </p>
                    )}
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedSignup(signup)}
                    className="px-4 py-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedSignup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Application Details: {selectedSignup.firstName}{" "}
                {selectedSignup.lastName}
              </h2>
              <button
                onClick={() => setSelectedSignup(null)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="p-1 bg-emerald-100 rounded-full">
                    <UserIcon className="h-3 w-3 text-emerald-600" />
                  </div>
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-400">Full Name</p>
                    <p className="font-medium">
                      {selectedSignup.firstName} {selectedSignup.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Role</p>
                    <p className="font-medium">{selectedSignup.roleLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-medium break-all">
                      {selectedSignup.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="font-medium">
                      {selectedSignup.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Organization Information */}
              {(selectedSignup.organization || selectedSignup.position) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="p-1 bg-emerald-100 rounded-full">
                      <Building className="h-3 w-3 text-emerald-600" />
                    </div>
                    Organization Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                    {selectedSignup.organization && (
                      <div>
                        <p className="text-xs text-gray-400">Organization</p>
                        <p className="font-medium">
                          {selectedSignup.organization}
                        </p>
                      </div>
                    )}
                    {selectedSignup.position && (
                      <div>
                        <p className="text-xs text-gray-400">Position</p>
                        <p className="font-medium">{selectedSignup.position}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Program Interests */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="p-1 bg-emerald-100 rounded-full">
                    <Target className="h-3 w-3 text-emerald-600" />
                  </div>
                  Program Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSignup.selectedPrograms.map((program) => (
                    <span
                      key={program}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm"
                    >
                      {program}
                    </span>
                  ))}
                </div>
              </div>

              {/* Goals */}
              {selectedSignup.goals && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Goals & Expectations
                  </h3>
                  <p className="text-gray-600 bg-gray-50 p-4 rounded-xl">
                    {selectedSignup.goals}
                  </p>
                </div>
              )}

              {/* How they heard */}
              {selectedSignup.hearAbout && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    How they heard about us
                  </h3>
                  <p className="text-gray-600 bg-gray-50 p-4 rounded-xl">
                    {selectedSignup.hearAbout}
                  </p>
                </div>
              )}

              {/* Submission Info */}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-400">
                  Submitted:{" "}
                  {new Date(selectedSignup.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setSelectedSignup(null)}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// User Icon component (since lucide-react User might conflict)
function UserIcon(props: any) {
  return (
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
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}

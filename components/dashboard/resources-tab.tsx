"use client";

export function ResourcesTab() {
  const financialResources = {
    totalBudget: 245000,
    grantsReceived: 187500,
    donations: 32500,
    sponsorships: 25000,
  };

  const staffTime = {
    totalHours: 1240,
    facilitationHours: 420,
    coordinationHours: 380,
    adminHours: 440,
  };

  // Signups by program data
  const signupsByProgram = [
    { name: "RCP Small Business Mentorship", signups: 14, change: "+8" },
    { name: "SEED Micro-Grant Program", signups: 9, change: "+5" },
    { name: "Business Technical Assistance Hub", signups: 7, change: "+3" },
    { name: "Parker Dewey Micro-Internship", signups: 6, change: "+4" },
    { name: "Workforce Development & Navigation", signups: 11, change: "+6" },
    { name: "Local Health Equity Action Teams", signups: 8, change: "+2" },
    { name: "Coalition Leadership Roundtable", signups: 5, change: "+1" },
    { name: "Rural Connect Magazine", signups: 3, change: "+0" },
    { name: "Park & Community Space Upgrades", signups: 2, change: "+2" },
    { name: "Microloan Program", signups: 4, change: "+4" },
    { name: "MAZK Initiative", signups: 3, change: "+1" },
  ];

  // Resources by program data
  const resourcesByProgram = [
    {
      name: "RCP Small Business Mentorship",
      budget: 45000,
      hours: 320,
      participants: 45,
    },
    {
      name: "SEED Micro-Grant Program",
      budget: 35000,
      hours: 180,
      participants: 28,
    },
    {
      name: "Business Technical Assistance Hub",
      budget: 28000,
      hours: 240,
      participants: 32,
    },
    {
      name: "Parker Dewey Micro-Internship",
      budget: 25000,
      hours: 120,
      participants: 24,
    },
    {
      name: "Workforce Development & Navigation",
      budget: 32000,
      hours: 200,
      participants: 56,
    },
    {
      name: "Local Health Equity Action Teams",
      budget: 28000,
      hours: 180,
      participants: 45,
    },
    {
      name: "Coalition Leadership Roundtable",
      budget: 15000,
      hours: 60,
      participants: 24,
    },
    {
      name: "Rural Connect Magazine",
      budget: 18000,
      hours: 80,
      participants: 6000,
    },
    {
      name: "Park & Community Space Upgrades",
      budget: 75000,
      hours: 40,
      participants: 0,
    },
    { name: "Microloan Program", budget: 50000, hours: 100, participants: 0 },
    { name: "MAZK Initiative", budget: 25000, hours: 80, participants: 12 },
  ];

  const totalBudget = resourcesByProgram.reduce((sum, p) => sum + p.budget, 0);
  const totalHours = resourcesByProgram.reduce((sum, p) => sum + p.hours, 0);
  const totalParticipants = resourcesByProgram.reduce(
    (sum, p) => sum + p.participants,
    0,
  );

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resources Invested</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track financial, staff, and program resources across all initiatives
        </p>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-300 uppercase tracking-wide">
            Total Investment
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            ${totalBudget.toLocaleString()}
          </p>
        </div>
        <div className="bg-indigo-800 rounded-xl p-4">
          <p className="text-xs text-indigo-200 uppercase tracking-wide">
            Staff Hours
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {totalHours.toLocaleString()}
          </p>
        </div>
        <div className="bg-emerald-800 rounded-xl p-4">
          <p className="text-xs text-emerald-200 uppercase tracking-wide">
            Participants Served
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {totalParticipants.toLocaleString()}
          </p>
        </div>
      </div>

      {/* SIGNUPS BY PROGRAM - New Section for client */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Signups by Program (This Month)
          </h2>
          <span className="text-xs text-gray-400">Last updated: May 2026</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signupsByProgram.map((program, idx) => {
            const colors = [
              "bg-slate-700",
              "bg-emerald-800",
              "bg-blue-800",
              "bg-purple-800",
              "bg-teal-800",
              "bg-rose-800",
              "bg-amber-800",
              "bg-indigo-800",
              "bg-gray-700",
              "bg-cyan-800",
              "bg-lime-800",
            ];
            return (
              <div
                key={program.name}
                className={`${colors[idx % colors.length]} rounded-xl p-4 hover:shadow-lg transition-shadow`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-300 uppercase tracking-wide">
                      {program.name}
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {program.signups}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-300 bg-white/10 px-2 py-1 rounded-full">
                    {program.change}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-2">
                  new signups this month
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Resources Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Financial Resources
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-300 uppercase tracking-wide">
              Total Budget
            </p>
            <p className="text-xl font-bold text-white mt-1">
              ${financialResources.totalBudget.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">FY 2026</p>
          </div>
          <div className="bg-emerald-800 rounded-xl p-4">
            <p className="text-xs text-emerald-200 uppercase tracking-wide">
              Grants Received
            </p>
            <p className="text-xl font-bold text-white mt-1">
              ${financialResources.grantsReceived.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-200 mt-1">76% of budget</p>
          </div>
          <div className="bg-blue-800 rounded-xl p-4">
            <p className="text-xs text-blue-200 uppercase tracking-wide">
              Donations
            </p>
            <p className="text-xl font-bold text-white mt-1">
              ${financialResources.donations.toLocaleString()}
            </p>
            <p className="text-xs text-blue-200 mt-1">Community support</p>
          </div>
          <div className="bg-amber-800 rounded-xl p-4">
            <p className="text-xs text-amber-200 uppercase tracking-wide">
              Sponsorships
            </p>
            <p className="text-xl font-bold text-white mt-1">
              ${financialResources.sponsorships.toLocaleString()}
            </p>
            <p className="text-xs text-amber-200 mt-1">Corporate partners</p>
          </div>
        </div>
      </div>

      {/* Staff Time Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Staff & Volunteer Time
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-300 uppercase tracking-wide">
              Total Hours
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {staffTime.totalHours}
            </p>
            <p className="text-xs text-slate-300 mt-1">YTD</p>
          </div>
          <div className="bg-purple-800 rounded-xl p-4">
            <p className="text-xs text-purple-200 uppercase tracking-wide">
              Facilitation
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {staffTime.facilitationHours}
            </p>
            <p className="text-xs text-purple-200 mt-1">34% of total</p>
          </div>
          <div className="bg-teal-800 rounded-xl p-4">
            <p className="text-xs text-teal-200 uppercase tracking-wide">
              Coordination
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {staffTime.coordinationHours}
            </p>
            <p className="text-xs text-teal-200 mt-1">31% of total</p>
          </div>
          <div className="bg-rose-800 rounded-xl p-4">
            <p className="text-xs text-rose-200 uppercase tracking-wide">
              Administrative
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {staffTime.adminHours}
            </p>
            <p className="text-xs text-rose-200 mt-1">35% of total</p>
          </div>
        </div>
      </div>

      {/* RESOURCES BY PROGRAM - New Section for client */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Resources by Program
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resourcesByProgram.map((program) => (
            <div
              key={program.name}
              className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition-colors"
            >
              <p className="text-sm font-medium text-white mb-2">
                {program.name}
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Budget:</span>
                  <span className="text-white font-medium">
                    ${program.budget.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Staff Hours:</span>
                  <span className="text-white">{program.hours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Participants:</span>
                  <span className="text-white">
                    {program.participants.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-4 text-center text-xs text-gray-400">
        Data updated quarterly • Last updated: May 2026
      </div>
    </>
  );
}

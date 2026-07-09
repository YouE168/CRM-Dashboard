// components/program-details-modal.tsx
"use client";

import { useState } from "react";
import {
  X,
  Mail,
  Phone,
  Calendar,
  Clock,
  Video,
  FileText,
  ChevronRight,
  User,
  Award,
  Building2,
  BookOpen,
  ArrowRight,
  DollarSign,
  Users,
  TrendingUp,
  Clock as ClockIcon,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Briefcase,
  Target,
} from "lucide-react";

interface ProgramDetailsModalProps {
  program: any;
  onClose: () => void;
  userRole?: string;
  userEmail?: string;
}

export default function ProgramDetailsModal({
  program,
  onClose,
  userRole,
  userEmail,
}: ProgramDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "tracking" | "sessions" | "resources" | "contact"
  >("overview");

  if (!program) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Completed":
        return "bg-purple-100 text-purple-700";
      case "On Hold":
        return "bg-yellow-100 text-yellow-700";
      case "In Development":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const isSEKCatalyst = program.name === "SEK Catalyst: Empowered by KU";
  const isBusinessProfessional =
    program.name === "Business Professional Services";

  const tracking = program.tracking || {};
  const financial = tracking.financial || {};
  const participants = tracking.participants || {};
  const outcomes = tracking.outcomes || {};
  const staff = tracking.staff || {};
  const milestones = tracking.milestones || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0">
              {isSEKCatalyst && <Award className="h-6 w-6 text-blue-600" />}
              {isBusinessProfessional && (
                <Building2 className="h-6 w-6 text-amber-600" />
              )}
              {!isSEKCatalyst && !isBusinessProfessional && (
                <BookOpen className="h-6 w-6 text-emerald-600" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 truncate">
                {program.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(program.status)}`}
                >
                  {program.status}
                </span>
                <span className="text-xs text-gray-400">
                  Started {program.startDate}
                </span>
                {isSEKCatalyst && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    KU Partner
                  </span>
                )}
                {isBusinessProfessional && (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                    👩‍💼 Jody's Program
                  </span>
                )}
                {program.badges?.isGrantFunded && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                    💰 Grant Funded
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: BookOpen },
              { id: "tracking", label: "Tracking", icon: BarChart3 },
              { id: "sessions", label: "Sessions", icon: Calendar },
              { id: "resources", label: "Resources", icon: FileText },
              { id: "contact", label: "Contact", icon: Mail },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  About This Program
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {program.description}
                </p>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-medium text-emerald-600">
                    {program.progress}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-3 bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${program.progress}%` }}
                  />
                </div>
              </div>

              {/* Next Milestone */}
              {program.nextMilestone && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h4 className="text-sm font-medium text-emerald-800 mb-1">
                    Next Milestone
                  </h4>
                  <p className="text-emerald-700">{program.nextMilestone}</p>
                  {program.nextMilestoneAction && (
                    <button
                      onClick={() =>
                        window.open(program.nextMilestoneAction, "_blank")
                      }
                      className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    >
                      Take Action <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {financial.totalBudget > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Budget
                    </p>
                    <p className="text-lg font-bold text-blue-700">
                      ${(financial.totalBudget / 1000).toFixed(1)}K
                    </p>
                  </div>
                )}
                {participants.total > 0 && (
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-purple-600 font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Participants
                    </p>
                    <p className="text-lg font-bold text-purple-700">
                      {participants.total}
                    </p>
                  </div>
                )}
                {outcomes.jobsCreated > 0 && (
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      Jobs Created
                    </p>
                    <p className="text-lg font-bold text-emerald-700">
                      {outcomes.jobsCreated}
                    </p>
                  </div>
                )}
                {program.upcomingSessions &&
                  program.upcomingSessions.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Upcoming Sessions
                      </p>
                      <p className="text-lg font-bold text-amber-700">
                        {program.upcomingSessions.length}
                      </p>
                    </div>
                  )}
              </div>

              {/* Milestones */}
              {milestones.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Program Milestones
                  </h4>
                  <div className="space-y-2">
                    {milestones.map((milestone: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        {milestone.completed ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                        <div>
                          <p
                            className={`text-sm ${milestone.completed ? "text-gray-400 line-through" : "text-gray-700"}`}
                          >
                            {milestone.title}
                          </p>
                          {milestone.description && (
                            <p className="text-xs text-gray-400">
                              {milestone.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tracking Tab */}
          {activeTab === "tracking" && (
            <div className="space-y-6">
              {/* Financial Section */}
              {financial.totalBudget > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Financial Resources
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Total Budget</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${(financial.totalBudget / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Grants Received</p>
                      <p className="text-lg font-bold text-emerald-600">
                        ${(financial.grantsReceived / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Grants Pending</p>
                      <p className="text-lg font-bold text-amber-600">
                        ${(financial.grantsPending / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">
                        Cost Per Participant
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        ${financial.costPerParticipant || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Participants Section */}
              {participants.total > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Participant Metrics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-lg font-bold text-gray-900">
                        {participants.total}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Active</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {participants.active}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Onboarding</p>
                      <p className="text-lg font-bold text-amber-600">
                        {participants.onboarding}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Alumni</p>
                      <p className="text-lg font-bold text-purple-600">
                        {participants.alumni}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Outcomes Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Outcomes & Impact
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Businesses Launched</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {outcomes.businessesLaunched || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Businesses Expanded</p>
                    <p className="text-lg font-bold text-blue-600">
                      {outcomes.businessesExpanded || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Jobs Created</p>
                    <p className="text-lg font-bold text-purple-600">
                      {outcomes.jobsCreated || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Capital Accessed</p>
                    <p className="text-lg font-bold text-emerald-600">
                      ${(outcomes.capitalAccessed || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Revenue Growth</p>
                    <p className="text-lg font-bold text-amber-600">
                      {outcomes.revenueGrowth || 0}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Satisfaction</p>
                    <p className="text-lg font-bold text-purple-600">
                      {outcomes.clientSatisfaction || 0} / 5
                    </p>
                  </div>
                </div>
              </div>

              {/* Staff Time */}
              {staff.totalHours > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-indigo-600" />
                    Staff Time
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Total Hours</p>
                      <p className="text-lg font-bold text-gray-900">
                        {staff.totalHours}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Facilitation</p>
                      <p className="text-lg font-bold text-blue-600">
                        {staff.facilitationHours || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Coordination</p>
                      <p className="text-lg font-bold text-purple-600">
                        {staff.coordinationHours || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Staff Cost</p>
                      <p className="text-lg font-bold text-emerald-600">
                        ${(staff.costOfStaffTime || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sessions Tab - Same as before */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              {program.upcomingSessions &&
              program.upcomingSessions.length > 0 ? (
                program.upcomingSessions.map((session: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {session.title}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {session.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {session.time}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          Mentor: {session.mentor}
                        </p>
                      </div>
                      {session.link && (
                        <button
                          onClick={() => window.open(session.link, "_blank")}
                          className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming sessions scheduled</p>
                </div>
              )}
            </div>
          )}

          {/* Resources Tab - Same as before */}
          {activeTab === "resources" && (
            <div className="space-y-3">
              {program.resources && program.resources.length > 0 ? (
                program.resources.map((resource: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (resource.url) {
                        if (resource.url.startsWith("mailto:")) {
                          window.location.href = resource.url;
                        } else if (resource.url.startsWith("http")) {
                          window.open(resource.url, "_blank");
                        } else {
                          window.location.href = resource.url;
                        }
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <FileText className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-medium text-gray-700">
                          {resource.name}
                        </span>
                        {resource.type && (
                          <p className="text-xs text-gray-400 capitalize">
                            {resource.type}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No resources available yet</p>
                </div>
              )}
            </div>
          )}

          {/* Contact Tab - Same as before */}
          {activeTab === "contact" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-3">
                  Program Contact
                </h4>
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      (window.location.href = `mailto:${program.contactEmail}`)
                    }
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-emerald-50 transition-colors border border-gray-100"
                  >
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Mail className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-700">
                        {program.contactEmail}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                  </button>

                  <button
                    onClick={() =>
                      (window.location.href = `tel:${program.contactPhone}`)
                    }
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-emerald-50 transition-colors border border-gray-100"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-700">
                        {program.contactPhone}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                  </button>

                  {isBusinessProfessional && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-700 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          <strong>Jody</strong> is your primary contact for this
                          program.
                        </span>
                      </p>
                    </div>
                  )}

                  {isSEKCatalyst && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700 flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span>
                          Supported by the <strong>University of Kansas</strong>
                          .
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const subject = encodeURIComponent(
                      `Question about ${program.name}`,
                    );
                    window.location.href = `mailto:${program.contactEmail}?subject=${subject}`;
                  }}
                  className="p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  Send Email
                </button>
                <button
                  onClick={onClose}
                  className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

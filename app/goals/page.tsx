"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  getParticipantRecordsForUser,
  getGoalsForParticipant,
  addMenteeGoal,
  updateMenteeGoal,
  deleteMenteeGoal,
  toggleGoalCompleted,
  subscribeToMenteeData,
  type MenteeGoalRow,
} from "@/lib/supabase/dashboard-data";
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Award,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  X,
} from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  category: string;
}

function mapRow(row: MenteeGoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    dueDate: row.due_date || "",
    completed: row.completed,
    category: row.category || "Personal",
  };
}

export default function GoalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    category: "Personal",
  });

  const categories = [
    "Onboarding",
    "Mentorship",
    "Planning",
    "Financial",
    "Marketing",
    "Networking",
    "Funding",
    "Personal",
  ];

  const loadGoals = async (pid: string) => {
    try {
      const rows = await getGoalsForParticipant(pid);
      setGoals(rows.map(mapRow));
    } catch (err) {
      console.error("Failed to load goals:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.push("/login");
        return;
      }

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("email, status")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (userError || !userRow || (userRow.status && userRow.status !== "active")) {
        router.push("/login");
        return;
      }

      try {
        const records = await getParticipantRecordsForUser(
          authData.user.id,
          userRow.email,
        );
        const myRecord = records.find((r) => r.mentor) || records[0] || null;

        if (!cancelled) {
          setParticipantId(myRecord?.id ?? null);
          if (myRecord) {
            await loadGoals(myRecord.id);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load participant record:", err);
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Keep in sync with realtime changes (e.g. mentor edits a goal too)
  useEffect(() => {
    if (!participantId) return;
    const unsubscribe = subscribeToMenteeData(() => loadGoals(participantId));
    return unsubscribe;
  }, [participantId]);

  const toggleGoal = async (goal: Goal) => {
    try {
      await toggleGoalCompleted(goal.id, !goal.completed);
      if (participantId) await loadGoals(participantId);
    } catch (err) {
      console.error("Failed to update goal:", err);
    }
  };

  const addGoal = async () => {
    if (!newGoal.title.trim() || !participantId) return;
    try {
      await addMenteeGoal({
        participant_id: participantId,
        title: newGoal.title.trim(),
        description: newGoal.description.trim() || undefined,
        due_date: newGoal.dueDate || undefined,
        category: newGoal.category,
      });
      await loadGoals(participantId);
      setNewGoal({
        title: "",
        description: "",
        dueDate: new Date().toISOString().split("T")[0],
        category: "Personal",
      });
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to add goal:", err);
    }
  };

  const updateGoal = async () => {
    if (!editingGoal || !participantId) return;
    try {
      await updateMenteeGoal(editingGoal.id, {
        title: editingGoal.title,
        description: editingGoal.description,
        due_date: editingGoal.dueDate,
        category: editingGoal.category,
      });
      await loadGoals(participantId);
      setEditingGoal(null);
    } catch (err) {
      console.error("Failed to update goal:", err);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!participantId) return;
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      await deleteMenteeGoal(id);
      await loadGoals(participantId);
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const totalCount = goals.length;
  const overallProgress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                  Goals & Milestones
                </h1>
                <p className="text-xs text-gray-500">
                  Track and manage your goals
                </p>
              </div>
            </div>
            {participantId && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Goal
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {!participantId ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              Your account isn't linked to a program yet
            </p>
            <p className="text-sm text-gray-400 mt-1">
              An admin needs to add you as a participant before you can track
              goals. Reach out if this seems like a mistake.
            </p>
          </div>
        ) : (
          <>
            {/* Progress Card */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Your Progress</h2>
                  <p className="text-emerald-100 mt-1">
                    Keep up the great work!
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{overallProgress}%</div>
                  <p className="text-emerald-100 text-sm">Complete</p>
                </div>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <div className="flex justify-between mt-4 text-sm">
                <span>{completedCount} Completed</span>
                <span>{totalCount - completedCount} Remaining</span>
              </div>
            </div>

            {/* Goals List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">
                  📋 All Goals ({totalCount})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {goals.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    No goals yet. Click "Add Goal" to get started!
                  </div>
                ) : (
                  goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="p-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleGoal(goal)}
                          className="mt-0.5 flex-shrink-0"
                        >
                          {goal.completed ? (
                            <CheckCircle className="h-6 w-6 text-emerald-500" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-300 hover:text-emerald-400 transition-colors" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={`font-medium ${goal.completed ? "text-gray-500 line-through" : "text-gray-900"}`}
                            >
                              {goal.title}
                            </p>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                              {goal.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {goal.description}
                          </p>
                          {goal.dueDate && (
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-400">
                                  Due: {new Date(goal.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingGoal(goal)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Achievement Banner */}
            {completedCount === totalCount && totalCount > 0 && (
              <div className="mt-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200 text-center">
                <Award className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-900">
                  🎉 Congratulations!
                </h3>
                <p className="text-gray-600 mt-1">
                  You've completed all your goals! Amazing work!
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Goal
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, title: e.target.value })
                  }
                  placeholder="e.g., Launch my website"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, description: e.target.value })
                  }
                  rows={2}
                  placeholder="Describe your goal..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newGoal.dueDate}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, dueDate: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newGoal.category}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, category: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={addGoal}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Edit Goal</h2>
              <button
                onClick={() => setEditingGoal(null)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={editingGoal.title}
                  onChange={(e) =>
                    setEditingGoal({ ...editingGoal, title: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingGoal.description}
                  onChange={(e) =>
                    setEditingGoal({
                      ...editingGoal,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editingGoal.dueDate}
                  onChange={(e) =>
                    setEditingGoal({ ...editingGoal, dueDate: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editingGoal.category}
                  onChange={(e) =>
                    setEditingGoal({ ...editingGoal, category: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={updateGoal}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

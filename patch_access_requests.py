#!/usr/bin/env python3
PATH = "app/admin/dashboard/page.tsx"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

original = content
applied = []

old_load = '''  // LOAD ACCESS REQUESTS
  useEffect(() => {
    const loadAccessRequests = () => {
      const stored = localStorage.getItem("access_requests");
      if (stored) {
        const requests = JSON.parse(stored);
        setAccessRequests(requests);
      } else {
        // Add some sample requests for testing
        const sampleRequests: AccessRequest[] = [
          {
            name: "Sarah Johnson",
            email: "sarah.johnson@example.com",
            reason:
              "I need to manage the Business Catalyst program participants and track their progress. As a program coordinator, I would benefit from having access to view participant data and generate reports.",
            requestedRole: "program_manager",
            submittedAt: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            status: "pending",
            verificationToken:
              "sarah_token_" + Math.random().toString(36).substring(2, 15),
            passwordSet: false,
          },
          {
            name: "Michael Chen",
            email: "michael.chen@example.com",
            reason:
              "As a coalition leader, I need access to view participant data across all programs to better coordinate resources and support.",
            requestedRole: "staff",
            submittedAt: new Date(
              Date.now() - 5 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            status: "pending",
            verificationToken:
              "michael_token_" + Math.random().toString(36).substring(2, 15),
            passwordSet: false,
          },
          {
            name: "Emily Rodriguez",
            email: "emily.rodriguez@example.com",
            reason:
              "I'm the new program manager for SEED Micro-Grant and need to manage applications and track participant progress.",
            requestedRole: "program_manager",
            submittedAt: new Date(
              Date.now() - 1 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            status: "pending",
            verificationToken:
              "emily_token_" + Math.random().toString(36).substring(2, 15),
            passwordSet: false,
          },
        ];
        localStorage.setItem("access_requests", JSON.stringify(sampleRequests));
        setAccessRequests(sampleRequests);
      }
    };

    loadAccessRequests();

    // Listen for storage events to update in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_requests") {
        const updated = JSON.parse(e.newValue || "[]");
        setAccessRequests(updated);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);'''

new_load = '''  // LOAD ACCESS REQUESTS (Supabase, realtime)
  useEffect(() => {
    const loadAccessRequests = async () => {
      const { data, error } = await supabase
        .from("access_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load access requests:", error);
        return;
      }

      const mapped: any[] = (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        reason: r.reason,
        requestedRole: r.requested_role,
        submittedAt: r.created_at,
        status: r.status,
        verificationToken: r.verification_token,
        passwordSet: r.password_set,
      }));
      setAccessRequests(mapped);
    };

    loadAccessRequests();

    const channelName = `access-requests-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "access_requests" },
        loadAccessRequests,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);'''

if old_load in content:
    content = content.replace(old_load, new_load)
    applied.append("1. loadAccessRequests -> Supabase + realtime")
else:
    print("WARNING: block 1 (loadAccessRequests) not found - skipped.")

old_approve = '''  const handleApproveRequest = (request: AccessRequest) => {
    showConfirmModal(
      "Approve Access Request",
      `Are you sure you want to approve ${request.name} for ${request.requestedRole === "program_manager" ? "Program Manager" : "Staff/Admin"} access?\\n\\nThey will be able to ${request.requestedRole === "program_manager" ? "manage specific programs" : "access CMS, reports, and all programs"}.`,
      () => {
        // Generate a proper token if one doesn't exist
        const token =
          request.verificationToken ||
          Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

        const updatedRequests = accessRequests.map((r) =>
          r.email === request.email && r.submittedAt === request.submittedAt
            ? { ...r, status: "approved" as const, verificationToken: token }
            : r,
        );
        localStorage.setItem(
          "access_requests",
          JSON.stringify(updatedRequests),
        );
        setAccessRequests(updatedRequests);

        // Update the user's profile in localStorage
        const existingProfile = localStorage.getItem(
          `profile_${request.email}`,
        );
        if (existingProfile) {
          const profile = JSON.parse(existingProfile);
          profile.userType =
            request.requestedRole === "program_manager"
              ? "program_manager"
              : "staff";
          profile.primaryRole =
            request.requestedRole === "program_manager"
              ? "program_manager"
              : "staff";
          localStorage.setItem(
            `profile_${request.email}`,
            JSON.stringify(profile),
          );
        }

        // Update user status in users list
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const userIndex = users.findIndex(
          (u: any) => u.email === request.email,
        );
        if (userIndex !== -1) {
          users[userIndex].status = "approved";
          localStorage.setItem("users", JSON.stringify(users));
        }

        // Show the modern popup with proper token
        setApprovalPopup({
          isOpen: true,
          userName: request.name,
          userEmail: request.email,
          userRole: request.requestedRole,
          token: token, // Use the proper token
        });

        // ✅ Add real-time notification
        notificationService.addNotification(
          "inapp",
          "general",
          `✅ Access Approved: ${request.name}`,
          `${request.name} was approved for ${request.requestedRole === "program_manager" ? "Program Manager" : "Staff/Admin"} access.`,
          { user: request },
        );

        // Also show toast notification
        showToast(`${request.name}'s access has been approved!`, "success");

        setShowRequestDetails(false);
      },
      "info",
    );
  };'''

new_approve = '''  const handleApproveRequest = (request: AccessRequest) => {
    showConfirmModal(
      "Approve Access Request",
      `Are you sure you want to approve ${request.name} for ${request.requestedRole === "program_manager" ? "Program Manager" : "Staff/Admin"} access?\\n\\nThey will be able to ${request.requestedRole === "program_manager" ? "manage specific programs" : "access CMS, reports, and all programs"}.\\n\\nThey will receive an email to set their password.`,
      async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (!token) {
            showToast("Your session expired. Please log in again.", "error");
            return;
          }

          const res = await fetch("/api/admin/approve-access", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              requestId: (request as any).id,
              name: request.name,
              email: request.email,
              requestedRole: request.requestedRole,
            }),
          });

          const result = await res.json();
          if (!res.ok || !result.success) {
            showToast(result.error || "Failed to approve request.", "error");
            return;
          }

          // ✅ Add real-time notification
          notificationService.addNotification(
            "inapp",
            "general",
            `✅ Access Approved: ${request.name}`,
            `${request.name} was approved for ${request.requestedRole === "program_manager" ? "Program Manager" : "Staff/Admin"} access. They've been emailed a link to set their password.`,
            { user: request },
          );

          showToast(
            `${request.name}'s access has been approved! They'll receive an email to set their password.`,
            "success",
          );

          setShowRequestDetails(false);
        } catch (err) {
          console.error("Approve request error:", err);
          showToast("Something went wrong approving this request.", "error");
        }
      },
      "info",
    );
  };'''

if old_approve in content:
    content = content.replace(old_approve, new_approve)
    applied.append("2. handleApproveRequest -> /api/admin/approve-access")
else:
    print("WARNING: block 2 (handleApproveRequest) not found - skipped.")

old_reject = '''  const handleRejectRequest = (request: AccessRequest) => {
    showConfirmModal(
      "Reject Access Request",
      `Are you sure you want to reject ${request.name}'s access request?`,
      () => {
        const updatedRequests = accessRequests.map((r) =>
          r.email === request.email && r.submittedAt === request.submittedAt
            ? { ...r, status: "rejected" as const }
            : r,
        );
        localStorage.setItem(
          "access_requests",
          JSON.stringify(updatedRequests),
        );
        setAccessRequests(updatedRequests);

        // ✅ Add real-time notification
        notificationService.addNotification(
          "inapp",
          "general",
          `❌ Access Rejected: ${request.name}`,
          `${request.name}'s access request was rejected.`,
          { user: request },
        );

        showToast(
          `Access request from ${request.name} has been rejected.`,
          "info",
        );
        setShowRequestDetails(false);
      },
      "danger",
    );
  };'''

new_reject = '''  const handleRejectRequest = (request: AccessRequest) => {
    showConfirmModal(
      "Reject Access Request",
      `Are you sure you want to reject ${request.name}'s access request?`,
      async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (!token) {
            showToast("Your session expired. Please log in again.", "error");
            return;
          }

          const res = await fetch("/api/admin/reject-access", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ requestId: (request as any).id }),
          });

          const result = await res.json();
          if (!res.ok || !result.success) {
            showToast(result.error || "Failed to reject request.", "error");
            return;
          }

          // ✅ Add real-time notification
          notificationService.addNotification(
            "inapp",
            "general",
            `❌ Access Rejected: ${request.name}`,
            `${request.name}'s access request was rejected.`,
            { user: request },
          );

          showToast(
            `Access request from ${request.name} has been rejected.`,
            "info",
          );
          setShowRequestDetails(false);
        } catch (err) {
          console.error("Reject request error:", err);
          showToast("Something went wrong rejecting this request.", "error");
        }
      },
      "danger",
    );
  };'''

if old_reject in content:
    content = content.replace(old_reject, new_reject)
    applied.append("3. handleRejectRequest -> /api/admin/reject-access")
else:
    print("WARNING: block 3 (handleRejectRequest) not found - skipped.")

if content == original:
    print("\nNo changes made.")
else:
    with open(PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"\nPatched {PATH}")
    for a in applied:
        print(f"   {a}")
    print(f"\nTotal lines now: {len(content.splitlines())}")

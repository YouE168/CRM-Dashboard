export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password: string | null;
          name: string | null;
          primary_role: string | null;
          user_type: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password?: string | null;
          name?: string | null;
          primary_role?: string | null;
          user_type?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password?: string | null;
          name?: string | null;
          primary_role?: string | null;
          user_type?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // NOTE: this table's primary key (id) IS the auth user id - there is
      // no separate user_id column. There is also no "position" column.
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          role: string | null;
          user_type: string | null;
          primary_role: string | null;
          phone: string | null;
          organization: string | null;
          bio: string | null;
          expertise: string[] | null;
          availability: string[] | null;
          hourly_rate: number | null;
          rating: number | null;
          total_sessions: number | null;
          selected_programs: string[] | null;
          mentor: string | null;
          status: string | null;
          business_professional_status: string | null;
          avatar: string | null;
          avatar_position: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          role?: string | null;
          user_type?: string | null;
          primary_role?: string | null;
          phone?: string | null;
          organization?: string | null;
          bio?: string | null;
          expertise?: string[] | null;
          availability?: string[] | null;
          hourly_rate?: number | null;
          rating?: number | null;
          total_sessions?: number | null;
          selected_programs?: string[] | null;
          mentor?: string | null;
          status?: string | null;
          business_professional_status?: string | null;
          avatar?: string | null;
          avatar_position?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          role?: string | null;
          user_type?: string | null;
          primary_role?: string | null;
          phone?: string | null;
          organization?: string | null;
          bio?: string | null;
          expertise?: string[] | null;
          availability?: string[] | null;
          hourly_rate?: number | null;
          rating?: number | null;
          total_sessions?: number | null;
          selected_programs?: string[] | null;
          mentor?: string | null;
          status?: string | null;
          business_professional_status?: string | null;
          avatar?: string | null;
          avatar_position?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // Case-management notes for the "Business Professional Services" page -
      // a note attached to any CRM member (mentee/entrepreneur/partner/
      // coalition via participants.id, or mentor via mentors.id). member_id
      // isn't a real foreign key since it can point into two different
      // tables depending on member_type; member_name is denormalized so
      // notes still display sensibly even if the member is later removed.
      case_notes: {
        Row: {
          id: string;
          member_type: string;
          member_id: string;
          member_name: string;
          note: string;
          author: string | null;
          meeting_date: string | null;
          meeting_time: string | null;
          meeting_location: string | null;
          meeting_link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_type: string;
          member_id: string;
          member_name: string;
          note: string;
          author?: string | null;
          meeting_date?: string | null;
          meeting_time?: string | null;
          meeting_location?: string | null;
          meeting_link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_type?: string;
          member_id?: string;
          member_name?: string;
          note?: string;
          author?: string | null;
          meeting_date?: string | null;
          meeting_time?: string | null;
          meeting_location?: string | null;
          meeting_link?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      // Private personal checklist/reminders for an admin/staff user -
      // not tied to any participant, purely for their own to-do tracking.
      admin_personal_notes: {
        Row: {
          id: string;
          admin_id: string;
          note: string;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          note: string;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          note?: string;
          completed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      programs: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: string;
          start_date: string | null;
          end_date: string | null;
          progress: number;
          icon: string | null;
          color: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          managed_by: string;
          resource_categories: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          progress?: number;
          icon?: string | null;
          color?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          managed_by?: string;
          resource_categories?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          progress?: number;
          icon?: string | null;
          color?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          managed_by?: string;
          resource_categories?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_programs: {
        Row: {
          id: string;
          user_id: string;
          program_id: string;
          progress: number;
          approved: boolean;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          program_id: string;
          progress?: number;
          approved?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          program_id?: string;
          progress?: number;
          approved?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      program_tracking: {
        Row: {
          id: string;
          program_id: string;
          participant_id: string;
          budget: number;
          spent: number;
          grants_received: number;
          grants_pending: number;
          businesses_launched: number;
          businesses_expanded: number;
          jobs_created: number;
          jobs_retained: number;
          capital_accessed: number;
          revenue_growth_pct: number;
          staff_hours: number;
          outcomes_notes: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          participant_id: string;
          budget?: number;
          spent?: number;
          grants_received?: number;
          grants_pending?: number;
          businesses_launched?: number;
          businesses_expanded?: number;
          jobs_created?: number;
          jobs_retained?: number;
          capital_accessed?: number;
          revenue_growth_pct?: number;
          staff_hours?: number;
          outcomes_notes?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          program_id?: string;
          participant_id?: string;
          budget?: number;
          spent?: number;
          grants_received?: number;
          grants_pending?: number;
          businesses_launched?: number;
          businesses_expanded?: number;
          jobs_created?: number;
          jobs_retained?: number;
          capital_accessed?: number;
          revenue_growth_pct?: number;
          staff_hours?: number;
          outcomes_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      program_resources: {
        Row: {
          id: string;
          program_id: string;
          name: string;
          type: string;
          url: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          name: string;
          type?: string;
          url?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          program_id?: string;
          name?: string;
          type?: string;
          url?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      mentor_ratings: {
        Row: {
          id: string;
          participant_id: string;
          mentor_name: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          participant_id: string;
          mentor_name: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          participant_id?: string;
          mentor_name?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      overview_stats: {
        Row: {
          id: string;
          total_participants: number;
          total_participants_change: number;
          active_mentors: number;
          active_mentors_change: number;
          sessions_this_month: number;
          sessions_this_month_change: number;
          avg_satisfaction: number;
          avg_satisfaction_change: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          total_participants?: number;
          total_participants_change?: number;
          active_mentors?: number;
          active_mentors_change?: number;
          sessions_this_month?: number;
          sessions_this_month_change?: number;
          avg_satisfaction?: number;
          avg_satisfaction_change?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          total_participants?: number;
          total_participants_change?: number;
          active_mentors?: number;
          active_mentors_change?: number;
          sessions_this_month?: number;
          sessions_this_month_change?: number;
          avg_satisfaction?: number;
          avg_satisfaction_change?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      participants: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          program_id: string | null;
          program_name: string | null;
          mentor: string | null;
          status: string;
          joined_at: string;
          user_id: string | null;
          phone: string | null;
          sessions_completed: number;
          county: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          name?: string | null;
          program_id?: string | null;
          program_name?: string | null;
          mentor?: string | null;
          status?: string;
          joined_at?: string;
          user_id?: string | null;
          phone?: string | null;
          sessions_completed?: number;
          county?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          program_id?: string | null;
          program_name?: string | null;
          mentor?: string | null;
          status?: string;
          joined_at?: string;
          user_id?: string | null;
          phone?: string | null;
          sessions_completed?: number;
          county?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions_per_month: {
        Row: {
          id: string;
          month: string;
          sessions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          month: string;
          sessions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          month?: string;
          sessions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients_by_county: {
        Row: {
          id: string;
          county: string;
          count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          county: string;
          count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          county?: string;
          count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients_by_program: {
        Row: {
          id: string;
          program_name: string;
          count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_name: string;
          count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          program_name?: string;
          count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      outcome_kpis: {
        Row: {
          id: string;
          key: string;
          value: number;
          change: number;
          label: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value?: number;
          change?: number;
          label?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: number;
          change?: number;
          label?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          category: string;
          read: boolean;
          data: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          category?: string;
          read?: boolean;
          data?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          category?: string;
          read?: boolean;
          data?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      access_requests: {
        Row: {
          id: string;
          name: string;
          email: string;
          reason: string | null;
          requested_role: string | null;
          status: string;
          verification_token: string | null;
          password_set: boolean;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          reason?: string | null;
          requested_role?: string | null;
          status?: string;
          verification_token?: string | null;
          password_set?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          reason?: string | null;
          requested_role?: string | null;
          status?: string;
          verification_token?: string | null;
          password_set?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_logs: {
        Row: {
          id: string;
          to_email: string;
          subject: string | null;
          body: string | null;
          type: string | null;
          status: string;
          token: string | null;
          sent_at: string;
          opened_at: string | null;
        };
        Insert: {
          id?: string;
          to_email: string;
          subject?: string | null;
          body?: string | null;
          type?: string | null;
          status?: string;
          token?: string | null;
          sent_at?: string;
          opened_at?: string | null;
        };
        Update: {
          id?: string;
          to_email?: string;
          subject?: string | null;
          body?: string | null;
          type?: string | null;
          status?: string;
          token?: string | null;
          sent_at?: string;
          opened_at?: string | null;
        };
        Relationships: [];
      };
      mentors: {
        Row: {
          id: string;
          name: string;
          specialty: string | null;
          email: string | null;
          phone: string | null;
          bio: string | null;
          hourly_rate: number;
          availability: string[];
          expertise: string[];
          active_clients: number;
          rating: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          specialty?: string | null;
          email?: string | null;
          phone?: string | null;
          bio?: string | null;
          hourly_rate?: number;
          availability?: string[];
          expertise?: string[];
          active_clients?: number;
          rating?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          specialty?: string | null;
          email?: string | null;
          phone?: string | null;
          bio?: string | null;
          hourly_rate?: number;
          availability?: string[];
          expertise?: string[];
          active_clients?: number;
          rating?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mentee_goals: {
        Row: {
          id: string;
          participant_id: string | null;
          title: string;
          description: string | null;
          due_date: string | null;
          completed: boolean;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          participant_id?: string | null;
          title: string;
          description?: string | null;
          due_date?: string | null;
          completed?: boolean;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          participant_id?: string | null;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          completed?: boolean;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mentee_notes: {
        Row: {
          id: string;
          participant_id: string | null;
          note: string;
          author: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_id?: string | null;
          note: string;
          author?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          participant_id?: string | null;
          note?: string;
          author?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      mentee_sessions: {
        Row: {
          id: string;
          participant_id: string | null;
          date: string;
          time: string | null;
          topic: string | null;
          notes: string | null;
          duration: number;
          meeting_link: string | null;
          mentor_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_id?: string | null;
          date: string;
          time?: string | null;
          topic?: string | null;
          notes?: string | null;
          duration?: number;
          meeting_link?: string | null;
          mentor_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          participant_id?: string | null;
          date?: string;
          time?: string | null;
          topic?: string | null;
          notes?: string | null;
          duration?: number;
          meeting_link?: string | null;
          mentor_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      mentors_stats: {
        Row: {
          id: number;
          total: number;
          active: number;
          active_matches: number;
          matches_trend: number;
          avg_rating: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          total?: number;
          active?: number;
          active_matches?: number;
          matches_trend?: number;
          avg_rating?: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          total?: number;
          active?: number;
          active_matches?: number;
          matches_trend?: number;
          avg_rating?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      financial_transactions: {
        Row: {
          id: string;
          category: string;
          amount: number;
          description: string | null;
          status: string;
          transaction_date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          amount: number;
          description?: string | null;
          status?: string;
          transaction_date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          amount?: number;
          description?: string | null;
          status?: string;
          transaction_date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      leadership_stats: {
        Row: {
          id: number;
          total_members: number;
          members_trend: number;
          new_signups: number;
          signups_trend: number;
          avg_attendance: number;
          attendance_trend: number;
          member_satisfaction: number;
          satisfaction_trend: number;
          grant_funding: number;
          mentor_hours: number;
          staff_members: number;
          in_kind_support: number;
          budget_utilization: number;
          personnel_cost: number;
          programming_cost: number;
          operations_cost: number;
          marketing_cost: number;
          next_meeting: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          id?: number;
          total_members?: number;
          members_trend?: number;
          new_signups?: number;
          signups_trend?: number;
          avg_attendance?: number;
          attendance_trend?: number;
          member_satisfaction?: number;
          satisfaction_trend?: number;
          grant_funding?: number;
          mentor_hours?: number;
          staff_members?: number;
          in_kind_support?: number;
          budget_utilization?: number;
          personnel_cost?: number;
          programming_cost?: number;
          operations_cost?: number;
          marketing_cost?: number;
          next_meeting?: Record<string, unknown>;
          updated_at?: string;
        };
        Update: {
          id?: number;
          total_members?: number;
          members_trend?: number;
          new_signups?: number;
          signups_trend?: number;
          avg_attendance?: number;
          attendance_trend?: number;
          member_satisfaction?: number;
          satisfaction_trend?: number;
          grant_funding?: number;
          mentor_hours?: number;
          staff_members?: number;
          in_kind_support?: number;
          budget_utilization?: number;
          personnel_cost?: number;
          programming_cost?: number;
          operations_cost?: number;
          marketing_cost?: number;
          next_meeting?: Record<string, unknown>;
          updated_at?: string;
        };
        Relationships: [];
      };
      leadership_action_items: {
        Row: {
          id: string;
          task: string;
          assignee: string | null;
          due_date: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task: string;
          assignee?: string | null;
          due_date?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task?: string;
          assignee?: string | null;
          due_date?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leadership_roundtable_applications: {
        Row: {
          id: string;
          name: string;
          email: string;
          organization: string | null;
          county: string | null;
          role: string | null;
          reason: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          organization?: string | null;
          county?: string | null;
          role?: string | null;
          reason?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          organization?: string | null;
          county?: string | null;
          role?: string | null;
          reason?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      resource_stats: {
        Row: {
          id: number;
          total_budget: number;
          grants_received: number;
          donations: number;
          sponsorships: number;
          total_hours: number;
          facilitation_hours: number;
          coordination_hours: number;
          admin_hours: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          total_budget?: number;
          grants_received?: number;
          donations?: number;
          sponsorships?: number;
          total_hours?: number;
          facilitation_hours?: number;
          coordination_hours?: number;
          admin_hours?: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          total_budget?: number;
          grants_received?: number;
          donations?: number;
          sponsorships?: number;
          total_hours?: number;
          facilitation_hours?: number;
          coordination_hours?: number;
          admin_hours?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      resources_by_program: {
        Row: {
          id: string;
          name: string;
          budget: number;
          hours: number;
          participants: number;
          status: string;
          type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          budget?: number;
          hours?: number;
          participants?: number;
          status?: string;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          budget?: number;
          hours?: number;
          participants?: number;
          status?: string;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      report_data: {
        Row: {
          id: number;
          data: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          id?: number;
          data?: Record<string, unknown>;
          updated_at?: string;
        };
        Update: {
          id?: number;
          data?: Record<string, unknown>;
          updated_at?: string;
        };
        Relationships: [];
      };
      analytics_data: {
        Row: {
          id: string;
          program: string;
          county: string;
          date_range: string;
          active_clients: number;
          active_mentor_matches: number;
          sessions_this_month: number;
          hours_delivered: number;
          outstanding_signatures: number;
          surveys_overdue: number;
          invoices_pending: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program: string;
          county: string;
          date_range: string;
          active_clients?: number;
          active_mentor_matches?: number;
          sessions_this_month?: number;
          hours_delivered?: number;
          outstanding_signatures?: number;
          surveys_overdue?: number;
          invoices_pending?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          program?: string;
          county?: string;
          date_range?: string;
          active_clients?: number;
          active_mentor_matches?: number;
          sessions_this_month?: number;
          hours_delivered?: number;
          outstanding_signatures?: number;
          surveys_overdue?: number;
          invoices_pending?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_notes: {
        Row: {
          id: string;
          subject: string | null;
          message: string;
          recipient_type: string;
          sent_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject?: string | null;
          message: string;
          recipient_type?: string;
          sent_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject?: string | null;
          message?: string;
          recipient_type?: string;
          sent_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      direct_messages: {
        Row: {
          id: string;
          user_id: string;
          sender_role: string;
          sender_name: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sender_role: string;
          sender_name?: string | null;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sender_role?: string;
          sender_name?: string | null;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_seen_state: {
        Row: {
          user_id: string;
          last_seen_at: string;
        };
        Insert: {
          user_id: string;
          last_seen_at?: string;
        };
        Update: {
          user_id?: string;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      partner_profile_data: {
        Row: {
          user_id: string;
          hero_title: string | null;
          hero_subtitle: string | null;
          stat_active_partners: number;
          stat_shared_resources: number;
          stat_active_referrals: number;
          metric_active_collaborations: number;
          metric_internships_posted: number;
          metric_student_placements: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          hero_title?: string | null;
          hero_subtitle?: string | null;
          stat_active_partners?: number;
          stat_shared_resources?: number;
          stat_active_referrals?: number;
          metric_active_collaborations?: number;
          metric_internships_posted?: number;
          metric_student_placements?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          hero_title?: string | null;
          hero_subtitle?: string | null;
          stat_active_partners?: number;
          stat_shared_resources?: number;
          stat_active_referrals?: number;
          metric_active_collaborations?: number;
          metric_internships_posted?: number;
          metric_student_placements?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      partner_collaborations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: string;
          referrals: number | null;
          internships: number | null;
          link: string | null;
          project_type: string | null;
          org_type: string | null;
          hours_worked: number | null;
          program_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: string;
          referrals?: number | null;
          internships?: number | null;
          link?: string | null;
          project_type?: string | null;
          org_type?: string | null;
          hours_worked?: number | null;
          program_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          referrals?: number | null;
          internships?: number | null;
          link?: string | null;
          project_type?: string | null;
          org_type?: string | null;
          hours_worked?: number | null;
          program_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      partner_resources: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          type: string;
          link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          type?: string;
          link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          type?: string;
          link?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      coalition_profile_data: {
        Row: {
          user_id: string;
          hero_title: string | null;
          hero_subtitle: string | null;
          stat_active_coalitions: number;
          stat_counties_served: number;
          stat_active_projects: number;
          metric_coalition_members: number;
          metric_meetings_held: number;
          metric_projects_initiated: number;
          metric_residents_impacted: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          hero_title?: string | null;
          hero_subtitle?: string | null;
          stat_active_coalitions?: number;
          stat_counties_served?: number;
          stat_active_projects?: number;
          metric_coalition_members?: number;
          metric_meetings_held?: number;
          metric_projects_initiated?: number;
          metric_residents_impacted?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          hero_title?: string | null;
          hero_subtitle?: string | null;
          stat_active_coalitions?: number;
          stat_counties_served?: number;
          stat_active_projects?: number;
          metric_coalition_members?: number;
          metric_meetings_held?: number;
          metric_projects_initiated?: number;
          metric_residents_impacted?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      coalition_meetings: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          date: string | null;
          time: string | null;
          type: string;
          link: string | null;
          meeting_id: string | null;
          passcode: string | null;
          location: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          date?: string | null;
          time?: string | null;
          type?: string;
          link?: string | null;
          meeting_id?: string | null;
          passcode?: string | null;
          location?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          date?: string | null;
          time?: string | null;
          type?: string;
          link?: string | null;
          meeting_id?: string | null;
          passcode?: string | null;
          location?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      coalition_initiatives: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          status: string;
          progress: number;
          description: string | null;
          start_date: string | null;
          target_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          status?: string;
          progress?: number;
          description?: string | null;
          start_date?: string | null;
          target_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          status?: string;
          progress?: number;
          description?: string | null;
          start_date?: string | null;
          target_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      coalition_resources: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          type: string;
          link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          type?: string;
          link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          type?: string;
          link?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

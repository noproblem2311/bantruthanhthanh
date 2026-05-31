"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/types";

function roleDashboard(role: AppRole) {
  if (role === "admin") return "/admin";
  if (role === "manager") return "/manager";
  return "/parent";
}

export function HomeAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function redirectLoggedInUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,status")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!profile || profile.status !== "active" || cancelled) return;

      router.replace(roleDashboard(profile.role as AppRole));
    }

    void redirectLoggedInUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}

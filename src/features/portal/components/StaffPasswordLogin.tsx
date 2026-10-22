"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/infrastructure/supabase/client";
import { Field, Notice, PageHeader, Panel, ProductMark, SiteShell } from "@/shared/ui/patterns";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

export function StaffPasswordLogin() {
  const router = useRouter();
  const cache = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      cache.clear();
      setPassword("");
      const { data: member, error: memberError } = await supabase
        .from("staff_profiles")
        .select("role,is_active")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (memberError) throw new Error("Unable to verify staff access. Please try again.");
      if (!member?.is_active || !["ADMIN", "OPERATIONS", "DELIVERY_PERSON"].includes(member.role)) {
        throw new Error("This account has no active operations or driver membership.");
      }
      router.replace(member.role === "DELIVERY_PERSON" ? "/driver" : "/overview");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <SiteShell width="sm" brand={<ProductMark section="Staff sign-in" />}>
      <div className="space-y-6">
        <PageHeader
          title="Staff sign-in"
          description="Sign in with your assigned operations or driver account."
        />
        <Panel title="Staff account">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void signIn();
            }}
          >
            <Field label="Email" htmlFor="staff-email">
              <Input
                id="staff-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Password" htmlFor="staff-password">
              <Input
                id="staff-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            {error && (
              <Notice tone="error" role="alert">
                {error}
              </Notice>
            )}
            <Button type="submit" disabled={busy || !email.trim() || !password}>
              {busy ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Panel>
      </div>
    </SiteShell>
  );
}

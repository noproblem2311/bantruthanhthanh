"use client";

import { useActionState } from "react";
import { resetParentPasswordWithCredentialAction, type CredentialActionState } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: CredentialActionState = {};

export function ResetPasswordForm({ parentId, requestId }: { parentId: string; requestId?: string }) {
  const [state, formAction] = useActionState(resetParentPasswordWithCredentialAction, initialState);

  return (
    <div className="space-y-3">
      <form action={formAction} className="grid gap-3">
        <input type="hidden" name="parent_id" value={parentId} />
        <input type="hidden" name="password_reset_request_id" value={requestId || ""} />
        <div className="grid gap-2">
          <Label htmlFor={`new_password_${parentId}_${requestId || "direct"}`}>Mật khẩu mới</Label>
          <Input id={`new_password_${parentId}_${requestId || "direct"}`} name="new_password" type="password" minLength={8} required />
        </div>
        <SubmitButton pendingText="Đang đặt lại...">Đặt mật khẩu mới</SubmitButton>
      </form>
      {state.message ? <Alert variant={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      {state.ok && state.credentials ? (
        <div className="rounded-lg border bg-slate-50 p-3 font-mono text-sm">
          <p>Username: {state.credentials.username}</p>
          <p>Mật khẩu: {state.credentials.password}</p>
        </div>
      ) : null}
    </div>
  );
}

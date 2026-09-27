"use client";

import { useActionState } from "react";

import { AdminLoginView } from "@/components/admin/admin-login-view";

import { login } from "./actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return <AdminLoginView formAction={formAction} pending={pending} error={state?.error} />;
}

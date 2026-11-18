"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/auth";
import { clientIpFromForwardedFor } from "@/lib/client-ip";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const headersList = await headers();
  const ip = clientIpFromForwardedFor(headersList.get("x-forwarded-for"));

  if (!(await checkRateLimit(ip))) {
    return { error: "Pārāk daudz mēģinājumu. Mēģini vēlreiz pēc 10 minūtēm." };
  }

  const password = String(formData.get("password") ?? "");

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { error: "Nepareiza parole." };
  }

  await resetRateLimit(ip);
  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}

import { supabase } from "./supabase";

export async function backendRequest<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error("Sesi login habis. Silakan login kembali.");

  const response = await fetch(`/api/baileys/${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    cache: "no-store",
  });
  const payload = await response.json();

  if (!response.ok) {
    const requestError = new Error(payload.error || `Request gagal (${response.status})`);
    if (payload && typeof payload === "object") Object.assign(requestError, payload);
    throw requestError;
  }
  return payload as T;
}

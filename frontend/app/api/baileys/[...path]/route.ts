import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const allowedRoutes: Record<string, string[]> = {
  connect: ["POST"],
  disconnect: ["POST"],
  messages: ["GET"],
  "messages/recent": ["GET"],
  qr: ["GET"],
  send: ["POST"],
  settings: ["GET", "POST"],
  status: ["GET"],
};

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

async function proxyRequest(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const route = path.join("/");
  const method = request.method;
  const allowedMethods = allowedRoutes[route];

  if (!allowedMethods?.includes(method)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const backendUrl = process.env.BAILEYS_SERVICE_URL;
  const backendToken = process.env.BAILEYS_API_TOKEN || process.env.API_TOKEN;

  if (!supabaseUrl || !supabaseAnonKey || !backendUrl || !backendToken) {
    return NextResponse.json(
      { error: "Server authentication or backend configuration is missing" },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const allowedEmails = (process.env.BACKEND_ACCESS_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (
    allowedEmails.length === 0 ||
    !data.user.email ||
    !allowedEmails.includes(data.user.email.toLowerCase())
  ) {
    return NextResponse.json({ error: "Account is not authorized" }, { status: 403 });
  }

  let target: URL;
  try {
    target = new URL(`${backendUrl.replace(/\/+$/, "")}/${route}`);
  } catch {
    return NextResponse.json(
      { error: "BAILEYS_SERVICE_URL is invalid" },
      { status: 500 },
    );
  }
  if (!["http:", "https:"].includes(target.protocol)) {
    return NextResponse.json(
      { error: "BAILEYS_SERVICE_URL must use HTTP or HTTPS" },
      { status: 500 },
    );
  }
  target.search = new URL(request.url).search;

  try {
    const response = await fetch(target, {
      method,
      headers: {
        Authorization: `Bearer ${backendToken}`,
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      ...(method === "POST" ? { body: await request.text() } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (proxyError) {
    console.error("Baileys API proxy failed:", proxyError);
    return NextResponse.json(
      { error: "Baileys service is unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const serviceUrl = process.env.BAILEYS_SERVICE_URL;
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authorization bearer token is required" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!serviceUrl) {
    return NextResponse.json(
      { error: "BAILEYS_SERVICE_URL is not configured" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const response = await fetch(`${serviceUrl.replace(/\/+$/, "")}/qr`, {
      headers: { authorization },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to fetch WhatsApp QR from backend:", error);
    return NextResponse.json(
      { error: "Failed to reach the Baileys service" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

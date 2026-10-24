import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (
    !cronSecret ||
    request.headers.get("authorization") !== ("Bearer " + cronSecret)
  ) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const renderServiceUrl = process.env.RENDER_SERVICE_URL;

  if (!renderServiceUrl) {
    return NextResponse.json(
      { ok: false, error: "RENDER_SERVICE_URL is not configured" },
      { status: 500 },
    );
  }

  try {
    const healthUrl = `${renderServiceUrl.replace(/\/+$/, "")}/health`;
    const response = await fetch(healthUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Render service returned HTTP ${response.status}`,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to reach the Render service" },
      { status: 502 },
    );
  }
}

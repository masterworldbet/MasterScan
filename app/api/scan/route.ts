import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username ?? "").trim();

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    /*
      DEMO DATA ONLY

      Replace this section with the real Masterclass API / database lookup.
      The frontend intentionally waits 10 seconds before showing this result.
    */

    const result = {
      username,
      userStatus: "UNLOCKED" as const,
      winRate: "64.25%",
      winRateModified: "NO" as const,
      apiServer: "MASTERCLASS API",
      online: true
    };

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
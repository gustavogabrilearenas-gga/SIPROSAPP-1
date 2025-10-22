import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const access = req.cookies.get("access")?.value;
  if (access) return NextResponse.json({ ok: true });

  const refreshRes = await fetch(new URL("/api/auth/refresh", req.url), {
    method: "POST",
  });
  if (refreshRes.ok) return NextResponse.json({ ok: true });

  return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const access = req.cookies.get("access")?.value;
  if (access) return NextResponse.json({ ok: true });

  const refreshRes = await fetch(new URL("/api/auth/refresh", req.url), {
    method: "POST",
  });
  if (refreshRes.ok) return NextResponse.json({ ok: true });

  return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
}

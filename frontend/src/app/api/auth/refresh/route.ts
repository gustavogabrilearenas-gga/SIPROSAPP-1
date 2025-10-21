import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get("refresh")?.value;
  if (!refresh) return NextResponse.json({ detail: "No refresh" }, { status: 401 });

  const drf = await fetch(`${process.env.API_BASE_INTERNAL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  const data = await drf.json();
  if (!drf.ok) return NextResponse.json(data, { status: drf.status });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("access", data.access, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
  return res;
}

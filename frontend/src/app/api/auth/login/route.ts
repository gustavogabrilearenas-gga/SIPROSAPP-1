import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const drf = await fetch(`${process.env.API_BASE_INTERNAL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
  res.cookies.set("refresh", data.refresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
  return res;
}

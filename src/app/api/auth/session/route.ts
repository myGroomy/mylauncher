import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";

export async function GET() {
  const session = await getSession();
  return session ? NextResponse.json({ session }) : NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
}

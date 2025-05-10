import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "Missing url param" }, { status: 400 });
    }

    try {
        const upstream = await fetch(url);
        if (!upstream.ok) {
            return new NextResponse(null, { status: upstream.status });
        }

        return new NextResponse(upstream.body, {
            headers: {
                "Content-Type": upstream.headers.get("content-type") || "image/png",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch {
        return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
    }
}

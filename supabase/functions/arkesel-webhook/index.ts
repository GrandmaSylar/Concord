import { serve } from "std/http/server.ts";
import { getServiceRoleClient } from "../_shared/supabase.ts";

// Arkesel v2 Delivery Webhook Handler
serve(async (req: Request) => {
  let status = "";
  let phone = "";

  // Arkesel v2 sends a POST request with JSON
  if (req.method === "POST") {
    try {
      const body = await req.json();
      status = body.status || body.Status || "";
      phone = body.recipient || body.number || body.to || "";
    } catch (_e) {
      // Fallback in case they send urlencoded data
      const text = await req.text();
      const params = new URLSearchParams(text);
      status = params.get("status") || "";
      phone = params.get("recipient") || params.get("number") || "";
    }
  } else {
    // Fallback for GET requests
    const url = new URL(req.url);
    status = url.searchParams.get("status") || "";
    phone = url.searchParams.get("number") || url.searchParams.get("to") || "";
  }

  if (!status || !phone) {
    return new Response(JSON.stringify({ error: "Missing parameters" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Ensure phone has no plus sign or spaces
  phone = phone.replace("+", "").trim();

  let supabaseAdmin;
  try {
    supabaseAdmin = getServiceRoleClient();
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Map Arkesel's status to our database status
  let mappedStatus = "delivered";
  const normalizedStatus = status.toLowerCase();
  
  if (
    normalizedStatus.includes("fail") ||
    normalizedStatus.includes("reject") ||
    normalizedStatus.includes("undelivered") ||
    normalizedStatus.includes("expired")
  ) {
    mappedStatus = "failed";
  }

  try {
    const { data: recentMessages, error: fetchError } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("recipient", phone)
      .in("status", ["sent", "pending", "processing"]) 
      .order("sent_at", { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    if (recentMessages && recentMessages.length > 0) {
      const messageId = recentMessages[0].id;

      const { error: updateError } = await supabaseAdmin
        .from("messages")
        .update({ status: mappedStatus })
        .eq("id", messageId);

      if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ success: true, mappedStatus, phone }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Webhook DB update failed:", err);
    return new Response(
      JSON.stringify({ error: "Database update failed", details: (err as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

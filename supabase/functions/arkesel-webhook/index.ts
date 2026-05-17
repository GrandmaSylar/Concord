import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getServiceRoleClient } from "../_shared/supabase.ts";

// Arkesel Delivery Webhook Handler
serve(async (req) => {
  // Arkesel usually sends DLRs via GET parameters
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || url.searchParams.get("Status");
  let phone = url.searchParams.get("number") || url.searchParams.get("to");

  if (!status || !phone) {
    return new Response(JSON.stringify({ error: "Missing parameters" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Ensure phone has the plus sign if missing, or normalize to standard DB format
  phone = phone.replace("+", "");

  let supabaseAdmin;
  try {
    supabaseAdmin = getServiceRoleClient();
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
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
    // Because Arkesel v1 doesn't easily map unique message IDs, 
    // the safest fallback is to update the MOST RECENT message sent to this specific phone number.
    const { data: recentMessages, error: fetchError } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("recipient", phone)
      .in("status", ["sent", "pending", "processing"]) // Only update if it hasn't been finalized
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
  } catch (err: any) {
    console.error("Webhook DB update failed:", err);
    return new Response(
      JSON.stringify({ error: "Database update failed", details: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

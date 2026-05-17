import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { sendSMS } from "../_shared/arkesel.ts";
import { getServiceRoleClient } from "../_shared/supabase.ts";

serve(async (req) => {
  let supabaseAdmin;
  
  try {
    supabaseAdmin = getServiceRoleClient();
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Fetch up to 100 pending messages
    const { data: messages, error: fetchError } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("status", "pending")
      .limit(100);

    if (fetchError) throw fetchError;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending bulk messages to process" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Mark them as processing to prevent duplicate sends
    const messageIds = messages.map((m) => m.id);
    await supabaseAdmin
      .from("messages")
      .update({ status: "processing" })
      .in("id", messageIds);

    // 3. Group by identical content to save API requests
    const groupedMessages: Record<string, typeof messages> = {};
    for (const msg of messages) {
      if (!groupedMessages[msg.content]) {
        groupedMessages[msg.content] = [];
      }
      groupedMessages[msg.content].push(msg);
    }

    const results = [];

    // 4. Send each group via Arkesel
    for (const [content, msgs] of Object.entries(groupedMessages)) {
      const recipients = msgs.map((m) => m.recipient);
      const response = await sendSMS(recipients, content);

      const status = response?.success ? "sent" : "failed";
      const idsToUpdate = msgs.map((m) => m.id);

      await supabaseAdmin
        .from("messages")
        .update({ status })
        .in("id", idsToUpdate);

      results.push({ content, count: recipients.length, status });
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${messages.length} bulk messages`,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error in edge function:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

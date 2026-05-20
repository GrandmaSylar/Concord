import { serve } from "std/http/server.ts";
import { sendSMS } from "../_shared/arkesel.ts";
import { getServiceRoleClient } from "../_shared/supabase.ts";

interface Message {
  id: string;
  content: string;
  recipient: string;
  status: string;
  [key: string]: unknown;
}

serve(async () => {
  let supabaseAdmin;
  
  try {
    supabaseAdmin = getServiceRoleClient();
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
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

    const typedMessages = messages as Message[];

    // 2. Mark them as processing to prevent duplicate sends
    const messageIds = typedMessages.map((m) => m.id);
    await supabaseAdmin
      .from("messages")
      .update({ status: "processing" })
      .in("id", messageIds);

    // 3. Group by identical content AND sender_id to save API requests and preserve sender
    const groupedMessages: Record<string, { sender?: string; content: string; msgs: Message[] }> = {};
    for (const msg of typedMessages) {
      const sender = (msg.sender_id as string) || undefined;
      const key = `${sender || 'default'}::${msg.content}`;
      if (!groupedMessages[key]) {
        groupedMessages[key] = { sender, content: msg.content, msgs: [] };
      }
      groupedMessages[key].msgs.push(msg);
    }

    const results = [];

    // 4. Send each group via Arkesel
    for (const { sender, content, msgs } of Object.values(groupedMessages)) {
      const recipients = msgs.map((m) => m.recipient);
      const response = await sendSMS(recipients, content, sender);

      const status = response?.success ? "sent" : "failed";
      const idsToUpdate = msgs.map((m) => m.id);

      await supabaseAdmin
        .from("messages")
        .update({ status })
        .in("id", idsToUpdate);

      results.push({ content, sender, count: recipients.length, status });
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${typedMessages.length} bulk messages`,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Error in edge function:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "std/http/server.ts";
import { sendSMS } from "../_shared/arkesel.ts";
import { getServiceRoleClient } from "../_shared/supabase.ts";

interface Message {
  id: string;
  content: string;
  recipient: string;
  status: string;
  sender_id: string | null;
  [key: string]: unknown;
}

serve(async (req?: Request) => {
  const startTime = Date.now();
  
  let dryRun = false;
  let customTimeLimit = 12000;
  let customLatency = 0;

  try {
    if (req && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.dry_run === true) {
        dryRun = true;
      }
      if (typeof body.time_limit_ms === "number") {
        customTimeLimit = body.time_limit_ms;
      }
      if (typeof body.latency_ms === "number") {
        customLatency = body.latency_ms;
      }
    }
  } catch (_e) {
    // Ignore parse errors or non-POST requests
  }

  const TIME_LIMIT_MS = customTimeLimit;
  
  let supabaseAdmin;
  try {
    supabaseAdmin = getServiceRoleClient();
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let totalProcessed = 0;
  const results: Array<{ content: string; sender?: string; count: number; status: string }> = [];

  try {
    while (true) {
      // Keep-alive safety check
      if (Date.now() - startTime > TIME_LIMIT_MS) {
        console.warn("Approaching execution time limit. Breaking loop to prevent timeout.");
        
        // Asynchronously check for remaining pending records and trigger a self-chain call
        try {
          const { count, error: countError } = await supabaseAdmin
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending");

          if (!countError && count && count > 0) {
            console.info(`Auto-chaining execution: ${count} pending messages remaining.`);
            const selfUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1/process-messages";
            const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
            if (selfUrl && serviceRoleKey) {
              fetch(selfUrl, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${serviceRoleKey}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  dry_run: dryRun,
                  time_limit_ms: customTimeLimit,
                  latency_ms: customLatency
                })
              }).catch((e) => console.error("Failed to self-trigger process-messages:", e));
            }
          }
        } catch (err) {
          console.error("Error during auto-chain check:", err);
        }
        break;
      }

      // 1. Fetch up to 200 pending messages
      const { data: messages, error: fetchError } = await supabaseAdmin
        .from("messages")
        .select("*")
        .eq("status", "pending")
        .limit(200);

      if (fetchError) throw fetchError;

      if (!messages || messages.length === 0) {
        break; // Queue is fully drained!
      }

      const typedMessages = messages as Message[];
      const messageIds = typedMessages.map((m) => m.id);

      // 2. Mark them as processing to prevent double-sending
      await supabaseAdmin
        .from("messages")
        .update({ status: "processing" })
        .in("id", messageIds);

      // 3. Group by identical content AND sender_id to save API requests
      const groupedMessages: Record<string, { sender?: string; content: string; msgs: Message[] }> = {};
      for (const msg of typedMessages) {
        const sender = (msg.sender_id as string) || undefined;
        const key = `${sender || 'default'}::${msg.content}`;
        if (!groupedMessages[key]) {
          groupedMessages[key] = { sender, content: msg.content, msgs: [] };
        }
        groupedMessages[key].msgs.push(msg);
      }

      const groups = Object.values(groupedMessages);
      
      // 4. Send each group via Arkesel
      // For personalized campaigns, there will be many groups of 1 message each.
      // To prevent slow serial execution, we execute them in parallel chunks of 20 concurrent requests.
      const CHUNK_SIZE = 20;
      let haltedMidBatch = false;
      for (let i = 0; i < groups.length; i += CHUNK_SIZE) {
        // Double-safety check: If we're already running out of time during the chunks of this current batch!
        if (Date.now() - startTime > TIME_LIMIT_MS) {
          console.warn("Time limit reached during batch processing! Halting current batch mid-execution.");
          
          // Revert any unprocessed groups in this batch back to 'pending' in the database
          const remainingGroups = groups.slice(i);
          const remainingIds: string[] = [];
          for (const g of remainingGroups) {
            remainingIds.push(...g.msgs.map((m) => m.id));
          }
          if (remainingIds.length > 0) {
            await supabaseAdmin
              .from("messages")
              .update({ status: "pending" })
              .in("id", remainingIds);
          }
          haltedMidBatch = true;
          break;
        }

        const chunk = groups.slice(i, i + CHUNK_SIZE);
        
        await Promise.all(
          chunk.map(async ({ sender, content, msgs }) => {
            try {
              const recipients = msgs.map((m) => m.recipient);
              
              let response;
              if (dryRun) {
                if (customLatency > 0) {
                  await new Promise((resolve) => setTimeout(resolve, customLatency));
                }
                response = { success: true };
              } else {
                response = await sendSMS(recipients, content, sender);
              }

              const status = response?.success ? "sent" : "failed";
              const idsToUpdate = msgs.map((m) => m.id);

              await supabaseAdmin
                .from("messages")
                .update({ status })
                .in("id", idsToUpdate);

              results.push({ content: content.substring(0, 30), sender, count: recipients.length, status });
            } catch (err) {
              console.error("Failed to send message group:", err);
              const idsToUpdate = msgs.map((m) => m.id);
              await supabaseAdmin
                .from("messages")
                .update({ status: "failed" })
                .in("id", idsToUpdate);
            }
          })
        );
      }

      if (haltedMidBatch) {
        try {
          const { count, error: countError } = await supabaseAdmin
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending");

          if (!countError && count && count > 0) {
            console.info(`Auto-chaining execution (mid-batch halt): ${count} pending messages remaining.`);
            const selfUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1/process-messages";
            const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
            if (selfUrl && serviceRoleKey) {
              fetch(selfUrl, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${serviceRoleKey}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  dry_run: dryRun,
                  time_limit_ms: customTimeLimit,
                  latency_ms: customLatency
                })
              }).catch((e) => console.error("Failed to self-trigger process-messages:", e));
            }
          }
        } catch (err) {
          console.error("Error during auto-chain check:", err);
        }
        break;
      }

      totalProcessed += typedMessages.length;
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${totalProcessed} messages in this execution`,
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

import { serve } from "std/http/server.ts";
import { sendSMS } from "../_shared/arkesel.ts";
import { getServiceRoleClient } from "../_shared/supabase.ts";

interface Reminder {
  id: string;
  user_id: string;
  message: string;
  status: string;
  sender_id: string | null;
  contacts?: { phone: string };
  [key: string]: unknown;
}

serve(async () => {
  const startTime = Date.now();
  const TIME_LIMIT_MS = 12000; // 12 seconds safety threshold

  let supabaseAdmin;
  try {
    supabaseAdmin = getServiceRoleClient();
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let totalProcessed = 0;
  const results: Array<{ idRange: string[]; status: string; count: number }> = [];

  try {
    while (true) {
      // Keep-alive safety check
      if (Date.now() - startTime > TIME_LIMIT_MS) {
        console.warn(
          "Approaching execution time limit. Breaking loop to prevent timeout.",
        );

        // Asynchronously check for remaining pending due reminders and trigger a self-chain call
        try {
          const checkNow = new Date().toISOString();
          const { count, error: countError } = await supabaseAdmin
            .from("scheduled_reminders")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending")
            .lte("trigger_time", checkNow);

          if (!countError && count && count > 0) {
            console.info(
              `Auto-chaining execution: ${count} pending reminders remaining.`,
            );
            const selfUrl = Deno.env.get("SUPABASE_URL") +
              "/functions/v1/process-reminders";
            const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
            if (selfUrl && serviceRoleKey) {
              fetch(selfUrl, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${serviceRoleKey}`,
                  "Content-Type": "application/json",
                },
              }).catch((e) =>
                console.error("Failed to self-trigger process-reminders:", e)
              );
            }
          }
        } catch (err) {
          console.error("Error during auto-chain check:", err);
        }
        break;
      }

      // 1. Fetch pending reminders that are due
      const now = new Date().toISOString();
      const { data: reminders, error: fetchError } = await supabaseAdmin
        .from("scheduled_reminders")
        .select("*, contacts(phone)")
        .eq("status", "pending")
        .lte("trigger_time", now)
        .limit(200);

      if (fetchError) throw fetchError;

      if (!reminders || reminders.length === 0) {
        break; // All due reminders processed!
      }

      const typedReminders = reminders as Reminder[];
      const reminderIds = typedReminders.map((r) => r.id);

      // 2. Mark them as processing to prevent double-sending
      await supabaseAdmin
        .from("scheduled_reminders")
        .update({ status: "processing" })
        .in("id", reminderIds);

      // 3. Group by identical message AND sender_id to save network requests
      const groupedReminders: Record<
        string,
        { sender?: string; message: string; msgs: Reminder[] }
      > = {};
      for (const rem of typedReminders) {
        const sender = (rem.sender_id as string) || undefined;
        const key = `${sender || "default"}::${rem.message}`;
        if (!groupedReminders[key]) {
          groupedReminders[key] = { sender, message: rem.message, msgs: [] };
        }
        groupedReminders[key].msgs.push(rem);
      }

      const groups = Object.values(groupedReminders);

      // 4. Send each group via Arkesel
      // To handle personalized or custom reminders efficiently, we process in parallel chunks of 20 concurrent requests.
      const CHUNK_SIZE = 20;
      let haltedMidBatch = false;
      for (let i = 0; i < groups.length; i += CHUNK_SIZE) {
        // Double-safety check: If we're already running out of time during the chunks of this current batch!
        if (Date.now() - startTime > TIME_LIMIT_MS) {
          console.warn(
            "Time limit reached during batch processing! Halting current batch mid-execution.",
          );

          // Revert any unprocessed groups in this batch back to 'pending' in the database
          const remainingGroups = groups.slice(i);
          const remainingIds: string[] = [];
          for (const g of remainingGroups) {
            remainingIds.push(...g.msgs.map((m) => m.id));
          }
          if (remainingIds.length > 0) {
            await supabaseAdmin
              .from("scheduled_reminders")
              .update({ status: "pending" })
              .in("id", remainingIds);
          }
          haltedMidBatch = true;
          break;
        }

        const chunk = groups.slice(i, i + CHUNK_SIZE);

        await Promise.all(
          chunk.map(async ({ sender, message, msgs }) => {
            try {
              const recipients = msgs
                .map((m) => m.contacts?.phone)
                .filter((p): p is string => !!p);

              if (recipients.length === 0) {
                throw new Error(
                  "No valid phone numbers found for contact group",
                );
              }

              // Send via Arkesel in bulk
              const response = await sendSMS(recipients, message, sender);
              const status = response?.success ? "sent" : "failed";
              const idsToUpdate = msgs.map((m) => m.id);

              // Bulk update reminders status
              await supabaseAdmin
                .from("scheduled_reminders")
                .update({ status })
                .in("id", idsToUpdate);

              // Bulk insert logs into messages table
              const logs = msgs
                .filter((m) => m.contacts?.phone)
                .map((m) => ({
                  user_id: m.user_id,
                  recipient: m.contacts!.phone,
                  content: m.message,
                  sender_id: m.sender_id || null,
                  status,
                }));

              await supabaseAdmin.from("messages").insert(logs);

              results.push({
                idRange: idsToUpdate.slice(0, 3),
                status,
                count: recipients.length,
              });
            } catch (err: any) {
              console.error("Failed to process reminder group:", err);
              const idsToUpdate = msgs.map((m) => m.id);

              // Mark all in this group as failed
              await supabaseAdmin
                .from("scheduled_reminders")
                .update({ status: "failed" })
                .in("id", idsToUpdate);
            }
          }),
        );
      }

      if (haltedMidBatch) {
        try {
          const checkNow = new Date().toISOString();
          const { count, error: countError } = await supabaseAdmin
            .from("scheduled_reminders")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending")
            .lte("trigger_time", checkNow);

          if (!countError && count && count > 0) {
            console.info(
              `Auto-chaining execution (mid-batch halt): ${count} pending reminders remaining.`,
            );
            const selfUrl = Deno.env.get("SUPABASE_URL") +
              "/functions/v1/process-reminders";
            const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
            if (selfUrl && serviceRoleKey) {
              fetch(selfUrl, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${serviceRoleKey}`,
                  "Content-Type": "application/json",
                },
              }).catch((e) =>
                console.error("Failed to self-trigger process-reminders:", e)
              );
            }
          }
        } catch (err) {
          console.error("Error during auto-chain check:", err);
        }
        break;
      }

      totalProcessed += typedReminders.length;
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${totalProcessed} reminders in this execution`,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    console.error("Error in reminder processing cron:", err);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: (err as Error).message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

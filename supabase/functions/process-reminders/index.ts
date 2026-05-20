import { serve } from "std/http/server.ts";
import { sendSMS } from "../_shared/arkesel.ts";
import { getServiceRoleClient } from "../_shared/supabase.ts";

interface Reminder {
  id: string;
  user_id: string;
  message: string;
  status: string;
  contacts?: { phone: string };
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
    // 1. Fetch pending reminders that are due to be sent
    const now = new Date().toISOString();
    const { data: reminders, error: fetchError } = await supabaseAdmin
      .from("scheduled_reminders")
      .select("*, contacts(phone)")
      .eq("status", "pending")
      .lte("trigger_time", now)
      .limit(50); // Process in batches

    if (fetchError) throw fetchError;

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending reminders to process" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const typedReminders = reminders as Reminder[];

    // 2. Mark them as processing to prevent double-sending
    const reminderIds = typedReminders.map((r) => r.id);
    await supabaseAdmin
      .from("scheduled_reminders")
      .update({ status: "processing" })
      .in("id", reminderIds);

    // 3. Send the SMS messages
    const results = await Promise.all(
      typedReminders.map(async (reminder) => {
        try {
          const phone = reminder.contacts?.phone;
          if (!phone) throw new Error("No phone number found for contact");

          // Send via Arkesel
          const sender = (reminder.sender_id as string) || undefined;
          const response = await sendSMS([phone], reminder.message, sender);
          
          if (response && response.success) {
            // Success: Update reminder status
            await supabaseAdmin
              .from("scheduled_reminders")
              .update({ status: "sent" })
              .eq("id", reminder.id);

            // Also log to the main messages table
            await supabaseAdmin.from("messages").insert({
              user_id: reminder.user_id,
              recipient: phone,
              content: reminder.message,
              sender_id: reminder.sender_id || null,
              status: "sent",
            });

            return { id: reminder.id, status: "success" };
          } else {
            throw new Error("Arkesel API rejected the message");
          }
        } catch (err: unknown) {
          console.error(`Failed to send reminder ${reminder.id}:`, err);
          // Mark as failed
          await supabaseAdmin
            .from("scheduled_reminders")
            .update({ status: "failed" })
            .eq("id", reminder.id);

          return { id: reminder.id, status: "failed", error: (err as Error).message };
        }
      })
    );

    return new Response(
      JSON.stringify({
        message: `Processed ${typedReminders.length} reminders`,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    console.error("Error in reminder processing cron:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

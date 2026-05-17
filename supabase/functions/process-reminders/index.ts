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

    // 2. Mark them as processing to prevent double-sending
    const reminderIds = reminders.map((r) => r.id);
    await supabaseAdmin
      .from("scheduled_reminders")
      .update({ status: "processing" })
      .in("id", reminderIds);

    // 3. Send the SMS messages
    const results = await Promise.all(
      reminders.map(async (reminder) => {
        try {
          const phone = reminder.contacts?.phone;
          if (!phone) throw new Error("No phone number found for contact");

          // Send via Arkesel
          const response = await sendSMS([phone], reminder.message);
          
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
              status: "sent",
            });

            return { id: reminder.id, status: "success" };
          } else {
            throw new Error("Arkesel API rejected the message");
          }
        } catch (err: any) {
          console.error(`Failed to send reminder ${reminder.id}:`, err);
          // Mark as failed
          await supabaseAdmin
            .from("scheduled_reminders")
            .update({ status: "failed" })
            .eq("id", reminder.id);

          return { id: reminder.id, status: "failed", error: err.message };
        }
      })
    );

    return new Response(
      JSON.stringify({
        message: `Processed ${reminders.length} reminders`,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Error in reminder processing cron:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

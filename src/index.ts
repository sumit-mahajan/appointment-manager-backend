import express, { type Request, type Response } from "express";
import { supabase } from "./database/supabase.js";
import type { PatientInsert, AppointmentInsert } from "./models/index.js";

const app = express();

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ message: "OK" });
});

async function createDummyPatient() {
  // Type-safe patient insert
  const dummyPatient: PatientInsert = {
    name: "John Doe",
    contact: "555-0199",
  };

  const { data: patientData, error: patientError } = await supabase
    .from("patients")
    .insert([dummyPatient])
    .select()
    .single();

  if (patientError) {
    throw new Error(`Error creating patient: ${patientError.message}`);
  }

  // Type-safe appointment insert
  const dummyAppointment: AppointmentInsert = {
    patient_id: patientData.patient_id,
    start_datetime: new Date().toISOString(),
    duration_in_minutes: 30,
    is_emergency: false,
    is_follow_up_pending: true,
    status: "confirm",
    did_show_up: false,
  };

  const { data: appointmentData, error: appointmentError } = await supabase
    .from("appointments")
    .insert([dummyAppointment])
    .select()
    .single();

  if (appointmentError) {
    throw new Error(`Error creating appointment: ${appointmentError.message}`);
  }

  return { patient: patientData, appointment: appointmentData };
}

app.get("/", async (req: Request, res: Response) => {
  try {
    const result = await createDummyPatient();
    res.status(200).json({
      message: "Dummy patient and appointment created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});

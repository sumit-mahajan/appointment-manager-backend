import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Database } from "./database.types.js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key");
}

// Create a typed Supabase client with generated database types
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

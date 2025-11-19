
import { createClient } from '@supabase/supabase-js';

// NOTA: En un entorno real, estas variables deben estar en un archivo .env
// Para que esto funcione, el usuario debe reemplazar estas cadenas con sus credenciales de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'tu-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper para verificar si Supabase está configurado
export const isSupabaseConfigured = () => {
    return SUPABASE_URL !== 'https://tu-proyecto.supabase.co' && SUPABASE_ANON_KEY !== 'tu-anon-key';
};

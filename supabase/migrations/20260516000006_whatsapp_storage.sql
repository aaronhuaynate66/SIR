-- Bucket privado para exports de WhatsApp
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-exports',
  'whatsapp-exports',
  false,
  52428800,
  ARRAY['text/plain', 'text/x-log', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Usuarios solo pueden subir a su propia carpeta: {user_id}/...
CREATE POLICY "whatsapp_exports_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'whatsapp-exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios solo pueden leer sus propios archivos
CREATE POLICY "whatsapp_exports_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'whatsapp-exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden borrar sus propios archivos (y el servidor también)
CREATE POLICY "whatsapp_exports_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'whatsapp-exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

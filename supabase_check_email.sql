-- Fonction RPC pour vérifier si un email existe déjà dans auth.users
-- Usage: SELECT check_email_exists('email@example.com');
-- Retourne: true si l'email existe, false sinon

CREATE OR REPLACE FUNCTION check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier si l'email existe dans auth.users
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = email_to_check
  );
END;
$$;

-- Permissions: Autoriser l'exécution pour les utilisateurs authentifiés et anonymes
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO anon, authenticated;


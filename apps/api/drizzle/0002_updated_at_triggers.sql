-- Trigger function shared by all tables
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- sessions
CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- accounts
CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- verifications
CREATE TRIGGER verifications_updated_at
  BEFORE UPDATE ON verifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- meta_characters
CREATE TRIGGER meta_characters_updated_at
  BEFORE UPDATE ON meta_characters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- adventures
CREATE TRIGGER adventures_updated_at
  BEFORE UPDATE ON adventures
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Migration v2: Add owner_token to profiles and payment_orders table

-- Add owner_token to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS owner_token TEXT;
UPDATE profiles SET owner_token = encode(gen_random_bytes(32), 'hex') WHERE owner_token IS NULL;
ALTER TABLE profiles ALTER COLUMN owner_token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_owner_token ON profiles(owner_token);

-- Payment orders table
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 520,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'closed')),
  provider TEXT NOT NULL DEFAULT 'wechat',
  provider_order_id TEXT,
  provider_transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_message_id ON payment_orders(message_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_provider_order_id ON payment_orders(provider_order_id);

-- Enable RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Payment orders policies
CREATE POLICY "Payment orders viewable by everyone" ON payment_orders FOR SELECT USING (true);
CREATE POLICY "Anyone can create payment orders" ON payment_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payment orders" ON payment_orders FOR UPDATE USING (true);

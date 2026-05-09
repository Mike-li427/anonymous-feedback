-- Visitors table
CREATE TABLE visitors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  visitor_token TEXT NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  contact_info TEXT,
  revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats table
CREATE TABLE chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  visitor_token TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('owner', 'visitor')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_visitors_profile_id ON visitors(profile_id);
CREATE INDEX idx_visitors_visitor_token ON visitors(visitor_token);
CREATE INDEX idx_visitors_created_at ON visitors(created_at DESC);
CREATE INDEX idx_chats_profile_id ON chats(profile_id);
CREATE INDEX idx_chats_visitor_token ON chats(visitor_token);
CREATE INDEX idx_chats_created_at ON chats(created_at);

-- Enable RLS
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Visitors policies
CREATE POLICY "Visitors viewable by profile owner" ON visitors
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert visitors" ON visitors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Profile owner can update visitors" ON visitors
  FOR UPDATE USING (true);

-- Chats policies
CREATE POLICY "Chats viewable by participants" ON chats
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert chats" ON chats
  FOR INSERT WITH CHECK (true);

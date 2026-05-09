-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nickname TEXT NOT NULL,
  bio TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('anonymous', 'revealable')),
  revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reveal profiles table
CREATE TABLE reveal_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  contact_hint TEXT,
  intro TEXT,
  consent_reveal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
CREATE INDEX idx_profiles_slug ON profiles(slug);
CREATE INDEX idx_messages_profile_id ON messages(profile_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_reveal_profiles_message_id ON reveal_profiles(message_id);
CREATE INDEX idx_visitors_profile_id ON visitors(profile_id);
CREATE INDEX idx_visitors_visitor_token ON visitors(visitor_token);
CREATE INDEX idx_visitors_created_at ON visitors(created_at DESC);
CREATE INDEX idx_chats_profile_id ON chats(profile_id);
CREATE INDEX idx_chats_visitor_token ON chats(visitor_token);
CREATE INDEX idx_chats_created_at ON chats(created_at);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reveal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can create profiles" ON profiles FOR INSERT WITH CHECK (true);

-- Messages policies
CREATE POLICY "Messages are viewable by everyone" ON messages FOR SELECT USING (true);
CREATE POLICY "Anyone can create messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Profile owners can update messages" ON messages FOR UPDATE USING (true);

-- Reveal profiles policies
CREATE POLICY "Reveal profiles viewable when message is revealed" ON reveal_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM messages WHERE messages.id = reveal_profiles.message_id AND messages.revealed = true)
);
CREATE POLICY "Anyone can create reveal profiles" ON reveal_profiles FOR INSERT WITH CHECK (true);

-- Visitors policies
CREATE POLICY "Visitors viewable by everyone" ON visitors FOR SELECT USING (true);
CREATE POLICY "Anyone can insert visitors" ON visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Profile owner can update visitors" ON visitors FOR UPDATE USING (true);

-- Chats policies
CREATE POLICY "Chats viewable by participants" ON chats FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chats" ON chats FOR INSERT WITH CHECK (true);

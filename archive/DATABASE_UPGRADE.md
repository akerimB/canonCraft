# Phase 2 Database Architecture Upgrade

## Overview
You were absolutely right! The original AsyncStorage approach was too simplistic for the complex relational data we're managing in InCharacter. We've implemented a comprehensive SQLite database solution that provides:

- **Proper relational data management**
- **Complex queries for memory context building**
- **Multiple story session support**
- **Performance optimization with indexes**
- **Data integrity and consistency**

## Database Schema

### Core Tables

#### 1. **story_sessions** - Track Different Playthroughs
```sql
CREATE TABLE story_sessions (
  id TEXT PRIMARY KEY,                    -- Unique session identifier
  character_pack_id TEXT NOT NULL,       -- Character being played
  character_name TEXT NOT NULL,          -- Character display name
  title TEXT NOT NULL,                   -- Story title
  current_scene_number INTEGER DEFAULT 1, -- Current progress
  story_phase TEXT DEFAULT 'setup',      -- Narrative phase
  persona_score REAL DEFAULT 50.0,       -- Character authenticity score
  total_decisions INTEGER DEFAULT 0,     -- Decision count
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,           -- Soft delete flag
  metadata TEXT                          -- JSON blob for character pack data
);
```

#### 2. **characters** - All Characters in Story Universe
```sql
CREATE TABLE characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  character_type TEXT DEFAULT 'npc',     -- 'player', 'npc', 'supporting'
  current_state TEXT DEFAULT 'alive',    -- 'alive', 'dead', 'injured', 'missing'
  emotional_state TEXT DEFAULT 'neutral',
  emotional_intensity REAL DEFAULT 50.0,
  confidence_level REAL DEFAULT 50.0,
  stress_level REAL DEFAULT 0.0,
  location TEXT,
  last_seen_scene INTEGER,
  character_data TEXT,                   -- JSON blob for traits
  FOREIGN KEY (story_session_id) REFERENCES story_sessions(id) ON DELETE CASCADE,
  UNIQUE(story_session_id, name)
);
```

#### 3. **character_relationships** - Track Character Dynamics
```sql
CREATE TABLE character_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_session_id TEXT NOT NULL,
  character_a_id INTEGER NOT NULL,
  character_b_id INTEGER NOT NULL,
  affection REAL DEFAULT 50.0,          -- How much A likes B
  trust REAL DEFAULT 50.0,              -- How much A trusts B
  respect REAL DEFAULT 50.0,            -- How much A respects B
  fear REAL DEFAULT 0.0,                -- How much A fears B
  romantic_interest REAL DEFAULT 0.0,   -- Romantic attraction
  rivalry REAL DEFAULT 0.0,             -- Competitive tension
  interaction_count INTEGER DEFAULT 0,  -- Number of interactions
  last_interaction_scene INTEGER,
  relationship_type TEXT DEFAULT 'neutral', -- 'friend', 'enemy', 'romantic', 'family'
  FOREIGN KEY (story_session_id) REFERENCES story_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (character_a_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (character_b_id) REFERENCES characters(id) ON DELETE CASCADE,
  UNIQUE(story_session_id, character_a_id, character_b_id)
);
```

#### 4. **story_events** - All Significant Story Events
```sql
CREATE TABLE story_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,             -- 'character_death', 'betrayal', 'romance', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  scene_number INTEGER NOT NULL,
  importance_level INTEGER NOT NULL,    -- 1-4 (low to critical)
  player_action TEXT,                   -- What the player did
  ai_response TEXT,                     -- How the AI responded
  emotional_impact TEXT,                -- JSON blob
  plot_significance TEXT,
  witnesses TEXT,                       -- JSON array of character names who saw this
  event_data TEXT,                      -- JSON blob for additional data
  FOREIGN KEY (story_session_id) REFERENCES story_sessions(id) ON DELETE CASCADE
);
```

#### 5. **memory_context_cache** - Pre-built AI Context
```sql
CREATE TABLE memory_context_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_session_id TEXT NOT NULL,
  context_type TEXT NOT NULL,          -- 'full', 'recent', 'critical', 'relationships'
  scene_number INTEGER NOT NULL,
  context_data TEXT NOT NULL,          -- Formatted context string for AI
  character_states TEXT,               -- JSON blob of current character states
  relationship_summary TEXT,           -- JSON blob of relationship states
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,                 -- Cache invalidation
  FOREIGN KEY (story_session_id) REFERENCES story_sessions(id) ON DELETE CASCADE
);
```

## Key Features

### 1. **Character State Tracking**
- **Alive/Dead States**: Characters marked as dead cannot interact
- **Witness Tracking**: Who saw what events
- **Emotional States**: Track character mood and stress levels
- **Location Tracking**: Where characters are in the story world

### 2. **Relationship Matrix**
- **Multi-dimensional relationships**: Affection, trust, respect, fear, romance, rivalry
- **Dynamic updates**: Relationships change based on events
- **Interaction history**: Track how often characters interact

### 3. **Event Classification**
```javascript
const EVENT_TYPES = {
  MAJOR_DECISION: 'major_decision',
  CHARACTER_DEATH: 'character_death',
  CHARACTER_INTERACTION: 'character_interaction',
  RELATIONSHIP_CHANGE: 'relationship_change',
  PLOT_DEVELOPMENT: 'plot_development',
  EMOTIONAL_MOMENT: 'emotional_moment',
  MILESTONE: 'milestone',
  BETRAYAL: 'betrayal',
  ROMANCE: 'romance',
  CONFLICT: 'conflict',
  DISCOVERY: 'discovery'
};
```

### 4. **Importance Levels**
```javascript
const IMPORTANCE_LEVELS = {
  LOW: 1,        // Background events
  MEDIUM: 2,     // Standard interactions
  HIGH: 3,       // Significant developments
  CRITICAL: 4    // Deaths, betrayals, major plot points
};
```

## Memory Context Building

The database builds sophisticated memory context for AI generation:

```
STORY MEMORY CONTEXT (AI MUST FOLLOW EXACTLY):

⚠️ CRITICAL EVENTS THAT MUST BE REMEMBERED:
1. Scene 3: Watson's Death [CHARACTER DEAD]
   Holmes watches in horror as Watson is killed by Moriarty
   Witnesses: Holmes, Mrs. Hudson

CURRENT CHARACTER STATES:
💀 Dr. Watson: DEAD - CANNOT INTERACT OR SPEAK
👤 Mrs. Hudson: ALIVE
👤 Inspector Lestrade: ALIVE

KEY RELATIONSHIPS:
- Holmes ↔ Mrs. Hudson: Close (15 interactions)
- Holmes ↔ Inspector Lestrade: Neutral (8 interactions)

🚨 MANDATORY: AI must acknowledge all character states and events. Dead characters CANNOT appear alive!
```

## Performance Optimizations

### Indexes for Fast Queries
```sql
CREATE INDEX idx_story_sessions_active ON story_sessions(is_active);
CREATE INDEX idx_characters_session ON characters(story_session_id);
CREATE INDEX idx_characters_state ON characters(current_state);
CREATE INDEX idx_events_session_scene ON story_events(story_session_id, scene_number);
CREATE INDEX idx_events_importance ON story_events(importance_level);
CREATE INDEX idx_relationships_session ON character_relationships(story_session_id);
```

### Context Caching
- **Pre-built contexts** cached for performance
- **Expiration times** for cache invalidation
- **Formatted strings** ready for AI consumption

## World-Specific Character Initialization

Each literary world comes with pre-populated characters:

### Sherlock Holmes World
- Dr. Watson (supporting)
- Mrs. Hudson (NPC)
- Inspector Lestrade (NPC)
- Professor Moriarty (NPC)

### Pride and Prejudice World
- Jane Bennet (supporting)
- Mr. Darcy (supporting)
- Mr. Bingley (supporting)
- Mr. Wickham (NPC)
- Charlotte Lucas (NPC)

### Dracula World
- Renfield (supporting)
- Van Helsing (NPC)
- Mina Harker (NPC)
- Jonathan Harker (NPC)

## Migration from AsyncStorage

### Before (AsyncStorage)
```javascript
// Simple flat storage
{
  "storyMemory": {
    "events": [...],
    "relationships": {...}
  }
}
```

### After (SQLite Database)
```javascript
// Relational structure with foreign keys
story_sessions ←→ characters ←→ character_relationships
     ↓                ↓
story_events ←→ character_interactions
     ↓
memory_context_cache
```

## Benefits Achieved

### 1. **Data Integrity**
- Foreign key constraints prevent orphaned data
- UNIQUE constraints prevent duplicate relationships
- Proper data types and validation

### 2. **Complex Queries**
```sql
-- Get all living characters who witnessed a death
SELECT DISTINCT c.name 
FROM characters c
JOIN story_events e ON JSON_EXTRACT(e.witnesses, '$') LIKE '%' || c.name || '%'
WHERE c.current_state = 'alive' 
  AND e.event_type = 'character_death'
  AND c.story_session_id = ?;
```

### 3. **Multiple Story Support**
- Run multiple concurrent stories
- Each story completely isolated
- Easy save/load functionality

### 4. **Performance**
- Indexed queries for fast lookups
- Context caching reduces computation
- Efficient memory usage

### 5. **Analytics**
```sql
-- Story statistics
SELECT 
  COUNT(*) as total_events,
  SUM(CASE WHEN importance_level >= 3 THEN 1 ELSE 0 END) as critical_events,
  COUNT(DISTINCT CASE WHEN current_state = 'alive' THEN characters.name END) as living_characters,
  COUNT(DISTINCT CASE WHEN current_state = 'dead' THEN characters.name END) as dead_characters
FROM story_events 
LEFT JOIN characters ON story_events.story_session_id = characters.story_session_id
WHERE story_events.story_session_id = ?;
```

## Future Extensibility

The database schema supports future Phase 3+ features:

- **Plot thread tracking** (already implemented)
- **Character interaction analysis**
- **Story branching and timelines**
- **Cross-story character analysis**
- **AI training data collection**

## Usage in Code

### Initialize Database Story
```javascript
const memoryInit = await databaseMemory.initializeStory(characterPack);
// Creates session, initializes world characters, sets up relationships
```

### Record Events
```javascript
const memoryEvent = createMemoryEvent('character_death', {
  title: 'Watson Dies',
  description: 'Watson is killed by Moriarty in front of Holmes',
  witnesses: ['Holmes', 'Mrs. Hudson'],
  importance: IMPORTANCE_LEVELS.CRITICAL
});
await databaseMemory.recordMemory(memoryEvent);
```

### Get AI Context
```javascript
const context = await databaseMemory.getStoryContext({ sceneNumber: 5 });
// Returns formatted context with character states, relationships, critical events
```

## Result

The database upgrade solves the original memory consistency problem by:

1. **Persistent Character States**: Dead characters stay dead
2. **Witness Memory**: Characters remember what they saw
3. **Relationship Tracking**: Dynamic character interactions
4. **Event Importance**: Critical events never forgotten
5. **Multi-story Support**: Multiple concurrent narratives
6. **Performance**: Fast, indexed queries

Your suggestion was spot-on – we now have a proper relational foundation for complex interactive fiction! 🎭📚 
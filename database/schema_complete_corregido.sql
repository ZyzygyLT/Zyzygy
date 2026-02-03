-- ============================================
-- ECHOES DUNGEON - COMPLETE DATABASE SCHEMA
-- VERSIÓN CORREGIDA - SIN PALABRAS RESERVADAS
-- ============================================

-- ============================================
-- 0. PRIMERO: TABLAS SIN DEPENDENCIAS
-- ============================================

-- RAZAS (Races)
CREATE TABLE races (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(32) NOT NULL UNIQUE,
    description TEXT,
    base_hp INT DEFAULT 100,
    base_mp INT DEFAULT 50,
    stat_bonuses JSON,
    racial_ability VARCHAR(64),
    ability_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CLASES (Classes)
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(32) NOT NULL UNIQUE,
    tier ENUM('Beginner', 'Intermediate', 'Premium') DEFAULT 'Beginner',
    description TEXT,
    primary_stats JSON,
    stat_growth JSON,
    hp_per_con INT DEFAULT 12,
    mp_per_will INT DEFAULT 8,
    max_skills INT DEFAULT 20,
    base_armor INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- LOOT TABLES (DEBE CREARSE ANTES DE ENEMIES)
CREATE TABLE loot_tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    loot_type ENUM('Enemy', 'Chest', 'Boss', 'Quest', 'Random') DEFAULT 'Enemy',
    min_gold INT DEFAULT 0,
    max_gold INT DEFAULT 0,
    guaranteed_drops JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ITEMS (Todos los ítems del juego)
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    item_type ENUM(
        'Weapon', 'Armor', 'Accessory', 'Consumable', 
        'Material', 'Quest', 'Recipe', 'Special'
    ) NOT NULL,
    rarity ENUM('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic') DEFAULT 'Common',
    
    -- Item stats
    required_level INT DEFAULT 1,
    required_class_id INT NULL,
    required_race_id INT NULL,
    
    -- Equipment stats
    stat_bonuses JSON,
    damage_min INT DEFAULT 0,
    damage_max INT DEFAULT 0,
    armor_value INT DEFAULT 0,
    durability_max INT DEFAULT 100,
    socket_count INT DEFAULT 0,
    
    -- Consumable effects
    consumable_effect JSON,
    
    -- Stacking & Trading
    max_stack INT DEFAULT 1,
    is_tradable BOOLEAN DEFAULT TRUE,
    is_sellable BOOLEAN DEFAULT TRUE,
    base_value INT DEFAULT 0,
    
    -- Visual/Gameplay
    icon VARCHAR(128),
    description TEXT,
    flavor_text TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (required_class_id) REFERENCES classes(id),
    FOREIGN KEY (required_race_id) REFERENCES races(id),
    
    INDEX idx_type_rarity (item_type, rarity),
    INDEX idx_required_level (required_level)
);

-- ============================================
-- 1. CORE TABLES - JUGADORES
-- ============================================

-- PLAYERS (usuarios/jugadores)
CREATE TABLE players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Character attributes
    race_id INT NOT NULL,
    class_id INT NOT NULL,
    character_name VARCHAR(32) NOT NULL UNIQUE,
    gender ENUM('Male', 'Female', 'Other') DEFAULT 'Other',
    level INT DEFAULT 1,
    current_exp BIGINT DEFAULT 0,
    next_level_exp BIGINT DEFAULT 1000,
    
    -- Core stats
    strength INT DEFAULT 10,
    dexterity INT DEFAULT 10,
    agility INT DEFAULT 10,
    constitution INT DEFAULT 10,
    intelligence INT DEFAULT 10,
    perception INT DEFAULT 10,
    willpower INT DEFAULT 10,
    
    -- Calculated stats
    max_hp INT DEFAULT 0,
    current_hp INT DEFAULT 0,
    max_mp INT DEFAULT 0,
    current_mp INT DEFAULT 0,
    armor INT DEFAULT 0,
    
    -- Resources
    gold BIGINT DEFAULT 1000,
    premium_currency INT DEFAULT 0,
    
    -- Progression
    talent_points INT DEFAULT 0,
    skill_points INT DEFAULT 0,
    
    -- Status
    status ENUM('active', 'inactive', 'banned', 'deleted') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    last_activity TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (race_id) REFERENCES races(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    
    -- Indexes
    INDEX idx_level (level),
    INDEX idx_class_race (class_id, race_id),
    INDEX idx_status (status),
    INDEX idx_last_activity (last_activity)
);

-- ============================================
-- 2. SKILLS SYSTEM
-- ============================================

-- HABILIDADES (Skills)
CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    class_id INT,
    tier ENUM('Basic', 'Advanced', 'Master', 'Ultimate') DEFAULT 'Basic',
    required_level INT DEFAULT 1,
    prerequisite_skill_id INT NULL,
    max_level INT DEFAULT 10,
    
    -- Skill mechanics
    effect_type ENUM('Damage', 'Heal', 'Buff', 'Debuff', 'Utility', 'Defensive', 'Summon'),
    damage_type ENUM('Physical', 'Magic', 'True', 'Fire', 'Ice', 'Lightning', 'Holy', 'Dark') NULL,
    formula VARCHAR(255),
    base_value INT DEFAULT 0,
    scaling_stat ENUM('strength', 'dexterity', 'agility', 'constitution', 'intelligence', 'perception', 'willpower') NULL,
    scaling_factor DECIMAL(5,3) DEFAULT 1.0,
    
    -- Resource costs
    hp_cost INT DEFAULT 0,
    mp_cost INT DEFAULT 0,
    stamina_cost INT DEFAULT 0,
    
    -- Cooldowns & limitations
    cooldown_turns INT DEFAULT 0,
    max_uses_per_battle INT DEFAULT 0,
    target_type ENUM('Self', 'Single', 'Multiple', 'All', 'Area') DEFAULT 'Single',
    skill_range INT DEFAULT 1, -- Cambiado de 'range' (palabra reservada)
    
    -- Metadata
    description TEXT,
    icon VARCHAR(128),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (prerequisite_skill_id) REFERENCES skills(id),
    
    -- Indexes
    INDEX idx_class_tier (class_id, tier),
    INDEX idx_required_level (required_level),
    INDEX idx_effect_type (effect_type)
);

-- PLAYER SKILLS (Skills aprendidos)
CREATE TABLE player_skills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    skill_id INT NOT NULL,
    skill_level INT DEFAULT 1,
    experience INT DEFAULT 0,
    next_level_exp INT DEFAULT 100,
    is_equipped BOOLEAN DEFAULT FALSE,
    slot_number INT DEFAULT 0,
    uses_count INT DEFAULT 0,
    last_used TIMESTAMP NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_player_skill (player_id, skill_id),
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id),
    
    INDEX idx_player_equipped (player_id, is_equipped),
    INDEX idx_skill_level (skill_id, skill_level)
);

-- ============================================
-- 3. COMBAT & DUNGEONS
-- ============================================

-- ENEMIGOS (DEBE CREARSE ANTES DE DUNGEON_ROOMS)
CREATE TABLE enemies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    level INT DEFAULT 1,
    
    -- Base stats
    strength INT DEFAULT 10,
    dexterity INT DEFAULT 10,
    agility INT DEFAULT 10,
    constitution INT DEFAULT 10,
    intelligence INT DEFAULT 10,
    perception INT DEFAULT 10,
    willpower INT DEFAULT 10,
    
    -- Calculated stats
    base_hp INT DEFAULT 0,
    base_mp INT DEFAULT 0,
    base_armor INT DEFAULT 0,
    base_damage INT DEFAULT 10,
    
    -- Resistances
    resistances JSON,
    
    -- Rewards
    exp_reward INT DEFAULT 0,
    gold_reward INT DEFAULT 0,
    loot_table_id INT NULL,
    
    -- AI & Behavior
    ai_behavior ENUM('Aggressive', 'Defensive', 'Balanced', 'Support', 'Boss') DEFAULT 'Aggressive',
    skill_weights JSON,
    threat_level ENUM('Minion', 'Elite', 'MiniBoss', 'Boss', 'WorldBoss') DEFAULT 'Minion',
    
    -- Visual/Gameplay
    sprite VARCHAR(128),
    size ENUM('Small', 'Medium', 'Large', 'Huge') DEFAULT 'Medium',
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (loot_table_id) REFERENCES loot_tables(id),
    INDEX idx_level_threat (level, threat_level),
    INDEX idx_behavior (ai_behavior)
);

-- MAZMORRAS (Dungeons)
CREATE TABLE dungeons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    min_level INT DEFAULT 1,
    max_level INT DEFAULT 10,
    recommended_party_size INT DEFAULT 5,
    max_rooms INT DEFAULT 5,
    difficulty ENUM('Easy', 'Normal', 'Hard', 'Epic', 'Legendary') DEFAULT 'Normal',
    base_exp_reward INT DEFAULT 100,
    base_gold_reward INT DEFAULT 50,
    completion_bonus JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ROOMS DE MAZMORRAS
CREATE TABLE dungeon_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dungeon_id INT NOT NULL,
    room_number INT NOT NULL,
    name VARCHAR(64),
    description TEXT,
    is_boss_room BOOLEAN DEFAULT FALSE,
    boss_enemy_id INT NULL,
    terrain_type ENUM('Normal', 'Forest', 'Cave', 'Ruins', 'BossArena') DEFAULT 'Normal',
    environmental_effects JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(id) ON DELETE CASCADE,
    FOREIGN KEY (boss_enemy_id) REFERENCES enemies(id),
    
    UNIQUE KEY unique_dungeon_room (dungeon_id, room_number),
    INDEX idx_dungeon_order (dungeon_id, room_number)
);

-- SPAWN TABLES (Qué enemigos aparecen en cada room)
CREATE TABLE spawn_tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    enemy_id INT NOT NULL,
    min_count INT DEFAULT 1,
    max_count INT DEFAULT 3,
    spawn_chance DECIMAL(5,2) DEFAULT 100.00,
    spawn_formation ENUM('Front', 'Back', 'Flank', 'Surround', 'Random') DEFAULT 'Random',
    is_miniboss BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (room_id) REFERENCES dungeon_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (enemy_id) REFERENCES enemies(id),
    
    INDEX idx_room (room_id),
    INDEX idx_enemy (enemy_id)
);

-- ============================================
-- 4. ITEMS & LOOT (CONTINUACIÓN)
-- ============================================

-- LOOT TABLE ENTRIES
CREATE TABLE loot_table_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loot_table_id INT NOT NULL,
    item_id INT NOT NULL,
    drop_chance DECIMAL(5,2) NOT NULL,
    min_quantity INT DEFAULT 1,
    max_quantity INT DEFAULT 1,
    required_player_level INT DEFAULT 1,
    weight INT DEFAULT 100,
    
    FOREIGN KEY (loot_table_id) REFERENCES loot_tables(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id),
    
    UNIQUE KEY unique_loot_item (loot_table_id, item_id),
    INDEX idx_loot_table (loot_table_id)
);

-- PLAYER INVENTORY
CREATE TABLE player_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT DEFAULT 1,
    equipped BOOLEAN DEFAULT FALSE,
    slot_type ENUM('Weapon', 'Armor', 'Accessory', 'Consumable', 'Material') NULL,
    durability INT DEFAULT 100,
    is_stashed BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bound_to_player BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id),
    
    INDEX idx_player_active (player_id, is_stashed, equipped),
    INDEX idx_player_item (player_id, item_id),
    INDEX idx_equipped (player_id, equipped)
);

-- ============================================
-- 5. PARTIES & COMBAT
-- ============================================

-- PARTIES (Grupos de jugadores)
CREATE TABLE parties (
    id VARCHAR(64) PRIMARY KEY,
    dungeon_id INT NOT NULL,
    current_room_id INT NULL,
    status ENUM('forming', 'in_progress', 'completed', 'wiped', 'abandoned') DEFAULT 'forming',
    
    -- Party settings
    is_public BOOLEAN DEFAULT FALSE,
    min_level INT DEFAULT 1,
    max_level INT DEFAULT 100,
    required_item_id INT NULL,
    
    -- Combat state
    current_tick INT DEFAULT 0,
    current_round INT DEFAULT 1,
    is_in_combat BOOLEAN DEFAULT FALSE,
    combat_started_at TIMESTAMP NULL,
    
    -- Metadata
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(id),
    FOREIGN KEY (current_room_id) REFERENCES dungeon_rooms(id),
    FOREIGN KEY (created_by) REFERENCES players(id),
    FOREIGN KEY (required_item_id) REFERENCES items(id),
    
    INDEX idx_status_created (status, created_at),
    INDEX idx_public (is_public, min_level, max_level)
);

-- PARTY MEMBERS
CREATE TABLE party_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    party_id VARCHAR(64) NOT NULL,
    player_id INT NOT NULL,
    
    -- Positioning
    position ENUM('Front', 'MidFront', 'Mid', 'MidBack', 'Back') DEFAULT 'Mid',
    slot_index INT DEFAULT 0,
    
    -- Combat status
    is_ready BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    pending_action JSON NULL,
    action_cooldown JSON,
    
    -- Performance tracking
    damage_dealt BIGINT DEFAULT 0,
    damage_taken BIGINT DEFAULT 0,
    healing_done BIGINT DEFAULT 0,
    kills INT DEFAULT 0,
    
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_party_player (party_id, player_id),
    INDEX idx_party_position (party_id, position, slot_index),
    INDEX idx_player_parties (player_id, joined_at)
);

-- COMBAT LOGS
CREATE TABLE combat_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    party_id VARCHAR(64) NOT NULL,
    tick_number INT NOT NULL,
    round_number INT NOT NULL,
    
    -- Actor info
    actor_id INT NOT NULL,
    actor_type ENUM('player', 'enemy') NOT NULL,
    actor_name VARCHAR(64) NOT NULL,
    
    -- Target info
    target_id INT NULL,
    target_type ENUM('player', 'enemy') NULL,
    target_name VARCHAR(64) NULL,
    
    -- Action details
    action_type ENUM('attack', 'skill', 'heal', 'buff', 'debuff', 'move', 'item', 'flee', 'death') NOT NULL,
    skill_id INT NULL,
    item_id INT NULL,
    
    -- Results
    damage_dealt INT DEFAULT 0,
    damage_type VARCHAR(32) NULL,
    healing_done INT DEFAULT 0,
    status_effects_applied JSON,
    status_effects_removed JSON,
    
    -- Critical & special
    is_critical BOOLEAN DEFAULT FALSE,
    is_dodge BOOLEAN DEFAULT FALSE,
    is_block BOOLEAN DEFAULT FALSE,
    is_miss BOOLEAN DEFAULT FALSE,
    
    -- Resource changes
    hp_change INT DEFAULT 0,
    mp_change INT DEFAULT 0,
    final_hp INT DEFAULT 0,
    final_mp INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id),
    FOREIGN KEY (item_id) REFERENCES items(id),
    
    INDEX idx_party_tick (party_id, tick_number DESC),
    INDEX idx_actor (actor_id, actor_type, created_at),
    INDEX idx_player_combat (actor_id, created_at)
);

-- ============================================
-- 6. TICK SYSTEM & SCHEDULING
-- ============================================

-- TICK SCHEDULE
CREATE TABLE tick_schedule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tick_number INT UNIQUE NOT NULL,
    scheduled_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    
    -- Processing stats
    parties_processed INT DEFAULT 0,
    combats_resolved INT DEFAULT 0,
    loot_generated INT DEFAULT 0,
    exp_distributed BIGINT DEFAULT 0,
    
    -- Error tracking
    errors JSON,
    warnings JSON,
    processing_time_ms INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    INDEX idx_status_scheduled (status, scheduled_time),
    INDEX idx_tick_number (tick_number DESC)
);

-- PLAYER TICK ACTIONS
CREATE TABLE player_tick_actions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    party_id VARCHAR(64) NULL,
    tick_number INT NOT NULL,
    
    -- Action to execute
    action_type ENUM('skill', 'attack', 'defend', 'item', 'flee', 'wait') NOT NULL,
    skill_id INT NULL,
    item_id INT NULL,
    target_type ENUM('self', 'enemy', 'ally') DEFAULT 'enemy',
    target_id INT NULL,
    target_position INT NULL,
    
    -- Priority & timing
    priority INT DEFAULT 50,
    executed BOOLEAN DEFAULT FALSE,
    execution_result JSON NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP NULL,
    
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id),
    FOREIGN KEY (item_id) REFERENCES items(id),
    
    INDEX idx_player_tick (player_id, tick_number),
    INDEX idx_party_tick (party_id, tick_number, priority),
    INDEX idx_pending_execution (executed, tick_number, priority)
);

-- ============================================
-- 7. ECONOMY & AUCTION HOUSE
-- ============================================

-- AUCTION HOUSE
CREATE TABLE auction_house (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    item_id INT NOT NULL,
    item_quantity INT DEFAULT 1,
    
    -- Auction details
    starting_bid BIGINT NOT NULL,
    current_bid BIGINT NULL,
    buyout_price BIGINT NULL,
    bid_increment BIGINT DEFAULT 100,
    
    -- Duration & status
    duration_hours INT DEFAULT 24,
    listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'sold', 'expired', 'cancelled') DEFAULT 'active',
    
    -- Transaction details
    highest_bidder_id INT NULL,
    sold_at TIMESTAMP NULL,
    sold_price BIGINT NULL,
    
    -- Fees
    listing_fee BIGINT DEFAULT 0,
    transaction_fee_percent DECIMAL(5,2) DEFAULT 5.0,
    
    FOREIGN KEY (seller_id) REFERENCES players(id),
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (highest_bidder_id) REFERENCES players(id),
    
    INDEX idx_status_expires (status, expires_at),
    INDEX idx_seller (seller_id, status),
    INDEX idx_item (item_id, status)
);

-- AUCTION BIDS
CREATE TABLE auction_bids (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    auction_id INT NOT NULL,
    bidder_id INT NOT NULL,
    bid_amount BIGINT NOT NULL,
    is_autobid BOOLEAN DEFAULT FALSE,
    max_autobid BIGINT NULL,
    outbid BOOLEAN DEFAULT FALSE,
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (auction_id) REFERENCES auction_house(id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES players(id),
    
    INDEX idx_auction (auction_id, bid_amount DESC),
    INDEX idx_bidder (bidder_id, bid_time DESC)
);

-- ============================================
-- 8. GUILDS & SOCIAL
-- ============================================

-- GUILDS
CREATE TABLE guilds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(48) UNIQUE NOT NULL,
    tag VARCHAR(4) UNIQUE NOT NULL,
    description TEXT,
    
    -- Leadership
    leader_id INT NOT NULL,
    officer_ids JSON,
    
    -- Guild progression
    level INT DEFAULT 1,
    experience BIGINT DEFAULT 0,
    next_level_exp BIGINT DEFAULT 10000,
    
    -- Resources
    gold_bank BIGINT DEFAULT 0,
    item_bank JSON,
    
    -- Settings
    max_members INT DEFAULT 50,
    recruitment_status ENUM('Open', 'InviteOnly', 'Closed') DEFAULT 'Open',
    requirements JSON,
    
    -- Perks & bonuses
    guild_perks JSON,
    
    -- Visuals
    crest VARCHAR(128),
    motto VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (leader_id) REFERENCES players(id),
    
    INDEX idx_level (level DESC),
    INDEX idx_recruitment (recruitment_status)
);

-- GUILD MEMBERS
CREATE TABLE guild_members (
    guild_id INT NOT NULL,
    player_id INT NOT NULL,
    
    rank ENUM('Leader', 'Officer', 'Veteran', 'Member', 'Recruit', 'Trial') DEFAULT 'Recruit',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_contribution_date DATE NULL,
    
    -- Contributions
    contribution_points INT DEFAULT 0,
    weekly_contribution INT DEFAULT 0,
    total_donated_gold BIGINT DEFAULT 0,
    
    -- Permissions
    permissions JSON,
    
    PRIMARY KEY (guild_id, player_id),
    FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    
    INDEX idx_guild_rank (guild_id, rank),
    INDEX idx_player_guilds (player_id, joined_at DESC)
);

-- ============================================
-- 9. PROGRESSION & ACHIEVEMENTS
-- ============================================

-- PLAYER STATS (Tracking estadísticas)
CREATE TABLE player_stats (
    player_id INT PRIMARY KEY,
    
    -- Combat stats
    total_damage_dealt BIGINT DEFAULT 0,
    total_damage_taken BIGINT DEFAULT 0,
    total_healing_done BIGINT DEFAULT 0,
    total_kills INT DEFAULT 0,
    total_deaths INT DEFAULT 0,
    total_assists INT DEFAULT 0,
    
    -- Exploration stats
    dungeons_completed INT DEFAULT 0,
    rooms_cleared INT DEFAULT 0,
    bosses_defeated INT DEFAULT 0,
    
    -- Economic stats
    total_gold_earned BIGINT DEFAULT 0,
    total_gold_spent BIGINT DEFAULT 0,
    items_sold INT DEFAULT 0,
    items_bought INT DEFAULT 0,
    
    -- Social stats
    parties_joined INT DEFAULT 0,
    guilds_joined INT DEFAULT 0,
    friends_added INT DEFAULT 0,
    
    -- Time tracking
    total_play_time_seconds BIGINT DEFAULT 0,
    longest_session_seconds INT DEFAULT 0,
    last_session_end TIMESTAMP NULL,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- ACHIEVEMENTS
CREATE TABLE achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(64) UNIQUE NOT NULL,
    description TEXT,
    category ENUM('combat', 'exploration', 'social', 'economy', 'collection', 'progression', 'special') NOT NULL,
    
    -- Requirements
    criteria_type ENUM('count', 'value', 'composite', 'special') DEFAULT 'count',
    criteria JSON NOT NULL,
    
    -- Rewards
    reward_exp BIGINT DEFAULT 0,
    reward_gold BIGINT DEFAULT 0,
    reward_premium INT DEFAULT 0,
    reward_item_id INT NULL,
    reward_item_quantity INT DEFAULT 1,
    
    -- Display
    icon VARCHAR(128),
    points_value INT DEFAULT 10,
    is_secret BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reward_item_id) REFERENCES items(id),
    
    INDEX idx_category_order (category, display_order),
    INDEX idx_points (points_value DESC)
);

-- PLAYER ACHIEVEMENTS
CREATE TABLE player_achievements (
    player_id INT NOT NULL,
    achievement_id INT NOT NULL,
    
    -- Progress tracking
    progress JSON,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    claimed_reward BOOLEAN DEFAULT FALSE,
    
    PRIMARY KEY (player_id, achievement_id),
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    
    INDEX idx_player_completed (player_id, completed),
    INDEX idx_achievement_progress (achievement_id, completed)
);

-- DAILY REWARDS
CREATE TABLE daily_rewards (
    player_id INT PRIMARY KEY,
    streak_days INT DEFAULT 0,
    last_claim_date DATE NULL,
    total_claimed INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    missed_days INT DEFAULT 0,
    next_claim_available TIMESTAMP NULL,
    
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- ============================================
-- 10. SYSTEM & ADMINISTRATION
-- ============================================

-- SYSTEM LOGS
CREATE TABLE system_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    log_level ENUM('debug', 'info', 'warn', 'error', 'fatal') DEFAULT 'info',
    module VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    ip_address VARCHAR(45),
    user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_level_module (log_level, module, created_at DESC),
    INDEX idx_created (created_at DESC),
    INDEX idx_user (user_id, created_at DESC)
);

-- MAINTENANCE SCHEDULE
CREATE TABLE maintenance_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    scheduled_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_end TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actual_start TIMESTAMP NULL,
    actual_end TIMESTAMP NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    affected_services JSON,
    announcements JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES players(id),
    
    INDEX idx_scheduled_times (scheduled_start, scheduled_end),
    INDEX idx_status (status)
);

-- ============================================
-- TABLAS ADICIONALES FALTANTES
-- ============================================

-- STATUS EFFECTS (buffs/debuffs)
CREATE TABLE status_effects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    effect_type ENUM('Buff', 'Debuff', 'Neutral') DEFAULT 'Neutral',
    category ENUM('StatModifier', 'DamageOverTime', 'HealOverTime', 'CrowdControl', 'Shield', 'Special') DEFAULT 'StatModifier',
    
    -- Effect details
    duration_ticks INT DEFAULT 1,
    max_stacks INT DEFAULT 1,
    stat_modifiers JSON,
    damage_per_tick INT DEFAULT 0,
    heal_per_tick INT DEFAULT 0,
    prevents_actions BOOLEAN DEFAULT FALSE,
    
    -- Visual/Gameplay
    icon VARCHAR(128),
    description TEXT,
    color VARCHAR(7),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_effect_type (effect_type, category)
);

-- ACTIVE STATUS EFFECTS (efectos activos en combate)
CREATE TABLE active_status_effects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    target_id INT NOT NULL,
    target_type ENUM('player', 'enemy') NOT NULL,
    status_effect_id INT NOT NULL,
    
    -- Tracking
    applied_at_tick INT NOT NULL,
    expires_at_tick INT NOT NULL,
    current_stacks INT DEFAULT 1,
    applied_by_id INT NULL,
    applied_by_type ENUM('player', 'enemy', 'system') NULL,
    
    -- Metadata
    source_skill_id INT NULL,
    source_item_id INT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (status_effect_id) REFERENCES status_effects(id),
    FOREIGN KEY (source_skill_id) REFERENCES skills(id),
    FOREIGN KEY (source_item_id) REFERENCES items(id),
    
    INDEX idx_target (target_id, target_type, expires_at_tick),
    INDEX idx_active_effects (target_id, target_type, status_effect_id)
);

-- QUESTS (Misiones)
CREATE TABLE quests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(128) NOT NULL UNIQUE,
    description TEXT,
    quest_giver VARCHAR(64),
    
    -- Requirements
    required_level INT DEFAULT 1,
    required_quest_id INT NULL,
    required_faction VARCHAR(64) NULL,
    required_item_id INT NULL,
    
    -- Objectives
    objectives JSON,
    
    -- Rewards
    reward_exp BIGINT DEFAULT 0,
    reward_gold BIGINT DEFAULT 0,
    reward_items JSON,
    reward_premium INT DEFAULT 0,
    
    -- Quest chain
    next_quest_id INT NULL,
    is_chain_quest BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    quest_type ENUM('Main', 'Side', 'Daily', 'Weekly', 'Event', 'Guild') DEFAULT 'Side',
    repeatable BOOLEAN DEFAULT FALSE,
    cooldown_hours INT DEFAULT 24,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (required_quest_id) REFERENCES quests(id),
    FOREIGN KEY (next_quest_id) REFERENCES quests(id),
    FOREIGN KEY (required_item_id) REFERENCES items(id),
    
    INDEX idx_quest_type_level (quest_type, required_level),
    INDEX idx_repeatable (repeatable)
);

-- PLAYER QUESTS
CREATE TABLE player_quests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    quest_id INT NOT NULL,
    
    -- Progress
    status ENUM('Not Started', 'In Progress', 'Completed', 'Failed', 'Abandoned') DEFAULT 'Not Started',
    progress JSON,
    objectives_completed JSON,
    
    -- Timestamps
    accepted_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_player_quest (player_id, quest_id),
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (quest_id) REFERENCES quests(id),
    
    INDEX idx_player_status (player_id, status),
    INDEX idx_quest_progress (quest_id, status)
);

-- FRIENDS (Sistema social)
CREATE TABLE friends (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    friend_id INT NOT NULL,
    
    -- Status
    status ENUM('Pending', 'Accepted', 'Blocked', 'Removed') DEFAULT 'Pending',
    friendship_level INT DEFAULT 1,
    friendship_points INT DEFAULT 0,
    
    -- Interaction
    last_interaction TIMESTAMP NULL,
    total_interactions INT DEFAULT 0,
    
    -- Metadata
    note VARCHAR(255),
    favorite BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_friendship (player_id, friend_id),
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES players(id) ON DELETE CASCADE,
    
    INDEX idx_player_friends (player_id, status),
    INDEX idx_friendship_level (friendship_level DESC)
);

-- MAIL (Sistema de correo interno)
CREATE TABLE mail (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NULL,
    recipient_id INT NOT NULL,
    
    -- Mail content
    subject VARCHAR(255) NOT NULL,
    body TEXT,
    attachments JSON,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_claimed BOOLEAN DEFAULT FALSE,
    has_expired BOOLEAN DEFAULT FALSE,
    
    -- Expiration
    expires_at TIMESTAMP NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    claimed_at TIMESTAMP NULL,
    
    FOREIGN KEY (sender_id) REFERENCES players(id) ON DELETE SET NULL,
    FOREIGN KEY (recipient_id) REFERENCES players(id) ON DELETE CASCADE,
    
    INDEX idx_recipient_status (recipient_id, is_read, is_claimed),
    INDEX idx_expiration (expires_at, has_expired)
);

-- CRAFTING RECIPES (Sistema de crafteo)
CREATE TABLE crafting_recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    description TEXT,
    
    -- Requirements
    required_skill VARCHAR(64) NULL,
    required_skill_level INT DEFAULT 1,
    required_station VARCHAR(64) NULL,
    required_item_id INT NULL,
    
    -- Ingredients
    ingredients JSON NOT NULL,
    
    -- Result
    result_item_id INT NOT NULL,
    result_quantity INT DEFAULT 1,
    craft_time_seconds INT DEFAULT 30,
    
    -- Success chance & quality
    base_success_chance DECIMAL(5,2) DEFAULT 100.00,
    skill_bonus_per_level DECIMAL(5,2) DEFAULT 1.0,
    can_crit BOOLEAN DEFAULT FALSE,
    crit_bonus JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (result_item_id) REFERENCES items(id),
    FOREIGN KEY (required_item_id) REFERENCES items(id),
    
    INDEX idx_required_skill (required_skill, required_skill_level),
    INDEX idx_result_item (result_item_id)
);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

DELIMITER //

-- Trigger para calcular HP/MP cuando se actualizan stats
CREATE TRIGGER players_before_update
BEFORE UPDATE ON players
FOR EACH ROW
BEGIN
    -- Calcular HP basado en CON y race base_hp
    DECLARE race_base_hp INT;
    DECLARE class_hp_per_con INT;
    DECLARE class_mp_per_will INT;
    
    SELECT base_hp INTO race_base_hp FROM races WHERE id = NEW.race_id;
    SELECT hp_per_con INTO class_hp_per_con FROM classes WHERE id = NEW.class_id;
    SELECT mp_per_will INTO class_mp_per_will FROM classes WHERE id = NEW.class_id;
    
    SET NEW.max_hp = race_base_hp + (NEW.constitution * class_hp_per_con);
    
    -- Asegurar que current_hp no exceda max_hp
    IF NEW.current_hp > NEW.max_hp THEN
        SET NEW.current_hp = NEW.max_hp;
    END IF;
    
    -- Calcular MP basado en WILL
    SET NEW.max_mp = (NEW.willpower * class_mp_per_will);
    
    IF NEW.current_mp > NEW.max_mp THEN
        SET NEW.current_mp = NEW.max_mp;
    END IF;
END//

-- Trigger para inicializar HP/MP cuando se crea un player
CREATE TRIGGER players_before_insert
BEFORE INSERT ON players
FOR EACH ROW
BEGIN
    -- Calcular HP inicial
    DECLARE race_base_hp INT;
    DECLARE class_hp_per_con INT;
    DECLARE class_mp_per_will INT;
    
    SELECT base_hp INTO race_base_hp FROM races WHERE id = NEW.race_id;
    SELECT hp_per_con INTO class_hp_per_con FROM classes WHERE id = NEW.class_id;
    SELECT mp_per_will INTO class_mp_per_will FROM classes WHERE id = NEW.class_id;
    
    SET NEW.max_hp = race_base_hp + (NEW.constitution * class_hp_per_con);
    SET NEW.current_hp = NEW.max_hp;
    
    -- Calcular MP inicial
    SET NEW.max_mp = (NEW.willpower * class_mp_per_will);
    SET NEW.current_mp = NEW.max_mp;
END//

DELIMITER ;

-- ============================================
-- VIEWS PARA REPORTES
-- ============================================

-- Vista para leaderboard de jugadores
CREATE VIEW player_leaderboard AS
SELECT 
    p.id,
    p.username,
    p.character_name,
    p.level,
    p.current_exp,
    r.name as race_name,
    c.name as class_name,
    ps.total_kills,
    ps.dungeons_completed,
    ps.total_gold_earned,
    DENSE_RANK() OVER (ORDER BY p.level DESC, p.current_exp DESC) as global_rank,
    DENSE_RANK() OVER (PARTITION BY c.name ORDER BY p.level DESC, p.current_exp DESC) as class_rank
FROM players p
JOIN races r ON p.race_id = r.id
JOIN classes c ON p.class_id = c.id
LEFT JOIN player_stats ps ON p.id = ps.player_id
WHERE p.status = 'active';

-- Vista para actividad reciente de dungeons
CREATE VIEW dungeon_activity AS
SELECT 
    d.name as dungeon_name,
    COUNT(DISTINCT par.id) as parties_completed,
    COUNT(DISTINCT pm.player_id) as unique_players,
    AVG(TIMESTAMPDIFF(SECOND, par.started_at, par.completed_at)) as avg_completion_time_seconds,
    SUM(cl.total_kills) as total_enemies_killed,
    DATE(par.completed_at) as completion_date
FROM parties par
JOIN dungeons d ON par.dungeon_id = d.id
JOIN party_members pm ON par.id = pm.party_id
LEFT JOIN (
    SELECT party_id, COUNT(*) as total_kills
    FROM combat_logs 
    WHERE actor_type = 'player' AND action_type = 'attack' AND damage_dealt > 0
    GROUP BY party_id
) cl ON par.id = cl.party_id
WHERE par.status = 'completed'
GROUP BY d.id, DATE(par.completed_at);

-- ============================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_players_character_name ON players(character_name);

CREATE INDEX idx_skills_class_level ON skills(class_id, required_level, tier);
CREATE INDEX idx_skills_effect_type ON skills(effect_type, required_level);

CREATE INDEX idx_player_skills_level ON player_skills(skill_level DESC);
CREATE INDEX idx_player_skills_experience ON player_skills(experience DESC);

CREATE INDEX idx_items_rarity_level ON items(rarity, required_level);
CREATE INDEX idx_items_type_rarity ON items(item_type, rarity, required_level);

CREATE INDEX idx_auction_expires_status ON auction_house(expires_at, status);
CREATE INDEX idx_auction_current_bid ON auction_house(current_bid DESC);

CREATE INDEX idx_combat_logs_timestamp ON combat_logs(created_at DESC);
CREATE INDEX idx_combat_logs_action_type ON combat_logs(action_type, created_at);

CREATE INDEX idx_guild_members_contributions ON guild_members(contribution_points DESC);
CREATE INDEX idx_guild_members_weekly ON guild_members(weekly_contribution DESC);

CREATE INDEX idx_player_stats_kills ON player_stats(total_kills DESC);
CREATE INDEX idx_player_stats_dungeons ON player_stats(dungeons_completed DESC);

-- Índices para nuevas tablas
CREATE INDEX idx_status_effects_type ON status_effects(effect_type, category);
CREATE INDEX idx_active_effects_expiry ON active_status_effects(expires_at_tick);

CREATE INDEX idx_quests_type_level ON quests(quest_type, required_level);
CREATE INDEX idx_player_quests_status ON player_quests(status, updated_at DESC);

CREATE INDEX idx_friends_status ON friends(status, updated_at DESC);
CREATE INDEX idx_mail_recipient_status ON mail(recipient_id, is_read, is_claimed);

CREATE INDEX idx_recipes_skill_level ON crafting_recipes(required_skill, required_skill_level);

-- ============================================
-- FIN DEL SCHEMA CORREGIDO
-- ============================================
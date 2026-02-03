-- ============================================
-- SEED DATA COMPLETO - ECHOES DUNGEON
-- Basado en World of Dungeons + Schema optimizado
-- ============================================

-- Limpiar tablas existentes (en orden correcto)
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE system_logs;
TRUNCATE TABLE maintenance_schedule;
TRUNCATE TABLE auction_bids;
TRUNCATE TABLE auction_house;
TRUNCATE TABLE player_achievements;
TRUNCATE TABLE achievements;
TRUNCATE TABLE daily_rewards;
TRUNCATE TABLE player_stats;
TRUNCATE TABLE guild_members;
TRUNCATE TABLE guilds;
TRUNCATE TABLE player_quests;
TRUNCATE TABLE quests;
TRUNCATE TABLE friends;
TRUNCATE TABLE mail;
TRUNCATE TABLE crafting_recipes;
TRUNCATE TABLE active_status_effects;
TRUNCATE TABLE status_effects;
TRUNCATE TABLE player_tick_actions;
TRUNCATE TABLE tick_schedule;
TRUNCATE TABLE combat_logs;
TRUNCATE TABLE party_members;
TRUNCATE TABLE parties;
TRUNCATE TABLE spawn_tables;
TRUNCATE TABLE dungeon_rooms;
TRUNCATE TABLE dungeons;
TRUNCATE TABLE loot_table_entries;
TRUNCATE TABLE loot_tables;
TRUNCATE TABLE player_inventory;
TRUNCATE TABLE items;
TRUNCATE TABLE enemies;
TRUNCATE TABLE player_skills;
TRUNCATE TABLE skills;
TRUNCATE TABLE players;
TRUNCATE TABLE classes;
TRUNCATE TABLE races;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 1. RAZAS (Basado en WoD pero adaptado)
-- ============================================
INSERT INTO races (id, name, description, base_hp, stat_bonuses, racial_ability, ability_description) VALUES
(1, 'Human', 'Versatile and adaptable humans', 110, '{"str": 1, "dex": 1, "int": 1, "cha": 1}', 'Adaptability', '+10% bonus to all skill learning rates'),
(2, 'Elf', 'Graceful and long-lived magical beings', 100, '{"dex": 2, "int": 2, "con": -1}', 'Arcane Affinity', '+15% bonus to magical skill effectiveness'),
(3, 'Dwarf', 'Stout and resilient mountain folk', 120, '{"str": 2, "con": 2, "dex": -1}', 'Stone Resilience', '+20% resistance to physical damage'),
(4, 'Orc', 'Powerful and aggressive warriors', 130, '{"str": 3, "con": 1, "int": -2}', 'Blood Rage', 'Deal +25% damage when below 50% HP'),
(5, 'Halfling', 'Small, agile and lucky folk', 90, '{"dex": 3, "agi": 2, "str": -2}', 'Lucky', '+10% dodge chance and +5% critical hit chance'),
(6, 'Gnome', 'Small, intelligent tinkerers', 85, '{"int": 3, "per": 2, "str": -2}', 'Mechanical Genius', '+20% bonus to crafting skills'),
(7, 'Tiefling', 'Planar-touched with infernal heritage', 95, '{"int": 2, "cha": 2, "con": -1}', 'Infernal Resistance', '+15% resistance to fire and dark magic'),
(8, 'Dragonborn', 'Draconic humanoids with elemental breath', 115, '{"str": 2, "con": 2, "cha": 1}', 'Draconic Breath', 'Breathe elemental energy (fire/frost/acid)'),
(9, 'Wood Elf', 'Forest-dwelling stealthy elves', 105, '{"agi": 3, "per": 2, "con": -1}', 'Forest Stealth', '+25% stealth in natural environments'),
(10, 'Half-Orc', 'Balanced mix of human and orc', 125, '{"str": 2, "con": 2, "int": -1}', 'Relentless Endurance', 'Once per day, survive a killing blow with 1 HP');

-- ============================================
-- 2. CLASES (Basado en WoD CSV - 32 clases agrupadas en 10 principales)
-- ============================================
INSERT INTO classes (id, name, tier, description, primary_stats, stat_growth, hp_per_con, mp_per_will, max_skills) VALUES
-- Tier: Beginner
(1, 'Warrior', 'Beginner', 'Master of physical combat and weapons', '["STR", "CON"]', '{"str": 3.5, "con": 3.0, "dex": 2.0, "agi": 1.5, "int": 0.5, "per": 1.0, "will": 1.0}', 14, 4, 20),
(2, 'Mage', 'Beginner', 'Scholar of arcane arts and elemental magic', '["INT", "WILL"]', '{"str": 0.5, "con": 1.0, "dex": 1.0, "agi": 1.0, "int": 4.0, "per": 2.0, "will": 3.5}', 8, 10, 20),
(3, 'Rogue', 'Beginner', 'Stealthy expert in subterfuge and precision', '["DEX", "AGI"]', '{"str": 1.5, "con": 1.5, "dex": 3.5, "agi": 3.0, "int": 1.5, "per": 2.0, "will": 1.0}', 10, 6, 20),
(4, 'Priest', 'Beginner', 'Divine servant focused on healing and protection', '["WILL", "INT"]', '{"str": 1.0, "con": 2.0, "dex": 1.0, "agi": 1.0, "int": 2.5, "per": 1.5, "will": 3.5}', 12, 8, 20),

-- Tier: Intermediate  
(5, 'Archer', 'Intermediate', 'Master of ranged combat and precision shooting', '["DEX", "PER"]', '{"str": 1.5, "con": 2.0, "dex": 3.5, "agi": 2.5, "int": 1.0, "per": 3.0, "will": 1.0}', 12, 5, 35),
(6, 'Fighter', 'Intermediate', 'Weapon specialist with advanced combat techniques', '["STR", "DEX"]', '{"str": 3.0, "con": 2.5, "dex": 2.5, "agi": 2.0, "int": 1.0, "per": 1.5, "will": 1.5}', 13, 6, 35),
(7, 'Alchemist', 'Intermediate', 'Expert in potions, poisons and chemical mastery', '["INT", "PER"]', '{"str": 0.5, "con": 1.5, "dex": 2.5, "agi": 1.5, "int": 3.5, "per": 3.0, "will": 2.0}', 9, 8, 35),

-- Tier: Premium
(8, 'Paladin', 'Premium', 'Holy warrior blending martial prowess with divine magic', '["STR", "WILL"]', '{"str": 3.0, "con": 2.5, "dex": 1.5, "agi": 1.0, "int": 1.5, "per": 1.0, "will": 3.0}', 15, 7, 50),
(9, 'Druid', 'Premium', 'Nature mystic with shape-shifting and elemental powers', '["WILL", "INT"]', '{"str": 1.5, "con": 2.5, "dex": 1.5, "agi": 2.0, "int": 3.0, "per": 2.0, "will": 3.5}', 11, 9, 50),
(10, 'Assassin', 'Premium', 'Deadly killer specializing in stealth and instant takedowns', '["DEX", "AGI"]', '{"str": 2.0, "con": 1.5, "dex": 4.0, "agi": 3.5, "int": 1.5, "per": 2.5, "will": 1.0}', 10, 5, 50);

-- ============================================
-- 3. SKILLS (85 skills del CSV - Solo primeras 30 para MVP)
-- ============================================
INSERT INTO skills (id, name, class_id, tier, required_level, effect_type, damage_type, formula, base_value, scaling_stat, scaling_factor, hp_cost, mp_cost, cooldown_turns, target_type, skill_range, description) VALUES
-- Warrior Skills
(1, 'Axemanship', 1, 'Basic', 1, 'Damage', 'Physical', '1d8 + (STR * 0.7)', 8, 'STR', 0.7, 0, 0, 0, 'Single', 1, 'Mastery of axe weapons for increased damage'),
(2, 'Close Combat', 1, 'Basic', 1, 'Damage', 'Physical', '1d6 + (STR * 0.5)', 6, 'STR', 0.5, 0, 0, 0, 'Single', 1, 'General melee combat proficiency'),
(3, 'Berserker Rage', 1, 'Advanced', 5, 'Buff', NULL, 'N/A', 0, 'STR', 0.0, 10, 0, 5, 'Self', 0, 'Enter frenzied state for +30% damage, -20% defense'),
(4, 'Double Strike', 1, 'Advanced', 3, 'Damage', 'Physical', '1d6 + (STR * 0.4) per hit', 6, 'STR', 0.4, 0, 5, 3, 'Single', 1, 'Attack twice in rapid succession'),

-- Mage Skills
(5, 'Fire Magic', 2, 'Basic', 1, 'Damage', 'Fire', '2d4 + (INT * 0.8)', 8, 'INT', 0.8, 0, 10, 0, 'Single', 3, 'Control and manipulation of fire'),
(6, 'Magic Missile', 2, 'Basic', 1, 'Damage', 'Magic', '1d8 + (INT * 0.6)', 8, 'INT', 0.6, 0, 8, 0, 'Single', 4, 'Basic projectile magic attack'),
(7, 'Offensive Magery', 2, 'Advanced', 5, 'Damage', 'Magic', '2d6 + (INT * 1.0)', 12, 'INT', 1.0, 0, 20, 2, 'Single', 4, 'Spells focused on dealing damage'),
(8, 'Mana Regeneration', 2, 'Basic', 1, 'Buff', NULL, 'N/A', 0, 'INT', 0.0, 0, 0, 0, 'Self', 0, 'Passive: Regenerate 5% max MP per turn'),

-- Rogue Skills
(9, 'Ambush', 3, 'Basic', 1, 'Damage', 'Physical', '1d10 + (DEX * 0.8) * 2 if stealth', 10, 'DEX', 0.8, 0, 0, 3, 'Single', 1, 'Surprise attack from hiding'),
(10, 'Acrobatics', 3, 'Basic', 1, 'Utility', NULL, 'N/A', 0, 'AGI', 0.0, 0, 0, 0, 'Self', 0, 'Passive: +15% dodge chance'),
(11, 'Dodge Blow', 3, 'Basic', 1, 'Buff', NULL, 'N/A', 0, 'AGI', 0.0, 0, 0, 0, 'Self', 0, 'Passive: +20% chance to avoid melee attacks'),
(12, 'Tinker', 3, 'Advanced', 5, 'Utility', NULL, 'N/A', 0, 'DEX', 0.0, 0, 5, 0, 'Self', 0, 'Pick locks and manipulate mechanisms'),

-- Priest Skills
(13, 'Divine Healing', 4, 'Basic', 1, 'Heal', NULL, '2d6 + (WILL * 0.7)', 12, 'WILL', 0.7, 0, 15, 2, 'Single', 3, 'Powerful healing through divine power'),
(14, 'Bless', 4, 'Basic', 1, 'Buff', NULL, 'N/A', 0, 'WILL', 0.0, 0, 10, 3, 'Ally', 3, 'Grant +2 to all stats for 3 turns'),
(15, 'Turn Undead', 4, 'Advanced', 5, 'Damage', 'Holy', '3d8 + (WILL * 1.2)', 24, 'WILL', 1.2, 0, 25, 4, 'Area', 2, 'Repel or destroy undead creatures'),
(16, 'Protective Magic', 4, 'Basic', 3, 'Buff', NULL, 'N/A', 0, 'WILL', 0.0, 0, 12, 3, 'Ally', 2, 'Shield absorbing 20 + WILL*2 damage'),

-- Archer Skills
(17, 'Archery', 5, 'Basic', 1, 'Damage', 'Physical', '1d8 + (DEX * 0.6)', 8, 'DEX', 0.6, 0, 0, 0, 'Single', 5, 'Proficiency with bows and ranged weapons'),
(18, 'Careful Aim', 5, 'Basic', 3, 'Buff', NULL, 'N/A', 0, 'PER', 0.0, 0, 0, 2, 'Self', 0, 'Next attack has +50% critical chance'),
(19, 'Eagle-Eye', 5, 'Basic', 1, 'Buff', NULL, 'N/A', 0, 'PER', 0.0, 0, 0, 0, 'Self', 0, 'Passive: +2 range on all ranged attacks'),
(20, 'Volley', 5, 'Advanced', 7, 'Damage', 'Physical', '1d6 + (DEX * 0.4) to all enemies', 6, 'DEX', 0.4, 0, 10, 4, 'Multiple', 4, 'Rain arrows on area'),

-- Fighter Skills
(21, 'Blademaster', 6, 'Advanced', 5, 'Damage', 'Physical', '1d10 + (STR * 0.8)', 10, 'STR', 0.8, 0, 0, 0, 'Single', 1, 'Advanced sword fighting techniques'),
(22, 'Disarming Strike', 6, 'Advanced', 7, 'Debuff', NULL, 'N/A', 0, 'DEX', 0.0, 0, 8, 3, 'Single', 1, 'Attack that disarms opponent for 2 turns'),
(23, 'Toughness', 6, 'Basic', 1, 'Buff', NULL, 'N/A', 0, 'CON', 0.0, 0, 0, 0, 'Self', 0, 'Passive: +20% maximum HP'),
(24, 'Roundhouse', 6, 'Advanced', 9, 'Damage', 'Physical', '1d8 + (STR * 0.6) to 2 enemies', 8, 'STR', 0.6, 0, 12, 3, 'Multiple', 1, 'Powerful spinning attack hitting multiple targets'),

-- Alchemist Skills
(25, 'Alchemical Knowledge', 7, 'Basic', 1, 'Passive', NULL, 'N/A', 0, 'INT', 0.0, 0, 0, 0, 'Self', 0, 'Passive: +25% effectiveness of all potions'),
(26, 'Alchemical Healing', 7, 'Basic', 1, 'Heal', NULL, '2d8 + (INT * 0.5)', 16, 'INT', 0.5, 0, 0, 2, 'Single', 2, 'Healing through alchemical potions'),
(27, 'Apply Herbs', 7, 'Basic', 3, 'Heal', NULL, '1d4 + (INT * 0.3) per turn for 3 turns', 4, 'INT', 0.3, 0, 0, 3, 'Single', 1, 'Use herbs for healing over time'),

-- Paladin Skills
(28, 'Aura of the Paladin', 8, 'Basic', 1, 'Buff', NULL, 'N/A', 0, 'CHA', 0.0, 0, 0, 0, 'Allies', 2, 'Passive: Nearby allies gain +1 to all stats'),
(29, 'Divine Attack', 8, 'Basic', 1, 'Damage', 'Holy', '1d10 + (STR * 0.5) + (WILL * 0.5)', 10, 'STR', 0.5, 0, 15, 0, 'Single', 1, 'Holy offensive power against evil'),
(30, 'Leadership', 8, 'Basic', 1, 'Buff', NULL, 'N/A', 0, 'CHA', 0.0, 0, 0, 0, 'Allies', 3, 'Passive: Party members deal +5% damage');

-- Continuar con más skills según necesidad...

-- ============================================
-- 4. ITEMS (Basado en WoD pero adaptado)
-- ============================================
INSERT INTO items (id, name, item_type, rarity, required_level, damage_min, damage_max, armor_value, stat_bonuses, max_stack, base_value, description) VALUES
-- Weapons
(1, 'Rusty Sword', 'Weapon', 'Common', 1, 3, 6, 0, '{"str": 1}', 1, 50, 'An old, worn sword that still cuts'),
(2, 'Iron Longsword', 'Weapon', 'Uncommon', 3, 6, 10, 0, '{"str": 2}', 1, 150, 'Well-forged iron sword'),
(3, 'Steel Greatsword', 'Weapon', 'Rare', 7, 10, 16, 0, '{"str": 3, "con": 1}', 1, 500, 'Heavy two-handed sword'),
(4, 'Mage Staff', 'Weapon', 'Uncommon', 3, 2, 4, 0, '{"int": 3, "mp_max": 20}', 1, 200, 'Staff that enhances magical power'),
(5, 'Hunter Bow', 'Weapon', 'Uncommon', 3, 4, 8, 0, '{"dex": 2, "per": 1}', 1, 180, 'Reliable bow for hunting'),
(6, 'Assassin Dagger', 'Weapon', 'Rare', 5, 5, 9, 0, '{"dex": 3, "agi": 2}', 1, 350, 'Sharp, balanced dagger'),

-- Armor
(7, 'Leather Armor', 'Armor', 'Common', 1, 0, 0, 4, '{"agi": 1}', 1, 80, 'Basic leather protection'),
(8, 'Chainmail', 'Armor', 'Uncommon', 4, 0, 0, 8, '{"con": 2, "agi": -1}', 1, 300, 'Chainmail armor'),
(9, 'Plate Armor', 'Armor', 'Rare', 8, 0, 0, 14, '{"con": 4, "str": 1, "agi": -3}', 1, 800, 'Heavy plate armor'),
(10, 'Mage Robes', 'Armor', 'Uncommon', 3, 0, 0, 2, '{"int": 2, "mp_regen": 1}', 1, 250, 'Robes enchanted for magic'),
(11, 'Ranger Cloak', 'Armor', 'Uncommon', 3, 0, 0, 3, '{"agi": 2, "per": 1}', 1, 220, 'Cloak that aids stealth'),

-- Accessories
(12, 'Health Amulet', 'Accessory', 'Common', 1, 0, 0, 0, '{"hp_max": 20}', 1, 100, 'Amulet that increases health'),
(13, 'Mana Ring', 'Accessory', 'Uncommon', 4, 0, 0, 0, '{"mp_max": 30, "int": 1}', 1, 350, 'Ring that stores magical energy'),
(14, 'Strength Bracers', 'Accessory', 'Rare', 6, 0, 0, 0, '{"str": 3, "con": 1}', 1, 500, 'Bracers that enhance strength'),

-- Consumables
(15, 'Health Potion', 'Consumable', 'Common', 1, 0, 0, 0, '{"heal": 50}', 10, 30, 'Restores 50 health'),
(16, 'Mana Potion', 'Consumable', 'Common', 1, 0, 0, 0, '{"restore_mp": 40}', 10, 40, 'Restores 40 mana'),
(17, 'Stamina Elixir', 'Consumable', 'Uncommon', 3, 0, 0, 0, '{"stamina": 100, "agi": 2}', 5, 150, 'Restores stamina and agility'),

-- Materials
(18, 'Iron Ore', 'Material', 'Common', 1, 0, 0, 0, NULL, 50, 10, 'Raw iron for crafting'),
(19, 'Leather Scraps', 'Material', 'Common', 1, 0, 0, 0, NULL, 50, 5, 'Basic leather materials'),
(20, 'Mana Crystal', 'Material', 'Rare', 5, 0, 0, 0, NULL, 10, 200, 'Crystal infused with magical energy');

-- ============================================
-- 5. ENEMIES (Basado en WoD y balanceado)
-- ============================================
INSERT INTO enemies (id, name, level, strength, dexterity, agility, constitution, intelligence, perception, willpower, base_hp, base_mp, base_armor, base_damage, exp_reward, gold_reward, threat_level, ai_behavior) VALUES
-- Tier 1: Level 1-3
(1, 'Goblin Scout', 1, 8, 12, 14, 10, 6, 10, 8, 100, 20, 2, 6, 50, 10, 'Minion', 'Aggressive'),
(2, 'Goblin Warrior', 2, 12, 10, 10, 14, 6, 8, 10, 130, 10, 5, 8, 80, 20, 'Minion', 'Aggressive'),
(3, 'Skeleton', 2, 10, 9, 8, 12, 5, 7, 15, 120, 0, 3, 7, 70, 15, 'Minion', 'Aggressive'),
(4, 'Giant Rat', 1, 7, 14, 16, 9, 3, 12, 6, 80, 0, 1, 4, 40, 5, 'Minion', 'Aggressive'),

-- Tier 2: Level 4-6
(5, 'Orc Brute', 4, 18, 8, 8, 16, 5, 6, 12, 200, 30, 8, 11, 200, 50, 'Elite', 'Aggressive'),
(6, 'Dark Mage', 5, 8, 10, 10, 12, 16, 14, 14, 140, 100, 5, 9, 250, 75, 'Elite', 'Support'),
(7, 'Skeleton Archer', 4, 10, 14, 12, 10, 7, 12, 8, 110, 20, 3, 7, 180, 40, 'Minion', 'Defensive'),
(8, 'Worg', 5, 16, 12, 14, 14, 5, 13, 10, 180, 0, 4, 10, 220, 55, 'Elite', 'Aggressive'),

-- Tier 3: Level 7-9
(9, 'Ogre', 7, 22, 6, 6, 20, 4, 5, 10, 300, 50, 12, 16, 400, 120, 'MiniBoss', 'Aggressive'),
(10, 'Banshee', 8, 8, 12, 14, 10, 18, 16, 18, 160, 150, 3, 12, 450, 100, 'MiniBoss', 'Support'),
(11, 'Troll', 9, 20, 9, 8, 22, 6, 7, 12, 350, 40, 10, 14, 500, 150, 'MiniBoss', 'Balanced'),

-- Bosses
(12, 'Orc Warlord', 10, 25, 11, 10, 24, 10, 12, 16, 500, 100, 15, 20, 1000, 300, 'Boss', 'Aggressive'),
(13, 'Lich', 12, 12, 10, 10, 15, 25, 18, 22, 300, 250, 8, 17, 1500, 500, 'Boss', 'Support');

-- ============================================
-- 6. DUNGEONS (3 dungeons iniciales)
-- ============================================
INSERT INTO dungeons (id, name, description, min_level, max_level, recommended_party_size, max_rooms, difficulty, base_exp_reward, base_gold_reward) VALUES
(1, 'Goblin Caves', 'A network of caves infested with goblins', 1, 3, 4, 4, 'Easy', 200, 100),
(2, 'Haunted Crypts', 'Ancient crypts filled with undead', 4, 6, 5, 5, 'Normal', 500, 250),
(3, 'Orc Stronghold', 'Fortified orc encampment', 7, 9, 6, 6, 'Hard', 1000, 500);

-- ============================================
-- 7. DUNGEON ROOMS (4 rooms por dungeon)
-- ============================================
-- Goblin Caves (Dungeon 1)
INSERT INTO dungeon_rooms (id, dungeon_id, room_number, name, description, is_boss_room, terrain_type) VALUES
(1, 1, 1, 'Cave Entrance', 'Dark, damp entrance to the goblin caves', FALSE, 'Cave'),
(2, 1, 2, 'Main Cavern', 'Large cavern with makeshift goblin dwellings', FALSE, 'Cave'),
(3, 1, 3, 'Spider Nest', 'Web-filled chamber with giant spiders', FALSE, 'Cave'),
(4, 1, 4, 'Goblin Chieftain Throne', 'Throne room of the goblin chieftain', TRUE, 'Cave'),

-- Haunted Crypts (Dungeon 2)
(5, 2, 1, 'Crypt Entrance', 'Broken stone doorway into darkness', FALSE, 'Ruins'),
(6, 2, 2, 'Burial Chamber', 'Rows of ancient sarcophagi', FALSE, 'Ruins'),
(7, 2, 3, 'Ritual Room', 'Blood-stained altar and ritual markings', FALSE, 'Ruins'),
(8, 2, 4, 'Lich Sanctum', 'Throne room of the crypt master', TRUE, 'Ruins'),

-- Orc Stronghold (Dungeon 3)
(9, 3, 1, 'Outer Palisade', 'Wooden fortifications and watchtowers', FALSE, 'Forest'),
(10, 3, 2, 'Training Grounds', 'Weapon racks and training dummies', FALSE, 'Forest'),
(11, 3, 3, 'Great Hall', 'Massive hall with fire pits and banners', FALSE, 'Forest'),
(12, 3, 4, 'Warlord Chamber', 'Personal chambers of the orc warlord', TRUE, 'Forest');

-- ============================================
-- 8. SPAWN TABLES (Enemies por room)
-- ============================================
-- Goblin Caves Room 1-3
INSERT INTO spawn_tables (room_id, enemy_id, min_count, max_count, spawn_chance, spawn_formation) VALUES
-- Room 1
(1, 1, 2, 3, 100, 'Random'), -- Goblin Scouts
(1, 4, 1, 2, 60, 'Random'),  -- Giant Rats

-- Room 2  
(2, 1, 1, 2, 80, 'Front'),
(2, 2, 1, 2, 70, 'Back'), -- Goblin Warriors
(2, 3, 1, 1, 30, 'Flank'), -- Skeleton

-- Room 3
(3, 4, 3, 5, 100, 'Surround'), -- Many Rats
(3, 1, 1, 1, 40, 'Random'), -- Scout

-- Room 4 (Boss)
(4, 5, 1, 1, 100, 'Front'), -- Orc Brute (boss)
(4, 2, 2, 3, 100, 'Back'),  -- Warrior guards

-- Haunted Crypts Rooms
(5, 3, 2, 3, 100, 'Random'), -- Skeletons
(6, 3, 3, 4, 100, 'Random'),
(6, 7, 1, 2, 50, 'Back'),    -- Skeleton Archers
(7, 6, 1, 1, 100, 'Back'),   -- Dark Mage
(7, 3, 2, 3, 80, 'Front'),
(8, 13, 1, 1, 100, 'Front'), -- Lich Boss
(8, 3, 4, 6, 100, 'Surround'),

-- Orc Stronghold Rooms
(9, 5, 2, 3, 100, 'Front'),
(9, 7, 1, 2, 60, 'Back'),
(10, 5, 3, 4, 100, 'Random'),
(10, 8, 1, 2, 70, 'Flank'),
(11, 9, 1, 1, 100, 'Front'), -- Ogre Mini-boss
(11, 5, 3, 5, 100, 'Surround'),
(12, 12, 1, 1, 100, 'Front'), -- Orc Warlord Boss
(12, 5, 4, 6, 100, 'Surround');

-- ============================================
-- 9. LOOT TABLES
-- ============================================
INSERT INTO loot_tables (id, name, loot_type, min_gold, max_gold) VALUES
(1, 'Goblin_Loot', 'Enemy', 5, 20),
(2, 'Skeleton_Loot', 'Enemy', 3, 15),
(3, 'Orc_Loot', 'Enemy', 15, 40),
(4, 'Mage_Loot', 'Enemy', 20, 60),
(5, 'Boss_Loot', 'Boss', 50, 150),
(6, 'MiniBoss_Loot', 'Boss', 30, 80);

-- Loot para enemies comunes
INSERT INTO loot_table_entries (loot_table_id, item_id, drop_chance, min_quantity, max_quantity) VALUES
-- Goblin Loot
(1, 1, 20.00, 1, 1),   -- Rusty Sword 20%
(1, 7, 15.00, 1, 1),   -- Leather Armor 15%
(1, 18, 80.00, 1, 3),  -- Iron Ore 80% (1-3)
(1, 19, 70.00, 1, 4),  -- Leather Scraps 70%

-- Skeleton Loot
(2, 1, 10.00, 1, 1),   -- Rusty Sword 10%
(2, 12, 5.00, 1, 1),   -- Health Amulet 5%
(2, 18, 60.00, 1, 2),  -- Iron Ore 60%

-- Orc Loot
(3, 2, 15.00, 1, 1),   -- Iron Longsword 15%
(3, 8, 10.00, 1, 1),   -- Chainmail 10%
(3, 14, 5.00, 1, 1),   -- Strength Bracers 5%
(3, 18, 90.00, 2, 5),  -- Iron Ore 90%

-- Mage Loot
(4, 4, 20.00, 1, 1),   -- Mage Staff 20%
(4, 10, 15.00, 1, 1),  -- Mage Robes 15%
(4, 13, 10.00, 1, 1),  -- Mana Ring 10%
(4, 20, 30.00, 1, 2),  -- Mana Crystal 30%

-- Boss Loot
(5, 3, 25.00, 1, 1),   -- Steel Greatsword 25%
(5, 9, 20.00, 1, 1),   -- Plate Armor 20%
(5, 14, 15.00, 1, 1),  -- Strength Bracers 15%
(5, 20, 50.00, 2, 4),  -- Mana Crystal 50%

-- MiniBoss Loot
(6, 2, 30.00, 1, 1),   -- Iron Longsword 30%
(6, 8, 25.00, 1, 1),   -- Chainmail 25%
(6, 13, 10.00, 1, 1);  -- Mana Ring 10%

-- Asignar loot tables a enemies
UPDATE enemies SET loot_table_id = 1 WHERE id IN (1, 2);  -- Goblins
UPDATE enemies SET loot_table_id = 2 WHERE id IN (3, 7);  -- Skeletons
UPDATE enemies SET loot_table_id = 3 WHERE id IN (5, 8);  -- Orcs/Worg
UPDATE enemies SET loot_table_id = 4 WHERE id = 6;       -- Dark Mage
UPDATE enemies SET loot_table_id = 6 WHERE id IN (9, 10, 11); -- MiniBosses
UPDATE enemies SET loot_table_id = 5 WHERE id IN (12, 13);    -- Bosses

-- ============================================
-- 10. ACHIEVEMENTS (10 iniciales)
-- ============================================
INSERT INTO achievements (id, title, description, category, criteria_type, criteria, reward_exp, reward_gold, points_value) VALUES
(1, 'First Blood', 'Defeat your first enemy', 'combat', 'count', '{"stat": "total_kills", "threshold": 1}', 100, 50, 10),
(2, 'Dungeon Delver', 'Complete your first dungeon', 'exploration', 'count', '{"stat": "dungeons_completed", "threshold": 1}', 500, 200, 25),
(3, 'Goblin Slayer', 'Defeat 50 goblins', 'combat', 'count', '{"stat": "goblin_kills", "threshold": 50}', 1000, 500, 50),
(4, 'Master Craftsman', 'Craft 10 items', 'crafting', 'count', '{"stat": "items_crafted", "threshold": 10}', 800, 300, 40),
(5, 'Social Butterfly', 'Join 5 different parties', 'social', 'count', '{"stat": "parties_joined", "threshold": 5}', 600, 250, 30),
(6, 'Treasure Hunter', 'Collect 25 items', 'collection', 'count', '{"stat": "unique_items_collected", "threshold": 25}', 1200, 600, 60),
(7, 'Orc Bane', 'Defeat the Orc Warlord', 'combat', 'special', '{"type": "boss_kill", "boss_id": 12}', 2000, 1000, 100),
(8, 'Rich Adventurer', 'Accumulate 10,000 gold', 'economy', 'value', '{"stat": "total_gold_earned", "threshold": 10000}', 1500, 0, 75),
(9, 'Skill Master', 'Reach level 10 in any skill', 'progression', 'value', '{"stat": "max_skill_level", "threshold": 10}', 800, 400, 40),
(10, 'Party Leader', 'Form and complete a dungeon with a full party', 'social', 'composite', '{"conditions": [{"stat": "parties_formed", "threshold": 1}, {"stat": "full_party_dungeons", "threshold": 1}]}', 1000, 500, 50);

-- ============================================
-- 11. SAMPLE PLAYERS (3 para testing)
-- ============================================
INSERT INTO players (id, username, email, password_hash, character_name, race_id, class_id, level, strength, dexterity, agility, constitution, intelligence, perception, willpower, gold) VALUES
(1, 'test_warrior', 'warrior@test.com', '$2b$10$hashedpassword123', 'Thrain', 3, 1, 3, 15, 10, 9, 14, 8, 10, 12, 500),
(2, 'test_mage', 'mage@test.com', '$2b$10$hashedpassword456', 'Elara', 2, 2, 3, 8, 12, 11, 10, 16, 14, 15, 450),
(3, 'test_rogue', 'rogue@test.com', '$2b$10$hashedpassword789', 'Silas', 5, 3, 3, 10, 16, 17, 11, 12, 15, 10, 550);

-- ============================================
-- 12. PLAYER SKILLS (Skills aprendidos)
-- ============================================
INSERT INTO player_skills (player_id, skill_id, skill_level, is_equipped, slot_number) VALUES
-- Warrior skills
(1, 1, 3, TRUE, 1),  -- Axemanship
(1, 2, 4, TRUE, 2),  -- Close Combat
(1, 3, 1, TRUE, 3),  -- Berserker Rage
(1, 23, 2, TRUE, 4), -- Toughness (from Fighter)

-- Mage skills
(2, 5, 4, TRUE, 1),  -- Fire Magic
(2, 6, 3, TRUE, 2),  -- Magic Missile
(2, 8, 2, TRUE, 3),  -- Mana Regeneration
(2, 7, 1, TRUE, 4),  -- Offensive Magery

-- Rogue skills
(3, 9, 3, TRUE, 1),  -- Ambush
(3, 10, 4, TRUE, 2), -- Acrobatics
(3, 11, 3, TRUE, 3), -- Dodge Blow
(3, 12, 2, TRUE, 4); -- Tinker

-- ============================================
-- 13. PLAYER INVENTORY (Items iniciales)
-- ============================================
INSERT INTO player_inventory (player_id, item_id, quantity, equipped, slot_type) VALUES
-- Warrior equipment
(1, 2, 1, TRUE, 'Weapon'),    -- Iron Longsword
(1, 8, 1, TRUE, 'Armor'),     -- Chainmail
(1, 14, 1, TRUE, 'Accessory'), -- Strength Bracers
(1, 15, 5, FALSE, 'Consumable'), -- Health Potions

-- Mage equipment
(2, 4, 1, TRUE, 'Weapon'),    -- Mage Staff
(2, 10, 1, TRUE, 'Armor'),    -- Mage Robes
(2, 13, 1, TRUE, 'Accessory'), -- Mana Ring
(2, 16, 5, FALSE, 'Consumable'), -- Mana Potions

-- Rogue equipment
(3, 6, 1, TRUE, 'Weapon'),    -- Assassin Dagger
(3, 11, 1, TRUE, 'Armor'),    -- Ranger Cloak
(3, 12, 1, TRUE, 'Accessory'), -- Health Amulet
(3, 15, 3, FALSE, 'Consumable'); -- Health Potions

-- ============================================
-- 14. PLAYER STATS (Stats iniciales)
-- ============================================
INSERT INTO player_stats (player_id, total_kills, dungeons_completed, total_gold_earned) VALUES
(1, 12, 0, 600),
(2, 8, 0, 500),
(3, 15, 0, 700);

-- ============================================
-- 15. SYSTEM INITIALIZATION
-- ============================================

-- Primer tick schedule
INSERT INTO tick_schedule (tick_number, scheduled_time, status) VALUES
(1, DATE_ADD(NOW(), INTERVAL 2 HOUR), 'pending');

-- ============================================
-- FIN DEL SEED - MIGRATION COMPLETA
-- ============================================

-- Verificar conteo
SELECT 'Races' as table_name, COUNT(*) as count FROM races
UNION ALL SELECT 'Classes', COUNT(*) FROM classes
UNION ALL SELECT 'Skills', COUNT(*) FROM skills
UNION ALL SELECT 'Items', COUNT(*) FROM items
UNION ALL SELECT 'Enemies', COUNT(*) FROM enemies
UNION ALL SELECT 'Dungeons', COUNT(*) FROM dungeons
UNION ALL SELECT 'Achievements', COUNT(*) FROM achievements
UNION ALL SELECT 'Players', COUNT(*) FROM players
ORDER BY table_name;
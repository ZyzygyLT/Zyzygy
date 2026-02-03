/**
 * Sistema de Posicionamiento Táctico (4 Zonas)
 * Frente, Lados, Medio, Atrás con distribución de aggro y modificadores
 */

class PositioningSystem {
    constructor() {
        this.POSITION_CONSTANTS = {
            ZONES: {
                FRONT: { id: 'front', name: 'Frente', sizeLimit: 2 },
                SIDES: { id: 'sides', name: 'Lados', sizeLimit: 2 },
                MID: { id: 'mid', name: 'Medio', sizeLimit: 1 },
                BACK: { id: 'back', name: 'Atrás', sizeLimit: 2 }
            },
            ZONE_CAPACITIES: {
                FRONT: 2, SIDES: 2, MID: 1, BACK: 2, TOTAL: 7
            },
            AGRO_SYSTEM: {
                BASE_AGRO_WEIGHTS: {
                    FRONT: 0.65, SIDES: 0.20, MID: 0.10, BACK: 0.05
                },
                AGRO_MODIFIERS: {
                    TANK_CLASS: 2.0, DAMAGE_DEALT: 1.5, HEALING_DONE: 1.2,
                    THREAT_SKILLS: 3.0, STEALTH: 0.1, LOW_HEALTH: 1.8, RECENTLY_HIT: 1.3
                },
                AGRO_DECAY: { PER_TURN: 0.15, MINIMUM: 0.1, RESET_ON_ACTION: true }
            },
            ATTACK_RANGES: {
                MELEE: {
                    from_FRONT: ['FRONT', 'SIDES'],
                    from_SIDES: ['FRONT', 'SIDES', 'MID'],
                    from_MID: ['SIDES', 'MID'],
                    from_BACK: ['MID', 'BACK']
                },
                RANGED: {
                    from_FRONT: ['FRONT', 'SIDES', 'MID'],
                    from_SIDES: ['FRONT', 'SIDES', 'MID', 'BACK'],
                    from_MID: ['FRONT', 'SIDES', 'MID', 'BACK'],
                    from_BACK: ['FRONT', 'SIDES', 'MID', 'BACK']
                },
                MAGIC: {
                    from_FRONT: ['FRONT', 'SIDES'],
                    from_SIDES: ['FRONT', 'SIDES', 'MID'],
                    from_MID: ['FRONT', 'SIDES', 'MID', 'BACK'],
                    from_BACK: ['FRONT', 'SIDES', 'MID', 'BACK']
                },
                AOE: {
                    from_FRONT: ['FRONT', 'SIDES'],
                    from_SIDES: ['FRONT', 'SIDES', 'MID'],
                    from_MID: ['FRONT', 'SIDES', 'MID', 'BACK'],
                    from_BACK: ['SIDES', 'MID', 'BACK']
                }
            }
        };
    }

    initializeFormation(party) {
        if (!Array.isArray(party) || party.length === 0) {
            throw new Error('Se requiere un array de combatientes no vacío');
        }
        if (party.length > this.POSITION_CONSTANTS.ZONE_CAPACITIES.TOTAL) {
            throw new Error(`Máximo ${this.POSITION_CONSTANTS.ZONE_CAPACITIES.TOTAL} combatientes permitidos`);
        }

        const formation = {
            partyId: this.generateFormationId(),
            timestamp: new Date().toISOString(),
            zones: { FRONT: [], SIDES: [], MID: [], BACK: [] },
            combatants: {},
            agroTable: {},
            turn: 1
        };

        this.assignInitialPositions(formation, party);
        this.initializeAgroTable(formation);
        
        return formation;
    }

    assignInitialPositions(formation, party) {
        const sortedParty = [...party].sort((a, b) => {
            const roleOrder = { TANK: 1, MELEE_DPS: 2, SUPPORT: 3, RANGED_DPS: 4, MAGE: 5 };
            const aRole = a.role || 'MELEE_DPS';
            const bRole = b.role || 'MELEE_DPS';
            return (roleOrder[aRole] || 3) - (roleOrder[bRole] || 3);
        });

        const zoneQueue = ['FRONT', 'SIDES', 'MID', 'BACK'];
        let zoneIndex = 0;
        let side = 'left';

        sortedParty.forEach(combatant => {
            formation.combatants[combatant.id] = {
                ...combatant,
                originalRole: combatant.role,
                originalPosition: null
            };

            // Skip dead combatants
            if (combatant.currentHealth !== undefined && combatant.currentHealth <= 0) {
                return;
            }

            let assignedZone = this.determineInitialZone(combatant, formation);
            while (this.isZoneFull(formation, assignedZone)) {
                zoneIndex = (zoneIndex + 1) % zoneQueue.length;
                assignedZone = zoneQueue[zoneIndex];
            }

            this.addToZone(formation, assignedZone, combatant.id, assignedZone === 'SIDES' ? side : null);
            if (assignedZone === 'SIDES') {
                side = side === 'left' ? 'right' : 'left';
            }
        });
    }

    determineInitialZone(combatant, formation) {
        const role = combatant.role || 'MELEE_DPS';
        switch (role) {
            case 'TANK': return 'FRONT';
            case 'MELEE_DPS': return !this.isZoneFull(formation, 'SIDES') ? 'SIDES' : 'FRONT';
            case 'SUPPORT': return !this.isZoneFull(formation, 'MID') ? 'MID' : 'BACK';
            case 'RANGED_DPS': return !this.isZoneFull(formation, 'BACK') ? 'BACK' : 'MID';
            case 'MAGE': return !this.isZoneFull(formation, 'BACK') ? 'BACK' : 'MID';
            default: return 'MID';
        }
    }

    addToZone(formation, zone, combatantId, side = null) {
        if (!formation.zones[zone]) formation.zones[zone] = [];
        const combatant = formation.combatants[combatantId];
        combatant.position = zone;
        combatant.side = side;
        combatant.positionIndex = formation.zones[zone].length;
        formation.zones[zone].push({ id: combatantId, name: combatant.name, side: side, index: combatant.positionIndex });
    }

    removeFromZone(formation, zone, combatantId) {
        if (!formation.zones[zone]) return;
        formation.zones[zone] = formation.zones[zone].filter(c => c.id !== combatantId);
        formation.zones[zone].forEach((c, index) => {
            if (formation.combatants[c.id]) formation.combatants[c.id].positionIndex = index;
        });
        if (formation.combatants[combatantId]) {
            formation.combatants[combatantId].position = null;
            formation.combatants[combatantId].side = null;
            formation.combatants[combatantId].positionIndex = null;
        }
    }

    initializeAgroTable(formation) {
        formation.agroTable = {};
        Object.values(formation.combatants).forEach(combatant => {
            let baseAgro = this.POSITION_CONSTANTS.AGRO_SYSTEM.BASE_AGRO_WEIGHTS[combatant.position || 'MID'];
            if (combatant.role === 'TANK') {
                baseAgro *= this.POSITION_CONSTANTS.AGRO_SYSTEM.AGRO_MODIFIERS.TANK_CLASS;
            }
            formation.agroTable[combatant.id] = baseAgro;
        });
    }

    selectTarget(formation, attacker = null, attackType = 'MELEE') {
        const aliveCombatants = this.getAliveCombatants(formation);
        if (aliveCombatants.length === 0) {
            return { selected: null, reason: 'No hay combatientes vivos', candidates: [] };
        }

        const attackerPosition = attacker ? this.getCombatantPosition(formation, attacker.id) : null;
        const reachableTargets = attackerPosition ? 
            this.getReachableTargets(formation, attackerPosition, attackType, attacker) : 
            aliveCombatants;

        if (reachableTargets.length === 0) {
            return { selected: null, reason: 'No hay objetivos alcanzables', candidates: [] };
        }

        const selectionWeights = this.calculateSelectionWeights(formation, reachableTargets, attacker);
        const selectedTarget = this.weightedRandomSelection(reachableTargets, selectionWeights);
        this.logTargetSelection(formation, attacker, selectedTarget, selectionWeights);

        return {
            selected: selectedTarget,
            attackerPosition: attackerPosition,
            selectionWeights: selectionWeights,
            reachableTargets: reachableTargets,
            totalCandidates: reachableTargets.length,
            selectionMethod: 'weighted_random',
            agroContribution: selectionWeights[selectedTarget.id] || 0
        };
    }

    getAliveCombatants(formation) {
        return Object.values(formation.combatants).filter(c => 
            (c.currentHealth === undefined || c.currentHealth > 0) && !c.isKnockedOut
        );
    }

    getCombatantPosition(formation, combatantId) {
        const combatant = formation.combatants[combatantId];
        return combatant ? combatant.position : null;
    }

    getReachableTargets(formation, fromPosition, attackType, attacker = null) {
        const aliveCombatants = this.getAliveCombatants(formation);
        const reachableZones = this.POSITION_CONSTANTS.ATTACK_RANGES[attackType][`from_${fromPosition}`] || [];
        return aliveCombatants.filter(combatant => 
            reachableZones.includes(combatant.position) && 
            (!attacker || combatant.id !== attacker.id)  // Exclude the attacker
        );
    }

    calculateSelectionWeights(formation, targets, attacker) {
        const weights = {};
        let totalWeight = 0;

        targets.forEach(target => {
            let weight = 0;
            const position = this.getCombatantPosition(formation, target.id);
            weight += this.POSITION_CONSTANTS.AGRO_SYSTEM.BASE_AGRO_WEIGHTS[position] || 0.1;

            const agro = formation.agroTable[target.id] || 0;
            const maxAgro = Math.max(...Object.values(formation.agroTable).filter(v => !isNaN(v)));
            weight += (agro / Math.max(maxAgro, 1)) * 0.3;

            if (target.currentHealth && target.maxHealth) {
                const healthPercent = target.currentHealth / target.maxHealth;
                weight += (1 - healthPercent) * 0.2;
            }

            if (target.role === 'TANK') weight *= 1.5;
            else if (target.role === 'HEALER') weight *= 1.3;

            weight = Math.max(0.01, weight);
            weights[target.id] = weight;
            totalWeight += weight;
        });

        if (totalWeight > 0) {
            Object.keys(weights).forEach(id => { weights[id] /= totalWeight; });
        }

        return weights;
    }

    weightedRandomSelection(items, weights) {
        const cumulativeWeights = [];
        let total = 0;

        items.forEach(item => {
            total += weights[item.id] || 0.01;
            cumulativeWeights.push(total);
        });

        const random = Math.random() * total;
        for (let i = 0; i < cumulativeWeights.length; i++) {
            if (random < cumulativeWeights[i]) return items[i];
        }

        return items[items.length - 1];
    }

    distributeAgro(formation, agroEvent) {
        const { source, amount, type = 'DAMAGE', targets = [] } = agroEvent;

        if (!source || amount <= 0) {
            throw new Error('Evento de agro inválido');
        }

        const distribution = {
            sourceId: source.id,
            sourceName: source.name,
            amount: amount,
            type: type,
            timestamp: new Date().toISOString(),
            distribution: {},
            totalDistributed: 0,
            zoneBreakdown: {}
        };

        const aliveCombatants = this.getAliveCombatants(formation);
        const distributionTargets = targets.length > 0 ? 
            targets.filter(t => aliveCombatants.some(c => c.id === t.id)) : 
            aliveCombatants;

        if (distributionTargets.length === 0) return distribution;

        const baseZoneWeights = this.calculateZoneWeights(formation);
        const eventModifier = this.getAgroEventModifier(type, source, null);
        
        // Apply event modifier to zone weights (not after distribution)
        // This way different event types produce different distributions
        const zoneWeights = { ...baseZoneWeights };
        if (type === 'TAUNT' || type === 'THREAT_SKILLS') {
            // TAUNT increases FRONT zone weight (where tank usually is)
            zoneWeights.FRONT = baseZoneWeights.FRONT * eventModifier;
        } else if (type === 'DAMAGE' || type === 'DAMAGE_DEALT') {
            // DAMAGE increases threat equally (modifier is 1.5, but we apply differently)
            // For DAMAGE, apply modifier to non-FRONT zones to make source of damage more threatening
            zoneWeights.SIDES = baseZoneWeights.SIDES * eventModifier;
            zoneWeights.MID = baseZoneWeights.MID * eventModifier;
            zoneWeights.BACK = baseZoneWeights.BACK * eventModifier;
        }
        
        let totalWeight = 0;

        // Calculate total weight with event-modified zone weights
        distributionTargets.forEach(target => {
            const targetPosition = this.getCombatantPosition(formation, target.id);
            if (!targetPosition) return;

            let weight = zoneWeights[targetPosition] || 0.1;
            weight *= this.getTargetAgroModifier(target);
            totalWeight += weight;
        });

        // Distribute agro with modified weights
        distributionTargets.forEach(target => {
            const targetPosition = this.getCombatantPosition(formation, target.id);
            if (!targetPosition) return;

            let weight = zoneWeights[targetPosition] || 0.1;
            weight *= this.getTargetAgroModifier(target);

            // Final amount preserves total = amount
            const finalAmount = totalWeight > 0 ? (amount * weight / totalWeight) : 0;
            
            this.applyAgro(formation, target.id, finalAmount);

            distribution.distribution[target.id] = {
                name: target.name,
                zone: targetPosition,
                weight: weight,  
                amount: finalAmount,
                totalAgro: formation.agroTable[target.id] || 0
            };

            distribution.totalDistributed += finalAmount;

            if (!distribution.zoneBreakdown[targetPosition]) {
                distribution.zoneBreakdown[targetPosition] = 0;
            }
            distribution.zoneBreakdown[targetPosition] += finalAmount;
        });

        return distribution;
    }

    calculateZoneWeights(formation) {
        return this.POSITION_CONSTANTS.AGRO_SYSTEM.BASE_AGRO_WEIGHTS;
    }

    getAgroEventModifier(eventType, source, target) {
        const modifiers = this.POSITION_CONSTANTS.AGRO_SYSTEM.AGRO_MODIFIERS;
        switch (eventType) {
            case 'DAMAGE_DEALT':
            case 'DAMAGE': return modifiers.DAMAGE_DEALT;
            case 'HEALING_DONE':
            case 'HEAL': return modifiers.HEALING_DONE;
            case 'THREAT_SKILLS':
            case 'TAUNT': return modifiers.THREAT_SKILLS;
            case 'RECENTLY_HIT':
            case 'HIT': return modifiers.RECENTLY_HIT;
            default: return 1.0;
        }
    }

    getTargetAgroModifier(target) {
        let modifier = 1.0;
        if (target.currentHealth && target.maxHealth) {
            const healthPercent = target.currentHealth / target.maxHealth;
            if (healthPercent < 0.3) {
                modifier *= this.POSITION_CONSTANTS.AGRO_SYSTEM.AGRO_MODIFIERS.LOW_HEALTH;
            }
        }
        if (target.hasStealth) {
            modifier *= this.POSITION_CONSTANTS.AGRO_SYSTEM.AGRO_MODIFIERS.STEALTH;
        }
        return modifier;
    }

    applyAgro(formation, combatantId, amount) {
        if (!formation.agroTable[combatantId]) formation.agroTable[combatantId] = 0;
        formation.agroTable[combatantId] += amount;
        const minAgro = this.POSITION_CONSTANTS.AGRO_SYSTEM.BASE_AGRO_WEIGHTS[
            formation.combatants[combatantId]?.position || 'MID'
        ] * this.POSITION_CONSTANTS.AGRO_SYSTEM.AGRO_DECAY.MINIMUM;
        formation.agroTable[combatantId] = Math.max(minAgro, formation.agroTable[combatantId]);
    }

    isZoneFull(formation, zone) {
        const zoneConfig = this.POSITION_CONSTANTS.ZONES[zone];
        if (!zoneConfig) return true;
        const currentCount = formation.zones[zone]?.length || 0;
        return currentCount >= zoneConfig.sizeLimit;
    }

    validateFormation(formation) {
        if (!formation || !formation.zones || !formation.combatants) {
            throw new Error('Formación inválida');
        }
    }

    logTargetSelection(formation, attacker, target, weights) {
        if (!formation.targetSelectionLog) formation.targetSelectionLog = [];
        formation.targetSelectionLog.push({
            turn: formation.turn || 1,
            attacker: attacker ? { id: attacker.id, name: attacker.name } : null,
            target: { id: target.id, name: target.name },
            targetZone: target.position,
            weights: weights,
            timestamp: new Date().toISOString()
        });
    }

    generateFormationId() {
        return `formation_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    }

    simulateTargetSelection(formation, iterations = 1000, attacker = null) {
        this.validateFormation(formation);
        const stats = {
            totalIterations: iterations,
            selections: {},
            byZone: {},
            byCombatant: {},
            attackTypeDistribution: { MELEE: { selections: 0, targets: {} }, RANGED: { selections: 0, targets: {} }, MAGIC: { selections: 0, targets: {} }, AOE: { selections: 0, targets: {} } },
            agroCorrelation: []
        };

        Object.keys(formation.zones).forEach(zone => { stats.byZone[zone] = 0; });
        Object.keys(formation.combatants).forEach(combatantId => {
            stats.byCombatant[combatantId] = {
                name: formation.combatants[combatantId].name,
                selections: 0,
                percentage: 0,
                zone: this.getCombatantPosition(formation, combatantId)
            };
        });

        for (let i = 0; i < iterations; i++) {
            const attackTypes = ['MELEE', 'RANGED', 'MAGIC', 'AOE'];
            const attackType = attackTypes[i % attackTypes.length];
            const selection = this.selectTarget(formation, attacker, attackType);

            if (selection.selected) {
                const targetId = selection.selected.id;
                const targetZone = this.getCombatantPosition(formation, targetId);
                stats.selections[i] = { targetId: targetId, targetName: selection.selected.name, zone: targetZone, attackType: attackType, agroWeight: selection.agroContribution };
                stats.byZone[targetZone]++;
                stats.byCombatant[targetId].selections++;
                stats.attackTypeDistribution[attackType].selections++;
                if (!stats.attackTypeDistribution[attackType].targets[targetId]) stats.attackTypeDistribution[attackType].targets[targetId] = 0;
                stats.attackTypeDistribution[attackType].targets[targetId]++;
                const agro = formation.agroTable[targetId] || 0;
                stats.agroCorrelation.push({ targetId: targetId, agro: agro, selected: true });
            }
        }

        Object.keys(stats.byCombatant).forEach(combatantId => {
            stats.byCombatant[combatantId].percentage = (stats.byCombatant[combatantId].selections / iterations * 100).toFixed(2);
        });

        stats.zoneDistribution = {};
        Object.keys(stats.byZone).forEach(zone => {
            stats.zoneDistribution[zone] = {
                selections: stats.byZone[zone],
                percentage: (stats.byZone[zone] / iterations * 100).toFixed(2),
                expected: (this.POSITION_CONSTANTS.AGRO_SYSTEM.BASE_AGRO_WEIGHTS[zone] * 100).toFixed(2)
            };
        });

        if (stats.agroCorrelation.length > 0) {
            const selectedTargets = stats.agroCorrelation.filter(s => s.selected);
            const totalAgro = selectedTargets.reduce((sum, s) => sum + s.agro, 0);
            const avgAgro = selectedTargets.length > 0 ? totalAgro / selectedTargets.length : 0;
            stats.agroStats = { averageAgroOfSelected: avgAgro.toFixed(2), correlation: this.calculateAgroCorrelation(stats.agroCorrelation), agroEffectiveness: this.calculateAgroEffectiveness(stats) };
        }

        stats.sortedByFrequency = Object.values(stats.byCombatant).sort((a, b) => b.selections - a.selections);
        return stats;
    }

    calculateAgroCorrelation(correlationData) {
        if (correlationData.length < 2) return 0;
        const selected = correlationData.filter(d => d.selected);
        const notSelected = correlationData.filter(d => !d.selected);
        if (selected.length === 0 || notSelected.length === 0) return 0;
        const avgSelected = selected.reduce((sum, d) => sum + d.agro, 0) / selected.length;
        const avgNotSelected = notSelected.reduce((sum, d) => sum + d.agro, 0) / notSelected.length;
        return ((avgSelected - avgNotSelected) / Math.max(avgNotSelected, 0.1)).toFixed(3);
    }

    calculateAgroEffectiveness(stats) {
        const expectedDistribution = this.POSITION_CONSTANTS.AGRO_SYSTEM.BASE_AGRO_WEIGHTS;
        const actualDistribution = stats.zoneDistribution;
        let effectiveness = 0;
        Object.keys(expectedDistribution).forEach(zone => {
            const expected = expectedDistribution[zone] * 100;
            const actual = parseFloat(actualDistribution[zone]?.percentage || 0);
            const diff = Math.abs(expected - actual);
            effectiveness += Math.max(0, 100 - diff);
        });
        return (effectiveness / Object.keys(expectedDistribution).length).toFixed(1);
    }

    generateFormationReport(formation) {
        let report = '═'.repeat(70) + '\n' + 'REPORTE DE FORMACIÓN TÁCTICA\n' + '═'.repeat(70) + '\n\n';
        report += '📊 RESUMEN DE FORMACIÓN:\n' + '─'.repeat(40) + '\n';
        report += `• ID: ${formation.partyId}\n`;
        report += `• Turno actual: ${formation.turn || 1}\n`;
        report += `• Combatientes totales: ${Object.keys(formation.combatants).length}\n`;
        report += `• Combatientes vivos: ${this.getAliveCombatants(formation).length}\n\n`;

        report += '🎯 DISTRIBUCIÓN POR ZONAS:\n' + '─'.repeat(40) + '\n';
        Object.entries(this.POSITION_CONSTANTS.ZONES).forEach(([zoneKey, zoneInfo]) => {
            const occupants = formation.zones[zoneKey] || [];
            const aliveInZone = occupants.filter(occ => {
                const combatant = formation.combatants[occ.id];
                return combatant && combatant.currentHealth > 0;
            }).length;

            report += `\n${zoneInfo.name} (${zoneKey}):\n`;
            report += `  • Capacidad: ${aliveInZone}/${zoneInfo.sizeLimit}\n`;
            report += `  • Peso de agro: ${(this.POSITION_CONSTANTS.AGRO_SYSTEM.BASE_AGRO_WEIGHTS[zoneKey] * 100).toFixed(1)}%\n`;

            if (occupants.length > 0) {
                occupants.forEach(occ => {
                    const combatant = formation.combatants[occ.id];
                    const status = combatant.currentHealth > 0 ? '✅' : '💀';
                    const agro = formation.agroTable[occ.id] || 0;
                    report += `  ${status} ${combatant.name} (${combatant.role || 'Sin rol'})`;
                    report += ` - Agro: ${agro.toFixed(2)}`;
                    if (occ.side) report += ` - Lado: ${occ.side}`;
                    report += '\n';
                });
            } else {
                report += '  • Vacío\n';
            }
        });

        report += '\n🛡️ TABLA DE AGRO (AMENAZA):\n' + '─'.repeat(40) + '\n';
        const sortedAgro = Object.entries(formation.agroTable || {}).sort(([, a], [, b]) => b - a);
        sortedAgro.forEach(([combatantId, agro]) => {
            const combatant = formation.combatants[combatantId];
            if (combatant) {
                const healthPercent = combatant.maxHealth > 0 ? (combatant.currentHealth / combatant.maxHealth * 100).toFixed(0) : '0';
                report += `• ${combatant.name}: ${agro.toFixed(3)}`;
                report += ` (${combatant.position}, ${healthPercent}% HP)\n`;
            }
        });

        if (formation.targetSelectionLog && formation.targetSelectionLog.length > 0) {
            const recentSelections = formation.targetSelectionLog.slice(-5);
            report += '\n🎯 SELECCIONES RECIENTES:\n' + '─'.repeat(40) + '\n';
            recentSelections.forEach(selection => {
                report += `• Turno ${selection.turn}: `;
                if (selection.attacker) report += `${selection.attacker.name} → `;
                report += `${selection.target.name} (${selection.targetZone})\n`;
            });
        }

        return report;
    }
}

module.exports = PositioningSystem;

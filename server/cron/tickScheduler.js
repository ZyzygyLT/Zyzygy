/**
 * Cron Job para ejecutar ticks automáticamente
 */

const cron = require('node-cron');
const TickProcessor = require('../engine/tickProcessor');

class TickScheduler {
    constructor() {
        this.tickProcessor = new TickProcessor();
        this.isRunning = false;
        this.lastExecution = null;
        this.executionCount = 0;
        
        // Configurar intervalo (cada 2 horas en producción, cada 2 minutos en desarrollo)
        this.schedule = process.env.NODE_ENV === 'production' ? '0 */2 * * *' : '*/2 * * * *';
        
        console.log(`Tick scheduler configurado: ${this.schedule}`);
        console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
    }

    /**
     * Inicia el scheduler
     */
    start() {
        if (this.isRunning) {
            console.log('Scheduler ya está corriendo');
            return;
        }

        console.log('Iniciando Tick Scheduler...');
        
        // Programar tarea
        this.task = cron.schedule(this.schedule, async () => {
            await this.executeScheduledTick();
        }, {
            scheduled: true,
            timezone: "America/New_York"
        });

        this.isRunning = true;
        console.log('Tick Scheduler iniciado correctamente');
        
        // Ejecutar inmediatamente en desarrollo
        if (process.env.NODE_ENV !== 'production') {
            console.log('Ejecutando tick inicial en modo desarrollo...');
            setTimeout(() => this.executeScheduledTick(), 5000);
        }
    }

    /**
     * Detiene el scheduler
     */
    stop() {
        if (this.task) {
            this.task.stop();
            console.log('Tick Scheduler detenido');
        }
        this.isRunning = false;
    }

    /**
     * Ejecuta un tick programado
     */
    async executeScheduledTick() {
        if (this.isProcessing) {
            console.log('Ya hay un tick en proceso, saltando...');
            return;
        }

        this.isProcessing = true;
        this.executionCount++;
        
        const executionNumber = this.executionCount;
        const startTime = Date.now();
        
        console.log(`\n=== EJECUTANDO TICK PROGRAMADO #${executionNumber} ===`);
        console.log(`Hora: ${new Date().toLocaleString()}`);
        
        try {
            const result = await this.tickProcessor.executeTick();
            
            const duration = Date.now() - startTime;
            this.lastExecution = {
                number: executionNumber,
                timestamp: new Date().toISOString(),
                duration,
                result: {
                    partiesProcessed: result.partiesProcessed || 0,
                    battles: result.totalBattles || 0,
                    xp: result.totalXpDistributed || 0,
                    loot: result.totalLootDistributed || 0
                }
            };
            
            console.log(`Tick #${executionNumber} completado en ${duration}ms`);
            
            // Enviar notificación (opcional)
            await this.sendNotification(result);
            
        } catch (error) {
            console.error(`Error en tick programado #${executionNumber}:`, error);
            this.lastExecution = {
                number: executionNumber,
                timestamp: new Date().toISOString(),
                error: error.message,
                duration: Date.now() - startTime
            };
        } finally {
            this.isProcessing = false;
            
            // Registrar en log
            await this.logExecution();
        }
    }

    /**
     * Ejecuta un tick manualmente
     */
    async executeManualTick() {
        console.log('=== EJECUTANDO TICK MANUAL ===');
        
        try {
            const result = await this.tickProcessor.executeTick();
            console.log('Tick manual completado');
            return result;
        } catch (error) {
            console.error('Error en tick manual:', error);
            throw error;
        }
    }

    /**
     * Envía notificación del resultado (ejemplo)
     */
    async sendNotification(tickResult) {
        // Aquí podrías integrar con Discord, Email, etc.
        const summary = {
            timestamp: new Date().toLocaleString(),
            parties: tickResult.partiesProcessed || 0,
            battles: tickResult.totalBattles || 0,
            xp: tickResult.totalXpDistributed || 0,
            loot: tickResult.totalLootDistributed || 0
        };
        
        console.log('Resumen del tick:', summary);
        
        // Ejemplo: Guardar en archivo para monitoreo
        const logEntry = {
            timestamp: new Date().toISOString(),
            summary,
            details: tickResult
        };
        
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            const monitorDir = path.join(__dirname, '../../monitor_logs');
            await fs.mkdir(monitorDir, { recursive: true });
            
            const monitorFile = path.join(monitorDir, 'tick_monitor.json');
            let monitorData = [];
            
            try {
                const existing = await fs.readFile(monitorFile, 'utf8');
                monitorData = JSON.parse(existing);
            } catch (error) {
                // Archivo no existe, empezar nuevo
            }
            
            monitorData.push(logEntry);
            
            // Mantener solo últimos 100 registros
            if (monitorData.length > 100) {
                monitorData = monitorData.slice(-100);
            }
            
            await fs.writeFile(monitorFile, JSON.stringify(monitorData, null, 2), 'utf8');
            
        } catch (error) {
            console.error('Error guardando monitor log:', error);
        }
    }

    /**
     * Registra la ejecución
     */
    async logExecution() {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            const logDir = path.join(__dirname, '../../scheduler_logs');
            await fs.mkdir(logDir, { recursive: true });
            
            const logFile = path.join(logDir, 'executions.json');
            let executions = [];
            
            try {
                const existing = await fs.readFile(logFile, 'utf8');
                executions = JSON.parse(existing);
            } catch (error) {
                // Archivo no existe
            }
            
            executions.push(this.lastExecution);
            
            // Mantener solo últimos 50 ejecuciones
            if (executions.length > 50) {
                executions = executions.slice(-50);
            }
            
            await fs.writeFile(logFile, JSON.stringify(executions, null, 2), 'utf8');
            
        } catch (error) {
            console.error('Error guardando log de ejecuciones:', error);
        }
    }

    /**
     * Obtiene estado del scheduler
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isProcessing: this.isProcessing || false,
            lastExecution: this.lastExecution,
            executionCount: this.executionCount,
            schedule: this.schedule,
            nextExecution: this.getNextExecutionTime()
        };
    }

    /**
     * Calcula próxima ejecución
     */
    getNextExecutionTime() {
        if (!this.isRunning || !this.task) return null;
        
        // node-cron no expone fácilmente la próxima ejecución
        // Esta es una aproximación
        const now = new Date();
        const next = new Date(now);
        
        if (this.schedule === '*/2 * * * *') {
            // Cada 2 minutos
            next.setMinutes(now.getMinutes() + 2);
        } else if (this.schedule === '0 */2 * * *') {
            // Cada 2 horas
            next.setHours(now.getHours() + 2);
            next.setMinutes(0);
            next.setSeconds(0);
            next.setMilliseconds(0);
        }
        
        return next.toISOString();
    }
}

module.exports = TickScheduler;

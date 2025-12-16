import mongoose from "mongoose";
import LuyoaSyncQueue from "../models/LuyoaSyncQueue.js";
import luyoaSyncService from "../services/luyoaSyncService.js";
import { v4 as uuidv4 } from "uuid";

/**
 * LuyoaSyncWorker - Procesador de cola de sincronización con Luyoa
 *
 * Este worker puede ejecutarse:
 * 1. Como proceso separado: node src/workers/luyoaSyncWorker.js
 * 2. Dentro del servidor principal via startWorker()
 *
 * Características:
 * - Polling configurable
 * - Procesamiento en lotes
 * - Manejo de errores con reintentos
 * - Graceful shutdown
 */

class LuyoaSyncWorker {
  constructor(options = {}) {
    this.workerId = options.workerId || `worker-${uuidv4().slice(0, 8)}`;
    this.pollInterval = options.pollInterval || 5000; // 5 segundos
    this.batchSize = options.batchSize || 10;
    this.isRunning = false;
    this.currentJobs = new Map();
    this.stats = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      startedAt: null,
    };

    console.log(`[Luyoa Worker ${this.workerId}] Inicializado`);
  }

  /**
   * Iniciar el worker
   */
  async start() {
    if (this.isRunning) {
      console.warn(`[Luyoa Worker ${this.workerId}] Ya está ejecutándose`);
      return;
    }

    this.isRunning = true;
    this.stats.startedAt = new Date();
    console.log(`[Luyoa Worker ${this.workerId}] Iniciado`);

    // Registrar handlers para shutdown
    this._registerShutdownHandlers();

    // Iniciar loop de procesamiento
    await this._processLoop();
  }

  /**
   * Detener el worker
   */
  async stop() {
    console.log(`[Luyoa Worker ${this.workerId}] Deteniendo...`);
    this.isRunning = false;

    // Esperar a que terminen los jobs actuales
    if (this.currentJobs.size > 0) {
      console.log(`[Luyoa Worker ${this.workerId}] Esperando ${this.currentJobs.size} jobs en proceso...`);
      await Promise.all(Array.from(this.currentJobs.values()));
    }

    console.log(`[Luyoa Worker ${this.workerId}] Detenido`);
    this._printStats();
  }

  /**
   * Loop principal de procesamiento
   */
  async _processLoop() {
    while (this.isRunning) {
      try {
        const jobsProcessed = await this._processBatch();

        // Si no hay jobs, esperar antes de volver a intentar
        if (jobsProcessed === 0) {
          await this._sleep(this.pollInterval);
        }
      } catch (error) {
        console.error(`[Luyoa Worker ${this.workerId}] Error en loop:`, error);
        await this._sleep(this.pollInterval * 2);
      }
    }
  }

  /**
   * Procesar un lote de jobs
   */
  async _processBatch() {
    let jobsProcessed = 0;

    for (let i = 0; i < this.batchSize; i++) {
      if (!this.isRunning) break;

      const job = await LuyoaSyncQueue.getNextJob(this.workerId);
      if (!job) break;

      jobsProcessed++;
      this.stats.processed++;

      // Procesar job en paralelo
      const promise = this._processJob(job);
      this.currentJobs.set(job._id.toString(), promise);

      promise.finally(() => {
        this.currentJobs.delete(job._id.toString());
      });
    }

    // Esperar a que terminen los jobs del lote
    if (this.currentJobs.size > 0) {
      await Promise.allSettled(Array.from(this.currentJobs.values()));
    }

    return jobsProcessed;
  }

  /**
   * Procesar un job individual
   */
  async _processJob(job) {
    try {
      await luyoaSyncService.processJob(job);
      this.stats.succeeded++;
    } catch (error) {
      this.stats.failed++;
      // El error ya fue manejado en processJob
    }
  }

  /**
   * Registrar handlers de shutdown
   */
  _registerShutdownHandlers() {
    const shutdown = async (signal) => {
      console.log(`\n[Luyoa Worker ${this.workerId}] Recibido ${signal}`);
      await this.stop();
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }

  /**
   * Helper para dormir
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Imprimir estadísticas
   */
  _printStats() {
    const runtime = this.stats.startedAt
      ? Math.round((Date.now() - this.stats.startedAt.getTime()) / 1000)
      : 0;

    console.log(`
[Luyoa Worker ${this.workerId}] Estadísticas:
- Tiempo de ejecución: ${runtime}s
- Jobs procesados: ${this.stats.processed}
- Exitosos: ${this.stats.succeeded}
- Fallidos: ${this.stats.failed}
- Tasa de éxito: ${this.stats.processed > 0
      ? ((this.stats.succeeded / this.stats.processed) * 100).toFixed(1)
      : 0}%
    `);
  }

  /**
   * Obtener estadísticas actuales
   */
  getStats() {
    return {
      ...this.stats,
      currentJobs: this.currentJobs.size,
      isRunning: this.isRunning,
    };
  }
}

/**
 * Función para iniciar el worker desde el servidor principal
 */
let workerInstance = null;

export const startLuyoaWorker = (options = {}) => {
  if (workerInstance && workerInstance.isRunning) {
    console.log("[Luyoa Worker] Ya hay un worker ejecutándose");
    return workerInstance;
  }

  workerInstance = new LuyoaSyncWorker(options);
  workerInstance.start().catch(error => {
    console.error("[Luyoa Worker] Error al iniciar:", error);
  });

  return workerInstance;
};

export const stopLuyoaWorker = async () => {
  if (workerInstance) {
    await workerInstance.stop();
    workerInstance = null;
  }
};

export const getLuyoaWorkerStats = () => {
  return workerInstance ? workerInstance.getStats() : null;
};

export default LuyoaSyncWorker;

// Si se ejecuta directamente como script
const isMainModule = process.argv[1]?.includes("luyoaSyncWorker");
if (isMainModule) {
  console.log("[Luyoa Worker] Ejecutando como proceso independiente");

  // Cargar variables de entorno
  import("dotenv").then(dotenv => {
    dotenv.config();

    // Conectar a MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/florerias";

    mongoose.connect(MONGODB_URI)
      .then(() => {
        console.log("[Luyoa Worker] Conectado a MongoDB");
        const worker = new LuyoaSyncWorker();
        worker.start();
      })
      .catch(error => {
        console.error("[Luyoa Worker] Error conectando a MongoDB:", error);
        process.exit(1);
      });
  });
}

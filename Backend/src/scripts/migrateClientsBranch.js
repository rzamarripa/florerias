import mongoose from 'mongoose';
import { Client } from '../models/Client.js';
import { Branch } from '../models/Branch.js';
import { Company } from '../models/Company.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Función principal de migración
const migrateClientsBranch = async () => {
  try {
    console.log('\n🔄 Iniciando migración de clientes para agregar sucursal...\n');

    // Obtener todos los clientes sin sucursal asignada
    const clientsWithoutBranch = await Client.find({ 
      branch: { $in: [null, undefined] } 
    }).populate('company');

    console.log(`📊 Clientes encontrados sin sucursal: ${clientsWithoutBranch.length}`);

    if (clientsWithoutBranch.length === 0) {
      console.log('✅ No hay clientes para migrar');
      return;
    }

    let migrated = 0;
    let errors = 0;

    for (const client of clientsWithoutBranch) {
      try {
        if (!client.company) {
          console.log(`⚠️  Cliente ${client.clientNumber} - ${client.name} ${client.lastName}: No tiene empresa asignada`);
          errors++;
          continue;
        }

        // Buscar la primera sucursal activa de la empresa del cliente
        const branch = await Branch.findOne({ 
          companyId: client.company._id,
          isActive: true 
        }).sort({ createdAt: 1 }); // Ordenar por la más antigua primero

        if (branch) {
          // Asignar la sucursal al cliente
          client.branch = branch._id;
          await client.save();
          
          console.log(`✅ Cliente ${client.clientNumber} - ${client.name} ${client.lastName}: Asignado a sucursal "${branch.branchName}"`);
          migrated++;
        } else {
          console.log(`⚠️  Cliente ${client.clientNumber} - ${client.name} ${client.lastName}: No se encontró sucursal activa para la empresa ${client.company.legalName || client.company.tradeName}`);
          errors++;
        }
      } catch (error) {
        console.error(`❌ Error migrando cliente ${client._id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Resumen de migración:');
    console.log(`   - Clientes migrados exitosamente: ${migrated}`);
    console.log(`   - Clientes con errores: ${errors}`);
    console.log(`   - Total procesados: ${clientsWithoutBranch.length}`);

    // Verificación final
    const remainingClientsWithoutBranch = await Client.countDocuments({ 
      branch: { $in: [null, undefined] } 
    });

    console.log(`\n📊 Clientes sin sucursal después de la migración: ${remainingClientsWithoutBranch}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
};

// Ejecutar migración
const main = async () => {
  await connectDB();
  await migrateClientsBranch();
  
  console.log('\n✅ Migración completada');
  process.exit(0);
};

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  process.exit(1);
});

// Ejecutar el script
main();
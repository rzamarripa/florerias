const { MongoClient } = require('mongodb');
const fs = require('fs');

// ⚠️ IMPORTANTE: Cambiar estos valores para producción
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB || 'florerias';
const BRANCH_ID = process.env.BRANCH_ID; // ID de la sucursal en producción

async function importColonias() {
  if (!BRANCH_ID) {
    console.error('❌ Error: Debes proporcionar BRANCH_ID como variable de entorno');
    console.log('Uso: BRANCH_ID=<id_sucursal> node import_colonias.cjs');
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db(DB_NAME);

    // Leer archivo exportado (mismo directorio que el script)
    const path = require('path');
    const filePath = path.join(__dirname, 'colonias_export.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`📦 Colonias a importar: ${data.length}`);

    // Convertir BRANCH_ID a ObjectId
    const { ObjectId } = require('mongodb');
    const branchObjectId = new ObjectId(BRANCH_ID);

    // Verificar que la sucursal existe
    const branch = await db.collection('cv_branches').findOne({ _id: branchObjectId });
    if (!branch) {
      console.error('❌ Error: Sucursal no encontrada con ID:', BRANCH_ID);
      process.exit(1);
    }
    console.log(`✅ Sucursal encontrada: ${branch.branchName}`);

    // Preparar documentos para inserción
    const now = new Date();
    const documents = data.map(c => ({
      name: c.name,
      priceDelivery: c.priceDelivery,
      status: c.status,
      branch: branchObjectId,
      createdAt: now,
      updatedAt: now
    }));

    // Insertar colonias (usando bulkWrite para manejar duplicados)
    let inserted = 0;
    let skipped = 0;

    for (const doc of documents) {
      try {
        await db.collection('cv_neighborhoods').updateOne(
          { name: doc.name, branch: doc.branch },
          { $setOnInsert: doc },
          { upsert: true }
        );
        inserted++;
      } catch (error) {
        if (error.code === 11000) {
          skipped++;
        } else {
          throw error;
        }
      }
    }

    console.log(`✅ Importación completada:`);
    console.log(`   - Insertadas/actualizadas: ${inserted}`);
    console.log(`   - Omitidas (duplicados): ${skipped}`);

    // Verificar total en la base de datos
    const total = await db.collection('cv_neighborhoods').countDocuments({ branch: branchObjectId });
    console.log(`📊 Total de colonias en la sucursal: ${total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

importColonias();

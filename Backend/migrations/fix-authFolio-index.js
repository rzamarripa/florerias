import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixAuthFolioIndex = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('discountauths');

    // Listar índices existentes
    console.log('\n📋 Índices actuales:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
    });

    // Eliminar el índice único no-sparse si existe
    try {
      await collection.dropIndex('authFolio_1');
      console.log('\n✅ Índice authFolio_1 eliminado');
    } catch (error) {
      if (error.code === 27) {
        console.log('\n⚠️  Índice authFolio_1 no existe (ya fue eliminado)');
      } else {
        throw error;
      }
    }

    // Crear el nuevo índice sparse
    await collection.createIndex(
      { authFolio: 1 },
      { unique: true, sparse: true }
    );
    console.log('✅ Nuevo índice sparse creado: authFolio_1 (unique, sparse)');

    // Listar índices después del cambio
    console.log('\n📋 Índices después de la migración:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key, index.sparse ? '(sparse)' : '');
    });

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
};

fixAuthFolioIndex();

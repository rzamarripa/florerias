import mongoose from 'mongoose';
import { Page } from './src/models/Page.js';
import { Module } from './src/models/Module.js';
import { Role } from './src/models/Roles.js';
import dotenv from 'dotenv';

dotenv.config();

const verify = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('📊 Verificando datos creados:\n');

    const pages = await Page.find().sort({ path: 1 });
    console.log('✓ Páginas encontradas:', pages.length);

    const modules = await Module.find().populate('page', 'name path');
    console.log('✓ Módulos encontrados:', modules.length);

    const roles = await Role.find().populate('modules');
    console.log('✓ Roles encontrados:', roles.length);

    console.log('\n📄 Primeras 5 páginas:');
    pages.slice(0, 5).forEach(p => console.log(`  • ${p.name} → ${p.path}`));

    console.log('\n🔧 Módulos de la primera página (' + pages[0]?.name + '):');
    const firstPageModules = modules.filter(m => m.page?._id.toString() === pages[0]?._id.toString());
    firstPageModules.forEach(m => console.log(`  • ${m.name}`));

    console.log('\n👥 Roles creados:');
    roles.forEach(r => console.log(`  • ${r.name}: ${r.modules.length} módulos`));

    console.log('\n✅ Verificación completada exitosamente\n');

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    await mongoose.disconnect();
  }
};

verify();

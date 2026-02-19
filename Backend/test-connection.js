import https from 'https';
import mongoose from 'mongoose';

// Función para obtener las IPs de MongoDB Atlas usando DNS sobre HTTPS
async function getMongoDBHosts() {
  return new Promise((resolve, reject) => {
    // Usar DNS de Cloudflare sobre HTTPS
    const options = {
      hostname: '1.1.1.1',
      path: '/dns-query?name=_mongodb._tcp.cluster0.sg6ov.mongodb.net&type=SRV',
      method: 'GET',
      headers: {
        'Accept': 'application/dns-json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.Answer) {
            console.log('✅ Registros SRV encontrados:', result.Answer);
            // Extraer los hostnames de los registros SRV
            const hosts = result.Answer.map(record => {
              const parts = record.data.split(' ');
              return parts[parts.length - 1].replace(/\.$/, '');
            });
            resolve(hosts);
          } else {
            reject(new Error('No se encontraron registros SRV'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Función para obtener la IP de un hostname
async function resolveHostname(hostname) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '1.1.1.1',
      path: `/dns-query?name=${hostname}&type=A`,
      method: 'GET',
      headers: {
        'Accept': 'application/dns-json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.Answer && result.Answer[0]) {
            console.log(`✅ ${hostname} → ${result.Answer[0].data}`);
            resolve({
              hostname: hostname,
              ip: result.Answer[0].data
            });
          } else {
            reject(new Error(`No se pudo resolver ${hostname}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testConnection() {
  try {
    console.log('🔍 Intentando resolver MongoDB Atlas hosts...\n');
    
    // Primero intentar obtener los hosts via SRV
    try {
      const srvHosts = await getMongoDBHosts();
      console.log('\n📋 Hosts encontrados:', srvHosts);
      
      // Resolver cada host a su IP
      const resolvedHosts = await Promise.all(
        srvHosts.map(host => resolveHostname(host))
      );
      
      console.log('\n✅ Todos los hosts resueltos correctamente');
      
    } catch (srvError) {
      console.log('⚠️ No se pudieron obtener registros SRV, probando con hosts conocidos...\n');
      
      // Si falla SRV, intentar con los hosts estándar de MongoDB Atlas
      const standardHosts = [
        'cluster0-shard-00-00.sg6ov.mongodb.net',
        'cluster0-shard-00-01.sg6ov.mongodb.net',
        'cluster0-shard-00-02.sg6ov.mongodb.net'
      ];
      
      for (const host of standardHosts) {
        try {
          const resolved = await resolveHostname(host);
          console.log(`✅ Resuelto: ${resolved.hostname} → ${resolved.ip}`);
        } catch (e) {
          console.log(`❌ No se pudo resolver ${host}`);
        }
      }
    }
    
    console.log('\n📝 Construyendo cadena de conexión directa...');
    
    // Construir la cadena de conexión directa
    const directConnectionString = 
      'mongodb://root:Birilusa55@' +
      'cluster0-shard-00-00.sg6ov.mongodb.net:27017,' +
      'cluster0-shard-00-01.sg6ov.mongodb.net:27017,' +
      'cluster0-shard-00-02.sg6ov.mongodb.net:27017/' +
      'miapp?ssl=true&replicaSet=atlas-xxxxxx-shard-0&authSource=admin&retryWrites=true&w=majority';
    
    console.log('\n🔧 Cadena de conexión directa:');
    console.log(directConnectionString);
    
    console.log('\n🔄 Intentando conectar con MongoDB...');
    
    // Intentar conectar
    await mongoose.connect(directConnectionString, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ ¡Conexión exitosa!');
    console.log('\n📋 Actualiza tu archivo .env con esta cadena de conexión:');
    console.log(`MONGODB_URI=${directConnectionString}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    console.log('\n💡 Soluciones alternativas:');
    console.log('1. Usa un servicio VPN que tenga DNS funcionales');
    console.log('2. Prueba desde otra red (móvil hotspot, etc)');
    console.log('3. Usa MongoDB Compass para obtener la cadena de conexión directa');
    console.log('4. Contacta a tu administrador de red sobre el bloqueo de DNS SRV');
    
    process.exit(1);
  }
}

testConnection();
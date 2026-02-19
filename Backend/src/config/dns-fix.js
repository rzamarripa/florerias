import dns from 'dns';
import { Resolver } from 'dns/promises';

// Crear un resolver personalizado con DNS públicos
const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

// Sobrescribir el resolver por defecto de Node.js
dns.promises.setServers = resolver.setServers.bind(resolver);

// Parche para el módulo dns sincrónico
const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  // Si es una función de 2 argumentos
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  // Intentar resolver con DNS públicos primero
  resolver.resolve4(hostname)
    .then(addresses => {
      if (addresses && addresses.length > 0) {
        callback(null, addresses[0], 4);
      } else {
        // Fallback al método original
        originalLookup.call(dns, hostname, options, callback);
      }
    })
    .catch(() => {
      // Si falla, usar el método original
      originalLookup.call(dns, hostname, options, callback);
    });
};

console.log('✅ DNS fix aplicado - usando servidores DNS públicos');

export default resolver;
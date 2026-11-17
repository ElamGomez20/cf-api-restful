// Practica 9: API RESTful minima para recibir mediciones del ESP32.
// No requiere instalar paquetes: usa Node.js.
const http = require('node:http');
const PORT = Number(process.env.PORT) || 3000;
const mediciones = [];

function responder(res, codigo, datos) {
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(datos, null, 2));
}

const servidor = http.createServer((req, res) => {
  const ruta = (req.url || '').split('?')[0];
  if (req.method === 'OPTIONS') return responder(res, 204, {});

  if (req.method === 'GET' && ruta === '/') {
    return responder(res, 200, {
      mensaje: 'API RESTful de la Practica 9 funcionando',
      instrucciones: 'GET /sensores para consultar; POST /sensores para guardar'
    });
  }

  if (req.method === 'GET' && ruta === '/sensores') {
    return responder(res, 200, mediciones);
  }

  if (req.method === 'POST' && ruta === '/sensores') {
    let contenido = '';
    req.on('data', parte => {
      contenido += parte;
      if (contenido.length > 8192) req.destroy();
    });
    req.on('end', () => {
      let datos;
      try {
        datos = JSON.parse(contenido);
      } catch {
        return responder(res, 400, { error: 'Se esperaba un JSON valido' });
      }
      if (datos === null || typeof datos !== 'object' || Array.isArray(datos)
          || datos.valor === undefined || typeof datos.unidad !== 'string') {
        return responder(res, 400, { error: 'Se requieren valor y unidad' });
      }
      const valor = Number(datos.valor);
      if (!Number.isFinite(valor)) {
        return responder(res, 400, { error: 'valor debe ser numerico' });
      }
      const medicion = {
        valor: String(datos.valor),
        unidad: datos.unidad,
        fecha: new Date().toISOString()
      };
      mediciones.push(medicion);
      if (mediciones.length > 100) mediciones.shift();
      console.log('Medicion recibida:', medicion);
      return responder(res, 201, { mensaje: 'Medicion guardada', medicion });
    });
    return;
  }

  responder(res, 404, { error: 'Ruta no encontrada' });
});

servidor.listen(PORT, '0.0.0.0', () => {
  console.log(`API lista en http://localhost:${PORT}`);
  console.log('GET /sensores | POST /sensores');
});

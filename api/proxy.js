const https = require('https');

async function fetchFromCRTM(url) {
  const options = {
    rejectUnauthorized: false,
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  };

 return new Promise((resolve, reject) => {
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
}

export default async function handler(req, res) {
  let { stopId } = req.query;
  
  // 1. LIMPIEZA DE DATOS: Asegurar que el ID tiene 5 cifras (el famoso cero de Torrelodones)
  if (stopId && stopId.length === 4) {
    stopId = "0" + stopId;
  }

  // 2. ESTRATEGIA DE RUTAS: Probamos la oficial de 2026 y la de respaldo
  const urls = [
    `https://itinerarios.crtm.es/tiempos_paso.php?id_parada=8_${stopId}`, // Interurbanos (611, 612...)
    `https://itinerarios.crtm.es/tiempos_paso.php?id_parada=${stopId}`    // Urbanos y otros
  ];

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  for (const url of urls) {
    try {
      const result = await callCRTM(url);
      // Si el servidor nos devuelve una tabla con datos real (más de 300 caracteres)
      if (result && result.length > 300 && !result.includes("No se han encontrado")) {
        return res.status(200).json({ html: result });
      }
    } catch (e) {
      continue; // Si falla una URL, salta a la siguiente
    }
  }

  // 3. RESPUESTA SI NADA FUNCIONA
  res.status(200).json({ 
    error: `No hay buses previstos ahora en la parada ${stopId}.`,
    html: "" 
  });
}

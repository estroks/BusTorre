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
      if (res.statusCode === 404) {
        reject(new Error('404'));
        return;
      }
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
}

export default async function handler(req, res) {
  const { stopId } = req.query;
  
  // Lista de URLs posibles que el CRTM usa en 2026
  const urlsToTry = [
    `https://itinerarios.crtm.es/tiempos_paso.php?id_parada=${stopId}`, // Ruta directa
    `https://itinerarios.crtm.es/tiempos_paso.php?id_parada=8_${stopId}`, // Ruta con zona interurbana
    `https://www.crtm.es/widgets/tst/tst.php?s=${stopId}` // Ruta antigua (por si acaso)
  ];

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  for (const url of urlsToTry) {
    try {
      const html = await fetchFromCRTM(url);
      if (html && html.length > 200) {
        return res.status(200).json({ html });
      }
    } catch (e) {
      // Si da 404, el bucle sigue con la siguiente URL
      continue;
    }
  }

  res.status(404).json({ error: "No se han encontrado tiempos para esta parada en ninguna de las rutas del Consorcio." });
}

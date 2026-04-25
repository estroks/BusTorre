const https = require('https');

async function callCRTM(url) {
  const options = {
    rejectUnauthorized: false,
    timeout: 5000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cache-Control': 'no-cache'
    }
  };

  return new Promise((resolve, reject) => {
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ html: data, status: res.statusCode }));
    }).on('error', (err) => reject(err));
  });
}

export default async function handler(req, res) {
  let { stopId } = req.query;
  
  // Limpieza: nos aseguramos de tener el formato de 5 cifras
  if (stopId && stopId.length === 4) stopId = "0" + stopId;

  // URLs en orden de probabilidad de éxito en 2026
  const urls = [
    `https://itinerarios.crtm.es/tiempos_paso.php?id_parada=8_${stopId}`,
    `https://itinerarios.crtm.es/m/tiempos_paso.php?id_parada=8_${stopId}`, // Versión mobile
    `https://www.crtm.es/widgets/tst/tst.php?s=8_${stopId}`
  ];

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  for (const url of urls) {
    try {
      const response = await callCRTM(url);
      // RELAJAMOS LA CONDICIÓN: Si hay HTML y no es un error obvio, lo enviamos
      if (response.html && response.html.length > 150) {
        // Si el HTML contiene "No hay", lo enviamos igual para que el usuario sepa que conectó
        return res.status(200).json({ html: response.html });
      }
    } catch (e) { continue; }
  }

  res.status(200).json({ 
    error: `No hay conexión con el Consorcio para la parada ${stopId}. Intenta refrescar.`,
    html: "" 
  });
}

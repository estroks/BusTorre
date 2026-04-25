const https = require('https');

async function callCRTM(url) {
  const options = {
    rejectUnauthorized: false,
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9'
    }
  };

  return new Promise((resolve) => {
    https.get(url, options, (res) => {
      let data = '';
      // Si el código no es 200 (OK), devolvemos null para que el bucle siga
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(null));
  });
}

export default async function handler(req, res) {
  let { stopId } = req.query;
  if (stopId && stopId.length === 4) stopId = "0" + stopId;

  // ESTAS SON LAS URLS QUE FUNCIONAN POR QR EN 2026
  const urls = [
    `https://itinerarios.crtm.es/itinerarios/index.php?parada=8_${stopId}`, // Formato QR
    `https://itinerarios.crtm.es/tiempos_paso.php?id_parada=8_${stopId}`,
    `https://www.crtm.es/widgets/tst/tst.php?s=8_${stopId}`
  ];

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  for (const url of urls) {
    const html = await callCRTM(url);
    // Si recibimos algo que parece una tabla de tiempos o el panel del Consorcio
    if (html && html.includes('tiempo')) {
      return res.status(200).json({ html });
    }
    // Si la respuesta es corta pero tiene contenido, también la enviamos por si acaso
    if (html && html.length > 500) {
      return res.status(200).json({ html });
    }
  }

  res.status(200).json({ 
    error: `No hay información en tiempo real para la parada ${stopId}. Es posible que no haya buses ahora.` 
  });
}

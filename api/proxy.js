const https = require('https');

async function callCRTM(url) {
  const options = {
    rejectUnauthorized: false,
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Referer': 'https://www.crtm.es/',
      'Connection': 'keep-alive'
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
  if (stopId && stopId.length === 4) stopId = "0" + stopId;

  // En 2026, estas son las dos formas en que el Consorcio responde
  const urls = [
    `https://itinerarios.crtm.es/tiempos_paso.php?id_parada=8_${stopId}`,
    `https://itinerarios.crtm.es/tiempos_paso.php?id_parada=${stopId}`
  ];

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Probamos la primera URL
    let html = await callCRTM(urls[0]);
    
    // Si la primera falla o es muy corta, probamos la segunda
    if (!html || html.length < 500) {
      html = await callCRTM(urls[1]);
    }

    // Enviamos lo que sea que hayamos obtenido
    return res.status(200).json({ html: html });

  } catch (e) {
    return res.status(200).json({ error: "Error de conexión: " + e.message });
  }
}

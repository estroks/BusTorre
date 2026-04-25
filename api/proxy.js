const https = require('https');

export default async function handler(req, res) {
  const { stopId } = req.query;

  // En Torrelodones, las interurbanas (611, 612...) necesitan el prefijo 8_
  // Las urbanas (L1, L2...) a veces van sin él. Probamos con 8_ por defecto.
  const url = `https://itinerarios.crtm.es/tiempos_paso.php?id_parada=8_${stopId}`;

  const options = {
    rejectUnauthorized: false, // Esto ignora el error de SSL que te daba antes
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.8'
    }
  };

  return new Promise((resolve) => {
    https.get(url, options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ html: data });
        resolve();
      });

    }).on("error", (err) => {
      res.status(500).json({ error: "Fallo al conectar con CRTM: " + err.message });
      resolve();
    });
  });
}

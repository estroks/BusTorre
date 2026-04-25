export default async function handler(req, res) {
  const { stopId } = req.query;

  // Intentamos la URL que suele ser más estable en 2026
  const url = `https://itinerarios.crtm.es/tiempos_paso.php?id_parada=${stopId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) throw new Error(`CRTM respondió con status ${response.status}`);

    const html = await response.text();
    
    // Devolvemos el HTML a tu web
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ html });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

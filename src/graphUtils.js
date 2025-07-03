// src/graphUtils.js
const neo4j = require("neo4j-driver");

async function getRutaOptima(session, origen, destino, zonasBloqueadas = []) {
  const query = `
    MATCH (start:CentroDistribucion {nombre: $origen}),
          (end:Zona {nombre: $destino})
    CALL apoc.algo.dijkstra(start, end, 'CONECTA>', 'tiempo_minutos') YIELD path, weight
    WITH path, weight, [n IN nodes(path) | n.nombre] AS ruta
    WHERE NONE(z IN ruta WHERE z IN $zonasBloqueadas)
    RETURN ruta, weight
    ORDER BY weight ASC
    LIMIT 1
  `;
  const result = await session.run(query, {
    origen,
    destino,
    zonasBloqueadas,
  });

  const record = result.records[0];
  return record
    ? {
        ruta: record.get("ruta"),
        tiempo_total: record.get("weight"),
      }
    : null;
}

module.exports = { getRutaOptima };

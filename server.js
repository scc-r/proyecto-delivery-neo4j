// delivery-neo4j/server.js

const express = require('express');
const neo4j = require('neo4j-driver');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Load Neo4j configuration
const { driver } = require('./neo4j-config');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Helper to run Cypher queries
async function runQuery(cypher, params = {}) {
  const session = driver.session({ database: 'neo4j' }); // Cambiado a 'neo4j'

  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

// Endpoint: Modelado e Inserción Inicial
app.post('/api/initialize', async (req, res) => {
  const session = driver.session({ database: 'neo4j' }); // Cambiado a 'neo4j'
  try {
    await session.writeTransaction(async tx => {
      // Limpiar todo
      await tx.run(`MATCH (n) DETACH DELETE n`);

      // Centros de distribución
      await tx.run(`MERGE (:CentroDistribucion {nombre: "Almacen Puerto Ordaz"})`);
      await tx.run(`MERGE (:CentroDistribucion {nombre: "Almacen San Felix"})`);

      // Puentes
      await tx.run(`MERGE (:Puente {nombre: "Puente Caroni"})`);
      await tx.run(`MERGE (:Puente {nombre: "Puente Angosturita"})`);

      // Zonas
      await tx.run(`MERGE (:Zona {nombre: "Mercado de Unare", tipo_zona: "comercial"})`);
      await tx.run(`MERGE (:Zona {nombre: "Unare I", tipo_zona: "residencial"})`);
      await tx.run(`MERGE (:Zona {nombre: "Alta Vista", tipo_zona: "comercial"})`);
      await tx.run(`MERGE (:Zona {nombre: "Chilemex", tipo_zona: "residencial"})`);
      await tx.run(`MERGE (:Zona {nombre: "Centro de Puerto Ordaz", tipo_zona: "comercial"})`);
      await tx.run(`MERGE (:Zona {nombre: "Centro de San Felix", tipo_zona: "comercial"})`);
      await tx.run(`MERGE (:Zona {nombre: "Dalla Costa", tipo_zona: "residencial"})`);
      await tx.run(`MERGE (:Zona {nombre: "El Roble", tipo_zona: "residencial"})`);

      // Relaciones
      await tx.run(`MATCH (c1:CentroDistribucion {nombre: "Almacen Puerto Ordaz"}), (z1:Zona {nombre: "Mercado de Unare"})
        MERGE (c1)-[:CONECTA {tiempo_minutos: 6, capacidad: 130, trafico_actual: 'medio'}]->(z1)
        MERGE (z1)-[:CONECTA {tiempo_minutos: 5, capacidad: 130, trafico_actual: 'medio'}]->(c1)`);

      await tx.run(`MATCH (z1:Zona {nombre: "Mercado de Unare"}), (z2:Zona {nombre: "Unare I"})
        MERGE (z1)-[:CONECTA {tiempo_minutos: 3, capacidad: 140, trafico_actual: 'medio'}]->(z2)
        MERGE (z2)-[:CONECTA {tiempo_minutos: 4, capacidad: 140, trafico_actual: 'medio'}]->(z1)`);

      await tx.run(`MATCH (z2:Zona {nombre: "Unare I"}), (z3:Zona {nombre: "Alta Vista"})
        MERGE (z2)-[:CONECTA {tiempo_minutos: 8, capacidad: 140, trafico_actual: 'alto'}]->(z3)
        MERGE (z3)-[:CONECTA {tiempo_minutos: 8, capacidad: 140, trafico_actual: 'alto'}]->(z2)`);

      await tx.run(`MATCH (z3:Zona {nombre: "Alta Vista"}), (c1:CentroDistribucion {nombre: "Almacen Puerto Ordaz"})
        MERGE (z3)-[:CONECTA {tiempo_minutos: 5, capacidad: 160, trafico_actual: 'bajo'}]->(c1)
        MERGE (c1)-[:CONECTA {tiempo_minutos: 3, capacidad: 160, trafico_actual: 'bajo'}]->(z3)`);

      await tx.run(`MATCH (z3:Zona {nombre: "Alta Vista"}), (z4:Zona {nombre: "Chilemex"})
        MERGE (z3)-[:CONECTA {tiempo_minutos: 5, capacidad: 110, trafico_actual: 'medio'}]->(z4)
        MERGE (z4)-[:CONECTA {tiempo_minutos: 5, capacidad: 110, trafico_actual: 'medio'}]->(z3)`);

      await tx.run(`MATCH (z4:Zona {nombre: "Chilemex"}), (z5:Zona {nombre: "Centro de Puerto Ordaz"})
        MERGE (z4)-[:CONECTA {tiempo_minutos: 5, capacidad: 120, trafico_actual: 'medio'}]->(z5)
        MERGE (z5)-[:CONECTA {tiempo_minutos: 5, capacidad: 120, trafico_actual: 'medio'}]->(z4)`);

      await tx.run(`MATCH (z5:Zona {nombre: "Centro de Puerto Ordaz"}), (p1:Puente {nombre: "Puente Caroni"})
        MERGE (z5)-[:CONECTA {tiempo_minutos: 6, capacidad: 200, trafico_actual: 'bajo'}]->(p1)
        MERGE (p1)-[:CONECTA {tiempo_minutos: 8, capacidad: 200, trafico_actual: 'bajo'}]->(z5)`);

      await tx.run(`MATCH (p1:Puente {nombre: "Puente Caroni"}), (z7:Zona {nombre: "Dalla Costa"})
        MERGE (p1)-[:CONECTA {tiempo_minutos: 4, capacidad: 90, trafico_actual: 'medio'}]->(z7)
        MERGE (z7)-[:CONECTA {tiempo_minutos: 7, capacidad: 90, trafico_actual: 'medio'}]->(p1)`);

      await tx.run(`MATCH (z7:Zona {nombre: "Dalla Costa"}), (z6:Zona {nombre: "Centro de San Felix"})
        MERGE (z7)-[:CONECTA {tiempo_minutos: 10, capacidad: 90, trafico_actual: 'medio'}]->(z6)
        MERGE (z6)-[:CONECTA {tiempo_minutos: 12, capacidad: 90, trafico_actual: 'medio'}]->(z7)`);

      await tx.run(`MATCH (z7:Zona {nombre: "Dalla Costa"}), (z8:Zona {nombre: "El Roble"})
        MERGE (z7)-[:CONECTA {tiempo_minutos: 8, capacidad: 80, trafico_actual: 'alto'}]->(z8)
        MERGE (z8)-[:CONECTA {tiempo_minutos: 5, capacidad: 80, trafico_actual: 'alto'}]->(z7)`);

      await tx.run(`MATCH (z8:Zona {nombre: "El Roble"}), (z6:Zona {nombre: "Centro de San Felix"})
        MERGE (z8)-[:CONECTA {tiempo_minutos: 8, capacidad: 90, trafico_actual: 'medio'}]->(z6)
        MERGE (z6)-[:CONECTA {tiempo_minutos: 6, capacidad: 90, trafico_actual: 'medio'}]->(z8)`);

      await tx.run(`MATCH (z6:Zona {nombre: "Centro de San Felix"}), (c2:CentroDistribucion {nombre: "Almacen San Felix"})
        MERGE (z6)-[:CONECTA {tiempo_minutos: 2, capacidad: 150, trafico_actual: 'bajo'}]->(c2)
        MERGE (c2)-[:CONECTA {tiempo_minutos: 5, capacidad: 150, trafico_actual: 'bajo'}]->(z6)`);

      await tx.run(`MATCH (p1:Puente {nombre: "Puente Caroni"}), (z3:Zona {nombre: "Alta Vista"})
        MERGE (p1)-[:CONECTA {tiempo_minutos: 10, capacidad: 200, trafico_actual: 'medio'}]->(z3)
        MERGE (z3)-[:CONECTA {tiempo_minutos: 8, capacidad: 200, trafico_actual: 'medio'}]->(p1)`);

      await tx.run(`MATCH (p2:Puente {nombre: "Puente Angosturita"}), (z2:Zona {nombre: "Unare I"})
        MERGE (z2)-[:CONECTA {tiempo_minutos: 13, capacidad: 200, trafico_actual: 'bajo'}]->(p2)
        MERGE (p2)-[:CONECTA {tiempo_minutos: 17, capacidad: 200, trafico_actual: 'bajo'}]->(z2)`);

      await tx.run(`MATCH (p2:Puente {nombre: "Puente Angosturita"}), (z8:Zona {nombre: "El Roble"})
        MERGE (p2)-[:CONECTA {tiempo_minutos: 8, capacidad: 180, trafico_actual: 'bajo'}]->(z8)
        MERGE (z8)-[:CONECTA {tiempo_minutos: 7, capacidad: 180, trafico_actual: 'bajo'}]->(p2)`);
    });

    res.json({ message: 'Grafo inicializado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});



// Endpoint: Ruta más rápida (GDS Dijkstra con proyección en memoria y peso correcto)
app.post('/api/shortest-path', async (req, res) => {
  let { inicio, fin, zonasBloqueadas } = req.body;
  const session = driver.session({ database: 'neo4j' });
  try {
    // Limpia zonasBloqueadas: solo strings no vacíos
    if (!Array.isArray(zonasBloqueadas)) zonasBloqueadas = [];
    zonasBloqueadas = zonasBloqueadas.map(z => (z || '').trim()).filter(Boolean);
    console.log('Recibido para shortest-path:', { inicio, fin, zonasBloqueadas });
    const nodeQuery = 'MATCH (n) WHERE NOT n.nombre IN $zonasBloqueadas RETURN id(n) AS id';
    const relQuery = `
      MATCH (n)-[r:CONECTA]->(m)
      WHERE NOT n.nombre IN $zonasBloqueadas AND NOT m.nombre IN $zonasBloqueadas
      RETURN id(n) AS source, id(m) AS target, r.tiempo_minutos AS tiempo_minutos
    `;

    // Si ya existe el grafo, bórralo antes de crear uno nuevo
    try {
      await session.run(`CALL gds.graph.drop('grafo_delivery', false)`);
    } catch (e) {
      // Ignorar si no existe
    }
    const projectResult = await session.run(
      `CALL gds.graph.project.cypher(
        'grafo_delivery',
        $nodeQuery,
        $relQuery,
        { parameters: { zonasBloqueadas: $zonasBloqueadas } }
      ) YIELD graphName, nodeCount`,
      { nodeQuery, relQuery, zonasBloqueadas }
    );
    const nodeCount = projectResult.records[0]?.get('nodeCount') || 0;
    console.log('Nodos proyectados:', nodeCount);
    if (nodeCount === 0) {
      await session.run(`CALL gds.graph.drop('grafo_delivery', false)`).catch(() => {});
      return res.status(400).json({ error: 'No hay nodos válidos para calcular la ruta. Revisa las zonas bloqueadas.' });
    }

    // 2. Ejecuta Dijkstra usando el peso real
    const cypher = `
      MATCH (start {nombre: $inicio}), (end {nombre: $fin})
      CALL gds.shortestPath.dijkstra.stream('grafo_delivery', {
        sourceNode: id(start),
        targetNode: id(end),
        relationshipWeightProperty: 'tiempo_minutos'
      })
      YIELD index, sourceNode, targetNode, totalCost, nodeIds, costs, path
      WITH [nodeId IN nodeIds | gds.util.asNode(nodeId).nombre] AS nodos_en_ruta, totalCost
      RETURN nodos_en_ruta AS ruta, totalCost AS tiempo_total
      LIMIT 1
    `;
    const recordsResult = await session.run(cypher, { inicio, fin });
    const records = recordsResult.records;
    const result = records.map(r => {
      const obj = r.toObject();
      // Forzar conversión de tiempo si es Integer de neo4j
      if (obj.tiempo_total && typeof obj.tiempo_total.toNumber === 'function') {
        obj.tiempo_total = obj.tiempo_total.toNumber();
      } else if (obj.tiempo_total && typeof obj.tiempo_total.low !== 'undefined') {
        obj.tiempo_total = obj.tiempo_total.low;
      } else if (typeof obj.tiempo_total === 'object') {
        if (obj.tiempo_total && obj.tiempo_total.low !== undefined) {
          obj.tiempo_total = obj.tiempo_total.low;
        } else {
          obj.tiempo_total = Number(obj.tiempo_total) || 0;
        }
      }
      return obj;
    });
    console.log('Resultado Dijkstra:', result);

    // 3. Borra el grafo de memoria
    await session.run(`CALL gds.graph.drop('grafo_delivery', false)`);

    res.json(result);
  } catch (e) {
    console.error('Error en /api/shortest-path:', e);
    res.status(500).json({ error: e.message });
  } finally {
    await session.close();
  }
});

// Endpoint: Zonas Directamente Accesibles
app.get('/api/direct-access', async (req, res) => {
  const centro = req.query.centro;
  const tiempoMax = parseInt(req.query.tiempoMax);

  const cypher = `
    MATCH (c:CentroDistribucion {nombre: $centro})-[r:CONECTA]->(z:Zona)
    WHERE r.tiempo_minutos <= $tiempoMax
    RETURN z.nombre AS zona, r.tiempo_minutos AS tiempo, r.trafico_actual AS trafico
    ORDER BY tiempo ASC;
  `;

  const records = await runQuery(cypher, { centro, tiempoMax });
  const result = records.map(r => {
    const obj = r.toObject();
    // Forzar conversión de tiempo igual que en ruta más rápida
    if (obj.tiempo && typeof obj.tiempo.toNumber === 'function') {
      obj.tiempo = obj.tiempo.toNumber();
    } else if (obj.tiempo && typeof obj.tiempo.low !== 'undefined') {
      obj.tiempo = obj.tiempo.low;
    } else if (typeof obj.tiempo === 'object') {
      if (obj.tiempo && obj.tiempo.low !== undefined) {
        obj.tiempo = obj.tiempo.low;
      } else {
        obj.tiempo = Number(obj.tiempo) || 0;
      }
    }
    return obj;
  });
  res.json(result);
});

// Endpoint: Zonas Congestionadas
app.get('/api/congestion', async (req, res) => {
  const cypher = `
    MATCH (z1)-[r:CONECTA]->(z2)
    WHERE r.trafico_actual = 'alto' OR r.capacidad > 180
    RETURN z1.nombre AS origen, z2.nombre AS destino, r.tiempo_minutos AS minutos, r.capacidad
    ORDER BY minutos DESC;
  `;

  const records = await runQuery(cypher);
  const result = records.map(r => r.toObject());
  res.json(result);
});

// Endpoint: Zonas Congestionadas (calles con filtro de tráfico y conversión de tiempo/capacidad)
app.get('/api/congestionadas', async (req, res) => {
  const trafico = req.query.trafico;
  let where = '';
  if (trafico && ['alto','medio','bajo'].includes(trafico)) {
    where = `r.trafico_actual = '${trafico}'`;
  } else {
    where = `r.trafico_actual = 'alto' OR r.capacidad > 180`;
  }
  const cypher = `
    MATCH (n)-[r:CONECTA]->(m)
    WHERE ${where}
    RETURN n.nombre AS origen, m.nombre AS destino, r.tiempo_minutos AS tiempo, r.capacidad AS capacidad, r.trafico_actual AS trafico
    ORDER BY r.capacidad DESC, r.tiempo_minutos DESC
  `;
  const records = await runQuery(cypher);
  const result = records.map(r => {
    const obj = r.toObject();
    // Conversión de tiempo y capacidad igual que en zonas accesibles
    if (obj.tiempo && typeof obj.tiempo.toNumber === 'function') {
      obj.tiempo = obj.tiempo.toNumber();
    } else if (obj.tiempo && typeof obj.tiempo.low !== 'undefined') {
      obj.tiempo = obj.tiempo.low;
    } else if (typeof obj.tiempo === 'object') {
      if (obj.tiempo && obj.tiempo.low !== undefined) {
        obj.tiempo = obj.tiempo.low;
      } else {
        obj.tiempo = Number(obj.tiempo) || 0;
      }
    }
    if (obj.capacidad && typeof obj.capacidad.toNumber === 'function') {
      obj.capacidad = obj.capacidad.toNumber();
    } else if (obj.capacidad && typeof obj.capacidad.low !== 'undefined') {
      obj.capacidad = obj.capacidad.low;
    } else if (typeof obj.capacidad === 'object') {
      if (obj.capacidad && obj.capacidad.low !== undefined) {
        obj.capacidad = obj.capacidad.low;
      } else {
        obj.capacidad = Number(obj.capacidad) || 0;
      }
    }
    return obj;
  });
  res.json(result);
});

// Endpoint: Cerrar Calle
app.post('/api/close-road', async (req, res) => {
  const { origen, destino } = req.body;
  const cypher = `
    MATCH (a {nombre: $origen})-[r:CONECTA]->(b {nombre: $destino}) DELETE r;
    MATCH (b {nombre: $destino})-[r2:CONECTA]->(a {nombre: $origen}) DELETE r2;
  `;
  await runQuery(cypher, { origen, destino });
  res.json({ message: 'Calle cerrada.' });
});

// Endpoint: Reabrir Calle
app.post('/api/open-road', async (req, res) => {
  const { origen, destino, tiempo, capacidad, trafico } = req.body;
  const cypher = `
    MATCH (a {nombre: $origen}), (b {nombre: $destino})
    MERGE (a)-[:CONECTA {tiempo_minutos: $tiempo, capacidad: $capacidad, trafico_actual: $trafico}]->(b)
    MERGE (b)-[:CONECTA {tiempo_minutos: $tiempo, capacidad: $capacidad, trafico_actual: $trafico}]->(a);
  `;
  await runQuery(cypher, { origen, destino, tiempo, capacidad, trafico });
  res.json({ message: 'Calle reabierta.' });
});

// Endpoint: Actualizar Tiempo
app.post('/api/update-time', async (req, res) => {
  const { origen, destino, tiempo, trafico } = req.body;
  const cypher = `
    MATCH (a {nombre: $origen})-[r:CONECTA]->(b {nombre: $destino})
    SET r.tiempo_minutos = $tiempo, r.trafico_actual = $trafico;
    MATCH (b {nombre: $destino})-[r2:CONECTA]->(a {nombre: $origen})
    SET r2.tiempo_minutos = $tiempo, r2.trafico_actual = $trafico;
  `;
  await runQuery(cypher, { origen, destino, tiempo, trafico });
  res.json({ message: 'Tiempo actualizado.' });
});

// Nuevo endpoint para obtener todos los nodos y relaciones del grafo
app.get('/api/graph', async (req, res) => {
  const session = driver.session({ database: 'neo4j' });
  try {
    const cypher = `
      MATCH (n)
      OPTIONAL MATCH (n)-[r:CONECTA]->(m)
      RETURN n, r, m
    `;
    const result = await session.run(cypher);
    const nodes = {};
    const edges = [];
    result.records.forEach(record => {
      const n = record.get('n');
      const m = record.get('m');
      const r = record.get('r');
      if (n && n.properties && n.properties.nombre && !nodes[n.identity.toString()]) {
        nodes[n.identity.toString()] = {
          id: n.identity.toString(),
          label: n.properties.nombre,
          title: `<b>${n.properties.nombre}</b><br>Tipo: ${n.labels[0]}${n.properties.tipo_zona ? `<br>Zona: ${n.properties.tipo_zona}` : ''}`,
          color: n.labels[0] === 'CentroDistribucion' ? '#0074D9' : n.labels[0] === 'Puente' ? '#FF851B' : '#2ECC40',
          shape: n.labels[0] === 'CentroDistribucion' ? 'star' : n.labels[0] === 'Puente' ? 'triangle' : 'ellipse',
        };
      }
      if (m && m.properties && m.properties.nombre && !nodes[m.identity.toString()]) {
        nodes[m.identity.toString()] = {
          id: m.identity.toString(),
          label: m.properties.nombre,
          title: `<b>${m.properties.nombre}</b><br>Tipo: ${m.labels[0]}${m.properties.tipo_zona ? `<br>Zona: ${m.properties.tipo_zona}` : ''}`,
          color: m.labels[0] === 'CentroDistribucion' ? '#0074D9' : m.labels[0] === 'Puente' ? '#FF851B' : '#2ECC40',
          shape: m.labels[0] === 'CentroDistribucion' ? 'star' : m.labels[0] === 'Puente' ? 'triangle' : 'ellipse',
        };
      }
      if (r && n && m && r.properties && r.properties.tiempo_minutos && r.properties.capacidad && r.properties.trafico_actual) {
        edges.push({
          from: n.identity.toString(),
          to: m.identity.toString(),
          label: `${r.properties.tiempo_minutos} min\nCap: ${r.properties.capacidad}\nTráfico: ${r.properties.trafico_actual}`,
          color: r.properties.trafico_actual === 'alto' ? 'red' : (r.properties.trafico_actual === 'medio' ? 'orange' : 'green'),
          width: Math.max(2, Number(r.properties.capacidad) / 50),
          arrows: 'to',
          title: `<b>Conexión</b><br>Tiempo: ${r.properties.tiempo_minutos} min<br>Capacidad: ${r.properties.capacidad}<br>Tráfico: ${r.properties.trafico_actual}`
        });
      }
    });
    res.json({ nodes: Object.values(nodes), edges });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    await session.close();
  }
});

// Endpoint: Zonas aisladas por cierre de zona o conexiones
app.post('/api/zonas-aisladas', async (req, res) => {
  let { zonaBloqueada, conexionesBloqueadas } = req.body;
  // Filtrar conexionesBloqueadas para asegurar solo objetos válidos
  const conexionesBloqueadasFiltradas = Array.isArray(conexionesBloqueadas)
    ? conexionesBloqueadas.filter(
        r => r && r.origen && r.destino && typeof r.origen === 'string' && typeof r.destino === 'string' && r.origen.trim() && r.destino.trim()
      )
    : [];
  const cypher = `
    WITH $zonaBloqueada AS zonaBloqueada, $conexionesBloqueadas AS conexionesBloqueadas
    MATCH (z:Zona)
    WHERE (zonaBloqueada IS NULL OR z.nombre <> zonaBloqueada)
    WITH COLLECT(z.nombre) AS zonasValidas, zonaBloqueada, (CASE WHEN conexionesBloqueadas IS NULL THEN [] ELSE conexionesBloqueadas END) AS conexionesBloqueadas
    CALL {
      WITH conexionesBloqueadas
      UNWIND conexionesBloqueadas AS rel
      MATCH (a:Zona {nombre: rel.origen})-[r:CONECTA]->(b:Zona {nombre: rel.destino})
      RETURN collect(id(r)) AS relsIds
    }
    WITH zonasValidas, zonaBloqueada, coalesce(relsIds, []) AS relsIds
    MATCH (c:CentroDistribucion)
    CALL apoc.path.subgraphNodes(c, {
      relationshipFilter: "CONECTA>",
      labelFilter: "+Zona",
      maxLevel: 20,
      blacklistNodes: CASE WHEN zonaBloqueada IS NULL THEN [] ELSE [zonaBloqueada] END,
      blacklistRels: relsIds,
      uniqueness: "NODE_GLOBAL"
    }) YIELD node
    WHERE node:Zona
    WITH zonasValidas, COLLECT(DISTINCT node.nombre) AS alcanzadas
    WITH [z IN zonasValidas WHERE NOT z IN alcanzadas] AS zonasAisladas
    UNWIND zonasAisladas AS zona_aislada
    RETURN DISTINCT zona_aislada
    ORDER BY zona_aislada
  `;
  const session = driver.session({ database: 'neo4j' });
  try {
    const result = await session.run(cypher, { zonaBloqueada, conexionesBloqueadas: conexionesBloqueadasFiltradas });
    const zonas = result.records.map(r => r.get('zona_aislada'));
    res.json(zonas);
  } catch (e) {
    console.error('Error en /api/zonas-aisladas:', e);
    res.status(500).json({ error: e.message, stack: e.stack });
  } finally {
    await session.close();
  }
});

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));






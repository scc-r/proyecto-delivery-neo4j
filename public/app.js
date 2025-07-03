// CONTINÚA: public/app.js

async function inicializarGrafo() {
  await axios.post('/api/initialize');
  alert('Grafo inicializado');
}

// Llenar selects de centros, zonas y zonas bloqueadas automáticamente
async function poblarSelectsRuta() {
  try {
    const response = await axios.get('/api/graph');
    const { nodes } = response.data;
    const centros = nodes.filter(n => n.title.includes('CentroDistribucion'));
    const zonas = nodes.filter(n => n.title.includes('Zona'));
    const inicioSel = document.getElementById('inicio');
    const finSel = document.getElementById('fin');
    const selectBloqueada = document.getElementById('selectBloqueada');
    const centroAccesoSel = document.getElementById('centroAcceso');
    inicioSel.innerHTML = centros.map(c => `<option value="${c.label}">${c.label}</option>`).join('');
    finSel.innerHTML = zonas.map(z => `<option value="${z.label}">${z.label}</option>`).join('');
    selectBloqueada.innerHTML = '<option value="">--Selecciona zona--</option>' + zonas.map(z => `<option value="${z.label}">${z.label}</option>`).join('');
    if (centroAccesoSel) {
      centroAccesoSel.innerHTML = centros.map(c => `<option value="${c.label}">${c.label}</option>`).join('');
    }
  } catch (e) {
    console.error('Error al poblar selects:', e);
  }
}

// Agrupar conexiones por par único (A↔B)
function obtenerConexionesUnicas(edges, nodes) {
  const pares = {};
  edges.forEach(e => {
    const origen = nodes.find(n => n.id === e.from)?.label;
    const destino = nodes.find(n => n.id === e.to)?.label;
    if (!origen || !destino) return;
    const key = [origen, destino].sort().join('|');
    if (!pares[key]) pares[key] = { origen, destino };
  });
  return Object.values(pares);
}

// Poblar selects de zonas aisladas y conexiones
async function poblarSelectsZonasAisladas() {
  try {
    const response = await axios.get('/api/graph');
    const { nodes, edges } = response.data;
    const zonas = nodes.filter(n => n.title.includes('Zona'));
    const zonaAisladaSel = document.getElementById('zonaAislada');
    zonaAisladaSel.innerHTML = '<option value="">--Selecciona zona--</option>' + zonas.map(z => `<option value=\"${z.label}\">${z.label}</option>`).join('');
    // Agrupar conexiones por par único
    const conexionesUnicas = obtenerConexionesUnicas(edges, nodes);
    const conexionesSel = document.getElementById('conexionesBloquear');
    conexionesSel.innerHTML = conexionesUnicas.map(c => {
      return `<option value=\"${c.origen}|${c.destino}\">${c.origen} 194 ${c.destino}</option>`;
    }).join('');
    conexionesBloqueadas.length = 0;
    actualizarListaConexionesBloqueadas();
  } catch (e) {
    console.error('Error al poblar selects de zonas aisladas:', e);
  }
}

// Manejo de zonas bloqueadas
const zonasBloqueadas = [];
function agregarZonaBloqueada() {
  const select = document.getElementById('selectBloqueada');
  const zona = select.value;
  if (zona && !zonasBloqueadas.includes(zona)) {
    zonasBloqueadas.push(zona);
    actualizarListaBloqueadas();
    select.value = '';
  }
}
function actualizarListaBloqueadas() {
  const lista = document.getElementById('listaBloqueadas');
  lista.innerHTML = zonasBloqueadas.map(z => `<li style='display:inline;margin-right:8px;'>${z} <button onclick="quitarZonaBloqueada('${z}')">x</button></li>`).join('');
  document.getElementById('bloqueadas').value = zonasBloqueadas.join(',');
  // Deshabilita opciones ya bloqueadas en selectBloqueada
  const select = document.getElementById('selectBloqueada');
  for (let i = 0; i < select.options.length; i++) {
    select.options[i].disabled = zonasBloqueadas.includes(select.options[i].value);
  }
  // Deshabilita zonas bloqueadas en select de destino
  const finSel = document.getElementById('fin');
  for (let i = 0; i < finSel.options.length; i++) {
    finSel.options[i].disabled = zonasBloqueadas.includes(finSel.options[i].value);
  }
  // Evita que origen y destino sean iguales
  const inicioSel = document.getElementById('inicio');
  const origen = inicioSel.value;
  const destino = finSel.value;
  for (let i = 0; i < inicioSel.options.length; i++) {
    inicioSel.options[i].disabled = finSel.value && inicioSel.options[i].value === destino;
  }
  for (let i = 0; i < finSel.options.length; i++) {
    finSel.options[i].disabled = inicioSel.value && finSel.options[i].value === origen || zonasBloqueadas.includes(finSel.options[i].value);
  }
}
function quitarZonaBloqueada(zona) {
  const idx = zonasBloqueadas.indexOf(zona);
  if (idx !== -1) {
    zonasBloqueadas.splice(idx, 1);
    actualizarListaBloqueadas();
  }
}

// Manejo de conexiones bloqueadas para zonas aisladas
const conexionesBloqueadas = [];
function agregarConexionBloqueada() {
  const select = document.getElementById('conexionesBloquear');
  const value = select.value;
  if (value && !conexionesBloqueadas.includes(value)) {
    conexionesBloqueadas.push(value);
    actualizarListaConexionesBloqueadas();
    select.value = '';
  }
}
function actualizarListaConexionesBloqueadas() {
  const lista = document.getElementById('listaConexionesBloqueadas');
  lista.innerHTML = conexionesBloqueadas.map(c => {
    const [origen, destino] = c.split('|');
    return `<li style='display:inline;margin-right:8px;'>${origen} → ${destino} <button onclick=\"quitarConexionBloqueada('${c}')\">x</button></li>`;
  }).join('');
  // Deshabilita opciones ya bloqueadas en el select
  const select = document.getElementById('conexionesBloquear');
  for (let i = 0; i < select.options.length; i++) {
    select.options[i].disabled = conexionesBloqueadas.includes(select.options[i].value);
  }
}
function quitarConexionBloqueada(conexion) {
  const idx = conexionesBloqueadas.indexOf(conexion);
  if (idx !== -1) {
    conexionesBloqueadas.splice(idx, 1);
    actualizarListaConexionesBloqueadas();
  }
}

async function rutaMasRapida() {
  const inicio = document.getElementById('inicio').value;
  const fin = document.getElementById('fin').value;
  const bloqueadas = document.getElementById('bloqueadas').value.split(',').map(x => x.trim()).filter(Boolean);
  const { data } = await axios.post('/api/shortest-path', { inicio, fin, zonasBloqueadas: bloqueadas });
  if (data && data.length && data[0].ruta) {
    // Mostrar texto bonito
    const ruta = data[0].ruta;
    const tiempo = data[0].tiempo_total;
    document.getElementById('resultadoRuta').innerHTML =
      `<b>Ruta más rápida:</b> ${ruta.join(' → ')}<br><b>Tiempo total:</b> ${tiempo} min`;
    // Visualizar la ruta en el grafo
    visualizarRutaEnGrafo(ruta);
  } else {
    document.getElementById('resultadoRuta').innerHTML = '<b style="color:red">No se encontró ruta</b>';
    visualizarGrafo(); // Muestra el grafo completo si no hay ruta
  }
}

// Visualiza solo la ruta encontrada en el grafo
function visualizarRutaEnGrafo(ruta) {
  const container = document.getElementById('viz');
  container.innerHTML = '';
  axios.get('/api/graph').then(response => {
    const { nodes, edges } = response.data;
    // Filtrar nodos y edges solo de la ruta
    const nodosRuta = nodes.filter(n => ruta.includes(n.label));
    const edgesRuta = [];
    for (let i = 0; i < ruta.length - 1; i++) {
      const from = nodosRuta.find(n => n.label === ruta[i]);
      const to = nodosRuta.find(n => n.label === ruta[i + 1]);
      if (from && to) {
        const edge = edges.find(e => e.from === from.id && e.to === to.id);
        if (edge) edgesRuta.push(edge);
      }
    }
    const data = {
      nodes: new vis.DataSet(nodosRuta),
      edges: new vis.DataSet(edgesRuta)
    };
    const options = {
      nodes: {
        font: { size: 18, color: '#222', face: 'arial' },
        borderWidth: 2
      },
      edges: {
        font: { size: 14, color: '#333', face: 'arial' },
        arrows: 'to',
        smooth: true,
        color: { color: 'blue', highlight: 'red' },
        width: 4
      },
      physics: {
        enabled: true,
        barnesHut: { gravitationalConstant: -30000, springLength: 200 }
      }
    };
    new vis.Network(container, data, options);
  });
}

async function zonasAccesibles() {
  const centro = document.getElementById('centroAcceso').value;
  const tiempoMax = document.getElementById('maxMin').value;
  const { data } = await axios.get(`/api/direct-access?centro=${encodeURIComponent(centro)}&tiempoMax=${encodeURIComponent(tiempoMax)}`);
  // Salida bonita
  if (Array.isArray(data) && data.length > 0) {
    const lista = data.map(z => `<li><b>${z.zona}</b> <span style='color:#888'>(tiempo: ${z.tiempo} min)</span></li>`).join('');
    document.getElementById('resultadoAcceso').innerHTML = `<ul>${lista}</ul>`;
  } else {
    document.getElementById('resultadoAcceso').innerHTML = '<b style="color:red">No hay zonas accesibles en ese tiempo</b>';
  }
}

async function cerrarCalle() {
  const origen = document.getElementById('origenCalle').value;
  const destino = document.getElementById('destinoCalle').value;
  await axios.post('/api/close-road', { origen, destino });
  alert('Calle cerrada');
}

async function abrirCalle() {
  const origen = document.getElementById('origenCalle').value;
  const destino = document.getElementById('destinoCalle').value;
  await axios.post('/api/open-road', {
    origen,
    destino,
    tiempo: 10,
    capacidad: 100,
    trafico: 'medio',
  });
  alert('Calle reabierta');
}

async function actualizarTiempo() {
  const origen = document.getElementById('origenTr').value;
  const destino = document.getElementById('destinoTr').value;
  const tiempo = parseInt(document.getElementById('tiempoTr').value);
  const trafico = document.getElementById('nivelTr').value;
  await axios.post('/api/update-time', { origen, destino, tiempo, trafico });
  alert('Tiempo actualizado');
}

// Nueva visualización de grafo desde cero
async function visualizarGrafo() {
  // Limpia el contenedor
  const container = document.getElementById('viz');
  container.innerHTML = '';

  // Obtiene todos los nodos y relaciones desde el backend (usando Cypher personalizado)
  try {
    const response = await axios.get('/api/graph');
    const { nodes, edges } = response.data;

    // Crea un grafo con vis-network (más control y debug)
    const data = {
      nodes: new vis.DataSet(nodes),
      edges: new vis.DataSet(edges)
    };
    const options = {
      nodes: {
        font: { size: 18, color: '#222', face: 'arial' },
        borderWidth: 2
      },
      edges: {
        font: { size: 14, color: '#333', face: 'arial' },
        arrows: 'to',
        smooth: true
      },
      physics: {
        enabled: true,
        barnesHut: { gravitationalConstant: -30000, springLength: 200 }
      }
    };
    new vis.Network(container, data, options);
  } catch (e) {
    container.innerHTML = '<b style="color:red">Error al cargar el grafo</b>';
    console.error(e);
  }
}

async function mostrarCallesCongestionadas() {
  const filtro = document.getElementById('filtroTrafico').value;
  const { data } = await axios.get('/api/congestionadas' + (filtro ? `?trafico=${encodeURIComponent(filtro)}` : ''));
  const contenedor = document.getElementById('resultadoCongestion');
  if (Array.isArray(data) && data.length > 0) {
    // Agrupar por par de nodos (sin importar el sentido)
    const calles = {};
    data.forEach(c => {
      const key = [c.origen, c.destino].sort().join(' <-> ');
      if (!calles[key]) calles[key] = [];
      calles[key].push(c);
    });
    const lista = Object.entries(calles).map(([key, arr]) => {
      let detalles = arr.map(c =>
        `<div style='margin-left:10px;'>${c.origen} → ${c.destino}: <span style='color:#888'>(tiempo: ${c.tiempo} min, capacidad: ${c.capacidad}, tráfico: <b style='color:${c.trafico === 'alto' ? 'red' : (c.trafico === 'medio' ? 'orange' : 'green')}'>${c.trafico}</b>)</span></div>`
      ).join('');
      return `<li><b>${key}</b>${detalles}</li>`;
    }).join('');
    contenedor.innerHTML = `<ul>${lista}</ul>`;
  } else {
    contenedor.innerHTML = '<b style="color:red">No hay calles congestionadas</b>';
  }
}

// Consultar zonas aisladas
async function consultarZonasAisladas() {
  const zona = document.getElementById('zonaAislada').value;
  // Para cada conexión bloqueada, enviar ambos sentidos
  const conexiones = [];
  conexionesBloqueadas.forEach(c => {
    const [a, b] = c.split('|');
    conexiones.push({ origen: a, destino: b });
    conexiones.push({ origen: b, destino: a });
  });
  if (!zona && conexiones.length === 0) {
    document.getElementById('resultadoAisladas').innerHTML = '<b style="color:red">Selecciona al menos una zona o conexión a bloquear</b>';
    return;
  }
  try {
    const { data } = await axios.post('/api/zonas-aisladas', { zonaBloqueada: zona, conexionesBloqueadas: conexiones });
    if (Array.isArray(data) && data.length > 0) {
      const lista = data.map(z => `<li><b>${z}</b></li>`).join('');
      document.getElementById('resultadoAisladas').innerHTML = `<b>Zonas aisladas:</b><ul>${lista}</ul>`;
      resaltarZonasAisladasEnGrafo(data);
    } else {
      document.getElementById('resultadoAisladas').innerHTML = '<b style="color:green">No hay zonas aisladas</b>';
      visualizarGrafo();
    }
  } catch (e) {
    document.getElementById('resultadoAisladas').innerHTML = '<b style="color:red">Error al consultar zonas aisladas</b>';
    console.error(e);
  }
}

// Resalta zonas aisladas en el grafo
function resaltarZonasAisladasEnGrafo(zonas) {
  const container = document.getElementById('viz');
  container.innerHTML = '';
  axios.get('/api/graph').then(response => {
    const { nodes, edges } = response.data;
    // Marcar nodos aislados
    const nodesMod = nodes.map(n => zonas.includes(n.label) ? { ...n, color: { background: 'red', border: 'darkred' } } : n);
    const data = {
      nodes: new vis.DataSet(nodesMod),
      edges: new vis.DataSet(edges)
    };
    const options = {
      nodes: {
        font: { size: 18, color: '#222', face: 'arial' },
        borderWidth: 2
      },
      edges: {
        font: { size: 14, color: '#333', face: 'arial' },
        arrows: 'to',
        smooth: true
      },
      physics: {
        enabled: true,
        barnesHut: { gravitationalConstant: -30000, springLength: 200 }
      }
    };
    new vis.Network(container, data, options);
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  await inicializarGrafo();
  await poblarSelectsRuta();
  await poblarSelectsZonasAisladas();
  visualizarGrafo();
});

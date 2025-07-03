// CONTINÚA: public/app.js

async function inicializarGrafo() {
  await axios.post('/api/initialize');
  alert('Grafo inicializado');
}

// Llenar selects de centros y zonas automáticamente
async function poblarSelectsRuta() {
  try {
    const response = await axios.get('/api/graph');
    const { nodes } = response.data;
    const centros = nodes.filter(n => n.title.includes('CentroDistribucion'));
    const zonas = nodes.filter(n => n.title.includes('Zona'));
    const inicioSel = document.getElementById('inicio');
    const finSel = document.getElementById('fin');
    inicioSel.innerHTML = centros.map(c => `<option value="${c.label}">${c.label}</option>`).join('');
    finSel.innerHTML = zonas.map(z => `<option value="${z.label}">${z.label}</option>`).join('');
  } catch (e) {
    console.error('Error al poblar selects:', e);
  }
}

async function rutaMasRapida() {
  const inicio = document.getElementById('inicio').value;
  const fin = document.getElementById('fin').value;
  const bloqueadas = document.getElementById('bloqueadas').value.split(',').map(x => x.trim()).filter(Boolean);
  const { data } = await axios.post('/api/shortest-path', { inicio, fin, zonasBloqueadas: bloqueadas });
  document.getElementById('resultadoRuta').textContent = JSON.stringify(data, null, 2);
}

async function zonasAccesibles() {
  const centro = document.getElementById('centroAcceso').value;
  const tiempoMax = document.getElementById('maxMin').value;

  const { data } = await axios.get(`/api/direct-access?centro=${centro}&tiempoMax=${tiempoMax}`);
  document.getElementById('resultadoAcceso').textContent = JSON.stringify(data, null, 2);
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
        font: { size: 18, color: '#222', face: 'arial', bold: true },
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

window.addEventListener('DOMContentLoaded', async () => {
  await inicializarGrafo();
  await poblarSelectsRuta();
  visualizarGrafo();
});

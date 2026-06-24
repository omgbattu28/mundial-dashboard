const express = require('express');
const cors = require('cors');
const http = require('http'); // ARREGLADO: Le quitamos las dos barras '//' del principio
const { Server } = require('socket.io'); // NUEVO: Módulo de WebSockets

const app = express();
const server = http.createServer(app); // NUEVO: Envolvemos nuestra app de express
const io = new Server(server, { cors: { origin: "*" } }); // NUEVO: Inicializamos la tubería

const PORT = process.env.PORT || 3000;

app.use(cors());

// ============================================================================
// 1. NUESTRA BASE DE DATOS LOCAL DE "ESTRELLAS" (Con fotos simuladas)
// ============================================================================
const estrellasDB = {
    "Argentina": [
        { name: "L. Messi", img: "https://i.pravatar.cc/150?u=messi10" }, 
        { name: "E. Fernández", img: "https://i.pravatar.cc/150?u=enzo" } 
    ],
    "Austria": [
        { name: "D. Alaba", img: "https://i.pravatar.cc/150?u=alaba" }, 
        { name: "M. Sabitzer", img: "https://i.pravatar.cc/150?u=sabi" } 
    ]
};

// ============================================================================
// 2. SIMULACIÓN DE LA API EXTERNA Y ESTADÍSTICAS
// ============================================================================
async function obtenerPartidoEnVivoExternaAPI() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        homeTeam: "Argentina", 
        homeScore: Math.floor(Math.random() * 4), 
        awayTeam: "Austria", 
        awayScore: Math.floor(Math.random() * 4), 
        status: "LIVE"
    };
}

// EL HISTORIAL DE ENFRENTAMIENTOS (H2H)
async function obtenerHistorialH2H() {
    return {
        official: [
            { year: "2018", tournament: "Mundial - Grupos", result: "Argentina 2 - 0 Austria" }
        ],
        friendlies: [
            { year: "2022", result: "Argentina 1 - 1 Austria" },
            { year: "2014", result: "Austria 2 - 3 Argentina" }
        ]
    };
}

async function obtenerClasificacionExternaAPI() {
    return [
        { team: "Argentina", played: 3, points: 7 },
        { team: "Polonia", played: 3, points: 4 },
        { team: "Austria", played: 3, points: 4 },
        { team: "Arabia Saudita", played: 3, points: 1 }
    ];
}

async function obtenerProximosPartidos() {
    return [
        { homeTeam: "Polonia", awayTeam: "Arabia Saudita", time: "14:00" },
        { homeTeam: "Francia", awayTeam: "Dinamarca", time: "17:00" },
        { homeTeam: "España", awayTeam: "Alemania", time: "20:00" },
        { homeTeam: "Brasil", awayTeam: "Suiza", time: "Mañana" }
    ];
}

// NUEVO: Función para simular las alineaciones con Posiciones y Rendimiento
async function obtenerAlineaciones() {
    return {
        "Argentina": { 
            formation: "4-3-3", 
            status: "Confirmada",
            players: [
                { num: 23, name: "D. Martínez", pos: "POR", desc: "Portero", rating: "8.2" },
                { num: 26, name: "N. Molina", pos: "LD", desc: "Lateral Derecho", rating: "7.1" },
                { num: 13, name: "C. Romero", pos: "DFC", desc: "Defensa Central", rating: "8.5" },
                { num: 19, name: "N. Otamendi", pos: "DFC", desc: "Defensa Central", rating: "7.8" },
                { num: 3, name: "N. Tagliafico", pos: "LI", desc: "Lateral Izquierdo", rating: "7.0" },
                { num: 7, name: "R. De Paul", pos: "MC", desc: "Medio Centro", rating: "7.5" },
                { num: 24, name: "E. Fernández", pos: "MCD", desc: "Medio Defensivo", rating: "8.1" },
                { num: 20, name: "A. Mac Allister", pos: "MCO", desc: "Medio Ofensivo", rating: "8.0" },
                { num: 10, name: "L. Messi", pos: "ED", desc: "Extremo Derecho", rating: "9.5" },
                { num: 9, name: "J. Álvarez", pos: "DC", desc: "Delantero Centro", rating: "8.4" },
                { num: 11, name: "A. Di María", pos: "EI", desc: "Extremo Izquierdo", rating: "8.2" }
            ] 
        },
        "Austria": { 
            formation: "4-2-3-1", 
            status: "Confirmada",
            players: [
                { num: 13, name: "P. Pentz", pos: "POR", desc: "Portero", rating: "7.0" },
                { num: 5, name: "S. Posch", pos: "LD", desc: "Lateral Derecho", rating: "6.8" },
                { num: 4, name: "K. Danso", pos: "DFC", desc: "Defensa Central", rating: "7.2" },
                { num: 8, name: "D. Alaba", pos: "DFC", desc: "Defensa Central", rating: "8.1" },
                { num: 16, name: "P. Mwene", pos: "LI", desc: "Lateral Izquierdo", rating: "6.5" },
                { num: 6, name: "N. Seiwald", pos: "MCD", desc: "Medio Defensivo", rating: "7.0" },
                { num: 24, name: "X. Schlager", pos: "MC", desc: "Medio Centro", rating: "7.4" },
                { num: 20, name: "K. Laimer", pos: "MD", desc: "Medio Derecho", rating: "7.7" },
                { num: 9, name: "M. Sabitzer", pos: "MCO", desc: "Medio Ofensivo", rating: "8.3" },
                { num: 19, name: "C. Baumgartner", pos: "MI", desc: "Medio Izquierdo", rating: "7.5" },
                { num: 7, name: "M. Arnautović", pos: "DC", desc: "Delantero Centro", rating: "7.2" }
            ] 
        }
    };
}

// ============================================================================
// 3. NUESTRO ENDPOINT PRINCIPAL
// ============================================================================
app.get('/api/mundial/live', async (req, res) => {
    try {
        const partidoDatos = await obtenerPartidoEnVivoExternaAPI();
        const grupoDatos = await obtenerClasificacionExternaAPI();
        const proximosDatos = await obtenerProximosPartidos();
        const historialDatos = await obtenerHistorialH2H();
        
        const alineacionesDatos = await obtenerAlineaciones(); // NUEVO: Llamamos a la función

        const estrellasLocal = estrellasDB[partidoDatos.homeTeam] || [];
        const estrellasVisitante = estrellasDB[partidoDatos.awayTeam] || [];

        const respuestaFrontend = {
            match: {
                team1: partidoDatos.homeTeam,
                score1: partidoDatos.homeScore,
                team2: partidoDatos.awayTeam,
                score2: partidoDatos.awayScore,
                stars1: estrellasLocal,
                stars2: estrellasVisitante,
                h2h: historialDatos
            },
            lineups: alineacionesDatos, // NUEVO: Enviamos las alineaciones
            group: grupoDatos,
            upcoming: proximosDatos 
        };

        res.json(respuestaFrontend);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno" });
    }
});

//// ============================================================================
// NUEVO: MAGIA DE WEBSOCKETS (Tiempo Real)
// ============================================================================
let golesLocalRealTime = 0;
let golesVisitanteRealTime = 0;

io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado a la transmisión en vivo 📺');
    
    // Simular que de repente alguien mete gol (Revisa cada 10 segundos)
    setInterval(() => {
        const hayGol = Math.random() > 0.7; // 30% de probabilidad de gol
        if (hayGol) {
            const anotaLocal = Math.random() > 0.5;
            if (anotaLocal) golesLocalRealTime++;
            else golesVisitanteRealTime++;

            console.log(`¡GOL! Argentina ${golesLocalRealTime} - ${golesVisitanteRealTime} Austria`);
            
            // "Empujamos" la notificación a todos los navegadores conectados
            io.emit('actualizacion_partido', {
                homeScore: golesLocalRealTime,
                awayScore: golesVisitanteRealTime,
                mensaje: anotaLocal ? "¡GOL DE ARGENTINA! 🇦🇷" : "¡GOL DE AUSTRIA! 🇦🇹"
            });
        }
    }, 10000); // Cada 10,000 milisegundos (10 segundos)
});

//// ============================================================================
// 4. ARRANCAR EL SERVIDOR (Cambiamos app.listen por server.listen)
// ============================================================================
server.listen(PORT, () => {
    console.log(`🏆 Servidor del Mundial (con WebSockets) corriendo en: http://localhost:${PORT}`);
});
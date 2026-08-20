// ======================================================
// THERMOLINK
// Monitoramento de fornos - dados reais via Supabase
// ======================================================


// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL =
    "https://zawnluboujbovpgrgdcx.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_gJiVQXVjiuSPY3vHt2f8OA_CiES-4Ak";

const { createClient } = window.supabase;

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ======================================================
// ESTADO DO APP
// ======================================================

const state = {
    ovens: [],
    readings: new Map(),
    selectedModule: null,
    chart: null,
    miniCharts: [],
    aplicativoIniciado: false
};


// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

const $ = id => document.getElementById(id);

function numberValue(value) {
    return Number.isFinite(Number(value)) ? Number(value) : null;
}

function temperature(value) {
    const number = numberValue(value);
    if (number === null) return "-- °C";
    return `${number.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} °C`;
}

function time(value) {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}


// ======================================================
// FORNO ONLINE (sem leitura há mais de 3 minutos = offline)
// ======================================================

function isOnline(reading) {
    if (!reading || !reading.created_at) return false;
    const date = new Date(reading.created_at);
    if (Number.isNaN(date.getTime())) return false;
    return (Date.now() - date.getTime()) <= 3 * 60 * 1000;
}


// ======================================================
// PERSONALIZAÇÃO LOCAL (nome / meta por forno)
// ======================================================

function loadOvenSettings() {
    try {
        return JSON.parse(localStorage.getItem("thermolink_oven_settings")) || {};
    } catch (error) {
        return {};
    }
}

function saveOvenSettings(settings) {
    localStorage.setItem("thermolink_oven_settings", JSON.stringify(settings));
}

function ovenSetting(module) {
    const settings = loadOvenSettings();
    return settings[module] || {};
}

function ovenName(module) {
    const custom = ovenSetting(module).nome;
    if (custom) return custom;

    const oven = state.ovens.find(item => Number(item.numero) === Number(module));
    if (oven && oven.nome) return oven.nome;

    return `Forno ${String(module).padStart(2, "0")}`;
}

function ovenTarget(module) {
    const meta = ovenSetting(module).meta;
    return meta ? Number(meta) : null;
}


// ======================================================
// CARREGAR FORNOS
// ======================================================

async function loadOvens() {
    const { data, error } = await sb
        .from("fornos")
        .select("id, dispositivo_id, numero, nome, ativo")
        .eq("ativo", true)
        .order("numero", { ascending: true });

    if (error || !data || !data.length) {
        console.warn("[ThermoLink] Não foi possível carregar a tabela fornos.");

        // Fallback: módulos 1 até 31 (temperaturas seguem vindo de "leituras")
        state.ovens = Array.from({ length: 31 }, (_, index) => ({
            id: index + 1,
            numero: index + 1,
            nome: `Forno ${String(index + 1).padStart(2, "0")}`,
            ativo: true
        }));

        return;
    }

    state.ovens = data;
}


// ======================================================
// ÚLTIMA LEITURA DE CADA FORNO
// ======================================================

async function loadLatest() {
    const { data, error } = await sb
        .from("leituras")
        .select("id, dispositivo_id, forno_id, modulo_alutal, canal_1, canal_2, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

    if (error) {
        console.error("[ThermoLink] Erro ao carregar leituras:", error);
        return;
    }

    const latest = new Map();

    for (const reading of data || []) {
        const module = Number(reading.modulo_alutal);
        if (Number.isFinite(module) && !latest.has(module)) {
            latest.set(module, reading);
        }
    }

    state.readings = latest;

    if ($("screenFornos").classList.contains("active")) {
        renderHome();
    }

    if (state.selectedModule !== null) {
        updateDetailLive(state.selectedModule);
    }
}


// ======================================================
// HISTÓRICO DE UM FORNO
// ======================================================

async function getHistory(module, limit = 120) {
    const { data, error } = await sb
        .from("leituras")
        .select("canal_1, canal_2, modulo_alutal, created_at")
        .eq("modulo_alutal", module)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[ThermoLink] Erro no histórico:", error);
        return [];
    }

    return (data || []).reverse();
}


// ======================================================
// TELA INICIAL — somente fornos online
// ======================================================

function renderHome() {
    state.miniCharts.forEach(chart => chart.destroy());
    state.miniCharts = [];

    const onlineOvens = state.ovens.filter(oven =>
        isOnline(state.readings.get(Number(oven.numero)))
    );

    $("onlineCount").textContent = `${onlineOvens.length} online`;

    const grid = $("ovenGrid");

    if (!onlineOvens.length) {
        grid.innerHTML = `
            <div class="empty">
                Nenhum forno online no momento.
            </div>
        `;
        return;
    }

    grid.innerHTML = onlineOvens.map(oven => {
        const module = Number(oven.numero);
        const reading = state.readings.get(module);
        const meta = ovenTarget(module);
        const seconds = reading
            ? Math.max(0, Math.round((Date.now() - new Date(reading.created_at).getTime()) / 1000))
            : null;

        return `
            <article class="oven-card" data-module="${module}">

                <div class="oven-card-top">
                    <div class="oven-name">${ovenName(module)}</div>
                    <div class="oven-status">
                        <span class="status-dot online"></span>
                        Online
                    </div>
                </div>

                <div class="oven-main">
                    <div>
                        <div class="oven-temperature">
                            ${temperature(reading?.canal_1).replace(" °C", "")}
                            <small>°C</small>
                        </div>
                        <div class="oven-label">Canal 1 · atual</div>
                    </div>
                    <div class="mini-chart">
                        <canvas id="mini-${module}"></canvas>
                    </div>
                </div>

                <div class="oven-meta">
                    <span>${meta ? `Meta: ${meta}°C` : "Canal 2: " + temperature(reading?.canal_2)}</span>
                    <span>Atualizado há ${seconds ?? "--"}s</span>
                </div>

            </article>
        `;
    }).join("");

    grid.querySelectorAll(".oven-card").forEach(card => {
        card.addEventListener("click", () => openDetail(Number(card.dataset.module)));
    });

    onlineOvens.forEach(oven => drawMiniChart(Number(oven.numero)));
}


// ======================================================
// MINI GRÁFICO DOS CARDS
// ======================================================

async function drawMiniChart(module) {
    const canvas = $(`mini-${module}`);
    if (!canvas) return;

    const rows = await getHistory(module, 30);
    const values = rows.map(row => numberValue(row.canal_1)).filter(v => v !== null);

    if (!values.length) return;

    const chart = new Chart(canvas, {
        type: "line",
        data: {
            labels: values.map(() => ""),
            datasets: [{
                data: values,
                borderColor: "#f47b20",
                backgroundColor: "rgba(244,123,32,.12)",
                borderWidth: 2,
                tension: .35,
                pointRadius: 0,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });

    state.miniCharts.push(chart);
}


// ======================================================
// NAVEGAÇÃO ENTRE TELAS
// ======================================================

function showScreen(name) {
    document.querySelectorAll("main.screen").forEach(screen => screen.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));

    if (name === "fornos") {
        $("screenFornos").classList.add("active");
        $("navFornos").classList.add("active");
        setHeader("Fornos", "", false, false);
        renderHome();
    }

    if (name === "alertas") {
        $("screenAlertas").classList.add("active");
        $("navAlertas").classList.add("active");
        setHeader("Alertas", "", false, false);
    }

    if (name === "config") {
        $("screenConfig").classList.add("active");
        $("navConfig").classList.add("active");
        setHeader("Configurações", "", false, false);
    }
}

function setHeader(title, subtitle, showBack, showPill) {
    $("pageTitle").textContent = title;
    $("pageSubtitle").textContent = subtitle || "";
    $("backButton").style.display = showBack ? "flex" : "none";
    $("headerOnlinePill").style.display = showPill ? "flex" : "none";
    $("headerAction").style.display = "none";
}


// ======================================================
// ABRIR FORNO
// ======================================================

async function openDetail(module) {
    state.selectedModule = module;

    document.querySelectorAll("main.screen").forEach(screen => screen.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    $("screenForno").classList.add("active");

    setHeader(ovenName(module), `Módulo ${module}`, true, false);

    window.scrollTo({ top: 0, behavior: "smooth" });

    switchTab("tempo");
    renderDetailNow(module);
    await loadDetailHistory(module);
}

function closeDetail() {
    state.selectedModule = null;

    if (state.chart) {
        state.chart.destroy();
        state.chart = null;
    }

    showScreen("fornos");
}


// ======================================================
// ABAS DO FORNO
// ======================================================

function switchTab(tab) {
    document.querySelectorAll(".tab").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));

    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add("active");
    $(`tab${tab.charAt(0).toUpperCase()}${tab.slice(1)}`).classList.add("active");
}


// ======================================================
// DADOS "AO VIVO" (última leitura)
// ======================================================

function renderDetailNow(module) {
    const reading = state.readings.get(module);
    const meta = ovenTarget(module);

    $("detailTemperature").innerHTML = `${temperature(reading?.canal_1).replace(" °C", "")} <span>°C</span>`;
    $("detailMeta").textContent = meta ? `${meta}°C` : "--";
    $("gaugeTemperature").textContent = temperature(reading?.canal_1);

    $("pCanal1").textContent = temperature(reading?.canal_1);
    $("pCanal2").textContent = temperature(reading?.canal_2);

    const online = isOnline(reading);
    $("detailStatus").textContent = online ? "Online" : "Offline";
    $("detailStatus").style.color = online ? "var(--green)" : "var(--red)";
    $("detailStatusDot").className = `status-dot ${online ? "online" : "offline"}`;
    $("gaugeCircle").style.borderTopColor = online ? "var(--orange)" : "#3a4b57";
    $("gaugeCircle").style.borderRightColor = online ? "var(--orange)" : "#3a4b57";

    if (reading && reading.created_at) {
        const seconds = Math.max(0, Math.round((Date.now() - new Date(reading.created_at).getTime()) / 1000));
        $("secondsAgo").textContent = seconds;
    } else {
        $("secondsAgo").textContent = "--";
    }
}

function updateDetailLive(module) {
    const reading = state.readings.get(module);

    if (!isOnline(reading)) {
        renderDetailNow(module);
        return;
    }

    renderDetailNow(module);
}


// ======================================================
// GRÁFICO E HISTÓRICO
// ======================================================

async function loadDetailHistory(module) {
    const limit = Number($("periodSelect").value) || 120;
    const rows = await getHistory(module, limit);

    $("readingCount").textContent = `${rows.length} registros`;

    // ---- Lista de últimas leituras ----
    if (!rows.length) {
        $("historyList").innerHTML = `<div class="empty">Nenhuma leitura histórica.</div>`;
    } else {
        $("historyList").innerHTML = rows.slice(-30).reverse().map(row => `
            <div class="history-card">
                <div class="history-date">
                    <strong>${time(row.created_at)}</strong>
                </div>
                <div class="history-values">
                    <div>
                        <small class="history-value-label">CANAL 1</small>
                        <span class="history-value">${temperature(row.canal_1)}</span>
                    </div>
                    <div>
                        <small class="history-value-label">CANAL 2</small>
                        <span class="history-value secondary">${temperature(row.canal_2)}</span>
                    </div>
                </div>
            </div>
        `).join("");
    }

    // ---- Estatísticas ----
    const values = rows.map(row => numberValue(row.canal_1)).filter(v => v !== null);

    if (values.length) {
        const max = Math.max(...values);
        const min = Math.min(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        $("maxTemp").textContent = `${max.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}°C`;
        $("minTemp").textContent = `${min.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}°C`;
        $("avgTemp").textContent = `${avg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}°C`;
    } else {
        $("maxTemp").textContent = "--";
        $("minTemp").textContent = "--";
        $("avgTemp").textContent = "--";
    }

    $("totalReadings").textContent = rows.length;

    // ---- Tempo de queima (início -> última leitura, se houver dados) ----
    if (rows.length) {
        const start = new Date(rows[0].created_at);
        const end = new Date(rows[rows.length - 1].created_at);
        const diffMs = end.getTime() - start.getTime();

        if (diffMs > 0) {
            const totalMinutes = Math.floor(diffMs / 60000);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            $("detailBurn").textContent = `${String(hours).padStart(2, "0")}h${String(minutes).padStart(2, "0")}`;
        } else {
            $("detailBurn").textContent = "--";
        }
    } else {
        $("detailBurn").textContent = "--";
    }

    // ---- Gráfico principal ----
    if (state.chart) {
        state.chart.destroy();
        state.chart = null;
    }

    if (!rows.length) return;

    state.chart = new Chart($("detailChart"), {
        type: "line",
        data: {
            labels: rows.map(row =>
                new Date(row.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            ),
            datasets: [
                {
                    label: "Canal 1",
                    data: rows.map(row => numberValue(row.canal_1)),
                    borderColor: "#f47b20",
                    backgroundColor: "rgba(244,123,32,.08)",
                    borderWidth: 2,
                    tension: .3,
                    pointRadius: 0,
                    fill: true
                },
                {
                    label: "Canal 2",
                    data: rows.map(row => numberValue(row.canal_2)),
                    borderColor: "#3b82b6",
                    backgroundColor: "rgba(59,130,182,.08)",
                    borderWidth: 2,
                    tension: .3,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: {
                    display: true,
                    labels: { color: "#a9bdc9", boxWidth: 10, font: { size: 10 } }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxTicksLimit: 6, color: "#a9bdc9", font: { size: 8 } }
                },
                y: {
                    grid: { color: "rgba(255,255,255,.06)" },
                    ticks: { color: "#a9bdc9", font: { size: 8 } }
                }
            }
        }
    });
}


// ======================================================
// MODAL DE CONFIGURAÇÃO DO FORNO
// ======================================================

function openOvenModal() {
    const select = $("ovenSelect");

    select.innerHTML = state.ovens.map(oven =>
        `<option value="${oven.numero}">${ovenName(Number(oven.numero))}</option>`
    ).join("");

    if (state.selectedModule) {
        select.value = state.selectedModule;
    }

    fillOvenForm();

    select.onchange = fillOvenForm;

    $("ovenModal").classList.add("active");
}

function fillOvenForm() {
    const module = Number($("ovenSelect").value);
    const settings = ovenSetting(module);

    $("ovenNameInput").value = settings.nome || ovenName(module);
    $("ovenTargetInput").value = settings.meta || "";
}

function closeOvenModal() {
    $("ovenModal").classList.remove("active");
}

function saveOvenModal() {
    const module = Number($("ovenSelect").value);
    const nome = $("ovenNameInput").value.trim();
    const meta = Number($("ovenTargetInput").value);

    const settings = loadOvenSettings();
    settings[module] = {
        nome: nome || undefined,
        meta: meta > 0 ? meta : undefined
    };

    saveOvenSettings(settings);
    closeOvenModal();

    if ($("screenFornos").classList.contains("active")) {
        renderHome();
    }

    if (state.selectedModule === module) {
        setHeader(ovenName(module), `Módulo ${module}`, true, false);
        renderDetailNow(module);
    }
}


// ======================================================
// EVENTOS
// ======================================================

$("enterButton").onclick = () => {
    const splash = $("splashScreen");
    splash.style.opacity = "0";
    splash.style.transition = "opacity .3s ease";

    setTimeout(() => {
        splash.style.display = "none";
        state.aplicativoIniciado = true;
    }, 300);
};

$("backButton").onclick = closeDetail;

document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
        if (state.chart) {
            state.chart.destroy();
            state.chart = null;
        }
        state.selectedModule = null;
        showScreen(btn.dataset.screen);
    });
});

document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
        switchTab(btn.dataset.tab);
        if (btn.dataset.tab === "grafico" || btn.dataset.tab === "historico") {
            loadDetailHistory(state.selectedModule);
        }
    });
});

$("periodSelect").onchange = () => {
    if (state.selectedModule !== null) {
        loadDetailHistory(state.selectedModule);
    }
};

$("openOvenConfigModal").onclick = openOvenModal;
$("saveOvenBtn").onclick = saveOvenModal;

$("ovenModal").addEventListener("click", event => {
    if (event.target.id === "ovenModal") closeOvenModal();
});


// ======================================================
// ATUALIZAÇÃO AUTOMÁTICA (a cada 12 segundos)
// ======================================================

setInterval(() => {
    if (state.aplicativoIniciado) loadLatest();
}, 12000);

setInterval(() => {
    if (state.selectedModule !== null) {
        const reading = state.readings.get(state.selectedModule);
        if (reading && reading.created_at) {
            const seconds = Math.max(0, Math.round((Date.now() - new Date(reading.created_at).getTime()) / 1000));
            const el = $("secondsAgo");
            if (el) el.textContent = seconds;
        }
    }
}, 1000);


// ======================================================
// INICIAR
// ======================================================

async function init() {
    try {
        await loadOvens();
        await loadLatest();
        console.log("[ThermoLink] Interface carregada.");
    } catch (error) {
        console.error("[ThermoLink] Erro:", error);
        $("ovenGrid").innerHTML = `<div class="empty">Não foi possível carregar os fornos.</div>`;
    }
}

init();

/* 全国お城イベント一覧（StellaCreate）
   WordPress側には <div id="castle-ev"></div> と、このファイルを読み込む短いコードだけを置く。
   CSS・画面の部品・処理はすべてこのファイルとcastle.cssで管理する。 */
(function () {
var BASE = "https://nekosenmu.github.io/stellacreate-data/castle/";
function addCss(href) {
  if (document.querySelector('link[href="' + href + '"]')) return;
  var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l);
}
addCss("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap");
addCss(BASE + "castle.css?v=2");
var TEMPLATE = "<p class=\"ce-updated\">今日：<span id=\"ce-today\"></span>　データ更新日：<span id=\"ce-updated\">―</span></p>\n  <p class=\"notice\" role=\"note\"><strong>試作ページです。</strong>掲載しているイベントはすべて画面確認用の架空データで、実際の開催情報ではありません。</p>\n  <div class=\"ce-main\">\n    <p class=\"ce-status\" id=\"ce-status\" role=\"status\">イベント情報を読み込んでいます…</p>\n    <!-- ダッシュボード -->\n    <div class=\"view\" id=\"v-dash\" hidden>\n      <section aria-labelledby=\"kpi-h\">\n        <h2 id=\"kpi-h\" class=\"sr\">概要（カードを押すと一覧へ移動します）</h2>\n        <div class=\"kpis\">\n          <a class=\"kpi\" href=\"#list-all\"><span class=\"kpi-label\">掲載イベント</span><span class=\"kpi-value\" id=\"k-all\"></span><span class=\"kpi-go\">すべて見る</span></a>\n          <a class=\"kpi live\" href=\"#list-live\"><span class=\"kpi-label\">開催中</span><span class=\"kpi-value\" id=\"k-live\"></span><span class=\"kpi-go\">開催中の一覧へ</span></a>\n          <a class=\"kpi\" href=\"#list-weekend\"><span class=\"kpi-label\" id=\"k-weekend-label\">今週末</span><span class=\"kpi-value\" id=\"k-weekend\"></span><span class=\"kpi-go\">今週末の一覧へ</span></a>\n          <a class=\"kpi free\" href=\"#list-free\"><span class=\"kpi-label\">参加無料</span><span class=\"kpi-value\" id=\"k-free\"></span><span class=\"kpi-go\">無料イベントの一覧へ</span></a>\n        </div>\n      </section>\n      <div class=\"charts\">\n        <section class=\"panel\" aria-labelledby=\"c1\">\n          <div class=\"panel-head\"><h2 id=\"c1\">地方別の件数</h2></div>\n          <div class=\"bars\" id=\"by-region\"></div>\n          <p class=\"chart-note\">地方名を押すと、その地方の一覧へ移動します。</p>\n        </section>\n        <section class=\"panel\" aria-labelledby=\"c2\">\n          <div class=\"panel-head\"><h2 id=\"c2\">月別の件数</h2></div>\n          <div class=\"bars\" id=\"by-month\"></div>\n          <p class=\"chart-note\">月をまたぐイベントは、それぞれの月に数えています。</p>\n        </section>\n      </div>\n      <section class=\"panel\" aria-labelledby=\"up-h\">\n        <div class=\"panel-head\"><h2 id=\"up-h\">これから始まるイベント</h2><a class=\"more\" href=\"#list-all\">すべてのイベントを見る</a></div>\n        <ul class=\"upcoming\" id=\"upcoming\"></ul>\n      </section>\n    </div>\n    <!-- 一覧ページ -->\n    <div class=\"view\" id=\"v-list\" hidden>\n      <section>\n        <nav class=\"crumbs\" aria-label=\"現在地\"><a href=\"#castle-ev\">ダッシュボード</a><span aria-hidden=\"true\">›</span><span id=\"crumb-now\"></span></nav>\n        <h2 class=\"list-title\" id=\"list-title\" tabindex=\"-1\"></h2>\n        <p class=\"list-lead\" id=\"list-lead\"></p>\n        <nav class=\"views\" aria-label=\"一覧の切り替え\" id=\"views\"></nav>\n      </section>\n      <section class=\"panel\" aria-labelledby=\"filter-h\">\n        <div class=\"panel-head\"><h2 id=\"filter-h\">さらに絞り込む</h2></div>\n        <div class=\"filters\">\n          <div class=\"field\"><label for=\"q\">キーワード</label><input type=\"search\" id=\"q\" placeholder=\"城の名前、イベント名など\"></div>\n          <div class=\"field\"><label for=\"region\">地方</label><select id=\"region\"><option value=\"\">すべての地方</option></select></div>\n          <div class=\"field\"><label for=\"month\">開催月</label><select id=\"month\"><option value=\"\">すべての月</option></select></div>\n          <fieldset class=\"field\" style=\"grid-column: 1 / -1;\"><legend>イベントの種類</legend><div class=\"chips\" id=\"types\"></div></fieldset>\n        </div>\n        <div class=\"filter-foot\">\n          <div class=\"result-count\" aria-live=\"polite\"><strong id=\"count\">0</strong> 件</div>\n          <button type=\"button\" class=\"btn-text\" id=\"reset\">絞り込みをクリア</button>\n        </div>\n      </section>\n      <ul class=\"events\" id=\"events\"></ul>\n    </div>\n  </div>";
function init() {
  var root = document.getElementById("castle-ev");
  if (!root || root.dataset.ready) return;
  root.dataset.ready = "1";
  root.innerHTML = TEMPLATE;

// データの置き場所（GitHub Pages）。ここを書き換えれば別のデータを読み込めます
const DATA_URL = BASE + "events.json";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const WD = ["日", "月", "火", "水", "木", "金", "土"];

// ── 日付（日本時間の「今日」と「今週末」を自動で計算） ──
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
function addDays(s, n) { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); }
function dow(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d).getDay(); }
// 土曜なら土日、日曜ならその日だけ、平日なら次の土日
const WEEKEND = dow(TODAY) === 0 ? [TODAY] : dow(TODAY) === 6 ? [TODAY, addDays(TODAY, 1)] : [addDays(TODAY, 6 - dow(TODAY)), addDays(TODAY, 7 - dow(TODAY))];
function fmt(d) { const [, m, day] = d.split("-").map(Number); return `${m}/${day}（${WD[dow(d)]}）`; }
const md = (d) => { const [, m, day] = d.split("-").map(Number); return `${m}/${day}`; };
const jpDate = (d) => { const [y, m, day] = d.split("-").map(Number); return `${y}年${m}月${day}日（${WD[dow(d)]}）`; };
const weekendText = WEEKEND.length === 1 ? md(WEEKEND[0]) : `${md(WEEKEND[0])}〜${Number(WEEKEND[1].slice(8))}`;

const REGIONS = [
  { key: "tohoku", name: "北海道・東北" }, { key: "kanto", name: "関東" }, { key: "chubu", name: "中部" },
  { key: "kinki", name: "近畿" }, { key: "chugoku-shikoku", name: "中国・四国" }, { key: "kyushu", name: "九州・沖縄" }
];
const TYPES = ["祭り・パレード", "ライトアップ", "体験", "展示", "グルメ・物産"];

const regionName = (k) => (REGIONS.find((r) => r.key === k) || {}).name || k;
function status(e) { if (e.end < TODAY) return "ended"; if (e.start <= TODAY) return "live"; return "soon"; }
const STATUS_LABEL = { live: "開催中", soon: "これから", ended: "終了" };
const isWeekend = (e) => WEEKEND.some((d) => e.start <= d && d <= e.end);
function monthsOf(e) {
  const out = []; let [y, m] = e.start.split("-").map(Number); const [ey, em] = e.end.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) { out.push(`${y}-${String(m).padStart(2, "0")}`); m++; if (m > 12) { m = 1; y++; } }
  return out;
}
const monthLabel = (k) => { const [y, m] = k.split("-"); return `${y}年${Number(m)}月`; };
const shortMonth = (k) => { const [y, m] = k.split("-"); return (y === TODAY.slice(0, 4) ? "" : `${y.slice(2)}年`) + `${Number(m)}月`; };

// データ読み込み後に入る
let ACTIVE = [], ALL_MONTHS = [], loaded = false;
const order = { live: 0, soon: 1 };
const sorted = (list) => list.slice().sort((a, b) => order[status(a)] - order[status(b)] || a.start.localeCompare(b.start));

// 一覧の切り口（URLの #list-◯◯ に対応）
const BASE_VIEWS = {
  all:     { title: "すべてのイベント",   lead: "掲載中のイベントをすべて表示しています。", test: () => true },
  live:    { title: "開催中のイベント",   lead: `今日（${md(TODAY)}）開催しているイベントです。`, test: (e) => status(e) === "live" },
  weekend: { title: "今週末のイベント",   lead: `${WEEKEND.map(fmt).join("・")}に行けるイベントです。`, test: isWeekend },
  free:    { title: "参加無料のイベント", lead: "参加費がかからないイベントです。入城料や駐車料金は別にかかる場合があります。", test: (e) => e.free }
};
function resolveView(slug) {
  if (BASE_VIEWS[slug]) return { key: slug, ...BASE_VIEWS[slug] };
  const r = REGIONS.find((x) => "region-" + x.key === slug);
  if (r) return { key: slug, title: `${r.name}のイベント`, lead: `${r.name}地方のお城で開かれるイベントです。`, test: (e) => e.region === r.key, region: r.key };
  const mk = ALL_MONTHS.find((k) => "month-" + k === slug);
  if (mk) return { key: slug, title: `${monthLabel(mk)}のイベント`, lead: `${monthLabel(mk)}中に開催日があるイベントです。`, test: (e) => monthsOf(e).includes(mk), month: mk };
  return null;
}

const countHTML = (n) => `${n}<small>件</small>`;

// ── ダッシュボード ──
function renderDash() {
  $("k-weekend-label").textContent = `今週末（${weekendText}）`;
  $("k-all").innerHTML = countHTML(ACTIVE.length);
  $("k-live").innerHTML = countHTML(ACTIVE.filter((e) => status(e) === "live").length);
  $("k-weekend").innerHTML = countHTML(ACTIVE.filter(isWeekend).length);
  $("k-free").innerHTML = countHTML(ACTIVE.filter((e) => e.free).length);

  const bars = (el, rows) => {
    const max = Math.max(1, ...rows.map((r) => r.n));
    el.innerHTML = rows.map((r) => `<a class="bar-row" href="#list-${r.slug}" aria-label="${esc(r.label)} ${r.n}件の一覧へ">
      <span class="bar-label">${esc(r.label)}</span>
      <span class="bar-track" aria-hidden="true"><span class="bar-fill" style="display:block;width:${(r.n / max) * 100}%"></span></span>
      <span class="bar-num">${r.n}</span></a>`).join("");
  };
  bars($("by-region"), REGIONS.map((r) => ({ slug: "region-" + r.key, label: r.name, n: ACTIVE.filter((e) => e.region === r.key).length })));
  bars($("by-month"), ALL_MONTHS.map((k) => ({ slug: "month-" + k, label: shortMonth(k), n: ACTIVE.filter((e) => monthsOf(e).includes(k)).length })));

  const next = ACTIVE.filter((e) => status(e) === "soon").sort((a, b) => a.start.localeCompare(b.start)).slice(0, 5);
  $("upcoming").innerHTML = next.length ? next.map((e) => `<li>
    <span class="up-date">${fmt(e.start)}〜</span>
    <span><span class="up-name">${esc(e.name)}</span><br><span class="up-castle">${esc(e.castle)}（${esc(e.pref)}）</span></span>
    <span class="tags"><span class="tag type">${esc(e.type)}</span>${e.free ? '<span class="tag free">参加無料</span>' : ""}</span>
  </li>`).join("") : "<li>これから始まるイベントは、いまのところありません。</li>";
}

// ── 一覧ページ ──
let currentView = null;
TYPES.forEach((t, i) => $("types").insertAdjacentHTML("beforeend", `<label class="chip"><input type="checkbox" id="type-${i}" value="${esc(t)}"><span>${esc(t)}</span></label>`));

function eventHTML(e) {
  const s = status(e); const same = e.start === e.end;
  const link = e.url
    ? `<a class="btn" href="${esc(e.url)}" target="_blank" rel="noopener">公式サイトを見る</a>`
    : `<button type="button" class="btn" data-nolink>公式サイトを見る</button>`;
  return `<li class="event ${s}">
    <div class="ev-date"><div class="d1">${fmt(e.start)}${same ? "" : "〜"}</div>${same ? '<div class="d2">1日のみ</div>' : `<div class="d2">${fmt(e.end)}まで</div>`}</div>
    <div class="ev-body">
      <div class="ev-name">${esc(e.name)}</div>
      <div class="ev-castle"><b>${esc(e.castle)}</b>　${esc(e.pref)}・${esc(regionName(e.region))}</div>
      <p class="ev-desc">${esc(e.desc)}</p>
      <div class="tags"><span class="tag ${s}">${STATUS_LABEL[s]}</span><span class="tag type">${esc(e.type)}</span>${e.free ? '<span class="tag free">参加無料</span>' : ""}${e.resv ? '<span class="tag resv">要予約</span>' : ""}</div>
    </div>
    <div class="ev-link">${link}<span class="src">情報源：${esc(e.source)}</span><span class="src-msg" hidden>リンク先は準備中です</span></div>
  </li>`;
}

function renderList() {
  const v = currentView;
  const q = $("q").value.trim(), region = $("region").value, month = $("month").value;
  const types = [...document.querySelectorAll("#castle-ev #types input:checked")].map((x) => x.value);
  const list = sorted(ACTIVE.filter((e) => v.test(e) &&
    (!q || (e.name + e.castle + e.pref + e.desc).includes(q)) &&
    (!region || e.region === region) && (!month || monthsOf(e).includes(month)) &&
    (!types.length || types.includes(e.type))));
  $("count").textContent = list.length;
  $("events").innerHTML = list.length ? list.map(eventHTML).join("")
    : `<li class="empty">条件に合うイベントがありません。「絞り込みをクリア」を押すか、上の切り替えから別の一覧を選んでください。</li>`;
}

function showList(v) {
  currentView = v;
  $("crumb-now").textContent = v.title;
  $("list-title").textContent = v.title;
  $("list-lead").textContent = v.lead;
  $("views").innerHTML = Object.entries(BASE_VIEWS).map(([k, b]) =>
    `<a href="#list-${k}"${v.key === k ? ' aria-current="page"' : ""}>${b.title.replace("のイベント", "")}</a>`).join("");
  $("q").value = ""; $("month").value = v.month || ""; $("region").value = v.region || "";
  $("region").disabled = !!v.region; $("month").disabled = !!v.month;
  document.querySelectorAll("#castle-ev #types input").forEach((x) => (x.checked = false));
  renderList();
}

function route() {
  if (!loaded) return;
  const h = location.hash.replace(/^#/, "");
  const v = h.startsWith("list-") ? resolveView(h.slice(5)) : null;
  $("v-dash").hidden = !!v; $("v-list").hidden = !v;
  if (v) { showList(v); $("list-title").focus({ preventScroll: true }); }
  if (location.hash) $("castle-ev").scrollIntoView({ block: "start" });
}

["q", "region", "month"].forEach((id) => $(id).addEventListener("input", renderList));
$("types").addEventListener("change", renderList);
$("reset").addEventListener("click", () => {
  $("q").value = ""; if (!currentView.region) $("region").value = ""; if (!currentView.month) $("month").value = "";
  document.querySelectorAll("#castle-ev #types input").forEach((x) => (x.checked = false)); renderList();
});
$("events").addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-nolink]"); if (!b) return;
  b.parentElement.querySelector(".src-msg").hidden = false;
});
window.addEventListener("hashchange", route);

// ── データ読み込み ──
$("ce-today").textContent = jpDate(TODAY);
fetch(DATA_URL, { cache: "no-cache" })
  .then((res) => { if (!res.ok) throw new Error(res.status); return res.json(); })
  .then((data) => {
    const events = (data.events || []).filter((e) => e && e.name && /^\d{4}-\d{2}-\d{2}$/.test(e.start) && /^\d{4}-\d{2}-\d{2}$/.test(e.end));
    ACTIVE = events.filter((e) => status(e) !== "ended"); // 終了したイベントは掲載しない
    ALL_MONTHS = [...new Set(ACTIVE.flatMap(monthsOf))].sort();
    if (data.updated) $("ce-updated").textContent = jpDate(data.updated);
    REGIONS.forEach((r) => $("region").insertAdjacentHTML("beforeend", `<option value="${r.key}">${esc(r.name)}</option>`));
    ALL_MONTHS.forEach((k) => $("month").insertAdjacentHTML("beforeend", `<option value="${k}">${monthLabel(k)}</option>`));
    loaded = true;
    $("ce-status").hidden = true;
    renderDash();
    route();
  })
  .catch(() => {
    $("ce-status").classList.add("err");
    $("ce-status").textContent = "イベント情報を読み込めませんでした。時間をおいて、ページを再読み込みしてください。";
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

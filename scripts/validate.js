// castle/events.json の形式チェック。問題があれば終了コード1で止まる（壊れたデータを公開しないため）
// 使い方: node scripts/validate.js
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "castle", "events.json");
const REGIONS = ["tohoku", "kanto", "chubu", "kinki", "chugoku-shikoku", "kyushu"];
const TYPES = ["祭り・パレード", "ライトアップ", "体験", "展示", "グルメ・物産"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const errors = [];

let data;
try { data = JSON.parse(fs.readFileSync(file, "utf8")); }
catch (e) { console.error("JSONとして読めません: " + e.message); process.exit(1); }

if (!DATE.test(data.updated || "")) errors.push("updated が YYYY-MM-DD ではありません");
if (!Array.isArray(data.events)) errors.push("events が配列ではありません");

const seen = new Set();
(data.events || []).forEach((e, i) => {
  const at = `events[${i}]「${e && e.name}」`;
  for (const k of ["name", "castle", "pref", "region", "type", "start", "end", "desc", "source", "url"]) {
    if (typeof e[k] !== "string") errors.push(`${at}: ${k} が文字列ではありません`);
  }
  for (const k of ["free", "resv"]) if (typeof e[k] !== "boolean") errors.push(`${at}: ${k} が true/false ではありません`);
  if (!DATE.test(e.start) || isNaN(Date.parse(e.start))) errors.push(`${at}: start の日付が不正です`);
  if (!DATE.test(e.end) || isNaN(Date.parse(e.end))) errors.push(`${at}: end の日付が不正です`);
  if (e.start > e.end) errors.push(`${at}: start が end より後です`);
  if (!REGIONS.includes(e.region)) errors.push(`${at}: region「${e.region}」は使えません`);
  if (!TYPES.includes(e.type)) errors.push(`${at}: type「${e.type}」は使えません`);
  if (!data.dummy && !/^https:\/\//.test(e.url || "")) errors.push(`${at}: url（https:// の公式ページ）がありません`);
  if ((e.desc || "").length > 80) errors.push(`${at}: desc が長すぎます（80文字以内）`);
  const key = `${e.castle}|${e.name}|${e.start}`;
  if (seen.has(key)) errors.push(`${at}: 同じイベントが重複しています`);
  seen.add(key);
});

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`OK: ${data.events.length}件`);

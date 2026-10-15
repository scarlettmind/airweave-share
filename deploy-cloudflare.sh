#!/bin/bash
# 一键部署到 Cloudflare Workers（含 D1 统计数据库与后台访问码）
set -euo pipefail
cd "$(dirname "$0")"

NAME="airweave-share"
DB="airweave-share-db"
CONFIG="dist/server/wrangler.json"
WR="npx --no-install wrangler"

echo "▶ 1/6 安装依赖"
[ -d node_modules ] || npm ci --no-audit --no-fund

echo "▶ 2/6 构建网站"
npm run build

echo "▶ 3/6 登录 Cloudflare（浏览器会打开，请点 Allow）"
$WR whoami >/dev/null 2>&1 || $WR login

echo "▶ 4/6 准备统计数据库"
db_id() { $WR d1 list --json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=JSON.parse(s).find(d=>d.name===process.argv[1]);process.stdout.write(m?m.uuid:"")})' "$DB"; }
ID="$(db_id)"
if [ -z "$ID" ]; then $WR d1 create "$DB" >/dev/null; ID="$(db_id)"; fi
[ -n "$ID" ] || { echo "✗ 无法取得数据库 ID"; exit 1; }
node -e 'const f=process.argv[1],c=JSON.parse(require("fs").readFileSync(f));c.name=process.argv[2];c.d1_databases=[{binding:"DB",database_name:process.argv[3],database_id:process.argv[4]}];require("fs").writeFileSync(f,JSON.stringify(c))' "$CONFIG" "$NAME" "$DB" "$ID"
if ! $WR d1 execute "$DB" --remote --config "$CONFIG" --json --command "SELECT name FROM sqlite_master WHERE name='share_events'" 2>/dev/null | grep -q share_events; then
  $WR d1 execute "$DB" --remote --config "$CONFIG" --yes --file drizzle/0000_mysterious_whiplash.sql
fi

echo "▶ 5/6 上传网站"
$WR deploy --config "$CONFIG"

echo "▶ 6/6 设置后台访问码"
KEY="$(grep '^ADMIN_KEY=' .env | cut -d= -f2-)"
printf '%s' "$KEY" | $WR secret put ADMIN_KEY --config "$CONFIG" >/dev/null
echo
echo "✓ 完成！网址见上方 'https://airweave-share.<你的子域名>.workers.dev'，后台在网址后加 /admin"

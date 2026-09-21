// 个人主页的问答接口：把前端请求转发到模型服务。
//
// 密钥只存在于 Worker 的环境变量里（wrangler secret put NVIDIA_API_KEY），
// 不进代码、不进前端、不进仓库。
//
// 部署：
//   wrangler secret put NVIDIA_API_KEY     # 粘贴新密钥
//   wrangler deploy

const ALLOWED_ORIGINS = [
  'https://uniquedevjing.github.io',
  'http://114.215.186.113',
  'https://jing-chat-proxy.remarkable-balaur.workers.dev',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

const UPSTREAM = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_MODEL = 'meta/llama-3.1-8b-instruct';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(allow) });
    }
    if (request.method !== 'POST' || url.pathname !== '/chat') {
      return new Response('Not Found', { status: 404 });
    }
    if (!env.NVIDIA_API_KEY) {
      return json({ error: '服务端未配置密钥，请联系站主' }, 500, allow);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return json({ error: '请求体不是合法 JSON' }, 400, allow);
    }
    if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
      return json({ error: '缺少 messages' }, 400, allow);
    }
    // 模型与上限由服务端定，前端不参与
    payload.model = DEFAULT_MODEL;
    payload.messages = payload.messages.slice(-8);
    payload.max_tokens = Math.min(Number(payload.max_tokens) || 500, 800);

    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(allow) },
    });
  },
};

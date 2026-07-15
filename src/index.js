const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
	"Access-Control-Expose-Headers": "*",
};

export default {
	async fetch(request, env, ctx) {

		// 处理预检请求
		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: corsHeaders,
			});
		}

		if (request.method === "POST") {

			const url = new URL(request.url);

			if (url.pathname === "/chat") {
				return chat(request, env);
			}

			return new Response("Not Found", {
				status: 404,
				headers: corsHeaders
			});

		}

		return new Response("Not Found", {
			status: 404,
			headers: corsHeaders,
		});

	},
};

async function chat(request, env) {

	console.log('API KEY:', env.GEMINI_API_KEY)

	try {
		const body = await request.json();

		const contents = body.messages.map(msg => ({
			role: msg.role === "assistant" ? "model" : "user",
			parts: [
				{
					text: msg.content,
				},
			],
		}));

		const response = await fetch(
			"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent?alt=sse",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-goog-api-key": env.GEMINI_API_KEY,
				},
				body: JSON.stringify({
					contents
				}),
			}
		);

		if (!response.ok) {
			return new Response(await response.text(), {
				status: response.status,
				headers: corsHeaders,
			});
		}

		return new Response(response.body, {
			status: response.status,
			headers: {
				...corsHeaders,
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				"Connection": "keep-alive",
			},
		});
	} catch (e) {
		return new Response(e.message, {
			status: 500,
			headers: corsHeaders,
		});
	}
}
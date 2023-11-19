import SteamAPI from 'steamapi-cloudflare-workers';

const cache: Map<string, string> = new Map();

let steamClient: SteamAPI | null;
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

		steamClient ??= new SteamAPI(env.STEAM_API_KEY, { 
			baseURL: 'https://api.steampowered.com',
			baseStoreURL: 'https://store.steampowered.com/api',
			headers: {}
		});

		let id: string = new URL(request.url).pathname.substring(1);
		if(id.length == 0) {
			return new Response('No ID provided', { status: 400 });
		}

		try {
			var idNum = BigInt(id);
			if(idNum < 0x0110000100000000n || idNum > 0x01100001FFFFFFFFn)
				throw new Error('Invalid ID');
		} catch(_) {
			return new Response('Invalid ID provided', { status: 400 });
		}

		if(cache.has(id)) {
			return new Response((await fetch(cache.get(id)!, request)).body);
		}

		let summary: SteamAPI.PlayerSummary;
		try {
			summary = await steamClient.getUserSummary(id.toString());
		} catch(_) {
			return new Response('Invalid ID provided', { status: 400 });
		}

		let response: Response = await fetch(summary.avatar.large, request);

		cache.set(id, summary.avatar.large);

		return new Response(response.body);

	}
};
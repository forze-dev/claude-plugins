import { spawn, spawnSync } from 'node:child_process';
import { request } from 'node:http';
import { createServer } from 'node:net';

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import { SITE } from './src/site.config.js';
import { writeFormLimits } from './tools/limits.mjs';

/** A free port for local PHP — a fixed one might be taken. */
const freePort = () =>
	new Promise((resolve, reject) => {
		const probe = createServer();
		probe.once('error', reject);
		probe.listen(0, '127.0.0.1', () => {
			const { port } = probe.address();
			probe.close(() => resolve(port));
		});
	});

/** Waits until `php -S` starts accepting connections. */
const waitForPort = async (port, attempts = 50) => {
	for (let i = 0; i < attempts; i++) {
		const ok = await new Promise((resolve) => {
			const req = request({ host: '127.0.0.1', port, path: '/', method: 'HEAD' }, (res) => {
				res.resume();
				resolve(true);
			});
			req.on('error', () => resolve(false));
			req.end();
		});
		if (ok) return;
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	throw new Error('PHP built-in server did not start');
};

/**
 * Serves server/form.php during `astro dev`.
 *
 * The form back end is PHP, which Astro's dev server knows nothing about. On
 * the first request to `SITE.formEndpoint` this plugin starts PHP's built-in
 * server (`php -S`) on the server/ folder and proxies the request there as is
 * — so locally you test the same file that ships to the hosting, with the same
 * limits (form.limits.json is written next to form.php from SITE.form).
 *
 * If PHP isn't installed, the form answers 503 in dev with an explanation and
 * the rest of the site works as usual. The plugin does nothing during a build.
 */
function devPhpForm() {
	let php = null;
	let starting = null;

	const start = async () => {
		// No shell: php.exe is found through PATH anyway, and with a shell kill()
		// on Windows would only stop cmd.exe, leaving PHP running after dev exits.
		const check = spawnSync('php', ['-v']);
		if (check.status !== 0) return null;

		writeFormLimits('server');
		const port = await freePort();
		php = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', 'server'], {
			stdio: 'ignore',
		});
		await waitForPort(port);
		return port;
	};

	return {
		name: 'dev-php-form',
		apply: 'serve',
		configureServer(server) {
			server.httpServer?.once('close', () => php?.kill());

			// All methods, not just POST: a GET must get a 405 from form.php itself,
			// as on the hosting, not an Astro page with status 200.
			server.middlewares.use(SITE.formEndpoint, async (req, res) => {
				starting ??= start();
				const port = await starting.catch(() => null);

				if (!port) {
					res.statusCode = 503;
					res.setHeader('Content-Type', 'text/plain; charset=utf-8');
					res.end('PHP is not installed, so the form cannot run locally. Install PHP 8.1+ and restart `npm run dev` — the rest of the site works without it.');
					return;
				}

				const upstream = request(
					{ host: '127.0.0.1', port, path: '/form.php', method: req.method, headers: req.headers },
					(response) => {
						res.writeHead(response.statusCode ?? 502, response.headers);
						response.pipe(res);
					}
				);
				upstream.on('error', (error) => {
					res.statusCode = 502;
					res.end(`PHP form handler failed: ${error.message}`);
				});
				req.pipe(upstream);
			});
		},
	};
}

export default defineConfig({
	site: SITE.url,

	/**
	 * Output privacy-policy.html, not privacy-policy/index.html. Apache serves
	 * the clean address /privacy-policy through .htaccess.
	 */
	build: { format: 'file' },
	trailingSlash: 'never',

	integrations: [
		sitemap({
			// The thank-you page must not be found in search.
			filter: (page) => !page.includes('/thank-you'),
		}),
	],

	vite: {
		plugins: [devPhpForm()],

		build: {
			rollupOptions: {
				output: {
					/**
					 * The shared style bundle is otherwise named after the first page
					 * that touched it. A Vite naming artifact, not a bug, but it is
					 * confusing when debugging.
					 */
					assetFileNames: (asset) =>
						asset.names?.[0]?.endsWith('.css') || asset.name?.endsWith('.css')
							? '_astro/styles.[hash][extname]'
							: '_astro/[name].[hash][extname]',
				},
			},
		},
	},
});

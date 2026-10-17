import { spawn, spawnSync } from 'node:child_process';
import { request } from 'node:http';
import { createServer } from 'node:net';

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import { SITE } from './src/site.config.js';
import { writeFormLimits } from './tools/limits.mjs';

/** Вільний порт для локального PHP — фіксований міг би бути зайнятий. */
const freePort = () =>
	new Promise((resolve, reject) => {
		const probe = createServer();
		probe.once('error', reject);
		probe.listen(0, '127.0.0.1', () => {
			const { port } = probe.address();
			probe.close(() => resolve(port));
		});
	});

/** Чекає, доки `php -S` почне приймати зʼєднання. */
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
 * Віддає server/form.php під час `astro dev`.
 *
 * Бекенд форми — PHP, про який дев-сервер Astro нічого не знає. Плагін при
 * першому запиті до `SITE.formEndpoint` піднімає вбудований сервер PHP
 * (`php -S`) на теці server/ і проксує туди запит як є — тож локально
 * перевіряється той самий файл, що поїде на хостинг, з тими самими лімітами
 * (form.limits.json пишеться поруч із form.php з SITE.form).
 *
 * Якщо PHP не встановлено, форма в dev відповідає 503 з поясненням, а решта
 * сайту працює як завжди. Під час збірки плагін не робить нічого.
 */
function devPhpForm() {
	let php = null;
	let starting = null;

	const start = async () => {
		// Без shell: php.exe знаходиться через PATH і так, а з shell kill() на Windows
		// зупинив би лише cmd.exe, лишивши PHP висіти після dev-сервера.
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

			// Усі методи, не лише POST: GET має отримати 405 від самого form.php,
			// як на хостингу, а не сторінку Astro з кодом 200.
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
	 * Віддавати privacy-policy.html, а не privacy-policy/index.html. Apache
	 * обслуговує чисту адресу /privacy-policy через .htaccess.
	 */
	build: { format: 'file' },
	trailingSlash: 'never',

	integrations: [
		sitemap({
			// Сторінка подяки не повинна знаходитись у пошуку.
			filter: (page) => !page.includes('/thank-you'),
		}),
	],

	vite: {
		plugins: [devPhpForm()],

		build: {
			rollupOptions: {
				output: {
					/**
					 * Спільний бандл стилів інакше називається за першою сторінкою,
					 * яка його зачепила. Артефакт іменування Vite, не баг, але під
					 * час діагностики збиває з пантелику.
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

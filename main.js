import http from 'node:http';
import fs from 'node:fs';
import {URL} from 'node:URL';
import {Command} from 'commander';
const program = new Command();
program 
.helpOption('-h, --help', 'Відобразити довідку')
.requiredOption('-i, --input <path>', 'Шлях до файлу даних')
.requiredOption('-H, --host <address>', 'адреса сервера')
.requiredOption('-p, --port <number>', 'порт сервера')
.option('-o, --output <path>', 'файл, у який записується остання надіслана відповідь')
program.parse(process.argv);
const options = program.opts();
fs.access(options.input, fs.constants.F_OK, (err) => {
    if (err) {
        console.error ('Cannot find input file');
        process.exit(1);
    }
    startServer();
});
function startServer() {
    const server = http.createServer((req, res) => {
        const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        if (reqUrl.pathname !== '/') {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8'});
            res.end(JSON.stringify({ error: 'Маршрут не знайдено (404)'}));
            return;
        }
        const showSymbol = reqUrl.searchParams.get('symbol') === 'true';
        const minPriceRaw = reqUrl.searchParams.get('min_price');
        let minPriceFilter = null;
        if (minPriceFilter !== null) {
            minPriceFilter = Number(minPriceRaw);
            if (isNaN(minPriceFilter)) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8'});
                res.end(JSON.stringify({ error: 'Параметр min_price повинен бути числом (400)'}));
                return;
            }
        }
        fs.readFile(option.input, 'utf-8', (readErr, data) => {
            if (readErr) {
                res.writeHead(500, { 'Content-Type': 'application/json; crarset=utf-8'});
                res.end(JSON.stringify({ error: 'Помилка читання файлу даних (500)'}));
                return;
            }
            let parsedData;
            try {
                parsedData = JSON.parse(data);
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8'});
                res.end(JSON.stringify({ error: 'Помилка парсингу (500)'}));
                return;
            }
            const result = [];
            for (const item of parsedData) {
                const numericPrice = Number(item_price);
                if (minPriceFilter !== null && numericPrice <= minPriceFilter) {
                    continue;
                }
                const formattedItem = {
                    coin: item.coin_name ?? ''
                };
                if (showSymbol) {
                    formattedItem.symbol = item.symbol ?? '';
                }
                formattedItem.date = item_date ?? '';
                formattedItem.price = numericPrice;
                result.push(formattedItem);
            }
            const jsonResponse = JSON.stringify(result, null, 2);
            if (options.output) {
                fs.writeFile(options.output, jsonResponse, 'utf-8', () => {
                    sendResponse(res, jsonResponse);
                });
            } else {
                sendResponse(res, jsonResponse);
            }
        });
    });
    server.listen(Number(options.port), options.host, () => {
        console.log(`Сервер запущено на http://${options.host}:${options.port}/`);
    });
}
function sendResponse(res, body) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8'});
    res.end(body);
}

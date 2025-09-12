// const express = require('express');
// const path = require('path');
// const fs = require('fs').promises;
//
// const app = express();
// const PORT = process.env.PORT || 8080;
//
// // Middleware
// app.use(express.json());
// app.use('/frontend', express.static('frontend')); // Путь к сбилженному компоненту
//
// // --- Утилиты для работы с датами (оставлены, так как используются для генерации данных) ---
// class DateUtils {
//     static parseDateString(dateString) {
//         const [day, month, year] = dateString.split('.').map(Number);
//         return new Date(Date.UTC(year, month - 1, day));
//     }
//
//     static formatDate(date) {
//         return date.toLocaleDateString('ru-RU', {
//             day: '2-digit',
//             month: '2-digit',
//             year: 'numeric'
//         });
//     }
//
//     static addDays(dateString, days) {
//         const date = this.parseDateString(dateString);
//         date.setUTCDate(date.getUTCDate() + days);
//         return this.formatDate(date);
//     }
// }
//
// // --- Имитация репозитория данных (упрощенная версия) ---
// class MockDataRepository {
//     constructor() {
//         this.data = new Map();
//         this.isLoaded = false;
//         this.headers = []; // Храним заголовки здесь для логики
//     }
//
//     async loadData() {
//         if (this.isLoaded) return;
//
//         try {
//             const jsonData = await fs.readFile('./data/database.json', 'utf8');
//             const parsedData = JSON.parse(jsonData);
//
//             // Пример простой адаптации для database.json, если у вас сложная структура
//             // В данном примере, database.json ожидается в формате { "DD.MM.YYYY": { "station1": "П", ... } }
//             Object.entries(parsedData).forEach(([date, rowData]) => {
//                 const entity = { date, ...rowData };
//                 this.data.set(date, entity);
//             });
//
//             this.isLoaded = true;
//             console.log(`[Repository] Загружено ${this.data.size} сущностей из JSON базы`);
//         } catch (error) {
//             console.warn('[Repository] Ошибка загрузки JSON базы или файл не найден. Генерируем тестовые данные:', error.message);
//             this.createMockData();
//         }
//     }
//
//     createMockData() {
//         console.log('[Repository] Создание тестовых данных...');
//         const today = new Date();
//         const statuses = ['М', 'О', 'П', 'ПР', 'Р'];
//
//         // Предполагаем, что заголовки уже загружены, чтобы генерировать данные для листовых узлов
//         const leafNodeIds = this.headers
//             .filter(header => !this.headers.some(child => child.parentId === header.id))
//             .map(node => node.id);
//
//         for (let i = -30; i <= 30; i++) {
//             const date = new Date(today);
//             date.setDate(today.getDate() + i);
//             const dateString = DateUtils.formatDate(date);
//
//             const rowData = { date: dateString };
//             leafNodeIds.forEach(nodeId => {
//                 rowData[nodeId] = statuses[Math.floor(Math.random() * statuses.length)];
//             });
//             this.data.set(dateString, rowData);
//         }
//
//         this.isLoaded = true;
//         console.log(`[Repository] Создано ${this.data.size} тестовых записей`);
//     }
//
//     findByDateRange(startDate, days, leafNodes) {
//         const result = [];
//         const start = DateUtils.parseDateString(startDate);
//         const endDate = DateUtils.addDays(startDate, days - 1);
//         const end = DateUtils.parseDateString(endDate);
//
//         console.log(`[Repository] Поиск данных: ${startDate} - ${endDate}, для ${leafNodes.length} узлов`);
//
//         for (let i = 0; i < days; i++) {
//             const currentDate = DateUtils.addDays(startDate, i);
//             const entityDate = DateUtils.parseDateString(currentDate);
//
//             if (entityDate >= start && entityDate <= end) {
//                 const existingData = this.data.get(currentDate);
//                 const rowData = { date: currentDate, timestamp: Date.now() };
//
//                 // Адаптируем существующие данные под запрошенные leafNodes
//                 leafNodes.forEach(node => {
//                     rowData[node.id] = existingData?.[node.id] ||
//                         (['М', 'О', 'П', 'ПР', 'Р'])[Math.floor(Math.random() * 5)]; // Заглушка, если нет данных
//                 });
//                 result.push(rowData);
//             }
//         }
//         return result;
//     }
//
//     // Добавляем метод для установки заголовков после их загрузки
//     setHeaders(headers) {
//         this.headers = headers;
//     }
// }
//
// // --- Имитация репозитория заголовков (упрощенная версия) ---
// class MockHeaderRepository {
//     constructor() {
//         this.headers = null;
//     }
//
//     async loadHeaders() {
//         if (this.headers) return; // Загружаем только один раз
//
//         // HeadersProvider из index.html
//         this.headers = {
//             headers: [
//                 { id: "factory1", parentId: null, name: "Завод №1 'Металлург'", metadata: { color: "#343434", workCount: 150 } },
//                 { id: "workshop1", parentId: "factory1", name: "Цех сборки №1", metadata: { color: "#4caf50", workCount: 45 } },
//                 { id: "line1", parentId: "workshop1", name: "Линия А", metadata: { color: "#ff9800", workCount: 15 } },
//                 { id: "station1", parentId: "line1", name: "Станция 1", metadata: { color: "#f44336", workCount: 3 } },
//                 { id: "station2", parentId: "line1", name: "Станция 2", metadata: { color: "#f44336", workCount: 4 } },
//                 { id: "station3", parentId: "line1", name: "Станция 3", metadata: { color: "#f44336", workCount: 5 } },
//                 { id: "line2", parentId: "workshop1", name: "Линия Б", metadata: { color: "#ff9800", workCount: 12 } },
//                 { id: "station4", parentId: "line2", name: "Станция 4", metadata: { color: "#f44336", workCount: 2 } },
//                 { id: "station5", parentId: "line2", name: "Станция 5", metadata: { color: "#f44336", workCount: 3 } },
//                 { id: "workshop2", parentId: "factory1", name: "Цех механообработки", metadata: { color: "#4caf50", workCount: 65 } },
//                 { id: "section1", parentId: "workshop2", name: "Участок токарных работ", metadata: { color: "#9c27b0", workCount: 25 } },
//                 { id: "machine1", parentId: "section1", name: "Станок ЧПУ-1", metadata: { color: "#795548", workCount: 1 } },
//                 { id: "machine2", parentId: "section1", name: "Станок ЧПУ-2", metadata: { color: "#795548", workCount: 1 } },
//                 { id: "factory2", parentId: null, name: "Завод №2 'Электрон'", metadata: { color: "#3f51b5", workCount: 120 } },
//                 { id: "workshop3", parentId: "factory2", name: "Цех печатных плат", metadata: { color: "#00bcd4", workCount: 35 } },
//                 { id: "pcb_line1", parentId: "workshop3", name: "Линия ПП-1", metadata: { color: "#e91e63", workCount: 8 } },
//                 { id: "pcb_line2", parentId: "workshop3", name: "Линия ПП-2", metadata: { color: "#e91e63", workCount: 6 } }
//             ]
//         };
//         console.log(`[Header Repository] Загружено ${this.headers.headers.length} узлов заголовков`);
//     }
//
//     getHeaders() {
//         return this.headers;
//     }
// }
//
// // --- Центральный класс для управления данными и заголовками ---
// class AppService {
//     constructor() {
//         this.dataRepository = new MockDataRepository();
//         this.headerRepository = new MockHeaderRepository();
//     }
//
//     async initialize() {
//         await this.headerRepository.loadHeaders();
//         this.dataRepository.setHeaders(this.headerRepository.getHeaders().headers); // Передаем заголовки в репозиторий данных
//         await this.dataRepository.loadData();
//         console.log('[AppService] Все репозитории инициализированы');
//     }
//
//     // Имитация HeadersProvider
//     getHeadersProviderFunction() {
//         // Мы возвращаем функцию, которая при вызове отдаст статический объект
//         // Это имитирует `window.HeadersProvider = function() { return { headers: [...] }; }`
//         return `function() {
//             console.log('[Server-injected HeadersProvider] Вызов функции провайдера');
//             return ${JSON.stringify(this.headerRepository.getHeaders(), null, 2)};
//         }`;
//     }
//
//     // Имитация DataProvider
//     // Эта функция будет вызвана на клиенте и сделает AJAX-запрос
//     getDataProviderFunctionCode() {
//         return `async (startDate, days, leafNodes) => {
//             try {
//                 const response = await fetch('/api/data', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify({ startDate, days, leafNodes })
//                 });
//
//                 if (!response.ok) {
//                     throw new Error(\`Server data call failed: \${response.status}\`);
//                 }
//
//                 const result = await response.json();
//                 return { data: result.data };
//             } catch (error) {
//                 throw error;
//             }
//         }`;
//     }
//
//     // Имитация handleCellClick
//     // Эта функция будет вызвана на клиенте и сделает AJAX-запрос
//     getCellClickHandlerFunctionCode() {
//         return `function(cellData) {
//             console.log('🎯 [Server-injected Click Handler] Клик по ячейке:', cellData);
//
//             fetch('/api/click', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ cellData: cellData, timestamp: Date.now() })
//             })
//             .then(response => response.json())
//             .then(result => {
//                 console.log('✅ [Server-injected Click Handler] Ответ сервера:', result);
//                 // Можно добавить логику обновления UI или отображения всплывающего окна
//             })
//             .catch(error => {
//                 console.error('❌ [Server-injected Click Handler] Ошибка отправки на сервер:', error);
//             });
//         }`;
//     }
//
//     // Метод для получения данных из репозитория
//     fetchDataForClient(startDate, days, leafNodes) {
//         return this.dataRepository.findByDateRange(startDate, days, leafNodes);
//     }
// }
//
// const appService = new AppService();
//
//
// // API для получения данных из DataProvider
// app.post('/api/data', async (req, res) => {
//     try {
//         const { startDate, days, leafNodes } = req.body;
//         const data = await appService.fetchDataForClient(startDate, days, leafNodes);
//
//         console.log(`✅ [API/data] Возвращено ${data.length} записей`);
//         res.json({ data });
//     } catch (error) {
//         console.error('❌ [API/data] Ошибка:', error.message);
//         res.status(500).json({ error: error.message });
//     }
// });
//
// // API для обработки кликов по ячейкам
// app.post('/api/click', async (req, res) => {
//     try {
//         const { cellData, timestamp } = req.body;
//         console.log('🎯 [API/click] Обработка клика:');
//         console.log(`   Дата: ${cellData.date}`);
//         console.log(`   Узел: ${cellData.node?.name || cellData.nodeId}`);
//         console.log(`   Значение: ${cellData.value}`);
//         console.log(`   Время: ${new Date(timestamp).toLocaleString('ru-RU')}`);
//
//         // Здесь может быть ваша серверная логика обработки кликов
//         // Например, запись в базу данных, логирование, запуск бизнес-процессов
//         const serverProcessingResult = {
//             status: 'processed',
//             receivedAt: new Date().toISOString(),
//             originalCellData: cellData
//         };
//
//         res.json({ success: true, message: 'Клик успешно обработан на сервере', serverProcessingResult });
//     } catch (error) {
//         console.error('❌ [API/click] Ошибка обработки клика:', error.message);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });
//
//
// // Главный view endpoint, который возвращает HTML со вставленными функциями
// app.get('/', async (req, res) => {
//     try {
//         const headerProviderCode = appService.getHeadersProviderFunction();
//         const dataProviderCode = appService.getDataProviderFunctionCode();
//         const cellClickHandlerCode = appService.getCellClickHandlerFunctionCode();
//
//         res.send(`<!DOCTYPE html>
// <html lang="ru">
// <head>
//     <meta charset="utf-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1" />
//     <title>Virtualized Table - Server-Injected Providers</title>
//     <style>
//         body {
//             font-family: Arial, sans-serif;
//             margin: 20px;
//             background-color: #f5f5f5;
//             color: #333;
//         }
//         h1 {
//             color: #333;
//             margin-bottom: 20px;
//         }
//         virtualized-table {
//             background: white;
//             border-radius: 8px;
//             box-shadow: 0 4px 12px rgba(0,0,0,0.1);
//             padding: 10px;
//         }
//         .info-box {
//             background-color: #e0f7fa;
//             border-left: 5px solid #00bcd4;
//             padding: 15px;
//             margin-bottom: 20px;
//             border-radius: 4px;
//             font-family: monospace;
//             white-space: pre-wrap;
//         }
//         #click-log {
//             background-color: #fffde7;
//             border-left: 5px solid #ffeb3b;
//             padding: 15px;
//             margin-top: 20px;
//             border-radius: 4px;
//             max-height: 200px;
//             overflow-y: auto;
//             font-family: monospace;
//             font-size: 0.9em;
//         }
//         .click-entry {
//             border-bottom: 1px dashed #ffe0b2;
//             padding: 5px 0;
//         }
//         .click-entry:last-child {
//             border-bottom: none;
//         }
//     </style>
// </head>
// <body>
//     <h1>Виртуализированная таблица (Серверная инжекция)</h1>
//
//     <div class="info-box">
//         <p><strong>Статус:</strong> Провайдеры инжектированы сервером.</p>
//         <p><strong>HeadersProvider:</strong> Сгенерирован как функция на сервере.</p>
//         <p><strong>DataProvider:</strong> Сгенерирован как функция, которая делает POST-запрос на <code>/api/data</code>.</p>
//         <p><strong>CellClickHandler:</strong> Сгенерирован как функция, которая делает POST-запрос на <code>/api/click</code>.</p>
//     </div>
//
//     <div id="click-log" style="display: none;">
//         <strong>Лог кликов по ячейкам:</strong>
//         <div id="click-entries">Кликните по любой ячейке таблицы...</div>
//     </div>
//
//     <virtualized-table
//         header-provider-name="serverHeadersProvider"
//         data-provider-name="serverDataProvider"
//         on-cell-click-handler="serverCellClickHandler"
//         max-width="100%"
//         max-height="700px"
//         scroll-batch-size="7"
//         debug="true">
//     </virtualized-table>
//
//     <script>
//         // Инжектируем функции провайдеров, сгенерированные на сервере
//         window.serverHeadersProvider = ${headerProviderCode};
//         window.serverDataProvider = ${dataProviderCode};
//         window.serverCellClickHandler = ${cellClickHandlerCode};
//
//         // Расширяем серверный обработчик кликов для локального логирования
//         const originalCellClickHandler = window.serverCellClickHandler;
//         window.serverCellClickHandler = function(cellData) {
//             originalCellClickHandler(cellData); // Вызываем серверный обработчик
//
//             // Локальное логирование
//             const clickLogEl = document.getElementById('click-log');
//             const clickEntriesEl = document.getElementById('click-entries');
//
//             if (clickLogEl.style.display === 'none') {
//                 clickLogEl.style.display = 'block';
//             }
//
//             const entry = document.createElement('div');
//             entry.className = 'click-entry';
//             entry.innerHTML = \`\${new Date().toLocaleTimeString()} | <strong>Дата:</strong> \${cellData.date} | <strong>Узел:</strong> \${cellData.node?.name || cellData.nodeId} | <strong>Значение:</strong> \${cellData.value}\`;
//
//             if (clickEntriesEl.children.length === 0 || clickEntriesEl.children[0].textContent.includes('Кликните')) {
//                 clickEntriesEl.innerHTML = '';
//             }
//             clickEntriesEl.insertBefore(entry, clickEntriesEl.firstChild);
//             while (clickEntriesEl.children.length > 10) { // Ограничиваем количество записей
//                 clickEntriesEl.removeChild(clickEntriesEl.lastChild);
//             }
//         };
//
//         // Загрузка компонента virtualized-table
//         const script = document.createElement('script');
//         script.src = '/frontend/dist/virtualized-table.js'; // Убедитесь, что путь правильный
//
//         script.onload = function() {
//             // После загрузки компонента, он сам найдет провайдеры по именам в window
//             // через setTimeout, чтобы убедиться, что компонент зарегистрирован
//             setTimeout(() => {
//                 if (customElements.get('virtualized-table')) {
//                     // Можно сделать тестовый вызов DataProvider, чтобы убедиться
//                     const today = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
//                     const testHeaders = window.serverHeadersProvider().headers;
//                     const leafNodes = testHeaders.filter(h => !testHeaders.some(child => child.parentId === h.id));
//
//                     window.serverDataProvider(today, 3, leafNodes).then(result => {
//                         console.log('✅ [Client] Тест serverDataProvider успешен, получено:', result.data.length, 'записей');
//                     }).catch(err => {
//                         console.error('❌ [Client] Ошибка при тестировании serverDataProvider:', err);
//                     });
//
//                 } else {
//                     console.error('❌ [Client] Web Component "virtualized-table" НЕ зарегистрирован');
//                 }
//             }, 100);
//         };
//
//         script.onerror = function() {
//             console.error('❌ [Client] Ошибка загрузки компонента virtualized-table');
//         };
//
//         document.head.appendChild(script);
//     </script>
// </body>
// </html>`);
//     } catch (error) {
//         console.error('❌ [Server] Ошибка рендеринга главной страницы:', error);
//         res.status(500).send('Ошибка при загрузке страницы.');
//     }
// });
//
// // --- Запуск приложения ---
// async function startApplication() {
//     try {
//         console.log('🚀 [Server] Запуск приложения...');
//         await appService.initialize();
//
//         app.listen(PORT, () => {
//             console.log('✅ [Server] Приложение запущено!');
//             console.log(`🌐 [Server] URL: http://localhost:${PORT}`);
//             console.log(`📂 [Server] Статические файлы из: ${path.resolve(__dirname, 'frontend')}`);
//             console.log('---');
//         });
//     } catch (error) {
//         console.error('❌ [Server] Ошибка запуска приложения:', error);
//         process.exit(1);
//     }
// }
//
// startApplication();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use('/frontend', express.static('frontend'));

// Простые данные для заголовков
const HEADERS_DATA = {
    "headers": [
        {
            "id": "factory1",
            "parentId": null,
            "type": "node",
            "name": "Завод №1 'Металлург'",
            "metadata": {
                "color": "#343434",
                "tooltip": "Основной производственный комплекс",
                "workCount": 150
            }
        },
        {
            "id": "workshop1",
            "parentId": "factory1",
            "type": "assembly",
            "name": "Цех сборки №1",
            "metadata": {
                "color": "#4caf50",
                "tooltip": "Основной сборочный цех",
                "workCount": 45
            }
        },
        {
            "id": "line1",
            "parentId": "workshop1",
            "type": "component",
            "name": "Линия А",
            "metadata": {
                "color": "#ff9800",
                "tooltip": "Автоматизированная линия сборки",
                "workCount": 15
            }
        },
        {
            "id": "station1",
            "parentId": "line1",
            "type": "component",
            "name": "Станция 1",
            "metadata": {
                "color": "#f44336",
                "tooltip": "Начальная станция сборки",
                "workCount": 3
            }
        },
        {
            "id": "station2",
            "parentId": "line1",
            "type": "component",
            "name": "Станция 2",
            "metadata": {
                "color": "#f44336",
                "tooltip": "Промежуточная станция",
                "workCount": 4
            }
        },
        {
            "id": "station3",
            "parentId": "line1",
            "type": "component",
            "name": "Станция 3",
            "metadata": {
                "color": "#f44336",
                "tooltip": "Финальная станция",
                "workCount": 5
            }
        },
        {
            "id": "line2",
            "parentId": "workshop1",
            "type": "component",
            "name": "Линия Б",
            "metadata": {
                "color": "#ff9800",
                "tooltip": "Полуавтоматическая линия",
                "workCount": 12
            }
        },
        {
            "id": "station4",
            "parentId": "line2",
            "type": "component",
            "name": "Станция 4",
            "metadata": {
                "color": "#f44336",
                "tooltip": "Контрольная станция",
                "workCount": 2
            }
        },
        {
            "id": "station5",
            "parentId": "line2",
            "type": "component",
            "name": "Станция 5",
            "metadata": {
                "color": "#f44336",
                "tooltip": "Упаковочная станция",
                "workCount": 3
            }
        },
        {
            "id": "workshop2",
            "parentId": "factory1",
            "type": "assembly",
            "name": "Цех механообработки",
            "metadata": {
                "color": "#4caf50",
                "tooltip": "Цех механической обработки деталей",
                "workCount": 65
            }
        },
        {
            "id": "section1",
            "parentId": "workshop2",
            "type": "component",
            "name": "Участок токарных работ",
            "metadata": {
                "color": "#9c27b0",
                "tooltip": "Участок токарной обработки",
                "workCount": 25
            }
        },
        {
            "id": "machine1",
            "parentId": "section1",
            "type": "component",
            "name": "Станок ЧПУ-1",
            "metadata": {
                "color": "#795548",
                "tooltip": "Токарный станок с ЧПУ",
                "workCount": 1
            }
        },
        {
            "id": "machine2",
            "parentId": "section1",
            "type": "component",
            "name": "Станок ЧПУ-2",
            "metadata": {
                "color": "#795548",
                "tooltip": "Фрезерный станок с ЧПУ",
                "workCount": 1
            }
        },
        {
            "id": "factory2",
            "parentId": null,
            "type": "node",
            "name": "Завод №2 'Электрон'",
            "metadata": {
                "color": "#3f51b5",
                "tooltip": "Завод электронных компонентов",
                "workCount": 120
            }
        },
        {
            "id": "workshop3",
            "parentId": "factory2",
            "type": "assembly",
            "name": "Цех печатных плат",
            "metadata": {
                "color": "#00bcd4",
                "tooltip": "Производство печатных плат",
                "workCount": 35
            }
        },
        {
            "id": "pcb_line1",
            "parentId": "workshop3",
            "type": "component",
            "name": "Линия ПП-1",
            "metadata": {
                "color": "#e91e63",
                "tooltip": "Линия производства печатных плат",
                "workCount": 8
            }
        },
        {
            "id": "pcb_line2",
            "parentId": "workshop3",
            "type": "component",
            "name": "Линия ПП-2",
            "metadata": {
                "color": "#e91e63",
                "tooltip": "Линия производства сложных плат",
                "workCount": 6
            }
        }
    ]
};

// API для данных таблицы - все ячейки 'М' (зелёные)
app.post('/api/data', (req, res) => {
    const { startDate, days, leafNodes } = req.body;

    console.log(`[API] Запрос данных: startDate=${startDate}, days=${days}, leafNodes=${leafNodes.length}`);

    const data = [];
    const [day, month, year] = startDate.split('.').map(Number);
    const startDateObj = new Date(year, month - 1, day);

    for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDateObj);
        currentDate.setDate(startDateObj.getDate() + i);

        const dateStr = currentDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const dayData = { date: dateStr };

        // Все ячейки заполняем 'М' (зелёные)
        leafNodes.forEach(node => {
            dayData[node.id] = 'М';
        });

        data.push(dayData);
    }

    console.log(`[API] Возвращено ${data.length} записей`);
    res.json({ data });
});

// API для кликов по ячейкам - вывод в консоль
app.post('/api/click', (req, res) => {
    const { cellData } = req.body;

    // Выводим дату и ID столбца
    console.log(`[КЛИК] Дата: ${cellData.date}, ID столбца: ${cellData.nodeId || cellData.node?.id}`);

    res.json({ success: true });
});

// Главная страница с упрощённой HTML
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Простая виртуализированная таблица</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        virtualized-table {
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <h1>Простая виртуализированная таблица</h1>

    <virtualized-table
        max-width="100%"
        max-height="600px"
        scroll-batch-size="7"
        debug="true">
    </virtualized-table>

    <script>
        // 1. Провайдер заголовков (hp) - вызывается только при инициализации
        window.hp = function() {
            console.log('[HP] Загрузка заголовков');
            return ${JSON.stringify(HEADERS_DATA)};
        };

        // 2. Провайдер данных (dp) - все ячейки 'М'
        window.dp = async function(startDate, days, leafNodes) {
            console.log(\`[DP] Запрос: \${startDate}, дней: \${days}, узлов: \${leafNodes.length}\`);
            
            try {
                const response = await fetch('/api/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startDate, days, leafNodes })
                });
                
                const result = await response.json();
                return { data: result.data };
            } catch (error) {
                console.error('[DP] Ошибка:', error);
                return { data: [] };
            }
        };

        // 3. Обработчик кликов - вывод в консоль
        window.onTableCellClick = function(cellData) {
            console.log(\`[КЛИК] Дата: \${cellData.date}, ID: \${cellData.nodeId || cellData.node?.id}\`);
            
            // Отправляем на сервер для логирования
            fetch('/api/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cellData })
            }).catch(err => console.error('Ошибка отправки клика:', err));
        };

        // Загрузка компонента
        const script = document.createElement('script');
        script.src = '/frontend/dist/virtualized-table.js';
        
        script.onload = function() {
            setTimeout(() => {
                if (customElements.get('virtualized-table')) {
                    console.log('[HTML] ✅ Компонент загружен успешно');
                } else {
                    console.error('[HTML] ❌ Компонент не зарегистрирован');
                }
            }, 500);
        };
        
        script.onerror = function() {
            console.error('[HTML] ❌ Ошибка загрузки компонента');
        };
        
        document.head.appendChild(script);
    </script>
</body>
</html>`);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📂 Статические файлы: ${path.resolve(__dirname, 'frontend')}`);
});
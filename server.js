// const express = require('express');
// const path = require('path');
// const fs = require('fs').promises;
//
// const app = express();
// const PORT = process.env.PORT || 8080;
//
// // Middleware
// app.use(express.json());
// app.use('/frontend', express.static('frontend'));
//
// /**
//  * ПОЛНЫЙ VAADIN MVC PATTERN с поддержкой HeaderProvider и обработки кликов
//  * Серверный рендеринг + инжекция DataProvider + HeaderProvider + поиск по JSON базе + обработка кликов
//  */
//
// // Утилиты для работы с датами
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
// // Entity класс для данных таблицы
// class TableDataEntity {
//     constructor(date, agr1, agr2, agr3, stage1, stage2, stage3) {
//         this.date = date;
//         this.agr1 = agr1;
//         this.agr2 = agr2;
//         this.agr3 = agr3;
//         this.stage1 = stage1;
//         this.stage2 = stage2;
//         this.stage3 = stage3;
//     }
//
//     isValid() {
//         return this.date && this.stage1 && this.stage2 && this.stage3;
//     }
//
//     toJSON() {
//         const result = {
//             date: this.date,
//             agr1: this.agr1 || 0,
//             agr2: this.agr2 || 0,
//             stage1: this.stage1,
//             stage2: this.stage2,
//             stage3: this.stage3
//         };
//
//         if (this.agr3 !== undefined) {
//             result.agr3 = this.agr3;
//         }
//
//         return result;
//     }
// }
//
// // Repository слой с поиском по JSON базе
// class TableDataRepository {
//     constructor() {
//         this.data = new Map();
//         this.isLoaded = false;
//     }
//
//     async loadData() {
//         if (this.isLoaded) return;
//
//         try {
//             const jsonData = await fs.readFile('./data/database.json', 'utf8');
//             const parsedData = JSON.parse(jsonData);
//
//             Object.entries(parsedData).forEach(([date, rawData]) => {
//                 const entity = new TableDataEntity(
//                     rawData.date,
//                     rawData.agr1,
//                     rawData.agr2,
//                     rawData.agr3,
//                     rawData.stage1,
//                     rawData.stage2,
//                     rawData.stage3
//                 );
//                 this.data.set(date, entity);
//             });
//
//             this.isLoaded = true;
//             console.log(`[Repository] Загружено ${this.data.size} сущностей из JSON базы`);
//         } catch (error) {
//             console.error('[Repository] Ошибка загрузки JSON базы:', error.message);
//             // Создаем фиктивные данные если файл не найден
//             this.createMockData();
//         }
//     }
//
//     createMockData() {
//         console.log('[Repository] Создание тестовых данных...');
//         const today = new Date();
//
//         for (let i = -30; i <= 30; i++) {
//             const date = new Date(today);
//             date.setDate(today.getDate() + i);
//             const dateString = DateUtils.formatDate(date);
//
//             const entity = new TableDataEntity(
//                 dateString,
//                 Math.floor(Math.random() * 100),
//                 Math.floor(Math.random() * 100),
//                 Math.floor(Math.random() * 100),
//                 [{ 'station1': this.getRandomStatus() }],
//                 [{ 'station2': this.getRandomStatus() }],
//                 [{ 'station3': this.getRandomStatus() }]
//             );
//
//             this.data.set(dateString, entity);
//         }
//
//         this.isLoaded = true;
//         console.log(`[Repository] Создано ${this.data.size} тестовых записей`);
//     }
//
//     getRandomStatus() {
//         const statuses = ['М', 'О', 'П', 'ПР', 'Р'];
//         return statuses[Math.floor(Math.random() * statuses.length)];
//     }
//
//     findByDateRange(startDate, endDate) {
//         const result = [];
//         const start = DateUtils.parseDateString(startDate);
//         const end = DateUtils.parseDateString(endDate);
//
//         console.log(`[Repository] Поиск в JSON базе: ${startDate} - ${endDate}`);
//
//         for (const [dateKey, entity] of this.data.entries()) {
//             const entityDate = DateUtils.parseDateString(dateKey);
//             if (entityDate >= start && entityDate <= end) {
//                 result.push(entity);
//             }
//         }
//
//         console.log(`[Repository] Найдено ${result.length} записей в JSON базе`);
//
//         return result.sort((a, b) =>
//             DateUtils.parseDateString(a.date) - DateUtils.parseDateString(b.date)
//         );
//     }
//
//     findByDate(date) {
//         return this.data.get(date);
//     }
//
//     count() {
//         return this.data.size;
//     }
//
//     getAllDates() {
//         return Array.from(this.data.keys()).sort((a, b) =>
//             DateUtils.parseDateString(a) - DateUtils.parseDateString(b)
//         );
//     }
// }
//
// // Header Repository для управления заголовками
// class HeaderRepository {
//     constructor() {
//         this.headers = null;
//         this.isLoaded = false;
//     }
//
//     async loadHeaders() {
//         if (this.isLoaded) return;
//
//         try {
//             this.headers = {
//                 "headers": [
//                     {
//                         "id": "factory1",
//                         "parentId": null,
//                         "type": "node",
//                         "name": "Завод №1 'Металлург'",
//                         "metadata": {
//                             "color": "#343434",
//                             "tooltip": "Основной производственный комплекс",
//                             "workCount": 150
//                         }
//                     },
//                     {
//                         "id": "workshop1",
//                         "parentId": "factory1",
//                         "type": "assembly",
//                         "name": "Цех сборки №1",
//                         "metadata": {
//                             "color": "#4caf50",
//                             "tooltip": "Основной сборочный цех",
//                             "workCount": 45
//                         }
//                     },
//                     {
//                         "id": "line1",
//                         "parentId": "workshop1",
//                         "type": "component",
//                         "name": "Линия А",
//                         "metadata": {
//                             "color": "#ff9800",
//                             "tooltip": "Автоматизированная линия сборки",
//                             "workCount": 15
//                         }
//                     },
//                     {
//                         "id": "station1",
//                         "parentId": "line1",
//                         "type": "component",
//                         "name": "Станция 1",
//                         "metadata": {
//                             "color": "#f44336",
//                             "tooltip": "Начальная станция сборки",
//                             "workCount": 3
//                         }
//                     },
//                     {
//                         "id": "station2",
//                         "parentId": "line1",
//                         "type": "component",
//                         "name": "Станция 2",
//                         "metadata": {
//                             "color": "#f44336",
//                             "tooltip": "Промежуточная станция",
//                             "workCount": 4
//                         }
//                     },
//                     {
//                         "id": "station3",
//                         "parentId": "line1",
//                         "type": "component",
//                         "name": "Станция 3",
//                         "metadata": {
//                             "color": "#f44336",
//                             "tooltip": "Финальная станция",
//                             "workCount": 5
//                         }
//                     },
//                     {
//                         "id": "line2",
//                         "parentId": "workshop1",
//                         "type": "component",
//                         "name": "Линия Б",
//                         "metadata": {
//                             "color": "#ff9800",
//                             "tooltip": "Полуавтоматическая линия",
//                             "workCount": 12
//                         }
//                     },
//                     {
//                         "id": "station4",
//                         "parentId": "line2",
//                         "type": "component",
//                         "name": "Станция 4",
//                         "metadata": {
//                             "color": "#f44336",
//                             "tooltip": "Контрольная станция",
//                             "workCount": 2
//                         }
//                     },
//                     {
//                         "id": "station5",
//                         "parentId": "line2",
//                         "type": "component",
//                         "name": "Станция 5",
//                         "metadata": {
//                             "color": "#f44336",
//                             "tooltip": "Упаковочная станция",
//                             "workCount": 3
//                         }
//                     },
//                     {
//                         "id": "workshop2",
//                         "parentId": "factory1",
//                         "type": "assembly",
//                         "name": "Цех механообработки",
//                         "metadata": {
//                             "color": "#4caf50",
//                             "tooltip": "Цех механической обработки деталей",
//                             "workCount": 65
//                         }
//                     },
//                     {
//                         "id": "section1",
//                         "parentId": "workshop2",
//                         "type": "component",
//                         "name": "Участок токарных работ",
//                         "metadata": {
//                             "color": "#9c27b0",
//                             "tooltip": "Участок токарной обработки",
//                             "workCount": 25
//                         }
//                     },
//                     {
//                         "id": "machine1",
//                         "parentId": "section1",
//                         "type": "component",
//                         "name": "Станок ЧПУ-1",
//                         "metadata": {
//                             "color": "#795548",
//                             "tooltip": "Токарный станок с ЧПУ",
//                             "workCount": 1
//                         }
//                     },
//                     {
//                         "id": "machine2",
//                         "parentId": "section1",
//                         "type": "component",
//                         "name": "Станок ЧПУ-2",
//                         "metadata": {
//                             "color": "#795548",
//                             "tooltip": "Фрезерный станок с ЧПУ",
//                             "workCount": 1
//                         }
//                     },
//                     {
//                         "id": "factory2",
//                         "parentId": null,
//                         "type": "node",
//                         "name": "Завод №2 'Электрон'",
//                         "metadata": {
//                             "color": "#3f51b5",
//                             "tooltip": "Завод электронных компонентов",
//                             "workCount": 120
//                         }
//                     },
//                     {
//                         "id": "workshop3",
//                         "parentId": "factory2",
//                         "type": "assembly",
//                         "name": "Цех печатных плат",
//                         "metadata": {
//                             "color": "#00bcd4",
//                             "tooltip": "Производство печатных плат",
//                             "workCount": 35
//                         }
//                     },
//                     {
//                         "id": "pcb_line1",
//                         "parentId": "workshop3",
//                         "type": "component",
//                         "name": "Линия ПП-1",
//                         "metadata": {
//                             "color": "#e91e63",
//                             "tooltip": "Линия производства печатных плат",
//                             "workCount": 8
//                         }
//                     },
//                     {
//                         "id": "pcb_line2",
//                         "parentId": "workshop3",
//                         "type": "component",
//                         "name": "Линия ПП-2",
//                         "metadata": {
//                             "color": "#e91e63",
//                             "tooltip": "Линия производства сложных плат",
//                             "workCount": 6
//                         }
//                     }
//                 ]
//             };
//
//             this.isLoaded = true;
//             console.log(`[Header Repository] Загружено ${this.headers.headers.length} узлов заголовков`);
//         } catch (error) {
//             console.error('[Header Repository] Ошибка загрузки заголовков:', error.message);
//             throw error;
//         }
//     }
//
//     getHeaders() {
//         return this.headers;
//     }
//
//     getLeafNodes() {
//         if (!this.headers) return [];
//
//         return this.headers.headers.filter(header =>
//             !this.headers.headers.some(child => child.parentId === header.id)
//         );
//     }
//
//     count() {
//         return this.headers ? this.headers.headers.length : 0;
//     }
// }
//
// // Service слой с бизнес-логикой
// class TableDataService {
//     constructor() {
//         this.repository = new TableDataRepository();
//         this.headerRepository = new HeaderRepository();
//     }
//
//     async initialize() {
//         await this.repository.loadData();
//         await this.headerRepository.loadHeaders();
//     }
//
//     fetchData(startDate, days, leafNodes = null) {
//         console.log(`[Service] fetchData вызван: startDate=${startDate}, days=${days}, leafNodes=${leafNodes ? leafNodes.length : 'auto'}`);
//
//         if (!leafNodes) {
//             leafNodes = this.headerRepository.getLeafNodes();
//             console.log(`[Service] Использование leafNodes из headerRepository: ${leafNodes.length} узлов`);
//         }
//
//         const endDate = DateUtils.addDays(startDate, days - 1);
//         const foundEntities = this.repository.findByDateRange(startDate, endDate);
//
//         const result = [];
//         for (let i = 0; i < days; i++) {
//             const currentDate = DateUtils.addDays(startDate, i);
//             const existingEntity = foundEntities.find(e => e.date === currentDate);
//
//             if (existingEntity) {
//                 const adaptedData = this.adaptDataToLeafNodes(existingEntity, leafNodes);
//                 result.push(adaptedData);
//             } else {
//                 console.log(`[Service] Создание заглушки для даты: ${currentDate}`);
//                 const defaultData = this.createDefaultDataForLeafNodes(currentDate, leafNodes);
//                 result.push(defaultData);
//             }
//         }
//
//         console.log(`[Service] Возвращено ${result.length} записей (${foundEntities.length} из базы, ${result.length - foundEntities.length} заглушек)`);
//         return result;
//     }
//
//     adaptDataToLeafNodes(entity, leafNodes) {
//         const result = {
//             date: entity.date,
//             timestamp: Date.now()
//         };
//
//         leafNodes.forEach(node => {
//             let value = 'М';
//
//             if (entity.stage1 && node.id.includes('station1')) {
//                 const stageItem = entity.stage1.find(item => Object.keys(item)[0] === node.id);
//                 if (stageItem) value = Object.values(stageItem)[0];
//             } else if (entity.stage2 && node.id.includes('station2')) {
//                 const stageItem = entity.stage2.find(item => Object.keys(item)[0] === node.id);
//                 if (stageItem) value = Object.values(stageItem)[0];
//             } else if (entity.stage3 && node.id.includes('station3')) {
//                 const stageItem = entity.stage3.find(item => Object.keys(item)[0] === node.id);
//                 if (stageItem) value = Object.values(stageItem)[0];
//             } else {
//                 // Генерируем случайные данные для демонстрации
//                 const statuses = ['М', 'О', 'П', 'ПР', 'Р'];
//                 value = Math.random() > 0.8 ? statuses[Math.floor(Math.random() * statuses.length)] : 'М';
//             }
//
//             result[node.id] = value;
//         });
//
//         return result;
//     }
//
//     createDefaultDataForLeafNodes(date, leafNodes) {
//         const result = {
//             date: date,
//             timestamp: Date.now()
//         };
//
//         leafNodes.forEach(node => {
//             // Генерируем разнообразные статусы для демонстрации
//             const statuses = ['М', 'О', 'П', 'ПР', 'Р'];
//             result[node.id] = Math.random() > 0.85 ? statuses[Math.floor(Math.random() * statuses.length)] : 'М';
//         });
//
//         return result;
//     }
//
//     getHeaders() {
//         return this.headerRepository.getHeaders();
//     }
//
//     getLeafNodes() {
//         return this.headerRepository.getLeafNodes();
//     }
//
//     getStatistics() {
//         const allDates = this.repository.getAllDates();
//         return {
//             totalRecords: this.repository.count(),
//             isLoaded: this.repository.isLoaded,
//             headersLoaded: this.headerRepository.isLoaded,
//             headerCount: this.headerRepository.count(),
//             leafNodesCount: this.headerRepository.getLeafNodes().length,
//             dateRange: allDates.length > 0 ? {
//                 first: allDates[0],
//                 last: allDates[allDates.length - 1]
//             } : null
//         };
//     }
//
//     getDataByDate(date) {
//         return this.repository.findByDate(date);
//     }
// }
//
// // Server-side DataProvider
// class ServerDataProvider {
//     constructor(service) {
//         this.service = service;
//     }
//
//     generateClientDataProvider() {
//         return `async (startDate, days, leafNodes) => {
//             console.log('[Client DataProvider] Запрос данных:', { startDate, days, leafNodesCount: leafNodes ? leafNodes.length : 0 });
//
//             try {
//                 const response = await fetch('/server-method/fetchData', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'X-Vaadin-Session': 'mvc-session'
//                     },
//                     body: JSON.stringify({
//                         method: 'fetchData',
//                         args: [startDate, days, leafNodes]
//                     })
//                 });
//
//                 if (!response.ok) {
//                     throw new Error(\`Server method call failed: \${response.status}\`);
//                 }
//
//                 const result = await response.json();
//                 console.log('[Client DataProvider] Получено записей:', result.data.length);
//
//                 return { data: result.data };
//             } catch (error) {
//                 console.error('[Client DataProvider] Ошибка:', error);
//                 throw error;
//             }
//         }`;
//     }
// }
//
// // Server-side HeaderProvider
// class ServerHeaderProvider {
//     constructor(service) {
//         this.service = service;
//     }
//
//     generateClientHeaderProvider() {
//         const headers = this.service.getHeaders();
//         return JSON.stringify(headers, null, 2);
//     }
// }
//
// // View Controller
// class TableViewController {
//     constructor() {
//         this.service = new TableDataService();
//         this.serverDataProvider = new ServerDataProvider(this.service);
//         this.serverHeaderProvider = new ServerHeaderProvider(this.service);
//     }
//
//     async initialize() {
//         await this.service.initialize();
//         console.log('[ViewController] MVC Controller инициализирован');
//     }
//
//     renderView() {
//         const stats = this.service.getStatistics();
//         const dataProviderCode = this.serverDataProvider.generateClientDataProvider();
//         const headerProviderCode = this.serverHeaderProvider.generateClientHeaderProvider();
//
//         return `<!DOCTYPE html>
// <html lang="ru">
// <head>
//     <meta charset="utf-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1" />
//     <title>Vaadin MVC Table Application with Click Handling</title>
//     <style>
//         body {
//             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
//             margin: 0;
//             padding: 20px;
//             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//             min-height: 100vh;
//         }
//         .vaadin-app {
//             max-width: 1400px;
//             margin: 0 auto;
//             background: white;
//             border-radius: 12px;
//             box-shadow: 0 10px 30px rgba(0,0,0,0.3);
//             overflow: hidden;
//         }
//         .app-header {
//             background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
//             color: white;
//             padding: 30px;
//             text-align: center;
//         }
//         .app-header h1 {
//             margin: 0;
//             font-weight: 300;
//             font-size: 2.5em;
//         }
//         .app-header p {
//             margin: 10px 0 0 0;
//             opacity: 0.9;
//             font-size: 1.1em;
//         }
//         .mvc-info {
//             background: linear-gradient(135deg, #e8f5e8 0%, #f1f8ff 100%);
//             border: 1px solid #4caf50;
//             border-radius: 8px;
//             padding: 20px;
//             margin: 20px;
//             font-family: 'Courier New', monospace;
//             font-size: 13px;
//         }
//         .mvc-info h3 {
//             margin: 0 0 15px 0;
//             color: #2e7d32;
//             font-size: 16px;
//         }
//         .info-grid {
//             display: grid;
//             grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
//             gap: 10px;
//         }
//         .info-item {
//             padding: 8px;
//             background: rgba(255,255,255,0.7);
//             border-radius: 4px;
//         }
//         .click-log {
//             background: #fff3cd;
//             border: 1px solid #ffeaa7;
//             border-radius: 4px;
//             padding: 15px;
//             margin: 20px;
//             max-height: 200px;
//             overflow-y: auto;
//             font-family: monospace;
//             font-size: 12px;
//         }
//         .click-entry {
//             padding: 5px 0;
//             border-bottom: 1px solid #f0f0f0;
//         }
//         .click-entry:last-child {
//             border-bottom: none;
//         }
//         .table-container {
//             padding: 0 20px 20px 20px;
//         }
//         .loading {
//             text-align: center;
//             padding: 40px;
//             color: #666;
//             font-size: 16px;
//         }
//         .status-indicator {
//             display: inline-block;
//             width: 8px;
//             height: 8px;
//             border-radius: 50%;
//             margin-right: 8px;
//         }
//         .status-success { background-color: #4caf50; }
//         .status-warning { background-color: #ff9800; }
//         .status-error { background-color: #f44336; }
//     </style>
// </head>
// <body>
//     <div class="vaadin-app">
//         <div class="app-header">
//             <h1>Vaadin MVC Table Application</h1>
//             <p>Server-Side Rendering + DataProvider + HeaderProvider + Click Handling</p>
//         </div>
//
//         <div class="mvc-info">
//             <h3>🏗️ Vaadin MVC Architecture Status</h3>
//             <div class="info-grid">
//                 <div class="info-item">
//                     <strong>Pattern:</strong> MVC + Server-Side Rendering
//                 </div>
//                 <div class="info-item">
//                     <strong>JSON Database:</strong> ${stats.totalRecords} записей загружено
//                 </div>
//                 <div class="info-item">
//                     <strong>Header Structure:</strong> ${stats.headerCount} узлов, ${stats.leafNodesCount} листовых
//                 </div>
//                 <div class="info-item">
//                     <strong>Service Status:</strong>
//                     <span class="status-indicator ${stats.isLoaded ? 'status-success' : 'status-error'}"></span>
//                     ${stats.isLoaded ? 'Data Loaded' : 'Data Not Loaded'}
//                 </div>
//                 <div class="info-item">
//                     <strong>Headers Status:</strong>
//                     <span class="status-indicator ${stats.headersLoaded ? 'status-success' : 'status-error'}"></span>
//                     ${stats.headersLoaded ? 'Headers Loaded' : 'Headers Not Loaded'}
//                 </div>
//                 <div class="info-item">
//                     <strong>DataProvider:</strong> Server-injected function
//                 </div>
//                 <div class="info-item">
//                     <strong>HeaderProvider:</strong> Server-injected object
//                 </div>
//                 <div class="info-item">
//                     <strong>Click Handler:</strong> <span id="click-status">Initializing...</span>
//                 </div>
//                 <div class="info-item">
//                     <strong>Date Range:</strong> ${stats.dateRange ? `${stats.dateRange.first} - ${stats.dateRange.last}` : 'No data'}
//                 </div>
//                 <div class="info-item">
//                     <strong>Session:</strong> <span id="session-status">Initializing...</span>
//                 </div>
//             </div>
//         </div>
//
//         <div class="click-log" id="click-log" style="display: none;">
//             <strong>Лог кликов по ячейкам:</strong>
//             <div id="click-entries">Кликните по любой ячейке таблицы...</div>
//         </div>
//
//         <div class="table-container">
//             <div class="loading" id="loading">
//                 🔄 Инициализация Vaadin MVC компонента с провайдерами...
//             </div>
//
//             <virtualized-table
//                 id="table"
//                 header-provider-name="serverHeaders"
//                 data-provider-name="serverDataProvider"
//                 on-cell-click-handler="handleCellClick"
//                 max-width="100%"
//                 max-height="700px"
//                 scroll-batch-size="7"
//                 debug="true"
//                 style="display: none;">
//             </virtualized-table>
//         </div>
//     </div>
//
//     <script>
//         console.log('🚀 [Vaadin MVC] Запуск клиентской части');
//
//         const sessionStatusEl = document.getElementById('session-status');
//         const clickStatusEl = document.getElementById('click-status');
//         const loadingEl = document.getElementById('loading');
//         const tableEl = document.getElementById('table');
//         const clickLogEl = document.getElementById('click-log');
//         const clickEntriesEl = document.getElementById('click-entries');
//
//         let clickCounter = 0;
//
//         function updateSessionStatus(message) {
//             sessionStatusEl.textContent = message;
//             console.log(\`📊 [Session] \${message}\`);
//         }
//
//         function updateClickStatus(message) {
//             clickStatusEl.textContent = message;
//             console.log(\`🎯 [Click Handler] \${message}\`);
//         }
//
//         // ИНЖЕКЦИЯ ПРОВАЙДЕРОВ С СЕРВЕРА
//         console.log('💉 [Vaadin MVC] Инжекция провайдеров с сервера...');
//         updateSessionStatus('Injecting Providers...');
//
//         // СГЕНЕРИРОВАННЫЙ НА СЕРВЕРЕ КОД DATAPROVIDER
//         window.serverDataProvider = ${dataProviderCode};
//
//         // СГЕНЕРИРОВАННЫЙ НА СЕРВЕРЕ ОБЪЕКТ HEADERPROVIDER
//         window.serverHeaders = ${headerProviderCode};
//
//         // ОБРАБОТЧИК КЛИКОВ ПО ЯЧЕЙКАМ
//         window.handleCellClick = function(cellData) {
//             clickCounter++;
//             const time = new Date().toLocaleTimeString();
//
//             console.log('🎯 [Cell Click] Клик по ячейке:', cellData);
//
//             // Показываем лог кликов
//             if (clickLogEl.style.display === 'none') {
//                 clickLogEl.style.display = 'block';
//             }
//
//             // Добавляем запись в лог
//             const entry = document.createElement('div');
//             entry.className = 'click-entry';
//             entry.innerHTML = \`
//                 <strong>#\${clickCounter}</strong> \${time} |
//                 <strong>Дата:</strong> \${cellData.date} |
//                 <strong>Узел:</strong> \${cellData.node?.name || cellData.nodeId} |
//                 <strong>Значение:</strong> \${cellData.value}
//             \`;
//
//             // Вставляем в начало лога
//             if (clickEntriesEl.children.length === 0 || clickEntriesEl.children[0].textContent.includes('Кликните')) {
//                 clickEntriesEl.innerHTML = '';
//             }
//             clickEntriesEl.insertBefore(entry, clickEntriesEl.firstChild);
//
//             // Ограничиваем количество записей
//             while (clickEntriesEl.children.length > 20) {
//                 clickEntriesEl.removeChild(clickEntriesEl.lastChild);
//             }
//
//             // Отправляем клик на сервер для обработки
//             fetch('/server-method/handleCellClick', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({
//                     cellData: cellData,
//                     timestamp: Date.now()
//                 })
//             }).then(response => response.json())
//               .then(result => {
//                   console.log('✅ [Cell Click] Ответ сервера:', result);
//                   updateClickStatus(\`Processed \${clickCounter} clicks\`);
//               })
//               .catch(error => {
//                   console.error('❌ [Cell Click] Ошибка отправки на сервер:', error);
//               });
//
//             // Локальная обработка клика
//             const analysis = analyzeCellClick(cellData);
//             console.log('📊 [Cell Click] Анализ:', analysis);
//         };
//
//         function analyzeCellClick(cellData) {
//             const analysis = {
//                 date: cellData.date,
//                 node: cellData.node?.name || cellData.nodeId,
//                 value: cellData.value,
//                 timestamp: new Date().toLocaleTimeString()
//             };
//
//             switch (cellData.value) {
//                 case 'М':
//                     analysis.status = 'Техническое обслуживание';
//                     analysis.color = '💚';
//                     break;
//                 case 'О':
//                     analysis.status = 'Остановка';
//                     analysis.color = '🟡';
//                     break;
//                 case 'П':
//                     analysis.status = 'Производство';
//                     analysis.color = '🟢';
//                     break;
//                 case 'ПР':
//                     analysis.status = 'Простой';
//                     analysis.color = '🔵';
//                     break;
//                 case 'Р':
//                     analysis.status = 'Ремонт';
//                     analysis.color = '🔴';
//                     break;
//                 default:
//                     analysis.status = 'Неизвестно';
//                     analysis.color = '⚪';
//             }
//
//             return analysis;
//         }
//
//         console.log('✅ [Vaadin MVC] DataProvider успешно инжектирован');
//         console.log('✅ [Vaadin MVC] HeaderProvider успешно инжектирован');
//         console.log('✅ [Vaadin MVC] Click Handler успешно инжектирован');
//         console.log('🔍 [Vaadin MVC] HeaderProvider содержит:', window.serverHeaders.headers.length, 'узлов');
//
//         updateSessionStatus('Providers injected');
//         updateClickStatus('Ready');
//
//         function setupProviders() {
//             let setupCount = 0;
//
//             if (window.setDataProvider) {
//                 console.log('🎯 [Vaadin MVC] Вызов setDataProvider');
//                 window.setDataProvider(window.serverDataProvider);
//                 setupCount++;
//             }
//
//             console.log('🎯 [Vaadin MVC] HeaderProvider передается через атрибут header-provider-name="serverHeaders"');
//             console.log('🎯 [Vaadin MVC] ClickHandler передается через атрибут on-cell-click-handler="handleCellClick"');
//             setupCount++;
//
//             if (setupCount === 2) {
//                 updateSessionStatus('Providers configured');
//                 return true;
//             }
//             return false;
//         }
//
//         if (!setupProviders()) {
//             console.log('⏳ [Vaadin MVC] Провайдеры будут настроены после загрузки компонента');
//         }
//
//         function loadVaadinComponent() {
//             updateSessionStatus('Loading component...');
//
//             const script = document.createElement('script');
//             script.src = '/frontend/dist/virtualized-table.js';
//
//             script.onload = () => {
//                 console.log('📦 [Vaadin MVC] Компонент загружен');
//                 updateSessionStatus('Component loaded');
//
//                 setTimeout(() => {
//                     if (customElements.get('virtualized-table')) {
//                         setupProviders();
//
//                         loadingEl.style.display = 'none';
//                         tableEl.style.display = 'block';
//                         updateSessionStatus('Running');
//
//                         console.log('🎉 [Vaadin MVC] Приложение готово к работе!');
//
//                         setTimeout(() => {
//                             console.log('🧪 [Vaadin MVC] Тестовый вызов провайдеров...');
//
//                             console.log('📋 [Test Header Provider] Узлов в заголовках:', window.serverHeaders.headers.length);
//                             const leafNodes = window.serverHeaders.headers.filter(h =>
//                                 !window.serverHeaders.headers.some(child => child.parentId === h.id)
//                             );
//                             console.log('🍃 [Test Header Provider] Листовых узлов:', leafNodes.length);
//
//                             const today = new Date();
//                             const testDate = today.toLocaleDateString('ru-RU', {
//                                 day: '2-digit',
//                                 month: '2-digit',
//                                 year: 'numeric'
//                             });
//
//                             window.serverDataProvider(testDate, 3, leafNodes).then(result => {
//                                 console.log('✅ [Test Data Provider] DataProvider работает! Получено записей:', result.data.length);
//                                 console.log('✅ [Test Data Provider] Колонок в данных:', Object.keys(result.data[0] || {}).length - 2);
//                             }).catch(error => {
//                                 console.error('❌ [Test Data Provider] Ошибка DataProvider:', error);
//                             });
//
//                         }, 1000);
//                     } else {
//                         updateSessionStatus('Component registration failed');
//                         console.error('❌ [Vaadin MVC] Ошибка регистрации компонента');
//                     }
//                 }, 300);
//             };
//
//             script.onerror = () => {
//                 console.error('❌ [Vaadin MVC] Ошибка загрузки компонента');
//                 updateSessionStatus('Component load error');
//             };
//
//             document.head.appendChild(script);
//         }
//
//         document.addEventListener('DOMContentLoaded', () => {
//             updateSessionStatus('DOM ready');
//             console.log('📋 [Vaadin MVC] DOM готов, загрузка компонента...');
//             loadVaadinComponent();
//         });
//
//         setTimeout(() => {
//             if (tableEl.style.display !== 'none') {
//                 updateSessionStatus('Application running');
//                 console.log('🚀 [Vaadin MVC] Приложение успешно запущено!');
//             } else {
//                 updateSessionStatus('Initialization failed');
//                 console.error('❌ [Vaadin MVC] Ошибка инициализации приложения');
//             }
//         }, 8000);
//     </script>
// </body>
// </html>`;
//     }
// }
//
// // Глобальные переменные
// let tableViewController = null;
//
// // Вспомогательные функции для анализа кликов
// function analyzeCellValue(value) {
//     const statuses = {
//         'М': {
//             name: 'Техническое обслуживание',
//             priority: 'low',
//             color: '#cdef8d',
//             description: 'Плановое техническое обслуживание оборудования'
//         },
//         'О': {
//             name: 'Остановка',
//             priority: 'medium',
//             color: '#ffce42',
//             description: 'Временная остановка работы'
//         },
//         'П': {
//             name: 'Производство',
//             priority: 'normal',
//             color: '#86cb89',
//             description: 'Нормальный производственный процесс'
//         },
//         'ПР': {
//             name: 'Простой',
//             priority: 'medium',
//             color: '#4a86e8',
//             description: 'Простой оборудования'
//         },
//         'Р': {
//             name: 'Ремонт',
//             priority: 'high',
//             color: 'white',
//             description: 'Аварийный ремонт оборудования'
//         }
//     };
//
//     return statuses[value] || {
//         name: 'Неизвестный статус',
//         priority: 'unknown',
//         color: 'white',
//         description: 'Статус не определен'
//     };
// }
//
// function getSuggestions(cellData) {
//     const suggestions = [];
//
//     switch (cellData.value) {
//         case 'Р':
//             suggestions.push('Проверить журнал технического обслуживания');
//             suggestions.push('Связаться с службой ремонта');
//             suggestions.push('Оценить влияние на производственный план');
//             break;
//         case 'О':
//             suggestions.push('Выяснить причину остановки');
//             suggestions.push('Оценить время восстановления');
//             break;
//         case 'ПР':
//             suggestions.push('Найти альтернативные ресурсы');
//             suggestions.push('Перераспределить нагрузку');
//             break;
//         case 'П':
//             suggestions.push('Контролировать показатели производительности');
//             break;
//         case 'М':
//             suggestions.push('Проверить график следующего ТО');
//             break;
//     }
//
//     return suggestions;
// }
//
// // ENDPOINTS
//
// // Server Method endpoint для данных
// app.post('/server-method/fetchData', async (req, res) => {
//     try {
//         const { method, args } = req.body;
//
//         if (method !== 'fetchData' || !args || args.length < 2) {
//             return res.status(400).json({
//                 error: 'Invalid server method call',
//                 expected: 'method: "fetchData", args: [startDate, days, leafNodes?]'
//             });
//         }
//
//         const [startDate, days, leafNodes] = args;
//         console.log(`🔍 [Server Method] ${method} вызван: startDate=${startDate}, days=${days}, leafNodes=${leafNodes ? leafNodes.length : 'auto'}`);
//
//         const data = tableViewController.service.fetchData(startDate, days, leafNodes);
//
//         console.log(`✅ [Server Method] Возвращено ${data.length} записей`);
//         res.json({ data });
//
//     } catch (error) {
//         console.error('❌ [Server Method] Ошибка:', error.message);
//         res.status(500).json({
//             error: error.message
//         });
//     }
// });
//
// // Server Method endpoint для обработки кликов по ячейкам
// app.post('/server-method/handleCellClick', async (req, res) => {
//     try {
//         const { cellData, timestamp } = req.body;
//
//         console.log('🎯 [Server Click Handler] Обработка клика:');
//         console.log(`   Дата: ${cellData.date}`);
//         console.log(`   Узел: ${cellData.node?.name || cellData.nodeId}`);
//         console.log(`   Значение: ${cellData.value}`);
//         console.log(`   Время: ${new Date(timestamp).toLocaleString('ru-RU')}`);
//
//         const analysis = {
//             action: 'click_processed',
//             cellData: cellData,
//             timestamp: timestamp,
//             server_timestamp: Date.now(),
//             analysis: analyzeCellValue(cellData.value),
//             suggestions: getSuggestions(cellData)
//         };
//
//         res.json({
//             success: true,
//             message: 'Клик успешно обработан на сервере',
//             data: analysis
//         });
//
//     } catch (error) {
//         console.error('❌ [Server Click Handler] Ошибка:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });
//
// // Server Method endpoint для заголовков
// app.get('/server-method/getHeaders', async (req, res) => {
//     try {
//         console.log('📋 [Server Method] getHeaders вызван');
//
//         const headers = tableViewController.service.getHeaders();
//         const leafNodes = tableViewController.service.getLeafNodes();
//
//         console.log(`✅ [Server Method] Возвращено ${headers.headers.length} узлов заголовков, ${leafNodes.length} листовых`);
//
//         res.json({
//             headers: headers,
//             leafNodes: leafNodes,
//             meta: {
//                 totalNodes: headers.headers.length,
//                 leafCount: leafNodes.length
//             }
//         });
//
//     } catch (error) {
//         console.error('❌ [Server Method] Ошибка получения заголовков:', error.message);
//         res.status(500).json({
//             error: error.message
//         });
//     }
// });
//
// // Главный view endpoint
// app.get('/', async (req, res) => {
//     try {
//         if (!tableViewController) {
//             return res.status(500).send('❌ Application not initialized');
//         }
//
//         console.log('🌐 [View Controller] Рендеринг главной страницы с провайдерами');
//         const html = tableViewController.renderView();
//         res.send(html);
//     } catch (error) {
//         console.error('❌ [View Controller] Ошибка рендеринга:', error);
//         res.status(500).send('View rendering error');
//     }
// });
//
// // Health check endpoint
// app.get('/health', (req, res) => {
//     const health = {
//         status: 'UP',
//         mvc: 'Vaadin MVC Pattern',
//         service: tableViewController?.service.getStatistics() || { isLoaded: false },
//         timestamp: new Date().toISOString()
//     };
//     res.json(health);
// });
//
// // Debug endpoint для просмотра данных
// app.get('/debug/data/:date?', (req, res) => {
//     try {
//         if (!tableViewController) {
//             return res.status(500).json({ error: 'Application not initialized' });
//         }
//
//         const { date } = req.params;
//
//         if (date) {
//             const entity = tableViewController.service.getDataByDate(date);
//             if (entity) {
//                 res.json({ date, data: entity.toJSON() });
//             } else {
//                 res.status(404).json({ error: `No data found for date: ${date}` });
//             }
//         } else {
//             const stats = tableViewController.service.getStatistics();
//             res.json({
//                 statistics: stats,
//                 message: 'Use /debug/data/DD.MM.YYYY to get specific date data'
//             });
//         }
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });
//
// // Debug endpoint для просмотра заголовков
// app.get('/debug/headers', (req, res) => {
//     try {
//         if (!tableViewController) {
//             return res.status(500).json({ error: 'Application not initialized' });
//         }
//
//         const headers = tableViewController.service.getHeaders();
//         const leafNodes = tableViewController.service.getLeafNodes();
//
//         res.json({
//             headers: headers,
//             leafNodes: leafNodes,
//             statistics: {
//                 totalNodes: headers.headers.length,
//                 leafCount: leafNodes.length,
//                 maxDepth: calculateMaxDepth(headers.headers)
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });
//
// // Вспомогательная функция для расчета глубины дерева
// function calculateMaxDepth(headers) {
//     const getDepth = (nodeId, depth = 1) => {
//         const children = headers.filter(h => h.parentId === nodeId);
//         if (children.length === 0) return depth;
//         return Math.max(...children.map(child => getDepth(child.id, depth + 1)));
//     };
//
//     const rootNodes = headers.filter(h => h.parentId === null);
//     return Math.max(...rootNodes.map(root => getDepth(root.id)));
// }
//
// // Application startup
// async function startVaadinMvcApplication() {
//     try {
//         console.log('🚀 [Application] Запуск Vaadin MVC приложения с поддержкой HeaderProvider и Click Handling...');
//
//         tableViewController = new TableViewController();
//         await tableViewController.initialize();
//
//         app.listen(PORT, () => {
//             console.log('✅ [Application] Vaadin MVC приложение запущено!');
//             console.log(`🌐 [Application] URL: http://localhost:${PORT}`);
//             console.log(`💚 [Application] Health: http://localhost:${PORT}/health`);
//             console.log(`🔍 [Application] Debug Data: http://localhost:${PORT}/debug/data`);
//             console.log(`📋 [Application] Debug Headers: http://localhost:${PORT}/debug/headers`);
//             console.log('📋 [Application] Готов к работе с HeaderProvider и Click Handling!');
//         });
//     } catch (error) {
//         console.error('❌ [Application] Ошибка запуска:', error);
//         process.exit(1);
//     }
// }
//
// // Graceful shutdown
// process.on('SIGINT', () => {
//     console.log('\n👋 [Application] Graceful shutdown (SIGINT)');
//     process.exit(0);
// });
//
// process.on('SIGTERM', () => {
//     console.log('\n👋 [Application] Graceful shutdown (SIGTERM)');
//     process.exit(0);
// });
//
// startVaadinMvcApplication();

const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use('/frontend', express.static('frontend')); // Путь к сбилженному компоненту

// --- Утилиты для работы с датами (оставлены, так как используются для генерации данных) ---
class DateUtils {
    static parseDateString(dateString) {
        const [day, month, year] = dateString.split('.').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    }

    static formatDate(date) {
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    static addDays(dateString, days) {
        const date = this.parseDateString(dateString);
        date.setUTCDate(date.getUTCDate() + days);
        return this.formatDate(date);
    }
}

// --- Имитация репозитория данных (упрощенная версия) ---
class MockDataRepository {
    constructor() {
        this.data = new Map();
        this.isLoaded = false;
        this.headers = []; // Храним заголовки здесь для логики
    }

    async loadData() {
        if (this.isLoaded) return;

        try {
            const jsonData = await fs.readFile('./data/database.json', 'utf8');
            const parsedData = JSON.parse(jsonData);

            // Пример простой адаптации для database.json, если у вас сложная структура
            // В данном примере, database.json ожидается в формате { "DD.MM.YYYY": { "station1": "П", ... } }
            Object.entries(parsedData).forEach(([date, rowData]) => {
                const entity = { date, ...rowData };
                this.data.set(date, entity);
            });

            this.isLoaded = true;
            console.log(`[Repository] Загружено ${this.data.size} сущностей из JSON базы`);
        } catch (error) {
            console.warn('[Repository] Ошибка загрузки JSON базы или файл не найден. Генерируем тестовые данные:', error.message);
            this.createMockData();
        }
    }

    createMockData() {
        console.log('[Repository] Создание тестовых данных...');
        const today = new Date();
        const statuses = ['М', 'О', 'П', 'ПР', 'Р'];

        // Предполагаем, что заголовки уже загружены, чтобы генерировать данные для листовых узлов
        const leafNodeIds = this.headers
            .filter(header => !this.headers.some(child => child.parentId === header.id))
            .map(node => node.id);

        for (let i = -30; i <= 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateString = DateUtils.formatDate(date);

            const rowData = { date: dateString };
            leafNodeIds.forEach(nodeId => {
                rowData[nodeId] = statuses[Math.floor(Math.random() * statuses.length)];
            });
            this.data.set(dateString, rowData);
        }

        this.isLoaded = true;
        console.log(`[Repository] Создано ${this.data.size} тестовых записей`);
    }

    findByDateRange(startDate, days, leafNodes) {
        const result = [];
        const start = DateUtils.parseDateString(startDate);
        const endDate = DateUtils.addDays(startDate, days - 1);
        const end = DateUtils.parseDateString(endDate);

        console.log(`[Repository] Поиск данных: ${startDate} - ${endDate}, для ${leafNodes.length} узлов`);

        for (let i = 0; i < days; i++) {
            const currentDate = DateUtils.addDays(startDate, i);
            const entityDate = DateUtils.parseDateString(currentDate);

            if (entityDate >= start && entityDate <= end) {
                const existingData = this.data.get(currentDate);
                const rowData = { date: currentDate, timestamp: Date.now() };

                // Адаптируем существующие данные под запрошенные leafNodes
                leafNodes.forEach(node => {
                    rowData[node.id] = existingData?.[node.id] ||
                        (['М', 'О', 'П', 'ПР', 'Р'])[Math.floor(Math.random() * 5)]; // Заглушка, если нет данных
                });
                result.push(rowData);
            }
        }
        return result;
    }

    // Добавляем метод для установки заголовков после их загрузки
    setHeaders(headers) {
        this.headers = headers;
    }
}

// --- Имитация репозитория заголовков (упрощенная версия) ---
class MockHeaderRepository {
    constructor() {
        this.headers = null;
    }

    async loadHeaders() {
        if (this.headers) return; // Загружаем только один раз

        // HeadersProvider из index.html
        this.headers = {
            headers: [
                { id: "factory1", parentId: null, name: "Завод №1 'Металлург'", metadata: { color: "#343434", workCount: 150 } },
                { id: "workshop1", parentId: "factory1", name: "Цех сборки №1", metadata: { color: "#4caf50", workCount: 45 } },
                { id: "line1", parentId: "workshop1", name: "Линия А", metadata: { color: "#ff9800", workCount: 15 } },
                { id: "station1", parentId: "line1", name: "Станция 1", metadata: { color: "#f44336", workCount: 3 } },
                { id: "station2", parentId: "line1", name: "Станция 2", metadata: { color: "#f44336", workCount: 4 } },
                { id: "station3", parentId: "line1", name: "Станция 3", metadata: { color: "#f44336", workCount: 5 } },
                { id: "line2", parentId: "workshop1", name: "Линия Б", metadata: { color: "#ff9800", workCount: 12 } },
                { id: "station4", parentId: "line2", name: "Станция 4", metadata: { color: "#f44336", workCount: 2 } },
                { id: "station5", parentId: "line2", name: "Станция 5", metadata: { color: "#f44336", workCount: 3 } },
                { id: "workshop2", parentId: "factory1", name: "Цех механообработки", metadata: { color: "#4caf50", workCount: 65 } },
                { id: "section1", parentId: "workshop2", name: "Участок токарных работ", metadata: { color: "#9c27b0", workCount: 25 } },
                { id: "machine1", parentId: "section1", name: "Станок ЧПУ-1", metadata: { color: "#795548", workCount: 1 } },
                { id: "machine2", parentId: "section1", name: "Станок ЧПУ-2", metadata: { color: "#795548", workCount: 1 } },
                { id: "factory2", parentId: null, name: "Завод №2 'Электрон'", metadata: { color: "#3f51b5", workCount: 120 } },
                { id: "workshop3", parentId: "factory2", name: "Цех печатных плат", metadata: { color: "#00bcd4", workCount: 35 } },
                { id: "pcb_line1", parentId: "workshop3", name: "Линия ПП-1", metadata: { color: "#e91e63", workCount: 8 } },
                { id: "pcb_line2", parentId: "workshop3", name: "Линия ПП-2", metadata: { color: "#e91e63", workCount: 6 } }
            ]
        };
        console.log(`[Header Repository] Загружено ${this.headers.headers.length} узлов заголовков`);
    }

    getHeaders() {
        return this.headers;
    }
}

// --- Центральный класс для управления данными и заголовками ---
class AppService {
    constructor() {
        this.dataRepository = new MockDataRepository();
        this.headerRepository = new MockHeaderRepository();
    }

    async initialize() {
        await this.headerRepository.loadHeaders();
        this.dataRepository.setHeaders(this.headerRepository.getHeaders().headers); // Передаем заголовки в репозиторий данных
        await this.dataRepository.loadData();
        console.log('[AppService] Все репозитории инициализированы');
    }

    // Имитация HeadersProvider
    getHeadersProviderFunction() {
        // Мы возвращаем функцию, которая при вызове отдаст статический объект
        // Это имитирует `window.HeadersProvider = function() { return { headers: [...] }; }`
        return `function() {
            console.log('[Server-injected HeadersProvider] Вызов функции провайдера');
            return ${JSON.stringify(this.headerRepository.getHeaders(), null, 2)};
        }`;
    }

    // Имитация DataProvider
    // Эта функция будет вызвана на клиенте и сделает AJAX-запрос
    getDataProviderFunctionCode() {
        return `async (startDate, days, leafNodes) => {
            console.log('[Server-injected DataProvider] Запрос данных:', { startDate, days, leafNodesCount: leafNodes ? leafNodes.length : 0 });

            try {
                const response = await fetch('/api/data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ startDate, days, leafNodes })
                });

                if (!response.ok) {
                    throw new Error(\`Server data call failed: \${response.status}\`);
                }

                const result = await response.json();
                console.log('[Server-injected DataProvider] Получено записей:', result.data.length);

                return { data: result.data };
            } catch (error) {
                console.error('[Server-injected DataProvider] Ошибка:', error);
                throw error;
            }
        }`;
    }

    // Имитация handleCellClick
    // Эта функция будет вызвана на клиенте и сделает AJAX-запрос
    getCellClickHandlerFunctionCode() {
        return `function(cellData) {
            console.log('🎯 [Server-injected Click Handler] Клик по ячейке:', cellData);
            
            fetch('/api/click', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cellData: cellData, timestamp: Date.now() })
            })
            .then(response => response.json())
            .then(result => {
                console.log('✅ [Server-injected Click Handler] Ответ сервера:', result);
                // Можно добавить логику обновления UI или отображения всплывающего окна
            })
            .catch(error => {
                console.error('❌ [Server-injected Click Handler] Ошибка отправки на сервер:', error);
            });
        }`;
    }

    // Метод для получения данных из репозитория
    fetchDataForClient(startDate, days, leafNodes) {
        return this.dataRepository.findByDateRange(startDate, days, leafNodes);
    }
}

const appService = new AppService();

// --- ENDPOINTS ---

// API для получения данных из DataProvider
app.post('/api/data', async (req, res) => {
    try {
        const { startDate, days, leafNodes } = req.body;
        console.log(`🔍 [API/data] Запрос на данные: startDate=${startDate}, days=${days}, leafNodes=${leafNodes ? leafNodes.length : 'auto'}`);

        const data = await appService.fetchDataForClient(startDate, days, leafNodes);

        console.log(`✅ [API/data] Возвращено ${data.length} записей`);
        res.json({ data });
    } catch (error) {
        console.error('❌ [API/data] Ошибка:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// API для обработки кликов по ячейкам
app.post('/api/click', async (req, res) => {
    try {
        const { cellData, timestamp } = req.body;
        console.log('🎯 [API/click] Обработка клика:');
        console.log(`   Дата: ${cellData.date}`);
        console.log(`   Узел: ${cellData.node?.name || cellData.nodeId}`);
        console.log(`   Значение: ${cellData.value}`);
        console.log(`   Время: ${new Date(timestamp).toLocaleString('ru-RU')}`);

        // Здесь может быть ваша серверная логика обработки кликов
        // Например, запись в базу данных, логирование, запуск бизнес-процессов
        const serverProcessingResult = {
            status: 'processed',
            receivedAt: new Date().toISOString(),
            originalCellData: cellData
        };

        res.json({ success: true, message: 'Клик успешно обработан на сервере', serverProcessingResult });
    } catch (error) {
        console.error('❌ [API/click] Ошибка обработки клика:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});


// Главный view endpoint, который возвращает HTML со вставленными функциями
app.get('/', async (req, res) => {
    try {
        const headerProviderCode = appService.getHeadersProviderFunction();
        const dataProviderCode = appService.getDataProviderFunctionCode();
        const cellClickHandlerCode = appService.getCellClickHandlerFunctionCode();

        res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Virtualized Table - Server-Injected Providers</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        virtualized-table {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            padding: 10px;
        }
        .info-box {
            background-color: #e0f7fa;
            border-left: 5px solid #00bcd4;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
        }
        #click-log {
            background-color: #fffde7;
            border-left: 5px solid #ffeb3b;
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
            max-height: 200px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 0.9em;
        }
        .click-entry {
            border-bottom: 1px dashed #ffe0b2;
            padding: 5px 0;
        }
        .click-entry:last-child {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <h1>Виртуализированная таблица (Серверная инжекция)</h1>

    <div class="info-box">
        <p><strong>Статус:</strong> Провайдеры инжектированы сервером.</p>
        <p><strong>HeadersProvider:</strong> Сгенерирован как функция на сервере.</p>
        <p><strong>DataProvider:</strong> Сгенерирован как функция, которая делает POST-запрос на <code>/api/data</code>.</p>
        <p><strong>CellClickHandler:</strong> Сгенерирован как функция, которая делает POST-запрос на <code>/api/click</code>.</p>
    </div>

    <div id="click-log" style="display: none;">
        <strong>Лог кликов по ячейкам:</strong>
        <div id="click-entries">Кликните по любой ячейке таблицы...</div>
    </div>

    <virtualized-table
        header-provider-name="serverHeadersProvider"
        data-provider-name="serverDataProvider"
        on-cell-click-handler="serverCellClickHandler"
        max-width="100%"
        max-height="700px"
        scroll-batch-size="7"
        debug="true">
    </virtualized-table>

    <script>
        console.log('[Client] Запуск клиентской части с серверными провайдерами...');

        // Инжектируем функции провайдеров, сгенерированные на сервере
        window.serverHeadersProvider = ${headerProviderCode};
        window.serverDataProvider = ${dataProviderCode};
        window.serverCellClickHandler = ${cellClickHandlerCode};

        console.log('✅ [Client] window.serverHeadersProvider инжектирован:', typeof window.serverHeadersProvider);
        console.log('✅ [Client] window.serverDataProvider инжектирован:', typeof window.serverDataProvider);
        console.log('✅ [Client] window.serverCellClickHandler инжектирован:', typeof window.serverCellClickHandler);

        // Расширяем серверный обработчик кликов для локального логирования
        const originalCellClickHandler = window.serverCellClickHandler;
        window.serverCellClickHandler = function(cellData) {
            originalCellClickHandler(cellData); // Вызываем серверный обработчик

            // Локальное логирование
            const clickLogEl = document.getElementById('click-log');
            const clickEntriesEl = document.getElementById('click-entries');

            if (clickLogEl.style.display === 'none') {
                clickLogEl.style.display = 'block';
            }

            const entry = document.createElement('div');
            entry.className = 'click-entry';
            entry.innerHTML = \`\${new Date().toLocaleTimeString()} | <strong>Дата:</strong> \${cellData.date} | <strong>Узел:</strong> \${cellData.node?.name || cellData.nodeId} | <strong>Значение:</strong> \${cellData.value}\`;

            if (clickEntriesEl.children.length === 0 || clickEntriesEl.children[0].textContent.includes('Кликните')) {
                clickEntriesEl.innerHTML = '';
            }
            clickEntriesEl.insertBefore(entry, clickEntriesEl.firstChild);
            while (clickEntriesEl.children.length > 10) { // Ограничиваем количество записей
                clickEntriesEl.removeChild(clickEntriesEl.lastChild);
            }
        };

        // Загрузка компонента virtualized-table
        const script = document.createElement('script');
        script.src = '/frontend/dist/virtualized-table.js'; // Убедитесь, что путь правильный

        script.onload = function() {
            console.log('✅ [Client] Компонент virtualized-table загружен');
            // После загрузки компонента, он сам найдет провайдеры по именам в window
            // через setTimeout, чтобы убедиться, что компонент зарегистрирован
            setTimeout(() => {
                if (customElements.get('virtualized-table')) {
                    console.log('🎉 [Client] Web Component "virtualized-table" зарегистрирован и готов!');
                    // Можно сделать тестовый вызов DataProvider, чтобы убедиться
                    const today = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const testHeaders = window.serverHeadersProvider().headers;
                    const leafNodes = testHeaders.filter(h => !testHeaders.some(child => child.parentId === h.id));
                    
                    window.serverDataProvider(today, 3, leafNodes).then(result => {
                        console.log('✅ [Client] Тест serverDataProvider успешен, получено:', result.data.length, 'записей');
                    }).catch(err => {
                        console.error('❌ [Client] Ошибка при тестировании serverDataProvider:', err);
                    });

                } else {
                    console.error('❌ [Client] Web Component "virtualized-table" НЕ зарегистрирован');
                }
            }, 100);
        };

        script.onerror = function() {
            console.error('❌ [Client] Ошибка загрузки компонента virtualized-table');
        };

        document.head.appendChild(script);
    </script>
</body>
</html>`);
    } catch (error) {
        console.error('❌ [Server] Ошибка рендеринга главной страницы:', error);
        res.status(500).send('Ошибка при загрузке страницы.');
    }
});

// --- Запуск приложения ---
async function startApplication() {
    try {
        console.log('🚀 [Server] Запуск приложения...');
        await appService.initialize();

        app.listen(PORT, () => {
            console.log('✅ [Server] Приложение запущено!');
            console.log(`🌐 [Server] URL: http://localhost:${PORT}`);
            console.log(`📂 [Server] Статические файлы из: ${path.resolve(__dirname, 'frontend')}`);
            console.log('---');
        });
    } catch (error) {
        console.error('❌ [Server] Ошибка запуска приложения:', error);
        process.exit(1);
    }
}

startApplication();
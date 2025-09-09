const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use('/frontend', express.static('frontend'));

/**
 * ПОЛНЫЙ VAADIN MVC PATTERN
 * Серверный рендеринг + инжекция DataProvider + поиск по JSON базе
 */

// Утилиты для работы с датами
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

// Entity класс для данных таблицы
class TableDataEntity {
    constructor(date, agr1, agr2, agr3, stage1, stage2, stage3) {
        this.date = date;
        this.agr1 = agr1;
        this.agr2 = agr2;
        this.agr3 = agr3;
        this.stage1 = stage1;
        this.stage2 = stage2;
        this.stage3 = stage3;
    }

    isValid() {
        return this.date && this.stage1 && this.stage2 && this.stage3;
    }

    toJSON() {
        const result = {
            date: this.date,
            agr1: this.agr1 || 0,
            agr2: this.agr2 || 0,
            stage1: this.stage1,
            stage2: this.stage2,
            stage3: this.stage3
        };

        if (this.agr3 !== undefined) {
            result.agr3 = this.agr3;
        }

        return result;
    }
}

// Repository слой с поиском по JSON базе
class TableDataRepository {
    constructor() {
        this.data = new Map();
        this.isLoaded = false;
    }

    async loadData() {
        if (this.isLoaded) return;

        try {
            const jsonData = await fs.readFile('./data/database.json', 'utf8');
            const parsedData = JSON.parse(jsonData);

            Object.entries(parsedData).forEach(([date, rawData]) => {
                const entity = new TableDataEntity(
                    rawData.date,
                    rawData.agr1,
                    rawData.agr2,
                    rawData.agr3,
                    rawData.stage1,
                    rawData.stage2,
                    rawData.stage3
                );
                this.data.set(date, entity);
            });

            this.isLoaded = true;
            console.log(`[Repository] Загружено ${this.data.size} сущностей из JSON базы`);
        } catch (error) {
            console.error('[Repository] Ошибка загрузки JSON базы:', error.message);
            throw error;
        }
    }

    // Поиск данных по диапазону дат
    findByDateRange(startDate, endDate) {
        const result = [];
        const start = DateUtils.parseDateString(startDate);
        const end = DateUtils.parseDateString(endDate);

        console.log(`[Repository] Поиск в JSON базе: ${startDate} - ${endDate}`);

        for (const [dateKey, entity] of this.data.entries()) {
            const entityDate = DateUtils.parseDateString(dateKey);
            if (entityDate >= start && entityDate <= end) {
                result.push(entity);
            }
        }

        console.log(`[Repository] Найдено ${result.length} записей в JSON базе`);

        return result.sort((a, b) =>
            DateUtils.parseDateString(a.date) - DateUtils.parseDateString(b.date)
        );
    }

    // Поиск конкретной записи по дате
    findByDate(date) {
        return this.data.get(date);
    }

    count() {
        return this.data.size;
    }

    // Получение всех дат в базе
    getAllDates() {
        return Array.from(this.data.keys()).sort((a, b) =>
            DateUtils.parseDateString(a) - DateUtils.parseDateString(b)
        );
    }
}

// Service слой с бизнес-логикой
class TableDataService {
    constructor() {
        this.repository = new TableDataRepository();
    }

    async initialize() {
        await this.repository.loadData();
    }

    // Основной метод получения данных для DataProvider
    fetchData(startDate, days) {
        console.log(`[Service] fetchData вызван: startDate=${startDate}, days=${days}`);

        const endDate = DateUtils.addDays(startDate, days - 1);
        const foundEntities = this.repository.findByDateRange(startDate, endDate);

        // Создание полного списка дат с заполнением пропусков
        const result = [];
        for (let i = 0; i < days; i++) {
            const currentDate = DateUtils.addDays(startDate, i);
            const existingEntity = foundEntities.find(e => e.date === currentDate);

            if (existingEntity) {
                result.push(existingEntity);
            } else {
                // Создание заглушки для отсутствующих дат
                console.log(`[Service] Создание заглушки для даты: ${currentDate}`);
                const defaultEntity = new TableDataEntity(
                    currentDate,
                    0, 0, undefined,
                    [
                        {"20ГПА-1-1": "—"}, {"20ГПА-1-2": "—"},
                        {"20ГПА-1-3": "—"}, {"20ГПА-1-4": "—"}
                    ],
                    [
                        {"20ГПА-2-1": "—"}, {"20ГПА-2-2": "—"},
                        {"20ГПА-2-3": "—"}, {"20ГПА-2-4": "—"}
                    ],
                    [
                        {"20ГПА-3-1": "—"}, {"20ГПА-3-2": "—"},
                        {"20ГПА-3-3": "—"}, {"20ГПА-3-4": "—"}
                    ]
                );
                result.push(defaultEntity);
            }
        }

        console.log(`[Service] Возвращено ${result.length} записей (${foundEntities.length} из базы, ${result.length - foundEntities.length} заглушек)`);

        return result.map(entity => entity.toJSON());
    }

    getStatistics() {
        const allDates = this.repository.getAllDates();
        return {
            totalRecords: this.repository.count(),
            isLoaded: this.repository.isLoaded,
            dateRange: allDates.length > 0 ? {
                first: allDates[0],
                last: allDates[allDates.length - 1]
            } : null
        };
    }

    // Метод для поиска конкретной записи
    getDataByDate(date) {
        return this.repository.findByDate(date);
    }
}

// Server-side DataProvider (генерирует код для клиента)
class ServerDataProvider {
    constructor(service) {
        this.service = service;
    }

    // Генерация JavaScript функции DataProvider для клиента
    generateClientDataProvider() {
        return `async (startDate, days) => {
            console.log('[Client DataProvider] Запрос данных:', { startDate, days });
            
            try {
                const response = await fetch('/server-method/fetchData', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Vaadin-Session': 'mvc-session'
                    },
                    body: JSON.stringify({
                        method: 'fetchData',
                        args: [startDate, days]
                    })
                });
                
                if (!response.ok) {
                    throw new Error(\`Server method call failed: \${response.status}\`);
                }
                
                const result = await response.json();
                console.log('[Client DataProvider] Получено записей:', result.data.length);
                
                return { data: result.data };
            } catch (error) {
                console.error('[Client DataProvider] Ошибка:', error);
                throw error;
            }
        }`;
    }
}

// View Controller (MVC Controller)
class TableViewController {
    constructor() {
        this.service = new TableDataService();
        this.serverDataProvider = new ServerDataProvider(this.service);
    }

    async initialize() {
        await this.service.initialize();
        console.log('[ViewController] MVC Controller инициализирован');
    }

    // Генерация HTML с инжекцией DataProvider
    renderView() {
        const stats = this.service.getStatistics();
        const dataProviderCode = this.serverDataProvider.generateClientDataProvider();

        return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vaadin MVC Table Application</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .vaadin-app {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .app-header {
            background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .app-header h1 {
            margin: 0;
            font-weight: 300;
            font-size: 2.5em;
        }
        .app-header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .mvc-info {
            background: linear-gradient(135deg, #e8f5e8 0%, #f1f8ff 100%);
            border: 1px solid #4caf50;
            border-radius: 8px;
            padding: 20px;
            margin: 20px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
        }
        .mvc-info h3 {
            margin: 0 0 15px 0;
            color: #2e7d32;
            font-size: 16px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 10px;
        }
        .info-item {
            padding: 8px;
            background: rgba(255,255,255,0.7);
            border-radius: 4px;
        }
        .table-container {
            padding: 0 20px 20px 20px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
            font-size: 16px;
        }
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-success { background-color: #4caf50; }
        .status-warning { background-color: #ff9800; }
        .status-error { background-color: #f44336; }
    </style>
</head>
<body>
    <div class="vaadin-app">
        <div class="app-header">
            <h1>Vaadin MVC Table Application</h1>
            <p>Server-Side Rendering + DataProvider Injection + JSON Database Search</p>
        </div>

        <div class="mvc-info">
            <h3>🏗️ Vaadin MVC Architecture Status</h3>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Pattern:</strong> MVC + Server-Side Rendering
                </div>
                <div class="info-item">
                    <strong>JSON Database:</strong> ${stats.totalRecords} записей загружено
                </div>
                <div class="info-item">
                    <strong>Service Status:</strong> 
                    <span class="status-indicator ${stats.isLoaded ? 'status-success' : 'status-error'}"></span>
                    ${stats.isLoaded ? 'Loaded' : 'Not Loaded'}
                </div>
                <div class="info-item">
                    <strong>DataProvider:</strong> Server-injected function
                </div>
                <div class="info-item">
                    <strong>Date Range:</strong> ${stats.dateRange ? `${stats.dateRange.first} - ${stats.dateRange.last}` : 'No data'}
                </div>
                <div class="info-item">
                    <strong>Session:</strong> <span id="session-status">Initializing...</span>
                </div>
            </div>
        </div>

        <div class="table-container">
            <div class="loading" id="loading">
                🔄 Инициализация Vaadin MVC компонента...
            </div>
            
            <virtualized-table
                id="table"
                max-width="100%"
                max-height="700px"
                scroll-batch-size="7"
                debug="true"
                style="display: none;">
            </virtualized-table>
        </div>
    </div>

    <script>
        console.log('🚀 [Vaadin MVC] Запуск клиентской части');
        
        const sessionStatusEl = document.getElementById('session-status');
        const loadingEl = document.getElementById('loading');
        const tableEl = document.getElementById('table');

        function updateSessionStatus(message) {
            sessionStatusEl.textContent = message;
            console.log(\`📊 [Session] \${message}\`);
        }

        // ИНЖЕКЦИЯ DATAPROVIDER С СЕРВЕРА (аналог Element.executeJs)
        console.log('💉 [Vaadin MVC] Инжекция DataProvider с сервера...');
        updateSessionStatus('Injecting DataProvider...');
        
        // СГЕНЕРИРОВАННЫЙ НА СЕРВЕРЕ КОД DATAPROVIDER
        window.dp = ${dataProviderCode};
        
        console.log('✅ [Vaadin MVC] DataProvider успешно инжектирован');
        updateSessionStatus('DataProvider injected');

        // УСТАНОВКА DATAPROVIDER (аналог setDataProvider)
        console.log('🔧 [Vaadin MVC] Настройка setDataProvider...');
        
        // Функция для установки DataProvider после загрузки компонента
        function setupDataProvider() {
            if (window.setDataProvider) {
                console.log('🎯 [Vaadin MVC] Вызов setDataProvider');
                window.setDataProvider(window.dp);
                updateSessionStatus('DataProvider set');
                return true;
            }
            return false;
        }

        // Попытка установить DataProvider сейчас
        if (!setupDataProvider()) {
            console.log('⏳ [Vaadin MVC] setDataProvider будет вызван после загрузки компонента');
        }

        // Загрузка Vaadin компонента
        function loadVaadinComponent() {
            updateSessionStatus('Loading component...');
            
            const script = document.createElement('script');
            script.src = '/frontend/dist/virtualized-table.js';
            
            script.onload = () => {
                console.log('📦 [Vaadin MVC] Компонент загружен');
                updateSessionStatus('Component loaded');
                
                setTimeout(() => {
                    if (customElements.get('virtualized-table')) {
                        // Повторная попытка установить DataProvider
                        setupDataProvider();
                        
                        loadingEl.style.display = 'none';
                        tableEl.style.display = 'block';
                        updateSessionStatus('Running');
                        
                        console.log('🎉 [Vaadin MVC] Приложение готово к работе!');
                        
                        // Тестовый вызов DataProvider
                        setTimeout(() => {
                            console.log('🧪 [Vaadin MVC] Тестовый вызов DataProvider...');
                            const today = new Date();
                            const testDate = today.toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            });
                            
                            window.dp(testDate, 3).then(result => {
                                console.log('✅ [Test] DataProvider работает! Получено записей:', result.data.length);
                            }).catch(error => {
                                console.error('❌ [Test] Ошибка DataProvider:', error);
                            });
                        }, 1000);
                    } else {
                        updateSessionStatus('Component registration failed');
                        console.error('❌ [Vaadin MVC] Ошибка регистрации компонента');
                    }
                }, 300);
            };
            
            script.onerror = () => {
                console.error('❌ [Vaadin MVC] Ошибка загрузки компонента');
                updateSessionStatus('Component load error');
            };
            
            document.head.appendChild(script);
        }

        // Инициализация приложения
        document.addEventListener('DOMContentLoaded', () => {
            updateSessionStatus('DOM ready');
            console.log('📋 [Vaadin MVC] DOM готов, загрузка компонента...');
            loadVaadinComponent();
        });

        // Финальная проверка через 8 секунд
        setTimeout(() => {
            if (tableEl.style.display !== 'none') {
                updateSessionStatus('Application running');
                console.log('🚀 [Vaadin MVC] Приложение успешно запущено!');
            } else {
                updateSessionStatus('Initialization failed');
                console.error('❌ [Vaadin MVC] Ошибка инициализации приложения');
            }
        }, 8000);
    </script>
</body>
</html>`;
    }
}

// Глобальные переменные
let tableViewController = null;

// Server Method endpoint (аналог this.$server.method())
app.post('/server-method/fetchData', async (req, res) => {
    try {
        const { method, args } = req.body;

        if (method !== 'fetchData' || !args || args.length !== 2) {
            return res.status(400).json({
                error: 'Invalid server method call',
                expected: 'method: "fetchData", args: [startDate, days]'
            });
        }

        const [startDate, days] = args;
        console.log(`🔍 [Server Method] ${method} вызван: startDate=${startDate}, days=${days}`);

        // Вызов серверного метода
        const data = tableViewController.service.fetchData(startDate, days);

        console.log(`✅ [Server Method] Возвращено ${data.length} записей`);
        res.json({ data });

    } catch (error) {
        console.error('❌ [Server Method] Ошибка:', error.message);
        res.status(500).json({
            error: error.message
        });
    }
});

// Главный view endpoint (MVC Route)
app.get('/', async (req, res) => {
    try {
        if (!tableViewController) {
            return res.status(500).send('❌ Application not initialized');
        }

        console.log('🌐 [View Controller] Рендеринг главной страницы');
        const html = tableViewController.renderView();
        res.send(html);
    } catch (error) {
        console.error('❌ [View Controller] Ошибка рендеринга:', error);
        res.status(500).send('View rendering error');
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    const health = {
        status: 'UP',
        mvc: 'Vaadin MVC Pattern',
        service: tableViewController?.service.getStatistics() || { isLoaded: false },
        timestamp: new Date().toISOString()
    };
    res.json(health);
});

// Debug endpoint для просмотра данных
app.get('/debug/data/:date?', (req, res) => {
    try {
        if (!tableViewController) {
            return res.status(500).json({ error: 'Application not initialized' });
        }

        const { date } = req.params;

        if (date) {
            const entity = tableViewController.service.getDataByDate(date);
            if (entity) {
                res.json({ date, data: entity.toJSON() });
            } else {
                res.status(404).json({ error: `No data found for date: ${date}` });
            }
        } else {
            const stats = tableViewController.service.getStatistics();
            res.json({
                statistics: stats,
                message: 'Use /debug/data/DD.MM.YYYY to get specific date data'
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Application startup
async function startVaadinMvcApplication() {
    try {
        console.log('🚀 [Application] Запуск Vaadin MVC приложения...');

        tableViewController = new TableViewController();
        await tableViewController.initialize();

        app.listen(PORT, () => {
            console.log('✅ [Application] Vaadin MVC приложение запущено!');
            console.log(`🌐 [Application] URL: http://localhost:${PORT}`);
            console.log(`💚 [Application] Health: http://localhost:${PORT}/health`);
            console.log(`🔍 [Application] Debug: http://localhost:${PORT}/debug/data`);
            console.log('📋 [Application] Готов к работе!');
        });
    } catch (error) {
        console.error('❌ [Application] Ошибка запуска:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 [Application] Graceful shutdown (SIGINT)');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 [Application] Graceful shutdown (SIGTERM)');
    process.exit(0);
});

startVaadinMvcApplication();
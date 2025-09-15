const express = require('express');
const path = require('path');

const {
    getHeaders,
    getLeafNodeIds,
    getHeadersByLevel,
    getNodeHierarchy
} = require('./providers/headersProvider');

const {
    generateTableData,
    getDataForPeriod,
    getStatusStatistics,
    handleCellClick,
    EQUIPMENT_STATUSES
} = require('./providers/dataProvider');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use('/frontend', express.static('frontend'));

// API для получения заголовков
app.get('/api/headers', async (req, res) => {
    try {
        console.log('[API] Запрос заголовков');
        const headers = await getHeaders();

        res.json({
            success: true,
            data: headers,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[API] Ошибка получения заголовков:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API для получения заголовков по уровню
app.get('/api/headers/level/:level', async (req, res) => {
    try {
        const level = parseInt(req.params.level);
        console.log(`[API] Запрос заголовков уровня ${level}`);

        const headers = await getHeadersByLevel(level);

        res.json({
            success: true,
            data: headers,
            level: level,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[API] Ошибка получения заголовков по уровню:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API для получения иерархии узла
app.get('/api/headers/hierarchy/:nodeId', async (req, res) => {
    try {
        const nodeId = req.params.nodeId;
        console.log(`[API] Запрос иерархии для узла ${nodeId}`);

        const hierarchy = await getNodeHierarchy(nodeId);

        res.json({
            success: true,
            data: hierarchy,
            nodeId: nodeId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[API] Ошибка получения иерархии:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API для данных таблицы - новый формат с направлением
app.post('/api/data', async (req, res) => {
    try {
        const { startDate, direction, batchSize, options = {} } = req.body;

        console.log(`[API] Запрос данных: startDate=${startDate}, direction=${direction}, batchSize=${batchSize}`);

        // Валидация параметров
        if (!startDate) {
            return res.status(400).json({
                success: false,
                error: 'Параметр startDate обязателен'
            });
        }

        if (!['up', 'down'].includes(direction)) {
            return res.status(400).json({
                success: false,
                error: 'direction должен быть "up" или "down"'
            });
        }

        if (!batchSize || batchSize <= 0 || batchSize > 100) {
            return res.status(400).json({
                success: false,
                error: 'batchSize должен быть от 1 до 100'
            });
        }

        const result = await generateTableData(startDate, direction, batchSize, options);

        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[API] Ошибка генерации данных:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API для получения данных за период
app.post('/api/data/period', async (req, res) => {
    try {
        const { startDate, endDate, options = {} } = req.body;

        console.log(`[API] Запрос данных за период: ${startDate} - ${endDate}`);

        const result = await getDataForPeriod(startDate, endDate, options);

        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[API] Ошибка получения данных за период:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API для статистики по статусам
app.post('/api/data/statistics', async (req, res) => {
    try {
        const { startDate, direction, batchSize } = req.body;

        console.log(`[API] Запрос статистики: ${startDate}, ${direction}, ${batchSize}`);

        const statistics = await getStatusStatistics(startDate, direction, batchSize);

        res.json({
            success: true,
            ...statistics,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[API] Ошибка получения статистики:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API для кликов по ячейкам - async обработка
app.post('/api/click', async (req, res) => {
    try {
        const { cellData, options = {} } = req.body;

        console.log(`[API] Обработка клика: ${cellData?.date} - ${cellData?.nodeId}`);

        if (!cellData || !cellData.date || !cellData.nodeId) {
            return res.status(400).json({
                success: false,
                error: 'Неполные данные ячейки'
            });
        }

        const result = await handleCellClick(cellData, options);

        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[API] Ошибка обработки клика:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API для получения информации о статусах
app.get('/api/statuses', (req, res) => {
    res.json({
        success: true,
        data: EQUIPMENT_STATUSES,
        timestamp: new Date().toISOString()
    });
});

// API для информации о листовых узлах
app.get('/api/leaf-nodes', async (req, res) => {
    try {
        const leafNodeIds = getLeafNodeIds();

        res.json({
            success: true,
            data: leafNodeIds,
            count: leafNodeIds.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[API] Ошибка получения листовых узлов:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Главная страница с интегрированными провайдерами
app.get('/', async (req, res) => {
    try {
        // Получаем заголовки на сервере для встраивания в HTML
        const headersData = await getHeaders();

        res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Модульная виртуализированная таблица</title>
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
        .status {
            background: #e8f4fd;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .api-status {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <h1>Модульная виртуализированная таблица</h1>
    
    <div class="status">
        <strong>Архитектура:</strong> Модульные провайдеры с разделением ответственности
    </div>
    
    <div class="api-status">
        <strong>API Endpoints:</strong>
        <ul>
            <li>GET /api/headers - получение структуры заголовков</li>
            <li>POST /api/data - получение данных таблицы</li>
            <li>POST /api/click - обработка кликов</li>
            <li>GET /api/statuses - информация о статусах</li>
        </ul>
    </div>

    <virtualized-table
        max-width="100%"
        max-height="600px"
        scroll-batch-size="7"
        debug="true">
    </virtualized-table>

    <script>
        console.log('[Main] Инициализация модульных провайдеров...');
        
        // 1. Async провайдер заголовков через API
        window.hp = async function() {
            console.log('[ASYNC HP] Загрузка заголовков через API...');
            
            try {
                const response = await fetch('/api/headers');
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || 'Ошибка получения заголовков');
                }
                
                console.log(\`[ASYNC HP] Загружено \${result.data.headers.length} заголовков\`);
                return result.data;
                
            } catch (error) {
                console.error('[ASYNC HP] Ошибка:', error);
                
                // Fallback на локальные данные
                console.log('[ASYNC HP] Используем встроенные заголовки');
                return ${JSON.stringify(headersData)};
            }
        };

        // 2. Async провайдер данных через API
        window.dp = async function(startDate, direction, batchSize) {
            console.log(\`[ASYNC DP] Запрос через API: \${startDate}, \${direction}, \${batchSize}\`);
            
            try {
                const response = await fetch('/api/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        startDate, 
                        direction, 
                        batchSize,
                        options: {
                            useContextualStatus: true,
                            simulateDbDelay: true
                        }
                    })
                });
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || 'Ошибка получения данных');
                }
                
                console.log(\`[ASYNC DP] Получено \${result.data.length} записей через API\`);
                return { data: result.data };
                
            } catch (error) {
                console.error('[ASYNC DP] Ошибка API:', error);
                throw error;
            }
        };

        // 3. Async обработчик кликов через API
        window.onTableCellClick = async function(cellData) {
            console.log(\`[ASYNC CLICK] Обработка через API: \${cellData.date} / \${cellData.nodeId}\`);
            
            try {
                const response = await fetch('/api/click', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        cellData,
                        options: {
                            processingDelay: 150
                        }
                    })
                });
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}\`);
                }
                
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || 'Ошибка обработки клика');
                }
                
                console.log('[ASYNC CLICK] Результат API:', result);
                
                // Показываем информацию о статусе
                if (result.cellInfo && result.cellInfo.statusInfo) {
                    console.log(\`[INFO] Статус: \${result.cellInfo.statusInfo.name}\`);
                }
                
                // Показываем выполненные действия
                if (result.actions && result.actions.length > 0) {
                    console.log('[ACTIONS]', result.actions);
                }
                
                return result;
                
            } catch (error) {
                console.error('[ASYNC CLICK] Ошибка API:', error);
                throw error;
            }
        };

        // 4. Дополнительные утилиты для работы с API
        window.tableAPI = {
            // Получение статистики
            async getStatistics(startDate, direction, batchSize) {
                const response = await fetch('/api/data/statistics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startDate, direction, batchSize })
                });
                return response.json();
            },
            
            // Получение данных за период
            async getDataForPeriod(startDate, endDate) {
                const response = await fetch('/api/data/period', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startDate, endDate })
                });
                return response.json();
            },
            
            // Получение информации о статусах
            async getStatusInfo() {
                const response = await fetch('/api/statuses');
                return response.json();
            },
            
            // Получение листовых узлов
            async getLeafNodes() {
                const response = await fetch('/api/leaf-nodes');
                return response.json();
            }
        };

        // Загрузка компонента
        const script = document.createElement('script');
        script.src = '/frontend/dist/virtualized-table.js';
        
        script.onload = function() {
            setTimeout(async () => {
                if (customElements.get('virtualized-table')) {
                    console.log('[HTML] ✅ Модульный компонент загружен успешно');
                    
                    try {
                        // Тест провайдеров
                        const headers = await window.hp();
                        console.log('[TEST] HP тест пройден:', headers.headers.length, 'заголовков');
                        
                        const testDataDown = await window.dp('01.01.2024', 'down', 3);
                        console.log('[TEST] DP тест (down) пройден:', testDataDown.data.length, 'записей');
                        
                        const testDataUp = await window.dp('01.01.2024', 'up', 3);
                        console.log('[TEST] DP тест (up) пройден:', testDataUp.data.length, 'записей');
                        
                        // Тест API утилит
                        const statuses = await window.tableAPI.getStatusInfo();
                        console.log('[TEST] Статусы загружены:', Object.keys(statuses.data).length);
                        
                        const leafNodes = await window.tableAPI.getLeafNodes();
                        console.log('[TEST] Листовые узлы:', leafNodes.data.length);
                        
                        console.log('[TEST] ✅ Все модульные провайдеры работают корректно');
                        
                    } catch (error) {
                        console.error('[TEST] ❌ Ошибка в модульных провайдерах:', error);
                    }
                    
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

    } catch (error) {
        console.error('[Server] Ошибка генерации главной страницы:', error);
        res.status(500).send('Ошибка сервера при загрузке страницы');
    }
});

// Middleware для обработки 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint не найден',
        availableEndpoints: [
            'GET /',
            'GET /api/headers',
            'GET /api/headers/level/:level',
            'GET /api/headers/hierarchy/:nodeId',
            'POST /api/data',
            'POST /api/data/period',
            'POST /api/data/statistics',
            'POST /api/click',
            'GET /api/statuses',
            'GET /api/leaf-nodes'
        ]
    });
});

// Middleware для обработки ошибок
app.use((error, req, res, next) => {
    console.error('[Server] Необработанная ошибка:', error);
    res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        timestamp: new Date().toISOString()
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Модульный сервер запущен на http://localhost:${PORT}`);
    console.log(`📂 Статические файлы: ${path.resolve(__dirname, 'frontend')}`);
    console.log('🔧 Провайдеры: headers (модуль), data (модуль)');
    console.log('🌐 API эндпоинты доступны по /api/*');
    console.log('✨ Полная модульная архитектура готова к работе');
});
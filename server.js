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
/**
 * Провайдер данных для имитации Java Vaadin backend
 * providers/dataProvider.js
 */

const { getLeafNodeIds } = require('./headersProvider');

/**
 * Утилиты для работы с датами
 */
function parseDateString(dateString) {
    const [day, month, year] = dateString.split('.').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date) {
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Возможные статусы оборудования
 */
const EQUIPMENT_STATUSES = {
    М: { name: "Модификация", color: "#cdef8d", weight: 10 },
    О: { name: "Остановлен", color: "#ffce42", weight: 5 },
    П: { name: "Простой", color: "#86cb89", weight: 8 },
    ПР: { name: "Плановый ремонт", color: "#4a86e8", weight: 3 },
    Р: { name: "Работает", color: "white", weight: 70 }
};

/**
 * Генерация случайного статуса с учетом весов
 */
function getRandomStatus() {
    const statuses = Object.keys(EQUIPMENT_STATUSES);
    const weights = statuses.map(status => EQUIPMENT_STATUSES[status].weight);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    let random = Math.random() * totalWeight;

    for (let i = 0; i < statuses.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return statuses[i];
        }
    }

    return "Р"; // fallback
}

/**
 * Генерация статуса с учетом времени суток и дня недели
 */
function getContextualStatus(date, nodeId) {
    const dayOfWeek = date.getDay(); // 0 = воскресенье
    const hour = date.getHours();

    // В выходные больше простоев и ремонтов
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        const rand = Math.random();
        if (rand < 0.3) return "ПР"; // 30% ремонт
        if (rand < 0.5) return "П";  // 20% простой
        if (rand < 0.7) return "О";  // 20% остановлен
        return "М"; // 30% модификация
    }

    // Ночная смена (23:00 - 07:00) - больше простоев
    if (hour >= 23 || hour <= 7) {
        const rand = Math.random();
        if (rand < 0.4) return "П";  // 40% простой
        if (rand < 0.6) return "Р";  // 20% работает
        return getRandomStatus();
    }

    // Обычное рабочее время
    return getRandomStatus();
}

/**
 * Основная async функция генерации данных
 */
async function generateTableData(startDate, direction = 'down', batchSize = 30, options = {}) {
    console.log(`[DataProvider] Генерация данных: ${startDate}, направление: ${direction}, размер: ${batchSize}`);

    // Имитация задержки БД
    const delay = options.simulateDbDelay !== false ? 200 : 0;
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
        // Получаем актуальные ID листовых узлов
        const leafNodeIds = getLeafNodeIds();
        console.log(`[DataProvider] Листовые узлы: ${leafNodeIds.join(', ')}`);

        // Парсим начальную дату
        const baseDate = parseDateString(startDate);
        if (isNaN(baseDate.getTime())) {
            throw new Error(`Неверный формат даты: ${startDate}. Ожидается DD.MM.YYYY`);
        }

        const data = [];

        // Определяем диапазон дат в зависимости от направления
        let startDay = 0;
        let endDay = batchSize;

        if (direction === 'up') {
            startDay = -batchSize;
            endDay = 0;
        }

        // Генерируем данные для каждого дня
        for (let i = startDay; i < endDay; i++) {
            const currentDate = new Date(baseDate);
            currentDate.setUTCDate(baseDate.getUTCDate() + i);

            const dateString = formatDate(currentDate);

            // Генерируем колонки для всех листовых узлов
            const columns = leafNodeIds.map(nodeId => {
                const status = options.useContextualStatus
                    ? getContextualStatus(currentDate, nodeId)
                    : getRandomStatus();

                return {
                    headerId: nodeId,
                    value: status,
                    metadata: {
                        statusInfo: EQUIPMENT_STATUSES[status],
                        timestamp: currentDate.toISOString(),
                        nodeId: nodeId
                    }
                };
            });

            data.push({
                date: dateString,
                columns: columns,
                metadata: {
                    dayOfWeek: currentDate.getDay(),
                    isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
                    timestamp: currentDate.toISOString()
                }
            });
        }

        // Для backward направления сортируем по возрастанию дат
        if (direction === 'down') {
            data.sort((a, b) => {
                const dateA = parseDateString(a.date);
                const dateB = parseDateString(b.date);
                return dateA - dateB;
            });
        }

        console.log(`[DataProvider] Сгенерировано ${data.length} записей для ${leafNodeIds.length} узлов`);

        return {
            data: data,
            metadata: {
                startDate: startDate,
                direction: direction,
                batchSize: batchSize,
                actualSize: data.length,
                leafNodesCount: leafNodeIds.length,
                generatedAt: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('[DataProvider] Ошибка генерации данных:', error);
        throw error;
    }
}

/**
 * Специализированная функция для получения данных за период
 */
async function getDataForPeriod(startDate, endDate, options = {}) {
    console.log(`[DataProvider] Получение данных за период: ${startDate} - ${endDate}`);

    const start = parseDateString(startDate);
    const end = parseDateString(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (daysDiff <= 0) {
        throw new Error('Конечная дата должна быть больше начальной');
    }

    if (daysDiff > 365) {
        throw new Error('Период не может превышать 365 дней');
    }

    return await generateTableData(startDate, 'down', daysDiff, options);
}

/**
 * Функция для получения статистики по статусам
 */
async function getStatusStatistics(startDate, direction, batchSize) {
    const result = await generateTableData(startDate, direction, batchSize, { simulateDbDelay: false });

    const statistics = {};
    const totalCells = result.data.length * result.data[0]?.columns.length || 0;

    Object.keys(EQUIPMENT_STATUSES).forEach(status => {
        statistics[status] = {
            count: 0,
            percentage: 0,
            info: EQUIPMENT_STATUSES[status]
        };
    });

    result.data.forEach(dayData => {
        dayData.columns.forEach(column => {
            if (statistics[column.value]) {
                statistics[column.value].count++;
            }
        });
    });

    // Вычисляем проценты
    Object.keys(statistics).forEach(status => {
        statistics[status].percentage = totalCells > 0
            ? Math.round((statistics[status].count / totalCells) * 100 * 100) / 100
            : 0;
    });

    return {
        statistics,
        totalCells,
        period: {
            startDate,
            direction,
            batchSize,
            directionInfo: direction === 'up' ? 'Даты раньше указанной' : 'Даты позже указанной'
        }
    };
}

/**
 * Функция обработки клика по ячейке
 */
async function handleCellClick(cellData, options = {}) {
    console.log(`[DataProvider] Обработка клика: ${cellData.date} - ${cellData.nodeId} - ${cellData.value}`);

    // Имитация обработки на сервере
    await new Promise(resolve => setTimeout(resolve, options.processingDelay || 100));

    const result = {
        success: true,
        processed: true,
        timestamp: new Date().toISOString(),
        cellInfo: {
            date: cellData.date,
            nodeId: cellData.nodeId,
            value: cellData.value,
            statusInfo: EQUIPMENT_STATUSES[cellData.value] || null
        },
        actions: [
            'Данные записаны в журнал',
            'Отправлено уведомление оператору',
            'Обновлена статистика'
        ]
    };

    // Дополнительная логика в зависимости от статуса
    if (cellData.value === 'О' || cellData.value === 'ПР') {
        result.actions.push('Создана заявка на обслуживание');
    }

    console.log(`[DataProvider] Клик обработан успешно:`, result);
    return result;
}

module.exports = {
    generateTableData,
    getDataForPeriod,
    getStatusStatistics,
    handleCellClick,
    EQUIPMENT_STATUSES,
    parseDateString,
    formatDate
};
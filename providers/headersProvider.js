/**
 * Провайдер заголовков для имитации Java Vaadin структуры
 * providers/headersProvider.js
 */

/**
 * Структура заголовков с полной иерархией
 */
const HEADERS_STRUCTURE = {
    headers: [
        {
            id: "factory1",
            parentId: null,
            type: "factory",
            name: "Завод №1 'Металлург'",
            metadata: {
                color: "#343434",
                tooltip: "Основной производственный комплекс",
                workCount: 150,
                location: "Москва",
                status: "active"
            }
        },
        {
            id: "workshop1",
            parentId: "factory1",
            type: "workshop",
            name: "Цех сборки №1",
            metadata: {
                color: "#4caf50",
                tooltip: "Основной сборочный цех",
                workCount: 45,
                area: "Сборочный участок",
                shift: "2-сменный"
            }
        },
        {
            id: "line1",
            parentId: "workshop1",
            type: "line",
            name: "Линия А",
            metadata: {
                color: "#ff9800",
                tooltip: "Автоматизированная линия сборки",
                workCount: 15,
                speed: "120 изделий/час",
                automation: "80%"
            }
        },
        {
            id: "station1",
            parentId: "line1",
            type: "station",
            name: "Станция 1",
            metadata: {
                color: "#f44336",
                tooltip: "Начальная станция сборки",
                workCount: 3,
                operation: "Заготовка деталей",
                cycle: "45 сек"
            }
        },
        {
            id: "station2",
            parentId: "line1",
            type: "station",
            name: "Станция 2",
            metadata: {
                color: "#f44336",
                tooltip: "Промежуточная станция",
                workCount: 4,
                operation: "Механическая обработка",
                cycle: "60 сек"
            }
        },
        {
            id: "station3",
            parentId: "line1",
            type: "station",
            name: "Станция 3",
            metadata: {
                color: "#f44336",
                tooltip: "Финальная станция",
                workCount: 5,
                operation: "Контроль качества",
                cycle: "30 сек"
            }
        },
        {
            id: "line2",
            parentId: "workshop1",
            type: "line",
            name: "Линия Б",
            metadata: {
                color: "#ff9800",
                tooltip: "Полуавтоматическая линия",
                workCount: 12,
                speed: "80 изделий/час",
                automation: "50%"
            }
        },
        {
            id: "station4",
            parentId: "line2",
            type: "station",
            name: "Станция 4",
            metadata: {
                color: "#f44336",
                tooltip: "Контрольная станция",
                workCount: 2,
                operation: "Финальный контроль",
                cycle: "90 сек"
            }
        },
        {
            id: "station5",
            parentId: "line2",
            type: "station",
            name: "Станция 5",
            metadata: {
                color: "#f44336",
                tooltip: "Упаковочная станция",
                workCount: 3,
                operation: "Упаковка изделий",
                cycle: "40 сек"
            }
        },
        {
            id: "workshop2",
            parentId: "factory1",
            type: "workshop",
            name: "Цех механообработки",
            metadata: {
                color: "#4caf50",
                tooltip: "Цех механической обработки деталей",
                workCount: 65,
                area: "Механический участок",
                shift: "3-сменный"
            }
        },
        {
            id: "section1",
            parentId: "workshop2",
            type: "section",
            name: "Участок токарных работ",
            metadata: {
                color: "#9c27b0",
                tooltip: "Участок токарной обработки",
                workCount: 25,
                specialization: "Токарные операции"
            }
        },
        {
            id: "machine1",
            parentId: "section1",
            type: "machine",
            name: "Станок ЧПУ-1",
            metadata: {
                color: "#795548",
                tooltip: "Токарный станок с ЧПУ",
                workCount: 1,
                model: "DMG MORI NTX 1000",
                year: "2020"
            }
        },
        {
            id: "machine2",
            parentId: "section1",
            type: "machine",
            name: "Станок ЧПУ-2",
            metadata: {
                color: "#795548",
                tooltip: "Фрезерный станок с ЧПУ",
                workCount: 1,
                model: "HAAS VF-2SS",
                year: "2021"
            }
        },
        {
            id: "factory2",
            parentId: null,
            type: "factory",
            name: "Завод №2 'Электрон'",
            metadata: {
                color: "#3f51b5",
                tooltip: "Завод электронных компонентов",
                workCount: 120,
                location: "Санкт-Петербург",
                status: "active"
            }
        },
        {
            id: "workshop3",
            parentId: "factory2",
            type: "workshop",
            name: "Цех печатных плат",
            metadata: {
                color: "#00bcd4",
                tooltip: "Производство печатных плат",
                workCount: 35,
                area: "Электронный участок",
                shift: "2-сменный"
            }
        },
        {
            id: "pcb_line1",
            parentId: "workshop3",
            type: "line",
            name: "Линия ПП-1",
            metadata: {
                color: "#e91e63",
                tooltip: "Линия производства печатных плат",
                workCount: 8,
                technology: "SMT",
                complexity: "Простые платы"
            }
        },
        {
            id: "pcb_line2",
            parentId: "workshop3",
            type: "line",
            name: "Линия ПП-2",
            metadata: {
                color: "#e91e63",
                tooltip: "Линия производства сложных плат",
                workCount: 6,
                technology: "THT + SMT",
                complexity: "Сложные платы"
            }
        }
    ]
};

/**
 * Async функция для получения структуры заголовков
 * Имитирует загрузку из базы данных или внешнего API
 */
async function getHeaders() {
    console.log('[HeadersProvider] Загрузка структуры заголовков...');

    // Имитация задержки загрузки из БД
    await new Promise(resolve => setTimeout(resolve, 150));

    // Можно добавить логику фильтрации или динамического формирования
    const enrichedHeaders = {
        ...HEADERS_STRUCTURE,
        metadata: {
            loadTime: new Date().toISOString(),
            version: "1.2.0",
            totalNodes: HEADERS_STRUCTURE.headers.length,
            leafNodes: getLeafNodes().length
        }
    };

    console.log(`[HeadersProvider] Загружено ${HEADERS_STRUCTURE.headers.length} узлов`);
    return enrichedHeaders;
}

/**
 * Получение только листовых узлов (конечных элементов в дереве)
 */
function getLeafNodes() {
    const allIds = new Set(HEADERS_STRUCTURE.headers.map(h => h.id));
    const parentIds = new Set(HEADERS_STRUCTURE.headers.map(h => h.parentId).filter(Boolean));

    return HEADERS_STRUCTURE.headers.filter(header => !parentIds.has(header.id));
}

/**
 * Получение только ID листовых узлов
 */
function getLeafNodeIds() {
    return getLeafNodes().map(node => node.id);
}

/**
 * Получение структуры дерева для конкретного уровня
 */
async function getHeadersByLevel(level = null) {
    const headers = await getHeaders();

    if (level === null) {
        return headers;
    }

    // Фильтрация по типу/уровню
    const levelMap = {
        0: ['factory'],
        1: ['workshop'],
        2: ['line', 'section'],
        3: ['station', 'machine']
    };

    if (levelMap[level]) {
        const filteredHeaders = {
            ...headers,
            headers: headers.headers.filter(h => levelMap[level].includes(h.type))
        };
        return filteredHeaders;
    }

    return headers;
}

/**
 * Получение полной иерархии для конкретного узла
 */
async function getNodeHierarchy(nodeId) {
    const headers = await getHeaders();
    const hierarchy = [];

    let currentNode = headers.headers.find(h => h.id === nodeId);

    while (currentNode) {
        hierarchy.unshift(currentNode);
        currentNode = headers.headers.find(h => h.id === currentNode.parentId);
    }

    return hierarchy;
}

module.exports = {
    getHeaders,
    getLeafNodes,
    getLeafNodeIds,
    getHeadersByLevel,
    getNodeHierarchy,
    HEADERS_STRUCTURE
};
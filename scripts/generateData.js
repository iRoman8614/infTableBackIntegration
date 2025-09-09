const fs = require('fs').promises;
const path = require('path');

/**
 * ГЕНЕРАТОР ДАННЫХ ДЛЯ VAADIN MVC ПРИЛОЖЕНИЯ
 * Создает реалистичные данные для JSON базы
 */

// Утилиты для работы с датами
function formatDate(date) {
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function parseDateString(dateString) {
    const [day, month, year] = dateString.split('.').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

// Генератор реалистичных данных
class DataGenerator {
    constructor() {
        // Вероятности для статусов (реалистичные)
        this.stageWeights = {
            "М": 45,   // Монтаж - наиболее частый
            "О": 25,   // Ожидание
            "П": 15,   // Пуск
            "ПР": 10,  // Проверка
            "Р": 5     // Ремонт - редкий
        };

        this.equipmentNames = {
            stage1: ["20ГПА-1-1", "20ГПА-1-2", "20ГПА-1-3", "20ГПА-1-4"],
            stage2: ["20ГПА-2-1", "20ГПА-2-2", "20ГПА-2-3", "20ГПА-2-4"],
            stage3: ["20ГПА-3-1", "20ГПА-3-2", "20ГПА-3-3", "20ГПА-3-4"]
        };
    }

    // Получение случайного статуса с учетом весов
    getRandomStatus() {
        const total = Object.values(this.stageWeights).reduce((a, b) => a + b, 0);
        const random = Math.random() * total;

        let current = 0;
        for (const [status, weight] of Object.entries(this.stageWeights)) {
            current += weight;
            if (random <= current) {
                return status;
            }
        }

        return "М"; // fallback
    }

    // Генерация данных для одного дня
    generateDayData(dateString) {
        const dayData = {
            date: dateString,
            agr1: Math.floor(Math.random() * 10) + 1,
            agr2: Math.floor(Math.random() * 10) + 1
        };

        // Опциональный третий агрегат (75% вероятность)
        if (Math.random() > 0.25) {
            dayData.agr3 = Math.floor(Math.random() * 10) + 1;
        }

        // Генерация данных для стадий
        for (const stageName of ['stage1', 'stage2', 'stage3']) {
            dayData[stageName] = this.equipmentNames[stageName].map(equipmentName => {
                return { [equipmentName]: this.getRandomStatus() };
            });
        }

        return dayData;
    }

    // Генерация данных за период
    generatePeriodData(startDate, days) {
        const result = {};
        const start = new Date(startDate);

        console.log(`Генерация ${days} дней данных начиная с ${formatDate(start)}...`);

        for (let i = 0; i < days; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + i);
            const dateString = formatDate(currentDate);

            result[dateString] = this.generateDayData(dateString);

            if (i % 30 === 0 && i > 0) {
                console.log(`Обработано ${i} дней...`);
            }
        }

        return result;
    }
}

// Основная функция генерации новой базы
async function generateDatabase() {
    const generator = new DataGenerator();

    console.log('Генерация новой базы данных...');

    // Генерация данных за год (6 месяцев назад + 6 месяцев вперед от сегодня)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 6);

    const totalDays = 365;
    const database = generator.generatePeriodData(startDate, totalDays);

    // Сохранение в файл
    const dataDir = path.join(__dirname, '..', 'data');
    const filePath = path.join(dataDir, 'database.json');

    try {
        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(database, null, 2), 'utf8');

        const dates = Object.keys(database).sort((a, b) => parseDateString(a) - parseDateString(b));

        console.log(`База данных сгенерирована успешно!`);
        console.log(`Файл: ${filePath}`);
        console.log(`Записей: ${Object.keys(database).length}`);
        console.log(`Период: ${dates[0]} - ${dates[dates.length - 1]}`);

    } catch (error) {
        console.error('Ошибка при сохранении:', error.message);
    }
}

// Функция обновления существующей базы
async function updateDatabase() {
    const filePath = path.join(__dirname, '..', 'data', 'database.json');
    const generator = new DataGenerator();

    try {
        console.log('Загрузка существующей базы данных...');
        const existingData = await fs.readFile(filePath, 'utf8');
        const database = JSON.parse(existingData);

        // Определяем последнюю дату
        const dates = Object.keys(database).sort((a, b) => parseDateString(a) - parseDateString(b));
        const lastDateString = dates[dates.length - 1];
        const lastDate = parseDateString(lastDateString);

        console.log(`Последняя дата в базе: ${lastDateString}`);

        // Добавляем данные на следующие 30 дней
        const nextDay = new Date(lastDate);
        nextDay.setDate(lastDate.getDate() + 1);

        const newData = generator.generatePeriodData(nextDay, 30);

        // Объединяем данные
        Object.assign(database, newData);

        // Сохраняем обновленную базу
        await fs.writeFile(filePath, JSON.stringify(database, null, 2), 'utf8');

        const newDates = Object.keys(newData).sort((a, b) => parseDateString(a) - parseDateString(b));

        console.log(`База данных обновлена!`);
        console.log(`Добавлено записей: ${Object.keys(newData).length}`);
        console.log(`Новый период: ${newDates[0]} - ${newDates[newDates.length - 1]}`);
        console.log(`Общий размер базы: ${Object.keys(database).length} записей`);

    } catch (error) {
        console.error('Ошибка при обновлении:', error.message);
        console.log('Попробуйте сначала сгенерировать базу: npm run generate-data generate');
    }
}

// Функция создания тестовых данных для конкретного периода
async function generateTestData() {
    const generator = new DataGenerator();

    console.log('Генерация тестовых данных...');

    // Генерируем данные на текущую неделю
    const today = new Date();
    const testData = generator.generatePeriodData(today, 7);

    const filePath = path.join(__dirname, '..', 'data', 'test-database.json');

    try {
        await fs.writeFile(filePath, JSON.stringify(testData, null, 2), 'utf8');

        console.log(`Тестовые данные созданы!`);
        console.log(`Файл: ${filePath}`);
        console.log(`Записей: ${Object.keys(testData).length}`);
        console.log(`Период: 7 дней от ${formatDate(today)}`);

    } catch (error) {
        console.error('Ошибка создания тестовых данных:', error.message);
    }
}

// Функция анализа существующей базы
async function analyzeDatabase() {
    const filePath = path.join(__dirname, '..', 'data', 'database.json');

    try {
        console.log('Анализ базы данных...');
        const data = await fs.readFile(filePath, 'utf8');
        const database = JSON.parse(data);

        const dates = Object.keys(database).sort((a, b) => parseDateString(a) - parseDateString(b));
        const statusCounts = {};
        let agrCounts = { agr1: 0, agr2: 0, agr3: 0 };

        // Анализ статусов
        Object.values(database).forEach(dayData => {
            ['stage1', 'stage2', 'stage3'].forEach(stage => {
                if (dayData[stage]) {
                    dayData[stage].forEach(item => {
                        const status = Object.values(item)[0];
                        statusCounts[status] = (statusCounts[status] || 0) + 1;
                    });
                }
            });

            // Подсчет агрегатов
            if (dayData.agr1 !== undefined) agrCounts.agr1++;
            if (dayData.agr2 !== undefined) agrCounts.agr2++;
            if (dayData.agr3 !== undefined) agrCounts.agr3++;
        });

        console.log(`\nАНАЛИЗ БАЗЫ ДАННЫХ:`);
        console.log(`======================`);
        console.log(`Общее количество записей: ${dates.length}`);
        console.log(`Первая дата: ${dates[0]}`);
        console.log(`Последняя дата: ${dates[dates.length - 1]}`);
        console.log(`\nСтатистика статусов:`);
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} раз`);
        });
        console.log(`\nСтатистика агрегатов:`);
        console.log(`   agr1: ${agrCounts.agr1} записей`);
        console.log(`   agr2: ${agrCounts.agr2} записей`);
        console.log(`   agr3: ${agrCounts.agr3} записей`);

    } catch (error) {
        console.error('Ошибка анализа:', error.message);
    }
}

// CLI команды
const command = process.argv[2];

switch (command) {
    case 'generate':
        console.log('Генерация новой базы данных...');
        generateDatabase();
        break;

    case 'update':
        console.log('Обновление существующей базы данных...');
        updateDatabase();
        break;

    case 'test':
        console.log('Создание тестовых данных...');
        generateTestData();
        break;

    case 'analyze':
        console.log('Анализ базы данных...');
        analyzeDatabase();
        break;

    default:
        console.log(`
Генератор данных для Vaadin MVC приложения

Использование:
  node scripts/generateData.js <команда>

Команды:
  generate  - создать новую базу данных (365 дней)
  update    - добавить 30 дней к существующей базе
  test      - создать тестовые данные (7 дней)
  analyze   - анализ существующей базы данных

Примеры:
  npm run generate-data generate
  npm run generate-data update
  npm run generate-data test
  npm run generate-data analyze

Структура данных:
  {
    "ДД.ММ.ГГГГ": {
      "date": "ДД.ММ.ГГГГ",
      "agr1": 1-10,
      "agr2": 1-10,
      "agr3": 1-10 (опционально),
      "stage1": [{"20ГПА-1-1": "М"}, ...],
      "stage2": [{"20ГПА-2-1": "О"}, ...],
      "stage3": [{"20ГПА-3-1": "П"}, ...]
    }
  }

Возможные статусы:
  М  - Монтаж (45%)
  О  - Ожидание (25%)
  П  - Пуск (15%)
  ПР - Проверка (10%)
  Р  - Ремонт (5%)
        `);
        break;
}

// Экспорт функций для использования в других модулях
module.exports = {
    DataGenerator,
    generateDatabase,
    updateDatabase,
    generateTestData,
    analyzeDatabase
};
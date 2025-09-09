# ПОЛНАЯ ИНСТРУКЦИЯ ПО ЗАПУСКУ VAADIN MVC ПРИЛОЖЕНИЯ

## Что вы получите

Полноценное Vaadin MVC приложение на Node.js с:
- Серверным рендерингом HTML
- Инжекцией DataProvider в JavaScript
- Поиском по JSON базе данных
- Автоматической подгрузкой данных через server method calls

## 1. СОЗДАНИЕ ПРОЕКТА С НУЛЯ

### Шаг 1: Создание папки проекта
```bash
mkdir vaadin-mvc-table-app
cd vaadin-mvc-table-app
```

### Шаг 2: Создание всех файлов

Создайте следующие файлы точно с таким содержимым:

#### A) package.json
```json
{
  "name": "vaadin-mvc-table-app",
  "version": "1.0.0",
  "description": "Complete Vaadin MVC pattern implementation with DataProvider injection and JSON database search",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "mvc:dev": "nodemon server.js --watch data --watch frontend",
    "generate-data": "node scripts/generateData.js",
    "setup": "node scripts/setup.js",
    "test": "node scripts/test.js"
  },
  "keywords": [
    "vaadin",
    "mvc",
    "dataprovider",
    "server-side-rendering",
    "json-database",
    "virtualized-table"
  ],
  "author": "Vaadin MVC Developer",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

#### B) Создание структуры папок
```bash
mkdir -p data
mkdir -p frontend/dist
mkdir -p scripts
```

#### C) data/database.json
Скопируйте полный JSON файл из артефакта "complete_database_json" (20 записей с датами от 01.09.2025 до 20.09.2025)

#### D) server.js
Скопируйте полный код сервера из артефакта "complete_server" (полный Vaadin MVC implementation)

#### E) scripts/generateData.js
Скопируйте полный генератор данных из артефакта "data_generator_complete"

#### F) scripts/setup.js
Скопируйте скрипт установки из артефакта "setup_script"

### Шаг 3: Установка зависимостей
```bash
npm install
```

### Шаг 4: Автоматическая настройка
```bash
npm run setup
```

### Шаг 5: Размещение вашего веб-компонента
```bash
# Поместите ваш файл virtualized-table.js в:
cp virtualized-table.js frontend/dist/
```

## 2. ЗАПУСК ПРИЛОЖЕНИЯ

### Запуск сервера
```bash
npm start
```

Вы увидите логи:
```
🚀 [Application] Запуск Vaadin MVC приложения...
📊 [Repository] Загружено 20 сущностей из JSON базы
✅ [ViewController] MVC Controller инициализирован
✅ [Application] Vaadin MVC приложение запущено!
🌐 [Application] URL: http://localhost:8080
💚 [Application] Health: http://localhost:8080/health
🔍 [Application] Debug: http://localhost:8080/debug/data
📋 [Application] Готов к работе!
```

### Открытие приложения
Перейдите в браузер: **http://localhost:8080**

## 3. КАК ЭТО РАБОТАЕТ (VAADIN MVC PATTERN)

### Архитектура

```
Browser                           Node.js Server
┌─────────────────────────────────┐ ┌───────────────────────────────────┐
│ HTML Page (Server Generated)   │ │ TableViewController (MVC)         │
│                                 │ │                                   │
│ window.dp = function() {        │◄┤ renderView() {                    │
│   // Server injected code      │ │   // Server-side HTML generation │
│   fetch('/server-method/...')  │ │   // DataProvider injection      │
│ }                               │ │ }                                 │
│                                 │ │                                   │
│ setDataProvider(window.dp);     │ │ TableDataService                  │
│                                 │ │ ├── fetchData(startDate, days)   │
│ <virtualized-table>             │ │ └── Searches JSON database       │
└─────────────────────────────────┘ └───────────────────────────────────┘
```

### Что происходит при запросе страницы:

1. **Server-Side Rendering**: Сервер генерирует HTML с инжекцией DataProvider
2. **DataProvider Injection**: JavaScript функция создается на сервере и вставляется в страницу
3. **Component Loading**: Загружается ваш веб-компонент
4. **setDataProvider Call**: Автоматически устанавливается DataProvider
5. **Data Requests**: Компонент запрашивает данные через server method calls

### Пример DataProvider запроса:

```javascript
// На клиенте вызывается:
window.dp("09.09.2025", 7)

// Это отправляет POST запрос:
POST /server-method/fetchData
{
  "method": "fetchData", 
  "args": ["09.09.2025", 7]
}

// Сервер ищет в JSON базе и возвращает:
{
  "data": [
    {
      "date": "09.09.2025",
      "agr1": 1,
      "agr2": 1,
      "agr3": 1,
      "stage1": [{"20ГПА-1-1": "М"}, ...],
      "stage2": [...],
      "stage3": [...]
    },
    // ... еще 6 записей
  ]
}
```

## 4. ТЕСТИРОВАНИЕ

### Health Check
```bash
curl http://localhost:8080/health
```

### Тест DataProvider
```bash
curl -X POST http://localhost:8080/server-method/fetchData \
  -H "Content-Type: application/json" \
  -d '{"method":"fetchData","args":["09.09.2025",7]}'
```

### Автоматическое тестирование
```bash
npm test
```

### Debug информация
```bash
curl http://localhost:8080/debug/data
curl http://localhost:8080/debug/data/09.09.2025
```

## 5. РАСШИРЕНИЕ БАЗЫ ДАННЫХ

### Генерация большой базы (365 дней)
```bash
npm run generate-data generate
```

### Добавление данных (30 дней)
```bash
npm run generate-data update
```

### Анализ базы
```bash
npm run generate-data analyze
```

## 6. СТРУКТУРА JSON БАЗЫ ДАННЫХ

Каждая запись в `data/database.json`:

```json
{
  "09.09.2025": {
    "date": "09.09.2025",
    "agr1": 1,
    "agr2": 1,
    "agr3": 1,
    "stage1": [
      {"20ГПА-1-1": "М"},
      {"20ГПА-1-2": "О"},
      {"20ГПА-1-3": "П"},
      {"20ГПА-1-4": "М"}
    ],
    "stage2": [
      {"20ГПА-2-1": "М"},
      {"20ГПА-2-2": "О"},
      {"20ГПА-2-3": "П"},
      {"20ГПА-2-4": "М"}
    ],
    "stage3": [
      {"20ГПА-3-1": "Р"},
      {"20ГПА-3-2": "М"},
      {"20ГПА-3-3": "О"},
      {"20ГПА-3-4": "П"}
    ]
  }
}
```

### Возможные статусы:
- **М** - Монтаж (зеленый)
- **О** - Ожидание (желтый)
- **П** - Пуск (зеленый)
- **ПР** - Проверка (синий)
- **Р** - Ремонт (белый)

## 7. ENDPOINTS

| URL | Метод | Описание |
|-----|-------|----------|
| `/` | GET | Главная страница с таблицей |
| `/server-method/fetchData` | POST | DataProvider endpoint |
| `/health` | GET | Health check |
| `/debug/data` | GET | Debug информация |
| `/debug/data/09.09.2025` | GET | Данные по конкретной дате |

## 8. ЛОГИ И ОТЛАДКА

При работе вы увидите логи:
```
🔍 [Repository] Поиск в JSON базе: 09.09.2025 - 15.09.2025
📊 [Repository] Найдено 7 записей в JSON базе
🎯 [Service] fetchData вызван: startDate=09.09.2025, days=7
📝 [Service] Создание заглушки для даты: 16.09.2025
✅ [Service] Возвращено 7 записей (6 из базы, 1 заглушек)
🔍 [Server Method] fetchData вызван: startDate=09.09.2025, days=7
✅ [Server Method] Возвращено 7 записей
```

## 9. TROUBLESHOOTING

### Проблема: Компонент не загружается
```bash
# Проверьте наличие файла:
ls frontend/dist/virtualized-table.js

# Если отсутствует:
cp virtualized-table.js frontend/dist/
```

### Проблема: Сервер не отвечает
```bash
# Проверьте порт:
netstat -tulpn | grep 8080

# Запустите на другом порту:
PORT=3000 npm start
```

### Проблема: DataProvider не работает
```bash
# Проверьте health:
curl http://localhost:8080/health

# Проверьте JSON базу:
npm run generate-data analyze
```

### Проблема: Нет данных в таблице
```bash
# Тест DataProvider:
curl -X POST http://localhost:8080/server-method/fetchData \
  -H "Content-Type: application/json" \
  -d '{"method":"fetchData","args":["09.09.2025",7]}'
```

## 10. РАЗВЕРТЫВАНИЕ

### Development mode
```bash
npm run mvc:dev  # Автоперезагрузка при изменениях
```

### Production mode
```bash
npm start
```

## ГОТОВО!

Теперь у вас есть полноценное Vaadin MVC приложение с:
- ✅ Серверным рендерингом
- ✅ Инжекцией DataProvider
- ✅ Поиском по JSON базе данных
- ✅ Автоматической подгрузкой данных
- ✅ Health check и debug endpoints
- ✅ Генератором тестовых данных

Откройте **http://localhost:8080** и наслаждайтесь работой!
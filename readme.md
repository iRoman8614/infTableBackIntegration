# БЫСТРЫЙ СТАРТ - ЧЕКЛИСТ

## Что нужно сделать за 5 минут

### 1. Создание проекта
```bash
mkdir vaadin-mvc-table-app
cd vaadin-mvc-table-app
```

### 2. Копирование файлов
- [ ] `package.json` (из артефакта complete_package_json)
- [ ] `server.js` (из артефакта complete_server)
- [ ] `data/database.json` (из артефакта complete_database_json)
- [ ] `scripts/generateData.js` (из артефакта data_generator_complete)
- [ ] `scripts/setup.js` (из артефакта setup_script)

### 3. Установка
```bash
npm install
npm run setup
```

### 4. Ваш компонент
```bash
cp virtualized-table.js frontend/dist/
```

### 5. Запуск
```bash
npm start
```

### 6. Проверка
- [ ] Открыть http://localhost:8080
- [ ] Увидеть загрузку таблицы
- [ ] Проверить логи в консоли браузера

## Что должно работать

1. **Сервер запущен** - логи показывают "Готов к работе!"
2. **Страница загружается** - видите заголовок "Vaadin MVC Table Application"
3. **DataProvider инжектирован** - в консоли браузера "DataProvider успешно инжектирован"
4. **Компонент загружен** - таблица появляется на странице
5. **Данные загружаются** - видите записи в таблице

## Если что-то не работает

### Компонент не найден
```bash
ls frontend/dist/virtualized-table.js
# Если нет файла:
cp virtualized-table.js frontend/dist/
```

### Порт занят
```bash
PORT=3000 npm start
```

### DataProvider не работает
```bash
curl http://localhost:8080/health
```

### Нет данных
```bash
npm run generate-data analyze
```

## Тестирование DataProvider

```bash
# Проверка здоровья
curl http://localhost:8080/health

# Тест DataProvider
curl -X POST http://localhost:8080/server-method/fetchData \
  -H "Content-Type: application/json" \
  -d '{"method":"fetchData","args":["09.09.2025",7]}'
```

## Расширение базы данных

```bash
  npm run generate-data generate  # Создать базу на 365 дней
  npm run generate-data update    # Добавить 30 дней к существующей
  npm run generate-data test      # Создать тестовые данные на 7 дней  
  npm run generate-data analyze   # Анализ статистики базы
```

## Готово!

Если все пункты чеклиста выполнены - у вас работает полный Vaadin MVC pattern с DataProvider инжекцией и поиском по JSON базе данных.

Адрес: **http://localhost:8080**
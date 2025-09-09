const fs = require('fs').promises;
const path = require('path');

/**
 * СКРИПТ АВТОМАТИЧЕСКОЙ УСТАНОВКИ VAADIN MVC ПРОЕКТА
 */

console.log('🚀 Автоматическая установка Vaadin MVC проекта...\n');

async function createDirectoryStructure() {
    const dirs = [
        'data',
        'frontend',
        'frontend/dist',
        'scripts'
    ];

    console.log('📁 Создание структуры папок...');

    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
            console.log(`   ✅ ${dir}/`);
        } catch (error) {
            console.log(`   ⚠️  ${dir}/ (уже существует)`);
        }
    }
}

async function checkFiles() {
    const requiredFiles = [
        { file: 'server.js', description: 'Основной сервер' },
        { file: 'package.json', description: 'Зависимости проекта' },
        { file: 'data/database.json', description: 'JSON база данных' }
    ];

    console.log('\n📋 Проверка обязательных файлов...');

    for (const { file, description } of requiredFiles) {
        try {
            await fs.access(file);
            console.log(`   ✅ ${file} - ${description}`);
        } catch (error) {
            console.log(`   ❌ ${file} - ОТСУТСТВУЕТ! ${description}`);
        }
    }
}

async function checkWebComponent() {
    console.log('\n🎯 Проверка веб-компонента...');

    try {
        await fs.access('frontend/dist/virtualized-table.js');
        console.log('   ✅ frontend/dist/virtualized-table.js найден');
    } catch (error) {
        console.log('   ❌ frontend/dist/virtualized-table.js НЕ НАЙДЕН!');
        console.log('   📝 НЕОБХОДИМО: Поместите ваш веб-компонент в frontend/dist/');
        console.log('      cp virtualized-table.js frontend/dist/');
    }
}

async function generateTestFile() {
    console.log('\n🧪 Создание тестового файла...');

    const testScript = `const http = require('http');

console.log('🧪 Тестирование Vaadin MVC приложения...');

// Тест 1: Проверка сервера
function testServer() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8080/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('✅ Сервер работает');
                console.log('📊 Health check:', JSON.parse(data));
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Сервер не отвечает:', error.message);
            reject(error);
        });
        
        req.setTimeout(5000, () => {
            console.log('❌ Таймаут соединения с сервером');
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Тест 2: Проверка DataProvider
function testDataProvider() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            method: 'fetchData',
            args: ['09.09.2025', 7]
        });
        
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/server-method/fetchData',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const result = JSON.parse(data);
                console.log('✅ DataProvider работает');
                console.log(\`📊 Получено записей: \${result.data.length}\`);
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ DataProvider не работает:', error.message);
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

async function runTests() {
    try {
        await testServer();
        await testDataProvider();
        console.log('\\n🎉 Все тесты прошли успешно!');
        console.log('🌐 Откройте: http://localhost:8080');
    } catch (error) {
        console.log('\\n❌ Тесты не прошли. Убедитесь что сервер запущен (npm start)');
    }
}

runTests();
`;

    try {
        await fs.writeFile('scripts/test.js', testScript);
        console.log('   ✅ scripts/test.js создан');
    } catch (error) {
        console.log('   ❌ Ошибка создания test.js:', error.message);
    }
}

async function showInstructions() {
    console.log('\n📋 ИНСТРУКЦИИ ПО ЗАПУСКУ:');
    console.log('========================');
    console.log('');
    console.log('1. Установите зависимости:');
    console.log('   npm install');
    console.log('');
    console.log('2. Поместите ваш веб-компонент:');
    console.log('   cp virtualized-table.js frontend/dist/');
    console.log('');
    console.log('3. Запустите сервер:');
    console.log('   npm start');
    console.log('');
    console.log('4. Откройте браузер:');
    console.log('   http://localhost:8080');
    console.log('');
    console.log('5. Для тестирования:');
    console.log('   npm test');
    console.log('');
    console.log('📁 СТРУКТУРА ПРОЕКТА:');
    console.log('====================');
    console.log('vaadin-mvc-app/');
    console.log('├── server.js                 # MVC сервер');
    console.log('├── package.json             # Зависимости');
    console.log('├── data/');
    console.log('│   └── database.json        # JSON база');
    console.log('├── frontend/');
    console.log('│   └── dist/');
    console.log('│       └── virtualized-table.js  # Ваш компонент');
    console.log('└── scripts/');
    console.log('    ├── setup.js            # Этот скрипт');
    console.log('    └── test.js             # Тестирование');
    console.log('');
    console.log('🔗 ENDPOINTS:');
    console.log('=============');
    console.log('• http://localhost:8080/           # Главная страница');
    console.log('• http://localhost:8080/health     # Health check');
    console.log('• http://localhost:8080/debug/data # Debug информация');
    console.log('');
}

async function main() {
    try {
        await createDirectoryStructure();
        await checkFiles();
        await checkWebComponent();
        await generateTestFile();
        await showInstructions();

        console.log('✅ Установка завершена!');
        console.log('🚀 Готов к запуску: npm start');

    } catch (error) {
        console.error('❌ Ошибка установки:', error);
        process.exit(1);
    }
}

main();
# ИНСТРУКЦИЯ ДЛЯ JAVA/VAADIN РАЗРАБОТЧИКА

## Как портировать Node.js решение на настоящий Vaadin

### КЛЮЧЕВЫЕ ФАЙЛЫ ДЛЯ ИЗУЧЕНИЯ

#### 1. server.js - строки 285-320 (ServerDataProvider класс)
**Что смотреть:**
```javascript
class ServerDataProvider {
    generateClientDataProvider() {
        return `async (startDate, days) => {
            const response = await fetch('/server-method/fetchData', {
                method: 'POST',
                body: JSON.stringify({method: 'fetchData', args: [startDate, days]})
            });
            return await response.json();
        }`;
    }
}
```

**Java эквивалент:**
```java
@Route("")
public class TableView extends VerticalLayout {
    
    public TableView() {
        // ГЛАВНОЕ: инжекция DataProvider в веб-компонент
        getElement().executeJs(
            "window.dp = async (startDate, days) => {" +
            "  return await this.$server.fetchData(startDate, days);" +
            "}"
        );
        
        // Установка DataProvider в компонент
        getElement().setProperty("dataProvider", "window.dp");
    }
}
```

#### 2. server.js - строки 402-440 (renderView метод)
**Что смотреть - инжекция DataProvider в HTML:**
```javascript
// СГЕНЕРИРОВАННЫЙ НА СЕРВЕРЕ КОД DATAPROVIDER
window.dp = ${dataProviderCode};

// Автоматический вызов setDataProvider
setDataProvider(window.dp);
```

**Java эквивалент:**
```java
// В конструкторе View или @PostConstruct методе
getElement().executeJs("window.dp = " + generateDataProviderCode());

// Если нужно вызвать setDataProvider после загрузки компонента
getElement().executeJs(
    "if (window.setDataProvider) {" +
    "  window.setDataProvider(window.dp);" +
    "} else {" +
    "  setTimeout(() => window.setDataProvider(window.dp), 100);" +
    "}"
);
```

#### 3. server.js - строки 158-200 (TableDataService.fetchData)
**Что смотреть - серверный метод для DataProvider:**
```javascript
fetchData(startDate, days) {
    console.log(`[Service] fetchData вызван: startDate=${startDate}, days=${days}`);
    
    const endDate = DateUtils.addDays(startDate, days - 1);
    const entities = this.repository.findByDateRange(startDate, endDate);
    
    // Заполнение пропусков заглушками
    const result = [];
    for (let i = 0; i < days; i++) {
        const currentDate = DateUtils.addDays(startDate, i);
        const existingEntity = entities.find(e => e.date === currentDate);
        
        if (existingEntity) {
            result.push(existingEntity);
        } else {
            // Создание заглушки для отсутствующих дат
            result.push(createDefaultEntity(currentDate));
        }
    }
    
    return result.map(entity => entity.toJSON());
}
```

**Java эквивалент:**
```java
@ClientCallable
public JsonArray fetchData(String startDate, int days) {
    log.info("fetchData вызван: startDate={}, days={}", startDate, days);
    
    LocalDate start = parseDate(startDate);
    LocalDate end = start.plusDays(days - 1);
    
    List<TableDataEntity> entities = repository.findByDateBetween(start, end);
    
    List<TableDataDto> result = new ArrayList<>();
    for (int i = 0; i < days; i++) {
        LocalDate currentDate = start.plusDays(i);
        
        Optional<TableDataEntity> existing = entities.stream()
            .filter(e -> e.getDate().equals(currentDate))
            .findFirst();
            
        if (existing.isPresent()) {
            result.add(entityToDto(existing.get()));
        } else {
            result.add(createDefaultDto(currentDate));
        }
    }
    
    return JsonUtils.toJsonArray(result);
}
```

### ОСНОВНЫЕ КОМПОНЕНТЫ ДЛЯ РЕАЛИЗАЦИИ

#### 1. Entity класс
**Node.js (server.js строки 56-85):**
```javascript
class TableDataEntity {
    constructor(date, agr1, agr2, agr3, stage1, stage2, stage3) {
        this.date = date;
        this.agr1 = agr1;
        // ...
    }
    
    toJSON() {
        return {
            date: this.date,
            agr1: this.agr1 || 0,
            agr2: this.agr2 || 0,
            stage1: this.stage1,
            stage2: this.stage2,
            stage3: this.stage3
        };
    }
}
```

**Java эквивалент:**
```java
@Entity
@Table(name = "table_data")
public class TableDataEntity {
    @Id
    private LocalDate date;
    
    @Column(name = "agr1")
    private Integer agr1;
    
    @Column(name = "agr2") 
    private Integer agr2;
    
    @Column(name = "agr3")
    private Integer agr3;
    
    @Type(JsonBinaryType.class)
    @Column(name = "stage1", columnDefinition = "jsonb")
    private List<Map<String, String>> stage1;
    
    @Type(JsonBinaryType.class)
    @Column(name = "stage2", columnDefinition = "jsonb")
    private List<Map<String, String>> stage2;
    
    @Type(JsonBinaryType.class)
    @Column(name = "stage3", columnDefinition = "jsonb")
    private List<Map<String, String>> stage3;
    
    // getters/setters
}
```

#### 2. Repository
**Node.js (server.js строки 118-138):**
```javascript
findByDateRange(startDate, endDate) {
    const result = [];
    const start = DateUtils.parseDateString(startDate);
    const end = DateUtils.parseDateString(endDate);
    
    for (const [dateKey, entity] of this.data.entries()) {
        const entityDate = DateUtils.parseDateString(dateKey);
        if (entityDate >= start && entityDate <= end) {
            result.push(entity);
        }
    }
    
    return result.sort((a, b) => 
        DateUtils.parseDateString(a.date) - DateUtils.parseDateString(b.date)
    );
}
```

**Java эквивалент:**
```java
@Repository
public interface TableDataRepository extends JpaRepository<TableDataEntity, LocalDate> {
    
    @Query("SELECT t FROM TableDataEntity t WHERE t.date BETWEEN :startDate AND :endDate ORDER BY t.date")
    List<TableDataEntity> findByDateBetween(
        @Param("startDate") LocalDate startDate, 
        @Param("endDate") LocalDate endDate
    );
    
    Optional<TableDataEntity> findByDate(LocalDate date);
}
```

#### 3. Service слой
**Node.js (server.js строки 151-210):**
```javascript
class TableDataService {
    constructor() {
        this.repository = new TableDataRepository();
    }

    fetchData(startDate, days) {
        const endDate = DateUtils.addDays(startDate, days - 1);
        const entities = this.repository.findByDateRange(startDate, endDate);
        // ... логика заполнения пропусков
        return result.map(entity => entity.toJSON());
    }
}
```

**Java эквивалент:**
```java
@Service
public class TableDataService {
    
    @Autowired
    private TableDataRepository repository;
    
    public List<TableDataDto> fetchData(String startDate, int days) {
        LocalDate start = LocalDate.parse(startDate, DATE_FORMATTER);
        LocalDate end = start.plusDays(days - 1);
        
        List<TableDataEntity> entities = repository.findByDateBetween(start, end);
        
        List<TableDataDto> result = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate currentDate = start.plusDays(i);
            
            Optional<TableDataEntity> existing = entities.stream()
                .filter(e -> e.getDate().equals(currentDate))
                .findFirst();
                
            if (existing.isPresent()) {
                result.add(convertToDto(existing.get()));
            } else {
                result.add(createDefaultDto(currentDate));
            }
        }
        
        return result;
    }
}
```

### КЛЮЧЕВЫЕ МОМЕНТЫ ДЛЯ JAVA РАЗРАБОТЧИКА

#### 1. DataProvider инжекция (САМОЕ ВАЖНОЕ)
```java
// В View классе:
getElement().executeJs(
    "window.dp = async (startDate, days) => {" +
    "  console.log('DataProvider вызван:', startDate, days);" +
    "  return await this.$server.fetchData(startDate, days);" +
    "}"
);
```

#### 2. Server Method для DataProvider
```java
@ClientCallable
public JsonArray fetchData(String startDate, int days) {
    // Ваша бизнес-логика здесь
    List<TableDataDto> data = tableDataService.fetchData(startDate, days);
    return JsonUtils.toJsonArray(data);
}
```

#### 3. Установка DataProvider в компонент
```java
// После инжекции функции, установить её в компонент:
getElement().executeJs("window.setDataProvider(window.dp);");

// Или через property:
getElement().setProperty("dataProvider", "window.dp");
```

#### 4. Структура данных DTO
```java
public class TableDataDto {
    private String date;
    private Integer agr1;
    private Integer agr2;
    private Integer agr3;
    private List<Map<String, String>> stage1;
    private List<Map<String, String>> stage2;
    private List<Map<String, String>> stage3;
    
    // getters/setters
}
```

### ENDPOINTS ДЛЯ ТЕСТИРОВАНИЯ

1. **Главная страница:** `@Route("")`
2. **Health check:** `@GetMapping("/health")`
3. **Debug данных:** `@GetMapping("/debug/data/{date}")`

### ТЕСТИРОВАНИЕ JAVA ВЕРСИИ

```java
@Test
public void testDataProvider() {
    TableView view = new TableView();
    
    // Тест server method
    JsonArray result = view.fetchData("09.09.2025", 7);
    assertEquals(7, result.size());
    
    // Тест инжекции DataProvider
    Element element = view.getElement();
    // Проверка что executeJs был вызван с правильным кодом
}
```

### МИГРАЦИОННЫЙ ЧЕКЛИСТ

- [ ] Создать Entity с правильными аннотациями
- [ ] Создать Repository с методом findByDateBetween
- [ ] Создать Service с методом fetchData
- [ ] Создать View с @Route аннотацией
- [ ] Добавить метод с @ClientCallable для DataProvider
- [ ] Инжектировать DataProvider через executeJs
- [ ] Установить DataProvider в компонент
- [ ] Протестировать загрузку данных
- [ ] Добавить обработку ошибок

Основная логика уже реализована в Node.js версии - нужно только портировать на Java/Spring/Vaadin стек.
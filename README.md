# Vict

### Если меняешь файл /etc/nginx/nginx.conf

Нужно после этого перезагрузить nginx:

`nginx -s reload`


### Если хочется, чтобы тестовый сайт лежал на домене:

`git clone https://github.com/SilverFoxxxy/quiz-frontend /var/www/quiz`


### Если хочешь добавить картинки:

1. Можешь разместить их в каком-то месте, откуда их легко можно загружать просто
Тогда прост закидываешь туда, а Паша скачает запросами оттуда по названию.

2. Или можешь просто на сервере хранить картинки:
Создаёшь git-епозиторий с нужными картинками у себя на компе
Загружаешь это всё на гитхаб
Клонируешь (загружаешь на сервер) в папку `/var/www/quiz/`

Например, если репозиторий называется `quiz-img`, то добавь в `/etc/nginx/nginx.conf` в блок server{}:

```
location /quiz/img/ {
        alias /var/www/quiz/quiz-img/;
}
```
(поменяй `quiz-img` на название своего репозитория с картинками)
Теперь `GET` запрос по адресу "your-domain.com/quiz/img/img.jpg" вернёт картинку из репозитория

3. Или можешь любым другим способом загружать картинки

Дальше вся изначальная настройка сервера:

### Подключаемся по ssh к серверу

// опционально - настраиваем подключение по ssh без пароля
// здесь и далее на все вопросы гугл в помощь

### Устанавливаем npm и nodejs
apt-get install npm

### Устанавливаем postgresql

apt-get install postgresql

### перелогиниваемся в пользователя postgres
su - postgres

### запускаем консоль postgres
psql

### создаём в postgres пользователя и базу данных
```sql
create user quiz_user with encrypted password 'quiz';

create database quiz_db;

grant all privileges on database quiz_db to quiz_user;
```

Подключаемся к базе данных через DataGrip и запускаем волшебный файл `init.sql`
Или делаем это без DataGrip через терминал


### Возвращаемся к нормальному пользователю
exit
exit
### Устанавливаем pg для работы с postgresql
npm install pg

### Устанавливаем pm2
npm install pm2@latest -g

### Устанавливаем nginx
apt install nginx



### создаём файл ~/quiz/quiz.js
### запускать его мы будем либо так для тестов:

node quiz.js

### либо так, когда хотим, чтобы сервер непрерывно работал:
pm2 start quiz.js

### или так, если хотим чтобы сервер стартовал при запуске/перезагрузке сервера

```
#/etc/system/system/quiz.service
[Unit]
Description=Quiz
Documentation=nodoc
After=network-online.target
Requires=network-online.target

[Service]
User=root
Group=root
ExecStart=/usr/bin/node /root/quiz/quiz.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=yes
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
```

### Добавляем сервис в автозагрузку

```
systemctl daemon-reload
systemctl enable quiz.service
systemctl start quiz.service
systemctl status quiz.service
```

### Меняем файл nginx.conf
Чистим файл /etc/nginx/sites-available/default

vim /etc/nginx/nginx.conf

Вставляем туда следующее (внутрь блока http):

```
server {
        server_name   localhost;
        listen        0.0.0.0:80;
        #listen        0.0.0.0:443 ssl;
        #ssl_certificate     /etc/letsencrypt/live/quiz-game.cf/fullchain.pem;
        #ssl_certificate_key /etc/letsencrypt/live/quiz-game.cf/privkey.pem;
        #error_page    500 502 503 504  /50x.html;


        location /query2/ {
                proxy_pass http://127.0.0.1:8082/;
        }

        location /quiz/img/ {
                alias /var/www/quiz/quiz-img/;
        }

        location /quiz/ {
                index test_page.html;
                alias /var/www/quiz/quiz-frontend/;
        }

        location /.well-known/acme-challenge/ {
                root /var/www/quiz/;
        }
}
```

### Заходим на freenom и берём себе халявный домен на год. Нужно брать на dns
quiz-game.cf
Проверяем, что домен подгрузился на DNS сервера (запускаем простенький сервер на node.js и заходим в браузере на quiz-game.cf)
`http://quiz-game.cf/query2/`

### Теперь настраиваем ssl (для https) с помощью certbot
```
apt install snapd
snap install --classic certbot
```

/snap/bin/certbot certonly --webroot -w /var/www/quiz/ -d quiz-game.cf

### certbot пишет:
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/quiz-game.cf/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/quiz-game.cf/privkey.pem

### Раскомменчиваем вот эти строки в /etc/nginx/nginx.conf:
listen        0.0.0.0:443 ssl;
ssl_certificate     /etc/letsencrypt/live/quiz-game.cf/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/quiz-game.cf/privkey.pem;

## API

export DOMAIN=https://quiz-game.cf/query2/

### База данных:
```
Пользователь:
# id пользователя
# Имя пользователя

Раунд:
# id раунда
# название раунда - должно быть!! причём уникальным
# название раздела, к которому принадлежит раунд
# дата создания для сортировки

Вопрос:
# id вопроса
# id раунда, из которого этот вопрос
# текст вопроса + текст вариантов ответа тут же
# количество вариантов ответа
# номер правильного ответа
# ограничение времени на раздумья
# путь к картинке

Баллы:
# id строчки с баллами
# id пользователя
# id вопроса
# id раунда
# количество баллов за этот вопрос у пользователя

Рейтинг: (виртуальная таблица)
# id поьзователя
# сумма всех его баллов за все вопросы

Рейтинг за раунды: (виртуальная таблица)
# id пользователя
# id раунда
# сумма всех его баллов за все вопросы в этом раунде

! возможно, нужна таблица с попытками
чтобы типа "пользователь уже играл этот раунд"
(по очкам не так удобно)л
```

### Все доступные виды запросов:

```bash
// Проверить, что node работает
type = "test_node"

// Список всех раундов
type = "get_round_list"

// Список всех вопросов раунда
type = "get_question_list"

// Добавить раунд
type = "add_round"

// Удалить раунд
type = "del_round"

// Добавить пользователя
type = "add_user"

// Удалить пользователя
type = "del_user"

// Показать всех пользователей
type = "get_users"

// Залогиниться
type = "login"

// Показать таблицу рейтинга
type = "get_rating_table"

// Показать баллы пользователя за вопросы раунда
type = "get_round_user_score"

// Поставить баллы пользователя за некоторые вопросы (только один раз)
type = "set_score"

// Поставить балл пользователя за вопрос
type = "set_one_score"
```

### Формат запроса:

```js
// общий вид запроса:
request = {
	type: "type_of_query",
	user_nm: "имя пользователя",
	... // что либо ещё
}

// общий вид ответа:
response = {
	status: "ok",
	... // какая-то инфа в ответе
}

или

response = {
	response: "failed",
	error: "type_of_error", // какая ошибка возникла
	... // мб дополнительная инфа
}
```

### Регистрация
```js
request = {
	type: "add_user",
	user_nm: "username",
	pswd: "password_hash" // Используй SHA256("my_salt_for_quiz" + pswd)
}

response = {
	status: "failed",
	error: "name_exists" // Имя занято
}
```

### Логин

```js
request = {
	type: "login",
	user_nm: "username",
	pswd: "password_hash" // Используй SHA256("my_salt_for_quiz" + pswd)
}

response = {
	status: "ok", // значит Имя/ Пароль корректные - сохраняем
	user_id: id  // Сохраняем для запросов
}

{
	status: "failed",
  error: "wrong_pswd"
}

{
  status: "failed",
  error: "no_user"
}
```

### Запросить список раундов

```js
//// если хотим постепенно их открывать - нужно менять
//// мне кжтся лучше чтобы все были сразу открыты

request = {
	type: "get_round_list",
	user_nm: "username" // если хотим получить баллы пользователя за раунд
}

response = {
	status: "ok",
	round_list: [ // массив, каждый элемент 
		round1_json, // это информация про какой-то раунд
		round2_json, // смотри round_json ниже
		...
	]
}

// могу возвращать в принципе сразу массивами по темам
// но разбросать по темам можно и на фронт-енде

round_json = {
	round_id: id, // используется в запросах потом
	round_nm: "название раунда",
	round_theme: "название раздела",
	round_score: баллы_пользователя, // если user_nm было в запросе
	create_date: дата_создания // это мб не буду отправлять
														 // - порядок сохранится и так
	round_score: баллы_за_раунд
}
```

### Запросить вопросы из раунда

```js
request = {
	type: "get_question_list",
	round_id: id
}

response = {
	status: "ok",
	question_list: [ // массив, каждый элемент - 
		question1_json, // информация про один вопрос
		question2_json, // смотри question_json ниже
		...
	]
}

question_json = { // формат информации про вопрос
	question_id: id, // пока считаем, что все вопросы стоят 1 балл
  question_text: "текст вопроса?", // если нет - пиши, поменяем
	answer_cnt: количество_вариантов_ответа,
  correct_num: номер_правильного_ответа,
  time_limit: лимит_времени,
  img_path: "path/to/img.jpg"
}
```

### Запросить баллы за вопросы из раунда

```js
request = {
	type: "get_question_list",
	round_id: id,
	user_id: id // мб над поменять на имя, чтобы везде было только имя....
}

response = {
	status: "ok",
	score: [ // массив, каждый элемент - 
		score1_json, // информация про один вопрос
		score2_json, // смотри score_json ниже
		...
	]
}

score_json = { // формат информации про вопрос
	question_id: id,
  score: score_num
}
```

### Запросить таблицу рейтинга

```js
request = {
	type: "get_rating_table"
}

response = {
	user_list: [
		user1_rating_json,
		user2_rating_json,
		...
	]
}

user_rating_json = {
	user_id: id, // вроде не используется, но почему бы и нет
	user_nm: "username",
	rating: суммарный_рейтинг
}
```

### Запросить всех пользователей

```js
request = {
	type: "get_users"
}

response = {
	user_list: [
		user1_rating_json,
		user2_rating_json,
		...
	]
}

user_rating_json = {
	user_id: id, // вроде не используется, но почему бы и нет
	user_nm: "username"
}
```

## Запросы, меняющие информацию на сервере

### Отправить на сервер балл за вопрос

!! важно:
просто напишу так, что баллы за вопрос могут только один раз записаться и никогда не будут меняться
```
request = {
	type: "set_one_score",
	user_nm: "username",
	pswd: "password_hash"
	score: 1, // оценка за какой-то вопрос
  question_id: 1 // идентификатор вопроса
}

response = {
	status: "response" // ответ от базы данных
}

response = {
	status: "failed",
  error: err // текст ошибки
}
```

### Отправить на сервер баллы за вопросы

!! важно:
просто напишу так, что баллы за вопрос могут только один раз записаться и никогда не будут меняться
```
request = {
	type: "set_score",
	user_nm: "username",
	pswd: "password_hash"
	scores: [ // массив, каждый элемент
		score1_json, // оценка за какой-то вопрос
		score2_json, // смотри score_json ниже
		...
	]
}

score_json = {
	question_id: id,
	score: баллы_за_вопрос
}

response = {
	status: "ok" // скорее всего всё добавилось в базу
}

response = {
	status: "failed" // чё-то сломалось.
	// но часть баллов могла записаться.
	// могу сделать так, чтобы либо всё добавилось, либо ничего
}
```

## Запросы админа

Эти запросы не должны быть в приложении
они с веб-страницы отправляются

### Добавить раунд

```js
request = {
	type: "add_round",
	round_nm: "название раунда"
	theme_nm: "тема раунда (раздел)"
	questions: [
		question1_json,
		question2_json,
		...
	]
}

question_json = {
	question_text: "текст вопроса?",
	answer_cnt: количество_вариантов_ответа,
  correct_num: номер_правильного_ответа,
  time_limit: лимит_времени, // в секундах
  img_path: "path/to/img.jpg" // плюс мб кол-во баллов за вопрос
}
```

### Удалить раунд

```js
request = {
	type: "del_round",
	round_id: id
}
```

### Удалить пользователя

```js
request = {
	type: "del_user",
	user_nm: username
}
```

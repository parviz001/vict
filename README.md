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

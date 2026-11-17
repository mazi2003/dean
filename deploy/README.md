# Развертывание «Цифрового деканата будущего» на VPS

Инструкция для запуска полного production-стека (`PostgreSQL 16 + Prisma + Fastify API + React PWA + Caddy HTTPS`) на Ubuntu 22.04/24.04 VPS, доступном из РФ без VPN.

## 1. Требования к серверу
- ОС: Ubuntu 22.04 LTS или 24.04 LTS
- Ресурсы: от 1 vCPU, 1–2 ГБ RAM (при RAM < 2 ГБ скрипт автоматически создаст 2 ГБ swap), 15 ГБ диска
- Открытые порты: `22/tcp`, `80/tcp`, `443/tcp`
- Рекомендуемые провайдеры с IP в РФ: Timeweb Cloud, Selectel, Beget, REG.RU, RuVDS

## 2. Быстрый запуск на чистом VPS

```bash
git clone <URL_РЕПОЗИТОРИЯ> /opt/dean-office
cd /opt/dean-office
sudo bash deploy/bootstrap-vps.sh --mirror
```

Параметры:
- `--mirror` — добавляет зеркала Docker Hub (`mirror.gcr.io`, `dockerhub.timeweb.cloud`), если загрузка образов с Docker Hub из РФ ограничена.
- `--domain your-domain.ru` — привязывает свой домен. Если не указывать, автоматически используется `<IP-с-дефисами>.sslip.io` с бесплатным Let's Encrypt сертификатом через Caddy.
- Пароли демонстрационных аккаунтов берутся из переменных `SEED_STUDENT_PASSWORD` / `SEED_STAFF_PASSWORD` (по умолчанию при деплое передаются `DemoStudent123!` / `DemoStaff123!`), а `DB_PASSWORD`, `JWT_SECRET`, `COOKIE_SECRET` генерируются через `openssl rand`.

## 3. Проверка доступности из России без VPN

1. **Автоматический smoke-тест с сервера:**
   ```bash
   bash deploy/healthcheck.sh
   ```
   Проверяет `/api/v1/health`, ответ `401` при неверном пароле и реальную сессионную куку `dean_session` (`httpOnly; Secure; SameSite=Lax`).
2. **Проверка доступности с российских узлов (без VPN):**
   - Откройте `https://check-host.net/check-http`
   - Введите публичный URL `https://<ваш-домен>`
   - Проверьте, что узлы `ru-*` (Москва, Санкт-Петербург, Новосибирск) возвращают код `200 OK`.
3. **Проверка в браузере:**
   - Войдите как `aigul.nurova@demo.edu` / `DemoStudent123!`
   - Убедитесь в DevTools → Application → Cookies, что установлена cookie `dean_session` с флагами `HttpOnly` и `Secure`, а в `localStorage` нет токенов.

## 4. Обновление и резервное копирование

- Обновление кода: `sudo bash deploy/update.sh`
- Бэкап PostgreSQL: `sudo bash deploy/backup.sh` (добавьте в `crontab -e` для ежедневного запуска).

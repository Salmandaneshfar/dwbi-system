## معماری پیشنهادی

### ماژول‌های دامنه
- **Auth**: ورود، صدور توکن JWT، مدیریت کاربران و نقش‌ها.
- **Core**: مدیریت ماژول‌ها (`modules`)، تعریف ستون‌ها، توضیحات و متادیتا.
- **Data**: CRUD ردیف‌ها (`module_rows`)، وارد/خروج Excel و اعتبارسنجی داده‌ها.
- **Audit**: ثبت رویدادها و لاگ‌های سیستم (فاز بعدی).
- **System**: پیکربندی، بکاپ، اسکریپت‌های نصب آفلاین.

### Backend (FastAPI)
- ساختار پوشه:
  - `app/main.py`: entrypoint و lifecycle hooks
  - `app/core`: تنظیمات (Pydantic Settings) و امنیت (JWT + bcrypt)
  - `app/db`: اتصال دیتابیس (SQLModel)، راه‌اندازی و Seed اولیه
  - `app/models`: مدل‌های SQLModel (`User`, `Module`, `ModuleRow`)
  - `app/schemas`: مدل‌های Pydantic برای ورودی/خروجی
  - `app/services`: منطق دامنه و لایه‌ی CRUD
  - `app/api/routes`: روترهای نسخه‌بندی شده (`auth`, `modules`, `module_data`)
- دیتابیس: SQLite برای توسعه، گزینه‌ی PostgreSQL برای محیط آفلاین/Production.
- ابزارها: SQLModel، Alembic (در فاز بعد)، python-jose، passlib، uvicorn.

### Frontend
- در فاز فعلی از HTML/JS موجود استفاده شده و فقط مصرف‌کننده API جدید است.
- در فاز بعدی گزینه‌های Vue 3 یا React برای ساخت SPA ماژولار بررسی می‌شود.
- نیازمندی‌های UI (RTL، i18n، Component Library) در `docs/requirements.md` ذکر شده است.

### استقرار آفلاین
- Docker و ابزار استقرار در پوشه `docker/` برنامه‌ریزی شده اما هنوز پیاده نشده است.
- هدف نهایی: بسته نصبی آفلاین که شامل وابستگی‌های Python و DB باشد.

### تست و CI
- تست‌های واحد/یکپارچه با `pytest` و `httpx` (برنامه‌ریزی شده).
- تست‌های E2E برای رابط کاربری پس از بازنویسی فرانت‌اند.
- GitHub Actions برای lint + test پیش از Merge (در فاز بعدی).

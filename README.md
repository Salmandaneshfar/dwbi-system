## Resource Management Platform

بازنویسی سامانه DWBI با رویکرد ماژولار. بک‌اند جدید بر پایه‌ی FastAPI است و فرانت‌اند فعلی HTML/JS ساده فعلاً تطبیق داده شده تا از API جدید استفاده کند.

### ساختار پوشه‌ها
- `backend/`: اپلیکیشن FastAPI (SQLModel، JWT، ساختار ماژولار)
- `frontend/`: محل پیاده‌سازی فرانت‌اند جدید (در حال حاضر از همان فایل‌های HTML/CSS/JS اصلی استفاده می‌شود)
- `docs/`: مستندات معماری، نیازمندی‌ها و نقشه‌ی راه
- `docker/`: رزرو برای تنظیمات Docker (در این فاز استفاده نمی‌شود)

### راه‌اندازی Backend
1. کلون کردن ریپو:
   ```bash
   git clone git@github.com:Salmandaneshfar/resourcemanagement.git
   cd resourcemanagement/backend
   ```
2. ایجاد محیط مجازی و نصب وابستگی‌ها:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\activate  # روی ویندوز
   pip install -r requirements.txt
   ```
3. اجرای سرور توسعه:
   ```bash
   uvicorn app.main:app --reload
   ```
   - Endpoint سلامت: `GET /healthz`
   - مستندات Swagger: `GET /api/docs`

### ورود اولیه
- کاربر پیش‌فرض هنگام راه‌اندازی ساخته می‌شود:
  - نام کاربری: `admin`
  - رمز: `admin123`
  - ماژول نمونه: `servers` با دو ردیف اولیه

### وضعیت فعلی
- اسکلت FastAPI به همراه احراز هویت JWT، ماژول‌ها و مدیریت داده‌ها آماده است.
- UI فعلی با API جدید (Bearer Token) هماهنگ شده و قابلیت Import/Export Excel حفظ شده است.
- نیازمندی‌ها، معماری و نقشه‌ی راه در پوشه‌ی `docs/` ثبت شده‌اند.

### مشارکت
- برای هر ویژگی جدید شاخه‌ی `feature/<نام-ویژگی>` ایجاد کنید.
- موارد برنامه‌ریزی شده را در `docs/roadmap.md` دنبال و به‌روزرسانی کنید.

import shutil
import os
import zipfile

src_dir = r'c:\Users\Ameeynerh\Desktop\ssa'
dest_dir = r'c:\Users\Ameeynerh\Desktop\SSA_WhoGoHost_Package'
php_src = r'c:\Users\Ameeynerh\Desktop\ssa\php_backend'

if os.path.exists(dest_dir):
    shutil.rmtree(dest_dir)
os.makedirs(dest_dir, exist_ok=True)

# 1. Copy standalone build
standalone_dir = os.path.join(src_dir, '.next', 'standalone')
for item in os.listdir(standalone_dir):
    s = os.path.join(standalone_dir, item)
    d = os.path.join(dest_dir, item)
    if os.path.isdir(s):
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)

# 2. Copy static files into .next/static
static_src = os.path.join(src_dir, '.next', 'static')
static_dest = os.path.join(dest_dir, '.next', 'static')
if os.path.exists(static_dest):
    shutil.rmtree(static_dest)
shutil.copytree(static_src, static_dest)

# 3. Copy public folder
pub_src = os.path.join(src_dir, 'public')
pub_dest = os.path.join(dest_dir, 'public')
if os.path.exists(pub_dest):
    shutil.rmtree(pub_dest)
shutil.copytree(pub_src, pub_dest)

# 4. Copy PHP API backend into api/
api_dest = os.path.join(dest_dir, 'api')
if os.path.exists(api_dest):
    shutil.rmtree(api_dest)
shutil.copytree(php_src, api_dest)

# Copy individual endpoint files into root of api/ for direct URL mapping
# api/auth/login.php, api/auth/register.php, api/members.php, api/cases.php, api/news.php, api/stats.php
# Also create index.php aliases inside subdirectories
for endpoint in ['members', 'cases', 'news', 'stats']:
    endpoint_dir = os.path.join(api_dest, endpoint)
    os.makedirs(endpoint_dir, exist_ok=True)
    shutil.copy2(os.path.join(php_src, f'{endpoint}.php'), os.path.join(endpoint_dir, 'index.php'))

# In api/auth/
auth_dir = os.path.join(api_dest, 'auth')
os.makedirs(os.path.join(auth_dir, 'login'), exist_ok=True)
shutil.copy2(os.path.join(php_src, 'auth', 'login.php'), os.path.join(auth_dir, 'login', 'index.php'))
os.makedirs(os.path.join(auth_dir, 'register'), exist_ok=True)
shutil.copy2(os.path.join(php_src, 'auth', 'register.php'), os.path.join(auth_dir, 'register', 'index.php'))

# 5. Create MySQL Schema File
schema_sql = """-- SSA Diaspora Portal MySQL Database Schema
-- Use this file if you want to import your database into WhoGoHost cPanel phpMyAdmin

CREATE TABLE IF NOT EXISTS `diaspora_members` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `diaspora_id` VARCHAR(50) DEFAULT NULL UNIQUE,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  `photo_url` TEXT DEFAULT NULL,
  `data` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `diaspora_cases` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `case_number` VARCHAR(50) NOT NULL UNIQUE,
  `member_id` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
  `country` VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
  `is_urgent` TINYINT(1) NOT NULL DEFAULT 0,
  `data` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `diaspora_news` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'Announcement',
  `author` VARCHAR(100) NOT NULL DEFAULT 'Admin',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `diaspora_settings` (
  `setting_key` VARCHAR(100) NOT NULL PRIMARY KEY,
  `setting_value` JSON NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""
with open(os.path.join(dest_dir, 'schema_mysql.sql'), 'w', encoding='utf-8') as f:
    f.write(schema_sql)

# 6. Create robust .htaccess for WhoGoHost PHP + Apache
htaccess = """# WhoGoHost cPanel Apache & PHP Routing Configuration
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Handle CORS Preflight
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]

    # Map clean API URLs to PHP backend scripts
    RewriteRule ^api/auth/login/?$ api/auth/login.php [L,QSA]
    RewriteRule ^api/auth/register/?$ api/auth/register.php [L,QSA]
    RewriteRule ^api/members/?$ api/members.php [L,QSA]
    RewriteRule ^api/cases/?$ api/cases.php [L,QSA]
    RewriteRule ^api/news/?$ api/news.php [L,QSA]
    RewriteRule ^api/stats/?$ api/stats.php [L,QSA]

    # Serve existing files and directories directly
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]
</IfModule>

# PHP Execution settings
<IfModule mod_php.c>
    php_flag display_errors Off
    php_value upload_max_filesize 10M
    php_value post_max_size 10M
</IfModule>
"""
with open(os.path.join(dest_dir, '.htaccess'), 'w', encoding='utf-8') as f:
    f.write(htaccess)

# 7. Create Instructions File
readme = """===============================================================
SSA DIASPORA PORTAL - WHOGOHOST PHP & cPANEL HOSTING PACKAGE
===============================================================

This package includes the full PHP backend and pre-configured Apache routing for standard WhoGoHost cPanel hosting.

---------------------------------------------------------------
HOW TO HOST ON WHOGOHOST cPANEL:
---------------------------------------------------------------

STEP 1: Upload Files
1. Log in to your WhoGoHost cPanel.
2. Open "File Manager" and navigate into your "public_html" directory.
3. Click "Upload" and select "SSA_WhoGoHost_Upload.zip".
4. After upload, right-click the zip file and click "Extract" directly into public_html.

STEP 2: Permissions Check
1. Ensure the "diaspora_data.json" file in public_html has write permissions (chmod 664 or 666) so PHP can save member registrations, cases, and news.

STEP 3: Test Your Website
1. Open your domain name in the browser (e.g., https://yourdomain.com).
2. The entire portal will load and run with the PHP backend at /api/!

---------------------------------------------------------------
PHP API Endpoints Included:
- /api/auth/login        (Staff & Member sign-in)
- /api/auth/register     (6-Step Member Registration & ID issuance)
- /api/members           (Member management, approvals, suspension, verification)
- /api/cases             (Consular & Welfare case reporting and tracking)
- /api/news              (Official Announcements)
- /api/stats             (Admin live metrics adjust & sync)
===============================================================
"""
with open(os.path.join(dest_dir, 'README_WHOGOHOST_PHP.txt'), 'w', encoding='utf-8') as f:
    f.write(readme)

# 8. Create Final ZIP package
zip_path = r'c:\Users\Ameeynerh\Desktop\SSA_WhoGoHost_Upload.zip'
if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(dest_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, dest_dir)
            zf.write(full_path, rel_path)

print(f"SUCCESS: PHP Backend & Hosting Package created at {dest_dir}")
print(f"SUCCESS: Zip created at {zip_path}")
print(f"ZIP Size: {round(os.path.getsize(zip_path) / (1024 * 1024), 2)} MB")

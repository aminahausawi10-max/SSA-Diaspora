import shutil
import os
import zipfile

src_dir = r'c:\Users\Ameeynerh\Desktop\ssa'
dest_dir = r'c:\Users\Ameeynerh\Desktop\SSA_WhoGoHost_Package'

if os.path.exists(dest_dir):
    shutil.rmtree(dest_dir)
os.makedirs(dest_dir, exist_ok=True)

# 1. Copy standalone directory contents
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

# 4. Copy .env
with open(os.path.join(src_dir, '.env.local'), 'r', encoding='utf-8') as f:
    env_content = f.read()

with open(os.path.join(dest_dir, '.env'), 'w', encoding='utf-8') as f:
    f.write(env_content + '\nPORT=3000\nNODE_ENV=production\n')

# 5. Create .htaccess for cPanel / CloudLinux Passenger / Reverse Proxy
htaccess_lines = [
    "# WhoGoHost cPanel / Apache Configuration",
    "DirectoryIndex server.js index.html",
    "",
    "<IfModule mod_rewrite.c>",
    "    RewriteEngine On",
    "    RewriteBase /",
    "    # Serve static assets directly if they exist",
    "    RewriteCond %{REQUEST_FILENAME} -f [OR]",
    "    RewriteCond %{REQUEST_FILENAME} -d",
    "    RewriteRule ^ - [L]",
    "</IfModule>",
    "",
    "# CloudLinux Passenger Startup Configuration (Set by cPanel Node.js App Selector)",
    "# PassengerStartupFile server.js",
    "# PassengerAppType node",
    ""
]
with open(os.path.join(dest_dir, '.htaccess'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(htaccess_lines))

# 6. Create instructions file
instructions = """=======================================================
SSA DIASPORA PORTAL - WHOGOHOST cPANEL DEPLOYMENT GUIDE
=======================================================

This package contains the complete production standalone build of the SSA Diaspora Portal, fully configured for WhoGoHost (or any cPanel Linux hosting).

-------------------------------------------------------
STEP-BY-STEP UPLOAD & ACTIVATION GUIDE:
-------------------------------------------------------

STEP 1: Create the Node.js App in WhoGoHost cPanel
-------------------------------------------------------
1. Log in to your WhoGoHost cPanel.
2. In the "Software" section, click on "Setup Node.js App".
3. Click the "Create Application" button.
4. Fill in the following fields:
   - Node.js version: Select 18.x, 20.x, or 22.x.
   - Application mode: Production
   - Application root: public_html (or your subfolder/subdomain root)
   - Application URL: Select your domain (e.g. yourdomain.com)
   - Application startup file: server.js
5. Click "Create".

-------------------------------------------------------
STEP 2: Upload Project Files
-------------------------------------------------------
1. Open cPanel "File Manager".
2. Navigate into your "public_html" directory.
3. Click "Upload" and select "SSA_WhoGoHost_Upload.zip" from your Desktop.
4. Once uploaded, right-click the zip file in File Manager and click "Extract".
5. Extract all files directly into public_html.

-------------------------------------------------------
STEP 3: Configure Environment Variables & Start
-------------------------------------------------------
1. Go back to "Setup Node.js App" in cPanel.
2. Under "Environment variables", click "Add Variable" to add:
   * DATABASE_URL = postgresql://neondb_owner:npg_DpIVbjQh3Rz5@ep-green-breeze-at2cczuz-pooler.c-9.us-east-1.aws.neon.tech/mmd?sslmode=require&channel_binding=require
   * CLOUDINARY_CLOUD_NAME = dpghoiocq
   * CLOUDINARY_API_KEY = 283943216837512
   * CLOUDINARY_API_SECRET = y_c8wSat2wFRqfuIjFuAwkA1aKE
   * NODE_ENV = production
   * PORT = 3000
3. Click "Restart" at the top of the Node.js App page.
4. Open your domain in your web browser!

=======================================================
Features & Integrations Included:
- Standalone optimized server.js engine
- PostgreSQL cloud database connected & synced
- Cloudinary photo & document verification uploads
- Full Admin Control Panel with instant metrics adjust
- Responsive Mobile & Desktop UI
=======================================================
"""
with open(os.path.join(dest_dir, 'README_WHOGOHOST.txt'), 'w', encoding='utf-8') as f:
    f.write(instructions)

# 7. Zip the package
zip_path = r'c:\Users\Ameeynerh\Desktop\SSA_WhoGoHost_Upload.zip'
if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(dest_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, dest_dir)
            zf.write(full_path, rel_path)

print(f"SUCCESS: Package created at {dest_dir}")
print(f"SUCCESS: Zip created at {zip_path}")
print(f"ZIP Size: {round(os.path.getsize(zip_path) / (1024 * 1024), 2)} MB")

#!/usr/bin/env python3
"""src/ 의 템플릿+모듈을 단일 HTML 로 합쳐 docs/ 에 출력합니다. (GitHub Pages: main /docs)
사용: python3 build.py            -> config.json 의 DB 설정을 주입
      python3 build.py --memory   -> DB 설정 없이 메모리 모드로 빌드(Artifact 미리보기용)"""
import re, json, sys, os
root = os.path.dirname(os.path.abspath(__file__))
memory = '--memory' in sys.argv
cfgpath = sys.argv[sys.argv.index('--config')+1] if '--config' in sys.argv else os.path.join(root, 'config.json')
cfg = {} if memory else json.load(open(cfgpath))
env_url, env_key = os.environ.get('SUPABASE_URL'), os.environ.get('SUPABASE_ANON_KEY')
if env_url and env_key and not memory:
    cfg = {'url': env_url, 'anonKey': env_key}   # CI 환경별(staging/production) DB 주입
import subprocess, datetime
sha = os.environ.get('GITHUB_SHA') or (subprocess.run(['git','rev-parse','HEAD'],cwd=root,capture_output=True,text=True).stdout.strip() or 'local')
version = os.environ.get('RELEASE_VERSION') or ('dev-' + sha[:7])
target = os.environ.get('DEPLOY_ENV', 'local')
built_at = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
vinfo = {'version': version, 'sha': sha, 'env': target, 'builtAt': built_at, 'db': bool(cfg.get('url')) and 'YOUR-' not in cfg.get('url','')}
inject = 'window.APP_CONFIG=' + json.dumps(cfg) + ';window.APP_VERSION=' + json.dumps(version) + ';\n'
names = {'a': 'a-booking', 'c': 'c-matching', 'f': 'f-samples'}
def read(p): return open(os.path.join(root, 'src', p), encoding='utf-8').read()
out_name = sys.argv[sys.argv.index('--out')+1] if '--out' in sys.argv else 'docs'
os.makedirs(os.path.join(root, out_name), exist_ok=True)
for k, name in names.items():
    t = read(k + '-template.html')
    out = re.sub(r'/\*@@(.+?)@@\*/', lambda m: read(m.group(1)), t)
    out = out.replace('<script>', '<script>\n' + inject, 1)
    open(os.path.join(root, out_name, name + '.html'), 'w', encoding='utf-8').write(out)
idx = os.path.join(root, 'src', 'index.html')
if os.path.exists(idx):
    open(os.path.join(root, out_name, 'index.html'), 'w', encoding='utf-8').write(open(idx, encoding='utf-8').read())
open(os.path.join(root, out_name, '.nojekyll'), 'w').close()
open(os.path.join(root, out_name, 'version.json'), 'w').write(json.dumps(vinfo, ensure_ascii=False, indent=2))
print('built', version, 'memory' if memory else ('db' if cfg.get('url') else 'no-config'))

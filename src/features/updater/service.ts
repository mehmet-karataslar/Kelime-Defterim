import { Capacitor, registerPlugin, PluginListenerHandle } from '@capacitor/core';

export const APP_VERSION = '1.0.2';

interface AppUpdaterPlugin {
  download(opts: { url: string; sha256: string }): Promise<{ state: string; path?: string }>;
  installPending(): Promise<{ state: string }>;
  addListener(event: 'progress', cb: (e: { percent: number }) => void): Promise<PluginListenerHandle>;
  addListener(event: 'state', cb: (e: { value: string; error?: string }) => void): Promise<PluginListenerHandle>;
}

const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater');

export interface ReleaseInfo {
  tag: string;
  name: string;
  notes: string;
  apkUrl: string;
  apkSize: number;
  sha256: string | null;
  htmlUrl: string;
}

export type UpdatePhase =
  | 'idle' | 'checking' | 'uptodate' | 'found'
  | 'downloading' | 'verifying' | 'permission' | 'installing' | 'failed';

function parseVer(tag: string): number[] {
  return tag.replace(/^v/i, '').split('.').map((x) => parseInt(x, 10) || 0);
}

export function isNewer(tag: string, current = APP_VERSION): boolean {
  const a = parseVer(tag); const b = parseVer(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

export const DEFAULT_REPO = 'mehmet-karataslar/Kelime-Defterim';

interface GhAsset { name: string; size: number; browser_download_url: string }
interface GhRelease { tag_name: string; name: string; body: string; prerelease: boolean; draft: boolean; html_url: string; assets: GhAsset[] }

export async function fetchLatestRelease(repo = DEFAULT_REPO, channel: 'stable' | 'beta'): Promise<GhRelease | null> {
  const target = (repo || '').trim() || DEFAULT_REPO;
  const clean = target.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/, '').replace(/\/+$/, '');
  if (!/^[\w.-]+\/[\w.-]+$/.test(clean)) throw new Error('invalid-repo');
  const headers = { Accept: 'application/vnd.github+json' };
  if (channel === 'stable') {
    const res = await fetch(`https://api.github.com/repos/${clean}/releases/latest`, { headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`http-${res.status}`);
    return (await res.json()) as GhRelease;
  }
  const res = await fetch(`https://api.github.com/repos/${clean}/releases?per_page=20`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`http-${res.status}`);
  const list = (await res.json()) as GhRelease[];
  return list.find((r) => !r.draft) ?? null;
}

export async function resolveRelease(rel: GhRelease): Promise<ReleaseInfo | { error: 'no-asset' | 'no-checksum' }> {
  const apk = rel.assets.find((a) => a.name.toLowerCase().endsWith('.apk'));
  if (!apk) return { error: 'no-asset' };
  let sha256: string | null = null;
  const checksumAsset = rel.assets.find((a) => /sha256|checksum/i.test(a.name) && !a.name.endsWith('.apk'));
  if (checksumAsset) {
    try {
      const txt = await (await fetch(checksumAsset.browser_download_url)).text();
      const m = txt.match(/[0-9a-f]{64}/i);
      if (m) sha256 = m[0].toLowerCase();
    } catch { /* fall through to body */ }
  }
  if (!sha256) {
    const m = (rel.body ?? '').match(/[0-9a-f]{64}/i);
    if (m) sha256 = m[0].toLowerCase();
  }
  if (!sha256) return { error: 'no-checksum' };
  return {
    tag: rel.tag_name, name: rel.name || rel.tag_name, notes: rel.body ?? '',
    apkUrl: apk.browser_download_url, apkSize: apk.size, sha256, htmlUrl: rel.html_url,
  };
}

export function formatBytes(n: number): string {
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

export async function downloadAndInstall(
  info: ReleaseInfo,
  onProgress: (pct: number) => void,
  onPhase: (p: UpdatePhase, err?: string) => void,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    const a = document.createElement('a');
    a.href = info.apkUrl; a.download = `kelime-defterim-${info.tag}.apk`;
    document.body.appendChild(a); a.click(); a.remove();
    onPhase('installing');
    return;
  }
  const handles: PluginListenerHandle[] = [];
  try {
    handles.push(await AppUpdater.addListener('progress', (e) => onProgress(e.percent)));
    handles.push(await AppUpdater.addListener('state', (e) => {
      if (e.value === 'verifying') onPhase('verifying');
      else if (e.value === 'permission') onPhase('permission');
      else if (e.value === 'installing') onPhase('installing');
      else if (e.value === 'failed') onPhase('failed', e.error);
    }));
    onPhase('downloading');
    const res = await AppUpdater.download({ url: info.apkUrl, sha256: info.sha256 ?? '' });
    if (res.state === 'permission') onPhase('permission');
    else if (res.state === 'installing') onPhase('installing');
  } catch (e) {
    onPhase('failed', e instanceof Error ? e.message : String(e));
  } finally {
    handles.forEach((h) => void h.remove());
  }
}

export async function retryInstall(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const res = await AppUpdater.installPending();
    return res.state === 'installing';
  } catch {
    return false;
  }
}
import { useEffect, useState, type FormEvent } from 'react';

import type { AuthStatusResponse, UserProfile } from '../shared/types';

type Mode = 'login' | 'register';

export default function App() {
  const [auth, setAuth] = useState<AuthStatusResponse | null>(null);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    void requestJson<AuthStatusResponse>('/api/auth/status')
      .then(setAuth)
      .catch(() => setAuth({ authenticated: false, user: null }));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = mode === 'register' ? { email, displayName, password } : { email, password };
      const result = await requestJson<{ authenticated: boolean; user: UserProfile }>(
        `/api/auth/${mode}`,
        { method: 'POST', body: JSON.stringify(payload) },
      );
      setAuth({ authenticated: result.authenticated, user: result.user });
      setPassword('');
      setNotice(mode === 'register' ? '账户创建成功，欢迎加入 Cynos。' : '登录成功。');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '请求失败，请稍后再试');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await requestJson('/api/auth/logout', { method: 'POST' });
      setAuth({ authenticated: false, user: null });
      setNotice('已安全退出。');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '退出失败，请稍后再试');
    } finally {
      setBusy(false);
    }
  }

  if (auth === null) {
    return (
      <Shell>
        <p className="loading">正在恢复登录状态…</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="site-header">
        <div className="brand-mark" aria-label="Cynos">
          <span className="brand-dot" />
          <span>Cynos</span>
        </div>
        <span className="header-caption">用户中心</span>
      </header>

      <main className="content-grid">
        <section className="intro-block">
          <p className="eyebrow">BUILD WITH CLARITY</p>
          <h1>
            让每一次协作，<em>更接近答案。</em>
          </h1>
          <p className="intro-copy">
            Cynos 是一个面向真实工作流的产品实验场。登录后即可继续探索你的项目空间。
          </p>
          <div className="signal-row" aria-label="产品特性">
            <span>真实产品</span>
            <span>清晰协作</span>
            <span>持续演进</span>
          </div>
        </section>

        <section className="auth-card" aria-labelledby="auth-title">
          {auth.authenticated && auth.user ? (
            <Welcome user={auth.user} busy={busy} onLogout={() => void logout()} />
          ) : (
            <>
              <div className="card-heading">
                <p className="eyebrow">WELCOME BACK</p>
                <h2 id="auth-title">{mode === 'login' ? '登录 Cynos' : '创建账户'}</h2>
                <p>{mode === 'login' ? '继续你的工作。' : '从一个账户开始你的体验。'}</p>
              </div>
              {notice && <p className="notice success">{notice}</p>}
              {error && (
                <p className="notice error" role="alert">
                  {error}
                </p>
              )}
              <form onSubmit={(event) => void submit(event)}>
                {mode === 'register' && (
                  <label className="field">
                    <span>昵称</span>
                    <input
                      required
                      autoComplete="name"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="你的名字"
                    />
                  </label>
                )}
                <label className="field">
                  <span>邮箱</span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                <label className="field">
                  <span>密码</span>
                  <input
                    required
                    type="password"
                    minLength={12}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="至少 12 个字符"
                  />
                </label>
                <button className="primary-button" type="submit" disabled={busy}>
                  {busy ? '处理中…' : mode === 'login' ? '登录' : '注册并继续'}
                  <span aria-hidden="true">↗</span>
                </button>
              </form>
              <button
                className="switch-button"
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                  setNotice('');
                }}
              >
                {mode === 'login' ? '还没有账户？立即注册' : '已有账户？返回登录'}
              </button>
              <p className="privacy-note">你的密码经过安全哈希处理，我们不会保存明文密码。</p>
            </>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <span>© Cynos</span>
        <span>一个可持续演进的工作空间</span>
      </footer>
    </Shell>
  );
}

function Welcome({
  user,
  busy,
  onLogout,
}: {
  user: UserProfile;
  busy: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="welcome-state">
      <div className="avatar" aria-hidden="true">
        {user.displayName.slice(0, 1).toUpperCase()}
      </div>
      <p className="eyebrow">YOU ARE IN</p>
      <h2>你好，{user.displayName}。</h2>
      <p className="welcome-copy">你的 Cynos 空间已准备好。当前登录邮箱是 {user.email}。</p>
      <div className="welcome-line" />
      <button className="secondary-button" type="button" disabled={busy} onClick={onLogout}>
        退出登录 <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">{children}</div>;
}

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  if (init.body !== undefined) headers.set('content-type', 'application/json');
  const response = await fetch(url, { ...init, headers, credentials: 'same-origin' });
  const text = await response.text();
  let payload: unknown;
  try {
    payload = text === '' ? undefined : JSON.parse(text);
  } catch {
    payload = undefined;
  }
  if (!response.ok) {
    const message =
      isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === 'string'
        ? payload.error.message
        : '请求失败，请稍后再试';
    throw new Error(message);
  }
  return payload as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

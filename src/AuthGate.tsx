import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import App from "./App";
import { supabase, configured, authRedirect } from "./data/supabase";
import { Repository, type Snapshot } from "./data/repository";
import { translate, type Lang } from "./i18n";
import { Button } from "./components/ui/button";
export default function AuthGate({
  client = supabase,
  isConfigured = configured,
}: {
  client?: SupabaseClient | null;
  isConfigured?: boolean;
}) {
  const [lang, setLang] = useState<Lang>(() => {
    const l = localStorage.getItem("hp-lang");
    return l === "de" || l === "en" ? l : "fi";
  });
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);
  const [session, setSession] = useState<Session | null>(null),
    [loading, setLoading] = useState(true),
    [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [recovery, setRecovery] = useState(
      new URLSearchParams(location.search).has("auth"),
    ),
    [form, setForm] = useState<"login" | "recover">("login"),
    [demo, setDemo] = useState(
      new URLSearchParams(location.search).get("demo") === "1",
    );
  const epoch = useRef(0);
  const sessionUserRef = useRef<string | null>(null);
  const repository = useRef<Repository | null>(null);
  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }
    let active = true;
    let authEventReceived = false;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      authEventReceived = true;
      if (sessionUserRef.current !== (next?.user.id || null)) {
        epoch.current++;
        setSnapshot(null);
        repository.current = null;
      }
      sessionUserRef.current = next?.user.id || null;
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(next);
      if (!next) {
        epoch.current++;
        setSnapshot(null);
        repository.current = null;
      }
      setLoading(false);
    });
    client.auth.getSession().then(({ data, error }) => {
      if (!active || authEventReceived) return;
      sessionUserRef.current = data.session?.user.id || null;
      if (error) setError(t("authError"));
      setSession(data.session);
      setLoading(false);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // translations are read on subsequent actions; subscription must remain stable.
  }, [client]);
  async function load() {
    if (!client || !session) return;
    const ticket = ++epoch.current;
    setSnapshot(null);
    setLoading(true);
    setError("");
    try {
      const { data, error } = await client
        .from("memberships")
        .select("organization_id")
        .eq("user_id", session.user.id);
      if (error) throw error;
      if (data?.length !== 1) throw Error("membership");
      const repo = new Repository(client, data[0].organization_id);
      const result = await repo.load();
      if (ticket === epoch.current) {
        repository.current = repo;
        setSnapshot(result);
      }
    } catch {
      if (ticket === epoch.current) setError(t("accessError"));
    } finally {
      if (ticket === epoch.current) setLoading(false);
    }
  }
  useEffect(() => {
    if (session?.user.id && !demo) void load();
    return () => {
      epoch.current++;
    };
  }, [session?.user.id, demo]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!client) return;
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (recovery) {
        const { error } = await client.auth.updateUser({
          password: String(data.get("password")),
        });
        if (error) throw error;
        setRecovery(false);
        history.replaceState(null, "", import.meta.env.BASE_URL);
        setMessage(t("passwordUpdated"));
      } else if (form === "recover") {
        const { error } = await client.auth.resetPasswordForEmail(
          String(data.get("email")),
          { redirectTo: authRedirect("recovery") },
        );
        if (error) throw error;
        setMessage(t("recoverySent"));
      } else {
        const { error } = await client.auth.signInWithPassword({
          email: String(data.get("email")),
          password: String(data.get("password")),
        });
        if (error) throw error;
      }
    } catch {
      setError(t("authError"));
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    if (!client) return;
    setBusy(true);
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) setError(t("authError"));
    else {
      epoch.current++;
      setSnapshot(null);
      setSession(null);
      repository.current = null;
      setRecovery(false);
      history.replaceState(null, "", import.meta.env.BASE_URL);
    }
    setBusy(false);
  }
  if (demo || !isConfigured)
    return (
      <>
        <div className="mode-switch">
          <Button
            variant="outline"
            onClick={() => {
              setDemo(false);
              history.replaceState(null, "", import.meta.env.BASE_URL);
              if (!isConfigured) setError(t("notConfigured"));
            }}
          >
            {t("privateSignIn")}
          </Button>
          {!isConfigured && <span>{t("notConfigured")}</span>}
        </div>
        <App key="demo" />
      </>
    );
  if (loading)
    return (
      <div className="auth-shell" role="status">
        {t("loading")}
      </div>
    );
  if (session && snapshot && !recovery && repository.current)
    return (
      <App
        key={session.user.id + snapshot.organizationId}
        initialSnapshot={snapshot}
        repository={repository.current}
        userName={session.user.email || session.user.id}
        onSignOut={signOut}
      />
    );
  return (
    <div className="auth-shell">
      <section className="card padded auth-card">
        <h1>huoltopilotti.</h1>
        <label>
          {t("language")}
          <select
            value={lang}
            onChange={(e) => {
              setLang(e.target.value as Lang);
              localStorage.setItem("hp-lang", e.target.value);
            }}
          >
            <option value="fi">Suomi</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
        </label>
        <h2>
          {recovery
            ? t("setPassword")
            : session
              ? t("accessTitle")
              : form === "recover"
                ? t("recoverPassword")
                : t("privateSignIn")}
        </h2>
        <p>{t("privateNotice")}</p>
        {(!session || recovery) && (
          <form onSubmit={submit}>
            {!recovery && (
              <label>
                {t("email")}
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </label>
            )}
            {(recovery || form === "login") && (
              <label>
                {t("password")}
                <input
                  type="password"
                  name="password"
                  autoComplete={recovery ? "new-password" : "current-password"}
                  minLength={recovery ? 12 : 1}
                  maxLength={128}
                  required
                />
              </label>
            )}
            <Button disabled={busy} type="submit">
              {recovery
                ? t("save")
                : form === "recover"
                  ? t("sendRecovery")
                  : t("signIn")}
            </Button>
          </form>
        )}
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <div className="button-row">
          {recovery && (
            <Button
              variant="outline"
              onClick={() => {
                setRecovery(false);
                setForm("recover");
                history.replaceState(null, "", import.meta.env.BASE_URL);
              }}
            >
              {t("cancel")}
            </Button>
          )}
          {!session && !recovery && (
            <Button
              variant="ghost"
              onClick={() => {
                setForm(form === "login" ? "recover" : "login");
                setError("");
                setMessage("");
              }}
            >
              {form === "login" ? t("recoverPassword") : t("signIn")}
            </Button>
          )}
          {session && (
            <>
              <Button variant="outline" onClick={() => void load()}>
                {t("reload")}
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void signOut()}
              >
                {t("signOut")}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => {
              epoch.current++;
              setSnapshot(null);
              setDemo(true);
              history.replaceState(
                null,
                "",
                `${import.meta.env.BASE_URL}?demo=1`,
              );
            }}
          >
            {t("openDemo")}
          </Button>
        </div>
      </section>
    </div>
  );
}

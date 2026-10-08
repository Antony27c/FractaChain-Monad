"use client";

import { useState } from "react";
import "./LoginScreen.css";

type Role = "inversor" | "cliente";

const ROLES: { id: Role; title: string; desc: string }[] = [
  {
    id: "inversor",
    title: "Inversor",
    desc: "Comprá fracciones de activos reales y seguí cómo rinden.",
  },
  {
    id: "cliente",
    title: "Cliente",
    desc: "Tokenizá tus activos y administrá tus emisiones.",
  },
];

type Props = {
  /** Se llama al apretar "Conectar wallet". Si falla, tiene que lanzar un error. */
  onConnect?: (role: Role) => void | Promise<void>;
};

export default function LoginScreen({ onConnect }: Props) {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    if (!role || loading) return;
    setLoading(true);
    setError("");
    try {
      await onConnect?.(role);
    } catch {
      setError(
        "No se pudo conectar la wallet. Revisá que esté desbloqueada y probá de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="fc-login">
      <div className="fc-lights" aria-hidden="true">
        <span className="fc-light fc-light--1" />
        <span className="fc-light fc-light--2" />
        <span className="fc-light fc-light--3" />
        <span className="fc-light fc-light--4" />
        <span className="fc-beam fc-beam--1" />
        <span className="fc-beam fc-beam--2" />
      </div>

      <section className="fc-card">
        <h1 id="fc-title" className="fc-title">
          Ingresá a FractaChain
        </h1>
        <p className="fc-sub">¿Cómo querés usar la plataforma?</p>

        <div className="fc-roles" role="radiogroup" aria-labelledby="fc-title">
          {ROLES.map((r) => {
            const selected = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`fc-role${selected ? " is-selected" : ""}`}
                onClick={() => setRole(r.id)}
              >
                <span className="fc-role__dot" />
                <span className="fc-role__text">
                  <span className="fc-role__title">{r.title}</span>
                  <span className="fc-role__desc">{r.desc}</span>
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="fc-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="fc-cta"
          disabled={!role || loading}
          onClick={handleConnect}
        >
          {loading ? "Conectando…" : "Conectar wallet"}
        </button>
      </section>
    </main>
  );
}

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Admin } from "./admin";
import { crearDatosDemo } from "@/lib/seed";

afterEach(cleanup);

function entrar() {
  render(<Admin db={crearDatosDemo()} />);
  const campo = screen.getByLabelText("Clave de acceso");
  expect(campo).toHaveAttribute("type", "password");
  expect(screen.queryByText(/Clave de acceso \(maquinaria2026\)/)).toBeNull();
  fireEvent.change(campo, { target: { value: "maquinaria2026" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("administración móvil compacta", () => {
  it("mantiene el formulario de acceso y no revela la contraseña", () => {
    render(<Admin db={crearDatosDemo()} />);
    expect(screen.getByLabelText("Clave de acceso")).toBeInTheDocument();
    expect(screen.queryByText(/Clave de acceso \(maquinaria2026\)/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Volquetes" })).not.toBeInTheDocument();
  });

  it("las seis categorías empiezan cerradas y se abre solo una", () => {
    entrar();
    const obras = screen.getByRole("button", { name: /Obras 2 registradas/i });
    const frentes = screen.getByRole("button", { name: /Frentes y asignaciones 4 frentes/i });
    const volquetes = screen.getByRole("button", { name: /Volquetes 8 unidades/i });
    expect(obras).toHaveAttribute("aria-expanded", "false");
    expect(frentes).toHaveAttribute("aria-expanded", "false");
    expect(volquetes).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(obras);
    expect(obras).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByLabelText("Nombre de obra")).toHaveLength(2);
    fireEvent.click(frentes);
    expect(obras).toHaveAttribute("aria-expanded", "false");
    expect(frentes).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByLabelText("Nombre de obra")).not.toBeInTheDocument();
  });

  it("cada frente tiene sus propios detalles cerrados inicialmente", () => {
    entrar();
    fireEvent.click(screen.getByRole("button", { name: /Frentes y asignaciones/i }));
    const summary = screen.getByText("Relleno terraplén cad. 2+400").closest("summary");
    expect(summary).not.toBeNull();
    const details = summary!.closest("details")!;
    expect(details.open).toBe(false);
    fireEvent.click(summary!);
    expect(details.open).toBe(true);
  });

  it("permite cerrar sesión y vuelve a pedir la clave", () => {
    entrar();
    fireEvent.click(screen.getByRole("button", { name: /Cerrar sesión/i }));
    expect(screen.getByLabelText("Clave de acceso")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tarifas \(MXN\)/i })).not.toBeInTheDocument();
  });
});

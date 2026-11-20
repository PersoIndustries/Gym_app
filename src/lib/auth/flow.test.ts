import { describe, expect, it } from "vitest";
import { authCallbackUrl, authDestination, validateAuthFlow } from "./flow";

describe("Acceso según procedencia", () => {
  it("envía al creador al alta conservando Elite aunque pertenezca a un box", () => {
    expect(authDestination({ intent: "create_gym", plan: "elite" }, "admin", null)).toEqual({ to: "/empezar", search: { plan: "elite" } });
  });
  it("conserva intención y plan en la confirmación en otro dispositivo", () => {
    const callback = new URL(authCallbackUrl("https://boxflow.example", { intent: "create_gym", plan: "starter" }));
    const restored = validateAuthFlow(Object.fromEntries(callback.searchParams));
    expect(callback.pathname).toBe("/auth");
    expect(authDestination(restored, null, null)).toEqual({ to: "/empezar", search: { plan: "starter" } });
  });
  it("conserva el box en el retorno de Google y confirmación sin almacenamiento local", () => {
    const callback = new URL(authCallbackUrl("https://boxflow.example", { code: "iron24" }));
    expect(authDestination(validateAuthFlow(Object.fromEntries(callback.searchParams)), null, null)).toEqual({ to: "/join", search: { code: "IRON24" } });
  });
  it("una cuenta nueva sin contexto elige entre unirse o crear gimnasio", () => {
    expect(authDestination({}, null, null)).toEqual({ to: "/bienvenida" });
  });
  it("el socio existente entra directamente a sus clases", () => {
    expect(authDestination({}, "athlete", null)).toEqual({ to: "/dashboard" });
  });
  it("el admin y el profesor existentes entran a gestión", () => {
    expect(authDestination({}, "admin", null)).toEqual({ to: "/admin" });
    expect(authDestination({}, "coach", null)).toEqual({ to: "/admin" });
  });
  it("los roles de plataforma entran a su consola", () => {
    expect(authDestination({}, null, "super_admin")).toEqual({ to: "/platform" });
    expect(authDestination({}, null, "developer")).toEqual({ to: "/platform" });
  });
  it("la intención de crear gimnasio descarta cualquier código anterior", () => {
    expect(validateAuthFlow({ intent: "create_gym", plan: "pro", code: "IRON24" })).toEqual({ intent: "create_gym", plan: "pro" });
  });
  it("rechaza destinos externos, códigos malformados y planes desconocidos", () => {
    expect(validateAuthFlow({ intent: "https://evil.example", redirect: "https://evil.example", code: "../admin", plan: "unknown" })).toEqual({});
    expect(authCallbackUrl("https://boxflow.example", { intent: "https://evil.example" })).toBe("https://boxflow.example/auth");
  });
});
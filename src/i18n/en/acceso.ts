import type { acceso as Es } from "../es/acceso";

/** Login y registro. */
export const acceso: typeof Es = {
  login: {
    subtitulo: "Sign in to see your routines.",
    usuario: "Username",
    contrasena: "Password",
    entrar: "Sign in",
    sinCuenta: "Don't have an account?",
    registrate: "Sign up",
    errores: {
      invalid: "Incorrect username or password.",
      locked: "Too many attempts. Wait 15 minutes and try again.",
    },
  },

  registro: {
    titulo: "Create your account",
    subtitulo: "Just a username and a password.",
    usuario: "Username",
    contrasena: "Password",
    crearCuenta: "Create account",
    avisoSinCorreo:
      "We don't ask for an email: if you forget your password there's no way to recover it. Keep it somewhere safe.",
    yaTienesCuenta: "Already have an account?",
    iniciaSesion: "Sign in",
    errores: {
      invalid:
        "Username must be 3 to 40 characters (letters, numbers, . _ @ -) and password 4 to 128.",
      taken: "That username is already taken, pick another one.",
    },
  },

  /** Cuando el código de error del querystring no es ninguno de los conocidos. */
  errorGenerico: "Something went wrong, try again.",
};

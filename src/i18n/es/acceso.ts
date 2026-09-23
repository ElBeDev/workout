/** Login y registro. */
export const acceso = {
  login: {
    subtitulo: "Inicia sesión para ver tus rutinas.",
    usuario: "Usuario",
    contrasena: "Contraseña",
    entrar: "Entrar",
    sinCuenta: "¿No tienes cuenta?",
    registrate: "Regístrate",
    errores: {
      invalid: "Usuario o contraseña incorrectos.",
      locked: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.",
    },
  },

  registro: {
    titulo: "Crea tu cuenta",
    subtitulo: "Solo un usuario y una contraseña.",
    usuario: "Usuario",
    contrasena: "Contraseña",
    crearCuenta: "Crear cuenta",
    avisoSinCorreo:
      "No pedimos correo: si olvidas la contraseña no hay forma de recuperarla. Guárdala bien.",
    yaTienesCuenta: "¿Ya tienes cuenta?",
    iniciaSesion: "Inicia sesión",
    errores: {
      invalid: "Usuario de 3 a 40 caracteres (letras, números, . _ @ -) y contraseña de 4 a 128.",
      taken: "Ese usuario ya existe, elige otro.",
    },
  },

  /** Cuando el código de error del querystring no es ninguno de los conocidos. */
  errorGenerico: "Algo salió mal, intenta de nuevo.",
};

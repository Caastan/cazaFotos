# 📸 CazaFotos – App de Concursos Fotográficos

**CazaFotos** es una aplicación móvil desarrollada en **React Native con Expo**, cuyo objetivo es gestionar concursos mensuales de fotografía. Los usuarios pueden subir imágenes, votar a sus favoritas y consultar las bases del concurso. Los administradores pueden moderar contenido y gestionar el reglamento y los temas del mes.

---

## 🚀 Tecnologías utilizadas

- **React Native + Expo**
- **Supabase (Base de datos, Storage y Auth)**
- **Firebase (fase inicial del proyecto)**
- **React Native Elements y otros paquetes de UI**
- **GitHub (repositorio privado)**

---

## 📂 Estructura del proyecto

```
cazaFotos/
├── assets/               # Recursos gráficos
├── components/           # Componentes reutilizables
├── config/               # Configuración de Supabase
├── lib/                  # Clientes personalizados
├── screens/              # Pantallas principales
├── utils/                # Constantes globales y helpers
├── App.js                # Punto de entrada principal
└── app.json              # Configuración Expo
```

---

## ⚙️ Instalación y ejecución

### 1. Clona el repositorio (acceso privado)

```bash
git clone https://github.com/tu-usuario/CazaFotos-TFG.git
cd CazaFotos-TFG
```

### 2. Instala dependencias

```bash
npm install
```

### 3. Ejecuta la app con Expo

```bash
npx expo start
```

Esto abrirá el navegador con el **Expo Dev Tools**, desde donde podrás lanzar la app en un emulador o escaneando el código QR.

---

## 🔐 Configuración de Supabase

Debes definir tus claves en el archivo `app.json` (en el campo `expo.extra`) o usar variables de entorno con `expo-constants`:

```json
"extra": {
  "SUPABASE_URL": "https://xxxx.supabase.co",
  "SUPABASE_ANON_KEY": "eyJhbGciOiJ...."
}
```

---

## 👤 Perfiles de Usuario

- **Usuario registrado**: subir fotos, votar, consultar galería y reglamento.
- **Administrador**: moderar fotos, editar reglamento, ver estadísticas del concurso.

---

## 📄 Licencia

Este proyecto forma parte de un **Trabajo Fin de Grado** y su código se encuentra en un **repositorio privado**. Solo accesible por el autor y los profesores tutores.

---

## 🧑‍🏫 Autor y colaboración

Desarrollado por: **Juan Castaño Carrilero**  
Repositorio supervisado por los profesores del TFG del grado de [DAM].

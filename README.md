# FocuseAR

Este proyecto es una aplicación web construida con React, TypeScript y Vite.

## Versiones Requeridas

Para asegurar la compatibilidad y el correcto funcionamiento del proyecto, es necesario utilizar las siguientes versiones de las tecnologías principales. Puedes verificar las versiones exactas en el archivo `package.json`.

*   **Node.js:** `^20.0.0` (o la versión especificada en `package.json`)
*   **npm:** `^10.0.0` (o la versión compatible con tu versión de Node.js)
*   **Vite:** `^5.0.0`
*   **React:** `^18.2.0`
*   **Tailwind CSS:** `^3.3.6`
*   **Framer Motion:** `^10.16.16`

## Guía de Trabajo Colaborativo

Este proyecto sigue un flujo de trabajo que busca mantener la calidad y la estabilidad del código. La rama `main` está protegida y todos los cambios deben ser integrados a través de la rama `develop` mediante Pull Requests (PR).

## Configuracion de variables de entorno

Las variables de entorno se encuentran en el archivo `.env` en la raiz del proyecto, utiliza el archivo `.env.example` para guiarte.

### Flujo de Trabajo

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/Facuud2/FocuseAR.git
    cd FocuseAR
    ```

2.  **Posicionarse en la rama de desarrollo:**
    La rama `develop` es la rama principal de desarrollo. Asegúrate de tener la última versión de esta rama.
    ```bash
    git checkout develop
    git pull origin develop
    ```

3.  **Crear una nueva rama para tu tarea:**
    Crea una nueva rama a partir de `develop` para trabajar en tu nueva funcionalidad o corrección. recuerda **utilizar el boton create branch desde la tarea**, la misma te traera una tarea `{numero}-{nombre-de-tarea}`.
    ```bash
    git checkout -b feature/mi-nueva-funcionalidad
    ```

4.  **Desarrollar y confirmar cambios (commit):**
    Realiza los cambios necesarios en el código. Una vez que hayas finalizado, confirma tus cambios con un mensaje claro y descriptivo.
    ```bash
    git add .
    git commit -m "feat: se agrega la funcionalidad X"
    ```

5.  **Subir los cambios al repositorio remoto:**
    Sube tu rama al repositorio remoto para que otros puedan ver tus cambios.
    ```bash
    git push origin feature/mi-nueva-funcionalidad
    ```

6.  **Crear un Pull Request (PR):**
    *   Ve al repositorio en GitHub.
    *   Aparecerá un mensaje para crear un Pull Request desde tu rama hacia `develop`.
    *   Haz clic en "Compare & pull request".
    *   Añade un título y una descripción detallada de los cambios realizados.
    *   Asigna a uno o más revisores para que evalúen tu código.

7.  **Revisión de código y fusión (merge):**
    *   Los revisores verificarán tu código y podrán solicitar cambios.
    *   Una vez que el Pull Request sea aprobado, se podrá fusionar con la rama `develop`.

8.  **Mantener la rama `develop` actualizada:**
    Antes de comenzar una nueva tarea, es una buena práctica actualizar tu rama `develop` local.
    ```bash
    git checkout develop
    git pull origin develop
    ```
# Kimani Footer Module v2

Módulo autocontenido del Footer de Kimani para proyectos Next.js con conexión real a la API.

## Cambios en v2

- ✅ Conexión real a la API de Kimani (`/users/@me`)
- ✅ Carga automática del usuario al montar el Footer
- ✅ Soporte para avatares desde Autumn server
- ✅ Indicador de estado online/offline funcional
- ✅ Manejo de tokens desde URL (para webviews nativos)

## Estructura

```
kimani-footer-module/
├── components/
│   ├── Footer.tsx          # Componente principal
│   ├── Footer.module.scss  # Estilos
│   └── UserIcon.tsx        # Avatar con estado
├── stores/
│   └── userStore.ts        # Estado + API calls (zustand)
└── index.ts                # Exportaciones
```

## Instalación

### 1. Copiar archivos

```bash
cp -r kimani-footer-module src/kimani-footer-module
```

### 2. Variables de entorno (opcional)

Si necesitas URLs diferentes a las de producción, añade a `.env.local`:

```env
NEXT_PUBLIC_KIMANI_BASE_URL=https://community.kimanilife.com
NEXT_PUBLIC_KIMANI_API_URL=https://community.kimanilife.com/api
NEXT_PUBLIC_KIMANI_AUTUMN_URL=https://community.kimanilife.com/autumn
NEXT_PUBLIC_KIMANI_SERVER_ID=01HP41709DFJP1DRSTSA88J81A
```

### 3. Dependencias requeridas

Ya las tienes en tu proyecto:

- `zustand` ✅
- `@heroicons/react` ✅
- `sass` ✅

## Uso

### Básico

```tsx
import { Footer } from "@/kimani-footer-module";

export default function Page() {
	return (
		<div className="pb-20">
			{/* tu contenido */}
			<Footer />
		</div>
	);
}
```

El Footer automáticamente:

1. Detecta el token en URL (`?token=xxx`) o localStorage
2. Llama a la API para obtener el usuario
3. Muestra el avatar y estado

### Acceder al usuario en otros componentes

```tsx
import { useUserStore } from "@/kimani-footer-module";

function MyComponent() {
	const user = useUserStore((state) => state.user);
	const isAdmin = useUserStore((state) => state.isAdmin);

	if (!user) return <p>No logueado</p>;

	return <p>Hola, {user.displayName || user.username}</p>;
}
```

### Forzar recarga del usuario

```tsx
import { useUserStore } from "@/kimani-footer-module";

function RefreshButton() {
	const fetchUser = useUserStore((state) => state.fetchUser);

	return <button onClick={() => fetchUser()}>Actualizar</button>;
}
```

## Cómo funciona la autenticación

1. **Desde URL (webviews nativos)**: Lee `?token=xxx&native=https://...`
2. **Desde localStorage**: Usa el token guardado previamente
3. **Llamada API**: `GET /users/@me` con header `X-Session-Token`

## Flujo del token

```
URL params (?token=xxx)
    ↓
localStorage.setItem('token', xxx)
    ↓
fetch('/users/@me', { headers: { 'X-Session-Token': xxx }})
    ↓
useUserStore.user = respuesta
    ↓
Footer muestra avatar + estado
```

## Troubleshooting

### El avatar no carga

- Verifica que `NEXT_PUBLIC_KIMANI_AUTUMN_URL` sea correcto
- El usuario debe tener un `avatar` en su perfil

### Estado siempre gris

- El usuario debe tener `online: true` en la respuesta de la API
- Verifica que `status.presence` esté configurado

### No detecta el usuario

- Abre DevTools > Application > localStorage > busca `token`
- Si no hay token, el usuario no está logueado
- Prueba añadiendo `?token=TU_TOKEN` a la URL para testing

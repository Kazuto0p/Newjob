import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
import { UserProvider } from './UserContext.jsx'

const onRedirectCallback = (appState) => {
  window.history.replaceState({}, document.title, appState?.returnTo || "/");
};

createRoot(document.getElementById('root')).render(
  <Auth0Provider
    domain="dev-jualdgdxsldqmwm3.us.auth0.com"
    clientId="zCYOqOnq8GfzctlNsk2YNxBZKS7srqEk"
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: "https://job-platform.api",
      scope: "openid profile email offline_access",
    }}
    useRefreshTokens={true}
    cacheLocation="localstorage"
    onRedirectCallback={onRedirectCallback}
  >
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </Auth0Provider>
)

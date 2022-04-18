import "./styles/global.scss"
import "./styles/typography.scss"

import { StrictMode } from "react"

import ReactDOM from "react-dom"
import { BrowserRouter } from "react-router-dom"
import { RecoilRoot } from "recoil"

import App from "./App"
import ENV from "./env-vars"
import { startMirage } from "./mirage"

if (ENV.MIRAGE === `true`) {
  startMirage({ environment: `development` })
}

ReactDOM.render(
  <StrictMode>
    <BrowserRouter>
      <RecoilRoot>
        <App />
      </RecoilRoot>
    </BrowserRouter>
  </StrictMode>,
  document.getElementById(`root`),
)

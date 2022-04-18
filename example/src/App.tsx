import type { FC } from "react"

import { Routes, Route, Outlet, Link } from "react-router-dom"

import Header from "./components/Header"
import ErrorBoundary from "./ErrorBoundary"
import { Envelopes } from "./routes/envelopes"
import SplashPage from "./routes/index"
import { Templates } from "./routes/templates/"
import { TemplatePage } from "./routes/templates/$templateId"
import RecoilInspector from "./util/recoil/DebugInspector"

const App: FC = () => {
  return (
    <ErrorBoundary>
      <AppContainer>
        <Routes>
          <Route path="/" element={<OuterLayout />}>
            <Route index element={<SplashPage />} />
            <Route path="/templates" element={<Templates />}>
              <Route path=":templateId" element={<TemplatePage />} />
            </Route>
            <Route path="/envelopes" element={<Envelopes />}>
              <Route path=":envelopeId" element={<NoMatch />} />
            </Route>
            <Route path="*" element={<NoMatch />} />
          </Route>
        </Routes>
        <RecoilInspector />
      </AppContainer>
    </ErrorBoundary>
  )
}

function OuterLayout() {
  {
    /* A "layout route" is a good place to put markup you want to
      share across all the pages on your site, like navigation. 
      An <Outlet> renders whatever child route is currently active,
      so you can think about this <Outlet> as a placeholder for
      the child routes we defined above. */
  }
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  )
}

export default App

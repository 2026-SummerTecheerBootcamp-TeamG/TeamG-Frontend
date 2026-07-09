import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Element } from './screens/Element/Element.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Element />
  </StrictMode>,
);

import { type HealthResponse } from '@email-automation-engine/shared';

const apiHealth: HealthResponse = {
  status: 'ok',
  service: 'web',
};

export function App() {
  return (
    <main>
      <h1>Email Automation Engine</h1>
      <p>{apiHealth.service} app scaffold ready.</p>
    </main>
  );
}

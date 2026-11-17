import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost/api/v1';

export default function () {
  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health 200': (r) => r.status === 200 });

  const login = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: 'aigul.nurova@demo.edu',
      password: __ENV.SEED_STUDENT_PASSWORD || 'DemoStudent123!',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(login, { 'login ok or throttled': (r) => r.status === 200 || r.status === 429 });

  if (login.status === 200) {
    const sch = http.get(`${BASE_URL}/schedule`);
    check(sch, { 'schedule 200': (r) => r.status === 200 });
  }

  sleep(0.5);
}

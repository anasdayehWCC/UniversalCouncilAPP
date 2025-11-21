import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 20,
  duration: '5m',
}

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:8080'
  const res = http.get(`${base}/api/healthcheck`)
  check(res, { 'status is 200': (r) => r.status === 200 })
  sleep(1)
}

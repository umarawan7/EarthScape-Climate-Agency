import { apiRequest } from './api';

export const ingestService = {
  upload(token, sourceName, file) {
    const form = new FormData();
    form.append('source_name', sourceName);
    form.append('file', file);
    return apiRequest('/ingest/upload', { method: 'POST', token, body: form, isFormData: true });
  },
  schedule(token, sourceName, intervalMinutes) {
    return apiRequest('/ingest/schedule', {
      method: 'POST',
      token,
      body: { source_name: sourceName, interval_minutes: intervalMinutes },
    });
  },
  history(token) {
    return apiRequest('/ingest/history', { token });
  },
  schedules(token) {
    return apiRequest('/ingest/schedules', { token });
  },
};

export const sparkService = {
  runJob(token, jobName, inputPath = null) {
    return apiRequest('/spark/run-job', {
      method: 'POST',
      token,
      body: { job_name: jobName, input_path: inputPath },
    });
  },
  jobs(token) {
    return apiRequest('/spark/jobs', { token });
  },
  loadProcessed(token, jobId) {
    return apiRequest(`/spark/load-processed/${jobId}`, {
      method: 'POST',
      token,
    });
  },
};


export const alertService = {
  list(token, params = {}) {
    const query = new URLSearchParams();
    if (params.severity) query.set('severity', params.severity);
    if (params.region) query.set('region', params.region);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/alerts${suffix}`, { token });
  },
  configure(token, payload) {
    return apiRequest('/alerts/configure', { method: 'POST', token, body: payload });
  },
  acknowledge(token, alertId) {
    return apiRequest(`/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
      token,
      body: { acknowledged: true },
    });
  },
};

export const supportService = {
  create(token, payload) {
    return apiRequest('/support/ticket', { method: 'POST', token, body: payload });
  },
  list(token) {
    return apiRequest('/support/tickets', { token });
  },
  update(token, ticketId, payload) {
    return apiRequest(`/support/tickets/${ticketId}`, {
      method: 'PATCH',
      token,
      body: payload,
    });
  },
};

export const userService = {
  list(token) {
    return apiRequest('/users', { token });
  },
  updateRole(token, userId, role) {
    return apiRequest(`/users/${userId}/role`, {
      method: 'PATCH',
      token,
      body: { role },
    });
  },
  remove(token, userId) {
    return apiRequest(`/users/${userId}`, { method: 'DELETE', token });
  },
  register(token, payload) {
    return apiRequest('/auth/register', { method: 'POST', token, body: payload });
  },
  updateProfile(token, payload) {
    return apiRequest('/users/profile', { method: 'PATCH', token, body: payload });
  },
};

export const mlService = {
  models(token) {
    return apiRequest('/ml/models', { token });
  },
  predict(token, payload) {
    return apiRequest('/ml/predict', { method: 'POST', token, body: payload });
  },
  forecast(token, payload) {
    return apiRequest('/ml/forecast', { method: 'POST', token, body: payload });
  },
  forecastBatch(token, payload) {
    return apiRequest('/ml/forecast-batch', { method: 'POST', token, body: payload });
  },
  liveWeather(token, payload) {
    return apiRequest('/ml/live-weather', { method: 'POST', token, body: payload });
  },
  cityToCoordinates(token, city) {
    return apiRequest(`/ml/city-to-coordinates?city=${encodeURIComponent(city)}`, { token });
  },
};

export const climateService = {
  records(token) {
    return apiRequest('/climate/records', { token });
  },
  anomalies(token) {
    return apiRequest('/climate/anomalies', { token });
  },
  predictions(token) {
    return apiRequest('/climate/predictions', { token });
  },
};

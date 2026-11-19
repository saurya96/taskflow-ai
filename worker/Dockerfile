# syntax=docker/dockerfile:1

FROM python:3.12-slim AS builder
WORKDIR /build
COPY worker/requirements.txt ./
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim AS runtime
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"
WORKDIR /app
RUN groupadd --system taskflow && useradd --system --gid taskflow --home /app taskflow
COPY --from=builder --chown=taskflow:taskflow /opt/venv /opt/venv
COPY --chown=taskflow:taskflow worker/taskflow_worker ./taskflow_worker
USER taskflow
CMD ["python", "taskflow_worker/worker.py"]
